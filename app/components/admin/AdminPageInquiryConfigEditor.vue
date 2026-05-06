<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import type { PageInquiryFormConfig } from '~/types'
import { parseBilingual, serializeBilingual } from '~/utils/bilingualField'
import {
  DEFAULT_PAGE_INQUIRY_REQUIRED_SERVICES,
  DEFAULT_PAGE_INQUIRY_VESSEL_TYPES,
  normalizePageInquiryFormConfig,
} from '~/utils/pageInquiryFormOptions'

const model = defineModel<PageInquiryFormConfig | undefined>({ required: true })

const RU_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => RU_MAP[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

const BUILT_IN_VESSEL_TYPE_LABELS: Record<string, string> = {
  dry_cargo: 'Сухогруз',
  tanker: 'Танкер',
  container: 'Контейнеровоз',
  tug: 'Буксир',
  service: 'Сервисное судно',
  other: 'Другое',
}

const BUILT_IN_REQUIRED_SERVICE_LABELS: Record<string, string> = {
  technical: 'Технический менеджмент',
  crewing: 'Крюинг',
  audit: 'Аудит / инспекции',
  commercial: 'Коммерческий менеджмент',
  insurance: 'Страхование',
  other: 'Другое',
}

const normalized = computed(() => normalizePageInquiryFormConfig(model.value))
const vesselTypeAvailableOptions = computed(() => normalized.value.vesselTypes ?? [])
const requiredServiceAvailableOptions = computed(() => normalized.value.requiredServices ?? [])

const newVesselLabel = ref('')
const newServiceLabel = ref('')
const addVesselError = ref('')
const addServiceError = ref('')

function getCurrent() {
  return normalizePageInquiryFormConfig(model.value)
}

function toggleItem(key: 'vesselTypes' | 'requiredServices', id: string, checked: boolean) {
  const cur = getCurrent()
  const source = key === 'vesselTypes' ? cur.vesselTypes ?? [] : cur.requiredServices ?? []
  const next = checked ? [...new Set([...source, id])] : source.filter((row) => row !== id)
  model.value = { ...cur, [key]: next }
}

function removeCustomItem(key: 'vesselTypes' | 'requiredServices', id: string) {
  const cur = getCurrent()
  const listKey = key
  const mapKey = key === 'vesselTypes' ? 'vesselTypeLabels' : 'requiredServiceLabels'
  const source = listKey === 'vesselTypes' ? cur.vesselTypes ?? [] : cur.requiredServices ?? []
  const labelMap = { ...(mapKey === 'vesselTypes' ? (cur.vesselTypeLabels ?? {}) : (cur.requiredServiceLabels ?? {})) }
  delete labelMap[id]
  model.value = { ...cur, [listKey]: source.filter((row) => row !== id), [mapKey]: labelMap }
}

function addCustomItem(key: 'vesselTypes' | 'requiredServices', labelInput: string): boolean {
  const label = labelInput.trim()
  if (!label) {
    if (key === 'vesselTypes') addVesselError.value = 'Введите название чекбокса.'
    else addServiceError.value = 'Введите название чекбокса.'
    return false
  }

  const base = transliterate(label) || 'option'
  const id = `${base}_${Date.now()}`

  const cur = getCurrent()
  const listKey = key
  const mapKey = key === 'vesselTypes' ? 'vesselTypeLabels' : 'requiredServiceLabels'
  const source = listKey === 'vesselTypes' ? cur.vesselTypes ?? [] : cur.requiredServices ?? []
  const currentLabels = mapKey === 'vesselTypeLabels' ? (cur.vesselTypeLabels ?? {}) : (cur.requiredServiceLabels ?? {})

  model.value = {
    ...cur,
    [listKey]: [...source, id],
    [mapKey]: { ...currentLabels, [id]: label },
  }
  return true
}

function addVesselOption() {
  addVesselError.value = ''
  if (addCustomItem('vesselTypes', newVesselLabel.value)) {
    newVesselLabel.value = ''
  }
}

function addServiceOption() {
  addServiceError.value = ''
  if (addCustomItem('requiredServices', newServiceLabel.value)) {
    newServiceLabel.value = ''
  }
}

function isDefaultVessel(id: string): boolean {
  return (DEFAULT_PAGE_INQUIRY_VESSEL_TYPES as readonly string[]).includes(id)
}
function isDefaultService(id: string): boolean {
  return (DEFAULT_PAGE_INQUIRY_REQUIRED_SERVICES as readonly string[]).includes(id)
}

function vesselLabelPair(id: string): { ru: string; en: string } {
  const custom = normalized.value.vesselTypeLabels?.[id]
  if (custom) {
    return parseBilingual(custom)
  }
  const def = BUILT_IN_VESSEL_TYPE_LABELS[id]
  return parseBilingual(def ?? id)
}

function serviceLabelPair(id: string): { ru: string; en: string } {
  const custom = normalized.value.requiredServiceLabels?.[id]
  if (custom) {
    return parseBilingual(custom)
  }
  const def = BUILT_IN_REQUIRED_SERVICE_LABELS[id]
  return parseBilingual(def ?? id)
}

function updateVesselLabels(id: string, ru: string, en: string) {
  const cur = getCurrent()
  model.value = {
    ...cur,
    vesselTypeLabels: {
      ...(cur.vesselTypeLabels ?? {}),
      [id]: serializeBilingual(ru, en),
    },
  }
}

function updateServiceLabels(id: string, ru: string, en: string) {
  const cur = getCurrent()
  model.value = {
    ...cur,
    requiredServiceLabels: {
      ...(cur.requiredServiceLabels ?? {}),
      [id]: serializeBilingual(ru, en),
    },
  }
}

function resetDefaults() {
  model.value = normalizePageInquiryFormConfig(undefined)
}
</script>

<template>
  <div class="space-y-5 border-t border-mts-border pt-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
        Поля формы заявки для этой страницы
      </p>
      <button
        type="button"
        class="font-mono text-[11px] uppercase text-mts-accent hover:underline"
        @click="resetDefaults"
      >
        Сбросить к умолчанию
      </button>
    </div>

    <!-- Тип судна -->
    <div class="space-y-3">
      <p class="font-body text-sm font-semibold text-mts-text">Тип судна (чекбоксы)</p>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="id in vesselTypeAvailableOptions"
          :key="id"
          class="rounded border border-mts-border bg-mts-bg/40 p-3"
        >
          <label class="flex cursor-pointer items-start gap-2 font-body text-sm text-mts-text">
            <input
              type="checkbox"
              class="mts-checkbox mt-0.5"
              :checked="(normalized.vesselTypes ?? []).includes(id)"
              @change="(e) => toggleItem('vesselTypes', id, (e.target as HTMLInputElement).checked)"
            />
            <span class="flex-1 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{ id }}</span>
            <button
              v-if="!isDefaultVessel(id)"
              type="button"
              class="shrink-0 p-0.5 text-mts-text-secondary hover:text-red-500"
              title="Удалить"
              @click.prevent="removeCustomItem('vesselTypes', id)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </label>
          <div class="mt-3 grid gap-2">
            <div>
              <label class="mb-1 block font-mono text-[10px] uppercase text-mts-text-secondary">Подпись RU</label>
              <input
                type="text"
                class="w-full border border-mts-border bg-white px-2 py-1.5 font-body text-sm text-mts-text outline-none focus:border-mts-accent"
                :value="vesselLabelPair(id).ru"
                @input="
                  updateVesselLabels(
                    id,
                    ($event.target as HTMLInputElement).value,
                    vesselLabelPair(id).en,
                  )
                "
              />
            </div>
            <div>
              <label class="mb-1 block font-mono text-[10px] uppercase text-mts-text-secondary">Подпись EN</label>
              <input
                type="text"
                class="w-full border border-mts-border bg-white px-2 py-1.5 font-body text-sm text-mts-text outline-none focus:border-mts-accent"
                :value="vesselLabelPair(id).en"
                @input="
                  updateVesselLabels(
                    id,
                    vesselLabelPair(id).ru,
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newVesselLabel"
          type="text"
          class="min-w-0 flex-1 border border-mts-border bg-white px-3 py-2 font-body text-sm text-mts-text outline-none focus:border-mts-accent"
          placeholder="Название нового варианта (RU)"
          @keydown.enter.prevent="addVesselOption"
        />
        <button type="button" class="btn-secondary shrink-0 inline-flex items-center gap-1.5" @click="addVesselOption">
          <Plus class="h-4 w-4" /> Добавить
        </button>
      </div>
      <p v-if="addVesselError" class="font-body text-xs text-red-600">{{ addVesselError }}</p>
    </div>

    <!-- Требуемые услуги -->
    <div class="space-y-3">
      <p class="font-body text-sm font-semibold text-mts-text">Требуемые услуги (чекбоксы)</p>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="id in requiredServiceAvailableOptions"
          :key="id"
          class="rounded border border-mts-border bg-mts-bg/40 p-3"
        >
          <label class="flex cursor-pointer items-start gap-2 font-body text-sm text-mts-text">
            <input
              type="checkbox"
              class="mts-checkbox mt-0.5"
              :checked="(normalized.requiredServices ?? []).includes(id)"
              @change="(e) => toggleItem('requiredServices', id, (e.target as HTMLInputElement).checked)"
            />
            <span class="flex-1 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{ id }}</span>
            <button
              v-if="!isDefaultService(id)"
              type="button"
              class="shrink-0 p-0.5 text-mts-text-secondary hover:text-red-500"
              title="Удалить"
              @click.prevent="removeCustomItem('requiredServices', id)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </label>
          <div class="mt-3 grid gap-2">
            <div>
              <label class="mb-1 block font-mono text-[10px] uppercase text-mts-text-secondary">Подпись RU</label>
              <input
                type="text"
                class="w-full border border-mts-border bg-white px-2 py-1.5 font-body text-sm text-mts-text outline-none focus:border-mts-accent"
                :value="serviceLabelPair(id).ru"
                @input="
                  updateServiceLabels(
                    id,
                    ($event.target as HTMLInputElement).value,
                    serviceLabelPair(id).en,
                  )
                "
              />
            </div>
            <div>
              <label class="mb-1 block font-mono text-[10px] uppercase text-mts-text-secondary">Подпись EN</label>
              <input
                type="text"
                class="w-full border border-mts-border bg-white px-2 py-1.5 font-body text-sm text-mts-text outline-none focus:border-mts-accent"
                :value="serviceLabelPair(id).en"
                @input="
                  updateServiceLabels(
                    id,
                    serviceLabelPair(id).ru,
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newServiceLabel"
          type="text"
          class="min-w-0 flex-1 border border-mts-border bg-white px-3 py-2 font-body text-sm text-mts-text outline-none focus:border-mts-accent"
          placeholder="Название нового варианта (RU)"
          @keydown.enter.prevent="addServiceOption"
        />
        <button type="button" class="btn-secondary shrink-0 inline-flex items-center gap-1.5" @click="addServiceOption">
          <Plus class="h-4 w-4" /> Добавить
        </button>
      </div>
      <p v-if="addServiceError" class="font-body text-xs text-red-600">{{ addServiceError }}</p>
    </div>
  </div>
</template>
