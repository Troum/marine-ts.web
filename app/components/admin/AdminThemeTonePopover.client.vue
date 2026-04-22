<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { onClickOutside } from '@vueuse/core'
import { ChevronDown, Palette } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ThemeTitleTone } from '~/types'
import {
  THEME_TITLE_TONE_ADMIN_PREVIEW_HEX,
  THEME_TITLE_TONE_LABELS,
} from '~/utils/themeFormattedTitle'

/**
 * Аналог AdminColorTextPopover, но для редактора заголовков (`ThemeFormattedTitle`).
 * Показывает только тоны темы — потому что данные кодируются в spans с тонами,
 * произвольный hex здесь не сохранится (потеряется при сериализации).
 */
const props = defineProps<{
  editor: Editor | null
}>()

const TONE_KEYS = Object.keys(THEME_TITLE_TONE_LABELS) as ThemeTitleTone[]

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)

/** Активный тон в текущем выделении (если все символы окрашены одним тоном). */
const activeTone = ref<ThemeTitleTone | null>(null)

function readActiveTone() {
  const ed = props.editor
  if (!ed) {
    activeTone.value = null
    return
  }
  const attrs = ed.getAttributes('themeTone') as { tone?: string }
  const tone = attrs?.tone
  activeTone.value = TONE_KEYS.includes(tone as ThemeTitleTone) ? (tone as ThemeTitleTone) : null
}

function onSelectionUpdate() {
  readActiveTone()
}

watch(
  () => props.editor,
  (ed, prev) => {
    if (prev) {
      prev.off('selectionUpdate', onSelectionUpdate)
      prev.off('transaction', onSelectionUpdate)
    }
    if (ed) {
      ed.on('selectionUpdate', onSelectionUpdate)
      ed.on('transaction', onSelectionUpdate)
      readActiveTone()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  const ed = props.editor
  if (ed) {
    ed.off('selectionUpdate', onSelectionUpdate)
    ed.off('transaction', onSelectionUpdate)
  }
})

const canToggle = computed(() => Boolean(props.editor?.isEditable))

const triggerColor = computed(() =>
  activeTone.value ? THEME_TITLE_TONE_ADMIN_PREVIEW_HEX[activeTone.value] : 'currentColor',
)

function applyTone(tone: ThemeTitleTone) {
  const ed = props.editor
  if (!ed) return
  ed.chain().focus().setMark('themeTone', { tone }).run()
  readActiveTone()
}

function toggleOpen() {
  if (!canToggle.value) return
  open.value = !open.value
  if (open.value) {
    nextTick(() => {
      const first = popoverRef.value?.querySelector<HTMLButtonElement>('[data-tone-swatch]')
      first?.focus()
    })
  }
}

function close() {
  if (open.value) open.value = false
}

onClickOutside(root, () => close())

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  const target = e.target as HTMLElement | null
  if (!target?.matches('[data-tone-swatch]')) return
  e.preventDefault()
  const swatches = Array.from(popoverRef.value?.querySelectorAll<HTMLButtonElement>('[data-tone-swatch]') ?? [])
  const idx = swatches.indexOf(target as HTMLButtonElement)
  if (idx === -1) return
  let next = idx
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, idx - 1)
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(swatches.length - 1, idx + 1)
  swatches[next]?.focus()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true)
})
</script>

<template>
  <div ref="root" class="relative inline-block">
    <button
      type="button"
      class="mts-tone-trigger inline-flex h-8 items-center gap-1.5 rounded border border-mts-border bg-white px-2 font-body text-xs text-mts-text transition-colors hover:border-mts-accent hover:bg-mts-bg disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="!canToggle"
      :aria-expanded="open"
      aria-haspopup="dialog"
      aria-label="Тон темы"
      title="Тоны темы"
      @mousedown.prevent
      @click="toggleOpen"
    >
      <span class="mts-tone-trigger-icon inline-flex h-5 w-5 items-center justify-center rounded-sm font-semibold leading-none">
        <span class="mts-tone-trigger-letter" :style="{ color: triggerColor }">A</span>
        <span class="mts-tone-trigger-bar" :style="{ backgroundColor: triggerColor }" />
      </span>
      <ChevronDown class="h-3 w-3 text-mts-text-secondary" />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        ref="popoverRef"
        role="dialog"
        aria-label="Выбор тона темы"
        class="absolute left-0 top-full z-50 mt-1 w-[260px] origin-top-left rounded border border-mts-border bg-white p-3 shadow-lg"
        @mousedown.prevent
      >
        <header class="mb-2 flex items-center gap-1.5">
          <Palette class="h-3 w-3 text-mts-text-secondary" />
          <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Тоны темы</h3>
        </header>
        <div class="grid grid-cols-1 gap-1">
          <button
            v-for="tone in TONE_KEYS"
            :key="tone"
            type="button"
            data-tone-swatch
            class="mts-tone-row inline-flex items-center gap-2 rounded border border-transparent px-2 py-1.5 text-left font-body text-xs text-mts-text transition-colors hover:border-mts-border hover:bg-mts-bg focus:outline-none focus:ring-2 focus:ring-mts-accent/50"
            :class="{ 'mts-tone-row--active': activeTone === tone }"
            :title="THEME_TITLE_TONE_LABELS[tone]"
            :aria-pressed="activeTone === tone"
            @click="applyTone(tone)"
          >
            <span
              class="h-4 w-4 shrink-0 rounded border border-mts-border/50"
              :style="{ backgroundColor: THEME_TITLE_TONE_ADMIN_PREVIEW_HEX[tone] }"
            />
            <span>{{ THEME_TITLE_TONE_LABELS[tone] }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mts-tone-trigger-icon {
  position: relative;
  width: 1.25rem;
  height: 1.25rem;
}
.mts-tone-trigger-letter {
  font-size: 0.75rem;
  line-height: 1;
}
.mts-tone-trigger-bar {
  position: absolute;
  bottom: 1px;
  left: 2px;
  right: 2px;
  height: 2px;
  border-radius: 1px;
}
.mts-tone-row--active {
  border-color: var(--color-mts-accent, #2563eb);
  background-color: var(--color-mts-bg, #f8fafc);
}
</style>
