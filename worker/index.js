/**
 * Cloudflare Worker — 坐标管理 API
 *
 * 静态文件由 wrangler assets 托管
 * 本 Worker 仅处理 /api/* 路由
 */

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

let idCounter = Date.now()
function generateId() {
  return (idCounter++).toString(36) + Math.random().toString(36).substring(2, 8)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 })
    }

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
        const category = url.searchParams.get('category') || ''
        const sort = url.searchParams.get('sort') || 'newest'

        let sql = 'SELECT * FROM locations'
        const conditions = []
        const params = []

        if (category) {
          conditions.push('category = ?')
          params.push(category)
        }

        if (search) {
          conditions.push('(name LIKE ? OR description LIKE ?)')
          const q = `%${search}%`
          params.push(q, q)
        }

        if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')

        switch (sort) {
          case 'oldest': sql += ' ORDER BY created_at ASC'; break
          case 'name': sql += ' ORDER BY name COLLATE NOCASE ASC'; break
          case 'name-desc': sql += ' ORDER BY name COLLATE NOCASE DESC'; break
          default: sql += ' ORDER BY created_at DESC'
        }

        const { results } = await db.prepare(sql).bind(...params).all()
        return json(results)
      }

      // GET /api/categories — 获取所有分类列表
      if (method === 'GET' && path === '/api/categories') {
        const { results } = await db.prepare(
          "SELECT category, COUNT(*) as count FROM locations WHERE category != '' GROUP BY category ORDER BY category ASC"
        ).all()
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
        const { name, category, x, y, z, description } = body

        if (!name || !name.trim()) return json({ error: '名称不能为空' }, 400)

        const now = Date.now()
        const loc = {
          id: generateId(),
          name: name.trim(),
          category: (category || '').trim(),
          x: parseFloat(x) || 0,
          y: y !== undefined && y !== '' ? parseFloat(y) : null,
          z: parseFloat(z) || 0,
          description: (description || '').trim(),
          created_at: now,
          updated_at: now,
        }

        await db.prepare(
          'INSERT INTO locations (id, name, category, x, y, z, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(loc.id, loc.name, loc.category, loc.x, loc.y, loc.z, loc.description, loc.created_at, loc.updated_at).run()

        return json(loc, 201)
      }

      // PUT /api/locations/:id
      if (method === 'PUT' && path.startsWith('/api/locations/')) {
        const id = path.split('/').pop()
        const existing = await db.prepare('SELECT * FROM locations WHERE id = ?').bind(id).first()
        if (!existing) return json({ error: '未找到' }, 404)

        const body = await request.json()
        await db.prepare(
          'UPDATE locations SET name = ?, category = ?, x = ?, y = ?, z = ?, description = ?, updated_at = ? WHERE id = ?'
        ).bind(
          body.name !== undefined ? body.name.trim() : existing.name,
          body.category !== undefined ? (body.category || '').trim() : existing.category,
          body.x !== undefined ? parseFloat(body.x) : existing.x,
          body.y !== undefined ? (body.y !== '' ? parseFloat(body.y) : null) : existing.y,
          body.z !== undefined ? parseFloat(body.z) : existing.z,
          body.description !== undefined ? (body.description || '').trim() : existing.description,
          Date.now(),
          id
        ).run()

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
  },
}
