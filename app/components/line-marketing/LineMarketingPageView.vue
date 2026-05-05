<script setup lang="ts">
import { Calculator, GraduationCap, Heart, Search, Shield } from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ButtonLink from '~/components/common/ButtonLink.vue'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { sanitizeRichContentHtml } from '~/composables/useMarkdownSafeHtml'
import { incomingCmsValueToHtml } from '~/utils/adminHtmlField'
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'
import LineMarketingCustomSectionView from '~/components/line-marketing/LineMarketingCustomSectionView.vue'
import LineSectionMediaBackdrop from '~/components/line-marketing/LineSectionMediaBackdrop.vue'
import AboutSectionContentParallax from '~/components/about/AboutSectionContentParallax.vue'
import MarinReveal from '~/components/about/MarinReveal.vue'
import type {
  CrewingManagementPageContent,
  CrewingDirectionItem,
  CrewingPageData,
  LnkPageContent,
  LineMarketingCustomSection,
  MarineContentLocale,
  ShipManagementPageContent,
} from '~/types'
import { CREWING_MANAGEMENT_V2_SECTION_ORDER } from '~/utils/crewingManagementPageDefaults'
import { LNK_V2_SECTION_ORDER } from '~/utils/lnkManagementPageDefaults'
import { SHIP_MANAGEMENT_V2_SECTION_ORDER } from '~/utils/shipManagementPageDefaults'
import { buildCrewingChecklistRenderRows, countFilledCrewingChecklistPoints } from '~/utils/crewingChecklistDefaults'
import { defaultLinePageData, mergeLinePageData } from '~/utils/pageDefaults'
import { resolveHeroBreadcrumbOnDark } from '~/utils/pageBreadcrumbTone'
import type { LineMarketingPageSlug } from '~/utils/lineMarketingPages'
import { LINE_MARKETING_PAGE_LAYOUT, LINE_MARKETING_SECTION_DEFAULT_ORDER } from '~/utils/lineMarketingPages'
import { buildLineMarketingLayoutChunks, type LineMarketingLayoutChunk } from '~/utils/lineMarketingSectionLayout'
import { resolveCrewingIcon } from '~/utils/crewingIcons'
import { visibleOrderedSections } from '~/utils/sectionVisibility'

const props = defineProps<{
  slug: LineMarketingPageSlug
}>()

useSiteSeoMeta(props.slug)

type LineMarketingV2Payload =
  | { kind: 'crewing'; data: CrewingManagementPageContent }
  | { kind: 'ship'; data: ShipManagementPageContent }
  | { kind: 'lnk'; data: LnkPageContent }

const approachIconLists = {
  /** Лупа (отбор), сердце (loyalty), диплом (обучение). */
  crewing: [Search, Heart, GraduationCap] as const,
  ship: [Shield, Calculator, Search] as const,
}
const serviceDecorIcons = ['ClipboardList', 'Plane', 'Users', 'PieChart', 'RefreshCw'] as const
const advantageDecorIcons = ['Database', 'Scale', 'BadgeCheck'] as const

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const heroVisible = ref(false)
const layout = computed(() => LINE_MARKETING_PAGE_LAYOUT[props.slug])

onMounted(() => {
  heroVisible.value = true
})

const { data: cmsPage } = await useAsyncData(
  () => `line-page-${props.slug}-cms-${locale.value}`,
  async () => {
    try {
      return await api.contentPages.getPublicBySlug(props.slug)
    } catch {
      return null
    }
  },
  { server: true, watch: [locale] },
)

const cms = computed<CrewingPageData>(() => {
  const body = cmsPage.value?.body
  if (body) {
    try {
      const parsed = JSON.parse(body) as unknown
      return mergeLinePageData(loc.value, parsed, props.slug)
    } catch {
      /* fall through */
    }
  }
  return defaultLinePageData(props.slug, loc.value)
})

const { setHidden: setFooterHidden } = usePageFooterHidden()
watchEffect(() => { setFooterHidden(cms.value?.hideFooter ?? false) })

const lineV2 = computed((): LineMarketingV2Payload | null => {
  if (props.slug === 'crewing-management' && cms.value.crewingPageLayout === 'v2' && cms.value.crewingV2) {
    return { kind: 'crewing', data: cms.value.crewingV2 }
  }
  if (props.slug === 'ship-management' && cms.value.shipPageLayout === 'v2' && cms.value.shipV2) {
    return { kind: 'ship', data: cms.value.shipV2 }
  }
  if (props.slug === 'lnk' && cms.value.lnkV2) {
    return { kind: 'lnk', data: cms.value.lnkV2 }
  }
  return null
})

const isLineV2 = computed(() => lineV2.value !== null)

function lineRichHtml(raw: string | undefined | null): string {
  return sanitizeRichContentHtml(incomingCmsValueToHtml(raw ?? ''))
}

/** До 3 карточек в ряд (сетка 6 колонок): остаток 2 — на всю ширину; один хвост — по центру; единственная — влево. */
function lineV2CardsGridItemClass(index: number, total: number): string {
  if (total <= 0) {
    return 'min-w-0'
  }
  const rem = total % 3
  const itemsInLastRow = rem === 0 ? 3 : rem
  const firstIdxLastRow = total - itemsInLastRow

  let md = ''
  if (index < firstIdxLastRow) {
    md = 'md:col-span-2'
  } else if (itemsInLastRow === 1) {
    md = total === 1 ? 'md:col-span-2' : 'md:col-span-2 md:col-start-3'
  } else if (itemsInLastRow === 2) {
    md = 'md:col-span-3'
  } else {
    md = 'md:col-span-2'
  }
  return `min-w-0 ${md}`
}

function approachDecorIcon(idx: number) {
  const k = lineV2.value?.kind ?? 'crewing'
  const list = k === 'ship' ? approachIconLists.ship : approachIconLists.crewing
  return list[Math.min(idx, list.length - 1)]!
}

const lineV2SectionOrder = computed(() => {
  if (!lineV2.value) {
    return []
  }
  if (lineV2.value.kind === 'lnk') {
    return visibleOrderedSections(
      cms.value.sectionOrder,
      LNK_V2_SECTION_ORDER,
      cms.value.customSections,
      cms.value.sectionVisibility,
    )
  }
  const def =
    lineV2.value.kind === 'crewing' ? CREWING_MANAGEMENT_V2_SECTION_ORDER : SHIP_MANAGEMENT_V2_SECTION_ORDER
  return visibleOrderedSections(
    cms.value.sectionOrder,
    def,
    cms.value.customSections,
    cms.value.sectionVisibility,
  )
})

