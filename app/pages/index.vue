<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import type { HomePageData, MarineContentLocale, ServiceItem } from '~/types'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import ButtonLink from '~/components/common/ButtonLink.vue'
import ImageFadeCarousel from '~/components/common/ImageFadeCarousel.vue'
import { aboutCarouselSlides } from '~/utils/aboutCarouselSlides'
import { mergeHomePageData } from '~/utils/pageDefaults'
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'
import { resolveLucideIcon } from '~/utils/lucideIconRegistry'

useSiteSeoMeta('home')

const { locale } = useI18n()
const localePath = useLocalePath()
const api = useMarineApi()

const cms = ref<HomePageData | null>(null)

const { data: cmsPage } = await useAsyncData('home-cms', async () => {
  try { return await api.contentPages.getPublicBySlug('home') }
  catch { return null }
}, { server: true })

watchEffect(() => {
  const body = cmsPage.value?.body
  const loc = (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale
  if (body) {
    try {
      const parsed = JSON.parse(body) as Partial<HomePageData>
      if (parsed?.hero) {
        cms.value = mergeHomePageData(loc, parsed)
        return
      }
    } catch { /* not JSON */ }
  }
  cms.value = null
})

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)
const d = computed<HomePageData>(() => {
  const l = loc.value
  return cms.value ?? mergeHomePageData(l, null)
})

const { data: catalogServices } = await useAsyncData(
  () => `home-services-catalog-${locale.value}`,
  () => api.services.getAll(),
  { watch: [locale], default: () => [] as ServiceItem[] },
)

/** Карточки блока «Сервисы» только из каталога по `featuredServiceIds`. */
const visibleServiceCards = computed(() => {
  const fallbackImg = '/images/services/hull.jpg'
  const ids = (d.value.services.featuredServiceIds ?? []).filter((id) => id > 0)
  const rows = catalogServices.value ?? []
  const byId = new Map(rows.map((s) => [s.id, s]))
  const out: { key: string; image: string; title: string; description: string; href: string }[] = []
  for (const id of ids) {
    const s = byId.get(id)
    if (!s) {
      continue
    }
    const slug = s.contentPage?.slug
    out.push({
      key: `svc-${s.id}`,
      image: s.imageUrl || fallbackImg,
      title: s.title,
      description: s.description,
      href: slug ? `/services/${slug}` : '/services',
    })
  }
  return out
})

const isVisible = ref(false)
onMounted(() => { isVisible.value = true })

function scrollToAbout() {
  document.querySelector('#about-section')?.scrollIntoView({ behavior: 'smooth' })
}

