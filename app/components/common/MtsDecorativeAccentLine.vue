<script setup lang="ts">
import { computed } from 'vue'

/**
 * Декоративная линия из Figma (Line 29): 32×1 px, цвет #B84041.
 * Горизонталь: реальная высота 1px — корректное выравнивание по центру в flex-row.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'horizontal' | 'vertical' | 'diagonal'
    /** Ширина горизонтали / «длина» диагонали (px) */
    widthPx?: number
    /** Высота вертикали (px) */
    heightPx?: number
    /** Цвет обводки, по умолчанию из макета */
    borderColor?: string
    /** Угол диагонали (deg) */
    diagonalDeg?: number
  }>(),
  {
    variant: 'horizontal',
    widthPx: 32,
    heightPx: 32,
    borderColor: '#B84041',
    diagonalDeg: 6,
  },
)

const horizontalStyle = computed(() => ({
  width: `${props.widthPx}px`,
  height: '1px',
  backgroundColor: props.borderColor,
}))

const verticalStyle = computed(() => ({
  width: '1px',
  height: `${props.heightPx}px`,
  backgroundColor: props.borderColor,
}))

const diagonalStyle = computed(() => ({
  width: `${props.widthPx}px`,
  height: '1px',
  backgroundColor: props.borderColor,
  transform: `rotate(-${props.diagonalDeg}deg)`,
  transformOrigin: 'left center',
}))
</script>

<template>
  <span
    v-if="variant === 'vertical'"
    class="pointer-events-none box-border shrink-0 self-center border-0"
    :style="verticalStyle"
    aria-hidden="true"
  />
  <span
    v-else-if="variant === 'diagonal'"
    class="pointer-events-none box-border shrink-0 self-center border-0"
    :style="diagonalStyle"
    aria-hidden="true"
  />
  <span
    v-else
    class="pointer-events-none box-border shrink-0 self-center border-0"
    :style="horizontalStyle"
    aria-hidden="true"
  />
</template>
