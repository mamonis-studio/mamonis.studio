/**
 * MAMONIS Admin API
 * Cloudflare Workers + D1 Database
 */

// CORS headers
const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
});

// JSON response helper
const json = (data, status = 200, origin) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
};

// Error response helper
const error = (message, status = 400, origin) => {
  return json({ error: message }, status, origin);
};

// Simple password hashing (本番では bcrypt 等を使用)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'mamonis-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Generate session token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, '');
}

// Verify session
async function verifySession(db, token) {
  if (!token) return null;
  
  const session = await db.prepare(
    'SELECT s.*, u.username, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime("now")'
  ).bind(token).first();
  
  return session;
}

// Auth middleware
async function requireAuth(db, request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const session = await verifySession(db, token);
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

// Router
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin') || env.CORS_ORIGIN;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    try {
      // ========== AUTH ROUTES ==========
      
      // POST /api/auth/setup - 初回セットアップ（ユーザー作成）
      if (path === '/api/auth/setup' && method === 'POST') {
        const existing = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
        if (existing.count > 0) {
          return error('Setup already completed', 400, origin);
        }
        
        const { username, password } = await request.json();
        const passwordHash = await hashPassword(password);
        
        await env.DB.prepare(
          'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
        ).bind(username, passwordHash, 'admin').run();
        
        return json({ success: true, message: 'Admin user created' }, 201, origin);
      }

      // POST /api/auth/login
      if (path === '/api/auth/login' && method === 'POST') {
        const { username, password } = await request.json();
        const passwordHash = await hashPassword(password);
        
        const user = await env.DB.prepare(
          'SELECT * FROM users WHERE username = ? AND password_hash = ?'
        ).bind(username, passwordHash).first();
        
        if (!user) {
          return error('Invalid credentials', 401, origin);
        }
        
        // Create session
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
        
        await env.DB.prepare(
          'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
        ).bind(token, user.id, expiresAt).run();
        
        return json({ 
          token, 
          user: { id: user.id, username: user.username, role: user.role },
          expiresAt 
        }, 200, origin);
      }

      // POST /api/auth/logout
      if (path === '/api/auth/logout' && method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        if (token) {
          await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run();
        }
        
        return json({ success: true }, 200, origin);
      }

      // GET /api/auth/me
      if (path === '/api/auth/me' && method === 'GET') {
        const session = await requireAuth(env.DB, request);
        return json({ 
          user: { id: session.user_id, username: session.username, role: session.role } 
        }, 200, origin);
      }

      // ========== SETTINGS ROUTES ==========
      
      // GET /api/settings
      if (path === '/api/settings' && method === 'GET') {
        const settings = await env.DB.prepare('SELECT * FROM site_settings WHERE id = 1').first();
        return json(settings || {}, 200, origin);
      }

      // PUT /api/settings
      if (path === '/api/settings' && method === 'PUT') {
        await requireAuth(env.DB, request);
        const data = await request.json();
        
        await env.DB.prepare(`
          UPDATE site_settings SET 
            site_title = ?, 
            tagline = ?, 
            about_text = ?, 
            meta_description = ?, 
            contact_email = ?,
            updated_at = datetime('now')
          WHERE id = 1
        `).bind(
          data.site_title,
          data.tagline,
          data.about_text,
          data.meta_description,
          data.contact_email
        ).run();
        
        return json({ success: true }, 200, origin);
      }

      // ========== NOTES ROUTES ==========
      
      // GET /api/notes
      if (path === '/api/notes' && method === 'GET') {
        const status = url.searchParams.get('status');
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        const offset = parseInt(url.searchParams.get('offset')) || 0;
        
        let query = 'SELECT * FROM notes';
        const params = [];
        
        if (status) {
          query += ' WHERE status = ?';
          params.push(status);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const notes = await env.DB.prepare(query).bind(...params).all();
        const total = await env.DB.prepare(
          status ? 'SELECT COUNT(*) as count FROM notes WHERE status = ?' : 'SELECT COUNT(*) as count FROM notes'
        ).bind(...(status ? [status] : [])).first();
        
        return json({ notes: notes.results, total: total.count }, 200, origin);
      }

      // GET /api/notes/:id
      if (path.match(/^\/api\/notes\/\d+$/) && method === 'GET') {
        const id = path.split('/').pop();
        const note = await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first();
        
        if (!note) return error('Note not found', 404, origin);
        return json(note, 200, origin);
      }

      // POST /api/notes
      if (path === '/api/notes' && method === 'POST') {
        await requireAuth(env.DB, request);
        const data = await request.json();
        
        const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const result = await env.DB.prepare(`
          INSERT INTO notes (title, content, slug, status, published_at) 
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          data.title,
          data.content || '',
          slug,
          data.status || 'draft',
          data.status === 'published' ? new Date().toISOString() : null
        ).run();
        
        return json({ id: result.meta.last_row_id, success: true }, 201, origin);
      }

      // PUT /api/notes/:id
      if (path.match(/^\/api\/notes\/\d+$/) && method === 'PUT') {
        await requireAuth(env.DB, request);
        const id = path.split('/').pop();
        const data = await request.json();
        
        await env.DB.prepare(`
          UPDATE notes SET 
            title = ?, 
            content = ?, 
            slug = ?, 
            status = ?,
            published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN datetime('now') ELSE published_at END,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          data.title,
          data.content,
          data.slug,
          data.status,
          data.status,
          id
        ).run();
        
        return json({ success: true }, 200, origin);
      }

      // DELETE /api/notes/:id
      if (path.match(/^\/api\/notes\/\d+$/) && method === 'DELETE') {
        await requireAuth(env.DB, request);
        const id = path.split('/').pop();
        
        await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
        return json({ success: true }, 200, origin);
      }

      // ========== SERVICES ROUTES ==========
      
      // GET /api/services
      if (path === '/api/services' && method === 'GET') {
        const services = await env.DB.prepare(
          'SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC'
        ).all();
        return json(services.results, 200, origin);
      }

      // POST /api/services
      if (path === '/api/services' && method === 'POST') {
        await requireAuth(env.DB, request);
        const data = await request.json();
        
        const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) as max FROM services').first();
        
        const result = await env.DB.prepare(`
          INSERT INTO services (name, description, url, sort_order) VALUES (?, ?, ?, ?)
        `).bind(
          data.name,
          data.description || '',
          data.url,
          (maxOrder.max || 0) + 1
        ).run();
        
        return json({ id: result.meta.last_row_id, success: true }, 201, origin);
      }

      // PUT /api/services/:id
      if (path.match(/^\/api\/services\/\d+$/) && method === 'PUT') {
        await requireAuth(env.DB, request);
        const id = path.split('/').pop();
        const data = await request.json();
        
        await env.DB.prepare(`
          UPDATE services SET 
            name = ?, 
            description = ?, 
            url = ?,
            sort_order = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(data.name, data.description, data.url, data.sort_order || 0, id).run();
        
        return json({ success: true }, 200, origin);
      }

      // DELETE /api/services/:id
      if (path.match(/^\/api\/services\/\d+$/) && method === 'DELETE') {
        await requireAuth(env.DB, request);
        const id = path.split('/').pop();
        
        await env.DB.prepare('UPDATE services SET is_active = 0 WHERE id = ?').bind(id).run();
        return json({ success: true }, 200, origin);
      }

      // ========== APPS ROUTES ==========
      
      // GET /api/apps
      if (path === '/api/apps' && method === 'GET') {
        const apps = await env.DB.prepare(
          'SELECT * FROM apps WHERE is_active = 1 ORDER BY sort_order ASC'
        ).all();
        return json(apps.results, 200, origin);
      }

      // POST /api/apps
      if (path === '/api/apps' && method === 'POST') {
        await requireAuth(env.DB, request);
        const data = await request.json();
        
        const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) as max FROM apps').first();
        
        const result = await env.DB.prepare(`
          INSERT INTO apps (name, description, url, thumbnail_url, sort_order) VALUES (?, ?, ?, ?, ?)
        `).bind(
          data.name,
          data.description || '',
          data.url || '',
          data.thumbnail_url || '',
          (maxOrder.max || 0) + 1
        ).run();
        
        return json({ id: result.meta.last_row_id, success: true }, 201, origin);
      }

      // PUT /api/apps/:id
      if (path.match(/^\/api\/apps\/\d+$/) && method === 'PUT') {
        await requireAuth(env.DB, request);
        const id = path.split('/').pop();
        const data = await request.json();
        
        await env.DB.prepare(`
          UPDATE apps SET 
            name = ?, 
            description = ?, 
            url = ?,
            thumbnail_url = ?,
            sort_order = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(data.name, data.description, data.url, data.thumbnail_url, data.sort_order || 0, id).run();
        
        return json({ success: true }, 200, origin);
      }

      // DELETE /api/apps/:id
      if (path.match(/^\/api\/apps\/\d+$/) && method === 'DELETE') {
        await requireAuth(env.DB, request);
        const id = path.split('/').pop();
        
        await env.DB.prepare('UPDATE apps SET is_active = 0 WHERE id = ?').bind(id).run();
        return json({ success: true }, 200, origin);
      }

      // ========== ANALYTICS ROUTES ==========
      
      // GET /api/analytics
      // Cloudflare Analytics APIからデータを取得
      if (path === '/api/analytics' && method === 'GET') {
        await requireAuth(env.DB, request);
        
        const zoneId = env.CLOUDFLARE_ZONE_ID;
        const apiToken = env.CLOUDFLARE_API_TOKEN;
        
        if (!zoneId || !apiToken) {
          // デモデータを返す
          return json({
            totalViews: 12847,
            uniqueVisitors: 3291,
            pageViewsPerVisit: 3.9,
            avgTimeOnSite: '2:34',
            countries: [
              { country: 'JP', name: 'Japan', visits: 72, flag: '🇯🇵' },
              { country: 'US', name: 'United States', visits: 15, flag: '🇺🇸' },
              { country: 'GB', name: 'United Kingdom', visits: 6, flag: '🇬🇧' },
              { country: 'DE', name: 'Germany', visits: 4, flag: '🇩🇪' },
              { country: 'OTHER', name: 'Others', visits: 3, flag: '🌍' },
            ],
            traffic: [
              { date: '2025-01-01', views: 320, visitors: 120 },
              { date: '2025-01-05', views: 450, visitors: 180 },
              { date: '2025-01-10', views: 380, visitors: 150 },
              { date: '2025-01-15', views: 520, visitors: 210 },
              { date: '2025-01-20', views: 490, visitors: 190 },
              { date: '2025-01-25', views: 620, visitors: 250 },
              { date: '2025-01-30', views: 580, visitors: 230 },
            ],
            isDemo: true
          }, 200, origin);
        }

        // 本物のCloudflare Analytics APIを呼ぶ
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const graphqlQuery = `
          query {
            viewer {
              zones(filter: {zoneTag: "${zoneId}"}) {
                httpRequests1dGroups(
                  limit: 30
                  filter: {date_geq: "${thirtyDaysAgo.toISOString().split('T')[0]}", date_leq: "${now.toISOString().split('T')[0]}"}
                  orderBy: [date_ASC]
                ) {
                  dimensions {
                    date
                  }
                  sum {
                    pageViews
                    visits
                  }
                  uniq {
                    uniques
                  }
                }
                httpRequests1dGroups(
                  limit: 10
                  filter: {date_geq: "${thirtyDaysAgo.toISOString().split('T')[0]}"}
                  orderBy: [sum_visits_DESC]
                ) {
                  dimensions {
                    clientCountryName
                  }
                  sum {
                    visits
                  }
                }
              }
            }
          }
        `;

        try {
          const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: graphqlQuery }),
          });

          const result = await response.json();
          
          if (result.errors) {
            console.error('Cloudflare API Error:', result.errors);
            return error('Failed to fetch analytics', 500, origin);
          }

          // データを整形して返す
          const zone = result.data.viewer.zones[0];
          const trafficData = zone.httpRequests1dGroups;
          
          return json({
            traffic: trafficData.map(d => ({
              date: d.dimensions.date,
              views: d.sum.pageViews,
              visitors: d.uniq.uniques,
            })),
            isDemo: false
          }, 200, origin);
        } catch (e) {
          console.error('Analytics fetch error:', e);
          return error('Failed to fetch analytics', 500, origin);
        }
      }

      // ========== PUBLIC API (for frontend site) ==========
      
      // GET /api/public/notes - 公開記事一覧
      if (path === '/api/public/notes' && method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const notes = await env.DB.prepare(
          'SELECT id, title, slug, published_at FROM notes WHERE status = ? ORDER BY published_at DESC LIMIT ?'
        ).bind('published', limit).all();
        return json(notes.results, 200, origin);
      }

      // GET /api/public/services
      if (path === '/api/public/services' && method === 'GET') {
        const services = await env.DB.prepare(
          'SELECT name, description, url FROM services WHERE is_active = 1 ORDER BY sort_order ASC'
        ).all();
        return json(services.results, 200, origin);
      }

      // GET /api/public/settings
      if (path === '/api/public/settings' && method === 'GET') {
        const settings = await env.DB.prepare(
          'SELECT site_title, tagline, about_text, contact_email FROM site_settings WHERE id = 1'
        ).first();
        return json(settings || {}, 200, origin);
      }

      // 404
      return error('Not found', 404, origin);

    } catch (e) {
      console.error('Error:', e);
      
      if (e.message === 'Unauthorized') {
        return error('Unauthorized', 401, origin);
      }
      
      return error(e.message || 'Internal server error', 500, origin);
    }
  },
};
