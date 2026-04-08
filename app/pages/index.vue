<script setup lang="ts">
import { ChevronDown, Ship, MapPin, Users, Calendar } from 'lucide-vue-next'
import ButtonLink from '~/components/common/ButtonLink.vue'
import ImageFadeCarousel from '~/components/common/ImageFadeCarousel.vue'
import { aboutCarouselSlides } from '~/utils/aboutCarouselSlides'

useSiteSeoMeta('home')

const { t } = useI18n()
const localePath = useLocalePath()

const isVisible = ref(false)

onMounted(() => {
  isVisible.value = true
})

function scrollToAbout() {
  document.querySelector('#about-section')?.scrollIntoView({ behavior: 'smooth' })
}

const stats = computed(() => [
  { value: '150+', label: t('home.stats.ships'), icon: Ship },
  { value: '15', label: t('home.stats.ports'), icon: MapPin },
  { value: '50+', label: t('home.stats.engineers'), icon: Users },
  { value: '14', label: t('home.stats.years'), icon: Calendar },
])

const services = computed(() => [
  {
    title: t('home.services.hullTitle'),
    description: t('home.services.hullDesc'),
    image: '/images/services/hull.jpg',
  },
  {
    title: t('home.services.engineTitle'),
    description: t('home.services.engineDesc'),
    image: '/images/services/general.jpg',
  },
  {
    title: t('home.services.electroTitle'),
    description: t('home.services.electroDesc'),
    image: '/images/services/electro.jpg',
  },
])

const processSteps = computed(() => [
  {
    title: t('home.process.step1Title'),
    text: t('home.process.step1Text'),
    badge: '/images/steps/1.svg',
  },
  {
    title: t('home.process.step2Title'),
    text: t('home.process.step2Text'),
    badge: '/images/steps/2.svg',
  },
  {
    title: t('home.process.step3Title'),
    text: t('home.process.step3Text'),
    badge: '/images/steps/3.svg',
  },
])
</script>

