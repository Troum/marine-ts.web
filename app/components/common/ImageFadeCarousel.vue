<script setup lang="ts">
import { ABOUT_CAROUSEL_INTERVAL_MS, type AboutCarouselSlide } from '~/utils/aboutCarouselSlides'

const props = withDefaults(
  defineProps<{
    slides: AboutCarouselSlide[]
    /** Интервал смены кадров, мс */
    intervalMs?: number
    showDots?: boolean
    ariaLabel?: string
  }>(),
  {
    intervalMs: ABOUT_CAROUSEL_INTERVAL_MS,
    showDots: true,
    ariaLabel: 'Галерея производства',
  },
)

const index = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (props.slides.length <= 1) return
  timer = setInterval(() => {
    index.value = (index.value + 1) % props.slides.length
  }, props.intervalMs)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div>
    <div
      class="relative z-10 w-full aspect-[4/3] overflow-hidden bg-mts-bg"
      role="region"
      aria-roledescription="carousel"
      :aria-label="`${ariaLabel}: кадр ${index + 1} из ${slides.length}`"
    >
      <img
        v-for="(slide, i) in slides"
        :key="slide.src"
        :src="slide.src"
        :alt="slide.alt"
        :aria-hidden="i !== index"
        :loading="i === 0 ? 'eager' : 'lazy'"
        decoding="async"
        class="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out motion-reduce:transition-none"
        :class="i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'"
      />
    </div>
    <div v-if="showDots && slides.length > 1" class="mt-3 flex justify-center gap-1.5" aria-hidden="true">
      <span
        v-for="(_, i) in slides"
        :key="i"
        class="h-1 rounded-full transition-all duration-300"
        :class="i === index ? 'w-6 bg-mts-accent' : 'w-1.5 bg-mts-border'"
      />
    </div>
  </div>
</template>
