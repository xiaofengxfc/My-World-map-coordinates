<template>
  <div>
    <div class="coord-grid" v-if="filteredLocations.length > 0">
      <div
        class="coord-card"
        v-for="loc in filteredLocations"
        :key="loc.id"
        @click="$emit('edit', loc)"
      >
        <div class="coord-card-header">
          <span class="coord-card-name">{{ loc.name }}</span>
          <span v-if="loc.category" class="category-badge">{{ loc.category }}</span>
        </div>
        <div class="coord-card-coords">
          <span>X <span class="coord-value">{{ loc.x }}</span></span>
          <span>Y <span class="coord-value-y">{{ loc.y }}</span></span>
          <span>Z <span class="coord-value">{{ loc.z }}</span></span>
        </div>
        <div class="coord-card-time">🕐 {{ relativeTime(loc.created_at) }}</div>
        <div class="coord-card-desc" v-if="loc.description">{{ loc.description }}</div>
        <div class="coord-card-actions" @click.stop>
          <button class="btn-copy-tp" :class="{ copied: copiedId === loc.id }" @click="copyTP(loc)">
            {{ copiedId === loc.id ? '✅ 已复制' : '📋 /tp' }}
          </button>
          <button class="btn-icon" @click="$emit('edit', loc)" title="编辑">✏️</button>
          <button class="btn-icon danger" @click="$emit('delete', loc.id)" title="删除">🗑️</button>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>
      </svg>
      <h3>还没有坐标记录</h3>
      <p>点击右上角的 ＋ 添加你的第一个坐标</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  filteredLocations: { type: Array, required: true },
})

const emit = defineEmits(['edit', 'delete'])

const copiedId = ref(null)

function relativeTime(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  const d = new Date(ts)
  const pad = n => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

function copyTP(loc) {
  const cmd = `/tp ${loc.x} ${loc.y} ${loc.z}`
  navigator.clipboard.writeText(cmd).then(() => {
    copiedId.value = loc.id
    setTimeout(() => { copiedId.value = null }, 1500)
  }).catch(() => {})
}
</script>

<style scoped>
.category-badge {
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
  background: var(--accent-subtle);
  color: var(--accent);
}
</style>
