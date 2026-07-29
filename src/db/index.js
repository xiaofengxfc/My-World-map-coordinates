import { openDB } from 'idb'

const DB_NAME = 'mc_coords'
const DB_VERSION = 1

export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('locations')) {
        const store = db.createObjectStore('locations', {
          keyPath: 'id',
        })
        store.createIndex('name', 'name')
        store.createIndex('dimension', 'dimension')
        store.createIndex('createdAt', 'createdAt')
      }
    },
  })
  return db
}

let _db = null

async function getDB() {
  if (!_db) _db = await initDB()
  return _db
}

// ---- 数据结构 ----
/*
{
  id: string,
  name: string,
  dimension: 'overworld' | 'nether' | 'end',
  x: number,
  y: number,
  z: number,
  description: string,
  createdAt: number,
  updatedAt: number,
}
*/

let idCounter = Date.now()
function generateId() {
  return (idCounter++).toString(36) + Math.random().toString(36).substring(2, 8)
}

// ---- CRUD 操作 ----

export async function getAllLocations() {
  const db = await getDB()
  return db.getAll('locations')
}

export async function getLocation(id) {
  const db = await getDB()
  return db.get('locations', id)
}

export async function addLocation({ name, dimension, x, y, z, description = '' }) {
  const db = await getDB()
  const now = Date.now()
  const loc = {
    id: generateId(),
    name: name.trim(),
    dimension,
    x: parseFloat(x),
    y: y !== '' && y !== null ? parseFloat(y) : 64,
    z: parseFloat(z),
    description: description.trim(),
    createdAt: now,
    updatedAt: now,
  }
  await db.add('locations', loc)
  return loc
}

export async function updateLocation(id, updates) {
  const db = await getDB()
  const existing = await db.get('locations', id)
  if (!existing) return null
  const updated = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  }
  if (updated.name) updated.name = updated.name.trim()
  if (updated.description) updated.description = updated.description.trim()
  if (updated.x !== undefined) updated.x = parseFloat(updated.x)
  if (updated.y !== undefined) updated.y = updated.y !== '' ? parseFloat(updated.y) : 64
  if (updated.z !== undefined) updated.z = parseFloat(updated.z)
  await db.put('locations', updated)
  return updated
}

export async function deleteLocation(id) {
  const db = await getDB()
  await db.delete('locations', id)
}

export async function getAllLocationsSorted({ sort = 'newest', search = '', dimension = 'all' } = {}) {
  const db = await getDB()
  let list = await db.getAll('locations')

  // 搜索筛选
  if (search) {
    const q = search.toLowerCase()
    list = list.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.description && l.description.toLowerCase().includes(q)) ||
      `${l.x} ${l.y} ${l.z}`.includes(q)
    )
  }

  // 维度筛选
  if (dimension && dimension !== 'all') {
    list = list.filter(l => l.dimension === dimension)
  }

  // 排序
  switch (sort) {
    case 'oldest':
      list.sort((a, b) => a.createdAt - b.createdAt)
      break
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
      break
    case 'name-desc':
      list.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'))
      break
    default: // newest
      list.sort((a, b) => b.createdAt - a.createdAt)
  }

  return list
}
