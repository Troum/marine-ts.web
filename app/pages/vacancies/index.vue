<script setup lang="ts">
import { MapPin, Briefcase, Loader2, ArrowRight } from 'lucide-vue-next'
import HeroBreadcrumbsRow from '~/components/common/HeroBreadcrumbsRow.vue'
import ListingHeroShell from '~/components/common/ListingHeroShell.vue'
import type { MarineContentLocale, VacancyItem, VacanciesPageData } from '~/types'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import MarinReveal from '~/components/about/MarinReveal.vue'
import { defaultListingData, listingDefaultOrder, mergeListingPageData } from '~/utils/pageDefaults'
import { resolveHeroBreadcrumbOnDark } from '~/utils/pageBreadcrumbTone'
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

const { setHidden: setFooterHidden } = usePageFooterHidden()
watchEffect(() => { setFooterHidden(cms.value?.hideFooter ?? false) })

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

const sectionOrderEffective = computed(() =>
  resolveSectionOrder(cms.value.sectionOrder, listingDefaultOrder('vacancies-page'), cms.value.customSections),
)

function sectionShown(id: string): boolean {
  return isSectionVisible(cms.value.sectionVisibility, id)
}

const hasHeroPhoto = computed(() => Boolean(cms.value.heroImage?.trim()))
const heroParallaxActive = ref(false)
const heroBreadcrumbsOnDark = computed(() =>
  resolveHeroBreadcrumbOnDark(cms.value.heroBreadcrumbTone, hasHeroPhoto.value),
)

onMounted(() => {
  heroParallaxActive.value = true
  load()
})
</script>

<template>
  <div class="bg-white">
    <ListingHeroShell
      :hero-image="cms.heroImage"
      full-viewport
      :hero-veil="hasHeroPhoto"
      :parallax-media-active="hasHeroPhoto ? heroParallaxActive : true"
      :hero-content-parallax="hasHeroPhoto"
    >
      <div :class="['max-w-7xl', hasHeroPhoto && 'pt-8 lg:pt-14']">
        <template v-if="hasHeroPhoto">
          <MarinReveal>
            <HeroBreadcrumbsRow
              :items="crumbItems"
              :on-dark-hero="heroBreadcrumbsOnDark"
            />
          </MarinReveal>
          <MarinReveal :delay-ms="120">
            <div class="mts-figma-hero-stack">
              <h1
                class="mts-figma-hero-h1 mts-hero-themed-copy max-w-[1055px] text-white drop-shadow-md"
              >
                <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
              </h1>
              <p
                class="mts-figma-hero-lead mts-hero-themed-copy max-w-[895px] text-white/95 drop-shadow"
              >
                <ThemedContentString :content="cms.hero.lead" />
              </p>
            </div>
          </MarinReveal>
          <MarinReveal :delay-ms="260">
            <div class="mt-8">
              <NuxtLink :to="applicationFormHref" class="btn-primary inline-flex items-center justify-center">
                {{ t('pages.vacancies.openApplicationButton') }}
              </NuxtLink>
            </div>
          </MarinReveal>
        </template>
        <template v-else>
          <HeroBreadcrumbsRow :items="crumbItems" />
          <div class="mts-figma-hero-stack">
            <h1 class="mts-figma-hero-h1 text-body">
              <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
            </h1>
            <p class="mts-figma-hero-lead text-muted">
              <ThemedContentString :content="cms.hero.lead" />
            </p>
          </div>
          <div class="mt-8">
            <NuxtLink :to="applicationFormHref" class="btn-primary inline-flex items-center justify-center">
              {{ t('pages.vacancies.openApplicationButton') }}
            </NuxtLink>
          </div>
        </template>
      </div>
    </ListingHeroShell>

    <template v-for="sid in sectionOrderEffective" :key="sid">
      <template v-if="sid === 'listing' && sectionShown('listing')">
        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
        <div v-else-if="error" class="py-24 text-center">
          <p class="mb-4 font-body text-muted">{{ error }}</p>
          <button type="button" class="btn-primary" @click="load">{{ t('pages.common.tryAgain') }}</button>
        </div>
        <section v-else class="relative bg-white pb-24 pt-8 lg:pt-12">
          <div class="relative z-10 mts-content-wrap">
            <div v-if="vacancies.length === 0" class="py-16 text-center font-body text-muted">
              {{ t('pages.vacancies.emptyHtml') }}
              <a href="mailto:info@marin-ts.com" class="text-primary hover:underline">info@marin-ts.com</a>.
            </div>
            <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <article
                v-for="v in vacancies"
                :key="v.id"
                class="service-card corner-accent min-w-0 p-8"
              >
                <div class="mb-3 flex flex-wrap items-center gap-2">
                  <Briefcase class="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span v-if="v.employmentType" class="section-label text-[10px]">
                    {{ v.employmentType }}
                  </span>
                </div>
                <h2 class="mts-figma-card-title text-body leading-snug">
                  <NuxtLink :to="localePath(`/vacancies/${v.slug}`)" class="text-body">
                    <ThemedContentString :content="v.title" />
                  </NuxtLink>
                </h2>
                <p class="mt-3 line-clamp-3 font-body text-sm leading-relaxed text-muted">
                  <ThemedContentString :content="v.excerpt" />
                </p>
                <div v-if="v.location" class="mt-4 flex items-center gap-2 font-body text-xs text-muted">
                  <MapPin class="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden="true" />
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
        class="relative border-t border-border bg-bg-light py-16"
      >
        <div class="mts-content-wrap text-center">
          <div class="mx-auto max-w-7xl">
            <h2 class="mts-figma-section-h2 text-body mb-4">
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
        :page-crumb-items="crumbItems"
      />
    </template>

    <CommonPageInquiryForm
      v-if="cms.showInquiryForm"
      source-page="vacancies"
      :hide-intro="cms.hideInquiryFormIntro === true"
      :hide-form-card-heading="cms.hideInquiryFormCardHeading === true"
      :config="cms.inquiryForm"
    />
  </div>
</template>
