import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import ImageFadeCarousel from '~/components/common/ImageFadeCarousel.vue'
import type { AboutCarouselSlide } from '~/utils/aboutCarouselSlides'
import { isSafeCarouselImgSrc } from '~/utils/tiptapMtsRichLayout'

const mountedApps = new Set<App>()

function teardownCarousels() {
  for (const app of mountedApps) {
    app.unmount()
  }
  mountedApps.clear()
}

function collectSlides(el: HTMLElement): AboutCarouselSlide[] {
  const slides: AboutCarouselSlide[] = []
  for (const img of el.querySelectorAll('img')) {
    const src = img.getAttribute('src')?.trim() ?? ''
    const alt = img.getAttribute('alt')?.trim() ?? ''
    if (src && isSafeCarouselImgSrc(src)) {
      slides.push({ src, alt })
    }
  }
  return slides
}

function hydrateCarousels(root: Document | HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-mts-rich-carousel]:not([data-mts-carousel-mounted])').forEach((el) => {
    const slides = collectSlides(el)
    if (slides.length === 0) {
      el.setAttribute('data-mts-carousel-mounted', '')
      return
    }
    const intervalRaw = el.getAttribute('data-interval-ms')
    const parsed = intervalRaw != null && intervalRaw !== '' ? Number(intervalRaw) : 6000
    const intervalMs =
      Number.isFinite(parsed) && parsed >= 2000 && parsed <= 120000 ? parsed : 6000
    const showDots = el.getAttribute('data-show-dots') !== 'false'
    const ariaLabel = el.getAttribute('data-carousel-label')?.trim() || 'Галерея изображений'
    el.innerHTML = ''
    const app = createApp(ImageFadeCarousel, {
      slides,
      intervalMs,
      showDots,
      ariaLabel,
    })
    app.mount(el)
    el.setAttribute('data-mts-carousel-mounted', '')
    mountedApps.add(app)
  })
}

export default defineNuxtPlugin((nuxtApp) => {
  let debounceId: ReturnType<typeof setTimeout> | undefined

  const schedule = () => {
    if (debounceId != null) {
      clearTimeout(debounceId)
    }
    debounceId = setTimeout(() => {
      debounceId = undefined
      teardownCarousels()
      nextTick(() => {
        hydrateCarousels(document)
      })
    }, 80)
  }

  nuxtApp.hook('page:finish', schedule)
  nuxtApp.hook('app:mounted', schedule)
})
