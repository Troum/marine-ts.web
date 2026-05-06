<script setup lang="ts">
import { Check, Loader2 } from 'lucide-vue-next'
import Breadcrumbs, { type BreadcrumbItem } from '~/components/common/Breadcrumbs.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import LineMarketingCustomSectionView from '~/components/line-marketing/LineMarketingCustomSectionView.vue'
import type { AboutRichCard, LineMarketingCustomSection, ListingPageData, ServiceItem } from '~/types'
import { sanitizeRichContentHtml } from '~/composables/useMarkdownSafeHtml'
import { incomingCmsValueToHtml } from '~/utils/adminHtmlField'
import AboutSectionContentParallax from '~/components/about/AboutSectionContentParallax.vue'
import MarinMapboxMap from '~/components/about/MarinMapboxMap.vue'
import MarinReveal from '~/components/about/MarinReveal.vue'
import { SERVICES_MARKETING_V2_SECTION_ORDER, SERVICES_REACH_MAP_LOCATIONS } from '~/utils/servicesMarketingPageDefaults'
import { resolveCrewingIcon } from '~/utils/crewingIcons'
import { resolveServiceIcon } from '~/utils/serviceIcons'
import { visibleOrderedSections } from '~/utils/sectionVisibility'
import { resolveHeroBreadcrumbOnDark } from '~/utils/pageBreadcrumbTone'

const props = defineProps<{
  cms: ListingPageData
  crumbItems: BreadcrumbItem[]
  services: ServiceItem[]
  pending: boolean
  error: unknown
}>()

const localePath = useLocalePath()
const { t } = useI18n()
const config = useRuntimeConfig()
const mapboxToken = computed(() => (config.public.mapboxToken as string | undefined) ?? '')

const v2 = computed(() => props.cms.servicesV2!)

const heroParallaxActive = ref(false)
onMounted(() => {
  heroParallaxActive.value = true
})

const sectionIds = computed(() =>
  visibleOrderedSections(
    props.cms.sectionOrder,
    SERVICES_MARKETING_V2_SECTION_ORDER,
    props.cms.customSections,
    props.cms.sectionVisibility,
  ),
)

function customSectionById(id: string): LineMarketingCustomSection | undefined {
  return props.cms.customSections?.find((s) => s.id === id)
}

function lineRichHtml(raw: string | undefined | null): string {
  return sanitizeRichContentHtml(incomingCmsValueToHtml(raw ?? ''))
}

/** Декоративные иконки для блока «решения» (совпадают с духом линейных страниц). */
const solutionDecorIcons = ['Anchor', 'Zap', 'Ship', 'Cog'] as const
const advantageDecorIcons = ['Microscope', 'Eye', 'Users', 'Package'] as const

function resolveServicesV2SolutionIcon(c: AboutRichCard, i: number) {
  if (c.hideIcon) {
    return null
  }
  const key =
    c.icon?.trim()
      ? c.icon.trim()
      : (solutionDecorIcons[Math.min(i, solutionDecorIcons.length - 1)] ?? 'Ship')
  return resolveCrewingIcon(key)
}

function resolveServicesV2AdvantageIcon(c: AboutRichCard, i: number) {
  if (c.hideIcon) {
    return null
  }
  const key =
    c.icon?.trim()
      ? c.icon.trim()
      : (advantageDecorIcons[Math.min(i, advantageDecorIcons.length - 1)] ?? 'BadgeCheck')
  return resolveCrewingIcon(key)
}

const visibleHeroButtons = computed(() =>
  (props.cms.heroButtons ?? [])
    .map((btn, idx) => ({ btn, idx }))
    .filter(({ btn }) => btn.label.trim() !== '' && btn.href.trim() !== ''),
)

function isExternalHeroHref(href: string): boolean {
  const h = href.trim()
  return (
    h.startsWith('http://') ||
    h.startsWith('https://') ||
    h.startsWith('//') ||
    h.startsWith('mailto:') ||
    h.startsWith('tel:')
  )
}

function needsBlankTarget(href: string): boolean {
  const h = href.trim()
  return h.startsWith('http://') || h.startsWith('https://') || h.startsWith('//')
}

function isHashHeroHref(href: string): boolean {
  return href.trim().startsWith('#')
}

function resolveHeroButtonTo(href: string): string {
  const h = href.trim()
  if (!h || h.startsWith('#') || isExternalHeroHref(h)) {
    return h
  }
  return localePath(h.startsWith('/') ? h : `/${h}`)
}

function heroButtonClass(idx: number): string {
  const base =
    'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-6 font-body text-sm font-semibold transition-colors duration-200'
  if (idx === 0) {
    return `${base} btn-primary`
  }
  return `${base} btn-secondary-glass`
}

