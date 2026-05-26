/**
 * Яндекс.Метрика без nuxt-yandex-metrika (избегаем ReferenceError useYandexMetrikaScript).
 * NUXT_PUBLIC_YANDEX_METRIKA_ID — в .env до npm run build.
 */
type YmFn = ((counterId: number, method: string, ...args: unknown[]) => void) & {
  a?: unknown[][]
  l?: number
}

function parseMetrikaId(raw: unknown): number | null {
  const n = Number.parseInt(String(raw ?? '').trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function ensureYmLoader(): void {
  if (typeof window === 'undefined') {
    return
  }
  const w = window as Window & { ym?: YmFn }
  if (w.ym) {
    return
  }
  ;(function (m, e, t, r, i, k, a) {
    const doc = e as Document
    const win = m as Window & Record<string, YmFn>
    win[i] =
      win[i]
      || function (...args: unknown[]) {
        ;(win[i].a = win[i].a || []).push(args)
      }
    win[i].l = Date.now()
    k = doc.createElement(t) as HTMLScriptElement
    a = doc.getElementsByTagName(t)[0]
    k.async = true
    k.src = r
    a?.parentNode?.insertBefore(k, a)
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym')
}

function initCounter(counterId: number): void {
  const w = window as Window & { ym?: YmFn }
  if (typeof w.ym !== 'function') {
    return
  }
  w.ym(counterId, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  })
}

function hit(counterId: number, path: string, referer: string): void {
  const w = window as Window & { ym?: YmFn }
  if (typeof w.ym !== 'function') {
    return
  }
  w.ym(counterId, 'hit', path, {
    title: document.title || undefined,
    referer: referer || undefined,
  })
}

export default defineNuxtPlugin({
  name: 'marine-yandex-metrika',
  parallel: true,
  setup() {
    const config = useRuntimeConfig()
    const counterId = parseMetrikaId(config.public.yandexMetrikaId)
    if (!counterId) {
      return
    }

    ensureYmLoader()
    initCounter(counterId)

    let ready = false
    const router = useRouter()

    void router.isReady().then(() => {
      ready = true
    })

    router.afterEach((to, from) => {
      if (!ready) {
        return
      }
      if (to.path === '/admin' || to.path.startsWith('/admin/')) {
        return
      }
      hit(counterId, to.fullPath, from.fullPath)
    })
  },
})
