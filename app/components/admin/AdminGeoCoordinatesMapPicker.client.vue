<script setup lang="ts">
/**
 * Клик по карте или перетаскивание маркера → lat/lng в форму (как в dashboard.ivanmamonov).
 * Mapbox при наличии NUXT_PUBLIC_MAPBOX_TOKEN, иначе Яндекс.Карты при NUXT_PUBLIC_YANDEX_MAPS_API_KEY.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import type { LngLat } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const DEFAULT_LAT = 54.7104
const DEFAULT_LNG = 20.507
const EPS = 1e-7

const lat = defineModel<number>('lat', { required: true })
const lng = defineModel<number>('lng', { required: true })

const config = useRuntimeConfig()

const mapboxToken = computed(() => String(config.public.mapboxToken || '').trim())
const yandexKey = computed(() => String(config.public.yandexMapsApiKey || '').trim())

const provider = computed<'mapbox' | 'yandex' | 'none'>(() => {
  if (mapboxToken.value) {
    return 'mapbox'
  }
  if (yandexKey.value) {
    return 'yandex'
  }
  return 'none'
})

const containerRef = ref<HTMLElement | null>(null)
const initError = ref<string | null>(null)

const mapboxMap = shallowRef<mapboxgl.Map | null>(null)
const mapboxMarker = shallowRef<mapboxgl.Marker | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yandexMap: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yandexPlacemark: any = null
let yandexScriptPromise: Promise<void> | null = null

let containerResizeObs: ResizeObserver | null = null

function clampLat(x: number): number {
  return Math.max(-90, Math.min(90, x))
}

function clampLng(x: number): number {
  return Math.max(-180, Math.min(180, x))
}

function effectiveLatLng(): { lat: number, lng: number } {
  const la = Number.isFinite(lat.value) ? lat.value : DEFAULT_LAT
  const lo = Number.isFinite(lng.value) ? lng.value : DEFAULT_LNG
  if (la === 0 && lo === 0) {
    return { lat: DEFAULT_LAT, lng: DEFAULT_LNG }
  }
  return { lat: clampLat(la), lng: clampLng(lo) }
}

function emitCoords(nextLat: number, nextLng: number): void {
  lat.value = clampLat(nextLat)
  lng.value = clampLng(nextLng)
}

function syncMapboxSize(): void {
  mapboxMap.value?.resize()
}

function loadYandexScript(apikey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).ymaps) {
    return Promise.resolve()
  }
  if (yandexScriptPromise) {
    return yandexScriptPromise
  }
  yandexScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apikey)}&lang=ru_RU`
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Не удалось загрузить API Яндекс.Карт'))
    document.head.appendChild(s)
  })
  return yandexScriptPromise
}

function destroyMapbox(): void {
  containerResizeObs?.disconnect()
  containerResizeObs = null
  mapboxMarker.value?.remove()
  mapboxMarker.value = null
  mapboxMap.value?.remove()
  mapboxMap.value = null
}

function destroyYandex(): void {
  try {
    yandexMap?.destroy?.()
  } catch {
    /* noop */
  }
  yandexMap = null
  yandexPlacemark = null
}

function initMapbox(): void {
  const el = containerRef.value
  if (!el || !mapboxToken.value) {
    return
  }

  mapboxgl.accessToken = mapboxToken.value
  const { lat: la, lng: lo } = effectiveLatLng()
  const zoom = lat.value === 0 && lng.value === 0 ? 8 : 12

  const map = new mapboxgl.Map({
    container: el,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [lo, la],
    zoom,
  })

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

  const marker = new mapboxgl.Marker({ draggable: true, color: '#c84b4b' })
    .setLngLat([lo, la])
    .addTo(map)

  const applyLngLat = (lngLat: LngLat) => {
    emitCoords(lngLat.lat, lngLat.lng)
  }

  map.on('click', (e) => {
    const ll = e.lngLat
    marker.setLngLat(ll)
    applyLngLat(ll)
  })

  marker.on('dragend', () => {
    const ll = marker.getLngLat()
    applyLngLat(ll)
  })

  mapboxMap.value = map
  mapboxMarker.value = marker

  map.on('load', () => {
    requestAnimationFrame(() => {
      syncMapboxSize()
      requestAnimationFrame(syncMapboxSize)
    })
  })

  if (typeof ResizeObserver !== 'undefined') {
    containerResizeObs = new ResizeObserver(() => {
      syncMapboxSize()
    })
    containerResizeObs.observe(el)
  }
}

