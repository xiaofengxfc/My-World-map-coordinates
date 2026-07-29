/**
 * Cloudflare Worker — 坐标管理（前端 + API 全站）
 *
 * 路由规则：
 *   /api/*  → CRUD API
 *   其他路径 → 返回前端静态文件（dist/ 构建产物）
 */

import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler'

// ---- CORS 头 ----
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// ---- ID 生成 ----
let idCounter = Date.now()
function generateId() {
  return (idCounter++).toString(36) + Math.random().toString(36).substring(2, 8)
}

// ---- API 路由 ----
async function handleAPI(request, env, url) {
  const path = url.pathname
  const method = request.method

  if (method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const db = env.DB

  try {
    // GET /api/locations
    if (method === 'GET' && path === '/api/locations') {
      const search = url.searchParams.get('search') || ''
      const dimension = url.searchParams.get('dimension') || 'all'
      const sort = url.searchParams.get('sort') || 'newest'

      let sql = 'SELECT * FROM locations'
      const conditions = []
      const params = []

      if (dimension && dimension !== 'all') {
        conditions.push('dimension = ?')
        params.push(dimension)
      }

      if (search) {
        conditions.push('(name LIKE ? OR description LIKE ?)')
        const q = `%${search}%`
        params.push(q, q)
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ')
      }

      switch (sort) {
        case 'oldest': sql += ' ORDER BY created_at ASC'; break
        case 'name': sql += ' ORDER BY name COLLATE NOCASE ASC'; break
        case 'name-desc': sql += ' ORDER BY name COLLATE NOCASE DESC'; break
        default: sql += ' ORDER BY created_at DESC'
      }

      const { results } = await db.prepare(sql).bind(...params).all()
      return json(results)
    }

    // GET /api/locations/:id
    if (method === 'GET' && path.startsWith('/api/locations/')) {
      const id = path.split('/').pop()
      const result = await db.prepare('SELECT * FROM locations WHERE id = ?').bind(id).first()
      if (!result) return json({ error: '未找到' }, 404)
      return json(result)
    }

    // POST /api/locations
    if (method === 'POST' && path === '/api/locations') {
      const body = await request.json()
      const { name, dimension, x, y, z, description } = body

      if (!name || !name.trim()) return json({ error: '名称不能为空' }, 400)
      if (!['overworld', 'nether', 'end'].includes(dimension)) {
        return json({ error: '维度无效' }, 400)
      }

      const now = Date.now()
      const loc = {
        id: generateId(),
        name: name.trim(),
        dimension,
        x: parseFloat(x) || 0,
        y: y !== undefined && y !== '' ? parseFloat(y) : 64,
        z: parseFloat(z) || 0,
        description: (description || '').trim(),
        created_at: now,
        updated_at: now,
      }

      await db.prepare(
        'INSERT INTO locations (id, name, dimension, x, y, z, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(loc.id, loc.name, loc.dimension, loc.x, loc.y, loc.z, loc.description, loc.created_at, loc.updated_at).run()

      return json(loc, 201)
    }

    // PUT /api/locations/:id
    if (method === 'PUT' && path.startsWith('/api/locations/')) {
      const id = path.split('/').pop()
      const existing = await db.prepare('SELECT * FROM locations WHERE id = ?').bind(id).first()
      if (!existing) return json({ error: '未找到' }, 404)

      const body = await request.json()
      const name = body.name !== undefined ? body.name.trim() : existing.name
      const dimension = body.dimension !== undefined ? body.dimension : existing.dimension
      const x = body.x !== undefined ? parseFloat(body.x) : existing.x
      const y = body.y !== undefined ? (body.y !== '' ? parseFloat(body.y) : 64) : existing.y
      const z = body.z !== undefined ? parseFloat(body.z) : existing.z
      const description = body.description !== undefined ? (body.description || '').trim() : existing.description

      await db.prepare(
        'UPDATE locations SET name = ?, dimension = ?, x = ?, y = ?, z = ?, description = ?, updated_at = ? WHERE id = ?'
      ).bind(name, dimension, x, y, z, description, Date.now(), id).run()

      const updated = await db.prepare('SELECT * FROM locations WHERE id = ?').bind(id).first()
      return json(updated)
    }

    // DELETE /api/locations/:id
    if (method === 'DELETE' && path.startsWith('/api/locations/')) {
      const id = path.split('/').pop()
      await db.prepare('DELETE FROM locations WHERE id = ?').bind(id).run()
      return json({ success: true })
    }

    return json({ error: 'Not Found' }, 404)

  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// ---- 静态文件处理 ----
async function handleStatic(request, env, ctx) {
  try {
    return await getAssetFromKV({
      request,
      waitUntil: (promise) => ctx.waitUntil(promise),
    })
  } catch (e) {
    if (e instanceof NotFoundError) {
      // SPA fallback — 返回 index.html
      try {
        const url = new URL(request.url)
        const indexPath = new URL(url.origin + '/index.html')
        const fallbackRequest = new Request(indexPath.toString(), request)
        return await getAssetFromKV({
          request: fallbackRequest,
          waitUntil: (promise) => ctx.waitUntil(promise),
        })
      } catch {
        return new Response('Not Found', { status: 404 })
      }
    }
    return new Response('Internal Error', { status: 500 })
  }
}

// ---- 入口 ----
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // API 路由
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url)
    }

    // 静态文件
    return handleStatic(request, env, ctx)
  },
}
