export type ConfirmVariant = 'default' | 'danger'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

const dialog = reactive({
  open: false,
  title: 'Подтверждение',
  message: '',
  confirmLabel: 'Подтвердить',
  cancelLabel: 'Отмена',
  variant: 'default' as ConfirmVariant,
})

let resolveFn: ((value: boolean) => void) | null = null

export function useConfirmAction() {
  /**
   * Модальное окно подтверждения (Tailwind, см. AdminConfirmDialog в layout admin).
   */
  async function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      dialog.title = options.title ?? 'Подтверждение'
      dialog.message = options.message
      dialog.confirmLabel = options.confirmLabel ?? 'Подтвердить'
      dialog.cancelLabel = options.cancelLabel ?? 'Отмена'
      dialog.variant = options.variant ?? 'default'
      dialog.open = true
      resolveFn = resolve
    })
  }

  function accept(): void {
    dialog.open = false
    resolveFn?.(true)
    resolveFn = null
  }

  function dismiss(): void {
    dialog.open = false
    resolveFn?.(false)
    resolveFn = null
  }

  return {
    confirm,
    dialog,
    accept,
    dismiss,
  }
}
