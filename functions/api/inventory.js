// functions/api/inventory.js
// Cloudflare Pages Functions - 在庫API

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const visitorId = url.searchParams.get('visitorId');
  
  if (!visitorId) {
    return new Response(JSON.stringify({ error: 'visitorId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const data = await env.DIGTILE_KV.get(`inventory:${visitorId}`, 'json');
    const inventory = data || { undo: 0, hold: 0, shuffle: 0 };
    
    return new Response(JSON.stringify({ inventory }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ inventory: { undo: 0, hold: 0, shuffle: 0 } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const body = await request.json();
    const { visitorId, inventory } = body;
    
    if (!visitorId || !inventory) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 保存
    await env.DIGTILE_KV.put(`inventory:${visitorId}`, JSON.stringify(inventory));
    
    return new Response(JSON.stringify({ success: true }), {
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
