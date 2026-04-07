export type AboutCarouselSlide = {
  src: string
  alt: string
}

/** Единый набор кадров для блока «О компании» на главной и на странице /about */
export const aboutCarouselSlides: AboutCarouselSlide[] = [
  { src: '/about-workshop.jpg', alt: 'Сварочные работы в мастерской' },
  { src: '/images/services/hull.jpg', alt: 'Ремонт корпуса и палубного оборудования' },
  { src: '/images/services/electro.jpg', alt: 'Электротехнические работы на судне' },
  { src: '/images/services/general.jpg', alt: 'Техническое обслуживание судового оборудования' },
]

export const ABOUT_CAROUSEL_INTERVAL_MS = 6000
