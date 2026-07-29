<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editingId ? '编辑坐标' : '添加坐标' }}</h2>
        <button class="btn-icon modal-close" @click="$emit('close')">&times;</button>
      </div>
      <form class="modal-body" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">名称 <span class="required">*</span></label>
          <input
            id="name"
            v-model="localForm.name"
            type="text"
            placeholder="例如：出生点、末地传送门..."
            maxlength="50"
            required
            ref="nameInput"
          />
        </div>

        <div class="form-row form-row-triple">
          <div class="form-group">
            <label for="x">X <span class="required">*</span></label>
            <input id="x" v-model.number="localForm.x" type="number" step="any" required />
          </div>
          <div class="form-group">
            <label for="y">Y</label>
            <input id="y" v-model.number="localForm.y" type="number" step="any" placeholder="64" />
          </div>
          <div class="form-group">
            <label for="z">Z <span class="required">*</span></label>
            <input id="z" v-model.number="localForm.z" type="number" step="any" required />
          </div>
        </div>

        <div class="form-group">
          <label for="category">分类</label>
          <div class="category-input-group">
            <input
              id="category"
              v-model="localForm.category"
              type="text"
              placeholder="未分类 — 输入新建或选择已有"
              maxlength="20"
              list="categorySuggestions"
              @input="filterSuggestions"
              @focus="showSuggestions = true"
            />
            <datalist id="categorySuggestions">
              <option v-for="c in allCategories" :key="c.category" :value="c.category" />
            </datalist>
          </div>
          <div class="category-hint">留空为未分类，输入新名称自动创建分类</div>
        </div>

        <div class="form-group">
          <label for="desc">描述</label>
          <textarea
            id="desc"
            v-model="localForm.description"
            rows="2"
            placeholder="坐标描述、注意事项..."
            maxlength="200"
          ></textarea>
        </div>

        <div class="category-tags" v-if="allCategories.length > 0">
          <span
            v-for="c in allCategories"
            :key="c.category"
            class="category-tag"
            :class="{ active: localForm.category === c.category }"
            @click="localForm.category = localForm.category === c.category ? '' : c.category"
          >
            {{ c.category }}
          </span>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline" @click="$emit('close')">取消</button>
          <button type="submit" class="btn btn-primary">
            {{ editingId ? '保存' : '添加' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  editingId: { type: [String, null], default: null },
  allCategories: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const nameInput = ref(null)
const showSuggestions = ref(false)

const localForm = reactive({
  name: '',
  category: '',
  x: 0,
  y: 64,
  z: 0,
  description: '',
})

watch(
  () => props.form,
  (val) => {
    Object.assign(localForm, val)
  },
  { immediate: true, deep: true }
)

watch(
  () => props.editingId,
  () => {
    nextTick(() => nameInput.value?.focus())
  },
  { immediate: true }
)

function filterSuggestions() {}

function handleSubmit() {
  if (!localForm.name.trim()) return
  emit('save', { ...localForm })
}
</script>

<style scoped>
.category-input-group {
  position: relative;
}
.category-input-group input {
  width: 100%;
}
.category-hint {
  font-size: 0.72rem;
  color: var(--text-tertiary);
  margin-top: 3px;
}
.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.category-tag {
  font-size: 0.75rem;
  padding: 3px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition);
}
.category-tag:hover {
  border-color: var(--accent);
  color: var(--text);
}
.category-tag.active {
  background: var(--accent);
  color: var(--text-inverse);
  border-color: var(--accent);
}
</style>
