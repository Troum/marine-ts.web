<script setup lang="ts">
/**
 * Поле суммы под стиль анкеты (underline). Отображение: группировка ru-RU, десятичная запятая.
 * v-model — сумма без пробелов, точка как разделитель дробной части (напр. 1234.56).
 * v-model:currency-code — RUB | USD | EUR (по умолчанию RUB).
 */
import AdminSelect from '~/components/admin/AdminSelect.vue'
import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'

type SalaryCurrencyCode = 'RUB' | 'USD' | 'EUR'

function normalizeCurrency(c: string | undefined): SalaryCurrencyCode {
  const x = String(c ?? 'RUB').toUpperCase()
  return x === 'USD' || x === 'EUR' ? x : 'RUB'
}

type CurrencyChoice = SalaryCurrencyCode

const props = withDefaults(
  defineProps<{
    modelValue: string
    currencyCode?: string
    placeholder?: string
    id?: string
    inputClass?: string
  }>(),
  { currencyCode: 'RUB' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:currencyCode': [value: string]
}>()

function onCurrencyPick(code: string) {
  emit('update:currencyCode', normalizeCurrency(code))
}

const currencySymbols = { RUB: '₽', USD: '$', EUR: '€' } as const satisfies Record<CurrencyChoice, string>

/** Только текстовая метка: иначе AdminSelect показывает и icon, и label — дубль символа. */
const currencyOptions = computed<AdminSelectOption[]>(() =>
  (['RUB', 'USD', 'EUR'] as CurrencyChoice[]).map((code) => ({
    value: code,
    label: currencySymbols[code],
  })),
)

/** Нормализуем сырое содержимое поля до одной точки и двух знаков после. */
function normalizeDecimals(raw: string): string {
  let n = raw.replace(/,/g, '.').replace(/\s/g, '').replace(/[^\d.]/g, '')
  const parts = n.split('.')
  if (parts.length > 2) {
    n = `${parts[0]}.${parts.slice(1).join('')}`
  }
  const p2 = n.split('.')
  if (p2[1] !== undefined && p2[1].length > 2) {
    n = `${p2[0]}.${p2[1].slice(0, 2)}`
  }
  return n
}

/** Канон из хранилища родителя. */
function storedToNormalized(stored: string): string {
  return normalizeDecimals(stored.replace(/\s/g, '').replace(',', '.'))
}

/** Форматирование канона под ru-RU (пробелы тысяч, запятая для дроби). */
function formatRu(normalized: string): string {
  if (normalized === '' || normalized === '.') {
    return normalized === '.' ? ',' : ''
  }
  const [rawInt, decPart] = normalized.split('.')
  let intPart = rawInt ?? ''
  if (intPart === '' && decPart !== undefined) {
    intPart = '0'
  }
  let formattedInt = ''
  if (intPart !== '') {
    const num = Number.parseInt(intPart, 10)
    formattedInt = Number.isNaN(num) ? '' : num.toLocaleString('ru-RU')
  }
  if (decPart === undefined) {
    return formattedInt
  }
  return `${formattedInt},${decPart}`
}

/** Убираем хвостовую точку при отправке (blur / submit UX). */
function finalizeCanonical(normalized: string): string {
  if (!normalized || normalized === '.') {
    return ''
  }
  return normalized.endsWith('.') ? normalized.slice(0, -1) : normalized
}

const display = ref('')
const focused = ref(false)

watch(
  () => props.modelValue,
  () => {
    if (focused.value) {
      return
    }
    display.value = formatRu(storedToNormalized(props.modelValue))
  },
  { immediate: true },
)

function commitFromParsed(normalized: string) {
  display.value = formatRu(normalized)
  emit('update:modelValue', normalized)
}

function handleInput(e: Event) {
  const el = e.target as HTMLInputElement
  commitFromParsed(normalizeDecimals(el.value))
}

function handleBlur() {
  focused.value = false
  const normalized = normalizeDecimals(display.value.replace(/\s/g, '').replace(',', '.'))
  const fin = finalizeCanonical(normalized)
  emit('update:modelValue', fin)
  display.value = formatRu(fin)
}

function handleFocus() {
  focused.value = true
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const pasted = normalizeDecimals(
    (e.clipboardData?.getData('text/plain') ?? '').replace(/,/g, '.').replace(/\s/g, ''),
  )
  commitFromParsed(pasted)
}

function onKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return
  }
  if (['Tab', 'Enter', 'Escape', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
    return
  }
  if (e.key.length === 1 && !/[0-9.,]/.test(e.key)) {
    e.preventDefault()
  }
}

</script>

<template>
  <!-- Единая нижняя граница у всего поля; у триггера селекта — без отдельной линии и без галочки в списке -->
  <div
    class="flex w-full min-w-0 items-end gap-1 border-b border-[#cccccc] bg-transparent transition-colors focus-within:border-primary"
  >
    <div class="w-fit shrink-0 min-w-0">
      <AdminSelect
        select-width="fit-content"
        dropdown-list-layout="hug"
        trigger-gap="sm"
        variant="underline"
        underline-bare-trigger
        :show-option-check="false"
        :model-value="normalizeCurrency(props.currencyCode)"
        :options="currencyOptions"
        :searchable="false"
        placeholder="₽"
        @update:model-value="onCurrencyPick"
      />
    </div>
    <input
      :id="id"
      :value="display"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      :placeholder="placeholder"
      :class="[
        'min-w-0 flex-1 border-0 bg-transparent py-3 pl-0 pr-0 text-sm text-body outline-none placeholder:text-muted',
        inputClass,
      ]"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
      @paste="handlePaste"
      @keydown="onKeyDown"
    />
  </div>
</template>
