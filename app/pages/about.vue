<script setup lang="ts">
import { FileDown } from 'lucide-vue-next'
import type { AboutPageData, AboutGeoLocation, MarineContentLocale } from '~/types'
import AboutServiceGeographyMap from '~/components/about/ServiceGeographyMap.vue'
import MarinDecorRail from '~/components/about/MarinDecorRail.vue'
import MarinHalfRombs from '~/components/about/MarinHalfRombs.vue'
import MarinReveal from '~/components/about/MarinReveal.vue'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { defaultAboutData, mergeAboutPageData } from '~/utils/aboutPageDefaults'

useSiteSeoMeta('about')

const { t, locale } = useI18n()
const api = useMarineApi()

const FIGMA_BG = {
  hero: '/images/marin-figma/hero-ship.webp',
  intro: '/images/marin-figma/about-ship.webp',
  ecosystem: '/images/marin-figma/ecosystem-cranes.webp',
  mission: '/images/marin-figma/mission-dock.webp',
  stats: '/images/marin-figma/stats-port.webp',
} as const

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
</script>

<template>
  <!--
    Класс `mts-about-shell` подключает плавные градиентные «склейки» между
    секциями в светлой теме (см. assets/css/main.css). В тёмной теме класс
    ничего не меняет — секции остаются как в макете Figma.
  -->
  <div class="mts-about-shell bg-mts-navy text-mts-frost">
    <!-- Hero -->
    <section class="relative min-h-[min(100svh,920px)] flex items-end lg:items-center overflow-hidden">
      <div class="absolute inset-0">
        <img
          :src="d.heroImage || FIGMA_BG.hero"
          alt=""
          class="absolute inset-0 size-full object-cover object-center"
          loading="eager"
          decoding="async"
        />
        <div
          class="absolute inset-0 bg-linear-to-r from-mts-navy/92 via-mts-navy/60 to-mts-navy/20"
          aria-hidden="true"
        />
        <div class="absolute inset-0 bg-linear-to-t from-mts-navy/80 via-transparent to-mts-navy/60" aria-hidden="true" />
      </div>

      <!-- Декоративный правый rail (общий для всех секций страницы). -->
      <MarinDecorRail />

      <div class="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-28 lg:px-12 lg:pb-24 lg:pt-36">
        <h1 class="max-w-[720px] font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.25]">
          <ThemeFormattedTitle :title="d.hero.titleFormatted" />
        </h1>
        <p class="mt-5 max-w-[720px] font-display text-lg font-medium leading-[1.4] text-mts-frost lg:text-2xl lg:leading-[34px]">
          <ThemedContentString :content="d.hero.subtitle" />
        </p>
      </div>
    </section>

    <!-- О компании: текст на фоне снимка -->
    <section class="relative overflow-hidden py-20 lg:py-28">
      <div class="absolute inset-0">
        <img
          :src="d.introImage || FIGMA_BG.intro"
          alt=""
          class="absolute inset-0 size-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div
          class="absolute inset-0"
          style="background: linear-gradient(144.35deg, rgba(31, 58, 74, 0.92) 19.24%, rgba(31, 58, 74, 0.82) 35.4%, rgba(38, 106, 144, 0) 95.91%)"
          aria-hidden="true"
        />
      </div>

      <MarinDecorRail />

      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <MarinReveal>
          <h2 class="max-w-[720px] font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-tight">
            <ThemeFormattedTitle :title="d.hero.titleFormatted" />
          </h2>
        </MarinReveal>
        <MarinReveal :delay-ms="120">
          <div class="mt-8 max-w-[630px] space-y-5 font-body text-xl leading-[34px] text-mts-frost lg:text-2xl">
            <p><ThemedContentString :content="d.hero.lead" /></p>
            <p><ThemedContentString :content="d.hero.lead2" /></p>
          </div>
        </MarinReveal>
      </div>
    </section>

    <!--
      Экосистема сервисов.
      `overflow-hidden` оставлен ТОЛЬКО на обёртке фона, чтобы фотография
      не «вытекала» за пределы секции, но при этом ромбы из Figma могли
      выходить вверх за линию раздела (правая вершина ромба ложится на
      границу с предыдущей секцией).
    -->
    <section class="relative py-20 lg:py-32">
      <div class="absolute inset-0 overflow-hidden">
        <img
          :src="d.ecosystemImage || FIGMA_BG.ecosystem"
          alt=""
          class="absolute inset-0 size-full object-cover object-[center_40%]"
          loading="lazy"
          decoding="async"
        />
        <div class="absolute inset-0 bg-mts-navy/82" aria-hidden="true" />
      </div>

      <!-- Декоративные «полуромбы» из Figma (Group 17, пара на стыке с «О компании»). -->
      <MarinHalfRombs />

      <MarinDecorRail />

      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
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
          <ul class="mt-10 max-w-[980px] space-y-7">
            <li v-for="svc in d.ecosystem.services" :key="svc.title" class="flex gap-5">
              <span
                class="mt-3 h-0 w-0 shrink-0 border-y-[7px] border-l-[12px] border-y-transparent border-l-mts-accent"
                aria-hidden="true"
              />
              <p class="font-body text-lg leading-[34px] text-mts-frost lg:text-xl">
                <span class="font-semibold text-mts-frost inline"><ThemedContentString :content="svc.title" /></span
                ><span class="text-mts-frost">:</span> <ThemedContentString :content="svc.text" />
              </p>
            </li>
          </ul>
        </MarinReveal>
      </div>
    </section>

    <!-- Миссия — отдельная секция со своим фоном (Figma). -->
    <section class="relative overflow-hidden py-20 lg:py-32">
      <div class="absolute inset-0">
        <img
          :src="d.missionImage || FIGMA_BG.mission"
          alt=""
          class="absolute inset-0 size-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div
          class="absolute inset-0"
          style="background: linear-gradient(123.38deg, rgba(20, 42, 54, 0.86) 5.42%, rgba(31, 58, 74, 0.84) 38.63%, rgba(31, 58, 74, 0.72) 52.47%, rgba(31, 58, 74, 0.35) 93.97%)"
          aria-hidden="true"
        />
      </div>

      <MarinDecorRail />

      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
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
    <section class="relative overflow-hidden bg-mts-bg py-20 lg:py-[6.125rem]">
      <MarinDecorRail />

      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <MarinReveal>
          <h2
            class="font-display text-3xl font-bold text-mts-accent lg:text-[40px] lg:leading-[34px]"
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
    <section class="relative overflow-hidden py-20 lg:py-[6.125rem]">
      <div class="absolute inset-0">
        <img
          :src="d.statsImage || FIGMA_BG.stats"
          alt=""
          class="absolute inset-0 size-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div
          class="absolute inset-0"
          style="background: linear-gradient(111.6deg, rgba(5, 13, 18, 0.8) 5.42%, rgba(11, 31, 42, 0.8) 38.63%, rgba(14, 39, 53, 0.7128) 52.47%, rgba(16, 46, 63, 0.32) 93.97%)"
          aria-hidden="true"
        />
      </div>

      <MarinDecorRail />

      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <MarinReveal>
          <h2
            class="font-display text-3xl font-bold text-mts-accent lg:text-[40px] lg:leading-[48px]"
          >
            {{ t('pages.about.statsHeading') }}
          </h2>
        </MarinReveal>

        <div class="mt-10 grid grid-cols-2 gap-x-16 gap-y-12 md:max-w-2xl md:mx-auto lg:mt-14">
          <!--
            Каждая цифра появляется с собственной задержкой (по 100ms),
            создаёт эффект «нарастающего счётчика» статистики.
          -->
          <MarinReveal
            v-for="(s, si) in stats"
            :key="si"
            :delay-ms="120 + si * 100"
          >
            <p class="font-display text-[40px] font-bold leading-tight text-mts-accent">
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
    <section class="relative">
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

      <!-- На карте поднимаем rail выше overlay-градиента (z-30). -->
      <MarinDecorRail class="z-30" />
    </section>

    <!-- Сертификаты -->
    <section
      v-if="d.certificates?.items?.length"
      class="relative overflow-hidden bg-mts-navy py-16 lg:py-24"
    >
      <div class="mx-auto max-w-7xl px-6 lg:px-12">
        <MarinReveal>
          <h2 class="text-center font-display text-3xl font-bold text-mts-accent lg:text-4xl">
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

    <CommonCustomPageSectionsRender :sections="d.customSections" />

    <CommonPageInquiryForm v-if="d.showInquiryForm" source-page="about" />
  </div>
</template>
