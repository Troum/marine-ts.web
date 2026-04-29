<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import ImageFadeCarousel from '~/components/common/ImageFadeCarousel.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import Breadcrumbs, { type BreadcrumbItem } from '~/components/common/Breadcrumbs.vue'
import { contentBodyToSafeHtml } from '~/composables/useMarkdownSafeHtml'
import type { CustomPageBlock, PageBreadcrumbTone } from '~/types'
import type { AboutCarouselSlide } from '~/utils/aboutCarouselSlides'
import { resolveCrewingIcon } from '~/utils/crewingIcons'
import { isHeroImageBlockActive } from '~/utils/customPageSections'
import { resolveHeroImageBreadcrumbOnDark } from '~/utils/pageBreadcrumbTone'

const props = defineProps<{
  block: CustomPageBlock
  /** Если задан — будет использован для построения ссылки в карточке. */
  resolveDetailHref?: (detailSlug: string) => string | null
  /** Палитра крошек над первым баннером секции (только при непустом `pageCrumbItems`). */
  heroImageBreadcrumbTone?: PageBreadcrumbTone | null
  pageCrumbItems?: BreadcrumbItem[]
}>()

const { t } = useI18n()

const directionCardClass =
  'service-card corner-accent p-8'

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

const showHeroBannerCrumbs = computed(
  () =>
    isHeroImageBlockActive(props.block) &&
    !!props.heroImageBreadcrumbTone &&
    (props.pageCrumbItems?.length ?? 0) > 0,
)

