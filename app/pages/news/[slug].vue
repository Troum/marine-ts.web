<script setup lang="ts">
import { Calendar, User, Loader2 } from 'lucide-vue-next'
import Breadcrumbs from "~/components/common/Breadcrumbs.vue";

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const api = useMarineApi()

const { data: article, pending } = await useAsyncData(
  () => `news-article-${slug.value}`,
  async () => {
    try {
      return await api.news.getBySlug(slug.value)
    } catch {
      return null
    }
  },
  { watch: [slug] },
)

watchEffect(() => {
  const item = article.value
  if (!item) {
    return
  }
  useSeoMeta({
    title: item.seoTitle || item.title,
    description: item.seoDescription || item.excerpt,
    keywords: item.seoKeywords || undefined,
  })
})

function formatContent(text: string | undefined) {
  if (!text) {
    return ''
  }
  return text.split('\n\n').filter(Boolean)
}
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <div v-if="pending" class="flex justify-center py-24">
      <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
    </div>
    <div v-else-if="!article" class="mx-auto max-w-3xl px-6 py-24 text-center">
      <p class="mb-6 font-body text-mts-text-secondary">Новость не найдена или была удалена.</p>
      <NuxtLink to="/news" class="btn-primary inline-flex">К списку новостей</NuxtLink>
    </div>
    <article v-else class="relative overflow-hidden pb-24">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="relative z-10 mx-auto max-w-3xl px-6 lg:px-12">
        <Breadcrumbs
          class="mb-8"
          :items="[
            { label: 'Главная', to: '/' },
            { label: 'Новости', to: '/news' },
            { label: article.title },
          ]"
        />

        <div class="mb-6 flex flex-wrap items-center gap-3">
          <span class="inline-block bg-mts-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-mts-accent">
            {{ article.category }}
          </span>
          <span
            v-if="article.featured"
            class="inline-block bg-mts-accent px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-white"
          >
            Главная новость
          </span>
        </div>

        <h1 class="font-display text-3xl leading-tight text-mts-text lg:text-4xl">
          {{ article.title }}
        </h1>

        <div class="mt-6 flex flex-wrap items-center gap-6 text-mts-text-secondary">
          <span class="flex items-center gap-2 font-body text-sm">
            <Calendar class="h-4 w-4" />
            {{ article.date }}
          </span>
          <span class="flex items-center gap-2 font-body text-sm">
            <User class="h-4 w-4" />
            {{ article.author }}
          </span>
        </div>

        <p class="mt-10 border-l-2 border-mts-accent pl-6 font-body text-lg leading-relaxed text-mts-text-secondary">
          {{ article.excerpt }}
        </p>

        <div v-if="article.content" class="prose-mts mt-10 space-y-6">
          <p v-for="(block, i) in formatContent(article.content)" :key="i" class="font-body leading-relaxed text-mts-text">
            {{ block }}
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
