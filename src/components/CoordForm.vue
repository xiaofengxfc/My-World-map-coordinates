<template>
  <div class="modal-overlay" @mousedown="onOverlayClick" @touchstart="onOverlayClick">
    <div class="modal" @mousedown.stop @touchstart.stop>
      <div class="modal-header">
        <h2>{{ editingId ? '编辑坐标' : '添加坐标' }}</h2>
        <button class="btn-icon modal-close" type="button" @click="$emit('close')">&times;</button>
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
          <label>分类</label>
          <div class="category-select-row">
            <select :value="localForm.category" @change="onCategorySelect">
              <option value="">未分类</option>
              <option
                v-for="c in allCategories"
                :key="c.category"
                :value="c.category"
              >{{ c.category }} ({{ c.count }})</option>
              <!-- 新建的分类临时加入选项 -->
              <option v-if="pendingNewCat && !isInAllCategories" :value="pendingNewCat">
                {{ pendingNewCat }}（新建）
              </option>
            </select>
            <button type="button" class="btn btn-sm btn-outline" @click="toggleNewInput">
              {{ showNewInput ? '取消' : '＋新建' }}
            </button>
          </div>
          <div class="category-new-row" v-if="showNewInput">
            <input
              v-model="newCategoryName"
              type="text"
              placeholder="输入新分类名称..."
              maxlength="20"
              ref="newCatInput"
              @keyup.enter="confirmNewCategory"
            />
            <button type="button" class="btn btn-sm btn-primary" @click="confirmNewCategory">确定</button>
          </div>
          <div class="category-hint">未选择即为「未分类」</div>
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
import { ref, reactive, watch, nextTick, computed } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  editingId: { type: [String, null], default: null },
  allCategories: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

const nameInput = ref(null)
const newCatInput = ref(null)
const showNewInput = ref(false)
const newCategoryName = ref('')
const pendingNewCat = ref('')

const localForm = reactive({
  name: '',
  category: '',
  x: 0,
  y: 64,
  z: 0,
  description: '',
})

// 新建的分类是否已存在于已有分类列表中
const isInAllCategories = computed(() =>
  props.allCategories.some(c => c.category === pendingNewCat.value)
)

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

function onCategorySelect(e) {
  localForm.category = e.target.value
}

function toggleNewInput() {
  showNewInput.value = !showNewInput.value
  if (showNewInput.value) {
    nextTick(() => newCatInput.value?.focus())
  }
}

function confirmNewCategory() {
  const name = newCategoryName.value.trim()
  if (name) {
    localForm.category = name
    pendingNewCat.value = name
  }
  showNewInput.value = false
  newCategoryName.value = ''
}

function onOverlayClick(e) {
  // 仅当点击目标就是 overlay 背景本身时才关闭（不是其子元素）
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
.category-select-row {
  display: flex;
  gap: 6px;
}
.category-select-row select {
  flex: 1;
}
.category-new-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.category-new-row input {
  flex: 1;
}
.category-hint {
  font-size: 0.72rem;
  color: var(--text-tertiary);
  margin-top: 3px;
}
</style>
