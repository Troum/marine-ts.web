<script setup lang="ts">
import { FileDown, Loader2 } from 'lucide-vue-next'
import type { AboutGeoLocation, AboutPageData, MarineContentLocale } from '~/types'
import AboutSectionContentParallax from '~/components/about/AboutSectionContentParallax.vue'
import AboutServiceGeographyMap from '~/components/about/ServiceGeographyMap.vue'
import MarinReveal from '~/components/about/MarinReveal.vue'
import HeroEyebrowRow from '~/components/common/HeroEyebrowRow.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { ABOUT_SECTION_DEFAULT_ORDER, defaultAboutData, mergeAboutPageData } from '~/utils/aboutPageDefaults'
import { incomingCmsValueToHtml } from '~/utils/adminHtmlField'
import { sanitizeRichContentHtml } from '~/composables/useMarkdownSafeHtml'
import { isSectionVisible, resolveSectionOrder } from '~/utils/sectionVisibility'

useSiteSeoMeta('about')

const { t, locale } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const customSectionCrumbItems = computed(() =>
  breadcrumbs({ label: t('nav.about'), to: '/about' }),
)

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const { data: aboutCmsPage, pending: aboutCmsPending } = await useAsyncData(
  () => `about-cms-${locale.value}`,
  async () => {
    try {
      return await api.contentPages.getPublicBySlug('about')
    }
    catch {
      return null
    }
  },
  { server: true, watch: [locale] },
)

const cms = computed<AboutPageData | null>(() => {
  const page = aboutCmsPage.value
  const body = page?.body
  if (!body) {
    return null
  }
  try {
    const parsed = JSON.parse(body) as unknown
    const ok =
      parsed && typeof parsed === 'object'
      && ('sec1Hero' in (parsed as object) || 'hero' in (parsed as object))
    if (!ok) {
      return null
    }
    return mergeAboutPageData(loc.value, parsed)
  }
  catch {
    return null
  }
})

const d = computed<AboutPageData>(() => cms.value ?? defaultAboutData(loc.value))

/** Подпись у линии (Figma): из CMS или строка «Профиль компании» / Company profile. */
const aboutSec1Kicker = computed(() => {
  const raw = d.value.sec1Hero.label?.trim()
  return raw || t('pages.about.heroEyebrow')
})

const { setHidden: setFooterHidden } = usePageFooterHidden()
watchEffect(() => { setFooterHidden(d.value?.hideFooter ?? false) })

const geoLocations = computed<AboutGeoLocation[]>(() => d.value.geography?.locations ?? [])

/**
 * Эффективный порядок блоков после шести основных секций
 * (`geography`, `certificates`, пользовательские).
 */
const sectionOrderEffective = computed(() =>
  resolveSectionOrder(d.value.sectionOrder, ABOUT_SECTION_DEFAULT_ORDER, d.value.customSections),
)

function sectionShown(id: string): boolean {
  return isSectionVisible(d.value.sectionVisibility, id)
}

/** Plain / TFT / HTML из CMS → безопасный HTML для полей TipTap. */
function aboutRichFieldHtml(raw: string | undefined | null): string {
  return sanitizeRichContentHtml(incomingCmsValueToHtml(raw ?? ''))
}

/** Сетка карточек как у блока «Направления» на главной (`index.vue`). */
function aboutDirectionsCardGridClass(count: number): string {
  if (count <= 1) {
    return 'grid-cols-1 max-w-lg'
  }
  if (count === 2) {
    return 'md:grid-cols-2'
  }
  return 'md:grid-cols-2 lg:grid-cols-3'
}

/** Сетка как у трёх карточек воронки на главной (`index.vue`). */
function aboutFunnelCardGridClass(count: number): string {
  if (count <= 1) {
    return 'grid-cols-1 max-w-lg'
  }
  if (count === 2) {
    return 'md:grid-cols-2'
  }
  return 'md:grid-cols-3'
}

function hasImage(src?: string | null): boolean {
  return Boolean(src?.trim())
}
</script>

