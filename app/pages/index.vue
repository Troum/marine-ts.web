<script setup lang="ts">
import { ChevronDown, Ship, MapPin, Users, Calendar } from 'lucide-vue-next'
import type { HomePageData, MarineContentLocale } from '~/types'
import ButtonLink from '~/components/common/ButtonLink.vue'
import ImageFadeCarousel from '~/components/common/ImageFadeCarousel.vue'
import { aboutCarouselSlides } from '~/utils/aboutCarouselSlides'
import { defaultHomeData } from '~/utils/pageDefaults'

useSiteSeoMeta('home')

const { t, locale } = useI18n()
const localePath = useLocalePath()
const api = useMarineApi()

const STAT_ICONS: Record<string, object> = { Ship, MapPin, Users, Calendar }

const cms = ref<HomePageData | null>(null)

const { data: cmsPage } = await useAsyncData('home-cms', async () => {
  try { return await api.contentPages.getPublicBySlug('home') }
  catch { return null }
}, { server: true })

watchEffect(() => {
  const body = cmsPage.value?.body
  if (body) {
    try {
      const parsed = JSON.parse(body)
      if (parsed?.hero) { cms.value = parsed; return }
    } catch { /* not JSON */ }
  }
  cms.value = null
})

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)
const d = computed<HomePageData>(() => cms.value ?? defaultHomeData(loc.value))
const visibleServiceCards = computed(() =>
  d.value.services.cards.filter(c => c.image && c.title),
)

const isVisible = ref(false)
onMounted(() => { isVisible.value = true })

function scrollToAbout() {
  document.querySelector('#about-section')?.scrollIntoView({ behavior: 'smooth' })
}

const statIcons = computed(() =>
  d.value.statsCard.items.map(item => ({
    ...item,
    iconComponent: STAT_ICONS[item.icon] ?? Ship,
  })),
)
</script>

