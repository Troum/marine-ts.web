/**
 * Управляет полноэкранным лоадером из `app.html`.
 * Лоадер отображается с первого байта HTML; Vue только диспатчит события show/hide.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  const nuxtApp = useNuxtApp()
  const { start, stop, forceStop } = useFullscreenPageLoader()

  let navSafetyTimer: ReturnType<typeof setTimeout> | null = null
  let reloadFallbackTimer: ReturnType<typeof setTimeout> | null = null

  function isAdmin(path: string) {
    return path.startsWith('/admin')
  }

  function clearNavSafety() {
    if (navSafetyTimer != null) {
      clearTimeout(navSafetyTimer)
      navSafetyTimer = null
    }
  }

  function hide(immediate = false) {
    clearNavSafety()
    if (immediate) forceStop()
    else stop()
  }

  // ── Жёсткая перезагрузка / уход со страницы ──────────────────────────────

  function showForHardReload() {
    if (reloadFallbackTimer != null) {
      clearTimeout(reloadFallbackTimer)
      reloadFallbackTimer = null
    }
    start()
  }

  function showForReloadShortcut() {
    showForHardReload()
    // Если браузер не выполнил reload (например, в тестах), не оставляем лоадер навсегда.
    reloadFallbackTimer = setTimeout(() => {
      if (document.visibilityState === 'visible') forceStop()
      reloadFallbackTimer = null
    }, 2500)
  }

  function onKeydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    if (key === 'f5' || ((event.metaKey || event.ctrlKey) && key === 'r')) {
      showForReloadShortcut()
    }
  }

  function onPageLeave() {
    if (reloadFallbackTimer != null) {
      clearTimeout(reloadFallbackTimer)
      reloadFallbackTimer = null
    }
    showForHardReload()
  }

  // ── Nuxt hooks ────────────────────────────────────────────────────────────

  // page:finish / page:loading:end — основной способ скрыть лоадер после SPA-перехода.
  nuxtApp.hook('page:finish', () => hide())
  nuxtApp.hook('page:loading:end', () => hide())

  // При ошибках — скрываем немедленно, чтобы не блокировать экран.
  nuxtApp.hook('vue:error', () => hide(true))

  // Начальная загрузка: скрываем после гидратации.
  // router.isReady() резолвится один раз; app:mounted — страховка.
  nuxtApp.hook('app:mounted', () => hide(true))
  router.isReady().then(() => nextTick(() => hide(true)))

  // ── Router guards ─────────────────────────────────────────────────────────

  router.beforeEach((to, from) => {
    if (isAdmin(to.path)) {
      forceStop()
      return
    }
    if (to.path === from.path) return
    clearNavSafety()
    // Safety-таймер: если page:finish не придёт (обрыв сети и т.п.) — скрываем через 5с.
    navSafetyTimer = setTimeout(() => hide(true), 5000)
    start()
  })

  window.addEventListener('keydown', onKeydown, { capture: true })
  window.addEventListener('beforeunload', onPageLeave)
  window.addEventListener('pagehide', onPageLeave)
})
