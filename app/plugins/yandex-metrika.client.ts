/**
 * Яндекс.Метрика (только клиент). Модуль nuxt-yandex-metrika должен быть в build
 * с NUXT_PUBLIC_YANDEX_METRIKA_ID в .env при npm run build.
 */
export default defineNuxtPlugin({
  name: 'marine-yandex-metrika',
  parallel: true,
  setup() {
    const config = useRuntimeConfig()
    const ym = config.public.yandexMetrika as { id?: string } | undefined
    const id = String(ym?.id ?? '').trim()
    if (!id || id === 'xxx') {
      return
    }

    const { proxy } = useYandexMetrikaScript()

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

      proxy.hit(to.fullPath, {
        referer: from.fullPath,
        title: typeof document !== 'undefined' ? document.title : undefined,
      })
    })
  },
})
