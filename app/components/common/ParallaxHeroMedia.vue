<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    image?: string | null
    active?: boolean
    eager?: boolean
    bgClass?: string
  }>(),
  {
    image: '',
    active: true,
    eager: false,
    bgClass: '',
  },
)

const root = ref<HTMLElement | null>(null)
const offset = ref(0)
let raf = 0
let reducedMotion = false

const imageUrl = computed(() => props.image?.trim() || '')
const bgStyle = computed(() => ({
  backgroundImage: imageUrl.value ? `url(${imageUrl.value})` : undefined,
  transform: `translate3d(0, ${offset.value}px, 0) scale(1.22)`,
}))

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function updateParallax() {
  raf = 0
  if (!import.meta.client || !root.value) {
    return
  }
  if (reducedMotion) {
    offset.value = 0
    return
  }
  const rect = root.value.getBoundingClientRect()
  const viewport = window.innerHeight || 1
  const progress = (viewport - rect.top) / (viewport + rect.height)
  offset.value = clamp((progress - 0.5) * rect.height * 0.28, -140, 140)
}

function scheduleUpdate() {
  if (raf) {
    return
  }
  raf = window.requestAnimationFrame(updateParallax)
}

onMounted(() => {
  if (import.meta.client) {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  updateParallax()
  window.addEventListener('scroll', scheduleUpdate, { passive: true })
  window.addEventListener('resize', scheduleUpdate, { passive: true })
})

onUnmounted(() => {
  if (raf) {
    window.cancelAnimationFrame(raf)
  }
  window.removeEventListener('scroll', scheduleUpdate)
  window.removeEventListener('resize', scheduleUpdate)
})

watch(imageUrl, () => {
  nextTick(updateParallax)
})
</script>

<template>
  <div ref="root" class="absolute inset-0 overflow-hidden" aria-hidden="true">
    <div
      v-if="imageUrl"
      :class="[
        'absolute -inset-y-[22%] inset-x-0 bg-cover bg-center transition-opacity duration-700 will-change-transform',
        active ? 'opacity-100' : 'opacity-0',
        bgClass,
      ]"
      :style="bgStyle"
    />
    <slot v-else />
  </div>
</template>
