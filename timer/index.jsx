import React, { useState, useEffect, useRef } from 'react';

// スライムコンポーネント（目付き）
const Slime = ({ x, y, size }) => {
  const [position, setPosition] = useState({ x, y });
  const [velocity] = useState({
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5
  });
  const velocityRef = useRef(velocity);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(prev => {
        let newX = prev.x + velocityRef.current.vx;
        let newY = prev.y + velocityRef.current.vy;

        if (newX < 0 || newX > window.innerWidth - size) {
          velocityRef.current.vx = -velocityRef.current.vx;
          newX = Math.max(0, Math.min(newX, window.innerWidth - size));
        }
        if (newY < 0 || newY > window.innerHeight - size) {
          velocityRef.current.vy = -velocityRef.current.vy;
          newY = Math.max(0, Math.min(newY, window.innerHeight - size));
        }

        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [size]);

  return (
    <svg
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 2}
        fill="var(--fg)"
        opacity="0.12"
      />
      <ellipse
        cx={size * 0.35}
        cy={size * 0.4}
        rx={size * 0.08}
        ry={size * 0.12}
        fill="var(--bg)"
        opacity="0.9"
      />
      <ellipse
        cx={size * 0.65}
        cy={size * 0.4}
        rx={size * 0.08}
        ry={size * 0.12}
        fill="var(--bg)"
        opacity="0.9"
      />
    </svg>
  );
};

// スライム管理コンポーネント
const SlimeManager = ({ totalSeconds }) => {
  const [slimes, setSlimes] = useState([
    { id: 1, x: Math.random() * 300 + 100, y: Math.random() * 300 + 100, size: 60 }
  ]);
  const lastDivisionRef = useRef(0);

  useEffect(() => {
    const divisionInterval = 10;
    const currentDivisionCount = Math.floor(totalSeconds / divisionInterval);
    
    if (currentDivisionCount > lastDivisionRef.current && slimes.length < 200) {
      lastDivisionRef.current = currentDivisionCount;
      
      const newSlime = {
        id: Date.now() + Math.random(),
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 100),
        size: 30 + Math.random() * 50
      };
      
      setSlimes(prev => [...prev, newSlime]);
    }
  }, [totalSeconds, slimes.length]);

  return (
    <>
      {slimes.map(slime => (
        <Slime key={slime.id} {...slime} />
      ))}
    </>
  );
};

// 世界時計コンポーネント
const WorldClock = ({ clock, onDelete }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeInTimezone = () => {
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: clock.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(time);
  };

  const getDateInTimezone = () => {
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: clock.timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(time);
  };

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--fg)',
      padding: '2rem',
      position: 'relative',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <button
        onClick={() => onDelete(clock.id)}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'none',
          border: 'none',
          color: 'var(--fg)',
          cursor: 'pointer',
          opacity: 0.5,
          fontSize: '0.875rem',
          transition: 'opacity 0.3s ease'
        }}
      >
        ✕
      </button>
      
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        opacity: 0.5,
        marginBottom: '0.5rem'
      }}>
        {clock.label}
      </div>
      
      <div style={{
        fontFamily: "'Archivo Black', sans-serif",
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        letterSpacing: '-0.02em',
        lineHeight: 1
      }}>
        {getTimeInTimezone()}
      </div>
      
      <div style={{
        fontSize: '0.75rem',
        opacity: 0.5,
        marginTop: '0.5rem',
        letterSpacing: '0.1em'
      }}>
        {getDateInTimezone()}
      </div>
    </div>
  );
};

