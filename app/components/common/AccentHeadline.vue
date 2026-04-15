<script setup lang="ts">
import { accentTitleParts } from '~/utils/accentTitle'

const props = withDefaults(
  defineProps<{
    before?: string
    accent: string
    after?: string
  }>(),
  { before: '', after: '' },
)

const parts = computed(() => accentTitleParts(props.before ?? '', props.accent, props.after ?? ''))
</script>

<template>
  <span class="inline">
    <template v-for="(part, i) in parts" :key="i">
      <template v-if="i > 0">{{ ' ' }}</template>
      <span
        :class="part.kind === 'accent' ? 'text-mts-accent whitespace-nowrap' : ''"
      >{{ part.text }}</span>
    </template>
  </span>
</template>
