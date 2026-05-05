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
    /**
     * Стиль поля.
     * - `default` — карточка с обводкой, белым фоном и иконкой календаря (как раньше).
     * - `underline` — только нижний бордер, прозрачный фон, без иконки и без тени;
     *   для форм, где остальные поля стилизованы через `.form-input`.
     */
    variant?: 'default' | 'underline'
  }>(),
  { inputClass: '', variant: 'default' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t, locale } = useI18n()

const uid = useId()
const inputId = computed(() => props.id ?? `mts-date-${uid}`)

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
/**
 * Режим всплывающего календаря.
 * `days`   — стандартная сетка 7×6.
 * `months` — выбор месяца внутри `viewDate.getFullYear()`.
 * `years`  — выбор года из «декады» вокруг `viewDate.getFullYear()`.
 */
const viewMode = ref<'days' | 'months' | 'years'>('days')
/** Первое число просматриваемого месяца (локальное время) */
const viewDate = ref(new Date())
/** Сколько лет показываем в режиме `years` (4×3). */
const YEARS_PER_PAGE = 12

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

const intlLocaleLong = computed(() => (locale.value === 'ru' ? 'ru-RU' : 'en-US'))

const monthTitle = computed(() => {
  return new Intl.DateTimeFormat(intlLocaleLong.value, { month: 'long', year: 'numeric' }).format(
    viewDate.value,
  )
})

const yearTitle = computed(() => String(viewDate.value.getFullYear()))

/** Стартовый год блока «декады»: округляем вниз до кратного `YEARS_PER_PAGE`. */
const yearsRangeStart = computed(() => {
  const y = viewDate.value.getFullYear()
  return y - (y % YEARS_PER_PAGE)
})

const yearsTitle = computed(() => {
  const start = yearsRangeStart.value
  return `${start} – ${start + YEARS_PER_PAGE - 1}`
})

const headerTitle = computed(() => {
  if (viewMode.value === 'days') {
    return monthTitle.value
  }
  if (viewMode.value === 'months') {
    return yearTitle.value
  }
  return yearsTitle.value
})

const headerTitleLabel = computed(() => {
  if (viewMode.value === 'days') {
    return t('pages.common.datePickerSelectMonth')
  }
  if (viewMode.value === 'months') {
    return t('pages.common.datePickerSelectYear')
  }
  return t('pages.common.datePickerBackToDays')
})

const prevButtonLabel = computed(() => {
  if (viewMode.value === 'days') {
    return t('pages.common.datePickerPrevMonth')
  }
  if (viewMode.value === 'months') {
    return t('pages.common.datePickerPrevYear')
  }
  return t('pages.common.datePickerPrevDecade')
})

const nextButtonLabel = computed(() => {
  if (viewMode.value === 'days') {
    return t('pages.common.datePickerNextMonth')
  }
  if (viewMode.value === 'months') {
    return t('pages.common.datePickerNextYear')
  }
  return t('pages.common.datePickerNextDecade')
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

type MonthCell = { idx: number; label: string; isCurrent: boolean; isSelected: boolean }

const monthCells = computed((): MonthCell[] => {
  const fmt = new Intl.DateTimeFormat(intlLocaleLong.value, { month: 'short' })
  const today = new Date()
  const viewYear = viewDate.value.getFullYear()
  const v = props.modelValue?.trim() ?? ''
  let selectedYear: number | null = null
  let selectedMonth: number | null = null
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [yStr, mStr] = v.split('-')
    selectedYear = Number(yStr)
    selectedMonth = Number(mStr) - 1
  }
  return Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(viewYear, idx, 1)
    return {
      idx,
      label: fmt.format(d),
      isCurrent: viewYear === today.getFullYear() && idx === today.getMonth(),
      isSelected: selectedYear === viewYear && selectedMonth === idx,
    }
  })
})

type YearCell = { year: number; isCurrent: boolean; isSelected: boolean; outOfRange: boolean }

