/**
 * Полноэкранный индикатор при переходах между страницами, смене локали (Nuxt i18n)
 * и жёсткой перезагрузке (F5, Cmd+Shift+R).
 * Управляется из `plugins/fullscreen-page-loader.client.ts`.
 */

/** Пауза после `page:finish`, чтобы оверлей не исчезал слишком резко. */
export const FULLSCREEN_LOADER_HIDE_DELAY_MS = 320

let hideTimeoutId: ReturnType<typeof setTimeout> | null = null

function clearHideTimeout() {
  if (hideTimeoutId != null) {
    clearTimeout(hideTimeoutId)
    hideTimeoutId = null
  }
}

export function useFullscreenPageLoader() {
  const active = useState('fullscreen-page-loader', () => false)

  function start() {
    if (!import.meta.client) {
      return
    }
    clearHideTimeout()
    active.value = true
  }

  function stop() {
    if (!import.meta.client) {
      return
    }
    clearHideTimeout()
    nextTick(() => {
      requestAnimationFrame(() => {
        hideTimeoutId = setTimeout(() => {
          active.value = false
          hideTimeoutId = null
        }, FULLSCREEN_LOADER_HIDE_DELAY_MS)
      })
    })
  }

  return {
    active: readonly(active),
    start,
    stop,
  }
}
