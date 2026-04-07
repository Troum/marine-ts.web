import { reactive } from 'vue'

export type AdminAlertVariant = 'info' | 'error'

export interface AdminAlertOptions {
  title?: string
  message: string
  variant?: AdminAlertVariant
}

const state = reactive({
  open: false,
  title: 'Сообщение',
  message: '',
  variant: 'info' as AdminAlertVariant,
})

let pendingResolve: (() => void) | null = null

/**
 * Информационное модальное окно вместо нативного `alert()` (стиль как у подтверждений).
 */
export function useAdminAlert() {
  function show(options: AdminAlertOptions): Promise<void> {
    return new Promise((resolve) => {
      state.title =
        options.title ?? (options.variant === 'error' ? 'Ошибка' : 'Сообщение')
      state.message = options.message
      state.variant = options.variant ?? 'info'
      state.open = true
      pendingResolve = resolve
    })
  }

  function dismiss(): void {
    state.open = false
    pendingResolve?.()
    pendingResolve = null
  }

  return {
    state,
    show,
    dismiss,
  }
}
