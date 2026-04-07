<script setup lang="ts">
import type { SeoFields } from '~/types'

const props = defineProps<{
  modelValue: SeoFields
}>()

const emit = defineEmits<{ 'update:modelValue': [value: SeoFields] }>()

function patch<K extends keyof SeoFields>(key: K, value: SeoFields[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Meta title</label>
      <input
        :value="modelValue.seoTitle"
        type="text"
        class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none focus:ring-2 focus:ring-mts-accent/20"
        placeholder="Заголовок для поисковых систем"
        @input="patch('seoTitle', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div>
      <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Meta description</label>
      <textarea
        :value="modelValue.seoDescription"
        rows="4"
        class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none focus:ring-2 focus:ring-mts-accent/20"
        placeholder="Краткое описание для сниппета"
        @input="patch('seoDescription', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
    <div>
      <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Keywords</label>
      <input
        :value="modelValue.seoKeywords"
        type="text"
        class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none focus:ring-2 focus:ring-mts-accent/20"
        placeholder="ключевые слова через запятую"
        @input="patch('seoKeywords', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>
