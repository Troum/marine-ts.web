<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import { contentBodyToSafeHtml } from '~/composables/useMarkdownSafeHtml'

const route = useRoute()
const slug = computed(() => {
  const s = route.params.slug
  return Array.isArray(s) ? (s[0] ?? '') : (s as string)
})
const api = useMarineApi()

const pageKey = computed(() => `content-page-project-${slug.value}`)

const { data: page, pending } = await useAsyncData(
  pageKey,
  async () => {
    try {
      return await api.contentPages.getPublicBySlug(slug.value)
    } catch {
      return null
    }
  },
  { watch: [slug] },
)

const bodyHtml = computed(() => {
  const body = page.value?.body
  if (!body) {
    return ''
  }
  return contentBodyToSafeHtml(body)
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
    <div v-else-if="!page" class="mx-auto max-w-3xl px-6 py-24 text-center">
      <p class="mb-6 font-body text-mts-text-secondary">Страница не найдена или не опубликована.</p>
      <NuxtLink to="/projects" class="btn-primary inline-flex">К проектам</NuxtLink>
    </div>
    <article v-else class="relative overflow-hidden pb-24">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="relative z-10 mx-auto max-w-3xl px-6 lg:px-12">
        <Breadcrumbs
          class="mb-8"
          :items="[
            { label: 'Главная', to: '/' },
            { label: 'Проекты', to: '/projects' },
            { label: page.title },
          ]"
        />

        <h1 class="font-display text-3xl leading-tight text-mts-text lg:text-4xl">
          {{ page.title }}
        </h1>

        <p
          v-if="page.excerpt"
          class="mt-8 border-l-2 border-mts-accent pl-6 font-body text-lg leading-relaxed text-mts-text-secondary"
        >
          {{ page.excerpt }}
        </p>

        <div v-if="bodyHtml" class="mts-markdown mt-10" v-html="bodyHtml" />
      </div>
    </article>
  </div>
</template>
