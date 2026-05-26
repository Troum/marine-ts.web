/**
 * Яндекс.Метрика через nuxt-yandex-metrika (@nuxt/scripts + useHead для SSR).
 * Логика как в модуле: init без defer (первый просмотр при загрузке), hit после router.isReady().
 * Дополнительно: не трекаем /admin/*.
 */
export default defineNuxtPlugin({
  name: 'marine-yandex-metrika',
  parallel: true,
  setup() {
    const { proxy } = useYandexMetrikaScript()

    if (!import.meta.client) {
      return
    }

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
