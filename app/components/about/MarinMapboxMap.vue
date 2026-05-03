<script setup lang="ts">
/**
 * Нативные слои Mapbox (без HTML overlay):
 * - точки: circle layer
 * - подписи: symbol layer (справа от точки, на том же уровне)
 *
 * Базовые подписи карты НЕ скрываем.
 */
import 'mapbox-gl/dist/mapbox-gl.css'
import type { FeatureCollection, Point } from 'geojson'
import type { GeoJSONSource, Map as MapboxMap } from 'mapbox-gl'
import type { AboutGeoLocation } from '~/types'

type Loc = AboutGeoLocation & { lng: number, lat: number }

const props = defineProps<{
  locations: AboutGeoLocation[]
  accessToken: string
}>()

const mapEl = ref<HTMLDivElement | null>(null)

let mapboxgl: typeof import('mapbox-gl') | null = null
let map: MapboxMap | null = null
const SOURCE_ID = 'mts-geo-points'
const PULSE_LAYER_ID = 'mts-geo-points-pulse'
const DOT_LAYER_ID = 'mts-geo-points-dot'
const LABEL_LAYER_ID = 'mts-geo-points-label'
const PULSE_PERIOD_MS = 1900

let containerResizeObs: ResizeObserver | null = null
let pulseRaf = 0
let pulseStartedAt = 0
let reduceMotion = false
let isFittingBounds = false

function asCoord(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v
  }
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : Number.NaN
  }
  return Number.NaN
}

const validLocations = computed<Loc[]>(() =>
  props.locations
    .map((l) => {
      const r = l as unknown as Record<string, unknown>
      const lng = asCoord(r.lng ?? r.longitude ?? r.lon)
      const lat = asCoord(r.lat ?? r.latitude)
      return { ...l, lng, lat }
    })
    .filter(
      (l) =>
        Number.isFinite(l.lng)
        && Number.isFinite(l.lat)
        && l.lng >= -180
        && l.lng <= 180
        && l.lat >= -90
        && l.lat <= 90,
    ),
)

function toFeatureCollection(locations: Loc[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: locations.map((loc) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [loc.lng, loc.lat],
      } satisfies Point,
      properties: {
        name: String((loc.name ?? '').trim()),
      },
    })),
  }
}

function destroyMap() {
  containerResizeObs?.disconnect()
  containerResizeObs = null
  if (map) {
    map.remove()
    map = null
  }
}

