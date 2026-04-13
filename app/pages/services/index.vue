<script setup lang="ts">
import { ArrowRight, Check, Loader2 } from 'lucide-vue-next'
import ButtonLink from '~/components/common/ButtonLink.vue'
import type { ServiceItem, ListingPageData, MarineContentLocale } from '~/types'
import { resolveServiceIcon } from '~/utils/serviceIcons'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import { defaultListingData } from '~/utils/pageDefaults'

useSiteSeoMeta('services')

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const { data: cmsPage } = await useAsyncData('services-page-cms', async () => {
  try { return await api.contentPages.getPublicBySlug('services-page') } catch { return null }
}, { server: true })

const cms = computed<ListingPageData>(() => {
  const body = cmsPage.value?.body
  if (body) { try { const p = JSON.parse(body); if (p?.hero) return p } catch { /* */ } }
  return defaultListingData('services-page', loc.value)
})

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.services'), to: '/services' }),
)

const { data: services, pending, error } = await useAsyncData(
  () => `marine-services-${locale.value}`,
  () => api.services.getAll(),
  { default: () => [] as ServiceItem[] },
)
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative py-24 lg:py-32 overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="crumbItems" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ t('nav.services') }}</span>
          </div>
          <h1 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
            {{ cms.hero.title }}<span class="text-mts-accent">{{ cms.hero.titleAccent }}</span
            >{{ cms.hero.titleEnd }}
          </h1>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            {{ cms.hero.lead }}
          </p>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="w-10 h-10 text-mts-accent animate-spin" />
        </div>
        <p v-else-if="error" class="text-center font-body text-mts-text-secondary py-12">
          {{ t('pages.services.loadError') }}
        </p>
        <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="service in services"
            :key="service.id"
            class="card-tech p-8 border border-mts-border hover:border-mts-accent/40 transition-colors"
          >
            <component :is="resolveServiceIcon(service.iconKey)" class="w-8 h-8 text-mts-accent mb-4" />
            <h3 class="font-display text-xl text-mts-text mb-3">{{ service.title }}</h3>
            <p class="font-body text-sm text-mts-text-secondary mb-6">{{ service.description }}</p>
            <ul class="space-y-2 mb-6">
              <li
                v-for="f in service.features"
                :key="f"
                class="flex items-center gap-2 font-mono text-[10px] text-mts-text-secondary"
              >
                <Check class="w-3 h-3 text-mts-accent shrink-0" />
                {{ f }}
              </li>
            </ul>
            <NuxtLink
              v-if="service.contentPage?.slug"
              :to="localePath(`/services/${service.contentPage.slug}`)"
              class="btn-primary px-4 py-2 text-[11px]"
            >
              {{ t('pages.common.readMore') }}
              <ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </NuxtLink>
          </div>
        </div>
        <div class="flex justify-center items-center mt-16">
          <ButtonLink :title="cms.cta?.buttonText || t('pages.services.ctaConsult')" link="/contacts" />
        </div>
      </div>
    </section>
  </div>
</template>
