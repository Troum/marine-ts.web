<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** URL фонового изображения (рендер в `<img>` с `object-fit: cover`, без искажения пропорций). */
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

const imageUrl = computed(() => publicAssetUrl(props.image))
const videoUrl = computed(() => publicAssetUrl(props.video))
const useVideo = computed(() => videoUrl.value.length > 0 && !reducedMotion.value)

/** Чуть больше 1 — запас для параллакса без чёрных кромок; меньше старого 1.22, чтобы кадр не «перезумливался». */
const PARALLAX_SLACK_SCALE = 1.1

const mediaStyle = computed(() => ({
  transform: `translate3d(0, ${offset.value}px, 0) scale(${PARALLAX_SLACK_SCALE})`,
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
        'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 will-change-transform',
        active ? 'opacity-100' : 'opacity-0',
        bgClass,
      ]"
      :style="mediaStyle"
    />
    <img
      v-else-if="imageUrl"
      :key="imageUrl"
      :src="imageUrl"
      alt=""
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      :class="[
        'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 will-change-transform',
        active ? 'opacity-100' : 'opacity-0',
        bgClass,
      ]"
      :style="mediaStyle"
    />
    <slot v-else />
  </div>
</template>
