<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { onClickOutside } from '@vueuse/core'
import { ChevronDown, Palette, Bold } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ThemeTitleFontWeight } from '~/types'
import { useRecentColors } from '~/composables/useRecentColors'
import { getColorByValue, HIGHLIGHT_COLORS, TEXT_COLORS, type ColorOption } from '~/utils/colorTextPalette'
import { isThemeTitleFontWeight, THEME_TITLE_FONT_WEIGHT_LABELS } from '~/utils/themeFormattedTitle'
import { TIPTAP_FONT_WEIGHT_VALUES } from '~/utils/tiptapFontWeightConstants'
import { normalizeStoredFontWeight } from '~/utils/tiptapTextFontWeightExtension'

/**
 * Color Text Popover — Vue-порт TipTap UI Components Color Text Popover.
 * https://tiptap.dev/docs/ui-components/components/color-text-popover
 *
 * Триггер показывает текущий выбранный цвет текста (полоса под буквой A) и подсветку (фон).
 * При клике открывается поповер: «Цвет текста», «Начертание», «Подсветка».
 * Каждая секция содержит палитру + блок «Недавние» (хранится в localStorage).
 *
 * Требует, чтобы в `editor` были подключены: `TextStyle`, `Color`, `TiptapTextFontWeight`, `Highlight (multicolor)`.
 */
const props = defineProps<{
  editor: Editor | null
  /** Скрыть кнопку, если редактор недоступен (есть default) или цветовые расширения не подключены. */
  hideWhenUnavailable?: boolean
}>()

const emit = defineEmits<{
  colorChanged: [payload: { type: 'text' | 'highlight'; label: string; value: string }]
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)

const { recentColors: recentTextColors, addRecentColor: pushRecentText } = useRecentColors('text')
const { recentColors: recentHighlightColors, addRecentColor: pushRecentHighlight } = useRecentColors('highlight')

/** Активный цвет текста в текущем выделении (null = не выставлен). */
const activeTextColor = ref<string | null>(null)
/** Активный цвет подсветки в текущем выделении. */
const activeHighlightColor = ref<string | null>(null)
/** Явный font-weight из textStyle или null = по умолчанию. */
const activeFontWeight = ref<ThemeTitleFontWeight | null>(null)

function readActiveColors() {
  const ed = props.editor
  if (!ed) {
    activeTextColor.value = null
    activeHighlightColor.value = null
    activeFontWeight.value = null
    return
  }
  const ts = ed.getAttributes('textStyle') as { color?: string | null; fontWeight?: string | number | null }
  const hl = ed.getAttributes('highlight') as { color?: string | null }
  activeTextColor.value = ts?.color ?? null
  activeHighlightColor.value = hl?.color ?? null
  const fwRaw = ts?.fontWeight
  if (typeof fwRaw === 'number' && isThemeTitleFontWeight(fwRaw)) {
    activeFontWeight.value = fwRaw
  } else if (typeof fwRaw === 'string') {
    const norm = normalizeStoredFontWeight(fwRaw)
    const n = norm != null ? Number(norm) : NaN
    activeFontWeight.value = isThemeTitleFontWeight(n) ? n : null
  } else {
    activeFontWeight.value = null
  }
}

