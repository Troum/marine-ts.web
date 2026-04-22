<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import ImageFadeCarousel from '~/components/common/ImageFadeCarousel.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { contentBodyToSafeHtml } from '~/composables/useMarkdownSafeHtml'
import type { CustomPageBlock } from '~/types'
import type { AboutCarouselSlide } from '~/utils/aboutCarouselSlides'
import { resolveCrewingIcon } from '~/utils/crewingIcons'

const props = defineProps<{
  block: CustomPageBlock
  /** Если задан — будет использован для построения ссылки в карточке. */
  resolveDetailHref?: (detailSlug: string) => string | null
}>()

const { t } = useI18n()

const directionCardClass =
  'card-tech border border-mts-border p-8 transition-colors hover:border-mts-accent/40'

function detailHref(detailSlug?: string): string | null {
  const s = detailSlug?.trim()
  if (!s) {
    return null
  }
  if (props.resolveDetailHref) {
    return props.resolveDetailHref(s)
  }
  return null
}

function splitGridStyle(leftPct: number): { gridTemplateColumns: string } {
  const L = Math.min(90, Math.max(10, Math.round(leftPct)))
  const R = 100 - L
  return { gridTemplateColumns: `minmax(0, ${L}fr) minmax(0, ${R}fr)` }
}

function toSlides(urls: string[]): AboutCarouselSlide[] {
  return urls.map((u) => u.trim()).filter(Boolean).map((src) => ({ src, alt: '' }))
}

function leftHtml(md: string): string {
  return contentBodyToSafeHtml(md.trim() || '')
}

const heroHeightClass = computed(() => {
  if (props.block.type !== 'heroImage') {
    return ''
  }
  switch (props.block.height) {
    case 'small':
      return 'h-[280px]'
    case 'large':
      return 'h-[560px]'
    default:
      return 'h-[420px]'
  }
})

const galleryGridClass = computed(() => {
  if (props.block.type !== 'gallery') {
    return ''
  }
  const c = Math.min(4, Math.max(1, props.block.columns))
  switch (c) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-1 sm:grid-cols-2'
    case 4:
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    default:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  }
})

const accordionOpen = ref<Set<number>>(new Set())
function toggleAccordionAt(idx: number) {
  if (accordionOpen.value.has(idx)) {
    accordionOpen.value.delete(idx)
  } else {
    accordionOpen.value.add(idx)
  }
  accordionOpen.value = new Set(accordionOpen.value)
}
function isAccordionOpen(idx: number): boolean {
  return accordionOpen.value.has(idx)
}
</script>

