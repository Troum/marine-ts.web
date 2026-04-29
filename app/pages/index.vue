<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import type { HomePageData, MarineContentLocale, ServiceItem } from '~/types'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import ButtonLink from '~/components/common/ButtonLink.vue'
import ImageFadeCarousel from '~/components/common/ImageFadeCarousel.vue'
import { aboutCarouselSlides } from '~/utils/aboutCarouselSlides'
import { HOME_SECTION_DEFAULT_ORDER, mergeHomePageData } from '~/utils/pageDefaults'
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'
import { resolveServiceIcon } from '~/utils/serviceIcons'
import { resolveSectionOrder, isSectionVisible } from '~/utils/sectionVisibility'

useSiteSeoMeta('home')

const { locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const customSectionCrumbItems = computed(() => breadcrumbs())

const cms = ref<HomePageData | null>(null)

const { data: cmsPage, pending: homeCmsPending } = await useAsyncData(
  () => `home-cms-${locale.value}`,
  async () => {
    try {
      return await api.contentPages.getPublicBySlug('home')
    }
    catch {
      return null
    }
  },
  { server: true, watch: [locale] },
)

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
  const ids = (d.value.services.featuredServiceIds ?? []).filter((id) => id > 0)
  const rows = catalogServices.value ?? []
  const byId = new Map(rows.map((s) => [s.id, s]))
  const out: {
    key: string
    image: string
    iconKey: string | null | undefined
    title: string
    description: string
    href: string
  }[] = []
  for (const id of ids) {
    const s = byId.get(id)
    if (!s) {
      continue
    }
    const slug = s.contentPage?.slug
    out.push({
      key: `svc-${s.id}`,
      image: (s.imageUrl ?? '').trim(),
      iconKey: s.iconKey,
      title: s.title,
      description: s.description,
      href: slug ? `/${slug}` : '/services',
    })
  }
  return out
})

const isVisible = ref(false)
onMounted(() => { isVisible.value = true })

const activeHeroDirectionIndex = ref<number | null>(0)
const activeHeroDirection = computed(() => {
  const index = activeHeroDirectionIndex.value
  return index === null ? null : d.value.directions.rows[index] ?? null
})

function heroDirectionTitle(row: { title: string; hoverTitle?: string }) {
  return row.hoverTitle?.trim() || row.title
}

function heroDirectionDescription(row: { description: string; hoverDescription?: string }) {
  return row.hoverDescription?.trim() || row.description
}

const activeHeroImage = computed(() => activeHeroDirection.value?.heroImage?.trim() || d.value.heroImage?.trim() || '')

const directionsGridClass = computed(() => {
  const count = d.value.directions.rows.length
  if (count <= 1) {
    return 'grid-cols-1'
  }
  if (count === 2) {
    return 'grid-cols-1 md:grid-cols-2'
  }
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
})

function scrollToAbout() {
  document.querySelector('#about-section')?.scrollIntoView({ behavior: 'smooth' })
}

/**
 * Эффективный порядок секций (после hero) с учётом сохранённого
 * `sectionOrder`, актуальных кастомных секций и дефолтов.
 */
const sectionOrderEffective = computed(() =>
  resolveSectionOrder(d.value.sectionOrder, HOME_SECTION_DEFAULT_ORDER, d.value.customSections),
)

function sectionShown(id: string): boolean {
  return isSectionVisible(d.value.sectionVisibility, id)
}
</script>

