<script setup lang="ts">
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ListingHeroShell from '~/components/common/ListingHeroShell.vue'
import type { GalleryItem, ListingPageData, MarineContentLocale } from '~/types'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { defaultListingData, mergeListingPageData } from '~/utils/pageDefaults'

useSiteSeoMeta('gallery')

const { t, locale } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const { data: cmsPage } = await useAsyncData('gallery-page-cms', async () => {
  try { return await api.contentPages.getPublicBySlug('gallery-page') } catch { return null }
}, { server: true })

const cms = computed<ListingPageData>(() => {
  const body = cmsPage.value?.body
  if (body) {
    try {
      const p = JSON.parse(body) as unknown
      if (p && typeof p === 'object' && 'hero' in (p as object)) {
        return mergeListingPageData('gallery-page', loc.value, p)
      }
    } catch {
      /* */
    }
  }
  return defaultListingData('gallery-page', loc.value)
})

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.gallery'), to: '/gallery' }),
)

const { data: slides, pending, error } = await useAsyncData(
  () => `gallery-items-${locale.value}`,
  () => api.gallery.getAll(),
  {
    default: () => [] as GalleryItem[],
  },
)

const slidesList = computed(() => slides.value ?? [])
const lightboxIndex = ref<number | null>(null)

const currentSlide = computed(() =>
  lightboxIndex.value !== null ? slidesList.value[lightboxIndex.value] ?? null : null,
)

function openAt(index: number) {
  lightboxIndex.value = index
}

function closeLightbox() {
  lightboxIndex.value = null
}

function showNext() {
  if (lightboxIndex.value === null) {
    return
  }
  const n = slidesList.value.length
  if (n === 0) {
    return
  }
  lightboxIndex.value = (lightboxIndex.value + 1) % n
}

function showPrev() {
  if (lightboxIndex.value === null) {
    return
  }
  const n = slidesList.value.length
  if (n === 0) {
    return
  }
  lightboxIndex.value = (lightboxIndex.value - 1 + n) % n
}

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (lightboxIndex.value === null) {
      return
    }
    if (e.key === 'Escape') {
      closeLightbox()
    }
    if (e.key === 'ArrowRight') {
      showNext()
    }
    if (e.key === 'ArrowLeft') {
      showPrev()
    }
  }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})

watch(lightboxIndex, (v) => {
  if (import.meta.client) {
    document.body.style.overflow = v !== null ? 'hidden' : ''
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <div class="bg-mts-bg">
    <ListingHeroShell :hero-image="cms.heroImage">
      <div class="max-w-3xl">
        <Breadcrumbs :items="crumbItems" />
        <div class="mb-4 flex items-center gap-3">
          <div class="h-px w-6 bg-mts-accent" />
          <span class="section-label">{{ t('pages.gallery.heroEyebrow') }}</span>
        </div>
        <h1 class="font-display mb-6 text-4xl leading-tight text-mts-text lg:text-5xl">
          <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
        </h1>
        <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
        <p class="font-body text-lg leading-relaxed text-mts-text-secondary">
          <ThemedContentString :content="cms.hero.lead" />
        </p>
      </div>
    </ListingHeroShell>

    <section class="relative pb-24 lg:pb-32">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
        </div>
        <p v-else-if="error" class="font-body text-mts-text-secondary text-center py-12">
          {{ t('pages.gallery.loadError') }}
        </p>
        <p v-else-if="slidesList.length === 0" class="font-body text-mts-text-secondary text-center py-12">
          {{ t('pages.gallery.empty') }}
        </p>
        <ul v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <li v-for="(item, index) in slidesList" :key="item.id">
            <button
              type="button"
              class="group relative w-full overflow-hidden border border-mts-border bg-mts-surface shadow-tech text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent focus-visible:ring-offset-2"
              @click="openAt(index)"
            >
              <div class="aspect-[4/3] overflow-hidden bg-mts-bg">
                <img
                  :src="item.src"
                  :alt="item.alt"
                  loading="lazy"
                  decoding="async"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <span
                class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-mts-text/80 to-transparent px-4 pt-12 pb-3 font-body text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                {{ item.alt }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </section>

    <CommonCustomPageSectionsRender :sections="cms.customSections" />

    <CommonPageInquiryForm v-if="cms.showInquiryForm" source-page="gallery" />

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="lightboxIndex !== null && currentSlide"
          class="fixed inset-0 z-[100] flex flex-col bg-mts-text/92 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          :aria-label="t('pages.gallery.lightboxAria')"
        >
          <div class="flex items-center justify-end gap-2 p-4">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white/10"
              :aria-label="t('pages.gallery.close')"
              @click="closeLightbox"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          <div class="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8">
            <button
              type="button"
              class="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white/10 lg:left-6"
              :aria-label="t('pages.gallery.prevPhoto')"
              @click="showPrev"
            >
              <ChevronLeft class="h-7 w-7" />
            </button>
            <figure class="flex max-h-[min(78vh,900px)] max-w-5xl flex-col items-center gap-3 px-10">
              <img
                :src="currentSlide.src"
                :alt="currentSlide.alt"
                class="max-h-[min(72vh,820px)] w-auto max-w-full object-contain"
              />
              <figcaption class="max-w-prose text-center font-body text-sm text-white/80">
                {{ currentSlide.alt }}
              </figcaption>
            </figure>
            <button
              type="button"
              class="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white/10 lg:right-6"
              :aria-label="t('pages.gallery.nextPhoto')"
              @click="showNext"
            >
              <ChevronRight class="h-7 w-7" />
            </button>
          </div>
          <p class="pb-6 text-center font-mono text-[11px] text-white/40">
            {{ lightboxIndex + 1 }} / {{ slidesList.length }}
          </p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
