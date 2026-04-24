<script setup lang="ts">
import type { AboutGeoLocation } from '~/types'
import MarinMapboxMap from '~/components/about/MarinMapboxMap.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'

const { t } = useI18n()
const config = useRuntimeConfig()

/**
 * Источник локаций — строго входной проп. Раньше здесь был
 * fallback-список реальных портов, но он создавал расхождение
 * между CMS / i18n / hard-coded данными и приводил к показу
 * «фантомных» точек, если родитель забывал передать `locations`.
 * Теперь компонент полностью полагается на родителя: он сам
 * решает, откуда брать локации (CMS, i18n, тесты и т.п.).
 */
const props = withDefaults(
  defineProps<{
    locations: AboutGeoLocation[]
    label?: string
    title?: string
    lead?: string
    /** Тёмный блок как в макете (фон секции задаётся снаружи). */
    theme?: 'light' | 'dark'
  }>(),
  {
    label: '',
    title: '',
    lead: '',
    theme: 'light',
  },
)

const displayLabel = computed(() => props.label || t('pages.map.label'))
const displayTitle = computed(() => props.title || t('pages.map.title'))
const displayLead = computed(() => props.lead || t('pages.map.lead'))

const mapboxToken = computed(() => (config.public.mapboxToken as string | undefined) ?? '')
</script>

<template>
  <section
    :data-map-theme="theme"
    :class="[
      'relative overflow-hidden',
      theme === 'dark' ? 'bg-transparent text-mts-frost' : 'bg-mts-bg text-mts-text',
    ]"
    aria-labelledby="service-geography-heading"
  >
    <div class="relative w-full aspect-426/232 min-h-105 sm:min-h-130 lg:min-h-155">
      <ClientOnly>
        <MarinMapboxMap
          v-if="mapboxToken"
          :locations="props.locations"
          :access-token="mapboxToken"
        />
        <div
          v-else
          class="absolute inset-0 size-full bg-mts-navy-deep flex items-center justify-center"
        >
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-mts-frost/40">
            map unavailable — set NUXT_PUBLIC_MAPBOX_TOKEN
          </span>
        </div>
        <template #fallback>
          <div class="absolute inset-0 size-full bg-mts-navy-deep" />
        </template>
      </ClientOnly>
      <!--
        Лёгкий затемняющий градиент слева — только чтобы overlay-текст
        оставался читаемым. Низкая стартовая непрозрачность и узкая зона
        затухания, чтобы Южная Америка/Европа на карте оставались видны.
      -->
      <div
        class="pointer-events-none absolute inset-y-0 left-0 z-10 w-full sm:w-2/3 lg:w-2/5 bg-linear-to-r from-mts-navy/65 via-mts-navy/20 to-transparent"
        aria-hidden="true"
      />
      <div class="pointer-events-none absolute inset-0 z-40">
        <div
          class="mts-content-wrap flex h-full pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-32 lg:pb-16 xl:pt-36"
        >
          <div class="max-w-7xl pointer-events-auto">
            <div v-if="theme === 'light'" class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-mts-accent" />
              <span class="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-mts-text-secondary">
                <ThemedContentString :content="displayLabel" />
              </span>
            </div>
            <!-- Не <h2>: из админки приходит HTML с <p>/<br> (многострочный заголовок). -->
            <div
              id="service-geography-heading"
              role="heading"
              aria-level="2"
              :class="[
                'font-display font-bold leading-tight mb-4 lg:mb-6',
                theme === 'dark'
                  ? 'text-2xl lg:text-[34px] text-mts-accent lg:leading-10'
                  : 'text-2xl lg:text-3xl text-mts-text',
              ]"
            >
              <ThemedContentString :content="displayTitle" />
            </div>
            <p
              v-if="displayLead"
              :class="[
                'font-body leading-relaxed',
                theme === 'dark' ? 'text-base lg:text-lg text-mts-frost/90' : 'text-sm lg:text-base text-mts-text-secondary',
              ]"
            >
              <ThemedContentString :content="displayLead" />
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
