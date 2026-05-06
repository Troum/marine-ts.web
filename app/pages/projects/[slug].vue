<script setup lang="ts">
import { contentBodyToSafeHtml } from '~/composables/useMarkdownSafeHtml'
import { contentPageUsesHeroBreadcrumbs, contentPageSectionsAreRenderable, parseContentPageBody, partitionContentPageSectionsForArticle } from '~/utils/contentPageBody'
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

const pageKey = computed(() => `content-page-project-${locale.value}-${slug.value}`)

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

const crumbItems = computed(() => {
  const p = page.value
  if (!p) {
    return breadcrumbs({ label: t('nav.projects'), to: '/projects' })
  }
  return breadcrumbs({ label: t('nav.projects'), to: '/projects' }, { label: flattenEncodedOrPlain(p.title).trim() || p.slug })
})

watchEffect(() => {
  const item = page.value
  if (!item) {
    return
  }
  const docTitle = plainMetaString(item.seoTitle) || plainMetaString(item.title) || item.slug
  const desc = plainMetaString(item.seoDescription) || plainMetaString(item.excerpt)
  usePublicSeoMeta({
    title: docTitle,
    description: desc || undefined,
    keywords: plainMetaString(item.seoKeywords) || undefined,
    image: item.seoImage || undefined,
    type: 'article',
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
    :inquiry-source-page="`projects/${slug}`"
  >
    <template #not-found>
      <p class="mb-6 font-body text-muted">{{ t('pages.common.notFoundPage') }}</p>
      <NuxtLink :to="localePath('/projects')" class="btn-primary inline-flex">{{ t('pages.common.toProjects') }}</NuxtLink>
    </template>
  </CommonPublicContentPageDetail>
</template>
