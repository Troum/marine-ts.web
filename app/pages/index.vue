<script setup lang="ts">
import type { HomeHeroOverlayNavLink, HomePageData, MarineContentLocale } from '~/types'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import HomeHeroMarketingSlider from '~/components/home/HomeHeroMarketingSlider.vue'
import { mergeHomePageData, HOME_HERO_OVERLAY_DEFAULT } from '~/utils/pageDefaults'
import { heroOverlaySocialIcons } from '~/utils/heroOverlaySocialIcons'
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'
import { isSectionVisible } from '~/utils/sectionVisibility'

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

const { setHidden: setFooterHidden } = usePageFooterHidden()
watchEffect(() => { setFooterHidden(d.value?.hideFooter ?? false) })

const isVisible = ref(false)
onMounted(() => { isVisible.value = true })

/** Горизонтальные отступы hero: слева — начало «Главная», справа — левый край RU/EN (до бургера). */
const publicHeroSectionRef = ref<HTMLElement | null>(null)
const heroInsetLeft = ref('1.5rem')
const heroInsetRight = ref('1.5rem')

function syncHeroInsetsToNav() {
  if (!import.meta.client) return
  const section = publicHeroSectionRef.value
  if (!section) return
  const sRect = section.getBoundingClientRect()

  const anchor = document.getElementById('nav-horiz-first-anchor')
  if (!anchor) {
    heroInsetLeft.value = '1.5rem'
  }
  else {
    const cs = getComputedStyle(anchor)
    if (cs.display === 'none' || anchor.getClientRects().length === 0) {
      heroInsetLeft.value = '1.5rem'
    }
    else {
      heroInsetLeft.value = `${Math.max(0, Math.round(anchor.getBoundingClientRect().left - sRect.left))}px`
    }
  }

  /** Правый край hero-контента = левый край переключателя RU/EN (до бургера). */
  const langLeftEl = document.getElementById('nav-hero-lang-left')
  if (!langLeftEl) {
    heroInsetRight.value = '1.5rem'
  }
  else {
    const cl = getComputedStyle(langLeftEl)
    if (cl.display === 'none' || langLeftEl.getClientRects().length === 0) {
      heroInsetRight.value = '1.5rem'
    }
    else {
      const langLeft = langLeftEl.getBoundingClientRect().left
      heroInsetRight.value = `${Math.max(0, Math.round(sRect.right - langLeft))}px`
    }
  }
}

let heroInsetRaf = 0
function scheduleHeroInsetSync() {
  if (!import.meta.client) return
  cancelAnimationFrame(heroInsetRaf)
  heroInsetRaf = requestAnimationFrame(() => syncHeroInsetsToNav())
}

onMounted(() => {
  scheduleHeroInsetSync()
  window.addEventListener('resize', scheduleHeroInsetSync)
  window.addEventListener('scroll', scheduleHeroInsetSync, { passive: true })
  nextTick(scheduleHeroInsetSync)
})

onUnmounted(() => {
  window.removeEventListener('resize', scheduleHeroInsetSync)
  window.removeEventListener('scroll', scheduleHeroInsetSync)
  cancelAnimationFrame(heroInsetRaf)
})

watch(locale, () => nextTick(scheduleHeroInsetSync))

watch(homeCmsPending, (pending) => {
  if (!pending) {
    nextTick(() => {
      scheduleHeroInsetSync()
      requestAnimationFrame(scheduleHeroInsetSync)
      setTimeout(scheduleHeroInsetSync, 120)
    })
  }
})

/**
 * Карточки для hero-полосы под первым экраном — без тех, что админ
 * пометил «не показывать в hero». Hover-индекс работает уже в этом списке,
 * чтобы скрытые карточки не считались доступными для подсветки.
 */
const heroDirectionRows = computed(() =>
  (d.value.directions.rows ?? []).filter((row) => row.hideInHero !== true),
)

