<script setup lang="ts">
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ButtonLink from '~/components/common/ButtonLink.vue'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'
import LineMarketingCustomSectionView from '~/components/line-marketing/LineMarketingCustomSectionView.vue'
import type { CrewingDirectionItem, CrewingPageData, LineMarketingCustomSection, MarineContentLocale } from '~/types'
import { buildCrewingChecklistRenderRows, countFilledCrewingChecklistPoints } from '~/utils/crewingChecklistDefaults'
import { defaultLinePageData, mergeLinePageData } from '~/utils/pageDefaults'
import type { LineMarketingPageSlug } from '~/utils/lineMarketingPages'
import { LINE_MARKETING_PAGE_LAYOUT, LINE_MARKETING_SECTION_DEFAULT_ORDER } from '~/utils/lineMarketingPages'
import { buildLineMarketingLayoutChunks } from '~/utils/lineMarketingSectionLayout'
import { resolveCrewingIcon } from '~/utils/crewingIcons'

const props = defineProps<{
  slug: LineMarketingPageSlug
}>()

useSiteSeoMeta(props.slug)

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
  () => `line-page-${props.slug}-cms`,
  async () => {
    try {
      return await api.contentPages.getPublicBySlug(props.slug)
    } catch {
      return null
    }
  },
  { server: true },
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

const heroBgStyle = computed(() => ({
  backgroundImage: `url(${cms.value.heroBackgroundImage?.trim() || layout.value.heroBg})`,
}))

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
  'card-tech border border-mts-border p-8 transition-colors hover:border-mts-accent/40'

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
  return `${base} btn-secondary border border-mts-border`
}
</script>

