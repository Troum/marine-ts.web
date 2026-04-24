<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-vue-next'

/**
 * Универсальная сворачиваемая секция админ-формы со встроенными
 * контролами видимости и порядка прямо в шапке.
 *
 * Дизайн: верхняя плашка с заголовком слева; справа — опционально
 * чекбокс «Показывать», стрелки вверх/вниз и chevron сворачивания.
 * Контент — слот по умолчанию (рендерится, когда `collapsed === false`).
 *
 * Контролы появляются только если соответствующий проп передан:
 *  - `visible: boolean | null` (null или undefined → скрыть чекбокс).
 *    Используется для секций, которые нельзя скрывать (например, Hero).
 *  - `canMoveUp` / `canMoveDown` — управляют активностью стрелок.
 *    Если оба не переданы (undefined) — стрелки не показываются вовсе.
 *
 * События: update:collapsed, update:visible, moveUp, moveDown.
 */
const props = defineProps<{
  title: string
  collapsed: boolean | undefined
  visible?: boolean | null
  canMoveUp?: boolean
  canMoveDown?: boolean
  hint?: string
  /** Дополнительный slot rightExtra даёт место под кнопку «Удалить» и т.п. */
  showOrderControls?: boolean
}>()

const emit = defineEmits<{
  'update:collapsed': [boolean]
  'update:visible': [boolean]
  moveUp: []
  moveDown: []
}>()

const isCollapsed = computed(() => props.collapsed !== false)
const hasVisibilityToggle = computed(() => typeof props.visible === 'boolean')
const hasOrderControls = computed(() => props.showOrderControls !== false
  && (props.canMoveUp !== undefined || props.canMoveDown !== undefined))

function toggleCollapsed() {
  emit('update:collapsed', !isCollapsed.value)
}

function onVisibilityChange(ev: Event) {
  const el = ev.target as HTMLInputElement | null
  if (el) emit('update:visible', el.checked)
}

function onMoveUp(ev: Event) {
  ev.stopPropagation()
  if (props.canMoveUp) emit('moveUp')
}

function onMoveDown(ev: Event) {
  ev.stopPropagation()
  if (props.canMoveDown) emit('moveDown')
}
</script>

<template>
  <section class="relative border border-mts-border bg-white shadow-tech">
    <CommonAccentCorners />
    <div class="flex w-full items-center gap-2 p-6">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
        @click="toggleCollapsed"
      >
        <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">
          {{ title }}
        </h2>
        <ChevronDown
          class="h-4 w-4 shrink-0 text-mts-text-secondary transition-transform"
          :class="{ 'rotate-180': !isCollapsed }"
        />
      </button>
      <div v-if="hasVisibilityToggle || hasOrderControls || $slots.headerExtra" class="flex shrink-0 items-center gap-2">
        <label
          v-if="hasVisibilityToggle"
          class="flex shrink-0 cursor-pointer items-center gap-2 font-body text-xs text-mts-text-secondary"
          @click.stop
        >
          <input
            type="checkbox"
            class="mts-checkbox"
            :checked="visible === true"
            @change="onVisibilityChange"
          />
          Показывать
        </label>
        <div v-if="hasOrderControls" class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            class="btn-secondary p-1.5 disabled:opacity-40"
            :disabled="!canMoveUp"
            aria-label="Выше"
            @click="onMoveUp"
          >
            <ArrowUp class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="btn-secondary p-1.5 disabled:opacity-40"
            :disabled="!canMoveDown"
            aria-label="Ниже"
            @click="onMoveDown"
          >
            <ArrowDown class="h-4 w-4" />
          </button>
        </div>
        <slot name="headerExtra" />
      </div>
    </div>
    <div v-if="hint && !isCollapsed" class="border-t border-mts-border px-6 pt-4 pb-2 font-body text-xs text-mts-text-secondary">
      {{ hint }}
    </div>
    <div v-show="!isCollapsed" class="space-y-4 border-t border-mts-border px-6 pb-6 pt-4" :class="hint ? 'border-t-0 pt-0' : ''">
      <slot />
    </div>
  </section>
</template>
