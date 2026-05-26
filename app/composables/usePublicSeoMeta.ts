import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

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

/**
 * Публичные SEO meta + canonical. Вызывать только на верхнем уровне setup;
 * для асинхронных данных передавайте `computed` / `ref`, а не вызывайте внутри watch.
 */
export function usePublicSeoMeta(input: MaybeRefOrGetter<PublicSeoMetaInput>) {
  const route = useRoute()
  const requestUrl = useRequestURL()
  const config = useRuntimeConfig()
  const { locale } = useI18n()
  const configuredSiteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')
  const origin = configuredSiteUrl || requestUrl.origin

  const meta = computed(() => {
    const raw = toValue(input)
    const cleanPath = route.fullPath.split('#')[0]?.split('?')[0] || route.path || '/'
    const pageUrl = absoluteMetaUrl(cleanPath, origin)
    const imageUrl = absoluteMetaUrl(raw.image, origin)
    const title = cleanMetaValue(raw.title)
    const description = cleanMetaValue(raw.description)
    const robots = cleanMetaValue(raw.robots)
    const ogLocale = locale.value === 'en' ? 'en_US' : 'ru_RU'
    const showCanonical = Boolean(pageUrl && !robots?.toLowerCase().includes('noindex'))

    return {
      title,
      description,
      keywords: cleanMetaValue(raw.keywords),
      robots,
      ogLocale,
      ogType: (raw.type ?? 'website') as PublicSeoMetaType,
      pageUrl,
      imageUrl,
      showCanonical,
    }
  })

  useSeoMeta({
    title: () => meta.value.title,
    description: () => meta.value.description,
    keywords: () => meta.value.keywords,
    robots: () => meta.value.robots,
    ogTitle: () => meta.value.title,
    ogDescription: () => meta.value.description,
    ogType: () => meta.value.ogType,
    ogUrl: () => meta.value.pageUrl,
    ogSiteName: 'Marine Technical Solutions',
    ogLocale: () => meta.value.ogLocale,
    ogImage: () => meta.value.imageUrl,
    twitterCard: () => (meta.value.imageUrl ? 'summary_large_image' : 'summary'),
    twitterTitle: () => meta.value.title,
    twitterDescription: () => meta.value.description,
    twitterImage: () => meta.value.imageUrl,
  })

  useHead(() => {
    if (!meta.value.showCanonical || !meta.value.pageUrl) {
      return {}
    }
    return {
      link: [
        { rel: 'canonical', href: meta.value.pageUrl },
      ],
    }
  })
}