function onSelectionUpdate() {
  readActiveColors()
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
      readActiveColors()
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

const isVisible = computed(() => {
  if (!props.editor) {
    return !props.hideWhenUnavailable
  }
  /* Проверяем наличие нужных команд: если расширения не подключены — скрываем. */
  const cmds = props.editor.commands as unknown as Record<string, unknown>
  const has =
    typeof cmds.setColor === 'function' &&
    typeof cmds.unsetColor === 'function' &&
    typeof cmds.setHighlight === 'function' &&
    typeof cmds.unsetHighlight === 'function' &&
    typeof cmds.setTextFontWeight === 'function' &&
    typeof cmds.unsetTextFontWeight === 'function'
  if (!has && props.hideWhenUnavailable) {
    return false
  }
  return true
})

/** Цвет полосы под «A» в кнопке-триггере. */
const triggerUnderlineColor = computed(() => activeTextColor.value || 'currentColor')
const triggerHighlightBg = computed(() => activeHighlightColor.value || 'transparent')

/* Apply ============================================================ */

function applyText(option: ColorOption) {
  const ed = props.editor
  if (!ed) return
  if (!option.value) {
    ed.chain().focus().unsetColor().run()
  } else {
    ed.chain().focus().setColor(option.value).run()
    pushRecentText(option.value)
  }
  emit('colorChanged', { type: 'text', label: option.label, value: option.value })
  readActiveColors()
}

function applyHighlight(option: ColorOption) {
  const ed = props.editor
  if (!ed) return
  if (!option.value) {
    ed.chain().focus().unsetHighlight().run()
  } else {
    ed.chain().focus().setHighlight({ color: option.value }).run()
    pushRecentHighlight(option.value)
  }
  emit('colorChanged', { type: 'highlight', label: option.label, value: option.value })
  readActiveColors()
}

function applyFontWeight(fw: ThemeTitleFontWeight | null) {
  const ed = props.editor
  if (!ed) return
  if (fw == null) {
    ed.chain().focus().unsetTextFontWeight().run()
  } else {
    ed.chain().focus().setTextFontWeight(String(fw)).run()
  }
  readActiveColors()
}

function toggleOpen() {
  if (!canToggle.value) return
  open.value = !open.value
  if (open.value) {
    nextTick(() => {
      const first = popoverRef.value?.querySelector<HTMLButtonElement>('[data-color-swatch]')
      first?.focus()
    })
  }
}

function close() {
  if (!open.value) return
  open.value = false
}

onClickOutside(root, () => close())

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  /* Стрелочная навигация по swatches внутри popover */
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  const target = e.target as HTMLElement | null
  if (!target?.matches('[data-color-swatch]')) return
  e.preventDefault()
  const swatches = Array.from(popoverRef.value?.querySelectorAll<HTMLButtonElement>('[data-color-swatch]') ?? [])
  const idx = swatches.indexOf(target as HTMLButtonElement)
  if (idx === -1) return
  /* Сетки рисуются как grid 8 колонок (см. шаблон). Для верх/вниз шагаем на 8. */
  const cols = 8
  let next = idx
  if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1)
  if (e.key === 'ArrowRight') next = Math.min(swatches.length - 1, idx + 1)
  if (e.key === 'ArrowUp') next = Math.max(0, idx - cols)
  if (e.key === 'ArrowDown') next = Math.min(swatches.length - 1, idx + cols)
  swatches[next]?.focus()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true)
})

/* Active markers =================================================== */
function isActiveText(value: string): boolean {
  if (!value) return !activeTextColor.value
  return (activeTextColor.value || '').toLowerCase() === value.toLowerCase()
}
function isActiveHighlight(value: string): boolean {
  if (!value) return !activeHighlightColor.value
  return (activeHighlightColor.value || '').toLowerCase() === value.toLowerCase()
}

/** Лейбл для recent (если цвет совпал с предустановленным — показываем его лейбл). */
function recentLabel(value: string, palette: ColorOption[]): string {
  return getColorByValue(value, palette)?.label ?? value
}
</script>