const crumbItems = computed(() =>
  breadcrumbs({
    label: t(layout.value.navI18nKey),
    to: `/${props.slug}`,
  }),
)

const checklistVisible = computed(
  () => countFilledCrewingChecklistPoints(cms.value.checklist.sections) > 0,
)

const checklistRows = computed(() => buildCrewingChecklistRenderRows(cms.value.checklist))

const heroEyebrow = computed(() => cms.value.hero.label?.trim() || t(layout.value.heroEyebrowI18nKey))

const heroBgUrl = computed(() => {
  const fromCms = cms.value.heroBackgroundImage?.trim()
  const fromLayout = layout.value.heroBg?.trim()
  return fromCms || fromLayout || ''
})

const checklistHeadingId = computed(() => `${props.slug}-checklist-heading`)

const layoutChunks = computed(() =>
  buildLineMarketingLayoutChunks(
    cms.value.sectionOrder,
    cms.value.sectionVisibility,
    LINE_MARKETING_SECTION_DEFAULT_ORDER,
  ),
)

function customSectionById(id: string): LineMarketingCustomSection | undefined {
  return cms.value.customSections?.find((s) => s.id === id)
}

const directionCardClass =
  'service-card corner-accent p-8'

function directionDetailPath(item: CrewingDirectionItem): string | null {
  const s = item.detailSlug?.trim()
  if (!s) {
    return null
  }
  return localePath(`/${props.slug}/${s}`)
}

const visibleHeroButtons = computed(() =>
  (cms.value.heroButtons ?? [])
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
    'inline-flex min-h-11 items-center justify-center whitespace-nowrap px-6 font-body text-sm transition-colors'
  if (idx === 0) {
    return `${base} btn-primary`
  }
  return `${base} btn-secondary-glass`
}

const heroBreadcrumbAutoOnDark = computed(
  () => isLineV2.value && heroBgUrl.value.trim().length > 0,
)

const heroBreadcrumbsOnDark = computed(() =>
  resolveHeroBreadcrumbOnDark(cms.value.heroBreadcrumbTone, heroBreadcrumbAutoOnDark.value),
)

function sectionBgUrl(sectionKey: string): string {
  return cms.value.sectionBackgroundImages?.[sectionKey]?.trim() ?? ''
}

function lineSecShell(sectionKey: string, paddingClass: string, opts?: { topBorder?: boolean }): string {
  const u = sectionBgUrl(sectionKey)
  const parts = ['relative', 'overflow-hidden', paddingClass]
  if (opts?.topBorder) {
    parts.push(u ? 'border-t border-white/15' : 'border-t border-border')
  }
  if (!u) {
    parts.push('bg-white')
  }
  return parts.join(' ')
}

function legacyPairBg(left: string, right: string): string {
  return sectionBgUrl(left) || sectionBgUrl(right)
}

function legacyPairShellClass(chunk: Extract<LineMarketingLayoutChunk, { kind: 'pair' }>): string {
  const u = legacyPairBg(chunk.left, chunk.right)
  const parts = ['relative', 'overflow-hidden', 'py-24']
  if (!u) {
    parts.push('bg-white')
  }
  return parts.join(' ')
}

const LNK_GRID_CLASS: Record<number, string> = {
  1: 'grid grid-cols-1 gap-5 md:items-stretch md:gap-5',
  2: 'grid grid-cols-1 gap-5 md:grid-cols-2 md:items-stretch md:gap-5',
  3: 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 md:items-stretch md:gap-5',
  4: 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 md:items-stretch md:gap-5',
  5: 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:items-stretch md:gap-5',
  6: 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:items-stretch md:gap-5',
}

function lnkSectionGridClass(columns: number | undefined): string {
  const c = Math.min(6, Math.max(1, columns ?? 3))
  return LNK_GRID_CLASS[c] ?? LNK_GRID_CLASS[3]!
}

</script>

