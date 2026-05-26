/**
 * Публичный сайт: учёт просмотров в API + опционально Plausible / GA4.
 * Яндекс.Метрика — модуль nuxt-yandex-metrika (app/plugins/yandex-metrika.ts).
 * Маршруты /admin/* не трекаются.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  const config = useRuntimeConfig()

  const apiBase = (config.public.apiBase as string).replace(/\/$/, '')
  const gtagId = (config.public.analyticsGtagId as string) || ''
  const plausibleDomain = (config.public.analyticsPlausibleDomain as string) || ''

  if (import.meta.client) {
    if (gtagId) {
      initGtag(gtagId)
    } else if (plausibleDomain) {
      initPlausible(plausibleDomain)
    }
  }

  let lastFullPath = ''
  let lastSentAt = 0

  router.afterEach((to) => {
    if (to.path === '/admin' || to.path.startsWith('/admin/')) {
      return
    }

    const now = Date.now()
    if (to.fullPath === lastFullPath && now - lastSentAt < 400) {
      return
    }
    lastFullPath = to.fullPath
    lastSentAt = now

    nextTick(() => {
      const title = typeof document !== 'undefined' ? document.title : ''
      const referrer = typeof document !== 'undefined' ? document.referrer : ''

      notifyExternalPageView(to.fullPath, gtagId, plausibleDomain)
      void postPageView(apiBase, to.fullPath, title, referrer)
    })
  })
})

function initGtag(measurementId: string): void {
  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag(...args: unknown[]) {
    w.dataLayer!.push(args)
  }
  w.gtag('js', new Date())
  w.gtag('config', measurementId, { send_page_view: false })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(s)
}

function initPlausible(domain: string): void {
  const s = document.createElement('script')
  s.defer = true
  s.setAttribute('data-domain', domain)
  s.src = 'https://plausible.io/js/script.js'
  document.head.appendChild(s)
}

function notifyExternalPageView(path: string, gtagId: string, plausibleDomain: string): void {
  const w = window as Window & { plausible?: (event: string, options?: { u?: string }) => void }

  if (gtagId && typeof w.gtag === 'function') {
    w.gtag('config', gtagId, { page_path: path })
  }

  if (plausibleDomain && typeof w.plausible === 'function') {
    w.plausible('pageview', { u: path })
  }
}

async function postPageView(apiBase: string, path: string, title: string, referrer: string): Promise<void> {
  try {
    await $fetch(`${apiBase}/analytics/page-view`, {
      method: 'POST',
      body: {
        path,
        title: title || undefined,
        referrer: referrer || undefined,
      },
    })
  } catch {
    // сеть / CORS — не мешаем UX
  }
}