function fitToMarkers() {
  if (!map || !mapboxgl || validLocations.value.length === 0) {
    return
  }
  if (isFittingBounds) {
    return
  }
  isFittingBounds = true
  if (validLocations.value.length === 1) {
    const only = validLocations.value[0]!
    map.jumpTo({ center: [only.lng, only.lat], zoom: 2 })
    isFittingBounds = false
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
  isFittingBounds = false
}

function syncMapSizeAndFrame(): void {
  if (!map) {
    return
  }
  map.resize()
}

function themeVar(name: string, fallback: string): string {
  if (!import.meta.client) {
    return fallback
  }
  const v = getComputedStyle(document.body).getPropertyValue(name).trim()
  return v || fallback
}

function applyThemeToPointLayers(): void {
  if (!map) {
    return
  }
  const marker = themeVar('--color-mts-marker', themeVar('--color-mts-accent', '#c84b4b'))
  const markerLight = themeVar('--color-mts-accent-light', '#d76565')
  const label = themeVar('--color-mts-frost', '#e6edf2')
  if (map.getLayer(PULSE_LAYER_ID)) {
    map.setPaintProperty(PULSE_LAYER_ID, 'circle-color', markerLight)
  }
  if (map.getLayer(DOT_LAYER_ID)) {
    map.setPaintProperty(DOT_LAYER_ID, 'circle-color', marker)
    map.setPaintProperty(DOT_LAYER_ID, 'circle-stroke-color', markerLight)
  }
  if (map.getLayer(LABEL_LAYER_ID)) {
    map.setPaintProperty(LABEL_LAYER_ID, 'text-color', label)
  }
}

function stopPulseAnimation(): void {
  if (pulseRaf) {
    cancelAnimationFrame(pulseRaf)
    pulseRaf = 0
  }
  pulseStartedAt = 0
}

function pulseTick(ts: number): void {
  if (!map || !map.getLayer(PULSE_LAYER_ID)) {
    stopPulseAnimation()
    return
  }
  if (pulseStartedAt === 0) {
    pulseStartedAt = ts
  }
  const p = ((ts - pulseStartedAt) % PULSE_PERIOD_MS) / PULSE_PERIOD_MS
  const radius = 5 + 8 * p
  const opacity = 0.34 * (1 - p)
  map.setPaintProperty(PULSE_LAYER_ID, 'circle-radius', radius)
  map.setPaintProperty(PULSE_LAYER_ID, 'circle-opacity', opacity)
  pulseRaf = requestAnimationFrame(pulseTick)
}

function startPulseAnimation(): void {
  if (reduceMotion || pulseRaf || !map?.getLayer(PULSE_LAYER_ID)) {
    return
  }
  pulseRaf = requestAnimationFrame(pulseTick)
}

function hideBasemapSymbolLabels(): void {
  if (!map) {
    return
  }
  const layers = map.getStyle().layers ?? []
  for (const layer of layers) {
    if (layer.type !== 'symbol') {
      continue
    }
    if (layer.id === LABEL_LAYER_ID) {
      continue
    }
    try {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
    } catch {
      /* style may mutate between events */
    }
  }
}

function ensureSourceAndLayers() {
  if (!map || !mapboxgl || !map.isStyleLoaded()) {
    return
  }
  const fc = toFeatureCollection(validLocations.value)
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, { type: 'geojson', data: fc })
  } else {
    (map.getSource(SOURCE_ID) as GeoJSONSource).setData(fc)
  }
  if (!map.getLayer(PULSE_LAYER_ID)) {
    map.addLayer({
      id: PULSE_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 9,
        'circle-color': '#d76565',
        'circle-opacity': reduceMotion ? 0.14 : 0.28,
      },
    })
  }
  if (!map.getLayer(DOT_LAYER_ID)) {
    map.addLayer({
      id: DOT_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 4.2,
        'circle-color': '#c96667',
        'circle-stroke-width': 1.4,
        'circle-stroke-color': '#d76565',
      },
    })
  }
  if (!map.getLayer(LABEL_LAYER_ID)) {
    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['>', ['length', ['get', 'name']], 0],
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-anchor': 'left',
        'text-offset': [0.9, 0],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#e6edf2',
        'text-halo-color': 'rgba(5, 13, 18, 0.85)',
        'text-halo-width': 2,
      },
    })
  }
  applyThemeToPointLayers()
  if (reduceMotion) {
    if (map.getLayer(PULSE_LAYER_ID)) {
      map.setPaintProperty(PULSE_LAYER_ID, 'circle-radius', 9)
      map.setPaintProperty(PULSE_LAYER_ID, 'circle-opacity', 0.14)
    }
    stopPulseAnimation()
  } else {
    startPulseAnimation()
  }
}

function scheduleSync(): void {
  requestAnimationFrame(() => {
    syncMapSizeAndFrame()
    requestAnimationFrame(() => {
      syncMapSizeAndFrame()
    })
  })
}

onMounted(async () => {
  if (!mapEl.value || !props.accessToken) {
    return
  }
  if (import.meta.client) {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
    ensureSourceAndLayers()
    hideBasemapSymbolLabels()
    fitToMarkers()
    scheduleSync()
  })

  map.on('styledata', () => {
    if (!map?.isStyleLoaded()) {
      return
    }
    ensureSourceAndLayers()
    hideBasemapSymbolLabels()
    fitToMarkers()
    scheduleSync()
  })

  map.once('idle', () => {
    ensureSourceAndLayers()
    hideBasemapSymbolLabels()
    fitToMarkers()
    scheduleSync()
  })

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
    ensureSourceAndLayers()
    fitToMarkers()
    scheduleSync()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  stopPulseAnimation()
  destroyMap()
})
</script>

<template>
  <div ref="mapEl" class="absolute inset-0 z-0 size-full min-h-0" />
</template>
