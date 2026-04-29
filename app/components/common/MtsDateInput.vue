<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** YYYY-MM-DD или пусто */
    modelValue: string
    id?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    inputClass?: string
  }>(),
  { inputClass: '' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t, locale } = useI18n()

const uid = useId()
const inputId = computed(() => props.id ?? `mts-date-${uid}`)

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
/** Первое число просматриваемого месяца (локальное время) */
const viewDate = ref(new Date())

function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const displayValue = computed(() => {
  const v = props.modelValue?.trim()
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return ''
  }
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const loc = locale.value === 'ru' ? 'ru-RU' : 'en-GB'
  return new Intl.DateTimeFormat(loc, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
})

const monthTitle = computed(() => {
  const loc = locale.value === 'ru' ? 'ru-RU' : 'en-US'
  return new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(viewDate.value)
})

/** Пн–Вс: короткие подписи колонок */
const weekdayLabels = computed(() => {
  const loc = locale.value === 'ru' ? 'ru-RU' : 'en-GB'
  const fmt = new Intl.DateTimeFormat(loc, { weekday: 'short' })
  const labels: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(2024, 0, 1 + i)
    labels.push(fmt.format(d))
  }
  return labels
})

type DayCell = {
  label: number
  iso: string
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
}

const calendarCells = computed((): DayCell[] => {
  const view = viewDate.value
  const y = view.getFullYear()
  const month = view.getMonth()
  const first = new Date(y, month, 1)
  const startPad = (first.getDay() + 6) % 7
  const gridStart = new Date(y, month, 1 - startPad)
  const todayIso = toYmd(new Date())
  const selected = props.modelValue?.trim() ?? ''
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const iso = toYmd(d)
    cells.push({
      label: d.getDate(),
      iso,
      inMonth: d.getMonth() === month,
      isToday: iso === todayIso,
      isSelected: iso === selected,
    })
  }
  return cells
})

function syncViewFromModel() {
  const v = props.modelValue?.trim()
  if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    if (!Number.isNaN(dt.getTime())) {
      viewDate.value = dt
      return
    }
  }
  viewDate.value = new Date()
}

function toggle() {
  if (props.disabled) {
    return
  }
  open.value = !open.value
  if (open.value) {
    syncViewFromModel()
  }
}

function prevMonth() {
  const d = new Date(viewDate.value)
  d.setMonth(d.getMonth() - 1)
  viewDate.value = d
}

function nextMonth() {
  const d = new Date(viewDate.value)
  d.setMonth(d.getMonth() + 1)
  viewDate.value = d
}

function pickDay(cell: DayCell) {
  emit('update:modelValue', cell.iso)
  open.value = false
}

function pickToday() {
  emit('update:modelValue', toYmd(new Date()))
  open.value = false
}

function clearDate() {
  emit('update:modelValue', '')
  open.value = false
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value || !rootRef.value) {
    return
  }
  if (!rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    open.value = false
  }
}

watch(open, (isOpen) => {
  if (typeof document === 'undefined') {
    return
  }
  if (isOpen) {
    document.addEventListener('pointerdown', onDocPointerDown)
    window.addEventListener('keydown', onEscape)
  } else {
    document.removeEventListener('pointerdown', onDocPointerDown)
    window.removeEventListener('keydown', onEscape)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocPointerDown)
    window.removeEventListener('keydown', onEscape)
  }
})

watch(
  () => props.modelValue,
  () => {
    if (!open.value) {
      syncViewFromModel()
    }
  },
)

const defaultInputClass =
  'block w-full cursor-pointer border border-border bg-white py-2.5 ps-10 pe-3 font-body text-sm text-body shadow-tech placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-mts-accent/30 disabled:cursor-not-allowed disabled:opacity-60'
</script>

<template>
  <div ref="rootRef" class="relative max-w-full">
    <div class="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center ps-3" aria-hidden="true">
      <svg class="h-4 w-4 text-muted" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
        />
      </svg>
    </div>
    <input
      :id="inputId"
      type="text"
      readonly
      :class="[defaultInputClass, inputClass]"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      autocomplete="off"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="toggle"
    />

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute left-0 top-full z-50 mt-1 min-w-[280px] rounded-lg border border-border bg-bg-light p-3 shadow-tech-lg"
        role="dialog"
        aria-label="Calendar"
        @click.stop
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            class="rounded border border-transparent p-1.5 text-muted hover:border-border hover:bg-white hover:text-body"
            :aria-label="t('pages.common.datePickerPrevMonth')"
            @click="prevMonth"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="min-w-0 flex-1 text-center font-body text-sm font-medium text-body">{{ monthTitle }}</span>
          <button
            type="button"
            class="rounded border border-transparent p-1.5 text-muted hover:border-border hover:bg-white hover:text-body"
            :aria-label="t('pages.common.datePickerNextMonth')"
            @click="nextMonth"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div class="mb-1 grid grid-cols-7 gap-0.5 text-center font-mono text-[10px] uppercase tracking-wide text-muted">
          <span v-for="(w, i) in weekdayLabels" :key="i" class="py-1">{{ w }}</span>
        </div>

        <div class="grid grid-cols-7 gap-0.5">
          <button
            v-for="(cell, idx) in calendarCells"
            :key="idx"
            type="button"
            class="flex h-9 items-center justify-center rounded-md font-body text-sm transition-colors"
            :class="[
              !cell.inMonth ? 'text-muted' : 'text-body',
              cell.isSelected ? 'bg-primary font-medium text-white hover:bg-primary-dark' : '',
              !cell.isSelected && cell.isToday ? 'ring-1 ring-mts-accent/50' : '',
              !cell.isSelected && !cell.isToday ? 'hover:bg-white' : '',
            ]"
            @click="pickDay(cell)"
          >
            {{ cell.label }}
          </button>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-border pt-2">
          <button type="button" class="font-mono text-[11px] uppercase tracking-wide text-primary hover:text-primary-dark" @click="clearDate">
            {{ t('pages.common.datePickerClear') }}
          </button>
          <button type="button" class="font-mono text-[11px] uppercase tracking-wide text-primary hover:text-primary-dark" @click="pickToday">
            {{ t('pages.common.datePickerToday') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
