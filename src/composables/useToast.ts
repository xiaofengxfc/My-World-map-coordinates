import { ref } from 'vue'

interface Toast {
  id: number
  message: string
}

const toasts = ref<Toast[]>([])
let toastId = 0

export function useToast() {
  function showToast(message: string, duration = 2500) {
    const id = ++toastId
    toasts.value.push({ id, message })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return { toasts, showToast }
}
