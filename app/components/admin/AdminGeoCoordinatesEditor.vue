<script setup lang="ts">
/**
 * Широта/долгота: ГМС + карта (Mapbox или Яндекс), те же десятичные lat/lng, что на сайте.
 */
import { computed, reactive, watch } from 'vue'
import {
  decimalLatitudeToDms,
  decimalLongitudeToDms,
  dmsLatitudeToDecimal,
  dmsLongitudeToDecimal,
  type LatitudeHemisphere,
  type LongitudeHemisphere,
} from '~/utils/geoDms'
import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'

const lat = defineModel<number>('lat', { required: true })
const lng = defineModel<number>('lng', { required: true })

const latDms = reactive({
  deg: 0,
  min: 0,
  sec: 0,
  hem: 'N' as LatitudeHemisphere,
})

const lngDms = reactive({
  deg: 0,
  min: 0,
  sec: 0,
  hem: 'E' as LongitudeHemisphere,
})

const latHemOptions: AdminSelectOption[] = [
  { label: 'Север (N)', value: 'N' },
  { label: 'Юг (S)', value: 'S' },
]

const lngHemOptions: AdminSelectOption[] = [
  { label: 'Восток (E)', value: 'E' },
  { label: 'Запад (W)', value: 'W' },
]

function approxEq(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-7
}

watch(
  () => lat.value,
  (v) => {
    const current = dmsLatitudeToDecimal(latDms.deg, latDms.min, latDms.sec, latDms.hem)
    if (approxEq(v, current)) {
      return
    }
    Object.assign(latDms, decimalLatitudeToDms(Number.isFinite(v) ? v : 0))
  },
  { immediate: true },
)

watch(
  () => lng.value,
  (v) => {
    const current = dmsLongitudeToDecimal(lngDms.deg, lngDms.min, lngDms.sec, lngDms.hem)
    if (approxEq(v, current)) {
      return
    }
    Object.assign(lngDms, decimalLongitudeToDms(Number.isFinite(v) ? v : 0))
  },
  { immediate: true },
)

watch(
  () => [latDms.deg, latDms.min, latDms.sec, latDms.hem] as const,
  () => {
    const dec = dmsLatitudeToDecimal(latDms.deg, latDms.min, latDms.sec, latDms.hem)
    if (approxEq(dec, lat.value)) {
      return
    }
    lat.value = dec
  },
)

watch(
  () => [lngDms.deg, lngDms.min, lngDms.sec, lngDms.hem] as const,
  () => {
    const dec = dmsLongitudeToDecimal(lngDms.deg, lngDms.min, lngDms.sec, lngDms.hem)
    if (approxEq(dec, lng.value)) {
      return
    }
    lng.value = dec
  },
)

const decimalPreview = computed(() => {
  const la = dmsLatitudeToDecimal(latDms.deg, latDms.min, latDms.sec, latDms.hem)
  const lo = dmsLongitudeToDecimal(lngDms.deg, lngDms.min, lngDms.sec, lngDms.hem)
  return { la, lo }
})

function setLatFromMap(v: number): void {
  lat.value = v
}

function setLngFromMap(v: number): void {
  lng.value = v
}
</script>

