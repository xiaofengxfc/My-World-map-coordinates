import { ref, computed } from 'vue'

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
  const categories = ref([])
  const loading = ref(true)
  const searchQuery = ref('')
  const sortBy = ref('newest')
  const categoryFilter = ref('')
  const editingId = ref(null)

  const form = ref({
    name: '',
    category: '',
    x: 0,
    y: 64,
    z: 0,
    description: '',
  })

  const filteredLocations = computed(() => {
    let list = locations.value

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        `${l.x} ${l.y} ${l.z}`.includes(q)
      )
    }

    if (categoryFilter.value) {
      list = list.filter(l => l.category === categoryFilter.value)
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
        search: searchQuery.value,
      })
      if (categoryFilter.value) params.set('category', categoryFilter.value)
      locations.value = await api(`/locations?${params}`)
    } catch (err) {
      console.error('加载坐标失败:', err)
      locations.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadCategories() {
    try {
      categories.value = await api('/categories')
    } catch {
      categories.value = []
    }
  }

  function openAddForm() {
    editingId.value = null
    form.value = {
      name: '',
      category: '',
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
      category: loc.category || '',
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
      await loadCategories()
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
      await loadCategories()
    } catch (err) {
      console.error('删除坐标失败:', err)
    }
  }

  return {
    locations,
    categories,
    filteredLocations,
    loading,
    searchQuery,
    sortBy,
    categoryFilter,
    form,
    editingId,
    totalCount,
    loadLocations,
    loadCategories,
    openAddForm,
    openEditForm,
    saveLocation,
    removeLocation,
  }
}
