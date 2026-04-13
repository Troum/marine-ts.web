<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** sm = 4×4 (admin forms), lg = 6×6 (public sections) */
    size?: 'sm' | 'lg'
    /** Override bottom-right vertical position, e.g. 'bottom-6' for carousel offset */
    bottom?: string
  }>(),
  {
    size: 'sm',
    bottom: '',
  },
)

const sizeClass = computed(() => (props.size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'))
const extras = computed(() => (props.size === 'lg' ? 'z-20 pointer-events-none' : ''))

const topLeft = computed(() =>
  `absolute -top-2 -left-2 ${sizeClass.value} border-t-2 border-l-2 border-mts-accent ${extras.value}`.trim(),
)

const bottomRight = computed(() => {
  const pos = props.bottom ? `${props.bottom} -right-2` : '-bottom-2 -right-2'
  return `absolute ${pos} ${sizeClass.value} border-b-2 border-r-2 border-mts-accent ${extras.value}`.trim()
})
</script>

<template>
  <div :class="topLeft" />
  <div :class="bottomRight" />
</template>
