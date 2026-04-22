<script setup lang="ts">
/**
 * Числовое поле со степпером для админки.
 *
 * Поддерживает два режима, выбирается автоматически по props:
 *   • Целочисленный (по умолчанию). step = 1, min ≥ 0 → разрешены только
 *     цифры, ввод проверяется через parseInt-эквивалент. Используется для
 *     полей `sortOrder`, `id` и т.п.
 *   • Дробный / знаковый. step < 1 ИЛИ min < 0 → разрешены минус, точка
 *     и цифры. Используется, например, для географических координат
 *     (lng / lat), где значение должно сохраняться **без округления**,
 *     чтобы 1-в-1 совпадать с тем, что получает Mapbox GL JS
 *     (`Marker.setLngLat([lng, lat])`).
 *
 * Гарантии для дробного режима:
 *   • `model.value` всегда хранит «чистое» число JS (parseFloat),
 *     которое попадает в Mapbox без преобразований.
 *   • Кнопки −/+ изменяют значение строго на `step`, результат
 *     округляется до точности самого `step` (избавляемся от
 *     плавающей-точки артефактов вида `1.0000000000000002`).
 *   • При ручном вводе значение НЕ округляется (то, что ввёл
 *     пользователь, и есть то, что увидит карта).
 *   • Кламп по `min`/`max` срабатывает на blur, а не на каждом keystroke,
 *     чтобы можно было свободно набирать «-», «-1.», «-79.51678» и т.д.
 */
import { Minus, Plus } from 'lucide-vue-next'
import { computed, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Атрибут `id` у поля ввода (для связи с `<label for>`). */
    id?: string
    /** Текст подсказки под счётчиком; задаёт `aria-describedby`. */
    hint?: string
    min?: number
    max?: number
    /**
     * Шаг для кнопок −/+. По умолчанию `1` — целочисленный режим.
     * Для дробных значений (например, координат) задайте `0.0001`,
     * `0.01` и т.п. — точность вычисления автоматически выводится
     * из количества знаков после точки в самом `step`.
     */
    step?: number
    disabled?: boolean
    /** `default` — узкая колонка как в форме вакансий; `full` — на всю ширину ячейки (карточки сервисов). */
    variant?: 'default' | 'full'
    decrementLabel?: string
    incrementLabel?: string
  }>(),
  {
    min: 0,
    max: undefined,
    step: 1,
    disabled: false,
    variant: 'default',
    decrementLabel: 'Уменьшить значение',
    incrementLabel: 'Увеличить значение',
  },
)

const model = defineModel<number>({ required: true })

const uid = useId()
const inputId = computed(() => props.id ?? uid)
const hintId = computed(() => `${inputId.value}-hint`)

/** Сколько знаков после точки в `step` — нужно для округления операций −/+. */
const stepPrecision = computed(() => {
  if (Number.isInteger(props.step)) {
    return 0
  }
  const str = props.step.toString()
  const dot = str.indexOf('.')
  return dot === -1 ? 0 : str.length - dot - 1
})

/**
 * Дробный/знаковый режим: разрешаем точку и минус. Включается, когда
 * этого требуют пропсы (шаг < 1 или диапазон уходит в минус).
 */
const allowDecimal = computed(() => stepPrecision.value > 0)
const allowNegative = computed(() => props.min < 0)
const isFloatMode = computed(() => allowDecimal.value || allowNegative.value)

const inputMode = computed<'numeric' | 'decimal'>(() =>
  isFloatMode.value ? 'decimal' : 'numeric',
)

const displayText = ref(String(model.value))

watch(
  model,
  (v) => {
    displayText.value = String(v)
  },
  { immediate: true },
)

const wrapperClass = computed(() => {
  const base =
    'relative flex h-12 max-w-full items-stretch overflow-hidden rounded-sm border border-mts-border bg-mts-bg shadow-xs'
  if (props.variant === 'full') {
    return [base, 'w-full']
  }
  return [base, 'md:max-w-[12rem]']
})

function clamp(n: number): number {
  let x = Number.isNaN(n) ? props.min : n
  if (x < props.min) {
    x = props.min
  }
  if (props.max !== undefined && x > props.max) {
    x = props.max
  }
  return x
}

