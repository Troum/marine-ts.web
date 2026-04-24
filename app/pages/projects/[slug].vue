<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { contentBodyToSafeHtml } from '~/composables/useMarkdownSafeHtml'

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

const bodyHtml = computed(() => {
  const body = page.value?.body
  if (!body) {
    return ''
  }
  return contentBodyToSafeHtml(body)
})

const crumbItems = computed(() => {
  const p = page.value
  if (!p) {
    return breadcrumbs({ label: t('nav.projects'), to: '/projects' })
  }
  return breadcrumbs({ label: t('nav.projects'), to: '/projects' }, { label: p.title })
})

watchEffect(() => {
  const item = page.value
  if (!item) {
    return
  }
  useSeoMeta({
    title: item.seoTitle || item.title,
    description: item.seoDescription || item.excerpt || undefined,
    keywords: item.seoKeywords || undefined,
  })
})
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <div v-if="pending" class="flex justify-center py-24">
      <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
    </div>
    <div v-else-if="!page" class="mts-content-wrap py-24 text-center">
      <div class="mx-auto max-w-7xl">
        <p class="mb-6 font-body text-mts-text-secondary">{{ t('pages.common.notFoundPage') }}</p>
        <NuxtLink :to="localePath('/projects')" class="btn-primary inline-flex">{{ t('pages.common.toProjects') }}</NuxtLink>
      </div>
    </div>
    <article v-else class="relative overflow-hidden pb-24">
      <div class="relative z-10 mts-content-wrap">
        <div class="mx-auto max-w-7xl">
          <Breadcrumbs class="mb-8" :items="crumbItems" />

          <h1 class="font-display text-2xl leading-tight text-mts-text lg:text-3xl">
            <ThemedContentString :content="page.title" />
          </h1>

          <p
            v-if="page.excerpt"
            class="mt-8 border-l-2 border-mts-accent pl-6 font-body text-lg leading-relaxed text-mts-text-secondary"
          >
            <ThemedContentString :content="page.excerpt" />
          </p>

          <div v-if="bodyHtml" class="mts-markdown mt-10" v-html="bodyHtml" />
        </div>
      </div>

      <CommonPageInquiryForm v-if="page.showInquiryForm" :source-page="`projects/${slug}`" />
    </article>
  </div>
</template>
