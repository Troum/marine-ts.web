<script setup lang="ts">
import { MoveLeft, MoveRight } from 'lucide-vue-next'
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

function startTimer() {
  if (props.slides.length <= 1) return
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    index.value = (index.value + 1) % props.slides.length
  }, props.intervalMs)
}

function prev() {
  index.value = (index.value - 1 + props.slides.length) % props.slides.length
  startTimer()
}

function next() {
  index.value = (index.value + 1) % props.slides.length
  startTimer()
}

onMounted(startTimer)

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div>
    <div
      class="relative z-10 w-full aspect-[4/3] min-h-[14rem] sm:min-h-[18rem] overflow-hidden bg-mts-bg"
      role="region"
      aria-roledescription="carousel"
      :aria-label="
        slides.length ? `${ariaLabel}: кадр ${index + 1} из ${slides.length}` : ariaLabel
      "
    >
      <img
        v-for="(slide, i) in slides"
        :key="slide.src"
        :src="slide.src"
        :alt="slide.alt"
        :aria-hidden="i !== index"
        :loading="i === 0 ? 'eager' : 'lazy'"
        decoding="async"
        class="absolute inset-0 h-full w-full object-cover brightness-[1.04] contrast-[1.03] saturate-[1.05] transition-opacity duration-1000 ease-in-out motion-reduce:transition-none"
        :class="i === index ? 'opacity-100 z-1' : 'opacity-0 z-0'"
      />
    </div>
    <div v-if="showDots && slides.length > 1" class="mt-3 flex items-center justify-center gap-3" aria-hidden="true">
      <button
        type="button"
        class="flex items-center justify-center text-mts-text-secondary hover:text-mts-accent transition-colors"
        aria-label="Предыдущий слайд"
        @click="prev"
      >
        <MoveLeft class="w-4 h-4" />
      </button>
      <div class="flex items-center gap-1.5">
        <span
          v-for="(_, i) in slides"
          :key="i"
          class="h-1 rounded-full transition-all duration-300 cursor-pointer"
          :class="i === index ? 'w-6 bg-mts-accent' : 'w-1.5 bg-mts-border hover:bg-mts-text-muted'"
          @click="() => { index = i; startTimer() }"
        />
      </div>
      <button
        type="button"
        class="flex items-center justify-center text-mts-text-secondary hover:text-mts-accent transition-colors"
        aria-label="Следующий слайд"
        @click="next"
      >
        <MoveRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