const statIcons = computed(() =>
  d.value.statsCard.items.map(item => ({
    ...item,
    iconComponent: resolveLucideIcon(item.icon),
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
          :style="{ backgroundImage: `url(${d.heroImage || '/images/marin-figma/hero-ship.jpg'})` }"
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
              <span class="section-label"><ThemedContentString :content="d.hero.label" /></span>
            </div>

            <h1
              :class="[
                'font-display text-4xl sm:text-5xl lg:text-6xl text-mts-text leading-[1.1] mb-6 whitespace-pre-line transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <ThemeFormattedTitle :title="d.hero.titleFormatted" />
            </h1>

            <p
              :class="[
                'font-body text-lg text-mts-text-secondary max-w-lg mb-8 leading-relaxed transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <ThemedContentString :content="d.hero.lead" />
            </p>

            <div
              :class="[
                'flex flex-wrap gap-4 mb-10 transform transition-all duration-600 items-center',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <NuxtLink :to="localePath(d.hero.ctaClientHref)" class="btn-primary inline-flex items-center justify-center">
                <ThemedContentString :content="d.hero.ctaClient" />
              </NuxtLink>
              <NuxtLink :to="localePath(d.hero.ctaSeafarerHref)" class="btn-secondary inline-flex items-center justify-center">
                <ThemedContentString :content="d.hero.ctaSeafarer" />
              </NuxtLink>
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
                  <span class="font-mono text-xs text-mts-text-secondary ml-1"><ThemedContentString :content="d.hero.badgeIso" /></span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">IACS</span>
                  <span class="font-mono text-xs text-mts-text-secondary ml-1"><ThemedContentString :content="d.hero.badgeIacs" /></span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">14+</span>
                  <span class="font-mono text-xs text-mts-text-secondary ml-1"><ThemedContentString :content="d.hero.badgeYears" /></span>
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
                  <ThemedContentString :content="d.statsCard.label" />
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
          <span class="font-mono text-xs uppercase tracking-wide"><ThemedContentString :content="d.hero.scroll" /></span>
          <ChevronDown class="block w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>

    <section class="relative bg-mts-surface py-16 lg:py-24">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-linear-to-b from-mts-bg to-transparent sm:h-28"
        aria-hidden="true"
      />
      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-4 lg:gap-6 lg:items-stretch">
          <div class="group relative isolate flex h-full min-h-0 min-w-0 flex-col">
            <div
              class="pointer-events-none absolute -bottom-16 right-0 z-0 bg-mts-bg opacity-0 transition-opacity duration-200 group-hover:opacity-100 -top-16 -left-4 sm:-left-6 lg:-bottom-24 lg:-left-10 lg:-top-24"
              aria-hidden="true"
            />
            <div class="relative z-10 flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <div class="mb-2 flex items-center gap-2">
                <div class="h-px w-6 bg-mts-accent" />
                <span class="section-label text-[10px]"><ThemedContentString :content="d.funnelShip.label" /></span>
              </div>
              <h2 class="font-display text-lg leading-snug text-mts-text md:text-xl lg:text-2xl break-words [text-wrap:pretty]">
                <ThemeFormattedTitle :title="d.funnelShip.titleFormatted" />
              </h2>
              <p class="mt-3 flex-1 font-body text-sm leading-relaxed text-mts-text-secondary">
                <ThemedContentString :content="d.funnelShip.text" />
              </p>
              <NuxtLink :to="localePath(d.funnelShip.href)" class="mts-cta-link-compact mt-5 self-start">
                <ThemedContentString :content="d.funnelShip.cta" /> →
              </NuxtLink>
            </div>
          </div>
          <div class="group relative isolate flex h-full min-h-0 min-w-0 flex-col">
            <div
              class="pointer-events-none absolute inset-x-0 -bottom-16 z-0 bg-mts-bg opacity-0 transition-opacity duration-200 group-hover:opacity-100 -top-16 lg:-bottom-24 lg:-top-24"
              aria-hidden="true"
            />
            <div class="relative z-10 flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <div class="mb-2 flex items-center gap-2">
                <div class="h-px w-6 bg-mts-accent" />
                <span class="section-label text-[10px]"><ThemedContentString :content="d.funnelCrewing.label" /></span>
              </div>
              <h2 class="font-display text-lg leading-snug text-mts-text md:text-xl lg:text-2xl break-words [text-wrap:pretty]">
                <ThemeFormattedTitle :title="d.funnelCrewing.titleFormatted" />
              </h2>
              <p class="mt-3 flex-1 font-body text-sm leading-relaxed text-mts-text-secondary">
                <ThemedContentString :content="d.funnelCrewing.text" />
              </p>
              <div class="mt-5 flex flex-wrap items-center gap-2">
                <NuxtLink :to="localePath(d.funnelCrewing.href)" class="mts-cta-link-compact">
                  <ThemedContentString :content="d.funnelCrewing.cta" /> →
                </NuxtLink>
                <NuxtLink :to="localePath(d.funnelCrewing.secondaryHref)" class="mts-cta-link-muted-compact">
                  <ThemedContentString :content="d.funnelCrewing.secondaryCta" /> →
                </NuxtLink>
              </div>
            </div>
          </div>
          <div class="group relative isolate flex h-full min-h-0 min-w-0 flex-col">
            <div
              class="pointer-events-none absolute -bottom-16 left-0 z-0 bg-mts-bg opacity-0 transition-opacity duration-200 group-hover:opacity-100 -top-16 -right-4 sm:-right-6 lg:-bottom-24 lg:-right-10 lg:-top-24"
              aria-hidden="true"
            />
            <div class="relative z-10 flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <div class="mb-2 flex items-center gap-2">
                <div class="h-px w-6 bg-mts-accent" />
                <span class="section-label text-[10px]"><ThemedContentString :content="d.funnelTechnical.label" /></span>
              </div>
              <h2 class="font-display text-lg leading-snug text-mts-text md:text-xl lg:text-2xl break-words [text-wrap:pretty]">
                <ThemeFormattedTitle :title="d.funnelTechnical.titleFormatted" />
              </h2>
              <p class="mt-3 flex-1 font-body text-sm leading-relaxed text-mts-text-secondary">
                <ThemedContentString :content="d.funnelTechnical.text" />
              </p>
              <NuxtLink :to="localePath(d.funnelTechnical.href)" class="mts-cta-link-compact mt-5 self-start">
                <ThemedContentString :content="d.funnelTechnical.cta" /> →
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="relative bg-mts-bg py-20 lg:py-28">
      <div class="mx-auto max-w-7xl px-6 lg:px-12">
        <div class="mb-12 max-w-3xl">
          <div class="mb-4 flex items-center gap-3">
            <div class="h-px w-6 bg-mts-accent" />
            <span class="section-label"><ThemedContentString :content="d.directions.label" /></span>
          </div>
          <h2 class="font-display text-4xl text-mts-text lg:text-5xl break-words [text-wrap:pretty]">
            <ThemeFormattedTitle :title="d.directions.headingFormatted" />
          </h2>
        </div>
        <div class="flex flex-col gap-px bg-mts-border md:flex-row md:w-full">
          <div
            v-for="row in d.directions.rows"
            :key="row.title"
            class="min-w-0 flex-1 basis-0 bg-mts-bg p-8"
          >
            <h3 class="font-display text-lg text-mts-text"><ThemedContentString :content="row.title" /></h3>
            <p class="mt-3 font-body text-sm text-mts-text-secondary"><ThemedContentString :content="row.description" /></p>
            <NuxtLink :to="localePath(row.href)" class="mts-cta-link-compact mt-6 inline-flex">
              <ThemedContentString :content="row.cta" /> →
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section id="about-section" class="relative py-24 lg:py-32 overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-mts-accent" />
              <span class="section-label"><ThemedContentString :content="d.about.label" /></span>
            </div>
            <h2 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
              <ThemeFormattedTitle :title="d.about.titleFormatted" />
            </h2>
            <div class="w-12 h-0.5 bg-mts-accent mb-6" />
            <p class="font-body text-mts-text-secondary leading-relaxed mb-6">
              <ThemedContentString :content="d.about.text" />
            </p>
            <div class="mb-8">
              <span class="section-label"><ThemedContentString :content="d.trust.label" /></span>
              <h3 class="font-display mt-3 text-xl text-mts-text">
                <ThemeFormattedTitle :title="d.trust.titleFormatted" />
              </h3>
              <ul class="mt-4 space-y-2 font-body text-sm text-mts-text-secondary">
                <li v-for="(b, bi) in d.trust.bullets" :key="bi" class="flex gap-2">
                  <span class="font-mono text-mts-accent">—</span>
                  <span>{{ b }}</span>
                </li>
              </ul>
            </div>
            <ButtonLink :title="flattenEncodedOrPlain(d.about.more)" link="/about" />
          </div>
          <div class="relative">
            <CommonAccentCorners size="lg" bottom="bottom-5" />
            <ImageFadeCarousel :slides="aboutCarouselSlides" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="visibleServiceCards.length" class="relative py-24 lg:py-32 overflow-hidden bg-mts-surface">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="flex items-start justify-between mb-12">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-mts-accent" />
              <span class="section-label"><ThemedContentString :content="d.services.label" /></span>
            </div>
            <h2 class="font-display text-4xl lg:text-5xl text-mts-text break-words [text-wrap:pretty]">
              <ThemeFormattedTitle :title="d.services.headingFormatted" />
            </h2>
          </div>
          <ButtonLink :title="flattenEncodedOrPlain(d.services.all)" link="/services" extra-class="hidden lg:inline-flex" />
        </div>

        <div
          class="grid gap-px bg-mts-border"
          :class="visibleServiceCards.length >= 3 ? 'md:grid-cols-3' : visibleServiceCards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-lg'"
        >
          <div
            v-for="service in visibleServiceCards"
            :key="service.key"
            class="overflow-hidden bg-mts-bg"
          >
            <div class="aspect-[16/9] min-h-[11rem] sm:min-h-[13rem] overflow-hidden border-b border-mts-border">
              <img
                :src="service.image"
                :alt="service.title"
                class="h-full w-full object-cover brightness-[1.04] contrast-[1.03] saturate-[1.06]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="p-8">
              <h3 class="font-display text-xl text-mts-text mb-3">
                {{ service.title }}
              </h3>
              <p class="font-body text-base text-mts-text-secondary mb-4">
                {{ service.description }}
              </p>
              <NuxtLink :to="localePath(service.href)" class="mts-cta-link">
                <ThemedContentString :content="d.services.more" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="mt-8 lg:hidden">
          <ButtonLink :title="flattenEncodedOrPlain(d.services.all)" link="/services" extra-class="w-full justify-center" />
        </div>
      </div>
    </section>

    <section v-if="d.showProcess" class="relative border-t border-mts-border bg-mts-surface py-20 lg:py-28">
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div class="mx-auto mb-14 max-w-2xl text-center">
          <div class="mb-4 flex items-center justify-center gap-3">
            <div class="h-px w-6 bg-mts-accent" />
            <span class="section-label"><ThemedContentString :content="d.process.label" /></span>
            <div class="h-px w-6 bg-mts-accent" />
          </div>
          <h2 class="font-display text-4xl text-mts-text lg:text-5xl break-words [text-wrap:pretty]">
            <ThemeFormattedTitle :title="d.process.headingFormatted" />
          </h2>
        </div>
        <div class="grid gap-10 md:grid-cols-3 lg:gap-12">
          <div
            v-for="(step, si) in d.process.steps"
            :key="step.title"
            class="mx-auto flex max-w-sm flex-col items-center text-center md:max-w-none"
          >
            <div class="mb-4 flex justify-center">
              <img :src="`/images/steps/${si + 1}.svg`" alt="" class="h-20 w-20 shrink-0 opacity-95" width="100" height="100" />
            </div>
            <h3 class="font-display text-xl text-mts-text mb-2"><ThemedContentString :content="step.title" /></h3>
            <p class="font-body text-base text-mts-text-secondary leading-relaxed"><ThemedContentString :content="step.text" /></p>
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden bg-mts-bg">
      <div class="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 text-center">
        <div class="flex items-center justify-center gap-3 mb-4">
          <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label"><ThemedContentString :content="d.cta.label" /></span>
          <div class="w-6 h-px bg-mts-accent" />
        </div>
        <h2 class="font-display text-4xl lg:text-5xl text-mts-text mb-6">
          <ThemeFormattedTitle :title="d.cta.titleFormatted" />
        </h2>
        <p class="font-body text-mts-text-secondary mb-8 max-w-xl mx-auto">
          <ThemedContentString :content="d.cta.text" />
        </p>
        <div class="flex justify-center items-center">
          <ButtonLink :title="flattenEncodedOrPlain(d.cta.button)" link="/request" />
        </div>
      </div>
    </section>

    <CommonCustomPageSectionsRender :sections="d.customSections" />

    <CommonPageInquiryForm v-if="d.showInquiryForm" source-page="home" />
  </div>
</template>
