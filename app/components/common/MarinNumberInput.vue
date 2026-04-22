<script setup lang="ts">
/**
 * Стилизованный number-input для публичной формы (дизайн Tailwind v4).
 *
 * В отличие от `AdminInputNumberStepper` (тот живёт в админ-скоупе и
 * рассчитан на форму редактирования: компактный, белый, c рамкой), этот
 * вариант делает «подчёркнутую линию», как все остальные поля формы
 * «Оставьте заявку» — input без рамки + нижняя граница, плюс две
 * аккуратные кнопки `−` / `+` справа.
 *
 * Нативные browser-spinner-ы прячем (через классы ниже), управление
 * только через кнопки и клавиатуру (стрелки работают штатно у
 * `<input type="number">`).
 *
 * `step` поддерживается дробный — для координат и пр. (на текущей
 * форме используется только целочисленный «количество судов», но API
 * сразу делаем универсальным, чтобы не плодить ещё один компонент).
 */
import { Minus, Plus } from 'lucide-vue-next'
import { computed, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    required?: boolean
    placeholder?: string
    /** Подпись для ассистивных технологий, если визуальный label вынесен наружу. */
    ariaLabel?: string
    decrementLabel?: string
    incrementLabel?: string
  }>(),
  {
    min: 0,
    step: 1,
    disabled: false,
    required: false,
    decrementLabel: 'Уменьшить значение',
    incrementLabel: 'Увеличить значение',
  },
)

/**
 * `null` — поле очищено пользователем (важно для опциональных полей и
 * для подсказок-плейсхолдеров; эквивалент пустой строки нативного
 * `<input type="number">`).
 */
const model = defineModel<number | null>({ required: true })

const uid = useId()
const inputId = computed(() => props.id ?? `marin-num-${uid}`)

const stepPrecision = computed(() => {
  const s = String(props.step)
  const dot = s.indexOf('.')
  return dot >= 0 ? s.length - dot - 1 : 0
})

const allowDecimal = computed(() => stepPrecision.value > 0)
const allowNegative = computed(() => props.min < 0)
const isFloatMode = computed(() => allowDecimal.value || allowNegative.value)
const inputMode = computed<'numeric' | 'decimal'>(() =>
  isFloatMode.value ? 'decimal' : 'numeric',
)

const displayText = ref(model.value === null ? '' : String(model.value))
watch(
  model,
  (v) => {
    displayText.value = v === null ? '' : String(v)
  },
  { immediate: true },
)

function clamp(n: number): number {
  let next = n
  if (props.min !== undefined && next < props.min) {
    next = props.min
  }
  if (props.max !== undefined && next > props.max) {
    next = props.max
  }
  return next
}

function roundToStep(n: number): number {
  if (stepPrecision.value === 0) {
    return Math.round(n)
  }
  const factor = 10 ** stepPrecision.value
  return Math.round(n * factor) / factor
}

function sanitize(raw: string): string {
  let out = raw
  // Допустимые символы зависят от режима.
  const re = isFloatMode.value
    ? allowNegative.value
      ? /[^0-9.\-]/g
      : /[^0-9.]/g
    : /[^0-9]/g
  out = out.replace(re, '')
  if (allowNegative.value) {
    // Минус только в начале и единственный.
    const minusFirst = out.startsWith('-')
    out = out.replace(/-/g, '')
    if (minusFirst) {
      out = '-' + out
    }
  }
  if (allowDecimal.value) {
    // Только одна точка.
    const firstDot = out.indexOf('.')
    if (firstDot >= 0) {
      out = out.slice(0, firstDot + 1) + out.slice(firstDot + 1).replace(/\./g, '')
    }
  }
  return out
}

function onInput(e: Event) {
  if (props.disabled) {
    return
  }
  const cleaned = sanitize((e.target as HTMLInputElement).value)
  displayText.value = cleaned

  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
    model.value = null
    return
  }
  const n = isFloatMode.value ? Number.parseFloat(cleaned) : Number.parseInt(cleaned, 10)
  if (Number.isNaN(n)) {
    return
  }
  model.value = n
}

function onBlur() {
  if (displayText.value === '') {
    model.value = null
    return
  }
  const n = isFloatMode.value
    ? Number.parseFloat(displayText.value)
    : Number.parseInt(displayText.value, 10)
  const next = Number.isNaN(n) ? null : clamp(n)
  model.value = next
  displayText.value = next === null ? '' : String(next)
}

function decrement() {
  if (props.disabled) {
    return
  }
  const base = model.value ?? props.min
  model.value = clamp(roundToStep(base - props.step))
}

function increment() {
  if (props.disabled) {
    return
  }
  const base = model.value ?? props.min
  model.value = clamp(roundToStep(base + props.step))
}

const decrementDisabled = computed(
  () => props.disabled || (model.value !== null && model.value <= props.min),
)
const incrementDisabled = computed(
  () =>
    props.disabled ||
    (props.max !== undefined && model.value !== null && model.value >= props.max),
)
</script>

<template>
  <div class="group relative mt-1.5 flex items-end gap-2">
    <input
      :id="inputId"
      v-model="displayText"
      type="text"
      :inputmode="inputMode"
      :disabled="disabled"
      :required="required"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      class="marin-number-input block w-full min-w-0 border-0 border-b border-mts-border bg-transparent px-0 py-2 pr-2 font-body text-sm text-mts-text placeholder:text-mts-text-muted focus:border-mts-accent focus:outline-none focus:ring-0"
      @input="onInput"
      @blur="onBlur"
    />
    <div class="flex shrink-0 items-center gap-1 pb-1">
      <button
        type="button"
        :disabled="decrementDisabled"
        :aria-label="decrementLabel"
        class="flex h-8 w-8 items-center justify-center border border-mts-border text-mts-text-secondary transition-colors duration-150 hover:border-mts-accent hover:text-mts-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mts-bg disabled:cursor-not-allowed disabled:border-mts-border/50 disabled:text-mts-text-muted disabled:hover:border-mts-border/50 disabled:hover:text-mts-text-muted"
        @click="decrement"
      >
        <Minus class="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        :disabled="incrementDisabled"
        :aria-label="incrementLabel"
        class="flex h-8 w-8 items-center justify-center border border-mts-border text-mts-text-secondary transition-colors duration-150 hover:border-mts-accent hover:text-mts-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mts-bg disabled:cursor-not-allowed disabled:border-mts-border/50 disabled:text-mts-text-muted disabled:hover:border-mts-border/50 disabled:hover:text-mts-text-muted"
        @click="increment"
      >
        <Plus class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/**
 * Скрываем нативные spinner-кнопки браузера — у нас своя пара кнопок
 * `−` / `+`, нативные «стрелочки» в углу выглядят чужеродно. Атрибут
 * `inputmode` всё равно подскажет мобильным клавиатурам цифровую раскладку.
 */
.marin-number-input::-webkit-outer-spin-button,
.marin-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.marin-number-input {
  -moz-appearance: textfield;
}
</style>
