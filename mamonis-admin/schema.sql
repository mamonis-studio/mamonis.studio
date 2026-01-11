-- MAMONIS CMS Database Schema for Cloudflare D1

-- サイト設定テーブル
CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    site_title TEXT NOT NULL DEFAULT 'MAMONIS',
    tagline TEXT DEFAULT 'Digital Creator',
    about_text TEXT,
    meta_description TEXT,
    contact_email TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期データ
INSERT INTO site_settings (site_title, tagline, about_text, contact_email) 
VALUES ('MAMONIS', 'Digital Creator', 'MAMONISは、一人でも多くの笑顔のために創造（genesis）します。', 'contact@mamonis.studio');

-- Note（ブログ記事）テーブル
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    slug TEXT UNIQUE,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- サンプルNote
INSERT INTO notes (title, slug, status, published_at) VALUES 
('サンプル記事タイトル', 'sample-1', 'published', '2025-01-04'),
('サンプル記事タイトル', 'sample-2', 'published', '2025-01-03'),
('サンプル記事タイトル', 'sample-3', 'draft', '2025-01-02'),
('サンプル記事タイトル', 'sample-4', 'published', '2025-01-01');

-- Servicesテーブル
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期Services
INSERT INTO services (name, description, url, sort_order) VALUES 
('QR Generator', 'QRコードを簡単作成', 'https://mamonis.studio/qr/', 1),
('Timer', 'シンプルなタイマーツール', 'https://mamonis.studio/timer/', 2),
('Digtile', 'デジタルタイルゲーム', 'https://mamonis.studio/digtile/', 3);

-- Appsテーブル
CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT,
    thumbnail_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ユーザーテーブル（認証用）
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- セッションテーブル
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_published_at ON notes(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_sort ON services(sort_order);
CREATE INDEX IF NOT EXISTS idx_apps_sort ON apps(sort_order);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
