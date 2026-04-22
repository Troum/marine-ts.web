<script setup lang="ts">
import type { Config } from 'dompurify'
import DOMPurify from 'isomorphic-dompurify'
import type { ThemeFormattedTitle } from '~/types'
import { normalizeThemeFormattedTitle } from '~/utils/themeFormattedTitle'

const props = defineProps<{
  content: string
}>()

const THEMED_INLINE_CONFIG: Config = {
  ALLOWED_TAGS: ['p', 'span', 'br', 'strong', 'em', 'b', 'i', 'mark'],
  /*
   * `style` оставляем — TipTap mark сохраняет в HTML inline color через CSS-переменную
   * темы (`color: var(--color-mts-accent)`). Без него на публичном сайте цвет терялся бы,
   * если Tailwind не сгенерировал класс `text-mts-*`.
   * `<mark>` нужен для @tiptap/extension-highlight (фон выделения, multicolor).
   */
  ALLOWED_ATTR: ['class', 'data-mts-tone', 'style'],
}

const parsedTft = computed<ThemeFormattedTitle | null>(() => {
  const raw = props.content ?? ''
  if (!raw.trimStart().startsWith('{')) {
    return null
  }
  try {
    const j = JSON.parse(raw) as unknown
    if (j && typeof j === 'object' && Array.isArray((j as { spans?: unknown }).spans)) {
      return normalizeThemeFormattedTitle(j)
    }
  } catch {
    return null
  }
  return null
})

const isHtml = computed(() => {
  const raw = props.content ?? ''
  if (parsedTft.value) {
    return false
  }
  return raw.trimStart().startsWith('<')
})

const sanitizedHtml = computed(() => {
  if (!isHtml.value) {
    return ''
  }
  return DOMPurify.sanitize(props.content, THEMED_INLINE_CONFIG)
})
</script>

<template>
  <span v-if="parsedTft" class="inline whitespace-pre-line">
    <ThemeFormattedTitle :title="parsedTft" root-class="inline whitespace-pre-line" />
  </span>
  <span v-else-if="isHtml" class="themed-inline-html inline whitespace-pre-line" v-html="sanitizedHtml" />
  <span v-else class="whitespace-pre-line">{{ content }}</span>
</template>

<style scoped>
.themed-inline-html :deep(span[data-mts-tone]) {
  display: inline;
}
/* <mark> приходит из tiptap highlight; убираем дефолтный жёлтый фон браузера,
   inline style="background-color: …" задаст реальный цвет. */
.themed-inline-html :deep(mark) {
  background-color: transparent;
  color: inherit;
  padding: 0;
}
</style>