<template>
  <div v-if="isVisible" ref="root" class="relative inline-block">
    <button
      type="button"
      class="mts-color-trigger inline-flex h-8 items-center gap-1.5 rounded border border-mts-border bg-white px-2 font-body text-xs text-mts-text transition-colors hover:border-mts-accent hover:bg-mts-bg disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="!canToggle"
      :aria-expanded="open"
      aria-haspopup="dialog"
      aria-label="Цвет, начертание и подсветка"
      title="Цвет / начертание / подсветка"
      @mousedown.prevent
      @click="toggleOpen"
    >
      <span
        class="mts-color-trigger-icon inline-flex h-5 w-5 items-center justify-center rounded-sm font-semibold leading-none"
        :style="{ backgroundColor: triggerHighlightBg }"
      >
        <span class="mts-color-trigger-letter" :style="{ color: triggerUnderlineColor }">A</span>
        <span class="mts-color-trigger-bar" :style="{ backgroundColor: triggerUnderlineColor }" />
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
        aria-label="Выбор цвета"
        class="absolute left-0 top-full z-50 mt-1 w-[280px] origin-top-left rounded border border-mts-border bg-white p-3 shadow-lg"
        @mousedown.prevent
      >
        <!-- Цвет текста -->
        <section>
          <header class="mb-2 flex items-center gap-1.5">
            <Palette class="h-3 w-3 text-mts-text-secondary" />
            <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Цвет текста</h3>
          </header>
          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="opt in TEXT_COLORS"
              :key="`text-${opt.value || 'default'}`"
              type="button"
              data-color-swatch
              class="mts-swatch group relative flex h-6 w-6 items-center justify-center rounded border border-mts-border bg-white transition-colors hover:border-mts-accent focus:outline-none focus:ring-2 focus:ring-mts-accent/50"
              :class="{ 'mts-swatch--active': isActiveText(opt.value) }"
              :title="opt.label"
              :aria-label="`Цвет текста: ${opt.label}`"
              :aria-pressed="isActiveText(opt.value)"
              @click="applyText(opt)"
            >
              <span
                v-if="opt.value"
                class="block h-full w-full rounded-sm"
                :style="{ backgroundColor: opt.value }"
              />
              <span v-else class="font-mono text-[9px] text-mts-text-secondary">×</span>
            </button>
          </div>

          <div v-if="recentTextColors.length" class="mt-2">
            <p class="mb-1 font-mono text-[9px] uppercase tracking-wide text-mts-text-muted">Недавние</p>
            <div class="grid grid-cols-8 gap-1">
              <button
                v-for="c in recentTextColors"
                :key="`rt-${c}`"
                type="button"
                data-color-swatch
                class="mts-swatch flex h-6 w-6 items-center justify-center rounded border border-mts-border transition-colors hover:border-mts-accent focus:outline-none focus:ring-2 focus:ring-mts-accent/50"
                :class="{ 'mts-swatch--active': isActiveText(c) }"
                :title="recentLabel(c, TEXT_COLORS)"
                :aria-label="`Применить цвет: ${recentLabel(c, TEXT_COLORS)}`"
                @click="applyText({ value: c, label: recentLabel(c, TEXT_COLORS) })"
              >
                <span class="block h-full w-full rounded-sm" :style="{ backgroundColor: c }" />
              </button>
            </div>
          </div>
        </section>

        <hr class="my-3 border-mts-border" />

        <section>
          <header class="mb-2 flex items-center gap-1.5">
            <Bold class="h-3 w-3 text-mts-text-secondary" />
            <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Начертание</h3>
          </header>
          <div class="grid grid-cols-1 gap-1">
            <button
              type="button"
              data-weight-swatch
              class="mts-weight-row inline-flex items-center gap-2 rounded border border-transparent px-2 py-1.5 text-left font-body text-xs text-mts-text transition-colors hover:border-mts-border hover:bg-mts-bg focus:outline-none focus:ring-2 focus:ring-mts-accent/50"
              :class="{ 'mts-weight-row--active': activeFontWeight === null }"
              title="Как у стиля абзаца / заголовка"
              :aria-pressed="activeFontWeight === null"
              @click="applyFontWeight(null)"
            >
              <span class="h-4 w-4 shrink-0 rounded border border-dashed border-mts-border/80" aria-hidden="true" />
              <span>По умолчанию</span>
            </button>
            <button
              v-for="fw in TIPTAP_FONT_WEIGHT_VALUES"
              :key="fw"
              type="button"
              data-weight-swatch
              class="mts-weight-row inline-flex items-center gap-2 rounded border border-transparent px-2 py-1.5 text-left font-body text-xs text-mts-text transition-colors hover:border-mts-border hover:bg-mts-bg focus:outline-none focus:ring-2 focus:ring-mts-accent/50"
              :class="{ 'mts-weight-row--active': activeFontWeight === fw }"
              :title="THEME_TITLE_FONT_WEIGHT_LABELS[fw]"
              :aria-pressed="activeFontWeight === fw"
              @click="applyFontWeight(fw)"
            >
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-mts-border/60 bg-mts-bg font-mono text-[9px] font-semibold leading-none text-mts-text"
              >
                {{ fw === 400 ? 'R' : fw === 700 ? 'B' : String(Math.round(fw / 100)) }}
              </span>
              <span>{{ THEME_TITLE_FONT_WEIGHT_LABELS[fw] }}</span>
            </button>
          </div>
        </section>

        <hr class="my-3 border-mts-border" />

        <!-- Подсветка -->
        <section>
          <header class="mb-2 flex items-center gap-1.5">
            <Palette class="h-3 w-3 text-mts-text-secondary" />
            <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Подсветка</h3>
          </header>
          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="opt in HIGHLIGHT_COLORS"
              :key="`hl-${opt.value || 'default'}`"
              type="button"
              data-color-swatch
              class="mts-swatch group relative flex h-6 w-6 items-center justify-center rounded border border-mts-border bg-white transition-colors hover:border-mts-accent focus:outline-none focus:ring-2 focus:ring-mts-accent/50"
              :class="{ 'mts-swatch--active': isActiveHighlight(opt.value) }"
              :title="opt.label"
              :aria-label="`Подсветка: ${opt.label}`"
              :aria-pressed="isActiveHighlight(opt.value)"
              @click="applyHighlight(opt)"
            >
              <span
                v-if="opt.value"
                class="block h-full w-full rounded-sm"
                :style="{ backgroundColor: opt.value }"
              />
              <span v-else class="font-mono text-[9px] text-mts-text-secondary">×</span>
            </button>
          </div>

          <div v-if="recentHighlightColors.length" class="mt-2">
            <p class="mb-1 font-mono text-[9px] uppercase tracking-wide text-mts-text-muted">Недавние</p>
            <div class="grid grid-cols-8 gap-1">
              <button
                v-for="c in recentHighlightColors"
                :key="`rh-${c}`"
                type="button"
                data-color-swatch
                class="mts-swatch flex h-6 w-6 items-center justify-center rounded border border-mts-border transition-colors hover:border-mts-accent focus:outline-none focus:ring-2 focus:ring-mts-accent/50"
                :class="{ 'mts-swatch--active': isActiveHighlight(c) }"
                :title="recentLabel(c, HIGHLIGHT_COLORS)"
                :aria-label="`Применить подсветку: ${recentLabel(c, HIGHLIGHT_COLORS)}`"
                @click="applyHighlight({ value: c, label: recentLabel(c, HIGHLIGHT_COLORS) })"
              >
                <span class="block h-full w-full rounded-sm" :style="{ backgroundColor: c }" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mts-color-trigger-icon {
  position: relative;
  width: 1.25rem;
  height: 1.25rem;
}
.mts-color-trigger-letter {
  font-size: 0.75rem;
  line-height: 1;
}
.mts-color-trigger-bar {
  position: absolute;
  bottom: 1px;
  left: 2px;
  right: 2px;
  height: 2px;
  border-radius: 1px;
}
.mts-swatch--active {
  box-shadow: inset 0 0 0 2px var(--color-mts-accent, #2563eb);
}
.mts-weight-row--active {
  box-shadow: inset 0 0 0 2px var(--color-mts-accent, #2563eb);
  background-color: var(--color-mts-bg, #f8fafc);
}
</style>
