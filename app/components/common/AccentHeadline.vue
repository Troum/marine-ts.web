<script setup lang="ts">
import type { ThemeFormattedTitle as Tft } from '~/types'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import { migrateLegacyTripleToTheme } from '~/utils/themeFormattedTitle'

const props = withDefaults(
  defineProps<{
    /** Новый формат (предпочтительно). */
    formatted?: Tft
    /** Совместимость: три строки как раньше. */
    before?: string
    accent?: string
    after?: string
  }>(),
  { before: '', accent: '', after: '' },
)

const resolved = computed<Tft>(() => {
  if (props.formatted && props.formatted.spans?.length) {
    return props.formatted
  }
  return migrateLegacyTripleToTheme(props.before ?? '', props.accent ?? '', props.after ?? '')
})
</script>

<template>
  <ThemeFormattedTitle :title="resolved" />
</template>
