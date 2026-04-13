<script setup lang="ts">
import type { AboutGeoLocation } from '~/types'

const MAP = { w: 950, h: 620 }
const CROP = { x: 198, y: 96, w: 426, h: 232 }

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    locations?: AboutGeoLocation[]
    label?: string
    title?: string
    lead?: string
  }>(),
  {
    locations: undefined,
    label: '',
    title: '',
    lead: '',
  },
)

const FALLBACK_LOCATIONS: (AboutGeoLocation & { mapKey: string })[] = [
  { mapKey: 'panama', x: 23.5, y: 50.0, labelOnRight: true, name: '' },
  { mapKey: 'curacao', x: 30.8, y: 46.8, labelOnRight: true, name: '' },
  { mapKey: 'lasPalmas', x: 43.1, y: 41.0, labelOnRight: true, name: '' },
  { mapKey: 'alexandria', x: 54.5, y: 38.4, labelOnRight: false, name: '' },
  { mapKey: 'dubai', x: 63.0, y: 42.7, labelOnRight: false, name: '' },
  { mapKey: 'hull', x: 48.0, y: 25.2, labelOnRight: true, name: '' },
  { mapKey: 'stockholm', x: 53.3, y: 22.3, labelOnRight: false, name: '' },
  { mapKey: 'alesund', x: 52.8, y: 18.2, labelOnRight: false, name: '' },
  { mapKey: 'klaipeda', x: 53.8, y: 25.0, labelOnRight: true, name: '' },
  { mapKey: 'kaliningrad', x: 52.6, y: 25.5, labelOnRight: false, name: '' },
]

const displayLabel = computed(() => props.label || t('pages.map.label'))
const displayTitle = computed(() => props.title || t('pages.map.title'))
const displayLead = computed(() => props.lead || t('pages.map.lead'))

function cropPos(fullX: number, fullY: number) {
  const px = (fullX / 100) * MAP.w
  const py = (fullY / 100) * MAP.h
  return {
    x: ((px - CROP.x) / CROP.w) * 100,
    y: ((py - CROP.y) / CROP.h) * 100,
  }
}

const markers = computed(() => {
  if (props.locations?.length) {
    return props.locations.map((loc, i) => {
      const p = cropPos(loc.x, loc.y)
      return { key: `cms-${i}`, left: p.x, top: p.y, labelOnRight: loc.labelOnRight, name: loc.name }
    })
  }
  return FALLBACK_LOCATIONS.map((loc) => {
    const p = cropPos(loc.x, loc.y)
    return { key: loc.mapKey, left: p.x, top: p.y, labelOnRight: loc.labelOnRight, name: t(`pages.map.${loc.mapKey}`) }
  })
})
</script>

<template>
  <section
    class="relative bg-mts-bg text-mts-text overflow-hidden"
    aria-labelledby="service-geography-heading"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-6 lg:pb-8 relative z-10">
      <div class="max-w-xl">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-6 h-px bg-mts-accent" />
          <span class="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-mts-text-secondary">{{
            displayLabel
          }}</span>
        </div>
        <h2 id="service-geography-heading" class="font-display text-3xl lg:text-4xl text-mts-text leading-tight mb-4">
          {{ displayTitle }}
        </h2>
        <p class="font-body text-sm lg:text-base text-mts-text-secondary leading-relaxed">
          {{ displayLead }}
        </p>
      </div>
    </div>

    <div class="relative z-[1] w-full">
      <div class="relative w-full aspect-[426/232]">
        <svg
          class="mts-map-crop absolute inset-0 size-full"
          :viewBox="`${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}`"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <image href="/images/world-map-stroke.svg" width="950" height="620" />
        </svg>

        <div
          v-for="loc in markers"
          :key="loc.key"
          class="absolute z-[2]"
          :style="{
            left: `${loc.left}%`,
            top: `${loc.top}%`,
          }"
        >
          <div class="relative -translate-x-1/2 -translate-y-1/2">
            <span class="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span class="mts-map-ping absolute inline-flex h-full w-full rounded-full bg-mts-accent opacity-55" />
              <span
                class="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-mts-accent ring-2 ring-mts-accent/30"
              />
            </span>
            <span
              class="font-body text-[10px] sm:text-xs text-mts-text font-medium whitespace-nowrap absolute top-1/2 -translate-y-1/2 max-w-[min(100px,26vw)] sm:max-w-[140px] truncate pointer-events-none"
              :class="loc.labelOnRight ? 'left-full ml-1.5 sm:ml-2' : 'right-full mr-1.5 sm:mr-2 text-right'"
            >
              {{ loc.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mts-map-crop :deep(image) {
  filter: brightness(0);
  opacity: 0.2;
}

.mts-map-ping {
  animation: mts-map-ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes mts-map-ping {
  0% {
    transform: scale(0.65);
    opacity: 0.5;
  }
  75%,
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}
</style>
