<script setup lang="ts">
import { ChevronDown, FileDown } from 'lucide-vue-next'
import type { AboutPageData, AboutGeoLocation, MarineContentLocale } from '~/types'
import AboutServiceGeographyMap from '~/components/about/ServiceGeographyMap.vue'
import MarinHalfRombs from '~/components/about/MarinHalfRombs.vue'
import MarinReveal from '~/components/about/MarinReveal.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { ABOUT_SECTION_DEFAULT_ORDER, defaultAboutData, mergeAboutPageData } from '~/utils/aboutPageDefaults'
import { resolveServiceIcon } from '~/utils/serviceIcons'
import { isSectionVisible, resolveSectionOrder } from '~/utils/sectionVisibility'

useSiteSeoMeta('about')

const { t, locale } = useI18n()
const localePath = useLocalePath()
const api = useMarineApi()

/** Бейджи как на главной (ISO / IACS / опыт). */
const aboutHeroBadges = computed(() => [
  { k: 'ISO', v: t('home.hero.badgeIso') },
  { k: 'IACS', v: t('home.hero.badgeIacs') },
  { k: '14+', v: t('home.hero.badgeYears') },
])

function scrollToIntro() {
  document.getElementById('about-intro')?.scrollIntoView({ behavior: 'smooth' })
}

const cms = ref<AboutPageData | null>(null)

