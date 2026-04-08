<script setup lang="ts">
import type { MarineContentLocale } from '~/types'
import { MARINE_CONTENT_LOCALES, MARINE_LOCALE_META } from '~/utils/marineLocales'

defineProps<{
  modelValue: MarineContentLocale
  /** Подпись над переключателем */
  label?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: MarineContentLocale] }>()
</script>

<template>
  <div class="space-y-2">
    <div
      v-if="label"
      class="mb-1 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
    >
      {{ label }}
    </div>
    <div
      class="inline-flex flex-wrap gap-0.5 rounded-md border border-mts-border bg-mts-bg/80 p-0.5 shadow-inner"
      role="tablist"
      :aria-label="label || 'Язык контента'"
    >
      <button
        v-for="loc in MARINE_CONTENT_LOCALES"
        :key="loc"
        type="button"
        role="tab"
        :aria-selected="modelValue === loc"
        class="min-w-[5.5rem] rounded px-4 py-2 font-mono text-[11px] uppercase tracking-wide transition-all"
        :class="
          modelValue === loc
            ? 'bg-mts-accent text-white shadow-sm'
            : 'text-mts-text-secondary hover:bg-white/60 hover:text-mts-text'
        "
        @click="emit('update:modelValue', loc)"
      >
        <span class="font-semibold">{{ MARINE_LOCALE_META[loc].short }}</span>
        <span class="ml-1.5 hidden font-normal opacity-90 sm:inline">{{ MARINE_LOCALE_META[loc].label }}</span>
      </button>
    </div>
    <p class="font-body text-xs text-mts-text-secondary">
      {{ MARINE_LOCALE_META[modelValue].hint }}
    </p>
  </div>
</template>
