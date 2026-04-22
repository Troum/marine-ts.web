<script setup lang="ts">
import { MapPin, Briefcase, Loader2 } from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const api = useMarineApi()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()

const { data: vacancy, pending } = await useAsyncData(
  () => `vacancy-${locale.value}-${slug.value}`,
  async () => {
    try {
      return await api.vacancies.getBySlug(slug.value)
    } catch {
      return null
    }
  },
  { watch: [slug, locale] },
)

const crumbItems = computed(() => {
  const v = vacancy.value
  if (!v) {
    return breadcrumbs({ label: t('nav.vacancies'), to: '/vacancies' })
  }
  return breadcrumbs({ label: t('nav.vacancies'), to: '/vacancies' }, { label: v.title })
})

watchEffect(() => {
  const v = vacancy.value
  if (!v) {
    return
  }
  useSeoMeta({
    title: v.seoTitle || v.title,
    description: v.seoDescription || v.excerpt,
    keywords: v.seoKeywords || undefined,
  })
})

function formatContent(text: string | null | undefined) {
  if (!text) {
    return []
  }
  return text.split('\n\n').filter(Boolean)
}
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <div v-if="pending" class="flex justify-center py-24">
      <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
    </div>
    <div v-else-if="!vacancy" class="mx-auto max-w-3xl px-6 py-24 text-center">
      <p class="mb-6 font-body text-mts-text-secondary">{{ t('pages.common.notFoundVacancy') }}</p>
      <NuxtLink :to="localePath('/vacancies')" class="btn-primary inline-flex">{{ t('pages.common.toVacancies') }}</NuxtLink>
    </div>
    <article v-else class="relative overflow-hidden pb-24">
      <div class="relative z-10 mx-auto max-w-3xl px-6 lg:px-12">
        <Breadcrumbs class="mb-8" :items="crumbItems" />

        <div class="mb-4 flex flex-wrap items-center gap-3">
          <span class="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-mts-accent">
            <Briefcase class="h-3.5 w-3.5" />
            {{ vacancy.employmentType || t('pages.common.vacancyDefault') }}
          </span>
        </div>

        <h1 class="font-display text-3xl leading-tight text-mts-text lg:text-4xl">
          <ThemedContentString :content="vacancy.title" />
        </h1>

        <div v-if="vacancy.location" class="mt-6 flex items-center gap-2 font-body text-sm text-mts-text-secondary">
          <MapPin class="h-4 w-4" />
          <ThemedContentString :content="vacancy.location" />
        </div>

        <p class="mt-10 border-l-2 border-mts-accent pl-6 font-body text-lg leading-relaxed text-mts-text-secondary">
          <ThemedContentString :content="vacancy.excerpt" />
        </p>

        <div v-if="vacancy.content" class="mt-10 space-y-6">
          <p
            v-for="(block, i) in formatContent(vacancy.content)"
            :key="i"
            class="font-body leading-relaxed text-mts-text"
          >
            {{ block }}
          </p>
        </div>

        <div v-if="vacancy.requirements?.length" class="mt-12 border border-mts-border bg-mts-surface p-8">
          <h2 class="font-display text-xl text-mts-text mb-4">{{ t('pages.common.requirements') }}</h2>
          <ul class="list-inside list-disc space-y-2 font-body text-sm text-mts-text-secondary">
            <li v-for="(req, i) in vacancy.requirements" :key="i">{{ req }}</li>
          </ul>
        </div>

        <div class="mt-12 space-y-4 border border-mts-border bg-mts-bg p-8">
          <p class="font-body text-sm text-mts-text-secondary">
            {{ t('pages.vacancies.applyNote') }}
          </p>
          <NuxtLink :to="localePath(`/vacancies/${vacancy.slug}/application-form`)" class="btn-primary inline-flex">
            {{ t('pages.vacancies.applyButton') }}
          </NuxtLink>
          <p class="font-body text-xs text-mts-text-muted">
            {{ t('pages.vacancies.applyAlt') }}
            <a href="mailto:crewing@marin-ts.com" class="text-mts-accent hover:underline">crewing@marin-ts.com</a>
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