onMounted(async () => {
  try {
    const page = await api.contentPages.getPublicBySlug('about')
    if (page?.body) {
      const parsed = JSON.parse(page.body) as unknown
      if (parsed && typeof parsed === 'object' && 'hero' in (parsed as object)) {
        const loc = (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale
        cms.value = mergeAboutPageData(loc, parsed)
      }
    }
  } catch {
    // Fall back to i18n defaults
  }
})

const d = computed<AboutPageData>(() => {
  if (cms.value) return cms.value
  const loc = (locale.value === 'en' ? 'en' : 'ru') as 'ru' | 'en'
  return defaultAboutData(loc)
})

const geoLocations = computed<AboutGeoLocation[]>(() => d.value.geography.locations)

const stats = computed(() =>
  locale.value === 'en'
    ? [
        { value: '150+', label: 'Fleet projects' },
        { value: '15+', label: 'Ports and regions' },
        { value: '50+', label: 'Specialists' },
        { value: '14+', label: 'Years in the market' },
      ]
    : [
        { value: '150+', label: 'Проектов по флоту' },
        { value: '15+', label: 'Портов и регионов' },
        { value: '50+', label: 'Специалистов' },
        { value: '14+', label: 'Лет на рынке' },
      ],
)

function splitPrinciple(text: string): { heading: string; tail: string } {
  const m = text.match(/^(.*?)\s+[—–-]\s+(.+)$/)
  if (m) return { heading: m[1]?.trim() ?? '', tail: m[2]?.trim() ?? '' }
  return { heading: '', tail: text }
}

function isThemedCmsString(raw: string): boolean {
  return (raw ?? '').trimStart().startsWith('{')
}

/**
 * Эффективный порядок секций (после hero/intro) с учётом сохранённого
 * `sectionOrder`, актуальных кастомных секций и дефолтов.
 */
const sectionOrderEffective = computed(() =>
  resolveSectionOrder(d.value.sectionOrder, ABOUT_SECTION_DEFAULT_ORDER, d.value.customSections),
)

function sectionShown(id: string): boolean {
  return isSectionVisible(d.value.sectionVisibility, id)
}

/** Линии между карточками без заливки сетки (`gap-px` + `bg-*`). */
function ecosystemServiceCellClass(index: number, total: number): string {
  const row = Math.floor(index / 2)
  const rowCount = Math.ceil(total / 2)
  const isLastRow = row === rowCount - 1
  const hasRightNeighbor = index % 2 === 0 && index + 1 < total
  const parts = [
    'min-w-0 border-mts-frost/25 p-8',
    'border-b max-md:last:border-b-0',
    'md:border-b',
    hasRightNeighbor ? 'md:border-r' : '',
    isLastRow ? 'md:border-b-0' : '',
  ]
  return parts.filter(Boolean).join(' ')
}
</script>

<template>
  <!-- Оверлеи на фото — `.mts-about-overlay-*` и токены `--color-mts-*` в main.css. -->
  <div class="mts-about-shell bg-mts-navy text-mts-frost">
    <!-- Hero -->
    <section
      class="relative min-h-[100svh] flex items-end lg:items-center overflow-hidden"
    >
      <div class="absolute inset-0">
        <img
          v-if="d.heroImage?.trim()"
          :src="d.heroImage"
          alt=""
          class="absolute inset-0 size-full object-cover object-center"
          loading="eager"
          decoding="async"
        />
        <div v-else class="absolute inset-0 bg-mts-navy" aria-hidden="true" />
        <div class="absolute inset-0 mts-about-hero-veil-r" aria-hidden="true" />
        <div class="absolute inset-0 mts-about-hero-veil-t" aria-hidden="true" />
      </div>

      <div class="relative z-10 mts-content-wrap w-full pb-24 pt-28 lg:pb-28 lg:pt-36">
        <div class="max-w-7xl">
          <div class="mb-6 flex items-center gap-3">
            <div class="h-px w-8 shrink-0 bg-mts-accent" aria-hidden="true" />
            <span class="section-label text-mts-frost/75">{{ t('pages.about.heroEyebrow') }}</span>
          </div>

          <h1
            class="mb-6 max-w-[720px] font-display text-3xl leading-[1.1] text-mts-frost sm:text-4xl lg:text-5xl"
          >
            <ThemedContentString :content="d.hero.title" />
          </h1>

          <p class="mb-8 max-w-lg font-body text-lg leading-relaxed text-mts-frost/85">
            <ThemedContentString :content="d.hero.subtitle" />
          </p>

          <div class="mb-10 flex flex-wrap items-center gap-4">
            <NuxtLink :to="localePath('/request')" class="btn-primary inline-flex items-center justify-center">
              {{ t('header.ctaContact') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/application-form')"
              class="btn-secondary inline-flex items-center justify-center border-mts-frost/30 bg-transparent text-mts-frost hover:border-mts-accent hover:text-mts-accent"
            >
              {{ t('pages.vacancies.openApplicationButton') }}
            </NuxtLink>
          </div>

          <div class="flex flex-wrap items-center gap-8">
            <div v-for="(badge, bi) in aboutHeroBadges" :key="bi" class="flex items-center gap-2">
              <div class="h-1.5 w-1.5 shrink-0 bg-mts-accent" aria-hidden="true" />
              <div>
                <span class="font-mono text-sm font-medium text-mts-frost">{{ badge.k }}</span>
                <span class="ml-1 font-mono text-xs text-mts-frost/70">{{ badge.v }}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-mts-frost/70 transition-colors hover:text-mts-accent"
          @click="scrollToIntro"
        >
          <span class="font-mono text-xs uppercase tracking-wide">{{ t('home.hero.scroll') }}</span>
          <ChevronDown class="h-4 w-4 animate-bounce" aria-hidden="true" />
        </button>
      </div>
    </section>

    <!-- О компании: текст на фоне снимка -->
    <section id="about-intro" class="relative overflow-hidden py-20 lg:py-28">
      <div class="absolute inset-0">
        <img
          v-if="d.introImage?.trim()"
          :src="d.introImage"
          alt=""
          class="absolute inset-0 size-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="absolute inset-0 bg-mts-navy" aria-hidden="true" />
        <div class="mts-about-overlay-intro absolute inset-0" aria-hidden="true" />
      </div>

      <div class="relative z-10 mts-content-wrap">
        <MarinReveal>
          <div class="mb-6 flex items-center gap-3">
            <div class="h-px w-8 shrink-0 bg-mts-accent" aria-hidden="true" />
            <span class="section-label text-mts-frost/75">{{ t('nav.about') }}</span>
          </div>
          <h2 class="max-w-[720px] font-display text-3xl leading-[1.1] text-mts-frost sm:text-4xl lg:text-5xl">
            <ThemedContentString :content="d.hero.title" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <div class="mt-8 max-w-lg space-y-5 font-body text-lg leading-relaxed text-mts-frost/85">
            <p><ThemedContentString :content="d.hero.lead" /></p>
            <p><ThemedContentString :content="d.hero.lead2" /></p>
          </div>
        </MarinReveal>
      </div>
    </section>

    <!--
      Динамический блок секций. Порядок и видимость управляются админкой
      (`sectionOrder` / `sectionVisibility`). Hero и intro фиксированы выше,
      т.к. это один смысловой блок с одним заголовком.
    -->
    <template v-for="sid in sectionOrderEffective" :key="sid">
    <!--
      Экосистема сервисов.
      `overflow-hidden` оставлен ТОЛЬКО на обёртке фона, чтобы фотография
      не «вытекала» за пределы секции, но при этом ромбы из Figma могли
      выходить вверх за линию раздела (правая вершина ромба ложится на
      границу с предыдущей секцией).
    -->
    <section v-if="sid === 'ecosystem' && sectionShown('ecosystem')" class="relative py-20 lg:py-32">
      <div class="absolute inset-0 overflow-hidden">
        <img
          v-if="d.ecosystemImage?.trim()"
          :src="d.ecosystemImage"
          alt=""
          class="absolute inset-0 size-full object-cover object-[center_40%]"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="absolute inset-0 bg-mts-navy" aria-hidden="true" />
        <div class="absolute inset-0 mts-about-ecosystem-veil" aria-hidden="true" />
      </div>

      <!-- Декоративные «полуромбы» из Figma (Group 17, пара на стыке с «О компании»). -->
      <MarinHalfRombs />

      <div class="relative z-10 mts-content-wrap">
        <MarinReveal>
          <h2 class="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-tight text-mts-accent">
            <ThemedContentString :content="d.ecosystem.title" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <p class="mt-6 max-w-[820px] font-body text-xl leading-[34px] text-mts-frost lg:text-2xl">
            <ThemedContentString :content="d.ecosystem.lead" />
          </p>
        </MarinReveal>
        <MarinReveal :delay-ms="220">
          <div
            v-if="d.ecosystem.services.length"
            class="mt-10 grid w-full grid-cols-1 md:mt-12 md:grid-cols-2"
          >
            <article
              v-for="(svc, i) in d.ecosystem.services"
              :key="`ecosystem-svc-${i}`"
              :class="ecosystemServiceCellClass(i, d.ecosystem.services.length)"
            >
              <div class="flex items-start gap-3">
                <component
                  :is="resolveServiceIcon(svc.icon || 'Wrench')"
                  class="mt-1 h-5 w-5 shrink-0 text-mts-accent"
                  aria-hidden="true"
                />
                <div class="min-w-0 flex-1">
                  <h3 class="font-display text-lg leading-snug text-mts-frost">
                    <ThemedContentString :content="svc.title" />
                  </h3>
                  <div class="mt-3 font-body text-sm leading-relaxed text-mts-frost/85 lg:text-base">
                    <ThemedContentString :content="svc.text" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </MarinReveal>
      </div>
    </section>

    <!-- Миссия — отдельная секция со своим фоном (Figma). -->
    <section v-else-if="sid === 'mission' && sectionShown('mission')" class="relative overflow-hidden py-20 lg:py-32">
      <div class="absolute inset-0">
        <img
          v-if="d.missionImage?.trim()"
          :src="d.missionImage"
          alt=""
          class="absolute inset-0 size-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="absolute inset-0 bg-mts-navy" aria-hidden="true" />
        <div class="mts-about-overlay-mission absolute inset-0" aria-hidden="true" />
      </div>

      <div class="relative z-10 mts-content-wrap">
        <MarinReveal>
          <h2 class="max-w-[900px] font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-tight text-mts-accent">
            <ThemedContentString :content="d.mission.title" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <p class="mt-6 max-w-[820px] font-body text-xl leading-[34px] text-mts-frost lg:text-2xl">
            <ThemedContentString :content="d.mission.lead" />
          </p>
        </MarinReveal>
        <MarinReveal :delay-ms="220">
          <div class="mt-12 grid gap-6 md:grid-cols-3 md:gap-5">
            <div
              v-for="(p, i) in d.mission.principles"
              :key="i"
              class="relative flex min-h-[280px] rounded-none border border-mts-slate-muted p-7 md:min-h-[299px] md:p-[30px]"
            >
              <div class="font-body text-[22px] leading-[34px] text-mts-frost lg:text-2xl">
                <span class="font-bold text-mts-accent">{{ i + 1 }}.</span>
                <span class="inline-block w-4" />
                <template v-if="isThemedCmsString(p.text)">
                  <ThemedContentString :content="p.text" />
                </template>
                <template v-else-if="splitPrinciple(p.text).heading">
                  <span class="font-semibold text-mts-frost">{{ splitPrinciple(p.text).heading }}</span>
                  <span class="text-mts-frost"> — {{ splitPrinciple(p.text).tail }}</span>
                </template>
                <template v-else>
                  {{ p.text }}
                </template>
              </div>
            </div>
          </div>
        </MarinReveal>
      </div>
    </section>
    <!--
      «Почему выбирают MTS?» — отдельная секция со сплошным фоном #0B1F2A
      (Figma: Rectangle 22, height ≈ 448px). Без фотографии и без градиента.
      Заголовок 40/34 bold #DE7879, параграф 24/34 regular #E6EDF2.
    -->
    <section v-else-if="sid === 'why' && sectionShown('why')" class="relative overflow-hidden bg-mts-bg py-20 lg:py-[6.125rem]">
      <div class="relative z-10 mts-content-wrap">
        <MarinReveal>
          <h2
            class="font-display text-2xl font-bold text-mts-accent lg:text-[34px] lg:leading-[30px]"
          >
            <ThemedContentString :content="d.why.title" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <p
            class="mt-8 max-w-[956px] font-body text-lg font-normal leading-[34px] text-mts-frost lg:mt-[1.625rem] lg:text-2xl"
          >
            <ThemedContentString :content="d.why.text" />
          </p>
        </MarinReveal>
      </div>
    </section>

    <!--
      «Компания в цифрах» — отдельная секция (Figma: Rectangle 51, h ≈ 547px).
      Поверх фотографии — диагональный градиент из макета:
      linear-gradient(111.6deg, #050D12cc → #0B1F2Acc → #0E2735b6 → #102E3F52).
      Заголовок и значения — Inter 700, 40/34, цвет #DE7879.
    -->
    <section v-else-if="sid === 'stats' && sectionShown('stats')" class="relative overflow-hidden py-20 lg:py-[6.125rem]" data-rail-ignore="true">
      <div class="absolute inset-0">
        <img
          v-if="d.statsImage?.trim()"
          :src="d.statsImage"
          alt=""
          class="absolute inset-0 size-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="absolute inset-0 bg-mts-navy" aria-hidden="true" />
        <div class="mts-about-overlay-stats absolute inset-0" aria-hidden="true" />
      </div>

      <div class="relative z-10 mts-content-wrap">
        <MarinReveal>
          <h2
            class="font-display text-2xl font-bold text-mts-accent lg:text-[34px] lg:leading-[40px]"
          >
            {{ t('pages.about.statsHeading') }}
          </h2>
        </MarinReveal>

        <div class="mt-10 grid grid-cols-2 gap-x-16 gap-y-12 md:max-w-7xl md:mx-auto lg:mt-14">
          <!--
            Каждая цифра появляется с собственной задержкой (по 100ms),
            создаёт эффект «нарастающего счётчика» статистики.
          -->
          <MarinReveal
            v-for="(s, si) in stats"
            :key="si"
            :delay-ms="120 + si * 100"
          >
            <p class="font-display text-[34px] font-bold leading-tight text-mts-accent">
              {{ s.value }}
            </p>
            <p class="mt-1 font-body text-xl leading-tight text-mts-frost">
              {{ s.label }}
            </p>
          </MarinReveal>
        </div>
      </div>
    </section>
    <!--
      География. `overflow-hidden` снят с самой секции, чтобы ромбы могли
      вылезти вверх за линию раздела (правая вершина ложится на стык
      с «Компанией в цифрах»). Компонент карты сам обрезает свой контент.
    -->
    <section v-else-if="sid === 'geography' && sectionShown('geography')" class="relative">
      <AboutServiceGeographyMap
        class="relative z-10"
        theme="dark"
        :locations="geoLocations"
        :label="d.geography.label"
        :title="d.geography.title"
        :lead="d.geography.lead"
      />
      <!--
        Декоративные «полуромбы» из Figma (Group 17, пара на стыке с «Цифрами»).
        В этой секции карта (`AboutServiceGeographyMap`) сама занимает z-10 и
        перекрывает всё, что под ней. Поэтому ромбам здесь явно выставляем
        z-30, иначе они окажутся под картой и не будут видны вовсе.
      -->
      <MarinHalfRombs class="!z-30" />

    </section>

    <!-- Сертификаты -->
    <section
      v-else-if="sid === 'certificates' && sectionShown('certificates') && d.certificates?.items?.length"
      class="relative overflow-hidden bg-mts-navy py-16 lg:py-24"
    >
      <div class="mts-content-wrap">
        <MarinReveal>
          <h2 class="text-center font-display text-2xl font-bold text-mts-accent lg:text-3xl">
            <ThemedContentString :content="d.certificates.title" />
          </h2>
        </MarinReveal>
        <div class="mt-12 grid gap-6 md:grid-cols-3">
          <!-- Каскадное появление карточек сертификатов (по 90ms между ними). -->
          <MarinReveal
            v-for="(c, ci) in d.certificates.items"
            :key="c.name"
            :delay-ms="120 + ci * 90"
          >
            <div class="border border-white/15 bg-mts-navy/60 p-6 text-center backdrop-blur-sm">
              <p class="font-mono text-sm text-mts-accent"><ThemedContentString :content="c.name" /></p>
              <p class="mt-2 font-body text-sm text-mts-slate-muted"><ThemedContentString :content="c.desc" /></p>
              <a
                v-if="c.fileUrl"
                :href="c.fileUrl"
                target="_blank"
                class="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase text-mts-accent hover:underline"
              >
                <FileDown class="w-3.5 h-3.5" />
                Скачать
              </a>
            </div>
          </MarinReveal>
        </div>
      </div>
    </section>

      <!-- ===== Custom section (одна на итерацию) ===== -->
      <CommonCustomPageSectionsRender
        v-else-if="sid.startsWith('custom:') && sectionShown(sid)"
        :sections="(d.customSections ?? []).filter((s) => `custom:${s.id}` === sid)"
      />
    </template>

    <CommonPageInquiryForm v-if="d.showInquiryForm" source-page="about" />
  </div>
</template>
