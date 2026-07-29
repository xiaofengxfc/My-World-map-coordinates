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

// ---- 数据库迁移：自动补齐缺失字段 ----
let migrated = false
async function runMigrations(db) {
  if (migrated) return
  migrated = true
  const migrations = [
    "ALTER TABLE locations ADD COLUMN category TEXT DEFAULT ''",
    "ALTER TABLE locations ADD COLUMN overworld_x REAL",
    "ALTER TABLE locations ADD COLUMN overworld_y REAL",
    "ALTER TABLE locations ADD COLUMN overworld_z REAL",
    "ALTER TABLE locations ADD COLUMN nether_x REAL",
    "ALTER TABLE locations ADD COLUMN nether_y REAL",
    "ALTER TABLE locations ADD COLUMN nether_z REAL",
    "ALTER TABLE locations ADD COLUMN end_x REAL",
    "ALTER TABLE locations ADD COLUMN end_y REAL",
    "ALTER TABLE locations ADD COLUMN end_z REAL",
    "ALTER TABLE locations ADD COLUMN link_url TEXT DEFAULT ''",
    "ALTER TABLE locations ADD COLUMN link_title TEXT DEFAULT ''",
  ]
  for (const sql of migrations) {
    try { await db.prepare(sql).run() } catch (e) { /* 列已存在，静默忽略 */ }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return new Response('Not Found', { status: 404 })

    const path = url.pathname
    const method = request.method

    if (method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

    const db = env.DB
    // 自动迁移数据库（补齐缺失字段）
    await runMigrations(db).catch(() => {})

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
          "SELECT category, COUNT(*) as count FROM locations GROUP BY category ORDER BY category ASC"
        ).all()
        // 确保"未分类"始终在列表中
        if (!results.some(r => r.category === '未分类')) {
          results.unshift({ category: '未分类', count: 0 })
        }
        return json(results)
      }

      // GET /api/fetch-title — 获取网页标题
      if (method === 'GET' && path === '/api/fetch-title') {
        let targetUrl = url.searchParams.get('url')
        if (!targetUrl) return json({ title: '' })
        targetUrl = targetUrl.trim().replace(/^(?!https?:\/\/)/i, 'https://')
        try {
          const res = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(5000),
          })
          const html = await res.text()
          // 尝试多种方式获取标题
          let title = ''
          const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
          if (ogMatch) title = ogMatch[1]
          if (!title) {
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
            if (titleMatch) title = titleMatch[1].trim()
          }
          // 从 URL 文件名兜底
          if (!title) {
            const pathMatch = targetUrl.match(/\/([^\/?#]+)(?:[?#]|$)/)
            if (pathMatch) title = decodeURIComponent(pathMatch[1])
          }
          return json({ title })
        } catch {
          // 获取失败时从 URL 提取文件名
          const pathMatch = targetUrl.match(/\/([^\/?#]+)(?:[?#]|$)/)
          return json({ title: pathMatch ? decodeURIComponent(pathMatch[1]) : '' })
        }
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
          link_url: (body.link_url || '').trim().replace(/^(?!https?:\/\/).+/i, (m) => 'https://' + m),
          link_title: (body.link_title || '').trim(),
          created_at: now,
          updated_at: now,
        }

        await db.prepare(
          `INSERT INTO locations (id, name, category, overworld_x, overworld_y, overworld_z, nether_x, nether_y, nether_z, end_x, end_y, end_z, description, link_url, link_title, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(loc.id, loc.name, loc.category, loc.overworld_x, loc.overworld_y, loc.overworld_z,
          loc.nether_x, loc.nether_y, loc.nether_z, loc.end_x, loc.end_y, loc.end_z,
          loc.description, loc.link_url, loc.link_title, loc.created_at, loc.updated_at).run()

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
          'description = ?', 'link_url = ?', 'link_title = ?', 'updated_at = ?'
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
          body.link_url !== undefined ? (body.link_url || '').trim().replace(/^(?!https?:\/\/).+/i, (m) => 'https://' + m) : existing.link_url,
          body.link_title !== undefined ? (body.link_title || '').trim() : existing.link_title,
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
