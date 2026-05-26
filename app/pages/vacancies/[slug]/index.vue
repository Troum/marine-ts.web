<script setup lang="ts">
import { MapPin, Briefcase, Loader2 } from 'lucide-vue-next'
import HeroBreadcrumbsRow from '~/components/common/HeroBreadcrumbsRow.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { contentBodyToSafeHtml, isRichTextEmpty } from '~/composables/useMarkdownSafeHtml'

import { plainMetaString } from '~/utils/adminThemedTextCodec'

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

usePublicSeoMeta(computed(() => {
  const v = vacancy.value
  if (!v) {
    return {}
  }
  return {
    title: plainMetaString(v.seoTitle) || plainMetaString(v.title) || slug.value,
    description: plainMetaString(v.seoDescription) || plainMetaString(v.excerpt) || undefined,
    keywords: plainMetaString(v.seoKeywords) || undefined,
    image: v.seoImage || undefined,
    type: 'article' as const,
  }
}))

function hasVacancyContent(text: string | null | undefined) {
  if (!text) {
    return false
  }
  return !isRichTextEmpty(text)
}

function vacancyContentHtml(text: string | null | undefined) {
  return text ? contentBodyToSafeHtml(text) : ''
}
</script>

<template>
  <div class="bg-white pt-16">
    <div v-if="pending" class="flex justify-center py-24">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!vacancy" class="mts-content-wrap py-24 text-center">
      <div class="mx-auto max-w-7xl">
        <p class="mb-6 font-body text-muted">{{ t('pages.common.notFoundVacancy') }}</p>
        <NuxtLink :to="localePath('/vacancies')" class="btn-primary inline-flex">{{ t('pages.common.toVacancies') }}</NuxtLink>
      </div>
    </div>
    <article v-else class="relative overflow-hidden pb-24">
      <div class="relative z-10 mts-content-wrap">
        <div class="mx-auto max-w-7xl">
          <HeroBreadcrumbsRow :items="crumbItems" />

        <div class="mb-4 flex flex-wrap items-center gap-3">
          <span class="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-primary">
            <Briefcase class="h-3.5 w-3.5" />
            {{ vacancy.employmentType || t('pages.common.vacancyDefault') }}
          </span>
        </div>

        <h1 class="mts-figma-hero-h1 text-body">
          <ThemedContentString :content="vacancy.title" />
        </h1>

        <div v-if="vacancy.location" class="mt-6 flex items-center gap-2 font-body text-sm text-muted">
          <MapPin class="h-4 w-4" />
          <ThemedContentString :content="vacancy.location" />
        </div>

        <p class="mts-figma-hero-lead mt-10 border-l-2 border-primary pl-6 text-muted">
          <ThemedContentString :content="vacancy.excerpt" />
        </p>

        <div
          v-if="hasVacancyContent(vacancy.content)"
          class="mts-markdown mt-10 font-body leading-relaxed text-body [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4"
          v-html="vacancyContentHtml(vacancy.content)"
        />

        <div v-if="vacancy.requirements?.length" class="card-tech corner-accent mt-12 p-8">
          <h2 class="font-display text-xl text-body mb-4">{{ t('pages.common.requirements') }}</h2>
          <ul class="mts-arrow-bullets list-none space-y-2 font-body text-sm text-muted">
            <li v-for="(req, i) in vacancy.requirements" :key="i">{{ req }}</li>
          </ul>
        </div>

        <div class="card-tech mt-12 space-y-4 p-8">
          <p class="font-body text-sm text-muted">
            {{ t('pages.vacancies.applyNote') }}
          </p>
          <NuxtLink :to="localePath(`/vacancies/${vacancy.slug}/application-form`)" class="btn-primary inline-flex">
            {{ t('pages.vacancies.applyButton') }}
          </NuxtLink>
          <p class="font-body text-xs text-muted">
            {{ t('pages.vacancies.applyAlt') }}
            <a href="mailto:crewing@marin-ts.com" class="text-primary hover:underline">crewing@marin-ts.com</a>
          </p>
        </div>
        </div>
      </div>
    </article>
  </div>
</template>