<template>
  <!-- Cards -->
  <div v-if="block.type === 'cards'" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <template v-for="(item, cidx) in block.items" :key="`c-${cidx}`">
      <NuxtLink
        v-if="detailHref(item.detailSlug)"
        :to="detailHref(item.detailSlug)!"
        :class="[
          directionCardClass,
          'group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mts-accent',
        ]"
      >
        <component
          :is="resolveCrewingIcon(item.icon)"
          v-if="!item.hideIcon"
          class="mb-4 h-8 w-8 text-mts-accent"
        />
        <h3 class="font-display mb-3 text-xl text-mts-text"><ThemedContentString :content="item.title" /></h3>
        <p class="font-body text-sm leading-relaxed text-mts-text-secondary">
          <ThemedContentString :content="item.text" />
        </p>
        <span class="mts-cta-link-compact mt-5 inline-flex">
          {{ t('pages.common.readMore') }} →
        </span>
      </NuxtLink>
      <div v-else :class="directionCardClass">
        <component
          :is="resolveCrewingIcon(item.icon)"
          v-if="!item.hideIcon"
          class="mb-4 h-8 w-8 text-mts-accent"
        />
        <h3 class="font-display mb-3 text-xl text-mts-text"><ThemedContentString :content="item.title" /></h3>
        <p class="font-body text-sm leading-relaxed text-mts-text-secondary">
          <ThemedContentString :content="item.text" />
        </p>
      </div>
    </template>
  </div>

  <!-- Text -->
  <div v-else-if="block.type === 'text'" class="mx-auto max-w-3xl text-center">
    <h3 v-if="block.title.trim()" class="font-display mb-2 text-2xl text-mts-text">
      <ThemedContentString :content="block.title" />
    </h3>
    <p
      v-if="block.subtitle.trim()"
      class="mb-6 font-mono text-xs uppercase tracking-wide text-mts-accent"
    >
      <ThemedContentString :content="block.subtitle" />
    </p>
    <div
      v-if="block.description.trim()"
      class="mts-markdown text-left font-body leading-relaxed text-mts-text-secondary"
      v-html="leftHtml(block.description)"
    />
  </div>

  <!-- Split -->
  <div
    v-else-if="block.type === 'split'"
    class="grid items-start gap-6 lg:gap-8"
    :style="splitGridStyle(block.leftWidthPercent)"
  >
    <div class="min-w-0">
      <div
        v-if="block.leftText.trim()"
        class="mts-markdown font-body leading-relaxed text-mts-text-secondary"
        v-html="leftHtml(block.leftText)"
      />
    </div>
    <div class="min-w-0">
      <div v-if="block.rightMode === 'slider' && toSlides(block.images).length > 0" class="w-full">
        <ImageFadeCarousel :slides="toSlides(block.images)" aria-label="Галерея" />
      </div>
      <div
        v-else-if="block.images[0]?.trim()"
        class="relative aspect-[4/3] w-full overflow-hidden bg-mts-bg"
      >
        <img
          :src="block.images[0].trim()"
          alt=""
          class="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  </div>

  <!-- Hero image -->
  <div
    v-else-if="block.type === 'heroImage' && block.imageUrl.trim()"
    :class="['relative w-full overflow-hidden bg-mts-bg', heroHeightClass]"
  >
    <img
      :src="block.imageUrl.trim()"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
      decoding="async"
    />
    <div
      v-if="block.overlayOpacity > 0"
      class="absolute inset-0 bg-black"
      :style="{ opacity: Math.min(100, Math.max(0, block.overlayOpacity)) / 100 }"
    />
    <div
      v-if="block.title.trim() || block.caption.trim()"
      class="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center text-white"
    >
      <h3 v-if="block.title.trim()" class="font-display text-2xl md:text-3xl">
        <ThemedContentString :content="block.title" />
      </h3>
      <p v-if="block.caption.trim()" class="mt-3 max-w-2xl font-body text-sm md:text-base">
        <ThemedContentString :content="block.caption" />
      </p>
    </div>
  </div>

  <!-- Gallery -->
  <div v-else-if="block.type === 'gallery'">
    <h3 v-if="block.title.trim()" class="font-display mb-6 text-center text-2xl text-mts-text">
      <ThemedContentString :content="block.title" />
    </h3>
    <div :class="['grid gap-4', galleryGridClass]">
      <template v-for="(url, gi) in block.images.filter((u) => u && u.trim())" :key="`g-${gi}`">
        <div class="relative aspect-[4/3] w-full overflow-hidden bg-mts-bg">
          <img
            :src="url.trim()"
            alt=""
            class="h-full w-full object-cover transition-transform hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </div>
      </template>
    </div>
  </div>

  <!-- Accordion -->
  <div v-else-if="block.type === 'accordion'" class="mx-auto max-w-3xl">
    <h3 v-if="block.title.trim()" class="font-display mb-6 text-center text-2xl text-mts-text">
      <ThemedContentString :content="block.title" />
    </h3>
    <ul class="space-y-2">
      <li
        v-for="(it, ai) in block.items"
        :key="`a-${ai}`"
        class="border border-mts-border bg-mts-surface"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-body text-base text-mts-text"
          :aria-expanded="isAccordionOpen(ai)"
          @click="toggleAccordionAt(ai)"
        >
          <span class="min-w-0 flex-1">
            <ThemedContentString :content="it.question" />
          </span>
          <ChevronDown
            class="h-5 w-5 shrink-0 text-mts-text-secondary transition-transform"
            :class="{ 'rotate-180': isAccordionOpen(ai) }"
          />
        </button>
        <div
          v-show="isAccordionOpen(ai)"
          class="mts-markdown border-t border-mts-border bg-mts-bg px-5 py-4 font-body text-sm leading-relaxed text-mts-text-secondary"
          v-html="leftHtml(it.answer)"
        />
      </li>
    </ul>
  </div>

  <!-- HTML / Markdown -->
  <div
    v-else-if="block.type === 'htmlMarkdown'"
    :class="block.align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'"
  >
    <h3 v-if="block.title.trim()" class="font-display mb-4 text-2xl text-mts-text">
      <ThemedContentString :content="block.title" />
    </h3>
    <div
      v-if="block.content.trim()"
      class="mts-markdown font-body leading-relaxed text-mts-text-secondary"
      :class="block.align === 'center' ? 'text-left' : ''"
      v-html="leftHtml(block.content)"
    />
  </div>
</template>
