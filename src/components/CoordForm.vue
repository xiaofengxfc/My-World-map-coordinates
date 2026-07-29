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
          <label for="dimension">维度 <span class="required">*</span></label>
          <select id="dimension" v-model="localForm.dimension">
            <option value="overworld">🌳 主世界</option>
            <option value="nether">🔥 下界</option>
            <option value="end">🌌 末地</option>
          </select>
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
import { ref, reactive, watch, nextTick } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  editingId: { type: [String, null], default: null },
})

const emit = defineEmits(['close', 'save'])

const nameInput = ref(null)

const localForm = reactive({
  name: '',
  dimension: 'overworld',
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

function handleSubmit() {
  if (!localForm.name.trim()) return
  emit('save', { ...localForm })
}
</script>
