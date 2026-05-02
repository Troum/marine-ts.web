<script setup lang="ts">
import { contentBodyToSafeHtml } from '~/composables/useMarkdownSafeHtml'
import { contentPageUsesHeroBreadcrumbs, contentPageSectionsAreRenderable, parseContentPageBody, partitionContentPageSectionsForArticle } from '~/utils/contentPageBody'
import { flattenEncodedOrPlain, plainMetaString } from '~/utils/adminThemedTextCodec'
import {
  isLineMarketingPageSlug,
  LINE_MARKETING_PAGE_LAYOUT,
  type LineMarketingPageSlug,
} from '~/utils/lineMarketingPages'

definePageMeta({
  validate: (route) => isLineMarketingPageSlug(String(route.params.line ?? '')),
})

const route = useRoute()
const parentSlug = computed(() => String(route.params.line ?? '') as LineMarketingPageSlug)
const childSlug = computed(() => {
  const s = route.params.slug
  return Array.isArray(s) ? (s[0] ?? '') : (s as string)
})

const api = useMarineApi()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()

const pageKey = computed(() => `line-marketing-detail-${locale.value}-${parentSlug.value}-${childSlug.value}`)

const { data: page, pending } = await useAsyncData(
  pageKey,
  async () => {
    try {
      return await api.contentPages.getPublicBySlug(childSlug.value)
    } catch {
      return null
    }
  },
  { watch: [childSlug, locale] },
)

const { setHidden: setFooterHidden } = usePageFooterHidden()
watchEffect(() => { setFooterHidden(page.value?.hideFooter ?? false) })

const parsedBody = computed(() => parseContentPageBody(page.value?.body))

const bodyHtml = computed(() => contentBodyToSafeHtml(parsedBody.value.articleHtml))

const sectionPartition = computed(() => partitionContentPageSectionsForArticle(parsedBody.value.customSections))
const topCustomSections = computed(() => sectionPartition.value.beforeArticle)
const afterArticleCustomSections = computed(() => sectionPartition.value.afterArticle)

const showTopCustomSections = computed(() => contentPageSectionsAreRenderable(topCustomSections.value))
const showAfterArticleSections = computed(() => contentPageSectionsAreRenderable(afterArticleCustomSections.value))

const showArticleBreadcrumbs = computed(() => !contentPageUsesHeroBreadcrumbs(topCustomSections.value))

const parentNavLabel = computed(() => {
  const s = parentSlug.value
  if (!isLineMarketingPageSlug(s)) {
    return ''
  }
  return t(LINE_MARKETING_PAGE_LAYOUT[s].navI18nKey)
})

const crumbItems = computed(() => {
  const p = page.value
  const parent = parentSlug.value
  if (!isLineMarketingPageSlug(parent)) {
    return breadcrumbs()
  }
  const parentCrumb = { label: parentNavLabel.value, to: `/${parent}` }
  if (!p) {
    return breadcrumbs(parentCrumb)
  }
  return breadcrumbs(parentCrumb, { label: flattenEncodedOrPlain(p.title).trim() || childSlug.value })
})

watchEffect(() => {
  const item = page.value
  if (!item) {
    return
  }
  const docTitle = plainMetaString(item.seoTitle) || plainMetaString(item.title) || childSlug.value
  const desc = plainMetaString(item.seoDescription) || plainMetaString(item.excerpt)
  useSeoMeta({
    title: docTitle,
    description: desc || undefined,
    keywords: plainMetaString(item.seoKeywords) || undefined,
  })
})
</script>

<template>
  <CommonPublicContentPageDetail
    :pending="pending"
    :page="page"
    :body-html="bodyHtml"
    :show-top-custom-sections="showTopCustomSections"
    :top-custom-sections="topCustomSections"
    :show-after-article-sections="showAfterArticleSections"
    :after-article-custom-sections="afterArticleCustomSections"
    :show-article-breadcrumbs="showArticleBreadcrumbs"
    :crumb-items="crumbItems"
    :inquiry-source-page="`${parentSlug}/${childSlug}`"
    :inquiry-enabled="isLineMarketingPageSlug(parentSlug)"
    :line-marketing-parent-slug="isLineMarketingPageSlug(parentSlug) ? parentSlug : null"
  >
    <template #not-found>
      <p class="mb-6 font-body text-muted">{{ t('pages.common.notFoundPage') }}</p>
      <NuxtLink
        v-if="isLineMarketingPageSlug(parentSlug)"
        :to="localePath(`/${parentSlug}`)"
        class="btn-primary inline-flex"
        >{{ t('pages.common.backToLinePage', { name: parentNavLabel }) }}</NuxtLink
      >
    </template>
  </CommonPublicContentPageDetail>
</template>
