<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Параллакс-фон как CSS background-image (без видео). */
    image?: string | null
    /** Фоновое видео (URL). Постер — `image`, если указан. Не играет при prefers-reduced-motion. */
    video?: string | null
    active?: boolean
    eager?: boolean
    bgClass?: string
  }>(),
  {
    image: '',
    video: '',
    active: true,
    eager: false,
    bgClass: '',
  },
)

const root = ref<HTMLElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const offset = ref(0)
let raf = 0
const reducedMotion = ref(false)

const imageUrl = computed(() => props.image?.trim() || '')
const videoUrl = computed(() => props.video?.trim() || '')
const useVideo = computed(() => videoUrl.value.length > 0 && !reducedMotion.value)

const mediaStyle = computed(() => ({
  transform: `translate3d(0, ${offset.value}px, 0) scale(1.22)`,
}))

const bgStyle = computed(() => ({
  backgroundImage: imageUrl.value ? `url(${imageUrl.value})` : undefined,
  transform: mediaStyle.value.transform,
}))

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function updateParallax() {
  raf = 0
  if (!import.meta.client || !root.value) {
    return
  }
  if (reducedMotion.value) {
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
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

watch([imageUrl, videoUrl], () => {
  nextTick(updateParallax)
})

watch(
  [useVideo, videoUrl, () => props.active],
  async () => {
    if (!import.meta.client || !useVideo.value || !props.active) {
      return
    }
    await nextTick()
    try {
      await videoEl.value?.play()
    } catch {
      /* автозапуск может быть заблокирован браузером */
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <div ref="root" class="absolute inset-0 overflow-hidden" aria-hidden="true">
    <video
      v-if="useVideo"
      :key="videoUrl"
      ref="videoEl"
      :src="videoUrl"
      :poster="imageUrl || undefined"
      muted
      loop
      playsinline
      autoplay
      :class="[
        'absolute -inset-y-[22%] inset-x-0 w-full object-cover transition-opacity duration-700 will-change-transform',
        active ? 'opacity-100' : 'opacity-0',
        bgClass,
      ]"
      :style="mediaStyle"
    />
    <div
      v-else-if="imageUrl"
      :key="imageUrl"
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
