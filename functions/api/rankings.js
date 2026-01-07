// functions/api/rankings.js
// Cloudflare Pages Functions - ランキングAPI

export async function onRequestGet(context) {
  // KVからランキング取得
  const { env } = context;
  
  try {
    const data = await env.DIGTILE_KV.get('rankings', 'json');
    const rankings = data || [];
    
    return new Response(JSON.stringify({ rankings }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ rankings: [], error: e.message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  // ランキングにスコア追加
  const { env, request } = context;
  
  try {
    const body = await request.json();
    const { id, name, score, depth } = body;
    
    if (!id || !name || score === undefined) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 現在のランキング取得
    let rankings = await env.DIGTILE_KV.get('rankings', 'json') || [];
    
    // 新しいエントリ
    const entry = {
      id,
      name: name.substring(0, 12),
      score,
      depth,
      date: new Date().toISOString()
    };
    
    // 同じIDがあれば削除
    rankings = rankings.filter(r => r.id !== id);
    
    // 追加してソート
    rankings.push(entry);
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 100); // 上位100件
    
    // 保存
    await env.DIGTILE_KV.put('rankings', JSON.stringify(rankings));
    
    // 順位を返す
    const rank = rankings.findIndex(r => r.id === id) + 1;
    
    return new Response(JSON.stringify({ success: true, rank, rankings }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// CORS対応
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
