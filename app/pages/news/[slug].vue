<script setup lang="ts">
import { Calendar, User, Loader2 } from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { newsCategoryLabel } from '~/utils/contentLabels'
import { plainMetaString } from '~/utils/adminThemedTextCodec'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const api = useMarineApi()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()

const { data: article, pending } = await useAsyncData(
  () => `news-article-${locale.value}-${slug.value}`,
  async () => {
    try {
      return await api.news.getBySlug(slug.value)
    } catch {
      return null
    }
  },
  { watch: [slug, locale] },
)

const crumbItems = computed(() => {
  const a = article.value
  if (!a) {
    return breadcrumbs({ label: t('nav.news'), to: '/news' })
  }
  return breadcrumbs({ label: t('nav.news'), to: '/news' }, { label: a.title })
})

watchEffect(() => {
  const item = article.value
  if (!item) {
    return
  }
  useSeoMeta({
    title: plainMetaString(item.seoTitle) || plainMetaString(item.title) || slug.value,
    description: plainMetaString(item.seoDescription) || plainMetaString(item.excerpt) || undefined,
    keywords: plainMetaString(item.seoKeywords) || undefined,
  })
})

function formatContent(text: string | undefined) {
  if (!text) {
    return ''
  }
  return text.split('\n\n').filter(Boolean)
}

const categoryDisplay = computed(() => newsCategoryLabel(article.value?.category, t))
</script>

<template>
  <div class="bg-white pt-16">
    <div v-if="pending" class="flex justify-center py-24">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!article" class="mts-content-wrap py-24 text-center">
      <div class="mx-auto max-w-7xl">
        <p class="mb-6 font-body text-muted">{{ t('pages.common.notFoundNews') }}</p>
        <NuxtLink :to="localePath('/news')" class="btn-primary inline-flex">{{ t('pages.common.toNewsList') }}</NuxtLink>
      </div>
    </div>
    <article v-else class="relative overflow-hidden pb-24">
      <div class="relative z-10 mts-content-wrap">
        <div class="mx-auto max-w-7xl">
          <Breadcrumbs class="mb-8" :items="crumbItems" />

        <div class="mb-6 flex flex-wrap items-center gap-3">
          <span class="inline-block bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-primary">
            {{ categoryDisplay }}
          </span>
          <span
            v-if="article.featured"
            class="inline-block bg-primary px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-white"
          >
            {{ t('pages.common.featured') }}
          </span>
        </div>

        <h1 class="font-display text-2xl leading-tight text-body lg:text-3xl">
          <ThemedContentString :content="article.title" />
        </h1>

        <div class="mt-6 flex flex-wrap items-center gap-6 text-muted">
          <span class="flex items-center gap-2 font-body text-sm">
            <Calendar class="h-4 w-4" />
            {{ article.date }}
          </span>
          <span class="flex items-center gap-2 font-body text-sm">
            <User class="h-4 w-4" />
            <ThemedContentString :content="article.author" />
          </span>
        </div>

        <p class="mt-10 border-l-2 border-primary pl-6 font-body text-lg leading-relaxed text-muted">
          <ThemedContentString :content="article.excerpt" />
        </p>

        <div v-if="article.content" class="prose-mts mt-10 space-y-6">
          <p v-for="(block, i) in formatContent(article.content)" :key="i" class="font-body leading-relaxed text-body">
            {{ block }}
          </p>
        </div>
        </div>
      </div>
    </article>
  </div>
</template>