/**
 * Округляет результат до точности `step`. Это нужно только для кнопок
 * −/+: при ручном вводе пользователь видит ровно то, что напечатал,
 * чтобы координаты совпадали с Mapbox без потерь точности.
 */
function roundToStep(n: number): number {
  if (stepPrecision.value === 0) {
    return Math.round(n)
  }
  const f = 10 ** stepPrecision.value
  return Math.round(n * f) / f
}

/**
 * Чистит строку ввода, оставляя только символы, валидные для
 * текущего режима. Гарантирует не более одного `-` (и только в начале)
 * и не более одной точки.
 */
function sanitize(raw: string): string {
  let allowed: string
  if (allowDecimal.value && allowNegative.value) {
    allowed = raw.replace(/[^\d.\-]/g, '')
  } else if (allowDecimal.value) {
    allowed = raw.replace(/[^\d.]/g, '')
  } else if (allowNegative.value) {
    allowed = raw.replace(/[^\d\-]/g, '')
  } else {
    allowed = raw.replace(/\D/g, '')
  }

  if (allowNegative.value) {
    const hasLeadingMinus = allowed.startsWith('-')
    allowed = allowed.replace(/-/g, '')
    if (hasLeadingMinus) {
      allowed = `-${allowed}`
    }
  }

  if (allowDecimal.value) {
    const firstDot = allowed.indexOf('.')
    if (firstDot !== -1) {
      allowed = allowed.slice(0, firstDot + 1) + allowed.slice(firstDot + 1).replace(/\./g, '')
    }
  }

  return allowed
}

function onInput(e: Event) {
  if (props.disabled) {
    return
  }
  const cleaned = sanitize((e.target as HTMLInputElement).value)
  displayText.value = cleaned

  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
    return
  }

  const n = isFloatMode.value ? Number.parseFloat(cleaned) : Number.parseInt(cleaned, 10)
  if (Number.isNaN(n)) {
    return
  }
  /**
   * Намеренно НЕ кламп: пользователь может набрать `-` → `-1` → `-12`,
   * и временное значение `-1` (пока он печатает `-12`) не должно
   * подменяться на `min`. Кламп выполняется на blur.
   * Точное число попадает в модель → точное число попадает в Mapbox.
   */
  model.value = n
}

function onBlur() {
  const n = isFloatMode.value
    ? Number.parseFloat(displayText.value)
    : Number.parseInt(displayText.value, 10)
  const next = clamp(Number.isNaN(n) ? props.min : n)
  model.value = next
  displayText.value = String(next)
}

function decrement() {
  if (props.disabled) {
    return
  }
  model.value = clamp(roundToStep(model.value - props.step))
}

function increment() {
  if (props.disabled) {
    return
  }
  model.value = clamp(roundToStep(model.value + props.step))
}

const decrementDisabled = computed(() => props.disabled || model.value <= props.min)
const incrementDisabled = computed(
  () => props.disabled || (props.max !== undefined && model.value >= props.max),
)
</script>

<template>
  <div class="space-y-2">
    <div :class="wrapperClass">
      <button
        type="button"
        :disabled="decrementDisabled"
        :aria-label="decrementLabel"
        class="box-border flex h-full min-h-0 shrink-0 items-center justify-center border-r border-mts-border bg-white px-3 text-mts-text transition-colors hover:bg-mts-border-light hover:text-mts-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40"
        @click="decrement"
      >
        <Minus class="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        :id="inputId"
        :value="displayText"
        type="text"
        :inputmode="inputMode"
        autocomplete="off"
        :disabled="disabled"
        :aria-describedby="hint ? hintId : undefined"
        class="min-h-0 min-w-0 flex-1 self-stretch border-0 bg-mts-bg py-2.5 text-center font-body text-sm tabular-nums text-mts-text outline-none ring-0 placeholder:text-mts-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mts-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
        @input="onInput"
        @blur="onBlur"
      />
      <button
        type="button"
        :disabled="incrementDisabled"
        :aria-label="incrementLabel"
        class="box-border flex h-full min-h-0 shrink-0 items-center justify-center border-l border-mts-border bg-white px-3 text-mts-text transition-colors hover:bg-mts-border-light hover:text-mts-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40"
        @click="increment"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
    <p v-if="hint" :id="hintId" class="font-body text-xs text-mts-text-secondary">
      {{ hint }}
    </p>
  </div>
</template>