/**
 * Карточки для нижней секции «Чем мы занимаемся» — без тех, что админ
 * пометил «не показывать в секции». Сама секция дополнительно может быть
 * целиком выключена флагом `directions.showCardsBlock`.
 */
const cardsBlockRows = computed(() =>
  (d.value.directions.rows ?? []).filter((row) => row.hideInCardsBlock !== true),
)

const showDirectionsCardsBlock = computed(
  () => d.value.directions.showCardsBlock !== false && cardsBlockRows.value.length > 0,
)

const activeHeroDirectionIndex = ref<number | null>(0)
const activeHeroDirection = computed(() => {
  const index = activeHeroDirectionIndex.value
  return index === null ? null : heroDirectionRows.value[index] ?? null
})

function heroDirectionTitle(row: { title: string; hoverTitle?: string }) {
  return row.hoverTitle?.trim() || row.title
}

function heroDirectionDescription(row: { description: string; hoverDescription?: string }) {
  return row.hoverDescription?.trim() || row.description
}

const activeHeroVideo = computed(() => {
  if (activeHeroDirection.value?.heroImage?.trim()) {
    return ''
  }
  return d.value.heroVideo?.trim() || ''
})

/** Картинка для постера / статичного фона (без видео для строки с heroImage берётся её картинка). */
const activeHeroPoster = computed(() => {
  const rowImg = activeHeroDirection.value?.heroImage?.trim() || ''
  if (rowImg) {
    return rowImg
  }
  return d.value.heroImage?.trim() || ''
})

const activeHeroImageOnly = computed(() => (activeHeroVideo.value ? '' : activeHeroPoster.value))

const hasHeroBackdrop = computed(() => !!(activeHeroVideo.value || activeHeroImageOnly.value))

const directionsGridClass = computed(() => {
  const count = cardsBlockRows.value.length
  if (count <= 1) {
    return 'grid-cols-1'
  }
  if (count === 2) {
    return 'grid-cols-1 md:grid-cols-2'
  }
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
})

/**
 * Кастомные секции главной — единственный «динамический» блок ниже секции
 * «Чем мы занимаемся». Порядок берётся из `customSections` (как его задал
 * админ в редакторе кастомных секций), видимость — из `sectionVisibility`
 * по ключу `custom:<id>` (отсутствие ключа трактуется как «показывать»).
 */
const visibleCustomSections = computed(() =>
  (d.value.customSections ?? []).filter((s) =>
    isSectionVisible(d.value.sectionVisibility, `custom:${s.id}`),
  ),
)

function mergeHeroOverlay() {
  const o = d.value.heroOverlayRow
  if (!o || typeof o !== 'object') {
    return { ...HOME_HERO_OVERLAY_DEFAULT }
  }
  return {
    enabled: o.enabled === true,
    showLanguageSwitch: o.showLanguageSwitch !== false,
    socialLinks: Array.isArray(o.socialLinks) ? o.socialLinks : [],
    links: Array.isArray(o.links) ? o.links : [],
  }
}

const overlayRow = computed(() => mergeHeroOverlay())

const showHeroOverlayRow = computed(() => {
  const o = overlayRow.value
  if (!o.enabled) {
    return false
  }
  return (
    o.socialLinks.length > 0 ||
    o.links.length > 0 ||
    o.showLanguageSwitch === true
  )
})

function isOverlayExternal(path: string) {
  return /^https?:\/\//i.test(path.trim())
}

function overlayLinkLabel(row: HomeHeroOverlayNavLink) {
  const loc = locale.value === 'en' ? 'en' : 'ru'
  const raw = row.label[loc] || row.label.ru || row.label.en || ''
  return flattenEncodedOrPlain(raw)
}

