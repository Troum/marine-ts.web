/**
 * Полноэкранный индикатор загрузки — управляется через CustomEvent,
 * которые слушает inline-скрипт в `app.html`.
 * Не использует Vue-состояние, не завязан на Teleport/Transition.
 */
import {
  dispatchMtsPageLoaderShow,
  dispatchMtsPageLoaderHide,
} from '~/utils/mtsPageLoaderEvents'

/**
 * Минимальное время показа лоадера при SPA-навигации (мс).
 * Гарантирует, что лоадер будет виден, даже если page:finish стреляет
 * почти мгновенно (кэш, быстрый API на localhost).
 */
const MIN_SHOW_MS = 500

/** Пауза после MIN_SHOW_MS перед началом fade-out. */
const HIDE_DELAY_MS = 200

let hideTimeoutId: ReturnType<typeof setTimeout> | null = null
let showTimestamp = 0

function clearHideTimeout() {
  if (hideTimeoutId != null) {
    clearTimeout(hideTimeoutId)
    hideTimeoutId = null
  }
}

export function useFullscreenPageLoader() {
  function start() {
    if (!import.meta.client) return
    clearHideTimeout()
    showTimestamp = Date.now()
    dispatchMtsPageLoaderShow()
  }

  function stop() {
    if (!import.meta.client) return
    clearHideTimeout()
    const elapsed = Date.now() - showTimestamp
    const wait = Math.max(0, MIN_SHOW_MS - elapsed) + HIDE_DELAY_MS
    hideTimeoutId = setTimeout(() => {
      dispatchMtsPageLoaderHide({ delay: 0 })
      hideTimeoutId = null
    }, wait)
  }

  /** Скрыть немедленно — для fallback при ошибках, admin-роутах и начальной загрузки. */
  function forceStop() {
    if (!import.meta.client) return
    clearHideTimeout()
    dispatchMtsPageLoaderHide({ immediate: true })
  }

  return { start, stop, forceStop }
}
