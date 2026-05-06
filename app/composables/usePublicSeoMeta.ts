type PublicSeoMetaType = 'website' | 'article'

export interface PublicSeoMetaInput {
  title?: string | null
  description?: string | null
  keywords?: string | null
  image?: string | null
  type?: PublicSeoMetaType
  robots?: string | null
}

function cleanMetaValue(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function absoluteMetaUrl(value: string | null | undefined, origin: string): string | undefined {
  const url = cleanMetaValue(value)
  if (!url) {
    return undefined
  }
  try {
    return new URL(url, `${origin}/`).toString()
  } catch {
    return undefined
  }
}

export function usePublicSeoMeta(input: PublicSeoMetaInput) {
  const route = useRoute()
  const requestUrl = useRequestURL()
  const config = useRuntimeConfig()
  const { locale } = useI18n()
  const configuredSiteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')
  const origin = configuredSiteUrl || requestUrl.origin
  const cleanPath = route.fullPath.split('#')[0]?.split('?')[0] || route.path || '/'
  const pageUrl = absoluteMetaUrl(cleanPath, origin)
  const imageUrl = absoluteMetaUrl(input.image, origin)
  const title = cleanMetaValue(input.title)
  const description = cleanMetaValue(input.description)
  const ogLocale = locale.value === 'en' ? 'en_US' : 'ru_RU'

  useSeoMeta({
    title,
    description,
    keywords: cleanMetaValue(input.keywords),
    robots: cleanMetaValue(input.robots),
    ogTitle: title,
    ogDescription: description,
    ogType: input.type ?? 'website',
    ogUrl: pageUrl,
    ogSiteName: 'Marine Technical Solutions',
    ogLocale,
    ogImage: imageUrl,
    twitterCard: imageUrl ? 'summary_large_image' : 'summary',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl,
  })

  if (pageUrl && !cleanMetaValue(input.robots)?.toLowerCase().includes('noindex')) {
    useHead({
      link: [
        { rel: 'canonical', href: pageUrl },
      ],
    })
  }
}
