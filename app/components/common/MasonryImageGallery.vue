<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface GalleryImage {
  src: string
  alt: string
}

const props = withDefaults(
  defineProps<{
    images: GalleryImage[]
    /** Количество колонок Masonry на md-брейкпойнте (на мобильном — 2). */
    columns?: number
    ariaLabel?: string
  }>(),
  {
    columns: 3,
    ariaLabel: 'Галерея изображений',
  },
)

/**
 * Используем CSS columns + break-inside-avoid: получается «настоящий»
 * Masonry без библиотек и без layout-thrashing — браузер сам распределяет
 * элементы по колонкам, сохраняя естественные пропорции изображений.
 *
 * Для md+ берём prop, на мобиле всегда 2 (иначе при больших columns картинки
 * становятся мизерными). Tailwind columns-* — статичные строки, поэтому
 * собираем класс из карты.
 */
const COLS_MD: Record<number, string> = {
  2: 'md:columns-2',
  3: 'md:columns-3',
  4: 'md:columns-4',
  5: 'md:columns-5',
}

const containerClass = computed(() => {
  const md = COLS_MD[props.columns] ?? COLS_MD[3]
  return `mts-masonry-gallery columns-2 ${md} gap-3 md:gap-4`
})

/* ── Лайтбокс по клику на изображение ─────────────────────────────────── */

const lightboxIndex = ref<number | null>(null)
const lightboxOpen = computed(() => lightboxIndex.value !== null)
const currentImage = computed(() =>
  lightboxIndex.value !== null ? props.images[lightboxIndex.value] ?? null : null,
)

function openLightbox(i: number) {
  lightboxIndex.value = i
}
function closeLightbox() {
  lightboxIndex.value = null
}
function showPrev() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value =
    (lightboxIndex.value - 1 + props.images.length) % props.images.length
}
function showNext() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value + 1) % props.images.length
}

function onKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') {
    closeLightbox()
  } else if (e.key === 'ArrowLeft') {
    showPrev()
  } else if (e.key === 'ArrowRight') {
    showNext()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
  }
})
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <div role="region" :aria-label="ariaLabel">
    <div :class="containerClass">
      <button
        v-for="(img, i) in images"
        :key="`${img.src}-${i}`"
        type="button"
        class="mts-masonry-item mb-3 block w-full break-inside-avoid overflow-hidden rounded-sm bg-white transition-transform duration-200 hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent md:mb-4"
        :aria-label="img.alt ? `Открыть: ${img.alt}` : `Открыть изображение ${i + 1}`"
        @click="openLightbox(i)"
      >
        <img
          :src="img.src"
          :alt="img.alt"
          loading="lazy"
          decoding="async"
          class="block h-auto w-full"
        >
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxOpen && currentImage"
        class="fixed inset-0 z-[260] flex items-center justify-center bg-black/85 p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel"
        @click.self="closeLightbox"
      >
        <button
          type="button"
          class="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Закрыть"
          @click="closeLightbox"
        >
          <X class="h-5 w-5" />
        </button>
        <button
          v-if="images.length > 1"
          type="button"
          class="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Предыдущее"
          @click.stop="showPrev"
        >
          <ChevronLeft class="h-5 w-5" />
        </button>
        <button
          v-if="images.length > 1"
          type="button"
          class="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Следующее"
          @click.stop="showNext"
        >
          <ChevronRight class="h-5 w-5" />
        </button>
        <figure class="relative max-h-[90vh] max-w-[90vw]" @click.stop>
          <img
            :src="currentImage.src"
            :alt="currentImage.alt"
            class="block max-h-[90vh] max-w-[90vw] object-contain"
          >
          <figcaption
            v-if="currentImage.alt"
            class="mt-2 text-center font-body text-sm text-white/90"
          >
            {{ currentImage.alt }}
          </figcaption>
        </figure>
        <span
          v-if="images.length > 1"
          class="absolute bottom-4 font-mono text-[11px] uppercase tracking-widest text-white/80"
        >
          {{ (lightboxIndex ?? 0) + 1 }} / {{ images.length }}
        </span>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.mts-masonry-gallery {
  /* CSS columns ведёт себя как Masonry: каждое изображение «тянется» по высоте */
  column-fill: balance;
}
.mts-masonry-item {
  /* break-inside-avoid не всегда работает на старых WebKit без page-break */
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
}
</style>