<template>
  <div class="bg-white">
    <div v-if="homeCmsPending" class="flex min-h-[40vh] items-center justify-center py-24">
      <div
        class="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
        aria-live="polite"
      />
    </div>
    <template v-else>
    <section class="public-hero relative h-screen overflow-hidden">
      <div class="absolute inset-0">
        <CommonParallaxHeroMedia
          v-if="activeHeroImage"
          :key="activeHeroImage"
          :image="activeHeroImage"
          :active="isVisible"
          bg-class="hero-bg"
        />
        <div v-else class="absolute inset-0 bg-navy-900" aria-hidden="true" />
        <div
          v-if="activeHeroImage"
          class="pointer-events-none absolute inset-0 z-[1] mts-line-marketing-hero-veil"
          aria-hidden="true"
        />
      </div>

      <div class="relative z-10 flex h-full flex-col justify-between">
        <div class="pt-32" />

        <div class="flex flex-1 items-center justify-center px-4">
          <div class="max-w-4xl text-center">
            <div
              :class="[
                'mb-5 flex items-center justify-center gap-3 transition-all duration-500',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <div class="h-px w-8 bg-primary" />
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <ThemedContentString :content="d.hero.label" />
              </span>
              <div class="h-px w-8 bg-primary" />
            </div>
            <Transition
              mode="out-in"
              enter-active-class="transition-all duration-500 ease-out"
              enter-from-class="translate-y-4 opacity-0"
              enter-to-class="translate-y-0 opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="translate-y-0 opacity-100"
              leave-to-class="-translate-y-4 opacity-0"
            >
              <div
                :key="activeHeroDirection ? `direction-${activeHeroDirectionIndex}` : 'default-hero'"
                :class="isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
              >
                <h1
                  class="mts-hero-themed-copy mb-4 text-3xl font-bold leading-tight text-white drop-shadow-lg md:text-4xl lg:text-5xl"
                >
                  <ThemedContentString
                    v-if="activeHeroDirection"
                    :content="heroDirectionTitle(activeHeroDirection)"
                  />
                  <ThemeFormattedTitle v-else :title="d.hero.titleFormatted" />
                </h1>
                <p
                  class="mts-hero-themed-copy mx-auto max-w-2xl text-lg leading-relaxed text-white/90 drop-shadow md:text-xl"
                >
                  <ThemedContentString
                    :content="activeHeroDirection ? heroDirectionDescription(activeHeroDirection) : d.hero.lead"
                  />
                </p>
              </div>
            </Transition>
            <div
              :class="[
                'mt-8 flex flex-wrap items-center justify-center gap-4',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <NuxtLink :to="localePath(d.hero.ctaClientHref)" class="btn-primary">
                <ThemedContentString :content="d.hero.ctaClient" />
              </NuxtLink>
              <NuxtLink :to="localePath(d.hero.ctaSeafarerHref)" class="btn-secondary-glass">
                <ThemedContentString :content="d.hero.ctaSeafarer" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="relative z-20">
          <div class="flex flex-col md:flex-row">
            <NuxtLink
              v-for="(row, index) in d.directions.rows"
              :key="row.title"
              :to="localePath(row.href)"
              class="nav-card group relative min-w-0 flex-1 border-t border-white/20 bg-black/40 transition-all duration-500 hover:bg-primary/90 focus-visible:bg-primary/90 md:border-r md:last:border-r-0"
              :class="activeHeroDirectionIndex === index ? 'md:bg-primary/90' : ''"
              @mouseenter="activeHeroDirectionIndex = index"
              @focus="activeHeroDirectionIndex = index"
            >
              <div class="flex items-center justify-between px-4 py-6 md:py-8">
                <span class="text-sm font-medium text-white md:text-base lg:text-lg">
                  <ThemedContentString :content="row.title" />
                </span>
                <span class="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-white/10 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/20">
                  →
                </span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-transparent transition-colors group-hover:bg-white" />
            </NuxtLink>
          </div>
        </div>

        <button
          type="button"
          :class="[
            'absolute bottom-32 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/70 transition-all duration-300 hover:text-white lg:flex',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          ]"
          @click="scrollToAbout"
        >
          <span class="font-mono text-xs uppercase tracking-wide"><ThemedContentString :content="d.hero.scroll" /></span>
          <ChevronDown class="block w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>

    <!--
      Секция «Направления» (без админ-формы контента) всегда фиксирована
      сразу после hero. Остальные секции отрисовываются динамически ниже
      по `sectionOrder` / `sectionVisibility`.
    -->
    <section class="relative bg-white py-20 lg:py-28">
      <div class="mts-content-wrap">
        <div class="mb-12 max-w-7xl">
          <div class="mb-4 flex items-center gap-3">
            <div class="h-px w-6 bg-primary" />
            <span class="section-label"><ThemedContentString :content="d.directions.label" /></span>
          </div>
          <h2 class="font-display text-3xl text-body lg:text-4xl break-words [text-wrap:pretty]">
            <ThemeFormattedTitle :title="d.directions.headingFormatted" />
          </h2>
        </div>
        <div class="grid gap-6" :class="directionsGridClass">
          <div
            v-for="row in d.directions.rows"
            :key="row.title"
            class="service-card corner-accent min-w-0 p-8"
          >
            <h3 class="font-display text-lg text-body"><ThemedContentString :content="row.title" /></h3>
            <p class="mt-3 font-body text-sm text-muted"><ThemedContentString :content="row.description" /></p>
            <NuxtLink :to="localePath(row.href)" class="mts-cta-link-compact mt-6 inline-flex">
              <ThemedContentString :content="row.cta" /> →
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!--
      Динамический блок секций. Порядок задаётся `sectionOrder` (без hero),
      видимость — `sectionVisibility`. Кастомные секции (`custom:<id>`) также
      участвуют в общем порядке.
    -->
    <template v-for="sid in sectionOrderEffective" :key="sid">
      <!-- ===== FUNNEL (3 cards) ===== -->
      <section v-if="sid === 'funnel' && sectionShown('funnel')" class="relative bg-bg-light py-16 lg:py-24">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-linear-to-b from-white to-transparent sm:h-28"
        aria-hidden="true"
      />
      <div class="relative z-10 mts-content-wrap">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-4 lg:gap-6 lg:items-stretch">
          <div class="service-card corner-accent group relative isolate flex h-full min-h-0 min-w-0 flex-col p-5 sm:p-6">
            <div class="relative z-10 flex min-h-0 flex-1 flex-col">
              <div class="mb-2 flex items-center gap-2">
                <div class="h-px w-6 bg-primary" />
                <span class="section-label text-[10px]"><ThemedContentString :content="d.funnelShip.label" /></span>
              </div>
              <h2 class="font-display text-base leading-snug text-body md:text-lg lg:text-xl break-words [text-wrap:pretty]">
                <ThemeFormattedTitle :title="d.funnelShip.titleFormatted" />
              </h2>
              <p class="mt-3 flex-1 font-body text-sm leading-relaxed text-muted">
                <ThemedContentString :content="d.funnelShip.text" />
              </p>
              <NuxtLink :to="localePath(d.funnelShip.href)" class="mts-cta-link-compact mt-5 self-start">
                <ThemedContentString :content="d.funnelShip.cta" /> →
              </NuxtLink>
            </div>
          </div>
          <div class="service-card corner-accent group relative isolate flex h-full min-h-0 min-w-0 flex-col p-5 sm:p-6">
            <div class="relative z-10 flex min-h-0 flex-1 flex-col">
              <div class="mb-2 flex items-center gap-2">
                <div class="h-px w-6 bg-primary" />
                <span class="section-label text-[10px]"><ThemedContentString :content="d.funnelCrewing.label" /></span>
              </div>
              <h2 class="font-display text-base leading-snug text-body md:text-lg lg:text-xl break-words [text-wrap:pretty]">
                <ThemeFormattedTitle :title="d.funnelCrewing.titleFormatted" />
              </h2>
              <p class="mt-3 flex-1 font-body text-sm leading-relaxed text-muted">
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
          <div class="service-card corner-accent group relative isolate flex h-full min-h-0 min-w-0 flex-col p-5 sm:p-6">
            <div class="relative z-10 flex min-h-0 flex-1 flex-col">
              <div class="mb-2 flex items-center gap-2">
                <div class="h-px w-6 bg-primary" />
                <span class="section-label text-[10px]"><ThemedContentString :content="d.funnelTechnical.label" /></span>
              </div>
              <h2 class="font-display text-base leading-snug text-body md:text-lg lg:text-xl break-words [text-wrap:pretty]">
                <ThemeFormattedTitle :title="d.funnelTechnical.titleFormatted" />
              </h2>
              <p class="mt-3 flex-1 font-body text-sm leading-relaxed text-muted">
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

      <!-- ===== ABOUT ===== -->
      <section v-else-if="sid === 'about' && sectionShown('about')" id="about-section" class="relative py-24 lg:py-32 overflow-hidden">
      <div class="mts-content-wrap relative z-10">
        <div
          class="grid gap-16 items-center"
          :class="aboutCarouselSlides.length ? 'lg:grid-cols-2' : ''"
        >
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-primary" />
              <span class="section-label"><ThemedContentString :content="d.about.label" /></span>
            </div>
            <h2 class="font-display text-3xl lg:text-4xl text-body leading-tight mb-6">
              <ThemedContentString v-if="d.about.title?.trim()" :content="d.about.title" />
              <ThemeFormattedTitle v-else :title="d.about.titleFormatted" />
            </h2>
            <p class="font-body text-sm uppercase tracking-wide text-muted/80 mb-3">
              <ThemedContentString :content="d.about.subtitle" />
            </p>
            <div class="w-12 h-0.5 bg-primary mb-6" />
            <div class="space-y-4 mb-6">
              <p class="font-body text-muted leading-relaxed">
                <ThemedContentString :content="d.about.lead" />
              </p>
              <p class="font-body text-muted leading-relaxed">
                <ThemedContentString :content="d.about.lead2" />
              </p>
            </div>
            <div class="mb-8">
              <span class="section-label"><ThemedContentString :content="d.trust.label" /></span>
              <h3 class="font-display mt-3 text-xl text-body">
                <ThemeFormattedTitle :title="d.trust.titleFormatted" />
              </h3>
              <ul class="mt-4 space-y-2 font-body text-sm text-muted">
                <li v-for="(b, bi) in d.trust.bullets" :key="bi" class="flex gap-2">
                  <span class="font-mono text-primary">—</span>
                  <span>{{ b }}</span>
                </li>
              </ul>
            </div>
            <ButtonLink :title="flattenEncodedOrPlain(d.about.more)" link="/about" />
          </div>
          <div v-if="aboutCarouselSlides.length" class="relative">
            <ImageFadeCarousel :slides="aboutCarouselSlides" />
          </div>
        </div>
      </div>
    </section>

      <!-- ===== SERVICES ===== -->
      <section v-else-if="sid === 'services' && sectionShown('services') && visibleServiceCards.length" class="relative py-24 lg:py-32 overflow-hidden bg-bg-light">
      <div class="mts-content-wrap relative z-10">
        <div class="flex items-start justify-between mb-12">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-primary" />
              <span class="section-label"><ThemedContentString :content="d.services.label" /></span>
            </div>
            <h2 class="font-display text-3xl lg:text-4xl text-body break-words [text-wrap:pretty]">
              <ThemeFormattedTitle :title="d.services.headingFormatted" />
            </h2>
          </div>
          <ButtonLink :title="flattenEncodedOrPlain(d.services.all)" link="/services" extra-class="hidden lg:inline-flex" />
        </div>

        <div
          class="grid gap-6"
          :class="visibleServiceCards.length >= 3 ? 'md:grid-cols-3' : visibleServiceCards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-lg'"
        >
          <div
            v-for="service in visibleServiceCards"
            :key="service.key"
            class="service-card overflow-hidden"
          >
            <div class="aspect-[16/9] min-h-[11rem] sm:min-h-[13rem] overflow-hidden border-b border-border bg-bg-light">
              <img
                v-if="service.image"
                :src="service.image"
                :alt="service.title"
                class="h-full w-full object-cover brightness-[1.04] contrast-[1.03] saturate-[1.06]"
                loading="lazy"
                decoding="async"
              />
              <div
                v-else
                class="flex h-full min-h-[11rem] items-center justify-center sm:min-h-[13rem]"
              >
                <component
                  :is="resolveServiceIcon(service.iconKey)"
                  class="h-14 w-14 text-primary/35"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div class="p-8">
              <h3 class="font-display text-xl text-body mb-3">
                {{ service.title }}
              </h3>
              <p class="font-body text-base text-muted mb-4">
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

      <!-- ===== PROCESS ===== -->
      <section v-else-if="sid === 'process' && sectionShown('process')" class="relative border-t border-border bg-bg-light py-20 lg:py-28">
      <div class="relative z-10 mts-content-wrap">
        <div class="mx-auto mb-14 max-w-7xl text-center">
          <div class="mb-4 flex items-center justify-center gap-3">
            <div class="h-px w-6 bg-primary" />
            <span class="section-label"><ThemedContentString :content="d.process.label" /></span>
            <div class="h-px w-6 bg-primary" />
          </div>
          <h2 class="font-display text-3xl text-body lg:text-4xl break-words [text-wrap:pretty]">
            <ThemeFormattedTitle :title="d.process.headingFormatted" />
          </h2>
        </div>
        <div class="grid gap-10 md:grid-cols-3 lg:gap-12">
          <div
            v-for="(step, si) in d.process.steps"
            :key="step.title"
            class="service-card mx-auto flex max-w-sm flex-col items-center p-8 text-center md:max-w-none"
          >
            <div class="mb-4 flex justify-center">
              <img :src="`/images/steps/${si + 1}.svg`" alt="" class="h-20 w-20 shrink-0 opacity-95" width="100" height="100" />
            </div>
            <h3 class="font-display text-xl text-body mb-2"><ThemedContentString :content="step.title" /></h3>
            <p class="font-body text-base text-muted leading-relaxed"><ThemedContentString :content="step.text" /></p>
          </div>
        </div>
      </div>
    </section>

      <!-- ===== CTA ===== -->
      <section v-else-if="sid === 'cta' && sectionShown('cta')" class="relative py-24 overflow-hidden bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 text-center">
        <div class="flex items-center justify-center gap-3 mb-4">
          <div class="w-6 h-px bg-primary" />
            <span class="section-label"><ThemedContentString :content="d.cta.label" /></span>
          <div class="w-6 h-px bg-primary" />
        </div>
        <h2 class="font-display text-3xl lg:text-4xl text-body mb-6">
          <ThemeFormattedTitle :title="d.cta.titleFormatted" />
        </h2>
        <p class="font-body text-muted mb-8 max-w-7xl mx-auto">
          <ThemedContentString :content="d.cta.text" />
        </p>
        <div class="flex justify-center items-center">
          <ButtonLink :title="flattenEncodedOrPlain(d.cta.button)" link="/request" />
        </div>
      </div>
    </section>

      <!-- ===== Custom section (одна на итерацию) ===== -->
      <CommonCustomPageSectionsRender
        v-else-if="sid.startsWith('custom:') && sectionShown(sid)"
        :sections="(d.customSections ?? []).filter((s) => `custom:${s.id}` === sid)"
        :page-crumb-items="customSectionCrumbItems"
      />
    </template>

    <CommonPageInquiryForm v-if="d.showInquiryForm" source-page="home" />
    </template>
  </div>
</template>
