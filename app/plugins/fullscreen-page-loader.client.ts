/**
 * Показываем полноэкранный лоадер при F5 / Cmd+Shift+R (после запуска клиентского бандла),
 * при переходах по сайту и смене языка. Скрываем после `page:finish` и `page:loading:end`
 * с задержкой `FULLSCREEN_LOADER_HIDE_DELAY_MS`.
 *
 * Важно: при жёсткой перезагрузке `beforeEach` часто приходит с `to.path === from.path`;
 * в этом случае нельзя вызывать `stop()` — иначе лоадер гаснет сразу после старта.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  const nuxtApp = useNuxtApp()
  const { start, stop } = useFullscreenPageLoader()

  let initialLoaderHideTimer: ReturnType<typeof setTimeout> | null = null
  let reloadShortcutFallbackTimer: ReturnType<typeof setTimeout> | null = null

  function createInitialLoader() {
    const initialLoader = document.createElement('div')
    initialLoader.id = 'mts-initial-loader'
    initialLoader.setAttribute('role', 'status')
    initialLoader.setAttribute('aria-live', 'polite')
    initialLoader.setAttribute('aria-busy', 'true')
    initialLoader.innerHTML = [
      '<div class="mts-initial-loader__spinner" aria-hidden="true"></div>',
      '<div class="mts-initial-loader__label">Загрузка...</div>',
    ].join('')
    document.body.appendChild(initialLoader)
    return initialLoader
  }

  function showInitialLoader() {
    if (router.currentRoute.value.path.startsWith('/admin')) {
      return
    }
    if (initialLoaderHideTimer != null) {
      clearTimeout(initialLoaderHideTimer)
      initialLoaderHideTimer = null
    }
    const initialLoader = document.getElementById('mts-initial-loader') ?? createInitialLoader()
    initialLoader.classList.remove('mts-initial-loader--hidden')
  }

  function hideInitialLoader() {
    const initialLoader = document.getElementById('mts-initial-loader')
    if (!initialLoader) {
      return
    }
    initialLoader.classList.add('mts-initial-loader--hidden')
    if (initialLoaderHideTimer != null) {
      clearTimeout(initialLoaderHideTimer)
    }
    initialLoaderHideTimer = setTimeout(() => {
      initialLoader.remove()
      initialLoaderHideTimer = null
    }, 220)
  }

  function showForHardReload() {
    if (reloadShortcutFallbackTimer != null) {
      clearTimeout(reloadShortcutFallbackTimer)
      reloadShortcutFallbackTimer = null
    }
    showInitialLoader()
    start()
  }

  function showForReloadShortcut() {
    showForHardReload()
    reloadShortcutFallbackTimer = setTimeout(() => {
      /*
       * Если браузер не выполнил reload после keydown (например, automation
       * только отправил событие), не оставляем оверлей висеть навсегда.
       * При реальном уходе страницы `beforeunload/pagehide` очистят этот таймер.
       */
      if (document.visibilityState === 'visible') {
        hideInitialLoader()
        stop()
      }
      reloadShortcutFallbackTimer = null
    }, 2500)
  }

  function onKeydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    const isReloadShortcut =
      key === 'f5'
      || ((event.metaKey || event.ctrlKey) && key === 'r')
    if (isReloadShortcut) {
      showForReloadShortcut()
    }
  }

  function onPageLeave() {
    if (reloadShortcutFallbackTimer != null) {
      clearTimeout(reloadShortcutFallbackTimer)
      reloadShortcutFallbackTimer = null
    }
    showForHardReload()
  }

  function hideUnlessAdmin() {
    if (router.currentRoute.value.path.startsWith('/admin')) {
      hideInitialLoader()
      return
    }
    hideInitialLoader()
    stop()
  }

  nuxtApp.hook('page:finish', hideUnlessAdmin)
  nuxtApp.hook('page:loading:end', hideUnlessAdmin)
  nuxtApp.hook('app:mounted', hideUnlessAdmin)

  router.beforeEach((to, from) => {
    if (to.path.startsWith('/admin')) {
      hideInitialLoader()
      stop()
      return
    }
    if (to.path === from.path) {
      return
    }
    showInitialLoader()
    start()
  })

  const initialPath = router.currentRoute.value.path
  if (!initialPath.startsWith('/admin')) {
    showInitialLoader()
    start()
  }
  else {
    hideInitialLoader()
  }

  window.addEventListener('keydown', onKeydown, { capture: true })
  window.addEventListener('beforeunload', onPageLeave)
  window.addEventListener('pagehide', onPageLeave)
})