const heroBannerCrumbsOnDark = computed(() => {
  const b = props.block
  if (!isHeroImageBlockActive(b) || !props.heroImageBreadcrumbTone) {
    return false
  }
  return resolveHeroImageBreadcrumbOnDark(props.heroImageBreadcrumbTone, b.overlayOpacity)
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

function marketingCardsGridClass(block: CustomPageBlock): string {
  if (block.type !== 'cards') {
    return ''
  }
  const n = Math.min(6, Math.max(1, Math.round(block.columns ?? 3)))
  const base = 'grid gap-6'
  if (n === 1) {
    return `${base} grid-cols-1`
  }
  if (n === 2) {
    return `${base} md:grid-cols-2`
  }
  if (n === 3) {
    return `${base} md:grid-cols-2 lg:grid-cols-3`
  }
  if (n === 4) {
    return `${base} md:grid-cols-2 lg:grid-cols-4`
  }
  if (n === 5) {
    return `${base} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5`
  }
  return `${base} sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6`
}

function marketingCardsItemAlignClass(block: CustomPageBlock): string {
  return block.type === 'cards' && block.itemsAlign === 'center' ? 'text-center' : ''
}

function marketingCardsIconClass(block: CustomPageBlock): string {
  const base = 'mb-4 h-8 w-8 text-primary'
  return block.type === 'cards' && block.itemsAlign === 'center' ? `${base} mx-auto` : base
}
</script>

<template>
  <!-- Cards -->
  <div v-if="block.type === 'cards'" :class="marketingCardsGridClass(block)">
    <template v-for="(item, cidx) in block.items" :key="`c-${cidx}`">
      <NuxtLink
        v-if="detailHref(item.detailSlug)"
        :to="detailHref(item.detailSlug)!"
        :class="[
          directionCardClass,
          marketingCardsItemAlignClass(block),
          'group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mts-accent',
        ]"
      >
      >
      >
        <component
          :is="resolveCrewingIcon(item.icon)"
          v-if="!item.hideIcon"
          :class="marketingCardsIconClass(block)"
        />
        <h3 class="font-display mb-3 text-xl text-body"><ThemedContentString :content="item.title" /></h3>
        <p class="font-body text-sm leading-relaxed text-muted">
          <ThemedContentString :content="item.text" />
        </p>
        <span class="mts-cta-link-compact mt-5 inline-flex">
          {{ t('pages.common.readMore') }} →
        </span>
      </NuxtLink>
      <div v-else :class="[directionCardClass, marketingCardsItemAlignClass(block)]">
        <component
          :is="resolveCrewingIcon(item.icon)"
          v-if="!item.hideIcon"
          :class="marketingCardsIconClass(block)"
        />
        <h3 class="font-display mb-3 text-xl text-body"><ThemedContentString :content="item.title" /></h3>
        <p class="font-body text-sm leading-relaxed text-muted">
          <ThemedContentString :content="item.text" />
        </p>
      </div>
    </template>
  </div>

  <!-- Text -->
  <div v-else-if="block.type === 'text'" class="mx-auto max-w-7xl text-center">
    <h3 v-if="block.title.trim()" class="font-display mb-2 text-xl text-body">
      <ThemedContentString :content="block.title" />
    </h3>
    <p
      v-if="block.subtitle.trim()"
      class="mb-6 font-mono text-xs uppercase tracking-wide text-primary"
    >
      <ThemedContentString :content="block.subtitle" />
    </p>
    <div
      v-if="block.description.trim()"
      class="mts-markdown text-left font-body leading-relaxed text-muted"
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
        class="mts-markdown font-body leading-relaxed text-muted"
        v-html="leftHtml(block.leftText)"
      />
    </div>
    <div class="min-w-0">
      <div v-if="block.rightMode === 'slider' && toSlides(block.images).length > 0" class="w-full">
        <ImageFadeCarousel :slides="toSlides(block.images)" aria-label="Галерея" />
      </div>
      <div
        v-else-if="block.images[0]?.trim()"
        class="service-card relative aspect-[4/3] w-full overflow-hidden"
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

  <!-- Hero image: высота 50vh, на всю ширину секции; крошки и заголовки в одной колонке `mts-content-wrap`, слева. -->
  <div
    v-else-if="isHeroImageBlockActive(block)"
    class="relative h-[50vh] max-h-[50vh] min-h-[50vh] w-full overflow-hidden"
  >
    <CommonParallaxHeroMedia :image="block.imageUrl.trim()" />
    <div
      v-if="block.overlayOpacity > 0"
      class="absolute inset-0 z-[1] bg-black"
      :style="{ opacity: Math.min(100, Math.max(0, block.overlayOpacity)) / 100 }"
    />
    <div
      v-if="showHeroBannerCrumbs || block.title.trim() || block.caption.trim()"
      class="relative z-10 flex h-full min-h-0 w-full flex-col"
    >
      <div
        class="mts-content-wrap flex min-h-0 flex-1 flex-col justify-end pt-20 pb-14 md:pt-24 md:pb-16 lg:pb-[4.5rem]"
      >
        <Breadcrumbs
          v-if="showHeroBannerCrumbs"
          class="!mb-0 shrink-0"
          :items="pageCrumbItems!"
          :on-dark-hero="heroBannerCrumbsOnDark"
        />
        <div
          v-if="block.title.trim() || block.caption.trim()"
          :class="[
            'flex max-w-4xl flex-col items-start text-left text-white',
            showHeroBannerCrumbs ? 'mt-3 md:mt-4' : '',
          ]"
        >
          <h3
            v-if="block.title.trim()"
            class="font-display text-2xl font-bold leading-[1.1] [text-wrap:pretty] sm:text-3xl md:text-4xl lg:text-5xl"
          >
            <ThemedContentString :content="block.title" />
          </h3>
          <p
            v-if="block.caption.trim()"
            class="mt-3 max-w-3xl font-body text-base leading-relaxed text-white/90 sm:mt-4 sm:text-lg md:mt-5 md:text-xl lg:text-2xl"
          >
            <ThemedContentString :content="block.caption" />
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Gallery -->
  <div v-else-if="block.type === 'gallery'">
    <h3 v-if="block.title.trim()" class="font-display mb-6 text-center text-xl text-body">
      <ThemedContentString :content="block.title" />
    </h3>
    <div :class="['grid gap-4', galleryGridClass]">
      <template v-for="(url, gi) in block.images.filter((u) => u && u.trim())" :key="`g-${gi}`">
        <div class="service-card relative aspect-[4/3] w-full overflow-hidden">
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
  <div v-else-if="block.type === 'accordion'" class="mx-auto max-w-7xl">
    <h3 v-if="block.title.trim()" class="font-display mb-6 text-center text-xl text-body">
      <ThemedContentString :content="block.title" />
    </h3>
    <ul class="space-y-2">
      <li
        v-for="(it, ai) in block.items"
        :key="`a-${ai}`"
        class="card-tech overflow-hidden"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-body text-base text-body"
          :aria-expanded="isAccordionOpen(ai)"
          @click="toggleAccordionAt(ai)"
        >
          <span class="min-w-0 flex-1">
            <ThemedContentString :content="it.question" />
          </span>
          <ChevronDown
            class="h-5 w-5 shrink-0 text-muted transition-transform"
            :class="{ 'rotate-180': isAccordionOpen(ai) }"
          />
        </button>
        <div
          v-show="isAccordionOpen(ai)"
          class="mts-markdown border-t border-border bg-white px-5 py-4 font-body text-sm leading-relaxed text-muted"
          v-html="leftHtml(it.answer)"
        />
      </li>
    </ul>
  </div>

  <!-- HTML / Markdown -->
  <div
    v-else-if="block.type === 'htmlMarkdown'"
    :class="block.align === 'center' ? 'mx-auto max-w-7xl text-center' : 'max-w-7xl'"
  >
    <h3 v-if="block.title.trim()" class="font-display mb-4 text-xl text-body">
      <ThemedContentString :content="block.title" />
    </h3>
    <div
      v-if="block.content.trim()"
      class="mts-markdown font-body leading-relaxed text-muted"
      :class="block.align === 'center' ? 'mx-auto max-w-3xl text-center' : 'text-left'"
      v-html="leftHtml(block.content)"
    />
  </div>
</template>
