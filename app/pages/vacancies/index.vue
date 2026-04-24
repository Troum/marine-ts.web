<script setup lang="ts">
import { MapPin, Briefcase, Loader2, ArrowRight } from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ListingHeroShell from '~/components/common/ListingHeroShell.vue'
import type { MarineContentLocale, VacancyItem, VacanciesPageData } from '~/types'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { defaultListingData, listingDefaultOrder, mergeListingPageData } from '~/utils/pageDefaults'
import { isSectionVisible, resolveSectionOrder } from '~/utils/sectionVisibility'

useSiteSeoMeta('vacancies')

const { t, locale } = useI18n()
const localePath = useLocalePath()
const applicationFormHref = computed(() => localePath('/application-form'))
const { breadcrumbs } = usePageBreadcrumbs()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const api = useMarineApi()

const { data: cmsPage } = await useAsyncData('vacancies-page-cms', async () => {
  try {
    return await api.contentPages.getPublicBySlug('vacancies-page')
  } catch {
    return null
  }
}, { server: true })

const cms = computed<VacanciesPageData>(() => {
  const body = cmsPage.value?.body
  if (body) {
    try {
      const p = JSON.parse(body) as unknown
      if (p && typeof p === 'object' && 'hero' in (p as object)) {
        return mergeListingPageData('vacancies-page', loc.value, p) as VacanciesPageData
      }
    } catch {
      /* use defaults */
    }
  }
  return defaultListingData('vacancies-page', loc.value) as VacanciesPageData
})

const crumbItems = computed(() => breadcrumbs({ label: t('nav.vacancies'), to: '/vacancies' }))

const vacancies = ref<VacancyItem[]>([])
const pending = ref(true)
const error = ref('')

async function load() {
  pending.value = true
  error.value = ''
  try {
    vacancies.value = await api.vacancies.getAll()
  } catch {
    error.value = t('pages.vacancies.loadError')
  } finally {
    pending.value = false
  }
}

onMounted(load)

const sectionOrderEffective = computed(() =>
  resolveSectionOrder(cms.value.sectionOrder, listingDefaultOrder('vacancies-page'), cms.value.customSections),
)

function sectionShown(id: string): boolean {
  return isSectionVisible(cms.value.sectionVisibility, id)
}
</script>

<template>
  <div class="bg-mts-bg">
    <ListingHeroShell :hero-image="cms.heroImage">
      <div class="max-w-7xl">
        <Breadcrumbs :items="crumbItems" />
        <div class="mb-4 flex items-center gap-3">
          <div class="h-px w-6 bg-mts-accent" />
          <span class="section-label">{{ t('pages.vacancies.labelCareer') }}</span>
        </div>
        <h1 class="font-display mb-6 text-3xl leading-tight text-mts-text lg:text-4xl">
          <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
        </h1>
        <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
        <p class="font-body text-lg leading-relaxed text-mts-text-secondary">
          <ThemedContentString :content="cms.hero.lead" />
        </p>
        <div class="mt-8">
          <NuxtLink :to="applicationFormHref" class="btn-primary inline-flex items-center justify-center">
            {{ t('pages.vacancies.openApplicationButton') }}
          </NuxtLink>
        </div>
      </div>
    </ListingHeroShell>

    <template v-for="sid in sectionOrderEffective" :key="sid">
      <template v-if="sid === 'listing' && sectionShown('listing')">
        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
        </div>
        <div v-else-if="error" class="py-24 text-center">
          <p class="mb-4 font-body text-mts-text-secondary">{{ error }}</p>
          <button type="button" class="btn-primary" @click="load">{{ t('pages.common.tryAgain') }}</button>
        </div>
        <section v-else class="relative bg-mts-bg pb-24 pt-8 lg:pt-12">
          <div class="relative z-10 mts-content-wrap">
            <div v-if="vacancies.length === 0" class="py-16 text-center font-body text-mts-text-secondary">
              {{ t('pages.vacancies.emptyHtml') }}
              <a href="mailto:info@marin-ts.com" class="text-mts-accent hover:underline">info@marin-ts.com</a>.
            </div>
            <div v-else class="grid grid-cols-1 gap-px bg-mts-border md:grid-cols-2">
              <article
                v-for="v in vacancies"
                :key="v.id"
                class="min-w-0 bg-mts-bg p-8"
              >
                <div class="mb-3 flex flex-wrap items-center gap-2">
                  <Briefcase class="h-4 w-4 shrink-0 text-mts-accent" aria-hidden="true" />
                  <span v-if="v.employmentType" class="section-label text-[10px]">
                    {{ v.employmentType }}
                  </span>
                </div>
                <h2 class="font-display text-lg text-mts-text leading-snug">
                  <NuxtLink :to="localePath(`/vacancies/${v.slug}`)" class="text-mts-text">
                    <ThemedContentString :content="v.title" />
                  </NuxtLink>
                </h2>
                <p class="mt-3 line-clamp-3 font-body text-sm leading-relaxed text-mts-text-secondary">
                  <ThemedContentString :content="v.excerpt" />
                </p>
                <div v-if="v.location" class="mt-4 flex items-center gap-2 font-body text-xs text-mts-text-secondary">
                  <MapPin class="h-3.5 w-3.5 shrink-0 text-mts-accent/80" aria-hidden="true" />
                  <ThemedContentString :content="v.location" />
                </div>
                <NuxtLink
                  :to="localePath(`/vacancies/${v.slug}`)"
                  class="mts-cta-link-compact mt-6 inline-flex"
                >
                  {{ t('pages.common.readMore') }} →
                </NuxtLink>
              </article>
            </div>
          </div>
        </section>
      </template>

      <section
        v-else-if="sid === 'cta' && sectionShown('cta')"
        class="relative border-t border-mts-border bg-mts-surface py-16"
      >
        <div class="mts-content-wrap text-center">
          <div class="mx-auto max-w-7xl">
            <h2 class="font-display mb-4 text-xl text-mts-text">
              <ThemedContentString :content="cms.cta?.title || t('pages.vacancies.ctaTitle')" />
            </h2>
            <NuxtLink :to="localePath('/request')" class="btn-primary group inline-flex items-center">
              <ThemedContentString :content="cms.cta?.buttonText || t('pages.vacancies.ctaButton')" />
              <ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <CommonCustomPageSectionsRender
        v-else-if="sid.startsWith('custom:') && sectionShown(sid)"
        :sections="(cms.customSections ?? []).filter((s) => `custom:${s.id}` === sid)"
      />
    </template>

    <CommonPageInquiryForm v-if="cms.showInquiryForm" source-page="vacancies" />
  </div>
</template>
