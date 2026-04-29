import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import MasonryImageGallery from '~/components/common/MasonryImageGallery.vue'
import {
  isSafeCarouselImgSrc,
  MTS_RICH_GALLERY_COLUMNS,
} from '~/utils/tiptapMtsRichLayout'

const mountedApps = new Set<App>()

interface GalleryImage {
  src: string
  alt: string
}

function teardownGalleries() {
  for (const app of mountedApps) {
    app.unmount()
  }
  mountedApps.clear()
}

function collectImages(el: HTMLElement): GalleryImage[] {
  const out: GalleryImage[] = []
  for (const img of el.querySelectorAll('img')) {
    const src = img.getAttribute('src')?.trim() ?? ''
    const alt = img.getAttribute('alt')?.trim() ?? ''
    if (src && isSafeCarouselImgSrc(src)) {
      out.push({ src, alt })
    }
  }
  return out
}

function readColumns(el: HTMLElement): number {
  const raw = el.getAttribute('data-gallery-cols')
  const n = raw != null && raw !== '' ? Number(raw) : 3
  if (!Number.isFinite(n)) {
    return 3
  }
  const found = (MTS_RICH_GALLERY_COLUMNS as readonly number[]).find(
    (c) => c === Math.round(n),
  )
  return found ?? 3
}

function hydrateGalleries(root: Document | HTMLElement) {
  root
    .querySelectorAll<HTMLElement>('[data-mts-rich-gallery]:not([data-mts-gallery-mounted])')
    .forEach((el) => {
      const images = collectImages(el)
      if (images.length === 0) {
        el.setAttribute('data-mts-gallery-mounted', '')
        return
      }
      const columns = readColumns(el)
      const ariaLabel =
        el.getAttribute('data-gallery-label')?.trim() || 'Галерея изображений'
      el.innerHTML = ''
      const app = createApp(MasonryImageGallery, {
        images,
        columns,
        ariaLabel,
      })
      app.mount(el)
      el.setAttribute('data-mts-gallery-mounted', '')
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
      teardownGalleries()
      nextTick(() => {
        hydrateGalleries(document)
      })
    }, 80)
  }

  nuxtApp.hook('page:finish', schedule)
  nuxtApp.hook('app:mounted', schedule)
})
