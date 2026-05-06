import type {
  ContentPageTranslationPayload,
  MarineContentLocale,
  NewsTranslationPayload,
  ProjectTranslationPayload,
  ServiceTranslationPayload,
  SiteSeoTranslationPayload,
  VacancyTranslationPayload,
} from '~/types'
import { MARINE_CONTENT_LOCALES } from '~/utils/marineLocales'

export function emptyNewsTranslation(): NewsTranslationPayload {
  return {
    title: '',
    excerpt: '',
    content: '',
    category: 'Компания',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoImage: '',
  }
}

export function emptyVacancyTranslation(): VacancyTranslationPayload {
  return {
    title: '',
    excerpt: '',
    content: '',
    requirements: [],
    location: '',
    employmentType: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoImage: '',
  }
}

export function emptyServiceTranslation(): ServiceTranslationPayload {
  return {
    title: '',
    description: '',
    features: [],
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoImage: '',
  }
}

export function emptyProjectTranslation(): ProjectTranslationPayload {
  return {
    title: '',
    typeLabel: '',
    location: '',
    description: '',
    stats: {},
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoImage: '',
  }
}

export function emptyContentPageTranslation(): ContentPageTranslationPayload {
  return {
    title: '',
    excerpt: '',
    body: '<p></p>',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoImage: '',
  }
}

export function emptySiteSeoTranslation(): SiteSeoTranslationPayload {
  return {
    label: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoImage: '',
  }
}

/** Гарантирует объекты для ru/en; подмешивает данные из API. */
export function mergeNewsTranslations(
  fromApi?: Partial<Record<MarineContentLocale, NewsTranslationPayload>>,
): Record<MarineContentLocale, NewsTranslationPayload> {
  const out = {} as Record<MarineContentLocale, NewsTranslationPayload>
  for (const loc of MARINE_CONTENT_LOCALES) {
    out[loc] = { ...emptyNewsTranslation(), ...fromApi?.[loc] }
  }
  return out
}

export function mergeVacancyTranslations(
  fromApi?: Partial<Record<MarineContentLocale, VacancyTranslationPayload>>,
): Record<MarineContentLocale, VacancyTranslationPayload> {
  const out = {} as Record<MarineContentLocale, VacancyTranslationPayload>
  for (const loc of MARINE_CONTENT_LOCALES) {
    const raw = fromApi?.[loc]
    out[loc] = {
      ...emptyVacancyTranslation(),
      ...raw,
      requirements: raw?.requirements?.length ? [...raw.requirements] : [],
    }
  }
  return out
}

export function mergeServiceTranslations(
  fromApi?: Partial<Record<MarineContentLocale, ServiceTranslationPayload>>,
): Record<MarineContentLocale, ServiceTranslationPayload> {
  const out = {} as Record<MarineContentLocale, ServiceTranslationPayload>
  for (const loc of MARINE_CONTENT_LOCALES) {
    const raw = fromApi?.[loc]
    out[loc] = {
      ...emptyServiceTranslation(),
      ...raw,
      features: raw?.features?.length ? [...raw.features] : [],
    }
  }
  return out
}

export function mergeProjectTranslations(
  fromApi?: Partial<Record<MarineContentLocale, ProjectTranslationPayload>>,
): Record<MarineContentLocale, ProjectTranslationPayload> {
  const out = {} as Record<MarineContentLocale, ProjectTranslationPayload>
  for (const loc of MARINE_CONTENT_LOCALES) {
    const raw = fromApi?.[loc]
    out[loc] = {
      ...emptyProjectTranslation(),
      ...raw,
      stats: raw?.stats && Object.keys(raw.stats).length ? { ...raw.stats } : {},
    }
  }
  return out
}

export function mergeContentPageTranslations(
  fromApi?: Partial<Record<MarineContentLocale, ContentPageTranslationPayload>>,
): Record<MarineContentLocale, ContentPageTranslationPayload> {
  const out = {} as Record<MarineContentLocale, ContentPageTranslationPayload>
  for (const loc of MARINE_CONTENT_LOCALES) {
    out[loc] = { ...emptyContentPageTranslation(), ...fromApi?.[loc] }
  }
  return out
}

export function mergeSiteSeoTranslations(
  fromApi?: Partial<Record<MarineContentLocale, SiteSeoTranslationPayload>>,
): Record<MarineContentLocale, SiteSeoTranslationPayload> {
  const out = {} as Record<MarineContentLocale, SiteSeoTranslationPayload>
  for (const loc of MARINE_CONTENT_LOCALES) {
    out[loc] = { ...emptySiteSeoTranslation(), ...fromApi?.[loc] }
  }
  return out
}

export function galleryAltTranslations(
  fromApi?: Partial<Record<MarineContentLocale, { alt: string }>>,
  fallbackAlt = '',
): Record<MarineContentLocale, { alt: string }> {
  const out = {} as Record<MarineContentLocale, { alt: string }>
  for (const loc of MARINE_CONTENT_LOCALES) {
    out[loc] = { alt: fromApi?.[loc]?.alt ?? fallbackAlt }
  }
  return out
}
