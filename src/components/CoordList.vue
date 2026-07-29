<template>
  <div>
    <div class="coord-grid" v-if="filteredLocations.length > 0">
      <div class="coord-card" v-for="loc in filteredLocations" :key="loc.id" @click="$emit('edit', loc)">
        <div class="coord-card-header">
          <span class="coord-card-name">{{ loc.name }}</span>
          <span v-if="loc.category" class="category-badge">{{ loc.category }}</span>
        </div>

        <div class="dims">
          <div class="dim-row" v-if="loc.overworld_x !== null">
            <span class="dim-label"><span class="dot overworld"></span> 主世界</span>
            <span class="dim-coords">X {{ loc.overworld_x }} Y {{ loc.overworld_y ?? '—' }} Z {{ loc.overworld_z }}</span>
          </div>
          <div class="dim-row" v-if="loc.nether_x !== null">
            <span class="dim-label"><span class="dot nether"></span> 下界</span>
            <span class="dim-coords">X {{ loc.nether_x }} Y {{ loc.nether_y ?? '—' }} Z {{ loc.nether_z }}</span>
          </div>
          <div class="dim-row" v-if="loc.end_x !== null">
            <span class="dim-label"><span class="dot end"></span> 末地</span>
            <span class="dim-coords">X {{ loc.end_x }} Y {{ loc.end_y ?? '—' }} Z {{ loc.end_z }}</span>
          </div>
        </div>

        <div class="coord-card-time">🕐 {{ relativeTime(loc.created_at) }}</div>
        <div class="coord-card-desc" v-if="loc.description">{{ loc.description }}</div>
        <a v-if="loc.link_url" :href="loc.link_url" target="_blank" class="coord-card-link" @click.stop>📄 {{ loc.link_title || loc.link_url }}</a>
        <div class="coord-card-actions" @click.stop>
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

<script setup lang="ts">
import { ref } from 'vue'
import type { Location } from '../types'

defineProps<{ filteredLocations: Location[] }>()
const emit = defineEmits<{ (e: 'edit', loc: Location): void; (e: 'delete', id: string): void }>()

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
</script>

<style scoped>
.dims { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.dim-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-family: var(--mono); }
.dim-label { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: var(--text-tertiary); min-width: 48px; font-family: var(--font); }
.dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.dot.overworld { background: #16a34a; }
.dot.nether { background: #dc2626; }
.dot.end { background: #7c3aed; }
.dim-coords { color: var(--text-secondary); }
.category-badge { font-size: 0.68rem; padding: 2px 8px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; font-weight: 500; background: var(--accent-subtle); color: var(--accent); }
.coord-card-time { font-size: 0.72rem; color: var(--text-tertiary); margin-bottom: 4px; }
.coord-card-desc { font-size: 0.78rem; color: var(--text-secondary); padding-top: 8px; border-top: 1px solid var(--border-light); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.coord-card-actions { display: flex; gap: 4px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-light); justify-content: flex-end; }
.coord-card-link { display: block; font-size: 0.78rem; color: var(--accent); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-light); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.coord-card-link:hover { text-decoration: underline; }
</style>
