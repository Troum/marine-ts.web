import type { PublicSeoMetaInput } from '~/composables/usePublicSeoMeta'

/**
 * Подставляет meta title / description / keywords для публичной страницы по slug из API.
 */
export function useSiteSeoMeta(slug: string) {
  const api = useMarineApi()
  const { locale } = useI18n()

  const { data } = useAsyncData(
    () => `site-seo-${slug}-${locale.value}`,
    async () => {
      try {
        return await api.seoPages.getBySlug(slug)
      } catch {
        return null
      }
    },
    { default: () => null },
  )

  const seoInput = computed((): PublicSeoMetaInput => {
    const page = data.value
    if (!page) {
      return {}
    }
    const servicesTitleFallback = locale.value === 'en'
      ? 'Ship Repair — vessel repair and technical maintenance | Marine Technical Solutions'
      : 'Судоремонт — ремонт и техническое обслуживание судов | Marine Technical Solutions'
    const servicesDescriptionFallback = locale.value === 'en'
      ? 'Ship repair of any complexity: dry-docking, emergency repairs, engines, automation and vessel systems worldwide.'
      : 'Судоремонт любой сложности: докование, аварийный ремонт, ремонт двигателей, автоматики и судовых систем в портах по всему миру.'
    const title = page.seoTitle || undefined
    const description = page.seoDescription || undefined
    const shouldBoostServices = slug === 'services'
    const boostedTitle = shouldBoostServices && (!title || /^сервисы\b/i.test(title) || /^services\b/i.test(title))
      ? servicesTitleFallback
      : title
    const boostedDescription = shouldBoostServices && !description
      ? servicesDescriptionFallback
      : description
    return {
      title: boostedTitle,
      description: boostedDescription,
      keywords: page.seoKeywords || undefined,
      image: page.seoImage || undefined,
    }
  })

  usePublicSeoMeta(seoInput)
}
