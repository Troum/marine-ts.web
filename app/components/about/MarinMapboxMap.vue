<script setup lang="ts">
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl'
import type { AboutGeoLocation } from '~/types'

const props = defineProps<{
  locations: AboutGeoLocation[]
  accessToken: string
}>()

const mapEl = ref<HTMLDivElement | null>(null)

let mapboxgl: typeof import('mapbox-gl') | null = null
let map: MapboxMap | null = null
let markers: MapboxMarker[] = []

const validLocations = computed(() =>
  props.locations.filter(
    (l) =>
      Number.isFinite(l.lng)
      && Number.isFinite(l.lat)
      && l.lng >= -180
      && l.lng <= 180
      && l.lat >= -90
      && l.lat <= 90,
  ),
)
function buildDotEl(): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.className = 'mts-mb-marker'

  const ping = document.createElement('span')
  ping.className = 'mts-mb-marker__ping'
  ping.setAttribute('aria-hidden', 'true')

  const dot = document.createElement('span')
  dot.className = 'mts-mb-marker__dot'
  dot.setAttribute('aria-hidden', 'true')

  wrap.append(ping, dot)
  return wrap
}

function buildLabelEl(name: string): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'mts-mb-label'
  el.textContent = name
  return el
}

let containerResizeObs: ResizeObserver | null = null

function destroyMap() {
  containerResizeObs?.disconnect()
  containerResizeObs = null
  for (const m of markers) {
    m.remove()
  }
  markers = []
  if (map) {
    map.remove()
    map = null
  }
}

function fitToMarkers() {
  if (!map || !mapboxgl || validLocations.value.length === 0) {
    return
  }
  if (validLocations.value.length === 1) {
    const only = validLocations.value[0]!
    map.jumpTo({ center: [only.lng, only.lat], zoom: 2 })
    return
  }
  const bounds = new mapboxgl.LngLatBounds()
  for (const l of validLocations.value) {
    bounds.extend([l.lng, l.lat])
  }
  map.fitBounds(bounds, {
    padding: { top: 80, right: 80, bottom: 80, left: 80 },
    duration: 0,
    maxZoom: 3,
  })
}

/**
 * HTML-маркеры Mapbox привязываются к проекции canvas. Если контейнер
 * с aspect-ratio / flex получил финальную высоту после первого кадра
 * или после SSR → ClientOnly, без `resize()` точки визуально «уползают».
 */
function syncMapSizeAndFrame(): void {
  if (!map) {
    return
  }
  map.resize()
  fitToMarkers()
}

const LABEL_OFFSET_PX = 14

function renderMarkers() {
  if (!map || !mapboxgl) {
    return
  }
  for (const m of markers) {
    m.remove()
  }
  markers = []

  for (const loc of validLocations.value) {
    const dotMarker = new mapboxgl.Marker({ element: buildDotEl(), anchor: 'center' })
      .setLngLat([loc.lng, loc.lat])
      .addTo(map)
    markers.push(dotMarker)

    const name = (loc.name ?? '').trim()
    if (name.length === 0) {
      continue
    }
    const anchor: 'left' | 'right' = loc.labelOnRight ? 'left' : 'right'
    const offset: [number, number] = loc.labelOnRight
      ? [LABEL_OFFSET_PX, 0]
      : [-LABEL_OFFSET_PX, 0]

    const labelMarker = new mapboxgl.Marker({
      element: buildLabelEl(name),
      anchor,
      offset,
    })
      .setLngLat([loc.lng, loc.lat])
      .addTo(map)
    markers.push(labelMarker)
  }
}
function hideAllLabels() {
  if (!map) {
    return
  }
  const style = map.getStyle()
  const layers = style?.layers ?? []
  for (const layer of layers) {
    if (layer.type === 'symbol') {
      try {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      } catch {
        /* слой мог быть удалён до момента вызова — игнорируем */
      }
    }
  }
}

onMounted(async () => {
  if (!mapEl.value || !props.accessToken) {
    return
  }
  const mod = await import('mapbox-gl')
  mapboxgl = (mod as unknown as { default?: typeof import('mapbox-gl') }).default ?? mod
  mapboxgl.accessToken = props.accessToken

  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [10, 35],
    zoom: 1,
    interactive: false,
    attributionControl: false,
    cooperativeGestures: false,
    projection: 'mercator',
  })

  map.on('load', () => {
    hideAllLabels()
    renderMarkers()
    requestAnimationFrame(() => {
      syncMapSizeAndFrame()
      requestAnimationFrame(syncMapSizeAndFrame)
    })
  })
  map.on('styledata', hideAllLabels)

  const el = mapEl.value
  if (el && typeof ResizeObserver !== 'undefined') {
    containerResizeObs = new ResizeObserver(() => {
      syncMapSizeAndFrame()
    })
    containerResizeObs.observe(el)
  }

  if (import.meta.client && document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      syncMapSizeAndFrame()
    })
  }
})

watch(
  validLocations,
  () => {
    if (!map) {
      return
    }
    renderMarkers()
    requestAnimationFrame(syncMapSizeAndFrame)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<template>
  <div ref="mapEl" class="absolute inset-0 size-full" />
</template>

<style>
.mts-mb-marker {
  position: relative;
  display: block;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  pointer-events: none;
  /* Явный геометрический центр для anchor:center у Mapbox Marker */
  transform-origin: center center;
}
.mts-mb-marker__dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  margin-top: -7px;
  border-radius: 9999px;
  background-color: var(--color-mts-accent-dark, #c96667);
  box-shadow: 0 0 0 2px rgba(46, 163, 255, 0.25);
}
.mts-mb-marker__ping {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  margin-top: -7px;
  border-radius: 9999px;
  background-color: var(--color-mts-accent-dark, #c96667);
  opacity: 0.55;
  transform-origin: center center;
  animation: mts-mb-ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.mts-mb-label {
  white-space: nowrap;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--color-mts-frost, #e6edf2);
  text-shadow:
    0 0 2px rgba(5, 13, 18, 0.85),
    0 1px 2px rgba(5, 13, 18, 0.7);
  pointer-events: none;
  user-select: none;
}
@keyframes mts-mb-ping {
  0% {
    transform: scale(0.65);
    opacity: 0.5;
  }
  75%,
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}
</style>
