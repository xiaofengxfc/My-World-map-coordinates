import { ref, computed } from 'vue'

// API 基础路径
// 通过 Pages Functions (/functions/api/[[path]].js) 代理到 Worker
// 无需设置 VITE_API_URL 环境变量
const API_BASE = '/api'

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useCoords() {
  const locations = ref([])
  const loading = ref(true)
  const searchQuery = ref('')
  const sortBy = ref('newest')
  const dimensionFilter = ref('all')
  const editingId = ref(null)

  const form = ref({
    name: '',
    dimension: 'overworld',
    x: 0,
    y: 64,
    z: 0,
    description: '',
  })

  const filteredLocations = computed(() => {
    // 前端再做一遍客户端过滤，但主要依赖后端 API
    let list = locations.value

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        `${l.x} ${l.y} ${l.z}`.includes(q)
      )
    }

    if (dimensionFilter.value && dimensionFilter.value !== 'all') {
      list = list.filter(l => l.dimension === dimensionFilter.value)
    }

    const sorted = [...list]
    switch (sortBy.value) {
      case 'oldest':
        sorted.sort((a, b) => a.created_at - b.created_at); break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')); break
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN')); break
      default:
        sorted.sort((a, b) => b.created_at - a.created_at)
    }

    return sorted
  })

  const totalCount = computed(() => locations.value.length)

  async function loadLocations() {
    loading.value = true
    try {
      const params = new URLSearchParams({
        sort: sortBy.value,
        dimension: dimensionFilter.value,
        search: searchQuery.value,
      })
      locations.value = await api(`/locations?${params}`)
    } catch (err) {
      console.error('加载坐标失败:', err)
      locations.value = []
    } finally {
      loading.value = false
    }
  }

  function openAddForm() {
    editingId.value = null
    form.value = {
      name: '',
      dimension: 'overworld',
      x: 0,
      y: 64,
      z: 0,
      description: '',
    }
  }

  function openEditForm(loc) {
    editingId.value = loc.id
    form.value = {
      name: loc.name,
      dimension: loc.dimension,
      x: loc.x,
      y: loc.y,
      z: loc.z,
      description: loc.description || '',
    }
  }

  async function saveLocation() {
    const data = form.value
    if (!data.name.trim()) return false

    try {
      if (editingId.value) {
        await api(`/locations/${editingId.value}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
      } else {
        await api('/locations', {
          method: 'POST',
          body: JSON.stringify(data),
        })
      }
      await loadLocations()
      return true
    } catch (err) {
      console.error('保存坐标失败:', err)
      return false
    }
  }

  async function removeLocation(id) {
    try {
      await api(`/locations/${id}`, { method: 'DELETE' })
      await loadLocations()
    } catch (err) {
      console.error('删除坐标失败:', err)
    }
  }

  return {
    locations,
    filteredLocations,
    loading,
    searchQuery,
    sortBy,
    dimensionFilter,
    form,
    editingId,
    totalCount,
    loadLocations,
    openAddForm,
    openEditForm,
    saveLocation,
    removeLocation,
  }
}
