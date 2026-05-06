<script setup lang="ts">
import { MoveLeft, MoveRight } from 'lucide-vue-next'
import ThemedContentString from '~/components/common/ThemedContentString.vue'

const props = withDefaults(
  defineProps<{
    slides: string[]
    /** 0 — без автопрокрутки */
    autoplayMs?: number
  }>(),
  { autoplayMs: 0 },
)

const normalized = computed(() => {
  const out = props.slides.map(s => (typeof s === 'string' ? s : '')).filter(s => s.trim().length > 0)
  return out.length > 0 ? out : ['']
})

const slideIndex = ref(0)
const reducedMotion = ref(false)

watch(normalized, () => {
  slideIndex.value = 0
})

const showNav = computed(() => normalized.value.length > 1)

const hoverPaused = ref(false)

let hideTimer: ReturnType<typeof setTimeout> | null = null

function clearAutoplay() {
  if (hideTimer != null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function scheduleAutoplay() {
  clearAutoplay()
  if (
    !import.meta.client
    || reducedMotion.value
    || hoverPaused.value
    || document.visibilityState !== 'visible'
    || props.autoplayMs < 1500
    || normalized.value.length < 2
  ) {
    return
  }
  hideTimer = setTimeout(() => {
    hideTimer = null
    nextSlide()
    scheduleAutoplay()
  }, props.autoplayMs)
}

function prevSlide() {
  const n = normalized.value.length
  slideIndex.value = (slideIndex.value - 1 + n) % n
}

function nextSlide() {
  const n = normalized.value.length
  slideIndex.value = (slideIndex.value + 1) % n
}

function goSlide(i: number) {
  slideIndex.value = i
}

function onVisibility() {
  if (document.visibilityState === 'hidden') {
    clearAutoplay()
  }
  else {
    scheduleAutoplay()
  }
}

/** Высота области текста = max по всем слайдам, чтобы индикаторы не прыгали. */
const measureRoot = ref<HTMLElement | null>(null)
const slideAreaMinHeight = ref(0)

function commitSlideAreaMinHeight() {
  if (!import.meta.client) {
    return
  }
  const el = measureRoot.value
  if (!el) {
    return
  }
  const h = Math.ceil(el.getBoundingClientRect().height)
  if (h > 0) {
    slideAreaMinHeight.value = h
  }
}

let measureRo: ResizeObserver | null = null

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.addEventListener('visibilitychange', onVisibility)
  scheduleAutoplay()

  measureRo = new ResizeObserver(() => {
    commitSlideAreaMinHeight()
  })
  nextTick(() => {
    const el = measureRoot.value
    if (el && measureRo) {
      measureRo.observe(el)
    }
    commitSlideAreaMinHeight()
  })
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  clearAutoplay()
  measureRo?.disconnect()
  measureRo = null
})

watch([() => props.autoplayMs, slideIndex, reducedMotion, normalized, hoverPaused], () => {
  scheduleAutoplay()
})

function onSliderPointerEnter() {
  hoverPaused.value = true
  clearAutoplay()
}

function onSliderPointerLeave() {
  hoverPaused.value = false
  scheduleAutoplay()
}

const currentContent = computed(() => normalized.value[slideIndex.value] ?? '')

watch(
  normalized,
  () => {
    nextTick(() => commitSlideAreaMinHeight())
  },
  { deep: true },
)

const slideCopyClass =
  'mts-hero-themed-copy space-y-5 text-[11px] font-body leading-relaxed text-white/85 md:text-2xl'
</script>

<template>
  <div
    class="home-hero-marketing-slider"
    role="region"
    :aria-roledescription="$t('home.marketingSlider.ariaRole')"
    :aria-label="$t('home.marketingSlider.ariaLabel')"
    @mouseenter="onSliderPointerEnter"
    @mouseleave="onSliderPointerLeave"
  >
    <div class="relative w-full">
      <div
        ref="measureRoot"
        class="slider-measure-stack pointer-events-none absolute left-0 right-0 top-0 -z-10 w-full opacity-0"
        aria-hidden="true"
      >
        <div
          v-for="(s, i) in normalized"
          :key="`measure-${i}-${s.slice(0, 24)}`"
          :class="['min-w-0', slideCopyClass]"
        >
          <ThemedContentString :content="s" />
        </div>
      </div>

      <Transition mode="out-in" name="home-hero-fade">
        <div
          :key="`${slideIndex}-${currentContent.slice(0, 40)}`"
          :class="['min-w-0', slideCopyClass]"
          :style="slideAreaMinHeight > 0 ? { minHeight: `${slideAreaMinHeight}px` } : undefined"
        >
          <ThemedContentString :content="currentContent" />
        </div>
      </Transition>
    </div>

      <div
        v-if="showNav"
        class="mt-5 flex flex-wrap items-center justify-center gap-3"
        role="group"
        :aria-label="$t('home.marketingSlider.dotsLabel')"
      >
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center text-white/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          :aria-label="$t('home.marketingSlider.prev')"
          @click="prevSlide"
        >
          <MoveLeft class="h-5 w-8" aria-hidden="true" />
        </button>

        <div class="flex flex-wrap items-center justify-center gap-2">
        <button
          v-for="(_, i) in normalized"
          :key="`dot-${i}`"
          type="button"
          :aria-current="i === slideIndex ? 'true' : undefined"
          :aria-label="$t('home.marketingSlider.goTo', { n: i + 1 })"
          class="h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          :class="
            i === slideIndex
              ? 'w-8 bg-primary'
              : 'w-2 bg-white/35 hover:bg-white/55'
          "
          @click="goSlide(i)"
        />
        </div>

        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center text-white/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          :aria-label="$t('home.marketingSlider.next')"
          @click="nextSlide"
        >
          <MoveRight class="h-5 w-8" aria-hidden="true" />
        </button>
      </div>
    </div>
</template>

<style scoped>
.slider-measure-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.slider-measure-stack > * {
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
}

.home-hero-fade-enter-active,
.home-hero-fade-leave-active {
  transition: opacity 0.45s ease;
}
.home-hero-fade-enter-from,
.home-hero-fade-leave-to {
  opacity: 0;
}
</style>
