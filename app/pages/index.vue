<script setup lang="ts">
import type { HomeHeroOverlayNavLink, HomePageData, MarineContentLocale } from '~/types'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
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

const activeHeroImage = computed(() => activeHeroDirection.value?.heroImage?.trim() || d.value.heroImage?.trim() || '')

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
    <section class="public-hero relative min-h-[100svh] overflow-x-hidden md:h-screen">
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

      <div class="relative z-10 flex min-h-[100svh] flex-col justify-between md:h-full">
        <div class="pt-24 sm:pt-28 md:pt-32" />

        <div class="flex flex-1 items-center justify-center px-4 pb-8 md:pb-0">
          <div class="w-full max-w-4xl text-center">
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
                  class="mts-hero-themed-copy mb-4 text-2xl font-bold leading-tight text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl"
                >
                  <ThemedContentString
                    v-if="activeHeroDirection"
                    :content="heroDirectionTitle(activeHeroDirection)"
                  />
                  <ThemeFormattedTitle v-else :title="d.hero.titleFormatted" />
                </h1>
                <p
                  class="mts-hero-themed-copy mx-auto max-w-2xl text-base leading-relaxed text-white/90 drop-shadow sm:text-lg md:text-xl"
                >
                  <ThemedContentString
                    :content="activeHeroDirection ? heroDirectionDescription(activeHeroDirection) : d.hero.lead"
                  />
                </p>
              </div>
            </Transition>
            <div
              v-if="!d.hero.hideCtaClient || !d.hero.hideCtaSeafarer"
              :class="[
                'mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <NuxtLink v-if="!d.hero.hideCtaClient" :to="localePath(d.hero.ctaClientHref)" class="btn-primary w-full sm:w-auto">
                <ThemedContentString :content="d.hero.ctaClient" />
              </NuxtLink>
              <NuxtLink v-if="!d.hero.hideCtaSeafarer" :to="localePath(d.hero.ctaSeafarerHref)" class="btn-secondary-glass w-full sm:w-auto">
                <ThemedContentString :content="d.hero.ctaSeafarer" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-if="heroDirectionRows.length" class="relative z-20">
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

        <div
          v-if="showHeroOverlayRow"
          class="absolute bottom-10 left-0 right-0 z-20"
        >
          <div class="mx-auto max-w-[70%] px-6 py-4 md:px-0">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div v-if="overlayRow.socialLinks.length" class="flex flex-wrap items-center gap-4">
                <a
                  v-for="(s, i) in overlayRow.socialLinks"
                  :key="`hero-ov-soc-${i}-${s.href}`"
                  :href="s.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-white/85 transition-colors hover:text-primary"
                  :aria-label="s.iconKey"
                >
                  <component
                    :is="heroOverlaySocialIcons[s.iconKey] ?? heroOverlaySocialIcons.link"
                    class="h-6 w-6 shrink-0"
                  />
                </a>
              </div>
              <div
                :class="[
                  'flex flex-wrap items-center gap-x-6 gap-y-2 md:justify-end',
                  overlayRow.socialLinks.length ? '' : 'md:ml-auto',
                ]"
              >
                <template v-for="(lnk, i) in overlayRow.links" :key="`hero-ov-lnk-${i}-${lnk.path}`">
                  <NuxtLink
                    v-if="!isOverlayExternal(lnk.path)"
                    :to="localePath(lnk.path)"
                    class="font-body text-sm text-white/90 underline-offset-4 transition-colors hover:text-primary"
                  >
                    {{ overlayLinkLabel(lnk) }}
                  </NuxtLink>
                  <a
                    v-else
                    :href="lnk.path"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-body text-sm text-white/90 underline-offset-4 transition-colors hover:text-primary"
                  >
                    {{ overlayLinkLabel(lnk) }}
                  </a>
                </template>
                <LayoutLanguageSwitch v-if="overlayRow.showLanguageSwitch" dark class="shrink-0" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!--
      Секция «Чем мы занимаемся» (без админ-формы контента) фиксирована сразу
      после hero. Видимостью управляет `directions.showCardsBlock`, а внутри
      грида — фильтр `hideInCardsBlock` на каждой карточке. Ниже идут только
      пользовательские секции, которые админ добавил через редактор кастомных
      секций.
    -->
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
