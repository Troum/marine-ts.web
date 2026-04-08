<script setup lang="ts">
import { AsYouType, parsePhoneNumber } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'

const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Для номеров без кода страны (например 9…); при вводе «+» страна определяется автоматически */
    defaultCountry?: CountryCode
    id?: string
    inputClass?: string
  }>(),
  { defaultCountry: 'RU' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function formatFull(raw: string): string {
  const asYouType = new AsYouType(props.defaultCountry)
  let result = ''
  const normalized = raw.replace(/[^\d+]/g, '')
  for (const ch of normalized) {
    result = asYouType.input(ch)
  }
  return result
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  emit('update:modelValue', formatFull(el.value))
}

function onBlur() {
  const raw = props.modelValue?.trim()
  if (!raw) {
    return
  }
  try {
    const phone = parsePhoneNumber(raw, raw.startsWith('+') ? undefined : props.defaultCountry)
    if (phone?.isValid()) {
      emit('update:modelValue', phone.formatInternational())
    }
  } catch {
    /* оставляем как ввели */
  }
}
</script>

<template>
  <input
    :id="id"
    :value="modelValue"
    type="tel"
    autocomplete="tel"
    inputmode="tel"
    :class="inputClass"
    @input="onInput"
    @blur="onBlur"
  />
</template>