// 時間ピッカーコンポーネント（直接入力対応）
const TimePicker = ({ value, onChange, max, label }) => {
  const [inputValue, setInputValue] = useState(value.toString().padStart(2, '0'));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString().padStart(2, '0'));
    }
  }, [value, isFocused]);

  const increment = () => onChange(value >= max ? 0 : value + 1);
  const decrement = () => onChange(value <= 0 ? max : value - 1);

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setInputValue(val);
  };

  const handleBlur = () => {
    setIsFocused(false);
    let num = parseInt(inputValue, 10) || 0;
    if (num > max) num = max;
    if (num < 0) num = 0;
    onChange(num);
    setInputValue(num.toString().padStart(2, '0'));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <button
        onClick={increment}
        style={{
          width: '100%',
          padding: '0.5rem',
          background: 'transparent',
          border: '1px solid var(--fg)',
          borderBottom: 'none',
          color: 'var(--fg)',
          cursor: 'pointer',
          opacity: 0.4,
          transition: 'opacity 0.3s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
        onMouseLeave={(e) => e.target.style.opacity = '0.4'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
      
      <input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          width: '60px',
          padding: '0.75rem 0.5rem',
          border: '1px solid var(--fg)',
          background: isFocused ? 'var(--bg)' : 'var(--fg)',
          color: isFocused ? 'var(--fg)' : 'var(--bg)',
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: '1.5rem',
          textAlign: 'center',
          letterSpacing: '-0.02em',
          transition: 'all 0.3s ease',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
      
      <button
        onClick={decrement}
        style={{
          width: '100%',
          padding: '0.5rem',
          background: 'transparent',
          border: '1px solid var(--fg)',
          borderTop: 'none',
          color: 'var(--fg)',
          cursor: 'pointer',
          opacity: 0.4,
          transition: 'opacity 0.3s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
        onMouseLeave={(e) => e.target.style.opacity = '0.4'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      
      <div style={{
        fontSize: '0.6rem',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        opacity: 0.4,
        marginTop: '0.25rem'
      }}>
        {label}
      </div>
    </div>
  );
};

// フェードイン/アウト用のラッパーコンポーネント
const FadeTransition = ({ show, children }) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
  }, [show]);

  const handleTransitionEnd = () => {
    if (!show) setShouldRender(false);
  };

  if (!shouldRender) return null;

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease'
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
};

// タイマーカード
const TimerCard = ({ timer, onUpdate, onDelete, onStart, onPause, onReset }) => {
  const [editMode, setEditMode] = useState(false);
  const [hours, setHours] = useState(Math.floor(timer.initialTime / 3600));
  const [minutes, setMinutes] = useState(Math.floor((timer.initialTime % 3600) / 60));
  const [seconds, setSeconds] = useState(timer.initialTime % 60);
  const [quickInput, setQuickInput] = useState('');

  // タイマーが動き始めたらeditModeを閉じる
  useEffect(() => {
    if (timer.isRunning && editMode) {
      setEditMode(false);
    }
  }, [timer.isRunning, editMode]);

  const progress = timer.initialTime > 0 
    ? ((timer.initialTime - timer.time) / timer.initialTime) * 100 
    : 0;

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const applyCustomTime = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds > 0) {
      onUpdate(timer.id, { time: totalSeconds, initialTime: totalSeconds });
    }
    setEditMode(false);
  };

  const handlePresetClick = (mins) => {
    const totalSeconds = mins * 60;
    onUpdate(timer.id, { time: totalSeconds, initialTime: totalSeconds });
    setHours(0);
    setMinutes(mins);
    setSeconds(0);
    setEditMode(false);
  };

  // クイック入力のパース（例: "15" → 15分, "1:30" → 1時間30分, "90s" → 90秒）
  const parseQuickInput = (input) => {
    const trimmed = input.trim().toLowerCase();
    
    // "1:30:00" や "1:30" 形式
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':').map(p => parseInt(p, 10) || 0);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
    }
    
    // "90s", "90sec" 形式（秒）
    if (trimmed.endsWith('s') || trimmed.endsWith('sec')) {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) return num;
    }
    
    // "1h", "1hr" 形式（時間）
    if (trimmed.endsWith('h') || trimmed.endsWith('hr')) {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) return Math.round(num * 3600);
    }
    
    // "1.5h" のような小数も対応
    if (trimmed.match(/^\d+\.?\d*h/)) {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) return Math.round(num * 3600);
    }
    
    // 数字のみ（分として扱う）
    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
      return Math.round(num * 60);
    }
    
    return null;
  };

  const handleQuickInputSubmit = () => {
    const totalSeconds = parseQuickInput(quickInput);
    if (totalSeconds && totalSeconds > 0) {
      onUpdate(timer.id, { time: totalSeconds, initialTime: totalSeconds });
      setHours(Math.floor(totalSeconds / 3600));
      setMinutes(Math.floor((totalSeconds % 3600) / 60));
      setSeconds(totalSeconds % 60);
      setQuickInput('');
    }
  };

  const handleQuickInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleQuickInputSubmit();
    }
  };

  const presetValues = [1, 5, 10, 25, 60];

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--fg)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '2px',
        width: `${progress}%`,
        background: 'var(--fg)',
        transition: 'width 1s linear, background 0.5s ease'
      }} />
      
      <input
        type="text"
        value={timer.name}
        onChange={(e) => onUpdate(timer.id, { name: e.target.value })}
        style={{
          border: 'none',
          borderBottom: '1px solid var(--fg)',
          fontSize: '0.75rem',
          fontFamily: "'Instrument Sans', sans-serif",
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          width: '100%',
          marginBottom: '1.5rem',
          padding: '0.5rem 0',
          background: 'transparent',
          color: 'var(--fg)',
          outline: 'none',
          opacity: 0.7,
          transition: 'all 0.5s ease'
        }}
        placeholder="TIMER NAME"
      />
      
      {/* 時間設定モード */}
      <div style={{
        opacity: editMode && !timer.isRunning ? 1 : 0,
        maxHeight: editMode && !timer.isRunning ? '300px' : '0',
        overflow: 'hidden',
        transition: 'opacity 0.4s ease, max-height 0.4s ease',
        marginBottom: editMode && !timer.isRunning ? '1.5rem' : 0
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          paddingTop: '0.5rem'
        }}>
          <TimePicker value={hours} onChange={setHours} max={23} label="hours" />
          <div style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: '1.5rem',
            paddingTop: '2.25rem',
            opacity: 0.3
          }}>:</div>
          <TimePicker value={minutes} onChange={setMinutes} max={59} label="min" />
          <div style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: '1.5rem',
            paddingTop: '2.25rem',
            opacity: 0.3
          }}>:</div>
          <TimePicker value={seconds} onChange={setSeconds} max={59} label="sec" />
        </div>
        
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={applyCustomTime}
            style={{
              padding: '0.75rem 2rem',
              border: '1px solid var(--fg)',
              background: 'var(--fg)',
              color: 'var(--bg)',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontWeight: 500,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease'
            }}
          >
            Apply
          </button>
          <button
            onClick={() => setEditMode(false)}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid var(--fg)',
              background: 'transparent',
              color: 'var(--fg)',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontWeight: 500,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              opacity: 0.6,
              transition: 'all 0.3s ease'
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* 通常表示モード */}
      <div style={{
        opacity: !editMode || timer.isRunning ? 1 : 0,
        maxHeight: !editMode || timer.isRunning ? '500px' : '0',
        overflow: 'hidden',
        transition: 'opacity 0.4s ease, max-height 0.4s ease'
      }}>
        <div 
          onClick={() => !timer.isRunning && setEditMode(true)}
          style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            margin: '1.5rem 0',
            lineHeight: 1,
            cursor: timer.isRunning ? 'default' : 'pointer',
            transition: 'opacity 0.3s ease'
          }}
        >
          {formatTime(timer.time)}
        </div>
        
        {/* プリセットボタン */}
        <div style={{
          opacity: !timer.isRunning ? 1 : 0,
          maxHeight: !timer.isRunning ? '100px' : '0',
          overflow: 'hidden',
          transition: 'opacity 0.4s ease, max-height 0.4s ease'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {presetValues.map(min => (
              <button
                key={min}
                onClick={() => handlePresetClick(min)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--fg)',
                  background: timer.initialTime === min * 60 ? 'var(--fg)' : 'transparent',
                  color: timer.initialTime === min * 60 ? 'var(--bg)' : 'var(--fg)',
                  cursor: 'pointer',
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  transition: 'all 0.3s ease'
                }}
              >
                {min}M
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button
              onClick={() => setEditMode(true)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--fg)',
                cursor: 'pointer',
                opacity: 0.5,
                padding: '0.5rem',
                transition: 'opacity 0.3s ease'
              }}
            >
              ⚙ Custom
            </button>
          </div>

          {/* クイック入力フィールド */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={handleQuickInputKeyDown}
              placeholder="15, 1:30, 90s..."
              style={{
                width: '120px',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--fg)',
                background: 'transparent',
                color: 'var(--fg)',
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: '0.75rem',
                outline: 'none',
                opacity: 0.7,
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.opacity = '1'}
              onBlur={(e) => e.target.style.opacity = '0.7'}
            />
            <button
              onClick={handleQuickInputSubmit}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--fg)',
                background: quickInput ? 'var(--fg)' : 'transparent',
                color: quickInput ? 'var(--bg)' : 'var(--fg)',
                cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                opacity: quickInput ? 1 : 0.5
              }}
            >
              Set
            </button>
          </div>
          
          <div style={{
            fontSize: '0.6rem',
            textAlign: 'center',
            opacity: 0.4,
            marginBottom: '1rem'
          }}>
            分で入力（例: 15 → 15分、1:30 → 1分30秒、90s → 90秒、1.5h → 1.5時間）
          </div>
        </div>
        
        {/* コントロールボタン */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => timer.isRunning ? onPause(timer.id) : onStart(timer.id)}
            style={{
              padding: '0.75rem 2rem',
              border: '1px solid var(--fg)',
              background: timer.isRunning ? 'transparent' : 'var(--fg)',
              color: timer.isRunning ? 'var(--fg)' : 'var(--bg)',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontWeight: 500,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease'
            }}
          >
            {timer.isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={() => onReset(timer.id)}
            style={{
              padding: '0.75rem 1.25rem',
              border: '1px solid var(--fg)',
              background: 'transparent',
              color: 'var(--fg)',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              transition: 'all 0.3s ease'
            }}
          >
            ↺
          </button>
          <button
            onClick={() => onDelete(timer.id)}
            style={{
              padding: '0.75rem 1.25rem',
              border: '1px solid var(--fg)',
              background: 'transparent',
              color: 'var(--fg)',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: '0.75rem',
              opacity: 0.5,
              transition: 'all 0.3s ease'
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

// ストップウォッチ
const Stopwatch = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const addLap = () => {
    const prevTotal = laps.length > 0 ? laps[laps.length - 1].total : 0;
    setLaps([...laps, { total: time, split: time - prevTotal }]);
  };

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--fg)',
      padding: '2.5rem',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        fontFamily: "'Archivo Black', sans-serif",
        fontSize: 'clamp(3rem, 10vw, 6rem)',
        textAlign: 'center',
        letterSpacing: '-0.02em',
        margin: '2rem 0',
        lineHeight: 1
      }}>
        {formatTime(time)}
      </div>
      
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            padding: '1rem 2.5rem',
            border: '1px solid var(--fg)',
            background: isRunning ? 'transparent' : 'var(--fg)',
            color: isRunning ? 'var(--fg)' : 'var(--bg)',
            cursor: 'pointer',
            fontFamily: "'Instrument Sans', sans-serif",
            fontWeight: 500,
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease'
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <div style={{
          opacity: isRunning ? 1 : 0,
          transform: isRunning ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: isRunning ? 'auto' : 'none'
        }}>
          <button
            onClick={addLap}
            style={{
              padding: '1rem 2rem',
              border: '1px solid var(--fg)',
              background: 'var(--fg)',
              color: 'var(--bg)',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontWeight: 500,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease'
            }}
          >
            Lap
          </button>
        </div>
        <div style={{
          opacity: !isRunning && time > 0 ? 1 : 0,
          transform: !isRunning && time > 0 ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: !isRunning && time > 0 ? 'auto' : 'none'
        }}>
          <button
            onClick={() => { setTime(0); setLaps([]); }}
            style={{
              padding: '1rem 2rem',
              border: '1px solid var(--fg)',
              background: 'transparent',
              color: 'var(--fg)',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontWeight: 500,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease'
            }}
          >
            Reset
          </button>
        </div>
      </div>
      
      <div style={{
        opacity: laps.length > 0 ? 1 : 0,
        maxHeight: laps.length > 0 ? '300px' : '0',
        overflow: 'hidden',
        transition: 'opacity 0.4s ease, max-height 0.4s ease'
      }}>
        <div style={{
          borderTop: '1px solid var(--fg)',
          paddingTop: '1.5rem',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {laps.map((lap, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 2fr',
              gap: '1rem',
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: '0.875rem',
              padding: '0.75rem 0',
              borderBottom: '1px solid var(--fg)',
              opacity: 0.8,
              animation: 'fadeIn 0.3s ease'
            }}>
              <span style={{ 
                fontWeight: 500, 
                letterSpacing: '0.1em',
                opacity: 0.5 
              }}>
                LAP {(index + 1).toString().padStart(2, '0')}
              </span>
              <span style={{ textAlign: 'right', fontWeight: 500 }}>
                {formatTime(lap.split)}
              </span>
              <span style={{ textAlign: 'right', opacity: 0.5 }}>
                {formatTime(lap.total)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ポモドーロ
const Pomodoro = () => {
  const [mode, setMode] = useState('work');
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [settings, setSettings] = useState({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsBeforeLong: 4
  });
  const [showSettings, setShowSettings] = useState(false);

  const modes = {
    work: { label: 'Work', time: settings.work * 60 },
    shortBreak: { label: 'Short Break', time: settings.shortBreak * 60 },
    longBreak: { label: 'Long Break', time: settings.longBreak * 60 }
  };

  useEffect(() => {
    let interval;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(prev => prev - 1);
      }, 1000);
    } else if (time === 0 && isRunning) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      } catch (e) {}
      
      if (mode === 'work') {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        if (newSessions % settings.sessionsBeforeLong === 0) {
          setMode('longBreak');
          setTime(settings.longBreak * 60);
        } else {
          setMode('shortBreak');
          setTime(settings.shortBreak * 60);
        }
      } else {
        setMode('work');
        setTime(settings.work * 60);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, time, mode, sessions, settings]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentModeTime = modes[mode].time;
  const progress = ((currentModeTime - time) / currentModeTime) * 100;
  const circumference = 2 * Math.PI * 120;

  const updateSetting = (key, value) => {
    const newValue = Math.max(1, Math.min(120, parseInt(value) || 1));
    setSettings(prev => ({ ...prev, [key]: newValue }));
    if (key === mode || (key === 'work' && mode === 'work') || 
        (key === 'shortBreak' && mode === 'shortBreak') || 
        (key === 'longBreak' && mode === 'longBreak')) {
      setTime(newValue * 60);
    }
  };

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--fg)',
      padding: '2.5rem',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0',
          border: '1px solid var(--fg)',
          flex: 1
        }}>
          {Object.entries(modes).map(([key, value], idx, arr) => (
            <button
              key={key}
              onClick={() => {
                setMode(key);
                setTime(value.time);
                setIsRunning(false);
              }}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                borderRight: idx !== arr.length - 1 ? '1px solid var(--fg)' : 'none',
                background: mode === key ? 'var(--fg)' : 'transparent',
                color: mode === key ? 'var(--bg)' : 'var(--fg)',
                cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
                fontWeight: 500,
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease'
              }}
            >
              {value.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            marginLeft: '1rem',
            padding: '1rem',
            border: '1px solid var(--fg)',
            background: showSettings ? 'var(--fg)' : 'transparent',
            color: showSettings ? 'var(--bg)' : 'var(--fg)',
            cursor: 'pointer',
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: '0.875rem',
            transition: 'all 0.3s ease'
          }}
        >
          ⚙
        </button>
      </div>

      <div style={{
        opacity: showSettings ? 1 : 0,
        maxHeight: showSettings ? '200px' : '0',
        overflow: 'hidden',
        transition: 'opacity 0.4s ease, max-height 0.4s ease',
        marginBottom: showSettings ? '2rem' : 0
      }}>
        <div style={{
          padding: '1.5rem',
          border: '1px solid var(--fg)',
          background: 'var(--bg)'
        }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: 0.5,
            marginBottom: '1rem'
          }}>
            Time Settings (minutes)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            {[
              { key: 'work', label: 'Work' },
              { key: 'shortBreak', label: 'Short' },
              { key: 'longBreak', label: 'Long' }
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.6,
                  marginBottom: '0.5rem'
                }}>
                  {label}
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings[key]}
                  onChange={(e) => updateSetting(key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--fg)',
                    background: 'transparent',
                    color: 'var(--fg)',
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: '1rem',
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{
        position: 'relative',
        width: '260px',
        height: '260px',
        margin: '0 auto 2rem'
      }}>
        <svg width="260" height="260" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="var(--fg)"
            strokeWidth="1"
            opacity="0.2"
          />
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="var(--fg)"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: 'clamp(2.5rem, 8vw, 4rem)',
          letterSpacing: '-0.02em',
          lineHeight: 1
        }}>
          {formatTime(time)}
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            padding: '1rem 3rem',
            border: '1px solid var(--fg)',
            background: isRunning ? 'transparent' : 'var(--fg)',
            color: isRunning ? 'var(--fg)' : 'var(--bg)',
            cursor: 'pointer',
            fontFamily: "'Instrument Sans', sans-serif",
            fontWeight: 500,
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease'
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => {
            setTime(modes[mode].time);
            setIsRunning(false);
          }}
          style={{
            padding: '1rem 1.5rem',
            border: '1px solid var(--fg)',
            background: 'transparent',
            color: 'var(--fg)',
            cursor: 'pointer',
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: '0.875rem',
            transition: 'all 0.3s ease'
          }}
        >
          ↺
        </button>
      </div>
      
      <div style={{
        textAlign: 'center',
        fontFamily: "'Instrument Sans', sans-serif"
      }}>
        <div style={{
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          opacity: 0.5,
          marginBottom: '0.75rem'
        }}>
          Sessions Completed
        </div>
        <div style={{
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: '2rem'
        }}>
          {sessions}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '1rem'
        }}>
          {[...Array(settings.sessionsBeforeLong)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                border: '1px solid var(--fg)',
                background: i < (sessions % settings.sessionsBeforeLong) ? 'var(--fg)' : 'transparent',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// タイムゾーン選択モーダル
const TimezoneModal = ({ onSelect, onClose }) => {
  const timezones = [
    { label: 'Tokyo', timezone: 'Asia/Tokyo' },
    { label: 'New York', timezone: 'America/New_York' },
    { label: 'Los Angeles', timezone: 'America/Los_Angeles' },
    { label: 'London', timezone: 'Europe/London' },
    { label: 'Paris', timezone: 'Europe/Paris' },
    { label: 'Berlin', timezone: 'Europe/Berlin' },
    { label: 'Sydney', timezone: 'Australia/Sydney' },
    { label: 'Singapore', timezone: 'Asia/Singapore' },
    { label: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
    { label: 'Dubai', timezone: 'Asia/Dubai' },
    { label: 'São Paulo', timezone: 'America/Sao_Paulo' },
    { label: 'Mumbai', timezone: 'Asia/Kolkata' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeInBg 0.3s ease forwards'
    }} onClick={onClose}>
      <style>{`
        @keyframes fadeInBg {
          to { background: rgba(0,0,0,0.5); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--fg)',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        maxHeight: '70vh',
        overflowY: 'auto',
        animation: 'slideUp 0.4s ease'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '1.5rem',
          opacity: 0.5
        }}>
          Select Timezone
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {timezones.map((tz, index) => (
            <button
              key={tz.timezone}
              onClick={() => onSelect(tz)}
              style={{
                padding: '1rem',
                border: '1px solid var(--fg)',
                background: 'transparent',
                color: 'var(--fg)',
                cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: '0.875rem',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                animation: `slideUp 0.3s ease ${index * 0.03}s both`
              }}
            >
              {tz.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// メインアプリ
export default function TimerApp() {
  const [theme, setTheme] = useState('');
  const [activeTab, setActiveTab] = useState('clock');
  const [timers, setTimers] = useState([
    { id: 1, name: 'Timer 1', time: 300, initialTime: 300, isRunning: false }
  ]);
  const [clocks, setClocks] = useState([
    { id: 1, label: 'Tokyo', timezone: 'Asia/Tokyo' },
    { id: 2, label: 'New York', timezone: 'America/New_York' }
  ]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (timer.isRunning && timer.time > 0) {
          const newTime = timer.time - 1;
          if (newTime === 0) {
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 1);
            } catch (e) {}
          }
          return { ...timer, time: newTime };
        }
        return timer;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const slimeCount = Math.min(Math.floor(totalSeconds / 10) + 1, 200);
  const anyRunning = timers.some(t => t.isRunning);

  const addTimer = () => {
    setTimers([...timers, {
      id: Date.now(),
      name: `Timer ${timers.length + 1}`,
      time: 300,
      initialTime: 300,
      isRunning: false
    }]);
  };

  const updateTimer = (id, updates) => {
    setTimers(timers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTimer = (id) => {
    if (timers.length > 1) {
      setTimers(timers.filter(t => t.id !== id));
    }
  };

  const startTimer = (id) => {
    setTimers(timers.map(t => t.id === id ? { ...t, isRunning: true } : t));
  };

  const pauseTimer = (id) => {
    setTimers(timers.map(t => t.id === id ? { ...t, isRunning: false } : t));
  };

  const resetTimer = (id) => {
    setTimers(timers.map(t => t.id === id ? { ...t, time: t.initialTime, isRunning: false } : t));
  };

  const startAllTimers = () => {
    setTimers(timers.map(t => ({ ...t, isRunning: true })));
  };

  const pauseAllTimers = () => {
    setTimers(timers.map(t => ({ ...t, isRunning: false })));
  };

  const resetAllTimers = () => {
    setTimers(timers.map(t => ({ ...t, time: t.initialTime, isRunning: false })));
  };

  const addClock = (tz) => {
    setClocks([...clocks, { id: Date.now(), ...tz }]);
    setShowTimezoneModal(false);
  };

  const deleteClock = (id) => {
    if (clocks.length > 1) {
      setClocks(clocks.filter(c => c.id !== id));
    }
  };

  const tabs = [
    { id: 'clock', label: 'Clock' },
    { id: 'timer', label: 'Timer' },
    { id: 'stopwatch', label: 'Stopwatch' },
    { id: 'pomodoro', label: 'Pomodoro' }
  ];

  return (
    <div 
      data-theme={theme}
      style={{
        '--bg': theme === 'inverted' ? '#0a0a0a' : '#fafafa',
        '--fg': theme === 'inverted' ? '#fafafa' : '#0a0a0a',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: "'Instrument Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.6s ease, color 0.6s ease'
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      
      <SlimeManager totalSeconds={totalSeconds} />
      
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--fg)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: '1.25rem',
          letterSpacing: '-0.02em'
        }}>
          SLIME TIMER
        </div>
        
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: '0.875rem',
          letterSpacing: '-0.02em',
          opacity: 0.6
        }}>
          {slimeCount} SLIMES
        </div>
        
        <a
          href="https://mamonis.studio/"
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: theme === 'inverted' ? '#aaa' : '#555',
            textDecoration: 'none',
            transition: 'color 0.3s ease'
          }}
        >
          MAMONIS
        </a>
      </header>
      
      {/* Tab Navigation */}
      <nav style={{
        position: 'fixed',
        top: '4.5rem',
        left: 0,
        right: 0,
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--fg)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--fg)',
                padding: '1rem 0',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                opacity: activeTab === tab.id ? 1 : 0.5,
                borderBottom: activeTab === tab.id ? '2px solid var(--fg)' : '2px solid transparent',
                marginBottom: '-1px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setTheme(theme === 'inverted' ? '' : 'inverted')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--fg)',
            padding: '1rem 0',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
            opacity: 0.5,
            borderBottom: '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          {theme === 'inverted' ? 'Light' : 'Dark'}
        </button>
      </nav>
      
      {/* Main Content */}
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10rem 2rem 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        {activeTab === 'clock' && (
          <div style={{ 
            width: '100%', 
            maxWidth: '1000px',
            animation: 'slideUp 0.5s ease'
          }}>
            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              {clocks.map(clock => (
                <WorldClock key={clock.id} clock={clock} onDelete={deleteClock} />
              ))}
            </div>
            
            <button
              onClick={() => setShowTimezoneModal(true)}
              style={{
                width: '100%',
                padding: '1.5rem',
                border: '1px dashed var(--fg)',
                background: 'transparent',
                color: 'var(--fg)',
                cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
                fontWeight: 500,
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                opacity: 0.5,
                transition: 'opacity 0.3s ease'
              }}
            >
              + Add Clock
            </button>
          </div>
        )}
        
        {activeTab === 'timer' && (
          <div style={{ 
            width: '100%', 
            maxWidth: '1000px',
            animation: 'slideUp 0.5s ease'
          }}>
            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            
            {/* 同時操作ボタン */}
            <div style={{
              opacity: timers.length > 1 ? 1 : 0,
              maxHeight: timers.length > 1 ? '100px' : '0',
              overflow: 'hidden',
              transition: 'opacity 0.4s ease, max-height 0.4s ease',
              marginBottom: timers.length > 1 ? '2rem' : 0
            }}>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                padding: '1.5rem',
                border: '1px solid var(--fg)',
                background: 'var(--bg)'
              }}>
                <button
                  onClick={anyRunning ? pauseAllTimers : startAllTimers}
                  style={{
                    padding: '0.75rem 2rem',
                    border: '1px solid var(--fg)',
                    background: anyRunning ? 'transparent' : 'var(--fg)',
                    color: anyRunning ? 'var(--fg)' : 'var(--bg)',
                    cursor: 'pointer',
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {anyRunning ? '■ Pause All' : '▶ Start All'}
                </button>
                <button
                  onClick={resetAllTimers}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--fg)',
                    background: 'transparent',
                    color: 'var(--fg)',
                    cursor: 'pointer',
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ↺ Reset All
                </button>
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              {timers.map(timer => (
                <TimerCard
                  key={timer.id}
                  timer={timer}
                  onUpdate={updateTimer}
                  onDelete={deleteTimer}
                  onStart={startTimer}
                  onPause={pauseTimer}
                  onReset={resetTimer}
                />
              ))}
            </div>
            
            <button
              onClick={addTimer}
              style={{
                width: '100%',
                padding: '1.5rem',
                border: '1px dashed var(--fg)',
                background: 'transparent',
                color: 'var(--fg)',
                cursor: 'pointer',
                fontFamily: "'Instrument Sans', sans-serif",
                fontWeight: 500,
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                opacity: 0.5,
                transition: 'opacity 0.3s ease'
              }}
            >
              + Add Timer
            </button>
          </div>
        )}
        
        {activeTab === 'stopwatch' && (
          <div style={{ 
            width: '100%', 
            maxWidth: '500px',
            animation: 'slideUp 0.5s ease'
          }}>
            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <Stopwatch />
          </div>
        )}
        
        {activeTab === 'pomodoro' && (
          <div style={{ 
            width: '100%', 
            maxWidth: '500px',
            animation: 'slideUp 0.5s ease'
          }}>
            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <Pomodoro />
          </div>
        )}
      </main>
      
      {showTimezoneModal && (
        <TimezoneModal 
          onSelect={addClock} 
          onClose={() => setShowTimezoneModal(false)} 
        />
      )}
    </div>
  );
}