function initYandex(): void {
  const el = containerRef.value
  if (!el || !yandexKey.value) {
    return
  }

  const id = el.id || `ymaps-coord-${Math.random().toString(36).slice(2)}`
  if (!el.id) {
    el.id = id
  }

  const { lat: la, lng: lo } = effectiveLatLng()
  const zoom = lat.value === 0 && lng.value === 0 ? 8 : 12

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ymaps = (window as any).ymaps
  ymaps.ready(() => {
    try {
      const map = new ymaps.Map(
        id,
        {
          center: [la, lo],
          zoom,
          controls: ['zoomControl'],
        },
        { suppressMapOpenBlock: true },
      )

      const placemark = new ymaps.Placemark(
        [la, lo],
        {},
        { draggable: true, preset: 'islands#redDotIcon' },
      )
      map.geoObjects.add(placemark)

      map.events.add('click', (e: { get: (k: string) => number[] }) => {
        const c = e.get('coords') as number[]
        placemark.geometry.setCoordinates(c)
        emitCoords(c[0], c[1])
      })

      placemark.events.add('dragend', () => {
        const c = placemark.geometry.getCoordinates() as number[]
        emitCoords(c[0], c[1])
      })

      yandexMap = map
      yandexPlacemark = placemark
    } catch (e) {
      initError.value = e instanceof Error ? e.message : 'Ошибка инициализации Яндекс.Карт'
    }
  })
}

async function bootstrap(): Promise<void> {
  initError.value = null
  destroyMapbox()
  destroyYandex()
  await nextTick()
  const el = containerRef.value
  if (!el) {
    return
  }

  if (provider.value === 'mapbox') {
    try {
      initMapbox()
    } catch (e) {
      initError.value = e instanceof Error ? e.message : 'Ошибка Mapbox'
    }
    return
  }

  if (provider.value === 'yandex') {
    try {
      await loadYandexScript(yandexKey.value)
      initYandex()
    } catch (e) {
      initError.value = e instanceof Error ? e.message : 'Ошибка загрузки Яндекс.Карт'
    }
  }
}

watch(
  () => [lat.value, lng.value] as const,
  ([la, lo]) => {
    if (!Number.isFinite(la) || !Number.isFinite(lo)) {
      return
    }

    const m = mapboxMarker.value
    const map = mapboxMap.value
    if (m && map) {
      const cur = m.getLngLat()
      if (Math.abs(cur.lat - la) < EPS && Math.abs(cur.lng - lo) < EPS) {
        return
      }
      m.setLngLat([lo, la])
      return
    }

    if (yandexPlacemark && yandexMap) {
      const cur = yandexPlacemark.geometry.getCoordinates() as number[]
      if (Math.abs(cur[0] - la) < EPS && Math.abs(cur[1] - lo) < EPS) {
        return
      }
      yandexPlacemark.geometry.setCoordinates([la, lo])
    }
  },
)

onMounted(() => {
  void bootstrap()
})

onBeforeUnmount(() => {
  destroyMapbox()
  destroyYandex()
})
</script>

<template>
  <div class="admin-geo-map-picker space-y-2">
    <div
      v-if="provider === 'none'"
      class="rounded-sm border border-amber-200/90 bg-amber-50 px-3 py-2 text-sm text-amber-950"
    >
      <p class="font-mono text-xs font-medium uppercase tracking-wide">Карта недоступна</p>
      <p class="mt-1 font-body text-xs text-amber-900/85">
        Задайте <code class="rounded bg-amber-100/90 px-1 py-0.5 font-mono text-[11px]">NUXT_PUBLIC_MAPBOX_TOKEN</code>
        или
        <code class="rounded bg-amber-100/90 px-1 py-0.5 font-mono text-[11px]">NUXT_PUBLIC_YANDEX_MAPS_API_KEY</code>
        — появится выбор точки на карте.
      </p>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="font-body text-xs text-mts-text-secondary">
          Клик по карте или перетащите маркер — координаты подставятся в поля.
        </p>
        <span class="rounded-sm bg-mts-bg px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
          {{ provider === 'mapbox' ? 'Mapbox' : 'Яндекс' }}
        </span>
      </div>

      <div
        v-if="initError"
        class="rounded-sm border border-red-200 bg-red-50 px-3 py-2 font-body text-sm text-red-800"
      >
        {{ initError }}
      </div>

      <div
        ref="containerRef"
        class="h-[min(320px,45vh)] w-full min-h-[200px] overflow-hidden rounded-sm border border-mts-border"
      />
    </template>
  </div>
</template>
