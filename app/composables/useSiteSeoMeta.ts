/**
 * Подставляет meta title / description / keywords для публичной страницы по slug из API.
 */
export function useSiteSeoMeta(slug: string) {
  const api = useMarineApi()

  const { data } = useAsyncData(
    `site-seo-${slug}`,
    async () => {
      try {
        return await api.seoPages.getBySlug(slug)
      } catch {
        return null
      }
    },
    { default: () => null },
  )

  watch(
    data,
    (page) => {
      if (!page) {
        return
      }
      useSeoMeta({
        title: page.seoTitle || undefined,
        description: page.seoDescription || undefined,
        keywords: page.seoKeywords || undefined,
      })
    },
    { immediate: true },
  )
}
