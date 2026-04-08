<script setup lang="ts">
import { MapPin, Users, Award, Clock, Check } from 'lucide-vue-next'
import ButtonLink from '~/components/common/ButtonLink.vue'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ImageFadeCarousel from '~/components/common/ImageFadeCarousel.vue'
import AboutServiceGeographyMap from '~/components/about/ServiceGeographyMap.vue'
import { aboutCarouselSlides } from '~/utils/aboutCarouselSlides'

useSiteSeoMeta('about')

const { t } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.about'), to: '/about' }),
)

const advantages = computed(() => [
  { icon: MapPin, text: t('pages.about.adv1') },
  { icon: Users, text: t('pages.about.adv2') },
  { icon: Award, text: t('pages.about.adv3') },
  { icon: Clock, text: t('pages.about.adv4') },
])

const certificates = computed(() => [
  { name: 'ISO 9001:2015', desc: t('pages.about.certIsoQ') },
  { name: 'ISO 14001:2015', desc: t('pages.about.certIsoE') },
  { name: 'ISO 45001:2018', desc: t('pages.about.certIsoS') },
])
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative py-24 lg:py-32 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="absolute top-0 left-1/3 w-px h-full bg-mts-border" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="crumbItems" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ t('nav.about') }}</span>
          </div>
          <h1 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
            {{ t('pages.about.heroTitle') }}<span class="text-mts-accent">{{ t('pages.about.heroAccent') }}</span>{{ t('pages.about.heroEnd') }}
          </h1>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            {{ t('pages.about.heroLead') }}
          </p>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="grid lg:grid-cols-2 gap-16 items-start">
          <div class="relative">
            <div class="absolute -top-2 -left-2 z-20 w-6 h-6 border-t-2 border-l-2 border-mts-accent pointer-events-none" />
            <div class="absolute -bottom-2 -right-2 z-20 w-6 h-6 border-b-2 border-r-2 border-mts-accent pointer-events-none" />
            <ImageFadeCarousel :slides="aboutCarouselSlides" :aria-label="t('pages.about.carouselAria')" />
            <div class="absolute -bottom-4 -right-4 z-30 bg-white border border-mts-border shadow-tech p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-mts-accent flex items-center justify-center">
                  <Check class="w-5 h-5 text-white" />
                </div>
                <div>
                  <p class="font-mono text-2xl font-medium text-mts-text">100%</p>
                  <p class="font-mono text-[9px] uppercase tracking-wide text-mts-text-secondary">{{ t('pages.about.compliance') }}</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 class="font-display text-2xl text-mts-text mb-6">{{ t('pages.about.mission') }}</h2>
            <p class="font-body text-mts-text-secondary leading-relaxed mb-6">
              {{ t('pages.about.missionText') }}
            </p>
            <ul class="space-y-4 mb-8">
              <li v-for="a in advantages" :key="a.text" class="flex items-start gap-3">
                <component :is="a.icon" class="w-5 h-5 text-mts-accent flex-shrink-0 mt-0.5" />
                <span class="font-body text-mts-text-secondary">{{ a.text }}</span>
              </li>
            </ul>
            <ButtonLink :title="t('pages.about.ctaContact')" link="/contacts" />
          </div>
        </div>
      </div>
    </section>

    <AboutServiceGeographyMap />

    <section class="relative pt-10 pb-24 lg:pt-12 lg:pb-28 bg-white overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <h2 class="font-display text-2xl text-mts-text mb-8 text-center">{{ t('pages.about.certificates') }}</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="c in certificates" :key="c.name" class="card-tech p-6 text-center">
            <p class="font-mono text-sm text-mts-accent mb-2">{{ c.name }}</p>
            <p class="font-body text-sm text-mts-text-secondary">{{ c.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
