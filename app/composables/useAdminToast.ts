import { reactive } from 'vue'

export interface AdminToastItem {
  id: number
  title: string
  message: string
}

const toasts = reactive<AdminToastItem[]>([])

let seq = 0

function remove(id: number): void {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) {
    toasts.splice(i, 1)
  }
}

export interface AdminToastShowOptions {
  message: string
  /** По умолчанию «Готово». */
  title?: string
  /** Мс до скрытия. По умолчанию 4200. */
  durationMs?: number
}

/**
 * Неблокирующие тосты успеха (угол экрана, авто-скрытие).
 */
export function useAdminToast() {
  function show(options: AdminToastShowOptions): void {
    const id = ++seq
    const title = options.title ?? 'Готово'
    const durationMs = options.durationMs ?? 4200
    toasts.push({ id, title, message: options.message })
    if (import.meta.client) {
      window.setTimeout(() => remove(id), durationMs)
    }
  }

  function success(message: string, title?: string): void {
    show({ message, title })
  }

  return {
    toasts,
    show,
    success,
    dismiss: remove,
  }
}
