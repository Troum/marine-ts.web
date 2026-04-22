<script setup lang="ts">
/**
 * Технический крестик-маркер «+» из макета Marin (Figma).
 * Используется как декоративный layout-элемент на пересечениях
 * сетки и линий разреза в тёмных секциях страниц.
 */
withDefaults(
  defineProps<{
    size?: number
    color?: string
    opacity?: number
  }>(),
  {
    size: 14,
    color: '#e6edf2',
    opacity: 0.55,
  },
)
</script>

<template>
  <span
    class="pointer-events-none inline-block"
    :style="{ width: `${size}px`, height: `${size}px`, opacity }"
    aria-hidden="true"
  >
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 0 V14 M0 7 H14" :stroke="color" stroke-width="1" />
    </svg>
  </span>
</template>
