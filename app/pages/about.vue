<script setup lang="ts">
import {
  Wrench, Ship, Users, Layers, ShieldCheck, Leaf, Target, Check,
  Anchor, Settings, Award, Compass, Gauge, Truck, Globe, Zap, Hammer, HeartPulse, Factory,
  FileDown,
} from 'lucide-vue-next'
import type { AboutPageData, AboutGeoLocation } from '~/types'
import ButtonLink from '~/components/common/ButtonLink.vue'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ImageFadeCarousel from '~/components/common/ImageFadeCarousel.vue'
import AboutServiceGeographyMap from '~/components/about/ServiceGeographyMap.vue'
import { aboutCarouselSlides } from '~/utils/aboutCarouselSlides'
import { defaultAboutData } from '~/utils/aboutPageDefaults'

useSiteSeoMeta('about')

const { t, locale } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.about'), to: '/about' }),
)

const ICON_MAP: Record<string, object> = {
  Wrench, Ship, Users, Layers, ShieldCheck, Leaf, Target,
  Anchor, Settings, Award, Compass, Gauge, Truck, Globe, Zap, Hammer, HeartPulse, Factory,
}

function resolveIcon(name: string) {
  return ICON_MAP[name] ?? Wrench
}

const cms = ref<AboutPageData | null>(null)

onMounted(async () => {
  try {
    const page = await api.contentPages.getPublicBySlug('about')
    if (page?.body) {
      const parsed = JSON.parse(page.body)
      if (parsed?.hero) {
        cms.value = parsed
      }
    }
  } catch {
    // Fall back to i18n defaults
  }
})

const d = computed<AboutPageData>(() => {
  if (cms.value) return cms.value
  const loc = (locale.value === 'en' ? 'en' : 'ru') as 'ru' | 'en'
  return defaultAboutData(loc)
})

const geoLocations = computed<AboutGeoLocation[]>(() => d.value.geography.locations)
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <!-- Hero -->
    <section class="relative py-24 lg:py-32 overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="crumbItems" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ t('nav.about') }}</span>
          </div>
          <h1 class="font-display text-5xl lg:text-6xl text-mts-text leading-tight mb-4">
            {{ d.hero.title }}<span class="text-mts-accent">{{ d.hero.titleAccent }}</span>{{ d.hero.titleEnd }}
          </h1>
          <p class="font-display text-xl lg:text-2xl text-mts-text-secondary mb-6">
            {{ d.hero.subtitle }}
          </p>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed mb-4">
            {{ d.hero.lead }}
          </p>
          <p class="font-body text-lg text-mts-text leading-relaxed font-medium">
            {{ d.hero.lead2 }}
          </p>
        </div>
      </div>
    </section>

    <!-- Carousel + Ecosystem -->
    <section class="relative py-24 overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="grid lg:grid-cols-2 gap-16 items-start">
          <div class="relative">
            <CommonAccentCorners size="lg" bottom="bottom-6" />
            <ImageFadeCarousel :slides="aboutCarouselSlides" :aria-label="t('pages.about.carouselAria')" />
            <div class="absolute bottom-6 -right-3 z-30 bg-white border border-mts-border shadow-tech p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-mts-accent flex items-center justify-center">
                  <Check class="w-5 h-5 text-white" />
                </div>
                <div>
                  <p class="font-mono text-2xl font-medium text-mts-text">100%</p>
                  <p class="font-mono text-xs uppercase tracking-wide text-mts-text-secondary">{{ t('pages.about.compliance') }}</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 class="font-display text-3xl lg:text-4xl text-mts-text mb-4">{{ d.ecosystem.title }}</h2>
            <p class="font-body text-mts-text-secondary leading-relaxed mb-8">
              {{ d.ecosystem.lead }}
            </p>
            <div class="space-y-6">
              <div v-for="svc in d.ecosystem.services" :key="svc.title" class="flex items-start gap-4">
                <div class="w-10 h-10 shrink-0 bg-mts-accent/10 flex items-center justify-center">
                  <component :is="resolveIcon(svc.icon)" class="w-5 h-5 text-mts-accent" />
                </div>
                <div>
                  <h3 class="font-display text-lg text-mts-text mb-1">{{ svc.title }}</h3>
                  <p class="font-body text-sm text-mts-text-secondary leading-relaxed">{{ svc.text }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission: Three Zeros -->
    <section class="relative py-24 overflow-hidden bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl mx-auto text-center mb-14">
          <h2 class="font-display text-3xl lg:text-4xl text-mts-text mb-4">{{ d.mission.title }}</h2>
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            {{ d.mission.lead }}
          </p>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="(p, i) in d.mission.principles" :key="i" class="text-center p-8 border border-mts-border bg-mts-bg">
            <div class="w-12 h-12 mx-auto mb-4 bg-mts-accent/10 flex items-center justify-center">
              <component :is="resolveIcon(p.icon)" class="w-6 h-6 text-mts-accent" />
            </div>
            <p class="font-body text-mts-text leading-relaxed">{{ p.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Why MTS -->
    <section class="relative py-24 overflow-hidden bg-mts-bg">
      <div class="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 text-center">
        <h2 class="font-display text-3xl lg:text-4xl text-mts-text mb-6">{{ d.why.title }}</h2>
        <p class="font-body text-lg text-mts-text-secondary leading-relaxed mb-8">
          {{ d.why.text }}
        </p>
        <ButtonLink :title="d.why.ctaText" link="/contacts" />
      </div>
    </section>

    <!-- Geography Map -->
    <AboutServiceGeographyMap
      :locations="geoLocations"
      :label="d.geography.label"
      :title="d.geography.title"
      :lead="d.geography.lead"
    />

    <!-- Certificates -->
    <section class="relative pt-10 pb-24 lg:pt-12 lg:pb-28 bg-white overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <h2 class="font-display text-3xl text-mts-text mb-8 text-center">{{ d.certificates.title }}</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="c in d.certificates.items" :key="c.name" class="card-tech p-6 text-center">
            <p class="font-mono text-sm text-mts-accent mb-2">{{ c.name }}</p>
            <p class="font-body text-sm text-mts-text-secondary mb-3">{{ c.desc }}</p>
            <a
              v-if="c.fileUrl"
              :href="c.fileUrl"
              target="_blank"
              class="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-mts-accent hover:underline"
            >
              <FileDown class="w-3.5 h-3.5" />
              Скачать
            </a>
          </div>
        </div>
      </div>
    </section>

    <CommonPageInquiryForm v-if="d.showInquiryForm" source-page="about" />
  </div>
</template>
