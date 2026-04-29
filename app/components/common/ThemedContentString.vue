<script setup lang="ts">
import type { Config } from 'dompurify'
import DOMPurify from 'isomorphic-dompurify'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import type { ThemeFormattedTitle as ThemeFormattedTitleModel } from '~/types'
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
  ALLOWED_ATTR: ['class', 'data-mts-tone', 'data-mts-font-weight', 'data-color', 'style'],
}

const parsedTft = computed<ThemeFormattedTitleModel | null>(() => {
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
  const clean = DOMPurify.sanitize(props.content, THEMED_INLINE_CONFIG)
    .replace(/<\/p>\s*<p[^>]*>/gi, '<br>')
    .replace(/<\/?p[^>]*>/gi, '')
  // Fallback for older/stripped Highlight markup: if mark has data-color but no style,
  // restore inline background so highlight remains visible after sanitization.
  return clean.replace(
    /<mark\b([^>]*?)data-color=(['"])([^'"]+)\2([^>]*)>/gi,
    (full, before, quote, color, after) => {
      const attrs = `${before}${after}`
      if (/style\s*=/i.test(attrs)) {
        return full
      }
      return `<mark${before}data-color=${quote}${color}${quote}${after} style="background-color: ${color}; color: inherit">`
    },
  )
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
/* Fallback: если у стороннего санитайзера отвалился только style, вес из data сохраняется. */
.themed-inline-html :deep(span[data-mts-font-weight='400']) {
  font-weight: 400;
}
.themed-inline-html :deep(span[data-mts-font-weight='500']) {
  font-weight: 500;
}
.themed-inline-html :deep(span[data-mts-font-weight='600']) {
  font-weight: 600;
}
.themed-inline-html :deep(span[data-mts-font-weight='700']) {
  font-weight: 700;
}
.themed-inline-html :deep(span[data-mts-font-weight='800']) {
  font-weight: 800;
}
</style>
