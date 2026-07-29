import { ref, computed } from 'vue'
import {
  getAllLocationsSorted,
  addLocation,
  updateLocation,
  deleteLocation,
} from '../db/index.js'

export function useCoords() {
  const locations = ref([])
  const loading = ref(true)
  const searchQuery = ref('')
  const sortBy = ref('newest')
  const dimensionFilter = ref('all')
  const editingId = ref(null)

  // 表单数据
  const form = ref({
    name: '',
    dimension: 'overworld',
    x: 0,
    y: 64,
    z: 0,
    description: '',
  })

  const filteredLocations = computed(() => {
    let list = locations.value

    // 搜索
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        `${l.x} ${l.y} ${l.z}`.includes(q)
      )
    }

    // 维度筛选
    if (dimensionFilter.value && dimensionFilter.value !== 'all') {
      list = list.filter(l => l.dimension === dimensionFilter.value)
    }

    // 排序
    const sorted = [...list]
    switch (sortBy.value) {
      case 'oldest':
        sorted.sort((a, b) => a.createdAt - b.createdAt)
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
        break
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'))
        break
      default:
        sorted.sort((a, b) => b.createdAt - a.createdAt)
    }

    return sorted
  })

  const totalCount = computed(() => locations.value.length)

  async function loadLocations() {
    loading.value = true
    locations.value = await getAllLocationsSorted()
    loading.value = false
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

    if (editingId.value) {
      await updateLocation(editingId.value, data)
    } else {
      await addLocation(data)
    }

    await loadLocations()
    return true
  }

  async function removeLocation(id) {
    await deleteLocation(id)
    await loadLocations()
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
