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

function parseCoord(val, fallback = null) {
  if (val === undefined || val === '' || val === null || isNaN(Number(val))) return fallback
  return parseFloat(val)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return new Response('Not Found', { status: 404 })

    const path = url.pathname
    const method = request.method

    if (method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

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

        if (category) { conditions.push('category = ?'); params.push(category) }
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

      // GET /api/categories
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
        if (!body.name || !body.name.trim()) return json({ error: '名称不能为空' }, 400)

        const now = Date.now()
        const loc = {
          id: generateId(),
          name: body.name.trim(),
          category: (body.category || '').trim(),
          overworld_x: parseCoord(body.overworld_x),
          overworld_y: parseCoord(body.overworld_y),
          overworld_z: parseCoord(body.overworld_z),
          nether_x: parseCoord(body.nether_x),
          nether_y: parseCoord(body.nether_y),
          nether_z: parseCoord(body.nether_z),
          end_x: parseCoord(body.end_x),
          end_y: parseCoord(body.end_y),
          end_z: parseCoord(body.end_z),
          description: (body.description || '').trim(),
          created_at: now,
          updated_at: now,
        }

        await db.prepare(
          `INSERT INTO locations (id, name, category, overworld_x, overworld_y, overworld_z, nether_x, nether_y, nether_z, end_x, end_y, end_z, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(loc.id, loc.name, loc.category, loc.overworld_x, loc.overworld_y, loc.overworld_z,
          loc.nether_x, loc.nether_y, loc.nether_z, loc.end_x, loc.end_y, loc.end_z,
          loc.description, loc.created_at, loc.updated_at).run()

        return json(loc, 201)
      }

      // PUT /api/locations/:id
      if (method === 'PUT' && path.startsWith('/api/locations/')) {
        const id = path.split('/').pop()
        const existing = await db.prepare('SELECT * FROM locations WHERE id = ?').bind(id).first()
        if (!existing) return json({ error: '未找到' }, 404)

        const body = await request.json()
        const updates = [
          'name = ?', 'category = ?',
          'overworld_x = ?', 'overworld_y = ?', 'overworld_z = ?',
          'nether_x = ?', 'nether_y = ?', 'nether_z = ?',
          'end_x = ?', 'end_y = ?', 'end_z = ?',
          'description = ?', 'updated_at = ?'
        ]
        const vals = [
          body.name !== undefined ? body.name.trim() : existing.name,
          body.category !== undefined ? (body.category || '').trim() : existing.category,
          body.overworld_x !== undefined ? parseCoord(body.overworld_x) : existing.overworld_x,
          body.overworld_y !== undefined ? parseCoord(body.overworld_y) : existing.overworld_y,
          body.overworld_z !== undefined ? parseCoord(body.overworld_z) : existing.overworld_z,
          body.nether_x !== undefined ? parseCoord(body.nether_x) : existing.nether_x,
          body.nether_y !== undefined ? parseCoord(body.nether_y) : existing.nether_y,
          body.nether_z !== undefined ? parseCoord(body.nether_z) : existing.nether_z,
          body.end_x !== undefined ? parseCoord(body.end_x) : existing.end_x,
          body.end_y !== undefined ? parseCoord(body.end_y) : existing.end_y,
          body.end_z !== undefined ? parseCoord(body.end_z) : existing.end_z,
          body.description !== undefined ? (body.description || '').trim() : existing.description,
          Date.now(),
          id,
        ]

        await db.prepare(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`).bind(...vals).run()
        const updated = await db.prepare('SELECT * FROM locations WHERE id = ?').bind(id).first()
        return json(updated)
      }

      // DELETE /api/locations/:id
      if (method === 'DELETE' && path.startsWith('/api/locations/')) {
        await db.prepare('DELETE FROM locations WHERE id = ?').bind(path.split('/').pop()).run()
        return json({ success: true })
      }

      return json({ error: 'Not Found' }, 404)

    } catch (err) {
      return json({ error: err.message }, 500)
    }
  },
}
