/**
 * Глобально держит открытым не более одного выпадающего списка (AdminSelect / AdminMultiSelect и т.п.).
 */
let activeCloser: (() => void) | null = null

/** Вызывать в setup с тем же `open`, что управляет панелью списка. */
export function useExclusiveDropdown(open: Ref<boolean>): void {
  function closeThis(): void {
    open.value = false
  }

  watch(open, (isOpen) => {
    if (isOpen) {
      if (activeCloser !== null && activeCloser !== closeThis) {
        activeCloser()
      }
      activeCloser = closeThis
    } else if (activeCloser === closeThis) {
      activeCloser = null
    }
  })

  onUnmounted(() => {
    if (activeCloser === closeThis) {
      activeCloser = null
    }
  })
}