const heroBreadcrumbsOnDark = computed(() =>
  resolveHeroBreadcrumbOnDark(props.cms.heroBreadcrumbTone, true),
)
</script>

<template>
  <div class="bg-white">
    <section class="relative flex mts-hero-min-h items-center overflow-hidden">
      <div class="absolute top-0 left-1/4 h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent" />
      <div class="absolute top-0 right-1/4 h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent" />

      <div class="absolute inset-0">
        <CommonParallaxHeroMedia :image="cms.heroImage ?? ''" :active="heroParallaxActive" />
        <div
          class="pointer-events-none absolute inset-0 z-[1] mts-line-marketing-hero-veil"
          aria-hidden="true"
        />
      </div>

      <div class="relative z-10 mts-content-wrap w-full pb-20 pt-28">
        <AboutSectionContentParallax
          :max-shift="32"
          :factor="0.085"
          class="w-full max-w-none"
        >
          <div class="w-full max-w-7xl">
            <MarinReveal>
              <Breadcrumbs :items="crumbItems" :on-dark-hero="heroBreadcrumbsOnDark" />
              <div class="mb-4 flex items-center gap-3">
                <div class="h-px w-8 bg-primary" />
                <span class="section-label">{{ t('pages.services.heroEyebrow') }}</span>
              </div>
            </MarinReveal>
            <MarinReveal :delay-ms="120">
              <h1
                class="font-display mb-6 text-3xl leading-tight text-white drop-shadow-md lg:text-4xl"
              >
                <ThemedContentString :content="v2.sec1Hero.title" />
              </h1>
            </MarinReveal>
            <MarinReveal :delay-ms="180">
              <div class="mb-6 h-0.5 w-12 bg-white" />
              <p class="font-body text-lg leading-relaxed text-white/95 drop-shadow italic">
                <ThemedContentString :content="v2.sec1Hero.lead" />
              </p>
            </MarinReveal>
            <MarinReveal v-if="v2.sec1Hero.body.trim()" :delay-ms="240">
              <div
                class="mts-markdown mt-6 max-w-3xl text-base leading-relaxed text-white/90 [&_strong]:text-white"
                v-html="lineRichHtml(v2.sec1Hero.body)"
              />
            </MarinReveal>
            <MarinReveal v-if="visibleHeroButtons.length > 0" :delay-ms="300">
              <div class="mt-8 flex flex-wrap gap-4">
                <template v-for="{ btn, idx } in visibleHeroButtons" :key="`${btn.href}-${idx}`">
                  <a
                    v-if="isExternalHeroHref(btn.href)"
                    :href="btn.href.trim()"
                    :class="heroButtonClass(idx)"
                    :target="needsBlankTarget(btn.href) ? '_blank' : undefined"
                    :rel="needsBlankTarget(btn.href) ? 'noopener noreferrer' : undefined"
                    ><ThemedContentString :content="btn.label" /></a
                  >
                  <a
                    v-else-if="isHashHeroHref(btn.href)"
                    :href="btn.href.trim()"
                    :class="heroButtonClass(idx)"
                    ><ThemedContentString :content="btn.label" /></a
                  >
                  <NuxtLink v-else :to="resolveHeroButtonTo(btn.href)" :class="heroButtonClass(idx)"
                    ><ThemedContentString :content="btn.label" /></NuxtLink>
                </template>
              </div>
            </MarinReveal>
          </div>
        </AboutSectionContentParallax>
      </div>
    </section>

    <template v-for="sid in sectionIds" :key="sid">
      <MarinReveal
        v-if="sid.startsWith('custom:') && customSectionById(sid.slice(7))"
      >
        <LineMarketingCustomSectionView
          :section="customSectionById(sid.slice(7))!"
          slug="services"
          :page-crumb-items="crumbItems"
        />
      </MarinReveal>

      <section
        v-else-if="sid === 'reach'"
        class="relative min-h-[100svh] overflow-hidden bg-mts-navy-deep"
        aria-labelledby="services-reach-heading"
      >
        <div class="relative isolate min-h-[100svh] w-full">
          <!-- Слой карты: явный z-0 и высота — иначе canvas может оказаться под фоном секции. -->
          <div class="absolute inset-0 z-0 h-[100svh] min-h-[100svh] w-full overflow-hidden">
            <ClientOnly>
              <MarinMapboxMap
                v-if="mapboxToken"
                :locations="SERVICES_REACH_MAP_LOCATIONS"
                :access-token="mapboxToken"
              />
              <div
                v-else
                class="absolute inset-0 flex h-full min-h-[100svh] items-center justify-center bg-mts-navy-deep"
              >
                <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-mts-frost/40">
                  map unavailable — set NUXT_PUBLIC_MAPBOX_TOKEN
                </span>
              </div>
              <template #fallback>
                <div class="absolute inset-0 min-h-[100svh] bg-transparent" aria-hidden="true" />
              </template>
            </ClientOnly>
          </div>
          <div
            class="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full bg-linear-to-r from-mts-navy/65 via-mts-navy/20 to-transparent sm:w-2/3 lg:w-2/5"
            aria-hidden="true"
          />
          <div class="pointer-events-none absolute inset-0 z-[2] flex min-h-[100svh] items-center">
            <div class="mts-content-wrap w-full py-16 sm:py-20 lg:py-24">
              <div class="max-w-xl pointer-events-auto lg:max-w-2xl">
                <MarinReveal>
                  <h2
                    id="services-reach-heading"
                    class="font-display mb-6 text-2xl font-bold leading-tight text-primary md:text-3xl lg:text-[34px] lg:leading-10"
                  >
                    <ThemedContentString :content="v2.sec2Reach.title" />
                  </h2>
                </MarinReveal>
                <MarinReveal :delay-ms="120">
                  <div
                    class="mts-markdown mb-6 font-body text-base leading-relaxed text-mts-frost/90 lg:text-lg"
                    v-html="lineRichHtml(v2.sec2Reach.paragraph1)"
                  />
                </MarinReveal>
                <MarinReveal :delay-ms="180">
                  <div
                    class="mts-markdown font-body text-base leading-relaxed text-mts-frost/90 lg:text-lg"
                    v-html="lineRichHtml(v2.sec2Reach.paragraph2)"
                  />
                </MarinReveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        v-else-if="sid === 'solutions'"
        class="relative overflow-hidden bg-bg-light/70 py-24 lg:py-28"
      >
        <div class="relative z-10 mts-content-wrap">
          <MarinReveal>
            <h2 class="font-display mb-4 text-center text-xl text-body md:text-2xl">
              <ThemedContentString :content="v2.sec3Solutions.title" />
            </h2>
          </MarinReveal>
          <MarinReveal v-if="v2.sec3Solutions.body.trim()" :delay-ms="120">
            <div
              class="mts-markdown mx-auto mb-12 max-w-3xl text-center font-body leading-relaxed text-muted"
              v-html="lineRichHtml(v2.sec3Solutions.body)"
            />
          </MarinReveal>
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            <MarinReveal
              v-for="(c, i) in v2.sec3Solutions.cards"
              :key="`sol-${i}`"
              class="h-full"
              :delay-ms="200 + i * 90"
            >
              <div
                class="service-card corner-accent flex min-h-full min-w-0 flex-col p-6"
              >
                <div class="mb-3 flex items-start justify-between gap-2">
                  <span class="font-display text-3xl tabular-nums text-mts-accent">
                    {{ String(i + 1).padStart(2, '0') }}
                  </span>
                  <component
                    v-if="!c.hideIcon"
                    :is="resolveServicesV2SolutionIcon(c, i)!"
                    class="h-7 w-7 shrink-0 text-mts-accent"
                  />
                </div>
                <h3 class="font-display mb-3 text-base text-mts-text">
                  <ThemedContentString :content="c.title" />
                </h3>
                <div
                  class="mts-markdown flex-1 text-sm leading-relaxed text-mts-text-secondary [&_strong]:text-mts-text"
                  v-html="lineRichHtml(c.text)"
                />
              </div>
            </MarinReveal>
          </div>
        </div>
      </section>

      <section
        v-else-if="sid === 'advantages'"
        class="relative overflow-hidden bg-bg-light py-24 lg:py-28"
      >
        <div class="relative z-10 mts-content-wrap">
          <MarinReveal>
            <h2 class="font-display mb-12 text-center text-xl text-body md:text-2xl">
              <ThemedContentString :content="v2.sec4Advantages.title" />
            </h2>
          </MarinReveal>
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8">
            <MarinReveal
              v-for="(c, i) in v2.sec4Advantages.cards"
              :key="`adv-${i}`"
              class="h-full"
              :delay-ms="160 + i * 90"
            >
              <div
                class="service-card flex h-full gap-5 p-6"
              >
                <component
                  v-if="!c.hideIcon"
                  :is="resolveServicesV2AdvantageIcon(c, i)!"
                  class="mt-0.5 h-8 w-8 shrink-0 text-mts-accent"
                />
                <div class="min-w-0">
                  <h3 class="font-display mb-2 text-lg text-mts-text">
                    <ThemedContentString :content="c.title" />
                  </h3>
                  <div
                    class="mts-markdown text-sm leading-relaxed text-mts-text-secondary [&_strong]:text-mts-text"
                    v-html="lineRichHtml(c.text)"
                  />
                </div>
              </div>
            </MarinReveal>
          </div>
        </div>
      </section>

      <section
        v-else-if="sid === 'guarantees'"
        class="relative overflow-hidden border-y border-border bg-bg-light py-24 lg:py-28"
      >
        <div class="mts-content-wrap">
          <div class="mx-auto max-w-3xl text-center">
            <MarinReveal>
              <h2 class="font-display mb-8 text-xl text-body md:text-2xl">
                <ThemedContentString :content="v2.sec5Guarantees.title" />
              </h2>
            </MarinReveal>
            <MarinReveal :delay-ms="120">
              <div
                class="mts-markdown mb-8 font-body leading-relaxed text-muted"
                v-html="lineRichHtml(v2.sec5Guarantees.paragraph1)"
              />
            </MarinReveal>
            <MarinReveal :delay-ms="180">
              <div
                class="mts-markdown font-body text-lg leading-relaxed text-body"
                v-html="lineRichHtml(v2.sec5Guarantees.paragraph2)"
              />
            </MarinReveal>
          </div>
        </div>
      </section>

      <section
        v-else-if="sid === 'preForm'"
        class="relative overflow-hidden bg-white py-16 lg:py-20"
      >
        <div class="mts-content-wrap">
          <div class="mx-auto max-w-3xl text-center">
            <MarinReveal>
              <h2 class="font-display mb-4 text-xl text-body md:text-2xl">
                <ThemedContentString :content="v2.sec6PreForm.title" />
              </h2>
            </MarinReveal>
            <MarinReveal :delay-ms="120">
              <div
                class="mts-markdown font-body leading-relaxed text-muted"
                v-html="lineRichHtml(v2.sec6PreForm.body)"
              />
            </MarinReveal>
          </div>
        </div>
      </section>

      <section
        v-else-if="sid === 'listing'"
        class="relative overflow-hidden bg-white py-20 lg:py-28"
      >
        <div class="relative z-10 mts-content-wrap">
          <div v-if="pending" class="flex justify-center py-24">
            <Loader2 class="h-10 w-10 animate-spin text-primary" />
          </div>
          <p v-else-if="error" class="py-12 text-center font-body text-muted">
            {{ t('pages.services.loadError') }}
          </p>
          <p v-else-if="!services?.length" class="py-12 text-center font-body text-muted">
            {{ t('pages.services.empty') }}
          </p>
          <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <MarinReveal
              v-for="(service, si) in services"
              :key="service.id"
              class="h-full"
              :delay-ms="80 + si * 90"
            >
              <article class="service-card min-h-full min-w-0 overflow-hidden">
                <div v-if="service.imageUrl" class="aspect-[16/9] w-full overflow-hidden border-b border-border bg-white">
                  <img
                    :src="service.imageUrl"
                    :alt="service.title"
                    class="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="p-8">
                  <component
                    v-if="!service.imageUrl"
                    :is="resolveServiceIcon(service.iconKey)"
                    class="mb-4 h-8 w-8 text-primary"
                  />
                  <h3 class="font-display text-lg leading-snug text-body">
                    <NuxtLink
                      v-if="service.contentPage?.slug"
                      :to="localePath(`/${service.contentPage.slug}`)"
                      class="hover:text-primary"
                    >
                      <ThemedContentString :content="service.title" />
                    </NuxtLink>
                    <template v-else><ThemedContentString :content="service.title" /></template>
                  </h3>
                  <p class="mt-3 font-body text-sm leading-relaxed text-muted">
                    <ThemedContentString :content="service.description" />
                  </p>
                  <ul v-if="service.features?.length" class="mt-4 space-y-2">
                    <li
                      v-for="f in service.features"
                      :key="f"
                      class="flex items-start gap-2 font-mono text-[10px] leading-relaxed text-muted"
                    >
                      <Check class="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      {{ f }}
                    </li>
                  </ul>
                  <NuxtLink
                    v-if="service.contentPage?.slug"
                    :to="localePath(`/${service.contentPage.slug}`)"
                    class="mts-cta-link-compact mt-6 inline-flex"
                  >
                    {{ t('pages.common.readMore') }} →
                  </NuxtLink>
                </div>
              </article>
            </MarinReveal>
          </div>
        </div>
      </section>
    </template>

    <MarinReveal v-if="cms.showInquiryForm">
      <CommonPageInquiryForm
        source-page="services"
        :hide-intro="cms.hideInquiryFormIntro === true"
        :hide-form-card-heading="cms.hideInquiryFormCardHeading === true"
        :config="cms.inquiryForm"
      />
    </MarinReveal>
  </div>
</template>
