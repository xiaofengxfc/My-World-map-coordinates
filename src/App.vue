<template>
  <div class="app">
    <!-- 顶栏 -->
    <header class="topbar">
      <div class="topbar-left">
        <h1 class="app-title"><span>✦</span> 坐标记录</h1>
        <span class="coord-count">{{ totalCount }} 个坐标</span>
      </div>
      <div class="topbar-right">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" v-model="searchQuery" placeholder="搜索坐标..." />
        </div>
        <select v-model="sortBy">
          <option value="newest">🕐 最新</option>
          <option value="oldest">🕐 最旧</option>
          <option value="name">🔤 名称 A-Z</option>
          <option value="name-desc">🔤 名称 Z-A</option>
        </select>
        <select v-model="categoryFilter">
          <option value="">全部分类</option>
          <option v-for="c in allCategories" :key="c.category" :value="c.category">
            {{ c.category }} ({{ c.count }})
          </option>
        </select>
        <button class="btn btn-primary" @click="handleOpenAdd">＋ 添加</button>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="content">
      <div class="loading" v-if="loading">加载中...</div>
      <CoordList
        v-else
        :filteredLocations="filteredLocations"
        @edit="handleOpenEdit"
        @delete="handleDelete"
      />
    </main>

    <!-- 添加/编辑模态框 -->
    <CoordForm
      v-if="showForm"
      :form="form"
      :editingId="editingId"
      :allCategories="allCategories"
      @close="showForm = false"
      @save="handleSave"
    />

    <!-- 删除确认 -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @click.self="showDeleteConfirm = false">
      <div class="modal" style="max-width: 380px">
        <div class="modal-header">
          <h2>删除坐标</h2>
          <button class="btn-icon modal-close" @click="showDeleteConfirm = false">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 16px; color: var(--text-secondary); font-size: 0.88rem;">
            确定要删除「{{ deletingName }}」吗？此操作不可撤销。
          </p>
          <div class="form-actions">
            <button class="btn btn-outline" @click="showDeleteConfirm = false">取消</button>
            <button class="btn btn-danger" @click="confirmDelete">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast-container">
      <div class="toast" v-for="t in toasts" :key="t.id">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CoordList from './components/CoordList.vue'
import CoordForm from './components/CoordForm.vue'
import { useCoords } from './composables/useCoords.js'
import { useToast } from './composables/useToast.js'

const {
  filteredLocations,
  categories,
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
} = useCoords()

const { toasts, showToast } = useToast()

const showForm = ref(false)
const showDeleteConfirm = ref(false)
const deletingId = ref(null)
const deletingName = ref('')

const allCategories = ref([])

// 同步分类数据
async function refreshCategories() {
  await loadCategories()
  allCategories.value = categories.value
}

function handleOpenAdd() {
  openAddForm()
  showForm.value = true
}

function handleOpenEdit(loc) {
  openEditForm(loc)
  showForm.value = true
}

async function handleSave(data) {
  form.value = data
  const ok = await saveLocation()
  if (ok) {
    showForm.value = false
    await refreshCategories()
    // 如果当前筛选的分类已不存在，重置筛选并重新加载
    if (categoryFilter.value && !allCategories.value.some(c => c.category === categoryFilter.value)) {
      categoryFilter.value = ''
      await loadLocations()
    }
    showToast(editingId.value ? '✅ 坐标已更新' : '✅ 坐标已添加')
  }
}

function handleDelete(id) {
  const loc = filteredLocations.value.find(l => l.id === id)
  if (!loc) return
  deletingId.value = id
  deletingName.value = loc.name
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  await removeLocation(deletingId.value)
  showDeleteConfirm.value = false
  await refreshCategories()
  // 如果当前筛选的分类已被删除，重置筛选并重新加载
  if (categoryFilter.value && !allCategories.value.some(c => c.category === categoryFilter.value)) {
    categoryFilter.value = ''
    await loadLocations()
  }
  showToast('🗑️ 坐标已删除')
}

onMounted(async () => {
  await loadLocations()
  await refreshCategories()
})
</script>