<template>
  <div class="bg-mts-bg">
    <section class="relative min-h-screen flex items-center overflow-hidden">
      <div class="absolute inset-0">
        <div
          :class="[
            'absolute inset-0 bg-cover bg-center transition-all duration-1000',
            isVisible ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          ]"
          style="background-image: url(/hero-bg.jpg)"
        />
        <div class="absolute inset-0 bg-linear-to-r from-mts-bg via-mts-bg/82 to-mts-bg/55" />
        <div class="absolute inset-0 bg-linear-to-t from-mts-bg via-transparent to-mts-bg/40" />
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
              <span class="section-label">{{ d.hero.label }}</span>
            </div>

            <h1
              :class="[
                'font-display text-4xl sm:text-5xl lg:text-6xl text-mts-text leading-[1.1] mb-6 transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              {{ d.hero.titleLine1 }}
              <br />
              <span class="text-mts-accent">{{ d.hero.titleAccent }}</span>{{ d.hero.titleSuffix }}
            </h1>

            <p
              :class="[
                'font-body text-lg text-mts-text-secondary max-w-lg mb-8 leading-relaxed transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              {{ d.hero.lead }}
            </p>

            <div
              :class="[
                'flex flex-wrap gap-4 mb-10 transform transition-all duration-600 items-center',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <ButtonLink :title="d.hero.ctaConsult" link="/contacts" :asButton="true" />
              <NuxtLink :to="localePath('/services')" class="btn-secondary">{{ d.hero.ctaServices }}</NuxtLink>
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
                  <span class="font-mono text-xs text-mts-text-secondary ml-1">{{ d.hero.badgeIso }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">IACS</span>
                  <span class="font-mono text-xs text-mts-text-secondary ml-1">{{ d.hero.badgeIacs }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">14+</span>
                  <span class="font-mono text-xs text-mts-text-secondary ml-1">{{ d.hero.badgeYears }}</span>
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
                <span class="font-mono text-xs uppercase tracking-wide text-mts-text-secondary">
                  {{ d.statsCard.label }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div v-for="stat in statIcons" :key="stat.label" class="p-4 bg-mts-bg border border-mts-border">
                  <component :is="stat.iconComponent" class="w-5 h-5 text-mts-accent mb-2" />
                  <p class="font-mono text-2xl font-medium text-mts-accent mb-1">{{ stat.value }}</p>
                  <p class="font-mono text-[11px] uppercase tracking-wide text-mts-text-secondary">{{ stat.label }}</p>
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
          <span class="font-mono text-xs uppercase tracking-wide">{{ d.hero.scroll }}</span>
          <ChevronDown class="block w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>

    <section id="about-section" class="relative py-24 lg:py-32 overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-mts-accent" />
              <span class="section-label">{{ d.about.label }}</span>
            </div>
            <h2 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
              {{ d.about.title }} <span class="text-mts-accent">{{ d.about.titleAccent }}</span>{{ d.about.titleEnd }}
            </h2>
            <div class="w-12 h-0.5 bg-mts-accent mb-6" />
            <p class="font-body text-mts-text-secondary leading-relaxed mb-6">
              {{ d.about.text }}
            </p>
            <ButtonLink :title="d.about.more" link="/about" />
          </div>
          <div class="relative">
            <CommonAccentCorners size="lg" bottom="bottom-5" />
            <ImageFadeCarousel :slides="aboutCarouselSlides" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="visibleServiceCards.length" class="relative py-24 lg:py-32 overflow-hidden bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="flex items-start justify-between mb-12">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-mts-accent" />
              <span class="section-label">{{ d.services.label }}</span>
            </div>
            <h2 class="font-display text-4xl lg:text-5xl text-mts-text">
              {{ d.services.heading }}<span class="text-mts-accent">{{ d.services.headingAccent }}</span>{{ d.services.headingEnd }}
            </h2>
          </div>
          <ButtonLink :title="d.services.all" link="/services" extra-class="hidden lg:inline-flex" />
        </div>

        <div
          class="grid gap-px bg-mts-border"
          :class="visibleServiceCards.length >= 3 ? 'md:grid-cols-3' : visibleServiceCards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-lg'"
        >
          <div
            v-for="service in visibleServiceCards"
            :key="service.title"
            class="bg-white overflow-hidden hover:bg-mts-bg transition-colors group"
          >
            <div class="aspect-[16/9] min-h-[11rem] sm:min-h-[13rem] overflow-hidden border-b border-mts-border">
              <img
                :src="service.image"
                :alt="service.title"
                class="h-full w-full object-cover brightness-[1.04] contrast-[1.03] saturate-[1.06] transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="p-8">
              <h3 class="font-display text-xl text-mts-text mb-3 group-hover:text-mts-accent transition-colors">
                {{ service.title }}
              </h3>
              <p class="font-body text-base text-mts-text-secondary mb-4">
                {{ service.description }}
              </p>
              <NuxtLink
                :to="localePath('/services')"
                class="font-mono text-xs uppercase tracking-wide text-mts-accent opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {{ d.services.more }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="mt-8 lg:hidden">
          <ButtonLink :title="d.services.all" link="/services" extra-class="w-full justify-center" />
        </div>
      </div>
    </section>

    <section class="relative py-20 lg:py-28 overflow-hidden border-t border-mts-border bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ d.process.label }}</span>
            <div class="w-6 h-px bg-mts-accent" />
          </div>
          <h2 class="font-display text-4xl lg:text-5xl text-mts-text">
            {{ d.process.heading }}<span class="text-mts-accent">{{ d.process.headingAccent }}</span>
          </h2>
        </div>
        <div class="grid md:grid-cols-3 gap-10 lg:gap-12">
          <div
            v-for="(step, si) in d.process.steps"
            :key="step.title"
            class="flex flex-col items-center text-center max-w-sm mx-auto md:max-w-none"
          >
            <div class="mb-4 flex justify-center">
              <img :src="`/images/steps/${si + 1}.svg`" alt="" class="h-20 w-20 shrink-0 opacity-95" width="100" height="100" />
            </div>
            <h3 class="font-display text-xl text-mts-text mb-2">{{ step.title }}</h3>
            <p class="font-body text-base text-mts-text-secondary leading-relaxed">{{ step.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden bg-mts-bg">
      <div class="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 text-center">
        <div class="flex items-center justify-center gap-3 mb-4">
          <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ d.cta.label }}</span>
          <div class="w-6 h-px bg-mts-accent" />
        </div>
        <h2 class="font-display text-4xl lg:text-5xl text-mts-text mb-6">
          {{ d.cta.title }} <span class="text-mts-accent">{{ d.cta.titleAccent }}</span>
        </h2>
        <p class="font-body text-mts-text-secondary mb-8 max-w-xl mx-auto">
          {{ d.cta.text }}
        </p>
        <div class="flex justify-center items-center">
          <ButtonLink :title="d.cta.button" link="/contacts" />
        </div>
      </div>
    </section>
  </div>
</template>