<template>
  <div class="relative mts-line-marketing-root bg-white">
    <section
      :class="[
        'relative flex items-center overflow-hidden',
        props.slug === 'ship-management' || props.slug === 'lnk' || isLineV2 ? 'min-h-[100svh]' : 'min-h-[min(88vh,920px)]',
      ]"
    >
      <div class="absolute top-0 left-1/4 h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent" />
      <div class="absolute top-0 right-1/4 h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent" />

      <div class="absolute inset-0">
        <CommonParallaxHeroMedia :image="heroBgUrl" :active="heroVisible" />
        <div
          v-if="isLineV2"
          class="pointer-events-none absolute inset-0 z-[1] mts-line-marketing-hero-veil"
          aria-hidden="true"
        />
      </div>

      <div class="relative z-10 mts-content-wrap w-full pb-20 pt-28">
        <template v-if="lineV2">
          <AboutSectionContentParallax :max-shift="32" :factor="0.085" class="w-full max-w-none">
            <div class="w-full max-w-7xl">
              <MarinReveal>
                <Breadcrumbs :items="crumbItems" :on-dark-hero="heroBreadcrumbsOnDark" />
                <div class="mb-4 flex items-center gap-3">
                  <div class="h-px w-8 bg-primary" />
                  <span class="section-label"><ThemedContentString :content="heroEyebrow" /></span>
                </div>
              </MarinReveal>
              <MarinReveal :delay-ms="120">
                <h1
                  class="mts-hero-themed-copy font-display mb-6 text-3xl leading-tight text-white drop-shadow-md lg:text-4xl"
                >
                  <ThemedContentString :content="lineV2.data.sec1Hero.title" />
                </h1>
              </MarinReveal>
              <MarinReveal :delay-ms="180">
                <div class="mb-6 h-0.5 w-12 bg-white" />
                <p
                  class="mts-hero-themed-copy font-body text-lg leading-relaxed text-white/95 drop-shadow"
                >
                  <ThemedContentString :content="lineV2.data.sec1Hero.lead" />
                </p>
              </MarinReveal>
              <MarinReveal v-if="lineV2.data.sec1Hero.body.trim()" :delay-ms="240">
                <div
                  class="mts-hero-themed-copy mts-markdown mt-6 max-w-3xl text-base leading-relaxed text-white/90 [&_strong]:text-white"
                  v-html="lineRichHtml(lineV2.data.sec1Hero.body)"
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
                      ><ThemedContentString :content="btn.label"
                    /></NuxtLink>
                  </template>
                </div>
              </MarinReveal>
            </div>
          </AboutSectionContentParallax>
        </template>
        <AboutSectionContentParallax
          v-else
          :max-shift="32"
          :factor="0.085"
          class="w-full max-w-none"
        >
          <div class="w-full max-w-7xl">
            <Breadcrumbs :items="crumbItems" :on-dark-hero="heroBreadcrumbsOnDark" />
            <div
              :class="[
                'mb-4 flex items-center gap-3 transition-all duration-600',
                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <div class="h-px w-8 bg-primary" />
              <span class="section-label"><ThemedContentString :content="heroEyebrow" /></span>
            </div>
            <h1
              :class="[
                'font-display mb-6 text-3xl leading-tight text-body transition-all duration-600 lg:text-4xl',
                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                isLineV2 ? 'mts-hero-themed-copy text-white drop-shadow-md' : '',
              ]"
            >
              <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
            </h1>
            <div
              :class="[
                'mb-6 h-0.5 w-12 bg-primary transition-all duration-600',
                isLineV2 ? 'bg-white' : '',
                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            />
            <p
              :class="[
                'font-body text-lg leading-relaxed transition-all duration-600',
                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                isLineV2 ? 'mts-hero-themed-copy text-white/95 drop-shadow' : 'text-muted',
              ]"
            >
              <ThemedContentString :content="cms.hero.lead" />
            </p>
            <div
              v-if="visibleHeroButtons.length > 0"
              :class="[
                'mt-8 flex flex-wrap gap-4 transition-all duration-600',
                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
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
                  ><ThemedContentString :content="btn.label"
                /></NuxtLink>
              </template>
            </div>
          </div>
        </AboutSectionContentParallax>
      </div>
    </section>

    <template v-if="lineV2 && lineV2.kind !== 'lnk'">
      <template v-for="sid in lineV2SectionOrder" :key="sid">
        <MarinReveal v-if="isLineV2 && sid.startsWith('custom:') && customSectionById(sid.slice(7))">
          <LineMarketingCustomSectionView
            :section="customSectionById(sid.slice(7))!"
            :slug="props.slug"
            :page-crumb-items="crumbItems"
            :page-section-media-url="sectionBgUrl(sid)"
          />
        </MarinReveal>
        <LineMarketingCustomSectionView
          v-else-if="sid.startsWith('custom:') && customSectionById(sid.slice(7))"
          :section="customSectionById(sid.slice(7))!"
          :slug="props.slug"
          :page-crumb-items="crumbItems"
          :page-section-media-url="sectionBgUrl(sid)"
        />

        <section
          v-else-if="sid === 'approach'"
          :class="lineSecShell('approach', 'py-24')"
        >
          <LineSectionMediaBackdrop :image-url="sectionBgUrl('approach')" />
          <AboutSectionContentParallax
            v-if="isLineV2"
            :max-shift="32"
            :factor="0.085"
            class="relative z-10 mts-content-wrap"
          >
            <MarinReveal>
              <h2 class="font-display mb-6 text-xl text-body md:text-2xl">
                <ThemedContentString :content="lineV2.data.sec2Approach.title" />
              </h2>
            </MarinReveal>
            <MarinReveal :delay-ms="120">
              <div
                class="mts-markdown max-w-3xl font-body leading-relaxed text-muted"
                v-html="lineRichHtml(lineV2.data.sec2Approach.body)"
              />
            </MarinReveal>
            <MarinReveal v-if="lineV2.data.sec2Approach.cardsHeading.trim()" :delay-ms="180">
              <p class="font-display mt-10 mb-6 text-lg text-body">
                <ThemedContentString :content="lineV2.data.sec2Approach.cardsHeading" />
              </p>
            </MarinReveal>
            <div
              v-if="lineV2.data.sec2Approach.cards.length && lineV2.kind === 'crewing'"
              class="grid grid-cols-1 gap-6 md:grid-cols-6 md:items-stretch md:gap-6 md:[grid-auto-rows:1fr]"
            >
              <MarinReveal
                v-for="(c, i) in lineV2.data.sec2Approach.cards"
                :key="`ap-${i}`"
                :delay-ms="220 + i * 70"
                :content-class="`h-full min-h-0 ${lineV2CardsGridItemClass(i, lineV2.data.sec2Approach.cards.length)}`"
              >
                <div class="corner-accent service-card flex h-full min-h-0 min-w-0 flex-col p-6">
                  <component :is="approachDecorIcon(i)" class="mb-4 h-9 w-9 shrink-0 text-primary" />
                  <h3 class="font-display mb-3 shrink-0 text-lg text-body">
                    <ThemedContentString :content="c.title" />
                  </h3>
                  <div
                    class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                    v-html="lineRichHtml(c.text)"
                  />
                </div>
              </MarinReveal>
            </div>
            <MarinReveal v-else-if="lineV2.data.sec2Approach.cards.length" :delay-ms="220">
              <div
                class="grid grid-cols-1 gap-6 md:grid-cols-6 md:items-stretch md:gap-6 md:[grid-auto-rows:1fr]"
              >
                <div
                  v-for="(c, i) in lineV2.data.sec2Approach.cards"
                  :key="`ap-${i}`"
                  :class="[
                    'corner-accent service-card flex h-full min-h-0 min-w-0 flex-col p-6',
                    lineV2CardsGridItemClass(i, lineV2.data.sec2Approach.cards.length),
                  ]"
                >
                  <component :is="approachDecorIcon(i)" class="mb-4 h-9 w-9 shrink-0 text-primary" />
                  <h3 class="font-display mb-3 shrink-0 text-lg text-body">
                    <ThemedContentString :content="c.title" />
                  </h3>
                  <div
                    class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                    v-html="lineRichHtml(c.text)"
                  />
                </div>
              </div>
            </MarinReveal>
          </AboutSectionContentParallax>
          <div v-else class="relative z-10 mts-content-wrap">
            <h2 class="font-display mb-6 text-xl text-body md:text-2xl">
              <ThemedContentString :content="lineV2.data.sec2Approach.title" />
            </h2>
            <div
              class="mts-markdown max-w-3xl font-body leading-relaxed text-muted"
              v-html="lineRichHtml(lineV2.data.sec2Approach.body)"
            />
            <p
              v-if="lineV2.data.sec2Approach.cardsHeading.trim()"
              class="font-display mt-10 mb-6 text-lg text-body"
            >
              <ThemedContentString :content="lineV2.data.sec2Approach.cardsHeading" />
            </p>
            <div
              class="grid grid-cols-1 gap-6 md:grid-cols-6 md:items-stretch md:gap-6 md:[grid-auto-rows:1fr]"
            >
              <div
                v-for="(c, i) in lineV2.data.sec2Approach.cards"
                :key="`ap-${i}`"
                :class="[
                  'corner-accent service-card flex h-full min-h-0 min-w-0 flex-col p-6',
                  lineV2CardsGridItemClass(i, lineV2.data.sec2Approach.cards.length),
                ]"
              >
                <component :is="approachDecorIcon(i)" class="mb-4 h-9 w-9 shrink-0 text-primary" />
                <h3 class="font-display mb-3 shrink-0 text-lg text-body">
                  <ThemedContentString :content="c.title" />
                </h3>
                <div
                  class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                  v-html="lineRichHtml(c.text)"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          v-else-if="sid === 'checklist' && checklistVisible"
          :aria-labelledby="checklistHeadingId"
          :class="lineSecShell('checklist', 'py-16', { topBorder: true })"
        >
          <LineSectionMediaBackdrop :image-url="sectionBgUrl('checklist')" />
          <AboutSectionContentParallax :max-shift="32" :factor="0.085" class="relative z-10 mts-content-wrap">
            <MarinReveal>
              <h2
                :id="checklistHeadingId"
                :class="
                  cms.checklist.sectionTitle.trim()
                    ? 'font-display mb-8 text-xl text-body md:text-2xl'
                    : 'sr-only'
                "
              >
                <ThemedContentString
                  :content="cms.checklist.sectionTitle.trim() || t('pages.lineMarketing.checklistSection')"
                />
              </h2>
            </MarinReveal>
            <MarinReveal v-if="cms.checklist.intro.trim()" :delay-ms="120">
              <p class="mb-8 font-body leading-relaxed text-muted">
                <ThemedContentString :content="cms.checklist.intro" />
              </p>
            </MarinReveal>
            <MarinReveal :delay-ms="200">
              <div class="space-y-1">
                <template v-for="(row, ri) in checklistRows" :key="`v2-chk-${ri}`">
                  <h3
                    v-if="row.type === 'heading'"
                    :class="[
                      'font-display border-b border-border pb-2 text-lg text-body',
                      ri === 0 ? 'mt-0' : 'mt-8',
                    ]"
                  >
                    <ThemedContentString :content="row.text" />
                  </h3>
                  <div
                    v-else
                    class="flex gap-3 border-b border-border/70 py-3 font-body text-sm leading-relaxed text-muted last:border-b-0"
                  >
                    <span class="mt-0.5 shrink-0 tabular-nums text-primary">{{ row.num }}.</span>
                    <p>
                      <span class="font-medium text-body"><ThemedContentString :content="row.title" /></span>
                      <ThemedContentString :content="row.text" />
                    </p>
                  </div>
                </template>
              </div>
            </MarinReveal>
          </AboutSectionContentParallax>
        </section>

        <section
          v-else-if="sid === 'services'"
          :class="lineSecShell('services', 'py-24')"
        >
          <LineSectionMediaBackdrop :image-url="sectionBgUrl('services')" />
          <AboutSectionContentParallax
            v-if="isLineV2"
            :max-shift="32"
            :factor="0.085"
            class="relative z-10 mts-content-wrap"
          >
            <MarinReveal>
              <h2 class="font-display mb-4 text-center text-xl text-body md:text-2xl">
                <ThemedContentString :content="lineV2.data.sec3Services.title" />
              </h2>
            </MarinReveal>
            <MarinReveal v-if="lineV2.data.sec3Services.body.trim()" :delay-ms="120">
              <div
                class="mts-markdown mx-auto mb-12 max-w-3xl text-center font-body leading-relaxed text-muted"
                v-html="lineRichHtml(lineV2.data.sec3Services.body)"
              />
            </MarinReveal>
            <div
              v-if="lineV2.data.sec3Services.cards.length && lineV2.kind === 'crewing'"
              class="grid grid-cols-1 gap-5 md:grid-cols-6 md:items-stretch md:gap-5 md:[grid-auto-rows:1fr]"
            >
              <MarinReveal
                v-for="(c, i) in lineV2.data.sec3Services.cards"
                :key="`sv-${i}`"
                :delay-ms="200 + i * 70"
                :content-class="`h-full min-h-0 ${lineV2CardsGridItemClass(i, lineV2.data.sec3Services.cards.length)}`"
              >
                <div
                  class="corner-accent flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-mts-border bg-white p-6 shadow-sm"
                >
                  <div class="mb-3 flex shrink-0 items-start justify-between gap-2">
                    <span class="font-display text-3xl tabular-nums text-primary">
                      {{ String(i + 1).padStart(2, '0') }}
                    </span>
                    <component
                      :is="resolveCrewingIcon(serviceDecorIcons[Math.min(i, serviceDecorIcons.length - 1)] ?? 'Ship')"
                      class="h-7 w-7 shrink-0 text-primary"
                    />
                  </div>
                  <h3 class="font-display mb-3 shrink-0 text-base text-body">
                    <ThemedContentString :content="c.title" />
                  </h3>
                  <div
                    class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                    v-html="lineRichHtml(c.text)"
                  />
                </div>
              </MarinReveal>
            </div>
            <MarinReveal v-else-if="lineV2.data.sec3Services.cards.length" :delay-ms="200">
              <div
                class="grid grid-cols-1 gap-5 md:grid-cols-6 md:items-stretch md:gap-5 md:[grid-auto-rows:1fr]"
              >
                <div
                  v-for="(c, i) in lineV2.data.sec3Services.cards"
                  :key="`sv-${i}`"
                  :class="[
                    'corner-accent flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-mts-border bg-white p-6 shadow-sm',
                    lineV2CardsGridItemClass(i, lineV2.data.sec3Services.cards.length),
                  ]"
                >
                  <div class="mb-3 flex shrink-0 items-start justify-between gap-2">
                    <span class="font-display text-3xl tabular-nums text-primary">
                      {{ String(i + 1).padStart(2, '0') }}
                    </span>
                    <component
                      :is="resolveCrewingIcon(serviceDecorIcons[Math.min(i, serviceDecorIcons.length - 1)] ?? 'Ship')"
                      class="h-7 w-7 shrink-0 text-primary"
                    />
                  </div>
                  <h3 class="font-display mb-3 shrink-0 text-base text-body">
                    <ThemedContentString :content="c.title" />
                  </h3>
                  <div
                    class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                    v-html="lineRichHtml(c.text)"
                  />
                </div>
              </div>
            </MarinReveal>
          </AboutSectionContentParallax>
          <div v-else class="relative z-10 mts-content-wrap">
            <h2 class="font-display mb-4 text-center text-xl text-body md:text-2xl">
              <ThemedContentString :content="lineV2.data.sec3Services.title" />
            </h2>
            <div
              v-if="lineV2.data.sec3Services.body.trim()"
              class="mts-markdown mx-auto mb-12 max-w-3xl text-center font-body leading-relaxed text-muted"
              v-html="lineRichHtml(lineV2.data.sec3Services.body)"
            />
            <div
              class="grid grid-cols-1 gap-5 md:grid-cols-6 md:items-stretch md:gap-5 md:[grid-auto-rows:1fr]"
            >
              <div
                v-for="(c, i) in lineV2.data.sec3Services.cards"
                :key="`sv-${i}`"
                :class="[
                  'corner-accent flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-mts-border bg-white p-6 shadow-sm',
                  lineV2CardsGridItemClass(i, lineV2.data.sec3Services.cards.length),
                ]"
              >
                <div class="mb-3 flex shrink-0 items-start justify-between gap-2">
                  <span class="font-display text-3xl tabular-nums text-primary">
                    {{ String(i + 1).padStart(2, '0') }}
                  </span>
                  <component
                    :is="resolveCrewingIcon(serviceDecorIcons[Math.min(i, serviceDecorIcons.length - 1)] ?? 'Ship')"
                    class="h-7 w-7 shrink-0 text-primary"
                  />
                </div>
                <h3 class="font-display mb-3 shrink-0 text-base text-body">
                  <ThemedContentString :content="c.title" />
                </h3>
                <div
                  class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                  v-html="lineRichHtml(c.text)"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          v-else-if="sid === 'advantages'"
          :class="lineSecShell('advantages', 'py-24')"
        >
          <LineSectionMediaBackdrop :image-url="sectionBgUrl('advantages')" />
          <AboutSectionContentParallax
            v-if="isLineV2"
            :max-shift="32"
            :factor="0.085"
            class="relative z-10 mts-content-wrap"
          >
            <MarinReveal>
              <h2 class="font-display mb-12 text-center text-xl text-body md:text-2xl">
                <ThemedContentString :content="lineV2.data.sec4Advantages.title" />
              </h2>
            </MarinReveal>
            <div
              v-if="lineV2.data.sec4Advantages.cards.length && lineV2.kind === 'crewing'"
              class="grid grid-cols-1 gap-8 md:grid-cols-6 md:items-stretch md:gap-8 md:[grid-auto-rows:1fr]"
            >
              <MarinReveal
                v-for="(c, i) in lineV2.data.sec4Advantages.cards"
                :key="`adv-${i}`"
                :delay-ms="180 + i * 70"
                :content-class="`h-full min-h-0 ${lineV2CardsGridItemClass(i, lineV2.data.sec4Advantages.cards.length)}`"
              >
                <div
                  class="flex h-full min-h-0 min-w-0 gap-4 rounded-xl border border-mts-border bg-white p-6 shadow-sm"
                >
                  <component
                    :is="resolveCrewingIcon(advantageDecorIcons[Math.min(i, advantageDecorIcons.length - 1)] ?? 'Ship')"
                    class="mt-1 h-10 w-10 shrink-0 text-primary"
                  />
                  <div class="flex min-h-0 min-w-0 flex-1 flex-col">
                    <h3 class="font-display mb-2 shrink-0 text-lg text-body">
                      <ThemedContentString :content="c.title" />
                    </h3>
                    <div
                      class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                      v-html="lineRichHtml(c.text)"
                    />
                  </div>
                </div>
              </MarinReveal>
            </div>
            <MarinReveal v-else-if="lineV2.data.sec4Advantages.cards.length" :delay-ms="180">
              <div
                class="grid grid-cols-1 gap-8 md:grid-cols-6 md:items-stretch md:gap-8 md:[grid-auto-rows:1fr]"
              >
                <div
                  v-for="(c, i) in lineV2.data.sec4Advantages.cards"
                  :key="`adv-${i}`"
                  :class="[
                    'flex h-full min-h-0 min-w-0 gap-4 rounded-xl border border-mts-border bg-white p-6 shadow-sm',
                    lineV2CardsGridItemClass(i, lineV2.data.sec4Advantages.cards.length),
                  ]"
                >
                  <component
                    :is="resolveCrewingIcon(advantageDecorIcons[Math.min(i, advantageDecorIcons.length - 1)] ?? 'Ship')"
                    class="mt-1 h-10 w-10 shrink-0 text-primary"
                  />
                  <div class="flex min-h-0 min-w-0 flex-1 flex-col">
                    <h3 class="font-display mb-2 shrink-0 text-lg text-body">
                      <ThemedContentString :content="c.title" />
                    </h3>
                    <div
                      class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                      v-html="lineRichHtml(c.text)"
                    />
                  </div>
                </div>
              </div>
            </MarinReveal>
          </AboutSectionContentParallax>
          <div v-else class="relative z-10 mts-content-wrap">
            <h2 class="font-display mb-12 text-center text-xl text-body md:text-2xl">
              <ThemedContentString :content="lineV2.data.sec4Advantages.title" />
            </h2>
            <div class="grid grid-cols-1 gap-8 md:grid-cols-6 md:items-stretch md:gap-8 md:[grid-auto-rows:1fr]">
              <div
                v-for="(c, i) in lineV2.data.sec4Advantages.cards"
                :key="`adv-${i}`"
                :class="[
                  'flex h-full min-h-0 min-w-0 gap-4 rounded-xl border border-mts-border bg-white p-6 shadow-sm',
                  lineV2CardsGridItemClass(i, lineV2.data.sec4Advantages.cards.length),
                ]"
              >
                <component
                  :is="resolveCrewingIcon(advantageDecorIcons[Math.min(i, advantageDecorIcons.length - 1)] ?? 'Ship')"
                  class="mt-1 h-10 w-10 shrink-0 text-primary"
                />
                <div class="flex min-h-0 min-w-0 flex-1 flex-col">
                  <h3 class="font-display mb-2 shrink-0 text-lg text-body">
                    <ThemedContentString :content="c.title" />
                  </h3>
                  <div
                    class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                    v-html="lineRichHtml(c.text)"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="sid === 'trust'" :class="lineSecShell('trust', 'py-20')">
          <LineSectionMediaBackdrop :image-url="sectionBgUrl('trust')" />
          <AboutSectionContentParallax
            v-if="isLineV2"
            :max-shift="32"
            :factor="0.085"
            class="relative z-10 mts-content-wrap"
          >
            <div class="mx-auto max-w-3xl text-center">
              <template v-if="lineV2.kind === 'crewing'">
                <MarinReveal>
                  <h2 class="font-display mb-8 text-xl text-body md:text-2xl">
                    <ThemedContentString :content="lineV2.data.sec5Trust.title" />
                  </h2>
                </MarinReveal>
                <MarinReveal :delay-ms="120">
                  <div
                    class="mts-markdown mb-6 font-body text-lg leading-relaxed text-muted"
                    v-html="lineRichHtml(lineV2.data.sec5Trust.paragraph1)"
                  />
                </MarinReveal>
                <MarinReveal :delay-ms="180">
                  <div
                    class="mts-markdown font-body text-lg leading-relaxed text-muted"
                    v-html="lineRichHtml(lineV2.data.sec5Trust.paragraph2)"
                  />
                </MarinReveal>
              </template>
              <template v-else>
                <MarinReveal>
                  <h2 class="font-display mb-8 text-xl text-body md:text-2xl">
                    <ThemedContentString :content="lineV2.data.sec5Closing.title" />
                  </h2>
                </MarinReveal>
                <MarinReveal :delay-ms="120">
                  <div
                    class="mts-markdown mb-6 font-body text-lg leading-relaxed text-muted"
                    v-html="lineRichHtml(lineV2.data.sec5Closing.paragraph1)"
                  />
                </MarinReveal>
                <MarinReveal :delay-ms="180">
                  <div
                    class="mts-markdown font-body text-lg leading-relaxed text-muted"
                    v-html="lineRichHtml(lineV2.data.sec5Closing.paragraph2)"
                  />
                </MarinReveal>
              </template>
            </div>
          </AboutSectionContentParallax>
          <div v-else class="relative z-10 mts-content-wrap">
            <div class="mx-auto max-w-3xl text-center">
              <template v-if="lineV2.kind === 'crewing'">
                <h2 class="font-display mb-8 text-xl text-body md:text-2xl">
                  <ThemedContentString :content="lineV2.data.sec5Trust.title" />
                </h2>
                <div
                  class="mts-markdown mb-6 font-body text-lg leading-relaxed text-muted"
                  v-html="lineRichHtml(lineV2.data.sec5Trust.paragraph1)"
                />
                <div
                  class="mts-markdown font-body text-lg leading-relaxed text-muted"
                  v-html="lineRichHtml(lineV2.data.sec5Trust.paragraph2)"
                />
              </template>
              <template v-else>
                <h2 class="font-display mb-8 text-xl text-body md:text-2xl">
                  <ThemedContentString :content="lineV2.data.sec5Closing.title" />
                </h2>
                <div
                  class="mts-markdown mb-6 font-body text-lg leading-relaxed text-muted"
                  v-html="lineRichHtml(lineV2.data.sec5Closing.paragraph1)"
                />
                <div
                  class="mts-markdown font-body text-lg leading-relaxed text-muted"
                  v-html="lineRichHtml(lineV2.data.sec5Closing.paragraph2)"
                />
              </template>
            </div>
          </div>
        </section>

        <section
          v-else-if="sid === 'cta' && lineV2.kind === 'crewing'"
          :class="lineSecShell('cta', 'py-16')"
        >
          <LineSectionMediaBackdrop :image-url="sectionBgUrl('cta')" />
          <AboutSectionContentParallax
            :max-shift="32"
            :factor="0.085"
            class="relative z-10 mts-content-wrap"
          >
            <div class="mx-auto max-w-2xl text-center">
              <MarinReveal>
                <h2 class="font-display mb-4 text-xl text-body md:text-2xl">
                  <ThemedContentString :content="lineV2.data.sec6Cta.title" />
                </h2>
              </MarinReveal>
              <MarinReveal :delay-ms="120">
                <div
                  class="mts-markdown font-body leading-relaxed text-muted"
                  v-html="lineRichHtml(lineV2.data.sec6Cta.body)"
                />
              </MarinReveal>
            </div>
          </AboutSectionContentParallax>
        </section>
      </template>
    </template>

    <template v-else-if="lineV2 && lineV2.kind === 'lnk'">
      <template v-for="sid in lineV2SectionOrder" :key="`lnk-${sid}`">
        <MarinReveal v-if="isLineV2 && sid.startsWith('custom:') && customSectionById(sid.slice(7))">
          <LineMarketingCustomSectionView
            :section="customSectionById(sid.slice(7))!"
            :slug="props.slug"
            :page-crumb-items="crumbItems"
            :page-section-media-url="sectionBgUrl(sid)"
          />
        </MarinReveal>
        <LineMarketingCustomSectionView
          v-else-if="sid.startsWith('custom:') && customSectionById(sid.slice(7))"
          :section="customSectionById(sid.slice(7))!"
          :slug="props.slug"
          :page-crumb-items="crumbItems"
          :page-section-media-url="sectionBgUrl(sid)"
        />

        <section
          v-else-if="sid === 'competencies'"
          :class="[lineSecShell('competencies', 'py-24'), 'flex min-h-[100svh] flex-col']"
        >
          <LineSectionMediaBackdrop :image-url="sectionBgUrl('competencies')" />
          <AboutSectionContentParallax
            :max-shift="32"
            :factor="0.085"
            class="relative z-10 mts-content-wrap flex min-h-0 flex-1 flex-col justify-center"
          >
            <MarinReveal>
              <h2 class="font-display mb-4 text-center text-xl text-body md:text-2xl">
                <ThemedContentString :content="lineV2.data.sec2Competencies.title" />
              </h2>
            </MarinReveal>
            <div v-if="lineV2.data.sec2Competencies.cards.length" :class="lnkSectionGridClass(lineV2.data.sec2Competencies.columns)">
              <MarinReveal
                v-for="(c, i) in lineV2.data.sec2Competencies.cards"
                :key="`lnk-co-${i}`"
                :delay-ms="160 + i * 60"
                class="h-full min-h-0"
              >
                <div
                  class="corner-accent flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-mts-border bg-white p-6 shadow-sm"
                >
                  <component
                    :is="resolveCrewingIcon(c.icon)"
                    v-if="!c.hideIcon"
                    class="mb-4 h-9 w-9 shrink-0 text-primary"
                  />
                  <h3 class="font-display mb-3 shrink-0 text-base text-body">
                    <ThemedContentString :content="c.title" />
                  </h3>
                  <div
                    class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                    v-html="lineRichHtml(c.text)"
                  />
                </div>
              </MarinReveal>
            </div>
          </AboutSectionContentParallax>
        </section>

        <section
          v-else-if="sid === 'strategicAdvantages'"
          :class="[lineSecShell('strategicAdvantages', 'py-24'), 'flex min-h-[100svh] flex-col']"
        >
          <LineSectionMediaBackdrop :image-url="sectionBgUrl('strategicAdvantages')" />
          <AboutSectionContentParallax
            :max-shift="32"
            :factor="0.085"
            class="relative z-10 mts-content-wrap flex min-h-0 flex-1 flex-col justify-center"
          >
            <MarinReveal>
              <h2 class="font-display mb-4 text-center text-xl text-body md:text-2xl">
                <ThemedContentString :content="lineV2.data.sec3StrategicAdvantages.title" />
              </h2>
            </MarinReveal>
            <div
              v-if="lineV2.data.sec3StrategicAdvantages.cards.length"
              :class="lnkSectionGridClass(lineV2.data.sec3StrategicAdvantages.columns)"
            >
              <MarinReveal
                v-for="(c, i) in lineV2.data.sec3StrategicAdvantages.cards"
                :key="`lnk-ad-${i}`"
                :delay-ms="160 + i * 60"
                class="h-full min-h-0"
              >
                <div
                  class="corner-accent flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-mts-border bg-white p-6 shadow-sm"
                >
                  <component
                    :is="resolveCrewingIcon(c.icon)"
                    v-if="!c.hideIcon"
                    class="mb-4 h-9 w-9 shrink-0 text-primary"
                  />
                  <h3 class="font-display mb-3 shrink-0 text-base text-body">
                    <ThemedContentString :content="c.title" />
                  </h3>
                  <div
                    class="mts-markdown min-h-0 flex-1 text-sm leading-relaxed text-muted [&_p:first-child]:mt-0"
                    v-html="lineRichHtml(c.text)"
                  />
                </div>
              </MarinReveal>
            </div>
          </AboutSectionContentParallax>
        </section>

        <section v-else-if="sid === 'techBase'" :class="lineSecShell('techBase', 'py-20')">
          <LineSectionMediaBackdrop :image-url="sectionBgUrl('techBase')" />
          <AboutSectionContentParallax
            :max-shift="32"
            :factor="0.085"
            class="relative z-10 mts-content-wrap"
          >
            <div class="mx-auto max-w-3xl text-center">
              <MarinReveal>
                <div
                  class="mts-markdown mb-8 font-display text-xl leading-snug text-body md:text-2xl [&_p:first-child]:mt-0"
                  v-html="lineRichHtml(lineV2.data.sec4TechBase.titleHtml)"
                />
              </MarinReveal>
              <MarinReveal :delay-ms="120">
                <div
                  class="mts-markdown font-body text-lg leading-relaxed text-muted [&_p:first-child]:mt-0"
                  v-html="lineRichHtml(lineV2.data.sec4TechBase.bodyHtml)"
                />
              </MarinReveal>
            </div>
          </AboutSectionContentParallax>
        </section>
      </template>
    </template>

    <template v-else>
    <template v-for="(chunk, ci) in layoutChunks" :key="ci">
      <section
        v-if="chunk.kind === 'directions' && cms.directions.length > 0"
        :class="lineSecShell('directions', 'py-24')"
      >
        <LineSectionMediaBackdrop :image-url="sectionBgUrl('directions')" />
        <AboutSectionContentParallax :max-shift="32" :factor="0.085" class="relative z-10 mts-content-wrap">
          <h2 class="font-display mb-4 text-center text-xl text-body md:text-2xl">
            <ThemedContentString :content="cms.directionsSection.title" />
          </h2>
          <p class="mx-auto mb-14 max-w-7xl text-center font-body text-muted">
            <ThemedContentString :content="cms.directionsSection.lead" />
          </p>
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <template v-for="(item, idx) in cms.directions" :key="`${item.title}-${idx}`">
              <NuxtLink
                v-if="directionDetailPath(item)"
                :to="directionDetailPath(item)!"
                :class="[
                  directionCardClass,
                  'group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mts-accent',
                ]"
              >
                <component
                  :is="resolveCrewingIcon(item.icon)"
                  v-if="!item.hideIcon"
                  class="mb-4 h-8 w-8 text-primary"
                />
                <h3 class="font-display mb-3 text-xl text-body"><ThemedContentString :content="item.title" /></h3>
                <p class="font-body text-sm leading-relaxed text-muted">
                  <ThemedContentString :content="item.text" />
                </p>
                <span class="mts-cta-link-compact mt-5 inline-flex">
                  {{ t('pages.common.readMore') }} →
                </span>
              </NuxtLink>
              <div v-else :class="directionCardClass">
                <component
                  :is="resolveCrewingIcon(item.icon)"
                  v-if="!item.hideIcon"
                  class="mb-4 h-8 w-8 text-primary"
                />
                <h3 class="font-display mb-3 text-xl text-body"><ThemedContentString :content="item.title" /></h3>
                <p class="font-body text-sm leading-relaxed text-muted">
                  <ThemedContentString :content="item.text" />
                </p>
              </div>
            </template>
          </div>
        </AboutSectionContentParallax>
      </section>

      <section
        v-else-if="chunk.kind === 'checklist' && checklistVisible"
        :aria-labelledby="checklistHeadingId"
        :class="lineSecShell('checklist', 'py-16', { topBorder: true })"
      >
        <LineSectionMediaBackdrop :image-url="sectionBgUrl('checklist')" />
        <AboutSectionContentParallax :max-shift="32" :factor="0.085" class="relative z-10 mts-content-wrap">
          <h2
            :id="checklistHeadingId"
            :class="
              cms.checklist.sectionTitle.trim()
                ? 'font-display mb-8 text-xl text-body md:text-2xl'
                : 'sr-only'
            "
          >
            <ThemedContentString
              :content="cms.checklist.sectionTitle.trim() || t('pages.lineMarketing.checklistSection')"
            />
          </h2>
          <p
            v-if="cms.checklist.intro.trim()"
            class="mb-8 font-body leading-relaxed text-muted"
          >
            <ThemedContentString :content="cms.checklist.intro" />
          </p>
          <div class="space-y-1">
            <template v-for="(row, ri) in checklistRows" :key="`cr-${ri}`">
              <h3
                v-if="row.type === 'heading'"
                :class="[
                  'font-display border-b border-border pb-2 text-lg text-body',
                  ri === 0 ? 'mt-0' : 'mt-8',
                ]"
              >
                <ThemedContentString :content="row.text" />
              </h3>
              <div
                v-else
                class="flex gap-3 border-b border-border/70 py-3 font-body text-sm leading-relaxed text-muted last:border-b-0"
              >
                <span class="mt-0.5 shrink-0 tabular-nums text-primary">{{ row.num }}.</span>
                <p>
                  <span class="font-medium text-body"><ThemedContentString :content="row.title" /></span>
                  <ThemedContentString :content="row.text" />
                </p>
              </div>
            </template>
          </div>
        </AboutSectionContentParallax>
      </section>

      <section v-else-if="chunk.kind === 'pair'" :class="legacyPairShellClass(chunk)">
        <LineSectionMediaBackdrop :image-url="legacyPairBg(chunk.left, chunk.right)" />
        <AboutSectionContentParallax :max-shift="32" :factor="0.085" class="relative z-10 mts-content-wrap">
          <div class="grid items-start gap-16 lg:grid-cols-2">
            <template v-for="col in [chunk.left, chunk.right]" :key="col">
              <div v-if="col === 'principles'" class="relative">
                <div class="card-tech corner-accent p-8">
                  <h2 class="font-display mb-6 text-xl text-body">
                    <ThemedContentString :content="cms.principles.title" />
                  </h2>
                  <ul class="space-y-4">
                    <li
                      v-for="(line, i) in cms.principles.items"
                      :key="i"
                      class="flex gap-3 font-body text-muted"
                    >
                      <span class="mt-1.5 h-1.5 w-1.5 shrink-0 bg-primary" />
                      <ThemedContentString :content="line" />
                    </li>
                  </ul>
                </div>
              </div>
              <div v-else>
                <h2 class="font-display mb-6 text-xl text-body">
                  <ThemedContentString :content="cms.audience.title" />
                </h2>
                <p class="mb-6 font-body leading-relaxed text-muted">
                  <ThemedContentString :content="cms.audience.paragraph1" />
                </p>
                <p class="mb-8 font-body leading-relaxed text-muted">
                  <ThemedContentString :content="cms.audience.paragraph2" />
                </p>
                <ButtonLink
                  v-if="flattenEncodedOrPlain(cms.audience.ctaLabel).trim()"
                  :title="flattenEncodedOrPlain(cms.audience.ctaLabel)"
                  :link="cms.audience.ctaHref"
                />
              </div>
            </template>
          </div>
        </AboutSectionContentParallax>
      </section>

      <LineMarketingCustomSectionView
        v-else-if="chunk.kind === 'custom' && customSectionById(chunk.customId)"
        :section="customSectionById(chunk.customId)!"
        :slug="props.slug"
        :page-crumb-items="crumbItems"
        :page-section-media-url="sectionBgUrl(`custom:${chunk.customId}`)"
      />

      <section v-else-if="chunk.kind === 'single'" :class="lineSecShell(chunk.id, 'py-24')">
        <LineSectionMediaBackdrop :image-url="sectionBgUrl(chunk.id)" />
        <AboutSectionContentParallax :max-shift="32" :factor="0.085" class="relative z-10 mts-content-wrap">
          <div v-if="chunk.id === 'principles'" class="relative max-w-7xl">
            <div class="card-tech corner-accent p-8">
              <h2 class="font-display mb-6 text-xl text-body">
                <ThemedContentString :content="cms.principles.title" />
              </h2>
              <ul class="space-y-4">
                <li
                  v-for="(line, i) in cms.principles.items"
                  :key="i"
                  class="flex gap-3 font-body text-muted"
                >
                  <span class="mt-1.5 h-1.5 w-1.5 shrink-0 bg-primary" />
                  <ThemedContentString :content="line" />
                </li>
              </ul>
            </div>
          </div>
          <div v-else class="max-w-7xl">
            <h2 class="font-display mb-6 text-xl text-body">
              <ThemedContentString :content="cms.audience.title" />
            </h2>
            <p class="mb-6 font-body leading-relaxed text-muted">
              <ThemedContentString :content="cms.audience.paragraph1" />
            </p>
            <p class="mb-8 font-body leading-relaxed text-muted">
              <ThemedContentString :content="cms.audience.paragraph2" />
            </p>
            <ButtonLink
              v-if="flattenEncodedOrPlain(cms.audience.ctaLabel).trim()"
              :title="flattenEncodedOrPlain(cms.audience.ctaLabel)"
              :link="cms.audience.ctaHref"
            />
          </div>
        </AboutSectionContentParallax>
      </section>
    </template>
    </template>

    <CommonPageInquiryForm
      v-if="cms.showInquiryForm"
      :source-page="props.slug"
      :hide-intro="cms.hideInquiryFormIntro === true"
      :hide-form-card-heading="cms.hideInquiryFormCardHeading === true"
      :config="cms.inquiryForm"
    />
  </div>
</template>
