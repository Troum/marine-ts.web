export type AboutCarouselSlide = {
  src: string
  alt: string
}

/**
 * Кадры карусели «О компании» на главной. По умолчанию пусто — изображения задаются в CMS
 * или добавляются сюда вручную при необходимости.
 */
export const aboutCarouselSlides: AboutCarouselSlide[] = []

export const ABOUT_CAROUSEL_INTERVAL_MS = 6000
