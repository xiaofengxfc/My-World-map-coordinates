<template>
  <div class="modal-overlay" @mousedown="onOverlayClick" @touchstart="onOverlayClick">
    <div class="modal" @mousedown.stop @touchstart.stop>
      <div class="modal-header">
        <h2>{{ editingId ? '编辑坐标' : '添加坐标' }}</h2>
        <button class="btn-icon modal-close" type="button" @click="$emit('close')">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <!-- 名称 -->
          <div class="field">
            <label for="name">名称 <span class="required">*</span></label>
            <input
              id="name"
              v-model="localForm.name"
              type="text"
              placeholder="给这个坐标起个名字"
              maxlength="50"
              required
              ref="nameInput"
            />
          </div>

          <!-- X Y Z -->
          <div class="field">
            <label>坐标</label>
            <div class="coord-row">
              <div class="coord-input">
                <span class="coord-label">X</span>
                <input v-model.number="localForm.x" type="number" step="any" required placeholder="0" />
              </div>
              <div class="coord-input">
                <span class="coord-label">Y</span>
                <input v-model.number="localForm.y" type="number" step="any" placeholder="0" />
              </div>
              <div class="coord-input">
                <span class="coord-label">Z</span>
                <input v-model.number="localForm.z" type="number" step="any" required placeholder="0" />
              </div>
            </div>
          </div>

          <!-- 分类 -->
          <div class="field">
            <label for="categoryInput">分类</label>
            <div class="category-wrap">
              <input
                id="categoryInput"
                v-model="localForm.category"
                type="text"
                placeholder="未分类 — 输入新建或从列表选择"
                maxlength="20"
                @focus="showDropdown = true"
                @blur="onBlur"
                @input="onCategoryInput"
                ref="categoryInput"
                autocomplete="off"
              />
              <div class="category-dropdown" v-if="showDropdown && filteredCategories.length > 0">
                <div
                  v-for="c in filteredCategories"
                  :key="c.category"
                  class="category-option"
                  @mousedown.prevent="selectCategory(c.category)"
                >
                  {{ c.category }}
                  <span class="cat-count">{{ c.count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 描述 -->
          <div class="field">
            <label for="desc">描述</label>
            <textarea
              id="desc"
              v-model="localForm.description"
              rows="2"
              placeholder="备注、注意事项…"
              maxlength="200"
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline" @click="$emit('close')">取消</button>
          <button type="submit" class="btn btn-primary">
            {{ editingId ? '保存修改' : '添加坐标' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick, computed } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  editingId: { type: [String, null], default: null },
  allCategories: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const nameInput = ref(null)
const categoryInput = ref(null)
const showDropdown = ref(false)

const localForm = reactive({
  name: '',
  category: '',
  x: 0,
  y: 0,
  z: 0,
  description: '',
})

const filteredCategories = computed(() => {
  const q = localForm.category.toLowerCase()
  return props.allCategories.filter(c =>
    c.category.toLowerCase().includes(q) && c.category !== localForm.category
  )
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

function selectCategory(name) {
  localForm.category = name
  showDropdown.value = false
}

function onCategoryInput() {
  showDropdown.value = true
}

function onBlur() {
  setTimeout(() => { showDropdown.value = false }, 150)
}

function onOverlayClick(e) {
  if (e.currentTarget === e.target) {
    emit('close')
  }
}

function handleSubmit() {
  if (!localForm.name.trim()) return
  emit('save', { ...localForm })
}
</script>

<style scoped>
.field {
  margin-bottom: 16px;
}
.field:last-child {
  margin-bottom: 0;
}
.field label {
  display: block;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 5px;
}
.field .required { color: var(--red); }
.field input,
.field textarea {
  width: 100%;
  padding: 9px 12px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.88rem;
  font-family: inherit;
  outline: none;
  transition: border-color var(--transition), background var(--transition);
}
.field input:focus,
.field textarea:focus {
  border-color: var(--accent);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px var(--accent-subtle);
}
.field input::placeholder,
.field textarea::placeholder { color: var(--text-tertiary); }
.field textarea { resize: vertical; min-height: 44px; }

/* 坐标行 */
.coord-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.coord-input {
  position: relative;
}
.coord-input input {
  width: 100%;
  padding: 9px 12px 9px 26px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.88rem;
  font-family: inherit;
  outline: none;
  transition: border-color var(--transition), background var(--transition);
}
.coord-input input:focus {
  border-color: var(--accent);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px var(--accent-subtle);
}
.coord-input input::placeholder { color: var(--text-tertiary); }
.coord-label {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-tertiary);
  pointer-events: none;
  z-index: 1;
}

/* 分类下拉 */
.category-wrap { position: relative; }
.category-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  z-index: 10;
  max-height: 160px;
  overflow-y: auto;
  margin-top: 2px;
}
.category-option {
  padding: 7px 12px;
  font-size: 0.84rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background var(--transition);
}
.category-option:hover {
  background: var(--bg-hover);
  color: var(--accent);
}
.cat-count {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

/* 底部操作栏 */
.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--border);
}
</style>