<template>
  <div class="bg-mts-bg">
    <section class="relative flex min-h-[min(88vh,920px)] items-center overflow-hidden">
      <div class="absolute top-0 left-1/4 h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent" />
      <div class="absolute top-0 right-1/4 h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent" />

      <div class="absolute inset-0">
        <div
          :class="[
            'absolute inset-0 bg-cover bg-center transition-all duration-1000',
            heroVisible ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          ]"
          :style="heroBgStyle"
        />
        <div class="absolute inset-0 bg-linear-to-r from-mts-bg/95 via-mts-bg/85 to-mts-bg/55" />
        <div class="absolute inset-0 bg-linear-to-t from-mts-bg via-transparent to-mts-bg/35" />
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-32 bg-linear-to-b from-transparent via-mts-bg/55 to-mts-bg sm:h-40 md:h-48"
          aria-hidden="true"
        />
      </div>

      <div class="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-28 lg:px-12">
        <div class="w-full max-w-3xl xl:max-w-4xl">
          <Breadcrumbs :items="crumbItems" />
          <div
            :class="[
              'mb-4 flex items-center gap-3 transition-all duration-600',
              heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
            ]"
          >
            <div class="h-px w-8 bg-mts-accent" />
            <span class="section-label">{{ t(layout.heroEyebrowI18nKey) }}</span>
          </div>
          <h1
            :class="[
              'font-display mb-6 text-4xl leading-tight text-mts-text transition-all duration-600 lg:text-5xl',
              heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
            ]"
          >
            <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
          </h1>
          <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
          <p
            :class="[
              'font-body text-lg leading-relaxed text-mts-text-secondary transition-all duration-600',
              heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
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
      </div>
    </section>

    <template v-for="(chunk, ci) in layoutChunks" :key="ci">
      <section
        v-if="chunk.kind === 'directions' && cms.directions.length > 0"
        class="relative overflow-hidden bg-mts-surface py-24"
      >
        <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
          <h2 class="font-display mb-4 text-center text-2xl text-mts-text md:text-3xl">
            <ThemedContentString :content="cms.directionsSection.title" />
          </h2>
          <p class="mx-auto mb-14 max-w-2xl text-center font-body text-mts-text-secondary">
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
                  class="mb-4 h-8 w-8 text-mts-accent"
                />
                <h3 class="font-display mb-3 text-xl text-mts-text"><ThemedContentString :content="item.title" /></h3>
                <p class="font-body text-sm leading-relaxed text-mts-text-secondary">
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
                  class="mb-4 h-8 w-8 text-mts-accent"
                />
                <h3 class="font-display mb-3 text-xl text-mts-text"><ThemedContentString :content="item.title" /></h3>
                <p class="font-body text-sm leading-relaxed text-mts-text-secondary">
                  <ThemedContentString :content="item.text" />
                </p>
              </div>
            </template>
          </div>
        </div>
      </section>

      <section
        v-else-if="chunk.kind === 'checklist' && checklistVisible"
        :aria-labelledby="checklistHeadingId"
        class="border-t border-mts-border bg-mts-bg py-16"
      >
        <div class="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12">
          <h2
            :id="checklistHeadingId"
            :class="
              cms.checklist.sectionTitle.trim()
                ? 'font-display mb-8 text-2xl text-mts-text md:text-3xl'
                : 'sr-only'
            "
          >
            <ThemedContentString
              :content="cms.checklist.sectionTitle.trim() || t('pages.lineMarketing.checklistSection')"
            />
          </h2>
          <p
            v-if="cms.checklist.intro.trim()"
            class="mb-8 font-body leading-relaxed text-mts-text-secondary"
          >
            <ThemedContentString :content="cms.checklist.intro" />
          </p>
          <div class="space-y-1">
            <template v-for="(row, ri) in checklistRows" :key="`cr-${ri}`">
              <h3
                v-if="row.type === 'heading'"
                :class="[
                  'font-display border-b border-mts-border pb-2 text-lg text-mts-text',
                  ri === 0 ? 'mt-0' : 'mt-8',
                ]"
              >
                <ThemedContentString :content="row.text" />
              </h3>
              <div
                v-else
                class="flex gap-3 border-b border-mts-border/70 py-3 font-body text-sm leading-relaxed text-mts-text-secondary last:border-b-0"
              >
                <span class="mt-0.5 shrink-0 tabular-nums text-mts-accent">{{ row.num }}.</span>
                <p>
                  <span class="font-medium text-mts-text"><ThemedContentString :content="row.title" /></span>
                  <ThemedContentString :content="row.text" />
                </p>
              </div>
            </template>
          </div>
        </div>
      </section>

      <section v-else-if="chunk.kind === 'pair'" class="relative overflow-hidden py-24">
        <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
          <div class="grid items-start gap-16 lg:grid-cols-2">
            <template v-for="col in [chunk.left, chunk.right]" :key="col">
              <div v-if="col === 'principles'" class="relative">
                <CommonAccentCorners size="lg" />
                <div class="border border-mts-border bg-mts-bg p-8 shadow-tech">
                  <h2 class="font-display mb-6 text-2xl text-mts-text">
                    <ThemedContentString :content="cms.principles.title" />
                  </h2>
                  <ul class="space-y-4">
                    <li
                      v-for="(line, i) in cms.principles.items"
                      :key="i"
                      class="flex gap-3 font-body text-mts-text-secondary"
                    >
                      <span class="mt-1.5 h-1.5 w-1.5 shrink-0 bg-mts-accent" />
                      <ThemedContentString :content="line" />
                    </li>
                  </ul>
                </div>
              </div>
              <div v-else>
                <h2 class="font-display mb-6 text-2xl text-mts-text">
                  <ThemedContentString :content="cms.audience.title" />
                </h2>
                <p class="mb-6 font-body leading-relaxed text-mts-text-secondary">
                  <ThemedContentString :content="cms.audience.paragraph1" />
                </p>
                <p class="mb-8 font-body leading-relaxed text-mts-text-secondary">
                  <ThemedContentString :content="cms.audience.paragraph2" />
                </p>
                <ButtonLink :title="flattenEncodedOrPlain(cms.audience.ctaLabel)" :link="cms.audience.ctaHref" />
              </div>
            </template>
          </div>
        </div>
      </section>

      <LineMarketingCustomSectionView
        v-else-if="chunk.kind === 'custom' && customSectionById(chunk.customId)"
        :section="customSectionById(chunk.customId)!"
        :slug="props.slug"
      />

      <section v-else-if="chunk.kind === 'single'" class="relative overflow-hidden py-24">
        <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
          <div v-if="chunk.id === 'principles'" class="relative max-w-3xl">
            <CommonAccentCorners size="lg" />
            <div class="border border-mts-border bg-mts-bg p-8 shadow-tech">
              <h2 class="font-display mb-6 text-2xl text-mts-text">
                <ThemedContentString :content="cms.principles.title" />
              </h2>
              <ul class="space-y-4">
                <li
                  v-for="(line, i) in cms.principles.items"
                  :key="i"
                  class="flex gap-3 font-body text-mts-text-secondary"
                >
                  <span class="mt-1.5 h-1.5 w-1.5 shrink-0 bg-mts-accent" />
                  <ThemedContentString :content="line" />
                </li>
              </ul>
            </div>
          </div>
          <div v-else class="max-w-3xl">
            <h2 class="font-display mb-6 text-2xl text-mts-text">
              <ThemedContentString :content="cms.audience.title" />
            </h2>
            <p class="mb-6 font-body leading-relaxed text-mts-text-secondary">
              <ThemedContentString :content="cms.audience.paragraph1" />
            </p>
            <p class="mb-8 font-body leading-relaxed text-mts-text-secondary">
              <ThemedContentString :content="cms.audience.paragraph2" />
            </p>
            <ButtonLink :title="flattenEncodedOrPlain(cms.audience.ctaLabel)" :link="cms.audience.ctaHref" />
          </div>
        </div>
      </section>
    </template>

    <CommonPageInquiryForm v-if="cms.showInquiryForm" :source-page="props.slug" />
  </div>
</template>
