<script setup lang="ts">
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
    disabled?: boolean
    /** `default` — узкая колонка как в форме вакансий; `full` — на всю ширину ячейки (услуги). */
    variant?: 'default' | 'full'
    decrementLabel?: string
    incrementLabel?: string
  }>(),
  {
    min: 0,
    max: undefined,
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

function onInput(e: Event) {
  if (props.disabled) {
    return
  }
  const raw = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  displayText.value = digits
  if (digits === '') {
    model.value = props.min
    return
  }
  const n = Number.parseInt(digits, 10)
  model.value = clamp(Number.isNaN(n) ? props.min : n)
}

function onBlur() {
  displayText.value = String(model.value)
}

function decrement() {
  if (props.disabled) {
    return
  }
  model.value = clamp(model.value - 1)
}

function increment() {
  if (props.disabled) {
    return
  }
  model.value = clamp(model.value + 1)
}
</script>

<template>
  <div class="space-y-2">
    <div :class="wrapperClass">
      <button
        type="button"
        :disabled="disabled || model <= min"
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
        inputmode="numeric"
        autocomplete="off"
        :disabled="disabled"
        :aria-describedby="hint ? hintId : undefined"
        class="min-h-0 min-w-0 flex-1 self-stretch border-0 bg-mts-bg py-2.5 text-center font-body text-sm tabular-nums text-mts-text outline-none ring-0 placeholder:text-mts-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mts-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
        @input="onInput"
        @blur="onBlur"
      />
      <button
        type="button"
        :disabled="disabled || (max !== undefined && model >= max)"
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