/** Слайды правой колонки: непустые `marketingSlides` или один блок `lead`. */
const heroMarketingSlidesForSlider = computed(() => {
  const ms = d.value.hero.marketingSlides
  const valid = (ms ?? []).filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
  if (valid.length > 0) {
    return valid
  }
  return [d.value.hero.lead]
})
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
    <section ref="publicHeroSectionRef" class="public-hero relative min-h-[100svh] overflow-x-hidden md:h-screen">
      <!-- Фон -->
      <div class="absolute inset-0">
        <CommonParallaxHeroMedia
          v-if="hasHeroBackdrop"
          :key="`${activeHeroVideo}|${activeHeroPoster}`"
          :image="activeHeroPoster"
          :video="activeHeroVideo"
          :active="isVisible"
          bg-class="hero-bg"
        />
        <div v-else class="absolute inset-0 bg-navy-900" aria-hidden="true" />
        <div
          v-if="hasHeroBackdrop"
          class="pointer-events-none absolute inset-0 z-[1] mts-line-marketing-hero-veil"
          aria-hidden="true"
        />
      </div>

      <div class="relative z-10 flex min-h-[100svh] flex-col md:h-full">
        <div class="pt-24 sm:pt-28 md:pt-32 shrink-0" />
        <div class="flex flex-1 items-center">
          <div
            class="w-full py-12 md:py-0"
            :style="{ paddingLeft: heroInsetLeft, paddingRight: heroInsetRight }"
          >
            <div class="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16 lg:gap-24 items-center">
              <div
                :class="[
                  'transition-all duration-700',
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                ]"
              >
                <h1 class="mts-hero-themed-copy text-[27px] font-bold leading-tight text-primary drop-shadow sm:text-5xl lg:text-6xl">
                  <ThemeFormattedTitle :title="d.hero.titleFormatted" />
                </h1>
                <p class="mt-5 text-base font-semibold leading-snug text-white sm:text-lg lg:text-2xl">
                  <ThemedContentString :content="d.hero.label" />
                </p>
              </div>

              <!-- Правая колонка: маркетинговый текст -->
              <div
                :class="[
                  'transition-all duration-700 delay-150',
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                ]"
              >
                <Transition
                  mode="out-in"
                  enter-active-class="transition-all duration-500 ease-out"
                  enter-from-class="translate-y-3 opacity-0"
                  enter-to-class="translate-y-0 opacity-100"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="translate-y-0 opacity-100"
                  leave-to-class="-translate-y-3 opacity-0"
                >
                  <div :key="activeHeroDirection ? `dir-${activeHeroDirectionIndex}` : 'default'">
                    <div
                      v-if="activeHeroDirection"
                      class="mts-hero-themed-copy space-y-5 text-[11px] font-body leading-relaxed text-white/85 md:text-2xl"
                    >
                      <ThemedContentString :content="heroDirectionDescription(activeHeroDirection)" />
                    </div>
                    <HomeHeroMarketingSlider
                      v-else
                      :slides="heroMarketingSlidesForSlider"
                      :autoplay-ms="d.hero.marketingAutoplayMs ?? 0"
                    />
                    <!-- CTA кнопки (опционально) -->
                    <div
                      v-if="!activeHeroDirection && (!d.hero.hideCtaClient || !d.hero.hideCtaSeafarer)"
                      class="mt-8 flex flex-wrap gap-3"
                    >
                      <NuxtLink v-if="!d.hero.hideCtaClient" :to="localePath(d.hero.ctaClientHref)" class="btn-primary">
                        <ThemedContentString :content="d.hero.ctaClient" />
                      </NuxtLink>
                      <NuxtLink v-if="!d.hero.hideCtaSeafarer" :to="localePath(d.hero.ctaSeafarerHref)" class="btn-secondary-glass">
                        <ThemedContentString :content="d.hero.ctaSeafarer" />
                      </NuxtLink>
                    </div>
                  </div>
                </Transition>
              </div>

            </div>
          </div>
        </div>
        <div
          v-if="showHeroOverlayRow"
          class="absolute left-0 right-0 z-20"
          :class="heroDirectionRows.length ? 'bottom-24 md:bottom-28' : 'bottom-10'"
        >
          <div
            class="w-full pb-4 pt-10 md:py-4"
            :style="{ paddingLeft: heroInsetLeft, paddingRight: heroInsetRight }"
          >
          <div class="flex flex-wrap items-center gap-5">
            <div v-if="overlayRow.socialLinks.length" class="flex items-center gap-4">
              <a
                v-for="(s, i) in overlayRow.socialLinks"
                :key="`hero-soc-${i}`"
                :href="s.href"
                target="_blank"
                rel="noopener noreferrer"
                class="text-white/75 transition-colors hover:text-primary"
                :aria-label="s.iconKey"
              >
                <component
                  :is="heroOverlaySocialIcons[s.iconKey] ?? heroOverlaySocialIcons.link"
                  class="h-6 w-6 shrink-0"
                />
              </a>
            </div>
            <template v-for="(lnk, i) in overlayRow.links" :key="`hero-lnk-${i}`">
              <NuxtLink
                v-if="!isOverlayExternal(lnk.path)"
                :to="localePath(lnk.path)"
                class="group flex items-center gap-2 font-body text-sm text-white/80 transition-colors hover:text-primary"
              >
                {{ overlayLinkLabel(lnk) }}
                <span class="transition-transform group-hover:translate-x-1">→</span>
              </NuxtLink>
              <a
                v-else
                :href="lnk.path"
                target="_blank"
                rel="noopener noreferrer"
                class="group flex items-center gap-2 font-body text-sm text-white/80 transition-colors hover:text-primary"
              >
                {{ overlayLinkLabel(lnk) }}
                <span class="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </template>
            <LayoutLanguageSwitch v-if="overlayRow.showLanguageSwitch" dark class="shrink-0" />
          </div>
          </div>
        </div>
        <div v-if="heroDirectionRows.length" class="relative z-20 shrink-0">
          <div class="flex flex-col md:flex-row">
            <NuxtLink
              v-for="(row, index) in heroDirectionRows"
              :key="row.title"
              :to="localePath(row.href)"
              class="nav-card group relative min-w-0 flex-1 border-t border-white/20 bg-black/40 transition-all duration-500 hover:bg-primary/90 focus-visible:bg-primary/90 md:border-r md:last:border-r-0"
              :class="activeHeroDirectionIndex === index ? 'md:bg-primary/90' : ''"
              @mouseenter="activeHeroDirectionIndex = index"
              @focus="activeHeroDirectionIndex = index"
            >
              <div class="flex items-center justify-between px-4 py-4 sm:py-5 md:py-8">
                <span class="text-sm font-medium text-white sm:text-base lg:text-lg">
                  <ThemedContentString :content="row.title" />
                </span>
                <span class="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-white/10 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/20 sm:h-10 sm:w-10">
                  →
                </span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-transparent transition-colors group-hover:bg-white" />
            </NuxtLink>
          </div>
        </div>

      </div>
    </section>
    <section
      v-if="showDirectionsCardsBlock"
      id="directions-section"
      class="relative bg-white py-20 lg:py-28"
    >
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
        <div class="grid gap-6 items-stretch" :class="directionsGridClass">
          <div
            v-for="row in cardsBlockRows"
            :key="row.title"
            class="service-card corner-accent flex h-full min-w-0 flex-col p-6 sm:p-8"
          >
            <h3 class="font-display text-lg text-body"><ThemedContentString :content="row.title" /></h3>
            <p class="mt-3 flex-1 font-body text-sm text-muted"><ThemedContentString :content="row.description" /></p>
            <NuxtLink :to="localePath(row.href)" class="mts-cta-link-compact mt-6 inline-flex self-start">
              <ThemedContentString :content="row.cta" /> →
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <CommonCustomPageSectionsRender
      v-if="visibleCustomSections.length"
      :sections="visibleCustomSections"
      :page-crumb-items="customSectionCrumbItems"
    />

    <CommonPageInquiryForm
      v-if="d.showInquiryForm"
      source-page="home"
      :hide-intro="d.hideInquiryFormIntro === true"
      :hide-form-card-heading="d.hideInquiryFormCardHeading === true"
      :config="d.inquiryForm"
    />
    </template>
  </div>
</template>
