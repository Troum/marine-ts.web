import type { CrewingPageData, LineMarketingSectionId, MarineContentLocale } from '~/types'

/** Маркетинговые страницы линий бизнеса (единая структура JSON, как у крюинга). */
export const LINE_MARKETING_PAGE_SLUGS = [
  'crewing-management',
  'ship-management',
] as const

export type LineMarketingPageSlug = (typeof LINE_MARKETING_PAGE_SLUGS)[number]

export function isLineMarketingPageSlug(s: string): s is LineMarketingPageSlug {
  return (LINE_MARKETING_PAGE_SLUGS as readonly string[]).includes(s)
}

/** Фон героя, ключи i18n для крошек и подписи над заголовком (не дублировать последний пункт крошек). */
export const LINE_MARKETING_PAGE_LAYOUT: Record<
  LineMarketingPageSlug,
  { heroBg: string; navI18nKey: string; heroEyebrowI18nKey: string }
> = {
  'crewing-management': {
    heroBg: '/hero-crewing-bg.jpeg',
    navI18nKey: 'nav.crewing',
    heroEyebrowI18nKey: 'pages.lineMarketing.crewingHeroEyebrow',
  },
  'ship-management': {
    heroBg: '/images/marin-figma/hero-ship.jpg',
    navI18nKey: 'nav.shipManagement',
    heroEyebrowI18nKey: 'pages.lineMarketing.shipHeroEyebrow',
  },
}

/** Заголовки страницы в переводах content_pages (админка). */
export const LINE_MARKETING_PAGE_CONTENT_TITLES: Record<
  LineMarketingPageSlug,
  Record<MarineContentLocale, string>
> = {
  'crewing-management': { ru: 'Крюинг-менеджмент', en: 'Crew management' },
  'ship-management': { ru: 'Судовой менеджмент', en: 'Ship management' },
}

/** Человекочитаемые названия для шапки админки. */
export const LINE_MARKETING_PAGE_ADMIN_LABELS: Record<LineMarketingPageSlug, string> = {
  'crewing-management': 'Крюинг-менеджмент',
  'ship-management': 'Судовой менеджмент',
}

/** Порядок секций по умолчанию (после hero). */
export const LINE_MARKETING_SECTION_DEFAULT_ORDER: LineMarketingSectionId[] = [
  'directions',
  'checklist',
  'principles',
  'audience',
]

/** Подписи для админки (порядок и видимость секций). */
export const LINE_MARKETING_SECTION_ADMIN_LABELS: Record<LineMarketingSectionId, string> = {
  directions: 'Направления работы',
  checklist: 'Чек-лист',
  principles: 'Принципы',
  audience: 'Кому подходит + CTA',
}
