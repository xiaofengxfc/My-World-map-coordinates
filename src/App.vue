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
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索坐标..."
            @input="debounceSearch"
          />
        </div>
        <select v-model="dimensionFilter">
          <option value="all">所有维度</option>
          <option value="overworld">🌳 主世界</option>
          <option value="nether">🔥 下界</option>
          <option value="end">🌌 末地</option>
        </select>
        <select v-model="sortBy">
          <option value="newest">🕐 最新</option>
          <option value="oldest">🕐 最旧</option>
          <option value="name">🔤 名称 A-Z</option>
          <option value="name-desc">🔤 名称 Z-A</option>
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
import { ref, onMounted, watch } from 'vue'
import CoordList from './components/CoordList.vue'
import CoordForm from './components/CoordForm.vue'
import { useCoords } from './composables/useCoords.js'
import { useToast } from './composables/useToast.js'

const {
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
} = useCoords()

const { toasts, showToast } = useToast()

// ---- 模态框状态 ----

const showForm = ref(false)
const showDeleteConfirm = ref(false)
const deletingId = ref(null)
const deletingName = ref('')

// ---- 搜索防抖 ----
let searchTimer = null
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {}, 10)
}

// ---- 筛选/排序变化时重新过滤 ----
watch([sortBy, dimensionFilter, searchQuery], () => {
  // 由 computed 自动处理
})

// ---- 操作函数 ----
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
  showToast('🗑️ 坐标已删除')
}

// ---- 初始化 ----
onMounted(() => {
  loadLocations()
})
</script>
