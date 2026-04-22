<script setup lang="ts">
import type { ThemeFormattedTitle as Tft } from '~/types'
import { THEME_TITLE_TONE_CLASSES } from '~/utils/themeFormattedTitle'

const props = defineProps<{
  title: Tft
  /** Дополнительные классы для корневого span (например font-display). */
  rootClass?: string
}>()

function cls(tone: string) {
  return THEME_TITLE_TONE_CLASSES[tone as keyof typeof THEME_TITLE_TONE_CLASSES] ?? 'text-mts-text'
}
</script>

<template>
  <span :class="['inline', rootClass]">
    <template v-for="(s, i) in title.spans" :key="i">
      <span :class="cls(s.tone)">{{ s.text }}</span>
    </template>
  </span>
</template>
