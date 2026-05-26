<script setup lang="ts">
/**
 * Текстовые контент-страницы каталога услуг: публичный адрес /{slug}.
 * Статические маршруты (about, services, news, …) имеют приоритет над этим файлом.
 */
import { contentBodyToSafeHtml } from '~/composables/useMarkdownSafeHtml'
import {
  contentPageUsesHeroBreadcrumbs,
  contentPageSectionsAreRenderable,
  parseContentPageBody,
  partitionContentPageSectionsForArticle,
} from '~/utils/contentPageBody'
import { flattenEncodedOrPlain, plainMetaString } from '~/utils/adminThemedTextCodec'

const route = useRoute()
const slug = computed(() => {
  const s = route.params.slug
  return Array.isArray(s) ? (s[0] ?? '') : (s as string)
})
const api = useMarineApi()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()

const pageKey = computed(() => `content-page-root-${locale.value}-${slug.value}`)

const { data: page, pending } = await useAsyncData(
  pageKey,
  async () => {
    try {
      return await api.contentPages.getPublicBySlug(slug.value)
    } catch {
      return null
    }
  },
  { watch: [slug, locale] },
)

watch(
  () => [page.value, slug.value] as const,
  async ([p, s]) => {
    if (p?.contentableType === 'project' && s) {
      await navigateTo(localePath(`/projects/${s}`), { replace: true, redirectCode: 301 })
    }
  },
  { immediate: true },
)

const currentPage = computed(() => page.value ?? null)

const { setHidden: setFooterHidden } = usePageFooterHidden()
watchEffect(() => { setFooterHidden(currentPage.value?.hideFooter ?? false) })

const parsedBody = computed(() => parseContentPageBody(currentPage.value?.body))
const sectionPartition = computed(() => partitionContentPageSectionsForArticle(parsedBody.value.customSections))
const topCustomSections = computed(() => sectionPartition.value.beforeArticle)
const afterArticleCustomSections = computed(() => sectionPartition.value.afterArticle)

const bodyHtml = computed(() => {
  return contentBodyToSafeHtml(parsedBody.value.articleHtml)
})

const showTopCustomSections = computed(() => contentPageSectionsAreRenderable(topCustomSections.value))
const showAfterArticleSections = computed(() => contentPageSectionsAreRenderable(afterArticleCustomSections.value))

const showArticleBreadcrumbs = computed(() => !contentPageUsesHeroBreadcrumbs(topCustomSections.value))

const crumbItems = computed(() => {
  const p = currentPage.value
  if (!p) {
    return breadcrumbs()
  }
  const plainTitle = flattenEncodedOrPlain(p.title).trim() || p.slug
  if (p.contentableType === 'service') {
    return breadcrumbs({ label: t('nav.services'), to: '/ship-repair' }, { label: plainTitle })
  }
  return breadcrumbs({ label: plainTitle })
})

usePublicSeoMeta(computed(() => {
  const item = currentPage.value
  if (!item) {
    return {}
  }
  const docTitle = plainMetaString(item.seoTitle) || plainMetaString(item.title) || item.slug
  const desc = plainMetaString(item.seoDescription) || plainMetaString(item.excerpt)
  return {
    title: docTitle,
    description: desc || undefined,
    keywords: plainMetaString(item.seoKeywords) || undefined,
    image: item.seoImage || undefined,
    type: 'article' as const,
  }
}))
</script>

<template>
  <CommonPublicContentPageDetail
    :pending="pending"
    :page="currentPage"
    :body-html="bodyHtml"
    :show-top-custom-sections="showTopCustomSections"
    :top-custom-sections="topCustomSections"
    :show-after-article-sections="showAfterArticleSections"
    :after-article-custom-sections="afterArticleCustomSections"
    :show-article-breadcrumbs="showArticleBreadcrumbs"
    :crumb-items="crumbItems"
    :inquiry-source-page="slug"
  >
    <template #not-found>
      <p class="mb-6 font-body text-muted">{{ t('pages.common.notFoundPage') }}</p>
      <NuxtLink :to="localePath('/ship-repair')" class="btn-primary inline-flex">{{ t('pages.common.toServices') }}</NuxtLink>
    </template>
  </CommonPublicContentPageDetail>
</template>