<template>
  <div class="bg-mts-bg">
    <section class="relative min-h-screen flex items-center overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-50" />
      <div class="absolute top-0 left-1/4 w-px h-full bg-linear-to-b from-transparent via-mts-border to-transparent" />
      <div class="absolute top-0 right-1/4 w-px h-full bg-linear-to-b from-transparent via-mts-border to-transparent" />

      <div class="absolute inset-0">
        <div
          :class="[
            'absolute inset-0 bg-cover bg-center transition-all duration-1000',
            isVisible ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          ]"
          style="background-image: url(/hero-bg.jpg)"
        />
        <div class="absolute inset-0 bg-linear-to-r from-mts-bg via-mts-bg/95 to-mts-bg/80" />
        <div class="absolute inset-0 bg-linear-to-t from-mts-bg via-transparent to-mts-bg/60" />
      </div>

      <div class="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-20">
        <div class="grid lg:grid-cols-5 gap-12 items-start">
          <div class="lg:col-span-3 max-w-2xl">
            <div
              :class="[
                'flex items-center gap-3 mb-6 transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <div class="w-8 h-px bg-mts-accent" />
              <span class="section-label">{{ t('home.hero.label') }}</span>
            </div>

            <h1
              :class="[
                'font-display text-4xl sm:text-5xl lg:text-6xl text-mts-text leading-[1.1] mb-6 transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              {{ t('home.hero.titleLine1') }}
              <br />
              <span class="text-mts-accent">{{ t('home.hero.titleAccent') }}</span>{{ t('home.hero.titleSuffix') }}
            </h1>

            <p
              :class="[
                'font-body text-base text-mts-text-secondary max-w-lg mb-8 leading-relaxed transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              {{ t('home.hero.lead') }}
            </p>

            <div
              :class="[
                'flex flex-wrap gap-4 mb-10 transform transition-all duration-600 items-center',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <ButtonLink :title="t('home.hero.ctaConsult')" link="/contacts" :asButton="true" />
              <NuxtLink :to="localePath('/services')" class="btn-secondary">{{ t('home.hero.ctaServices') }}</NuxtLink>
            </div>

            <div
              :class="[
                'flex items-center gap-8 transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">ISO</span>
                  <span class="font-mono text-[10px] text-mts-text-secondary ml-1">{{ t('home.hero.badgeIso') }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">IACS</span>
                  <span class="font-mono text-[10px] text-mts-text-secondary ml-1">{{ t('home.hero.badgeIacs') }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">14+</span>
                  <span class="font-mono text-[10px] text-mts-text-secondary ml-1">{{ t('home.hero.badgeYears') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            :class="[
              'lg:col-span-2 transform transition-all duration-700',
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
            ]"
          >
            <div class="card-tech corner-accent p-6">
              <div class="flex items-center gap-2 mb-6">
                <div class="w-2 h-2 bg-mts-accent animate-pulse" />
                <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  {{ t('home.statsCard.label') }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div v-for="stat in stats" :key="stat.label" class="p-4 bg-mts-bg border border-mts-border">
                  <component :is="stat.icon" class="w-5 h-5 text-mts-accent mb-2" />
                  <p class="font-mono text-2xl font-medium text-mts-accent mb-1">{{ stat.value }}</p>
                  <p class="font-mono text-[9px] uppercase tracking-wide text-mts-text-secondary">{{ stat.label }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          :class="[
            'absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-mts-text-secondary hover:text-mts-accent transition-all duration-300 transform',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          ]"
          @click="scrollToAbout"
        >
          <span class="font-mono text-[10px] uppercase tracking-wide">{{ t('home.hero.scroll') }}</span>
          <ChevronDown class="block w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>

    <section id="about-section" class="relative py-24 lg:py-32 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="absolute top-0 left-1/3 w-px h-full bg-mts-border" />

      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-mts-accent" />
              <span class="section-label">{{ t('home.about.label') }}</span>
            </div>
            <h2 class="font-display text-3xl lg:text-4xl text-mts-text leading-tight mb-6">
              {{ t('home.about.title') }} <span class="text-mts-accent">{{ t('home.about.titleAccent') }}</span>{{ t('home.about.titleEnd') }}
            </h2>
            <div class="w-12 h-0.5 bg-mts-accent mb-6" />
            <p class="font-body text-mts-text-secondary leading-relaxed mb-6">
              {{ t('home.about.text') }}
            </p>
            <ButtonLink :title="t('home.about.more')" link="/about" />
          </div>
          <div class="relative">
            <div class="absolute -top-2 -left-2 z-20 w-6 h-6 border-t-2 border-l-2 border-mts-accent pointer-events-none" />
            <div class="absolute -bottom-2 -right-2 z-20 w-6 h-6 border-b-2 border-r-2 border-mts-accent pointer-events-none" />
            <ImageFadeCarousel :slides="aboutCarouselSlides" />
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-24 lg:py-32 overflow-hidden bg-white">
      <div class="absolute inset-0 grid-bg opacity-20" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="flex items-start justify-between mb-12">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-mts-accent" />
              <span class="section-label">{{ t('home.services.label') }}</span>
            </div>
            <h2 class="font-display text-3xl lg:text-4xl text-mts-text">
              {{ t('home.services.heading') }}<span class="text-mts-accent">{{ t('home.services.headingAccent') }}</span>{{ t('home.services.headingEnd') }}
            </h2>
          </div>
          <ButtonLink :title="t('home.services.all')" link="/services" extra-class="hidden lg:inline-flex" />
        </div>

        <div class="grid md:grid-cols-3 gap-px bg-mts-border">
          <div
            v-for="service in services"
            :key="service.title"
            class="bg-white overflow-hidden hover:bg-mts-bg transition-colors group"
          >
            <div class="aspect-[16/10] overflow-hidden border-b border-mts-border">
              <img
                :src="service.image"
                :alt="service.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="p-8">
              <h3 class="font-display text-lg text-mts-text mb-3 group-hover:text-mts-accent transition-colors">
                {{ service.title }}
              </h3>
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                {{ service.description }}
              </p>
              <NuxtLink
                :to="localePath('/services')"
                class="font-mono text-[10px] uppercase tracking-wide text-mts-accent opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ t('home.services.more') }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="mt-8 lg:hidden">
          <ButtonLink :title="t('home.services.all')" link="/services" extra-class="w-full justify-center" />
        </div>
      </div>
    </section>

    <section class="relative py-20 lg:py-28 overflow-hidden border-t border-mts-border bg-white">
      <div class="absolute inset-0 grid-bg opacity-15" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ t('home.process.label') }}</span>
            <div class="w-6 h-px bg-mts-accent" />
          </div>
          <h2 class="font-display text-3xl lg:text-4xl text-mts-text">
            {{ t('home.process.heading') }}<span class="text-mts-accent">{{ t('home.process.headingAccent') }}</span>
          </h2>
        </div>
        <div class="grid md:grid-cols-3 gap-10 lg:gap-12">
          <div
            v-for="step in processSteps"
            :key="step.title"
            class="flex flex-col items-center text-center max-w-sm mx-auto md:max-w-none"
          >
            <div class="mb-4 flex justify-center">
              <img :src="step.badge" alt="" class="h-16 w-16 shrink-0" width="100" height="100" />
            </div>
            <h3 class="font-display text-lg text-mts-text mb-2">{{ step.title }}</h3>
            <p class="font-body text-sm text-mts-text-secondary leading-relaxed">{{ step.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden bg-mts-bg">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="absolute top-0 left-1/3 w-px h-full bg-mts-border" />
      <div class="absolute top-0 right-1/3 w-px h-full bg-mts-border" />

      <div class="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 text-center">
        <div class="flex items-center justify-center gap-3 mb-4">
          <div class="w-6 h-px bg-mts-accent" />
          <span class="section-label">{{ t('home.cta.label') }}</span>
          <div class="w-6 h-px bg-mts-accent" />
        </div>
        <h2 class="font-display text-3xl lg:text-4xl text-mts-text mb-6">
          {{ t('home.cta.title') }} <span class="text-mts-accent">{{ t('home.cta.titleAccent') }}</span>
        </h2>
        <p class="font-body text-mts-text-secondary mb-8 max-w-xl mx-auto">
          {{ t('home.cta.text') }}
        </p>
        <div class="flex justify-center items-center">
          <ButtonLink :title="t('home.cta.button')" link="/contacts" />
        </div>
      </div>
    </section>
  </div>
</template>
