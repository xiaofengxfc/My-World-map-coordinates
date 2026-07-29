import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  function showToast(message, duration = 2500) {
    const id = ++toastId
    toasts.value.push({ id, message })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return { toasts, showToast }
}