<template>
  <div class="admin-geo-coordinates-editor space-y-5">
    <section class="rounded-sm border border-mts-border bg-mts-bg/40 p-4">
      <div class="mb-3 flex flex-wrap items-center gap-2 border-b border-mts-border pb-3">
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-mts-accent/15 font-mono text-xs font-bold text-mts-accent"
          aria-hidden="true"
        >⌖</span>
        <div>
          <h4 class="font-body text-sm font-semibold text-mts-text">Точка на карте</h4>
          <p class="font-body text-xs text-mts-text-secondary">Клик или перетаскивание маркера — значения попадут в столбцы lng/lat</p>
        </div>
      </div>
      <AdminGeoCoordinatesMapPicker
        :lat="decimalPreview.la"
        :lng="decimalPreview.lo"
        @update:lat="setLatFromMap"
        @update:lng="setLngFromMap"
      />
    </section>

    <section class="rounded-sm border border-mts-border bg-mts-bg/40 p-4">
      <div class="mb-4 flex flex-wrap items-center gap-2 border-b border-mts-border pb-3">
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-mts-accent/15 font-mono text-xs font-bold text-mts-accent"
          aria-hidden="true"
        >φ</span>
        <div>
          <h4 class="font-body text-sm font-semibold text-mts-text">Широта</h4>
          <p class="font-body text-xs text-mts-text-secondary">0° — 90° · север (N) или юг (S)</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-[1fr_1fr_1.15fr_5.5rem] lg:items-end lg:gap-4">
        <div class="min-w-0">
          <label class="mb-1.5 flex items-baseline justify-between gap-1">
            <span class="font-body text-xs font-semibold text-mts-text">Градусы</span>
            <span class="font-mono text-[11px] tabular-nums text-mts-text-secondary">°</span>
          </label>
          <AdminInputNumberStepper v-model="latDms.deg" variant="full" :min="0" :max="90" :step="1" />
        </div>
        <div class="min-w-0">
          <label class="mb-1.5 flex items-baseline justify-between gap-1">
            <span class="font-body text-xs font-semibold text-mts-text">Минуты</span>
            <span class="font-mono text-[11px] tabular-nums text-mts-text-secondary">′</span>
          </label>
          <AdminInputNumberStepper v-model="latDms.min" variant="full" :min="0" :max="59" :step="1" />
        </div>
        <div class="min-w-0 col-span-2 sm:col-span-1">
          <label class="mb-1.5 flex items-baseline justify-between gap-1">
            <span class="font-body text-xs font-semibold text-mts-text">Секунды</span>
            <span class="font-mono text-[11px] tabular-nums text-mts-text-secondary">″</span>
          </label>
          <AdminInputNumberStepper v-model="latDms.sec" variant="full" :min="0" :max="59.9999" :step="0.0001" />
        </div>
        <div class="min-w-0 col-span-2 sm:col-span-2 lg:col-span-1">
          <label class="mb-1.5 block font-body text-xs font-semibold text-mts-text">Полушарие</label>
          <AdminSelect
            :model-value="latDms.hem"
            :options="latHemOptions"
            placeholder="N / S"
            :searchable="false"
            @update:model-value="latDms.hem = $event as LatitudeHemisphere"
          />
        </div>
      </div>
    </section>

    <section class="rounded-sm border border-mts-border bg-mts-bg/40 p-4">
      <div class="mb-4 flex flex-wrap items-center gap-2 border-b border-mts-border pb-3">
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-mts-accent/15 font-mono text-xs font-bold text-mts-accent"
          aria-hidden="true"
        >λ</span>
        <div>
          <h4 class="font-body text-sm font-semibold text-mts-text">Долгота</h4>
          <p class="font-body text-xs text-mts-text-secondary">0° — 180° · восток (E) или запад (W)</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-[1fr_1fr_1.15fr_5.5rem] lg:items-end lg:gap-4">
        <div class="min-w-0">
          <label class="mb-1.5 flex items-baseline justify-between gap-1">
            <span class="font-body text-xs font-semibold text-mts-text">Градусы</span>
            <span class="font-mono text-[11px] tabular-nums text-mts-text-secondary">°</span>
          </label>
          <AdminInputNumberStepper v-model="lngDms.deg" variant="full" :min="0" :max="180" :step="1" />
        </div>
        <div class="min-w-0">
          <label class="mb-1.5 flex items-baseline justify-between gap-1">
            <span class="font-body text-xs font-semibold text-mts-text">Минуты</span>
            <span class="font-mono text-[11px] tabular-nums text-mts-text-secondary">′</span>
          </label>
          <AdminInputNumberStepper v-model="lngDms.min" variant="full" :min="0" :max="59" :step="1" />
        </div>
        <div class="min-w-0 col-span-2 sm:col-span-1">
          <label class="mb-1.5 flex items-baseline justify-between gap-1">
            <span class="font-body text-xs font-semibold text-mts-text">Секунды</span>
            <span class="font-mono text-[11px] tabular-nums text-mts-text-secondary">″</span>
          </label>
          <AdminInputNumberStepper v-model="lngDms.sec" variant="full" :min="0" :max="59.9999" :step="0.0001" />
        </div>
        <div class="min-w-0 col-span-2 sm:col-span-2 lg:col-span-1">
          <label class="mb-1.5 block font-body text-xs font-semibold text-mts-text">Полушарие</label>
          <AdminSelect
            :model-value="lngDms.hem"
            :options="lngHemOptions"
            placeholder="E / W"
            :searchable="false"
            @update:model-value="lngDms.hem = $event as LongitudeHemisphere"
          />
        </div>
      </div>
    </section>

    <p class="rounded-sm border border-dashed border-mts-border bg-mts-bg/30 px-3 py-2 font-body text-xs text-mts-text-secondary">
      <span class="font-medium text-mts-text">Десятичные градусы (как в данных и Mapbox):</span>
      {{ decimalPreview.la.toFixed(6) }}°,
      {{ decimalPreview.lo.toFixed(6) }}°
    </p>
  </div>
</template>
