import type { LineMarketingSectionId, MarineContentLocale } from '~/types'

/** Маркетинговые страницы линий бизнеса (единая структура JSON, как у крюинга). */
export const LINE_MARKETING_PAGE_SLUGS = [
  'crewing-management',
  'ship-management',
  'lnk',
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
    heroBg: '',
    navI18nKey: 'nav.crewing',
    heroEyebrowI18nKey: 'pages.lineMarketing.crewingHeroEyebrow',
  },
  'ship-management': {
    heroBg: '',
    navI18nKey: 'nav.shipManagement',
    heroEyebrowI18nKey: 'pages.lineMarketing.shipHeroEyebrow',
  },
  lnk: {
    heroBg: '',
    navI18nKey: 'nav.lnk',
    heroEyebrowI18nKey: 'pages.lineMarketing.lnkHeroEyebrow',
  },
}

/** Заголовки страницы в переводах content_pages (админка). */
export const LINE_MARKETING_PAGE_CONTENT_TITLES: Record<
  LineMarketingPageSlug,
  Record<MarineContentLocale, string>
> = {
  'crewing-management': { ru: 'Крюинг-менеджмент', en: 'Crew management' },
  'ship-management': { ru: 'Судовой менеджмент', en: 'Ship management' },
  lnk: { ru: 'ЛНК — неразрушающий контроль', en: 'NDT laboratory (LNK)' },
}

/** Человекочитаемые названия для шапки админки. */
export const LINE_MARKETING_PAGE_ADMIN_LABELS: Record<LineMarketingPageSlug, string> = {
  'crewing-management': 'Крюинг-менеджмент',
  'ship-management': 'Судовой менеджмент',
  lnk: 'ЛНК — неразрушающий контроль',
}

/** Порядок секций по умолчанию (после hero). */
export const LINE_MARKETING_SECTION_DEFAULT_ORDER: LineMarketingSectionId[] = [
  'directions',
  'checklist',
  'principles',
  'audience',
]

/** Подписи секций v2 «Судовой менеджмент» (порядок/видимость в админке). */
export const SHIP_MANAGEMENT_V2_SECTION_ADMIN_LABELS: Record<
  'approach' | 'checklist' | 'services' | 'advantages' | 'trust',
  string
> = {
  approach: 'Почему доверяют МТС',
  checklist: 'Чек-лист',
  services: 'Пакет услуг',
  advantages: 'Преимущества',
  trust: 'Финальный акцент',
}

/** Подписи для админки (порядок и видимость секций). */
export const LINE_MARKETING_SECTION_ADMIN_LABELS: Record<LineMarketingSectionId, string> = {
  directions: 'Направления работы',
  checklist: 'Чек-лист',
  principles: 'Принципы',
  audience: 'Кому подходит + CTA',
  approach: 'Наш подход',
  services: 'Комплекс услуг',
  advantages: 'Преимущества',
  trust: 'Доверие и гарантии',
  cta: 'CTA перед формой',
}
