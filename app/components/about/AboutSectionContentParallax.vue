<script setup lang="ts">
/**
 * Лёгкий вертикальный параллакс для контента секции (клиент).
 * Уважает prefers-reduced-motion.
 */
const props = withDefaults(
  defineProps<{
    /** Макс. сдвиг по Y в px (в обе стороны). */
    maxShift?: number
    /** Множитель относительно высоты блока (как у hero-фона, но слабее). */
    factor?: number
  }>(),
  {
    maxShift: 44,
    factor: 0.1,
  },
)

const root = ref<HTMLElement | null>(null)
const shift = ref(0)
let raf = 0
const reducedMotion = ref(false)

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function update() {
  raf = 0
  if (!import.meta.client || !root.value || reducedMotion.value) {
    shift.value = 0
    return
  }
  const rect = root.value.getBoundingClientRect()
  const vh = window.innerHeight || 1
  const progress = (vh - rect.top) / (vh + rect.height)
  const raw = (progress - 0.5) * rect.height * props.factor
  shift.value = clamp(raw, -props.maxShift, props.maxShift)
}

function schedule() {
  if (raf) {
    return
  }
  raf = window.requestAnimationFrame(update)
}

onMounted(() => {
  if (import.meta.client) {
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  update()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
})

onUnmounted(() => {
  if (raf) {
    window.cancelAnimationFrame(raf)
  }
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
})
</script>

<template>
  <div
    ref="root"
    class="will-change-transform"
    :style="
      reducedMotion || shift === 0
        ? {}
        : { transform: `translate3d(0, ${shift}px, 0)` }
    "
  >
    <slot />
  </div>
</template>