const yearCells = computed((): YearCell[] => {
  const start = yearsRangeStart.value
  const today = new Date()
  const v = props.modelValue?.trim() ?? ''
  let selectedYear: number | null = null
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    selectedYear = Number(v.slice(0, 4))
  }
  const cells: YearCell[] = []
  for (let i = 0; i < YEARS_PER_PAGE; i++) {
    const year = start + i
    cells.push({
      year,
      isCurrent: year === today.getFullYear(),
      isSelected: selectedYear === year,
      outOfRange: false,
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
    viewMode.value = 'days'
    syncViewFromModel()
  }
}

function shiftView(delta: -1 | 1) {
  const d = new Date(viewDate.value)
  if (viewMode.value === 'days') {
    d.setMonth(d.getMonth() + delta)
  } else if (viewMode.value === 'months') {
    d.setFullYear(d.getFullYear() + delta)
  } else {
    d.setFullYear(d.getFullYear() + delta * YEARS_PER_PAGE)
  }
  viewDate.value = d
}

function prevPage() {
  shiftView(-1)
}

function nextPage() {
  shiftView(1)
}

/** Заголовок над сеткой: переключает уровень увеличения. */
function cycleViewMode() {
  if (viewMode.value === 'days') {
    viewMode.value = 'months'
  } else if (viewMode.value === 'months') {
    viewMode.value = 'years'
  } else {
    viewMode.value = 'days'
  }
}

function pickMonthCell(cell: MonthCell) {
  const d = new Date(viewDate.value.getFullYear(), cell.idx, 1)
  viewDate.value = d
  viewMode.value = 'days'
}

function pickYearCell(cell: YearCell) {
  const d = new Date(cell.year, viewDate.value.getMonth(), 1)
  viewDate.value = d
  viewMode.value = 'months'
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

const underlineInputClass =
  'block w-full cursor-pointer border-0 border-b border-[#cccccc] bg-transparent px-0 py-3 font-body text-sm text-body transition-colors placeholder:text-muted focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'

const baseInputClass = computed(() =>
  props.variant === 'underline' ? underlineInputClass : defaultInputClass,
)

const showCalendarIcon = computed(() => props.variant !== 'underline')
</script>

<template>
  <div ref="rootRef" class="relative max-w-full">
    <div
      v-if="showCalendarIcon"
      class="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center ps-3"
      aria-hidden="true"
    >
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
      :class="[baseInputClass, inputClass]"
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
        class="absolute left-0 top-full z-50 mt-1 min-w-[280px] rounded-lg border border-border bg-mts-surface p-3 shadow-tech-lg"
        role="dialog"
        aria-label="Calendar"
        @click.stop
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            class="rounded border border-transparent p-1.5 text-mts-frost/60 hover:border-mts-border hover:bg-mts-navy/50 hover:text-mts-frost"
            :aria-label="prevButtonLabel"
            @click="prevPage"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            class="min-w-0 flex-1 rounded px-2 py-1 text-center font-body text-sm font-medium text-mts-frost hover:bg-mts-navy/40"
            :aria-label="headerTitleLabel"
            :title="headerTitleLabel"
            @click="cycleViewMode"
          >
            {{ headerTitle }}
          </button>
          <button
            type="button"
            class="rounded border border-transparent p-1.5 text-mts-frost/60 hover:border-mts-border hover:bg-mts-navy/50 hover:text-mts-frost"
            :aria-label="nextButtonLabel"
            @click="nextPage"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <template v-if="viewMode === 'days'">
          <div class="mb-1 grid grid-cols-7 gap-0.5 text-center font-mono text-[10px] uppercase tracking-wide text-mts-frost/50">
            <span v-for="(w, i) in weekdayLabels" :key="i" class="py-1">{{ w }}</span>
          </div>

          <div class="grid grid-cols-7 gap-0.5">
            <button
              v-for="(cell, idx) in calendarCells"
              :key="idx"
              type="button"
              class="flex h-9 items-center justify-center rounded-md font-body text-sm transition-colors"
              :class="[
                !cell.inMonth ? 'text-mts-frost/35' : 'text-mts-frost',
                cell.isSelected ? 'bg-primary font-medium text-white hover:bg-primary-dark' : '',
                !cell.isSelected && cell.isToday ? 'ring-1 ring-mts-accent/50' : '',
                !cell.isSelected && !cell.isToday ? 'hover:bg-mts-navy/45' : '',
              ]"
              @click="pickDay(cell)"
            >
              {{ cell.label }}
            </button>
          </div>
        </template>

        <div v-else-if="viewMode === 'months'" class="grid grid-cols-3 gap-1">
          <button
            v-for="cell in monthCells"
            :key="cell.idx"
            type="button"
            class="flex h-12 items-center justify-center rounded-md font-body text-sm capitalize transition-colors"
            :class="[
              cell.isSelected ? 'bg-primary font-medium text-white hover:bg-primary-dark' : 'text-mts-frost',
              !cell.isSelected && cell.isCurrent ? 'ring-1 ring-mts-accent/50' : '',
              !cell.isSelected ? 'hover:bg-mts-navy/45' : '',
            ]"
            @click="pickMonthCell(cell)"
          >
            {{ cell.label }}
          </button>
        </div>

        <div v-else class="grid grid-cols-3 gap-1">
          <button
            v-for="cell in yearCells"
            :key="cell.year"
            type="button"
            class="flex h-12 items-center justify-center rounded-md font-body text-sm transition-colors"
            :class="[
              cell.isSelected ? 'bg-primary font-medium text-white hover:bg-primary-dark' : 'text-mts-frost',
              !cell.isSelected && cell.isCurrent ? 'ring-1 ring-mts-accent/50' : '',
              !cell.isSelected ? 'hover:bg-mts-navy/45' : '',
            ]"
            @click="pickYearCell(cell)"
          >
            {{ cell.year }}
          </button>
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-mts-border pt-2">
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