<template>
  <div class="mts-about-shell bg-white text-body">
    <div v-if="aboutCmsPending" class="flex min-h-[50vh] items-center justify-center py-24">
      <Loader2 class="h-10 w-10 animate-spin text-primary" role="status" aria-live="polite" />
    </div>
    <template v-else>
    <!-- Секция 1. Hero (структура и типографика как в макете Figma) -->
    <section class="relative flex mts-hero-min-h items-end overflow-hidden lg:items-center">
      <div class="absolute inset-0">
        <CommonParallaxHeroMedia
          v-if="hasImage(d.heroImage)"
          :image="d.heroImage ?? ''"
        />
        <div v-else class="absolute inset-0 bg-[#575757]" aria-hidden="true" />
        <div
          v-if="hasImage(d.heroImage)"
          class="pointer-events-none absolute inset-0 z-[1] bg-[rgba(11,31,42,0.5)]"
          aria-hidden="true"
        />
        <div v-if="hasImage(d.heroImage)" class="absolute inset-0 z-[2] mts-about-hero-veil-r" aria-hidden="true" />
        <div v-if="hasImage(d.heroImage)" class="absolute inset-0 z-[2] mts-about-hero-veil-t" aria-hidden="true" />
      </div>

      <AboutSectionContentParallax
        :max-shift="32"
        :factor="0.085"
        class="relative z-10 mts-content-wrap w-full pb-24 pt-28 lg:pb-28 lg:pt-36"
      >
        <div class="max-w-[798px] text-mts-frost">
          <HeroEyebrowRow>
            <ThemedContentString :content="aboutSec1Kicker" />
          </HeroEyebrowRow>

          <!-- Типографика Figma 14:351 -->
          <div class="mts-figma-hero-stack">
            <div class="mts-figma-hero-title-pair">
              <h1
                class="mts-figma-hero-h1 max-w-4xl text-mts-frost"
              >
                <ThemedContentString :content="d.sec1Hero.title" />
              </h1>
              <p
                v-if="d.sec1Hero.subtitle?.trim()"
                class="mts-figma-hero-lead max-w-[653px] text-mts-frost"
              >
                <ThemedContentString :content="d.sec1Hero.subtitle" />
              </p>
            </div>
            <div
              class="mts-figma-hero-body mts-markdown max-w-[798px] text-mts-frost/95"
            >
              <div v-html="aboutRichFieldHtml(d.sec1Hero.body)" />
            </div>
          </div>
        </div>
      </AboutSectionContentParallax>
    </section>

    <!-- Секция 2. История и география -->
    <section
      v-if="sectionShown('sec2History')"
      id="about-sec-history"
      class="relative overflow-hidden py-20 lg:py-28"
      :class="{ 'mts-about-light': !hasImage(d.historyImage) }"
    >
      <div class="absolute inset-0">
        <CommonParallaxHeroMedia
          v-if="hasImage(d.historyImage)"
          :image="d.historyImage ?? ''"
        />
        <div v-else class="absolute inset-0 bg-white" aria-hidden="true" />
        <div
          v-if="hasImage(d.historyImage)"
          class="pointer-events-none absolute inset-0 mts-about-overlay-intro"
          aria-hidden="true"
        />
      </div>

      <AboutSectionContentParallax class="relative z-10 mts-content-wrap">
        <MarinReveal>
          <h2 class="mts-figma-section-h2 max-w-[900px] text-mts-frost">
            <ThemedContentString :content="d.sec2History.title" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <div
            class="mt-[2.375rem] max-w-[820px] mts-figma-section-body mts-markdown text-mts-frost"
            v-html="aboutRichFieldHtml(d.sec2History.body)"
          />
        </MarinReveal>
        <MarinReveal v-if="d.sec2History.cards.length" :delay-ms="200">
          <div
            class="mt-10 grid grid-cols-1 gap-6 md:mt-12"
            :class="aboutDirectionsCardGridClass(d.sec2History.cards.length)"
          >
            <div
              v-for="(c, i) in d.sec2History.cards"
              :key="`h-${i}`"
              class="service-card corner-accent min-w-0 p-8"
            >
              <h3 class="mts-figma-card-title text-body break-words [text-wrap:pretty]">
                <ThemedContentString :content="c.title" />
              </h3>
              <div
                class="mts-figma-card-body mts-markdown mt-3 text-muted"
                v-html="aboutRichFieldHtml(c.text)"
              />
            </div>
          </div>
        </MarinReveal>
      </AboutSectionContentParallax>
    </section>

    <!-- Секция 3. Технический менеджмент -->
    <section
      v-if="sectionShown('sec3Technical')"
      class="relative py-20 lg:py-32"
      :class="{ 'mts-about-light': !hasImage(d.technicalImage) }"
    >
      <div class="absolute inset-0 overflow-hidden">
        <CommonParallaxHeroMedia
          v-if="hasImage(d.technicalImage)"
          :image="d.technicalImage ?? ''"
          bg-class="!bg-[center_40%]"
        />
        <div v-else class="absolute inset-0 bg-white" aria-hidden="true" />
        <div
          v-if="hasImage(d.technicalImage)"
          class="pointer-events-none absolute inset-0 mts-about-ecosystem-veil"
          aria-hidden="true"
        />
      </div>

      <AboutSectionContentParallax class="relative z-10 mts-content-wrap">
        <MarinReveal>
          <h2 class="mts-figma-section-h2 text-mts-frost">
            <ThemedContentString :content="d.sec3Technical.title" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <div
            class="mt-[2.375rem] max-w-[820px] mts-figma-section-body mts-markdown text-mts-frost"
            v-html="aboutRichFieldHtml(d.sec3Technical.lead)"
          />
        </MarinReveal>
        <MarinReveal :delay-ms="180">
          <div
            class="mt-[2.375rem] max-w-[820px] mts-figma-section-body mts-markdown text-mts-frost"
            v-html="aboutRichFieldHtml(d.sec3Technical.lead2)"
          />
        </MarinReveal>
        <MarinReveal v-if="d.sec3Technical.cards.length" :delay-ms="220">
          <div
            class="mt-10 grid grid-cols-1 gap-5 md:mt-12 md:gap-4 lg:items-stretch lg:gap-6"
            :class="aboutFunnelCardGridClass(d.sec3Technical.cards.length)"
          >
            <div
              v-for="(c, i) in d.sec3Technical.cards"
              :key="`t-${i}`"
              class="service-card corner-accent group relative isolate flex h-full min-h-0 min-w-0 flex-col p-5 sm:p-6"
            >
              <div class="relative z-10 flex min-h-0 flex-1 flex-col">
                <h3 class="mts-figma-card-title text-body break-words [text-wrap:pretty]">
                  <ThemedContentString :content="c.title" />
                </h3>
                <div
                  class="mts-figma-card-body mts-markdown mt-3 flex-1 text-muted"
                  v-html="aboutRichFieldHtml(c.text)"
                />
              </div>
            </div>
          </div>
        </MarinReveal>
      </AboutSectionContentParallax>
    </section>

    <!-- Секция 4. Крюинг -->
    <section
      v-if="sectionShown('sec4Crewing')"
      class="relative overflow-hidden py-20 lg:py-32"
      :class="{ 'mts-about-light': !hasImage(d.crewingImage) }"
    >
      <div class="absolute inset-0">
        <CommonParallaxHeroMedia
          v-if="hasImage(d.crewingImage)"
          :image="d.crewingImage ?? ''"
        />
        <div v-else class="absolute inset-0 bg-white" aria-hidden="true" />
        <div
          v-if="hasImage(d.crewingImage)"
          class="pointer-events-none absolute inset-0 mts-about-overlay-mission"
          aria-hidden="true"
        />
      </div>

      <AboutSectionContentParallax class="relative z-10 mts-content-wrap">
        <MarinReveal>
          <h2 class="mts-figma-section-h2 max-w-[900px] text-mts-frost">
            <ThemedContentString :content="d.sec4Crewing.title" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <div
            class="mt-[2.375rem] max-w-[820px] mts-figma-section-body mts-markdown text-mts-frost"
            v-html="aboutRichFieldHtml(d.sec4Crewing.lead)"
          />
        </MarinReveal>
        <MarinReveal :delay-ms="180">
          <div
            class="mt-[2.375rem] max-w-[820px] mts-figma-section-body mts-markdown text-mts-frost"
            v-html="aboutRichFieldHtml(d.sec4Crewing.lead2)"
          />
        </MarinReveal>
        <MarinReveal v-if="d.sec4Crewing.cards.length" :delay-ms="220">
          <div
            class="mt-10 grid grid-cols-1 gap-5 md:mt-12 md:gap-4 lg:items-stretch lg:gap-6"
            :class="aboutFunnelCardGridClass(d.sec4Crewing.cards.length)"
          >
            <div
              v-for="(c, i) in d.sec4Crewing.cards"
              :key="`cr-${i}`"
              class="service-card corner-accent group relative isolate flex h-full min-h-0 min-w-0 flex-col p-5 sm:p-6"
            >
              <div class="relative z-10 flex min-h-0 flex-1 flex-col">
                <h3 class="mts-figma-card-title text-body break-words [text-wrap:pretty]">
                  <ThemedContentString :content="c.title" />
                </h3>
                <div
                  class="mts-figma-card-body mts-markdown mt-3 flex-1 text-muted"
                  v-html="aboutRichFieldHtml(c.text)"
                />
              </div>
            </div>
          </div>
        </MarinReveal>
      </AboutSectionContentParallax>
    </section>

    <!-- Секция 5. Миссия -->
    <section
      v-if="sectionShown('sec5Mission')"
      class="relative overflow-hidden py-20 lg:py-32"
      :class="{ 'mts-about-light': !hasImage(d.missionImage) }"
    >
      <div class="absolute inset-0">
        <CommonParallaxHeroMedia
          v-if="hasImage(d.missionImage)"
          :image="d.missionImage ?? ''"
        />
        <div v-else class="absolute inset-0 bg-white" aria-hidden="true" />
        <div
          v-if="hasImage(d.missionImage)"
          class="pointer-events-none absolute inset-0 mts-about-overlay-mission"
          aria-hidden="true"
        />
      </div>

      <AboutSectionContentParallax class="relative z-10 mts-content-wrap">
        <MarinReveal>
          <h2 class="mts-figma-section-h2 max-w-[900px] text-mts-frost">
            <ThemedContentString :content="d.sec5Mission.title" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <div
            class="mt-[2.375rem] max-w-[820px] mts-figma-section-body mts-markdown text-mts-frost"
            v-html="aboutRichFieldHtml(d.sec5Mission.body)"
          />
        </MarinReveal>
        <MarinReveal v-if="d.sec5Mission.cards.length" :delay-ms="200">
          <div
            class="mt-12 grid grid-cols-1 gap-5 md:gap-4 lg:items-stretch lg:gap-6"
            :class="aboutFunnelCardGridClass(d.sec5Mission.cards.length)"
          >
            <div
              v-for="(c, i) in d.sec5Mission.cards"
              :key="`m-${i}`"
              class="service-card corner-accent group relative isolate flex h-full min-h-0 min-w-0 flex-col p-5 sm:p-6"
            >
              <div class="relative z-10 flex min-h-0 flex-1 flex-col">
                <h3 class="mts-figma-card-title text-body break-words [text-wrap:pretty]">
                  <ThemedContentString :content="c.title" />
                </h3>
                <div
                  class="mts-figma-card-body mts-markdown mt-3 flex-1 text-muted"
                  v-html="aboutRichFieldHtml(c.text)"
                />
              </div>
            </div>
          </div>
        </MarinReveal>
      </AboutSectionContentParallax>
    </section>

    <!-- Секция 6. Закрытие / CTA -->
    <section
      v-if="sectionShown('sec6Closing')"
      class="mts-about-light relative overflow-hidden bg-white py-20 lg:py-[6.125rem]"
    >
      <AboutSectionContentParallax
        :max-shift="28"
        :factor="0.07"
        class="relative z-10 mts-content-wrap"
      >
        <MarinReveal>
          <h2 class="mts-figma-section-h2 text-body">
            <ThemedContentString :content="d.sec6Closing.title" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <div
            class="mt-[2.375rem] max-w-[956px] mts-figma-section-body mts-markdown text-body"
            v-html="aboutRichFieldHtml(d.sec6Closing.body)"
          />
        </MarinReveal>
      </AboutSectionContentParallax>
    </section>

    <!-- География, сертификаты и пользовательские блоки -->
    <template v-for="sid in sectionOrderEffective" :key="sid">
      <section v-if="sid === 'geography' && sectionShown('geography')" class="relative overflow-hidden">
        <!--
          Не оборачиваем в AboutSectionContentParallax: transform на предке
          смещает HTML-маркеры Mapbox относительно тайлов карты.
        -->
        <AboutServiceGeographyMap
          class="relative z-10"
          theme="dark"
          :locations="geoLocations"
          :label="d.geography.label"
          :title="d.geography.title"
          :lead="d.geography.lead"
        />
      </section>

      <section
        v-else-if="sid === 'certificates' && sectionShown('certificates') && d.certificates?.items?.length"
        class="relative overflow-hidden bg-bg-light py-16 lg:py-24"
      >
        <AboutSectionContentParallax class="mts-content-wrap" :max-shift="32" :factor="0.075">
          <MarinReveal>
            <h2 class="mts-figma-section-h2 text-center text-primary">
              <ThemedContentString :content="d.certificates.title" />
            </h2>
          </MarinReveal>
          <div class="mt-12 grid gap-6 md:grid-cols-3">
            <MarinReveal
              v-for="(c, ci) in d.certificates.items"
              :key="c.name"
              :delay-ms="120 + ci * 90"
            >
              <div class="service-card p-6 text-center">
                <p class="font-mono text-sm text-primary"><ThemedContentString :content="c.name" /></p>
                <p class="mts-figma-card-body mt-2 text-muted"><ThemedContentString :content="c.desc" /></p>
                <a
                  v-if="c.fileUrl"
                  :href="c.fileUrl"
                  target="_blank"
                  class="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary hover:underline"
                >
                  <FileDown class="w-3.5 h-3.5" />
                  Скачать
                </a>
              </div>
            </MarinReveal>
          </div>
        </AboutSectionContentParallax>
      </section>

      <AboutSectionContentParallax
        v-else-if="sid.startsWith('custom:') && sectionShown(sid)"
        class="block"
      >
        <CommonCustomPageSectionsRender
          :sections="(d.customSections ?? []).filter((s) => `custom:${s.id}` === sid)"
          :page-crumb-items="customSectionCrumbItems"
        />
      </AboutSectionContentParallax>
    </template>

    <CommonPageInquiryForm
      v-if="d.showInquiryForm"
      source-page="about"
      :hide-intro="d.hideInquiryFormIntro === true"
      :hide-form-card-heading="d.hideInquiryFormCardHeading === true"
      :config="d.inquiryForm"
    />
    </template>
  </div>
</template>
