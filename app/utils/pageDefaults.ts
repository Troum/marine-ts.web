import type {
  HomePageData,
  ListingPageData,
  ProjectsPageData,
  ContactsPageData,
  CrewingChecklistBlock,
  CrewingChecklistPoint,
  CrewingChecklistSection,
  CrewingDirectionItem,
  CrewingPageData,
  LineMarketingCardItem,
  LineMarketingCardsBlock,
  LineMarketingContentBlock,
  LineMarketingCustomSection,
  LineMarketingHeroButton,
  LineMarketingSectionId,
  LineMarketingSplitBlock,
  LineMarketingTextBlock,
  MarineContentLocale,
} from '~/types'
import { stripHtmlToPlain } from '~/utils/adminHtmlField'
import { normalizeCustomPageSections } from '~/utils/customPageSections'
import { emptyLineMarketingLegacyPageData } from '~/utils/extraLinePageDefaults'
import { parseStoredPageBreadcrumbTone } from '~/utils/pageBreadcrumbTone'
import {
  CREWING_MANAGEMENT_V2_SECTION_ORDER,
  defaultCrewingManagementContent,
  mergeCrewingManagementContent,
} from '~/utils/crewingManagementPageDefaults'
import {
  defaultLnkManagementContent,
  LNK_V2_SECTION_ORDER,
  mergeLnkManagementContent,
} from '~/utils/lnkManagementPageDefaults'
import {
  defaultShipManagementContent,
  mergeShipManagementContent,
  SHIP_MANAGEMENT_V2_SECTION_ORDER,
} from '~/utils/shipManagementPageDefaults'
import {
  defaultServicesPageLegacyListingData,
  defaultServicesPageListingData,
  mergeServicesMarketingContent,
  SERVICES_MARKETING_V2_SECTION_ORDER,
  servicesPageDataIsLegacy,
} from '~/utils/servicesMarketingPageDefaults'
import type { LineMarketingPageSlug } from '~/utils/lineMarketingPages'
import { LINE_MARKETING_SECTION_DEFAULT_ORDER } from '~/utils/lineMarketingPages'
import {
  emptyThemeTitle,
  mergeContactsHero,
  mergeCrewingHero,
  mergeFunnelCrewing,
  mergeFunnelShip,
  mergeFunnelTechnical,
  mergeHomeAboutPreview,
  mergeHomeCTA,
  mergeHomeDirectionsSection,
  mergeHomeHero,
  mergeHomeProcessSection,
  mergeHomeServicesSection,
  mergeHomeTrustStrip,
  mergeListingHero,
  migrateHomeHeroLegacy,
  themeTitlePair,
  themeTitleTriple,
} from '~/utils/themeFormattedTitle'
import { normalizePageInquiryFormConfig } from '~/utils/pageInquiryFormOptions'

const HOME_HERO_OVERLAY_DEFAULT: NonNullable<HomePageData['heroOverlayRow']> = {
  enabled: false,
  socialLinks: [],
  links: [],
  showLanguageSwitch: true,
}

/* ── Home page: без демо на публичном сайте (контент из CMS) ── */

/**
 * Встроенные секции главной полностью убраны: на сайте остаются только
 * hero, секция «Чем мы занимаемся» (`directions`) и пользовательские
 * секции (`customSections`). Поэтому дефолтный порядок встроенных секций
 * пуст — массив используется только как «список известных id» при слиянии.
 *
 * Оставляем экспорт пустым массивом (а не удаляем символ), чтобы любые
 * внешние ссылки на него не сломались, а `mergeSectionVisibility` для
 * главной возвращал чистую карту видимости только по кастомным секциям.
 */
export const HOME_SECTION_DEFAULT_ORDER = [] as const

export type HomeSectionId = never

export const HOME_SECTION_ADMIN_LABELS: Record<string, string> = {}

function createEmptyHomePageData(_locale: MarineContentLocale): HomePageData {
  const blank = themeTitleTriple('', '', '')
  /*
   * Дефолтная видимость встроенных секций — все «показываются».
   * Это критично, чтобы чекбокс «Показывать» в админке стартовал в состоянии
   * «✓» (а не выглядел как «выключено», хотя на сайте секция отрисовывается):
   * checkbox-биндинг строится на `props.visible === true`, поэтому пустая
   * `sectionVisibility` ранее давала визуальную рассинхронизацию.
   */
  const sectionVisibility: Record<string, boolean> = {}
  for (const k of HOME_SECTION_DEFAULT_ORDER) {
    sectionVisibility[k] = true
  }
  return {
    hero: {
      label: '',
      titleFormatted: migrateHomeHeroLegacy('', '', ''),
      lead: '',
      marketingSlides: [],
      marketingAutoplayMs: 0,
      ctaClient: '',
      ctaClientHref: '/request',
      ctaSeafarer: '',
      ctaSeafarerHref: '/application-form',
      scroll: '',
    },
    statsCard: { label: '', items: [] },
    showStatsCard: false,
    funnelShip: { label: '', titleFormatted: blank, text: '', cta: '', href: '/' },
    funnelCrewing: {
      label: '',
      titleFormatted: blank,
      text: '',
      cta: '',
      href: '/',
      secondaryCta: '',
      secondaryHref: '/',
    },
    funnelTechnical: { label: '', titleFormatted: blank, text: '', cta: '', href: '/services' },
    directions: { label: '', headingFormatted: blank, rows: [] },
    about: {
      label: '',
      title: '',
      titleFormatted: blank,
      subtitle: '',
      lead: '',
      lead2: '',
      more: '',
    },
    trust: { label: '', titleFormatted: themeTitlePair('', ''), bullets: [] },
    services: { label: '', headingFormatted: blank, all: '', more: '', featuredServiceIds: [] },
    process: { label: '', headingFormatted: themeTitlePair('', ''), steps: [] },
    cta: { label: '', titleFormatted: themeTitlePair('', ''), text: '', button: '' },
    showProcess: false,
    showInquiryForm: false,
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    inquiryForm: normalizePageInquiryFormConfig(undefined),
    heroImage: '',
    heroVideo: '',
    sectionVisibility,
    heroOverlayRow: { ...HOME_HERO_OVERLAY_DEFAULT },
  }
}

export { HOME_HERO_OVERLAY_DEFAULT }

const HOME_DEFAULTS: Record<MarineContentLocale, HomePageData> = {
  ru: createEmptyHomePageData('ru'),
  en: createEmptyHomePageData('en'),
}

export function defaultHomeData(locale: MarineContentLocale): HomePageData {
  return JSON.parse(JSON.stringify(HOME_DEFAULTS[locale]))
}

/** Слияние сохранённого JSON главной с актуальной структурой (обратная совместимость). */
export function mergeHomePageData(locale: MarineContentLocale, parsed: Partial<HomePageData> | null): HomePageData {
  const def = defaultHomeData(locale)
  if (!parsed) {
    return def
  }
  const ps = parsed.services as Record<string, unknown> | undefined
  const withoutLegacyCards = ps
    ? (Object.fromEntries(Object.entries(ps).filter(([k]) => k !== 'cards')) as Partial<HomePageData['services']>)
    : {}
  const servicesMerged = mergeHomeServicesSection(parsed.services, def.services)
  const customSections = normalizeCustomPageSections(parsed.customSections)
  const sectionOrder = mergeSectionOrder(
    parsed.sectionOrder,
    customSections.map((s) => s.id),
    HOME_SECTION_DEFAULT_ORDER,
  )
  const sectionVisibility = mergeSectionVisibility(mergeHomeSavedVisibility(parsed), sectionOrder)
  return {
    ...def,
    ...parsed,
    hero: mergeHomeHero(parsed.hero, def.hero),
    funnelShip: mergeFunnelShip(parsed.funnelShip, def.funnelShip),
    funnelCrewing: {
      ...mergeFunnelCrewing(parsed.funnelCrewing, def.funnelCrewing),
      secondaryCta: parsed.funnelCrewing?.secondaryCta ?? def.funnelCrewing.secondaryCta,
      secondaryHref: parsed.funnelCrewing?.secondaryHref ?? def.funnelCrewing.secondaryHref,
    },
    funnelTechnical: mergeFunnelTechnical(parsed.funnelTechnical, def.funnelTechnical),
    directions: mergeHomeDirectionsSection(parsed.directions, def.directions),
    trust: mergeHomeTrustStrip(parsed.trust, def.trust),
    about: mergeHomeAboutPreview(parsed.about, def.about),
    services: {
      ...servicesMerged,
      ...withoutLegacyCards,
      headingFormatted: servicesMerged.headingFormatted,
      featuredServiceIds: servicesMerged.featuredServiceIds,
    },
    process: mergeHomeProcessSection(parsed.process, def.process),
    cta: mergeHomeCTA(parsed.cta, def.cta),
    statsCard: {
      ...def.statsCard,
      ...parsed.statsCard,
      items:
        parsed.statsCard?.items && parsed.statsCard.items.length > 0
          ? parsed.statsCard.items
          : def.statsCard.items,
    },
    showStatsCard: parsed.showStatsCard ?? def.showStatsCard,
    showProcess: parsed.showProcess ?? def.showProcess,
    showInquiryForm: parsed.showInquiryForm ?? def.showInquiryForm,
    hideInquiryFormIntro:
      typeof parsed.hideInquiryFormIntro === 'boolean'
        ? parsed.hideInquiryFormIntro
        : def.hideInquiryFormIntro,
    hideInquiryFormCardHeading:
      typeof parsed.hideInquiryFormCardHeading === 'boolean'
        ? parsed.hideInquiryFormCardHeading
        : def.hideInquiryFormCardHeading,
    inquiryForm: normalizePageInquiryFormConfig(parsed.inquiryForm),
    heroImage: parsed.heroImage !== undefined ? parsed.heroImage : def.heroImage,
    heroVideo: parsed.heroVideo !== undefined ? parsed.heroVideo : def.heroVideo,
    sectionOrder,
    sectionVisibility,
    heroOverlayRow: mergeHomeHeroOverlayRow(parsed.heroOverlayRow, HOME_HERO_OVERLAY_DEFAULT),
  }
}

/**
 * Сводит сохранённую видимость + устаревший флаг `showProcess` к единой карте.
 * Старые данные могли хранить `showProcess: false` БЕЗ `sectionVisibility.process` —
 * мигрируем такое значение, чтобы видимость секции «Процесс работы» не менялась
 * молча после введения общей `sectionVisibility`.
 */
function mergeHomeSavedVisibility(parsed: Partial<HomePageData>): Record<string, boolean> | undefined {
  const sv = parsed.sectionVisibility ? { ...parsed.sectionVisibility } : undefined
  if (parsed.showProcess !== undefined && (!sv || sv.process === undefined)) {
    const next = sv ?? {}
    next.process = parsed.showProcess === true
    return next
  }
  return sv
}

function mergeHomeHeroOverlayRow(
  parsed: HomePageData['heroOverlayRow'] | undefined,
  def: NonNullable<HomePageData['heroOverlayRow']>,
): NonNullable<HomePageData['heroOverlayRow']> {
  if (!parsed || typeof parsed !== 'object') {
    return { ...def }
  }
  const socialRaw = parsed.socialLinks
  const socialLinks: NonNullable<HomePageData['heroOverlayRow']>['socialLinks'] = []
  if (Array.isArray(socialRaw)) {
    for (const row of socialRaw) {
      if (!row || typeof row !== 'object') {
        continue
      }
      const o = row as Record<string, unknown>
      const iconKey = typeof o.iconKey === 'string' ? o.iconKey.trim() : 'link'
      const href = typeof o.href === 'string' ? o.href.trim() : ''
      if (href) {
        socialLinks.push({ iconKey: iconKey || 'link', href })
      }
    }
  }
  const linksRaw = parsed.links
  const links: NonNullable<HomePageData['heroOverlayRow']>['links'] = []
  if (Array.isArray(linksRaw)) {
    for (const row of linksRaw) {
      if (!row || typeof row !== 'object') {
        continue
      }
      const o = row as Record<string, unknown>
      const path = typeof o.path === 'string' ? o.path.trim() : ''
      const lb = o.label && typeof o.label === 'object' ? (o.label as Record<string, unknown>) : {}
      links.push({
        path: path || '/',
        label: {
          ru: typeof lb.ru === 'string' ? lb.ru : '',
          en: typeof lb.en === 'string' ? lb.en : '',
        },
      })
    }
  }
  return {
    enabled: parsed.enabled === true,
    socialLinks,
    links,
    showLanguageSwitch: parsed.showLanguageSwitch !== false,
  }
}

export function syncHomeStructuralFields(
  data: Record<MarineContentLocale, HomePageData>,
  source: MarineContentLocale,
) {
  const src = data[source]
  for (const loc of Object.keys(data) as MarineContentLocale[]) {
    if (loc === source) continue
    const d = data[loc]
    // sync stat icons & values, service images
    while (d.statsCard.items.length < src.statsCard.items.length) {
      d.statsCard.items.push({ icon: 'Ship', value: '', label: '' })
    }
    d.statsCard.items.length = src.statsCard.items.length
    for (let i = 0; i < src.statsCard.items.length; i++) {
      d.statsCard.items[i].icon = src.statsCard.items[i].icon
      d.statsCard.items[i].value = src.statsCard.items[i].value
    }
    d.services.featuredServiceIds = [...(src.services.featuredServiceIds ?? [])]
    while (d.process.steps.length < src.process.steps.length) {
      d.process.steps.push({ title: '', text: '' })
    }
    d.process.steps.length = src.process.steps.length
    d.showInquiryForm = src.showInquiryForm
    d.hideInquiryFormIntro = src.hideInquiryFormIntro
    d.hideInquiryFormCardHeading = src.hideInquiryFormCardHeading
    d.inquiryForm = normalizePageInquiryFormConfig(src.inquiryForm)
    d.showStatsCard = src.showStatsCard
    d.showProcess = src.showProcess
    d.heroImage = src.heroImage
    d.heroVideo = src.heroVideo
    while (d.directions.rows.length < src.directions.rows.length) {
      d.directions.rows.push({ title: '', description: '', cta: '', href: '', hoverTitle: '', hoverDescription: '', heroImage: '' })
    }
    d.directions.rows.length = src.directions.rows.length
    for (let i = 0; i < src.directions.rows.length; i++) {
      d.directions.rows[i].href = src.directions.rows[i].href
      d.directions.rows[i].heroImage = src.directions.rows[i].heroImage
    }
    while (d.trust.bullets.length < src.trust.bullets.length) {
      d.trust.bullets.push('')
    }
    d.trust.bullets.length = src.trust.bullets.length
    /*
     * Видимость и порядок секций — структурные, общие для всех локалей.
     * `setSectionVisible` в админке уже пишет в обе локали, но синхронизация
     * перед сохранением страхует от рассинхронизации, если данные приехали из
     * разных версий или часть локалей пришла без `sectionVisibility`.
     */
    if (src.sectionVisibility) {
      d.sectionVisibility = { ...src.sectionVisibility }
    }
    if (src.sectionOrder) {
      d.sectionOrder = [...src.sectionOrder]
    }
    d.hideFooter = src.hideFooter
    d.hero.hideCtaClient = src.hero.hideCtaClient
    d.hero.hideCtaSeafarer = src.hero.hideCtaSeafarer
    const srcOverlay = mergeHomeHeroOverlayRow(src.heroOverlayRow, HOME_HERO_OVERLAY_DEFAULT)
    const curOverlay = mergeHomeHeroOverlayRow(d.heroOverlayRow, HOME_HERO_OVERLAY_DEFAULT)
    d.heroOverlayRow = {
      enabled: srcOverlay.enabled,
      showLanguageSwitch: srcOverlay.showLanguageSwitch,
      socialLinks: srcOverlay.socialLinks.map((s) => ({ ...s })),
      links: srcOverlay.links.map((link, i) => ({
        path: link.path,
        label: {
          ru: curOverlay.links[i]?.label.ru ?? link.label.ru,
          en: curOverlay.links[i]?.label.en ?? link.label.en,
        },
      })),
    }
  }
}

/* ── Listing pages (Ship Repair, Projects, Gallery, News) ── */

type ListingSlug = 'services-page' | 'projects-page' | 'gallery-page' | 'news-page' | 'vacancies-page'

const LISTING_DEFAULTS: Record<ListingSlug, Record<MarineContentLocale, ListingPageData | ProjectsPageData>> = {
  'services-page': {
    ru: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      cta: { title: '', buttonText: '' },
      showInquiryForm: false,
      inquiryForm: normalizePageInquiryFormConfig(undefined),
      heroImage: '',
    },
    en: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      cta: { title: '', buttonText: '' },
      showInquiryForm: false,
      inquiryForm: normalizePageInquiryFormConfig(undefined),
      heroImage: '',
    },
  },
  'projects-page': {
    ru: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      cta: { title: '', buttonText: '' },
      showInquiryForm: false,
      inquiryForm: normalizePageInquiryFormConfig(undefined),
      heroImage: '',
    } as ProjectsPageData,
    en: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      cta: { title: '', buttonText: '' },
      showInquiryForm: false,
      inquiryForm: normalizePageInquiryFormConfig(undefined),
      heroImage: '',
    } as ProjectsPageData,
  },
  'gallery-page': {
    ru: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      heroImage: '',
      showInquiryForm: false,
      inquiryForm: normalizePageInquiryFormConfig(undefined),
    },
    en: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      heroImage: '',
      showInquiryForm: false,
      inquiryForm: normalizePageInquiryFormConfig(undefined),
    },
  },
  'news-page': {
    ru: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      showInquiryForm: false,
    },
    en: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      showInquiryForm: false,
    },
  },
  'vacancies-page': {
    ru: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      cta: { title: '', buttonText: '' },
      showInquiryForm: false,
      inquiryForm: normalizePageInquiryFormConfig(undefined),
      heroImage: '',
    } as ProjectsPageData,
    en: {
      hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
      cta: { title: '', buttonText: '' },
      showInquiryForm: false,
      inquiryForm: normalizePageInquiryFormConfig(undefined),
      heroImage: '',
    } as ProjectsPageData,
  },
}

/**
 * Дефолтный порядок секций листинговых страниц (`news-page`, `projects-page`,
 * `services-page`, `gallery-page`, `vacancies-page`). На листинге одна штатная
 * секция — `listing` (карточки/featured/grid).
 */
export const LISTING_SECTION_DEFAULT_ORDER = ['listing'] as const

export type ListingSectionId = 'listing' | 'cta'

export const LISTING_SECTION_ADMIN_LABELS: Record<ListingSectionId, string> = {
  listing: 'Список (содержимое страницы)',
  cta: 'CTA-блок',
}

/** Какие листинговые слаги имеют свой CTA-блок на публичной странице. */
const LISTING_SLUGS_WITH_CTA = new Set<ListingSlug>(['projects-page', 'services-page', 'vacancies-page'])

export function listingDefaultOrder(slug: string): readonly string[] {
  return LISTING_SLUGS_WITH_CTA.has(slug as ListingSlug)
    ? (['listing', 'cta'] as const)
    : LISTING_SECTION_DEFAULT_ORDER
}

/** Встроенный порядок секций листинга (учитывает v2 для «Судоремонт»). */
export function listingBuiltinOrder(slug: string, page?: Partial<ListingPageData>): readonly string[] {
  if (slug === 'services-page' && page && !servicesPageDataIsLegacy(page)) {
    return SERVICES_MARKETING_V2_SECTION_ORDER
  }
  return listingDefaultOrder(slug)
}

function mergeServicesListingHeroButtons(
  base: LineMarketingHeroButton[],
  raw: unknown,
  hadKey: boolean,
): LineMarketingHeroButton[] {
  const MAX = 2
  if (!hadKey) {
    return base.map((b) => ({ ...b }))
  }
  if (!Array.isArray(raw)) {
    return base.map((b) => ({ ...b }))
  }
  const out: LineMarketingHeroButton[] = []
  for (let i = 0; i < MAX; i++) {
    const b = base[i] ?? { label: '', href: '' }
    const r = raw[i]
    if (r !== null && typeof r === 'object') {
      const rr = r as Partial<LineMarketingHeroButton>
      out.push({
        label: typeof rr.label === 'string' ? rr.label : b.label,
        href: typeof rr.href === 'string' ? rr.href : b.href,
      })
    }
    else if (r === null) {
      out.push({ label: '', href: '' })
    }
    else {
      out.push({ ...b })
    }
  }
  return out
}

export function defaultListingData(slug: string, locale: MarineContentLocale): ListingPageData {
  if (slug === 'services-page') {
    const servicesBase = JSON.parse(JSON.stringify(defaultServicesPageListingData(locale))) as ListingPageData
    servicesBase.hideInquiryFormIntro = servicesBase.hideInquiryFormIntro ?? false
    servicesBase.hideInquiryFormCardHeading = servicesBase.hideInquiryFormCardHeading ?? false
    return servicesBase
  }
  const key = slug as ListingSlug
  const base = LISTING_DEFAULTS[key]
    ? (JSON.parse(JSON.stringify(LISTING_DEFAULTS[key][locale])) as ListingPageData)
    : ({ hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' } } as ListingPageData)
  base.hideInquiryFormIntro = base.hideInquiryFormIntro ?? false
  base.hideInquiryFormCardHeading = base.hideInquiryFormCardHeading ?? false
  base.sectionOrder = [...listingDefaultOrder(slug)]
  base.sectionVisibility = {}
  return base
}

export function mergeListingPageData(slug: string, locale: MarineContentLocale, raw: unknown): ListingPageData {
  if (!raw || typeof raw !== 'object') {
    return defaultListingData(slug, locale)
  }
  const p = raw as Partial<ListingPageData>

  const isServicesLegacy = slug === 'services-page' && servicesPageDataIsLegacy(p)
  const base: ListingPageData =
    slug === 'services-page'
      ? isServicesLegacy
        ? JSON.parse(JSON.stringify(defaultServicesPageLegacyListingData(locale))) as ListingPageData
        : JSON.parse(JSON.stringify(defaultServicesPageListingData(locale))) as ListingPageData
      : defaultListingData(slug, locale)

  const customSections = normalizeCustomPageSections(p.customSections)
  const customIds = customSections.map((s) => s.id)
  const builtinOrder =
    slug === 'services-page' && !isServicesLegacy
      ? [...SERVICES_MARKETING_V2_SECTION_ORDER]
      : listingDefaultOrder(slug as ListingSlug)
  const sectionOrder = mergeSectionOrder(p.sectionOrder, customIds, builtinOrder)
  const sectionVisibility = mergeSectionVisibility(p.sectionVisibility, sectionOrder)

  const mergedServicesV2 =
    slug === 'services-page' && !isServicesLegacy && base.servicesV2
      ? mergeServicesMarketingContent(p.servicesV2, base.servicesV2)
      : undefined

  const hadHeroButtonsKey = 'heroButtons' in p

  const hero =
    slug === 'services-page' && !isServicesLegacy && mergedServicesV2
      ? mergeListingHero(p.hero, {
          ...base.hero,
          titleFormatted: themeTitleTriple(mergedServicesV2.sec1Hero.title, '', ''),
          lead: mergedServicesV2.sec1Hero.lead,
        })
      : mergeListingHero(p.hero, base.hero)

  const heroButtons =
    slug === 'services-page' && !isServicesLegacy
      ? mergeServicesListingHeroButtons(base.heroButtons ?? [], p.heroButtons, hadHeroButtonsKey)
      : isServicesLegacy
        ? undefined
        : (p.heroButtons ?? base.heroButtons)

  return {
    ...base,
    ...p,
    hero,
    cta: p.cta ? { ...base.cta!, ...p.cta } : base.cta,
    showInquiryForm: p.showInquiryForm ?? base.showInquiryForm,
    inquiryForm: normalizePageInquiryFormConfig(p.inquiryForm),
    hideInquiryFormIntro:
      typeof p.hideInquiryFormIntro === 'boolean'
        ? p.hideInquiryFormIntro
        : (base.hideInquiryFormIntro ?? false),
    hideInquiryFormCardHeading:
      typeof p.hideInquiryFormCardHeading === 'boolean'
        ? p.hideInquiryFormCardHeading
        : base.hideInquiryFormCardHeading,
    heroImage: p.heroImage !== undefined ? p.heroImage : base.heroImage,
    heroBreadcrumbTone: parseStoredPageBreadcrumbTone(p.heroBreadcrumbTone) ?? base.heroBreadcrumbTone,
    heroButtons,
    servicesPageLayout: slug === 'services-page' ? (isServicesLegacy ? 'legacy' : 'v2') : p.servicesPageLayout,
    servicesV2: slug === 'services-page' ? (isServicesLegacy ? undefined : mergedServicesV2) : p.servicesV2,
    customSections,
    sectionOrder,
    sectionVisibility,
  }
}

/* ── Contacts page ── */

const CONTACTS_DEFAULTS: Record<MarineContentLocale, ContactsPageData> = {
  ru: {
    hero: {
      titleFormatted: emptyThemeTitle(),
      lead: '',
    },
    infoTitle: '',
    formTitle: '',
    formLead: '',
    officesTitle: '',
    showInquiryForm: false,
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    inquiryForm: normalizePageInquiryFormConfig(undefined),
    heroImage: '',
  },
  en: {
    hero: {
      titleFormatted: emptyThemeTitle(),
      lead: '',
    },
    infoTitle: '',
    formTitle: '',
    formLead: '',
    officesTitle: '',
    showInquiryForm: false,
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    inquiryForm: normalizePageInquiryFormConfig(undefined),
    heroImage: '',
  },
}

/**
 * Дефолтный порядок секций страницы «Контакты». Hero фиксирован, штатная
 * пользовательская секция — `contacts` (инфо + форма + офисы).
 */
export const CONTACTS_SECTION_DEFAULT_ORDER = ['contacts'] as const

export type ContactsSectionId = (typeof CONTACTS_SECTION_DEFAULT_ORDER)[number]

export const CONTACTS_SECTION_ADMIN_LABELS: Record<ContactsSectionId, string> = {
  contacts: 'Контактная информация и форма',
}

export function defaultContactsData(locale: MarineContentLocale): ContactsPageData {
  const base = JSON.parse(JSON.stringify(CONTACTS_DEFAULTS[locale])) as ContactsPageData
  base.sectionOrder = [...CONTACTS_SECTION_DEFAULT_ORDER]
  base.sectionVisibility = {}
  return base
}

export function mergeContactsPageData(locale: MarineContentLocale, raw: unknown): ContactsPageData {
  const base = defaultContactsData(locale)
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const p = raw as Partial<ContactsPageData>
  return {
    ...base,
    ...p,
    hero: mergeContactsHero(p.hero, base.hero),
    infoTitle: typeof p.infoTitle === 'string' ? p.infoTitle : base.infoTitle,
    formTitle: typeof p.formTitle === 'string' ? p.formTitle : base.formTitle,
    formLead: typeof p.formLead === 'string' ? p.formLead : base.formLead,
    officesTitle: typeof p.officesTitle === 'string' ? p.officesTitle : base.officesTitle,
    showInquiryForm: p.showInquiryForm ?? base.showInquiryForm,
    inquiryForm: normalizePageInquiryFormConfig(p.inquiryForm),
    hideInquiryFormIntro:
      typeof p.hideInquiryFormIntro === 'boolean'
        ? p.hideInquiryFormIntro
        : base.hideInquiryFormIntro,
    hideInquiryFormCardHeading:
      typeof p.hideInquiryFormCardHeading === 'boolean'
        ? p.hideInquiryFormCardHeading
        : base.hideInquiryFormCardHeading,
    heroBreadcrumbTone: parseStoredPageBreadcrumbTone(p.heroBreadcrumbTone) ?? base.heroBreadcrumbTone,
    heroImage: p.heroImage !== undefined ? p.heroImage : base.heroImage,
    customSections: normalizeCustomPageSections(p.customSections),
    sectionOrder: p.sectionOrder ?? base.sectionOrder,
    sectionVisibility: p.sectionVisibility ?? base.sectionVisibility,
  }
}

function mergeCrewingChecklistPoint(raw: unknown, fallback?: CrewingChecklistPoint): CrewingChecklistPoint {
  const r = raw as Partial<CrewingChecklistPoint>
  return {
    title: typeof r.title === 'string' ? r.title : fallback?.title ?? '',
    text: typeof r.text === 'string' ? r.text : fallback?.text ?? '',
  }
}

function mergeCrewingChecklistSection(raw: unknown, fallback?: CrewingChecklistSection): CrewingChecklistSection {
  const r = raw as Partial<CrewingChecklistSection>
  const heading = typeof r.heading === 'string' ? r.heading : fallback?.heading ?? ''
  const pr = Array.isArray(r.points) ? r.points : []
  const fb = fallback?.points ?? []
  const points = pr.map((pt, j) => mergeCrewingChecklistPoint(pt, fb[j]))
  return { heading, points }
}

/** Частичные данные чек-листа из CMS; поддерживаем устаревшие toggleShow/toggleHide. */
type CrewingChecklistBlockPartial = Partial<CrewingChecklistBlock> & {
  bodyMarkdown?: string
  toggleShow?: string
  toggleHide?: string
}

const FALLBACK_CREWING_DIRECTION: CrewingDirectionItem = {
  icon: 'UserCheck',
  hideIcon: false,
  title: '',
  text: '',
  detailSlug: '',
}

function mergeCrewingDirections(base: CrewingDirectionItem[], raw: unknown): CrewingDirectionItem[] {
  if (!Array.isArray(raw)) {
    return base.map((row) => ({
      ...row,
      hideIcon: typeof row.hideIcon === 'boolean' ? row.hideIcon : false,
      detailSlug: typeof row.detailSlug === 'string' ? row.detailSlug.trim() : row.detailSlug ?? '',
    }))
  }
  if (raw.length === 0) {
    return []
  }
  const out: CrewingDirectionItem[] = []
  for (let i = 0; i < raw.length; i++) {
    const b = base[i] ?? FALLBACK_CREWING_DIRECTION
    const r = raw[i]
    if (!r || typeof r !== 'object') {
      out.push({ ...b })
      continue
    }
    const rr = r as Partial<CrewingDirectionItem>
    out.push({
      icon: typeof rr.icon === 'string' && rr.icon.trim() ? rr.icon : b.icon,
      hideIcon: typeof rr.hideIcon === 'boolean' ? rr.hideIcon : b.hideIcon ?? false,
      title: typeof rr.title === 'string' ? rr.title : b.title,
      text: typeof rr.text === 'string' ? rr.text : b.text,
      detailSlug: typeof rr.detailSlug === 'string' ? rr.detailSlug.trim() : b.detailSlug ?? '',
    })
  }
  return out
}

function mergeCrewingChecklistBlock(
  base: CrewingChecklistBlock,
  p?: CrewingChecklistBlockPartial,
): CrewingChecklistBlock {
  if (!p) {
    return base
  }
  const legacyShow =
    typeof p.toggleShow === 'string' && p.toggleShow.trim() !== '' ? p.toggleShow.trim() : ''
  const sectionTitle =
    typeof p.sectionTitle === 'string' && p.sectionTitle.trim() !== ''
      ? p.sectionTitle.trim()
      : legacyShow || base.sectionTitle
  const toggles = {
    sectionTitle,
    intro: typeof p.intro === 'string' ? p.intro : base.intro,
  }
  if (!Array.isArray(p.sections)) {
    return { ...toggles, sections: base.sections }
  }
  if (p.sections.length === 0) {
    return { ...toggles, sections: [] }
  }
  return {
    ...toggles,
    sections: p.sections.map((s, i) => mergeCrewingChecklistSection(s, base.sections[i])),
  }
}

/* ── Line marketing pages (крюинг, судовой менеджмент) ── */

function newLineMarketingBlockId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lm-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function mergeLineMarketingCardItem(raw: unknown, fallback: LineMarketingCardItem): LineMarketingCardItem {
  if (!raw || typeof raw !== 'object') {
    return { ...fallback }
  }
  const r = raw as Partial<LineMarketingCardItem>
  return {
    icon: typeof r.icon === 'string' && r.icon.trim() ? r.icon : fallback.icon,
    hideIcon: typeof r.hideIcon === 'boolean' ? r.hideIcon : fallback.hideIcon ?? false,
    title: typeof r.title === 'string' ? r.title : fallback.title,
    text: typeof r.text === 'string' ? r.text : fallback.text,
    detailSlug: typeof r.detailSlug === 'string' ? r.detailSlug.trim() : fallback.detailSlug ?? '',
  }
}

function mergeCardsBlock(raw: unknown, fallback: LineMarketingCardsBlock): LineMarketingCardsBlock {
  if (!raw || typeof raw !== 'object') {
    return { ...fallback, items: fallback.items.map((x) => ({ ...x })) }
  }
  const r = raw as Partial<LineMarketingCardsBlock>
  const itemsRaw = Array.isArray(r.items) ? r.items : []
  const items = itemsRaw.map((it, i) =>
    mergeLineMarketingCardItem(it, fallback.items[i] ?? { icon: 'UserCheck', hideIcon: false, title: '', text: '', detailSlug: '' }),
  )
  const columns =
    typeof r.columns === 'number' && Number.isFinite(r.columns)
      ? Math.min(6, Math.max(1, Math.round(r.columns)))
      : fallback.columns ?? 3
  const itemsAlign =
    r.itemsAlign === 'center' || r.itemsAlign === 'left'
      ? r.itemsAlign
      : (fallback.itemsAlign ?? 'left')
  return {
    id: typeof r.id === 'string' && r.id.trim() ? r.id.trim() : fallback.id,
    type: 'cards',
    columns,
    itemsAlign,
    items: items.length > 0 ? items : [{ icon: 'UserCheck', hideIcon: false, title: '', text: '', detailSlug: '' }],
  }
}

function mergeTextBlock(raw: unknown, fallback: LineMarketingTextBlock): LineMarketingTextBlock {
  if (!raw || typeof raw !== 'object') {
    return { ...fallback }
  }
  const r = raw as Partial<LineMarketingTextBlock>
  return {
    id: typeof r.id === 'string' && r.id.trim() ? r.id.trim() : fallback.id,
    type: 'text',
    title: typeof r.title === 'string' ? r.title : fallback.title,
    subtitle: typeof r.subtitle === 'string' ? r.subtitle : fallback.subtitle,
    description: typeof r.description === 'string' ? r.description : fallback.description,
  }
}

function mergeSplitBlock(raw: unknown, fallback: LineMarketingSplitBlock): LineMarketingSplitBlock {
  if (!raw || typeof raw !== 'object') {
    return { ...fallback, images: [...fallback.images] }
  }
  const r = raw as Partial<LineMarketingSplitBlock>
  const imgs = Array.isArray(r.images) ? r.images.filter((u): u is string => typeof u === 'string') : fallback.images
  const left =
    typeof r.leftWidthPercent === 'number' && Number.isFinite(r.leftWidthPercent)
      ? Math.min(90, Math.max(10, Math.round(r.leftWidthPercent)))
      : fallback.leftWidthPercent
  const mode = r.rightMode === 'slider' || r.rightMode === 'image' ? r.rightMode : fallback.rightMode
  return {
    id: typeof r.id === 'string' && r.id.trim() ? r.id.trim() : fallback.id,
    type: 'split',
    leftText: typeof r.leftText === 'string' ? r.leftText : fallback.leftText,
    leftWidthPercent: left,
    rightMode: mode,
    images: imgs.length > 0 ? imgs : [''],
  }
}

function mergeContentBlock(raw: unknown, fallback?: LineMarketingContentBlock): LineMarketingContentBlock {
  const fb =
    fallback ??
    ({
      id: newLineMarketingBlockId(),
      type: 'cards',
      columns: 3,
      itemsAlign: 'left',
      items: [{ icon: 'UserCheck', hideIcon: false, title: '', text: '', detailSlug: '' }],
    } as LineMarketingCardsBlock)
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(fb)) as LineMarketingContentBlock
  }
  const r = raw as Partial<LineMarketingContentBlock>
  const t = r.type
  if (t === 'text') {
    return mergeTextBlock(raw, fb.type === 'text' ? fb : { id: newLineMarketingBlockId(), type: 'text', title: '', subtitle: '', description: '' })
  }
  if (t === 'split') {
    return mergeSplitBlock(
      raw,
      fb.type === 'split'
        ? fb
        : {
            id: newLineMarketingBlockId(),
            type: 'split',
            leftText: '',
            leftWidthPercent: 50,
            rightMode: 'image',
            images: [''],
          },
    )
  }
  return mergeCardsBlock(
    raw,
    fb.type === 'cards'
      ? fb
      : {
          id: newLineMarketingBlockId(),
          type: 'cards',
          columns: 3,
          itemsAlign: 'left',
          items: [{ icon: 'UserCheck', hideIcon: false, title: '', text: '', detailSlug: '' }],
        },
  )
}

function mergeOneCustomSection(raw: unknown, fallback?: LineMarketingCustomSection): LineMarketingCustomSection {
  const fb =
    fallback ??
    ({
      id: newLineMarketingBlockId(),
      title: '',
      showTitle: true,
      contentPlacement: 'beforeArticle',
      blocks: [],
    } as LineMarketingCustomSection)
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(fb)) as LineMarketingCustomSection
  }
  const p = raw as Partial<LineMarketingCustomSection>
  const id = typeof p.id === 'string' && p.id.trim() ? p.id.trim() : fb.id
  const blocksRaw = Array.isArray(p.blocks) ? p.blocks : []
  const blocks = blocksRaw.map((b, i) => mergeContentBlock(b, fb.blocks[i]))
  const contentPlacement =
    p.contentPlacement === 'afterArticle' || p.contentPlacement === 'beforeArticle'
      ? p.contentPlacement
      : (fb.contentPlacement ?? 'beforeArticle')
  return {
    id,
    title: typeof p.title === 'string' ? p.title : fb.title,
    showTitle: typeof p.showTitle === 'boolean' ? p.showTitle : fb.showTitle,
    contentPlacement,
    breadcrumbTone: parseStoredPageBreadcrumbTone(p.breadcrumbTone) ?? fb.breadcrumbTone,
    blocks,
  }
}

function mergeCustomSections(raw: unknown, base: LineMarketingCustomSection[]): LineMarketingCustomSection[] {
  if (!Array.isArray(raw)) {
    return base.map((s) => mergeOneCustomSection(s, s))
  }
  if (raw.length === 0) {
    return []
  }
  return raw.map((r, i) => mergeOneCustomSection(r, base[i]))
}

function mergeSectionOrder(
  raw: unknown,
  customIds: string[],
  builtinDefaultOrder: readonly string[],
): string[] {
  const defaultOrder = [...builtinDefaultOrder]
  const builtinSet = new Set(defaultOrder)
  const customKeys = customIds.map((id) => `custom:${id}`)
  const validCustom = new Set(customKeys)
  if (!Array.isArray(raw)) {
    return [...defaultOrder, ...customKeys]
  }
  const out: string[] = []
  const seen = new Set<string>()
  for (const x of raw) {
    if (typeof x !== 'string') {
      continue
    }
    if (builtinSet.has(x) && !seen.has(x)) {
      out.push(x)
      seen.add(x)
    } else if (x.startsWith('custom:') && validCustom.has(x) && !seen.has(x)) {
      out.push(x)
      seen.add(x)
    }
  }
  for (const k of defaultOrder) {
    if (!seen.has(k)) {
      out.push(k)
      seen.add(k)
    }
  }
  for (const ck of customKeys) {
    if (!seen.has(ck)) {
      out.push(ck)
      seen.add(ck)
    }
  }
  return out
}

/** В v2 чек-лист сразу после «Наш подход» — переставляем ключ после merge с сохранённым JSON. */
function moveSectionImmediatelyAfter(order: string[], afterKey: string, key: string): string[] {
  if (!order.includes(key) || !order.includes(afterKey)) {
    return order
  }
  const next = order.filter((k) => k !== key)
  const pos = next.indexOf(afterKey)
  if (pos === -1) {
    return order
  }
  next.splice(pos + 1, 0, key)
  return next
}

function mergeSectionVisibility(raw: unknown, allKeys: string[]): Record<string, boolean> {
  const base: Record<string, boolean> = {}
  for (const k of allKeys) {
    base[k] = true
  }
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const p = raw as Record<string, boolean>
  for (const k of allKeys) {
    if (typeof p[k] === 'boolean') {
      base[k] = p[k]
    }
  }
  return base
}

function mergeSectionBackgroundImages(
  raw: unknown,
  base: Record<string, string> | undefined,
): Record<string, string> {
  const b =
    base && typeof base === 'object' ? { ...(base as Record<string, string>) } : ({} as Record<string, string>)
  if (!raw || typeof raw !== 'object') {
    return b
  }
  const p = raw as Record<string, unknown>
  const out = { ...b }
  for (const [k, v] of Object.entries(p)) {
    if (v === null || v === undefined) {
      delete out[k]
      continue
    }
    if (typeof v === 'string') {
      out[k] = v
    }
  }
  return out
}

function mergeLineMarketingHeroButtons(
  locale: MarineContentLocale,
  base: LineMarketingHeroButton[],
  raw: unknown,
  legacyShowInquiry: boolean | undefined,
  hadHeroButtonsKey: boolean,
  maxButtons: number,
): LineMarketingHeroButton[] {
  const MAX = Math.max(1, Math.floor(maxButtons))
  const legacyDefault = (): LineMarketingHeroButton[] =>
    legacyShowInquiry === false
      ? []
      : [
          {
            label: locale === 'en' ? 'To the inquiry form' : 'К форме заявки',
            href: '#page-inquiry',
          },
        ]

  if (!hadHeroButtonsKey) {
    return legacyDefault()
  }
  if (!Array.isArray(raw)) {
    return base.map((b) => ({ ...b })).slice(0, MAX)
  }
  if (raw.length === 0) {
    return []
  }
  let n: number
  if (MAX <= 2) {
    n = MAX
  } else {
    n = Math.min(MAX, raw.length)
  }
  const out: LineMarketingHeroButton[] = []
  for (let i = 0; i < n; i++) {
    const b = base[i] ?? { label: '', href: '' }
    const r = raw[i]
    if (r === undefined || r === null) {
      out.push({ label: '', href: '' })
      continue
    }
    if (typeof r !== 'object') {
      out.push({ ...b })
      continue
    }
    const rr = r as Partial<LineMarketingHeroButton>
    out.push({
      label: typeof rr.label === 'string' ? rr.label : b.label,
      href: typeof rr.href === 'string' ? rr.href : b.href,
    })
  }
  return out
}

function emptyShipPageData(locale: MarineContentLocale): CrewingPageData {
  const shipV2 = defaultShipManagementContent(locale)
  const titleFormatted = themeTitleTriple(shipV2.sec1Hero.title, '', '')
  return {
    hero: { label: '', titleFormatted, lead: shipV2.sec1Hero.lead },
    heroButtons: [
      {
        label: locale === 'en' ? 'Leave a request' : 'Оставить запрос',
        href: '#page-inquiry',
      },
    ],
    shipPageLayout: 'v2',
    shipV2,
    sectionOrder: [...SHIP_MANAGEMENT_V2_SECTION_ORDER],
    sectionVisibility: {
      approach: true,
      checklist: true,
      services: true,
      advantages: true,
      trust: true,
    },
    customSections: [],
    directionsSection: { title: '', lead: '' },
    directions: [],
    principles: { title: '', items: [] },
    audience: {
      title: '',
      paragraph1: '',
      paragraph2: '',
      ctaLabel: '',
      ctaHref: '/contacts',
    },
    checklist: { sectionTitle: '', intro: '', sections: [] },
    showInquiryForm: true,
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    inquiryForm: normalizePageInquiryFormConfig(undefined),
    heroBackgroundImage: '',
    sectionBackgroundImages: {},
  }
}

function emptyCrewingPageData(locale: MarineContentLocale): CrewingPageData {
  const crewingV2 = defaultCrewingManagementContent(locale)
  const titleFormatted = themeTitleTriple(crewingV2.sec1Hero.title, '', '')
  return {
    hero: { label: '', titleFormatted, lead: crewingV2.sec1Hero.lead },
    heroButtons: [
      {
        label: locale === 'en' ? 'Leave a request' : 'Оставить запрос',
        href: '#page-inquiry',
      },
    ],
    crewingPageLayout: 'v2',
    crewingV2,
    sectionOrder: [...CREWING_MANAGEMENT_V2_SECTION_ORDER],
    sectionVisibility: {
      approach: true,
      checklist: true,
      services: true,
      advantages: true,
      trust: true,
      cta: true,
    },
    customSections: [],
    directionsSection: { title: '', lead: '' },
    directions: [],
    principles: { title: '', items: [] },
    audience: {
      title: '',
      paragraph1: '',
      paragraph2: '',
      ctaLabel: '',
      ctaHref: '/contacts',
    },
    checklist: { sectionTitle: '', intro: '', sections: [] },
    showInquiryForm: true,
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    inquiryForm: normalizePageInquiryFormConfig(undefined),
    heroBackgroundImage: '',
    sectionBackgroundImages: {},
  }
}

function emptyLnkPageData(locale: MarineContentLocale): CrewingPageData {
  const lnkV2 = defaultLnkManagementContent(locale)
  const titleFormatted = themeTitleTriple(lnkV2.sec1Hero.title, '', '')
  return {
    hero: { label: '', titleFormatted, lead: lnkV2.sec1Hero.lead },
    heroButtons: [
      {
        label: locale === 'en' ? 'Leave a request' : 'Оставить запрос',
        href: '#page-inquiry',
      },
    ],
    lnkPageLayout: 'v2',
    lnkV2,
    sectionOrder: [...LNK_V2_SECTION_ORDER],
    sectionVisibility: {
      competencies: true,
      strategicAdvantages: true,
      techBase: true,
    },
    customSections: [],
    directionsSection: { title: '', lead: '' },
    directions: [],
    principles: { title: '', items: [] },
    audience: {
      title: '',
      paragraph1: '',
      paragraph2: '',
      ctaLabel: '',
      ctaHref: '/contacts',
    },
    checklist: { sectionTitle: '', intro: '', sections: [] },
    showInquiryForm: true,
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    inquiryForm: normalizePageInquiryFormConfig(undefined),
    heroBackgroundImage: '',
    sectionBackgroundImages: {},
  }
}

const CREWING_DEFAULTS: Record<MarineContentLocale, CrewingPageData> = {
  ru: emptyCrewingPageData('ru'),
  en: emptyCrewingPageData('en'),
}

const SHIP_DEFAULTS: Record<MarineContentLocale, CrewingPageData> = {
  ru: emptyShipPageData('ru'),
  en: emptyShipPageData('en'),
}

const LNK_DEFAULTS: Record<MarineContentLocale, CrewingPageData> = {
  ru: emptyLnkPageData('ru'),
  en: emptyLnkPageData('en'),
}

const LINE_PAGE_DATA: Record<LineMarketingPageSlug, Record<MarineContentLocale, CrewingPageData>> = {
  'crewing-management': CREWING_DEFAULTS,
  'ship-management': SHIP_DEFAULTS,
  lnk: LNK_DEFAULTS,
}

export function defaultLinePageData(slug: LineMarketingPageSlug, locale: MarineContentLocale): CrewingPageData {
  return JSON.parse(JSON.stringify(LINE_PAGE_DATA[slug][locale]))
}

export function defaultCrewingPageData(locale: MarineContentLocale): CrewingPageData {
  return defaultLinePageData('crewing-management', locale)
}

/** Слияние сохранённого JSON с дефолтами (частичные правки в админке). */
export function mergeLinePageData(
  locale: MarineContentLocale,
  raw: unknown,
  slug: LineMarketingPageSlug,
): CrewingPageData {
  const base = defaultLinePageData(slug, locale)
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const p = raw as Partial<CrewingPageData>
  const crewingLayout: 'legacy' | 'v2' | undefined =
    slug === 'crewing-management' ? (p.crewingPageLayout === 'v2' ? 'v2' : 'legacy') : undefined
  const shipLayout: 'legacy' | 'v2' | undefined =
    slug === 'ship-management' ? (p.shipPageLayout === 'v2' ? 'v2' : 'legacy') : undefined
  const mergeBase =
    (slug === 'crewing-management' && crewingLayout === 'legacy') ||
    (slug === 'ship-management' && shipLayout === 'legacy')
      ? emptyLineMarketingLegacyPageData(locale)
      : base
  const builtinSectionOrder: readonly string[] =
    slug === 'crewing-management' && crewingLayout === 'v2'
      ? CREWING_MANAGEMENT_V2_SECTION_ORDER
      : slug === 'ship-management' && shipLayout === 'v2'
        ? SHIP_MANAGEMENT_V2_SECTION_ORDER
        : slug === 'lnk'
          ? LNK_V2_SECTION_ORDER
          : LINE_MARKETING_SECTION_DEFAULT_ORDER
  const dirs = mergeCrewingDirections(mergeBase.directions, p.directions)
  const checklist = mergeCrewingChecklistBlock(mergeBase.checklist, p.checklist)
  const hadHeroButtonsKey = typeof raw === 'object' && raw !== null && 'heroButtons' in raw
  // Используем общий normalizer — он понимает все типы блоков
  // (cards/text/split + heroImage/gallery/accordion/htmlMarkdown).
  // Старая локальная функция `mergeCustomSections` сохранена ниже для
  // обратной совместимости с возможными внешними импортами, но в новом
  // пайплайне не используется (поглощала бы новые типы блоков под cards).
  const customSections =
    Array.isArray(p.customSections)
      ? normalizeCustomPageSections(p.customSections)
      : mergeBase.customSections.map((s) => normalizeCustomPageSections([s])[0]!)
  const customIds = customSections.map((s) => s.id)
  let sectionOrder = mergeSectionOrder(p.sectionOrder, customIds, builtinSectionOrder)
  if (crewingLayout === 'v2' || shipLayout === 'v2') {
    sectionOrder = moveSectionImmediatelyAfter(sectionOrder, 'approach', 'checklist')
  }
  const sectionVisibility = mergeSectionVisibility(p.sectionVisibility, sectionOrder)
  const crewingV2Merged =
    slug === 'crewing-management' && crewingLayout === 'v2'
      ? mergeCrewingManagementContent(p.crewingV2, defaultCrewingManagementContent(locale))
      : undefined

  const shipV2Merged =
    slug === 'ship-management' && shipLayout === 'v2'
      ? mergeShipManagementContent(p.shipV2, defaultShipManagementContent(locale))
      : undefined

  const lnkV2Merged =
    slug === 'lnk' ? mergeLnkManagementContent(p.lnkV2, defaultLnkManagementContent(locale)) : undefined

  const heroMerged = mergeCrewingHero(p.hero, mergeBase.hero)
  const hero =
    slug === 'crewing-management' && crewingLayout === 'v2' && crewingV2Merged
      ? {
          ...heroMerged,
          lead: crewingV2Merged.sec1Hero.lead,
          titleFormatted: themeTitleTriple(crewingV2Merged.sec1Hero.title, '', ''),
        }
      : slug === 'ship-management' && shipLayout === 'v2' && shipV2Merged
        ? {
            ...heroMerged,
            lead: shipV2Merged.sec1Hero.lead,
            titleFormatted: themeTitleTriple(shipV2Merged.sec1Hero.title, '', ''),
          }
        : slug === 'lnk' && lnkV2Merged
          ? {
              ...heroMerged,
              lead: lnkV2Merged.sec1Hero.lead,
              titleFormatted: themeTitleTriple(lnkV2Merged.sec1Hero.title, '', ''),
            }
          : heroMerged

  return {
    hero,
    heroButtons: mergeLineMarketingHeroButtons(
      locale,
      mergeBase.heroButtons,
      p.heroButtons,
      p.showInquiryForm,
      hadHeroButtonsKey,
      slug === 'lnk' ? 12 : 2,
    ),
    ...(slug === 'crewing-management'
      ? { crewingPageLayout: crewingLayout, crewingV2: crewingV2Merged }
      : {}),
    ...(slug === 'ship-management' ? { shipPageLayout: shipLayout, shipV2: shipV2Merged } : {}),
    ...(slug === 'lnk' ? { lnkPageLayout: 'v2' as const, lnkV2: lnkV2Merged } : {}),
    sectionOrder,
    sectionVisibility,
    customSections,
    directionsSection: { ...mergeBase.directionsSection, ...p.directionsSection },
    directions: dirs,
    principles: {
      title: p.principles?.title ?? mergeBase.principles.title,
      items:
        Array.isArray(p.principles?.items) && p.principles.items.length > 0
          ? p.principles.items
          : mergeBase.principles.items,
    },
    audience: {
      ...mergeBase.audience,
      ...p.audience,
      /* ctaHref — URL: исторически мог быть сохранён как HTML (через AdminThemedTextField).
         Срезаем теги к плейн-строке, чтобы новый <input type="text"> показывал чистый путь. */
      ctaHref:
        typeof p.audience?.ctaHref === 'string'
          ? stripHtmlToPlain(p.audience.ctaHref).trim()
          : mergeBase.audience.ctaHref,
    },
    checklist,
    showInquiryForm: p.showInquiryForm ?? mergeBase.showInquiryForm,
    inquiryForm: normalizePageInquiryFormConfig(p.inquiryForm),
    hideInquiryFormIntro:
      typeof p.hideInquiryFormIntro === 'boolean'
        ? p.hideInquiryFormIntro
        : (mergeBase.hideInquiryFormIntro ?? false),
    hideInquiryFormCardHeading:
      typeof p.hideInquiryFormCardHeading === 'boolean'
        ? p.hideInquiryFormCardHeading
        : (mergeBase.hideInquiryFormCardHeading ?? false),
    heroBackgroundImage:
      p.heroBackgroundImage !== undefined && p.heroBackgroundImage !== null
        ? p.heroBackgroundImage
        : mergeBase.heroBackgroundImage,
    sectionBackgroundImages: mergeSectionBackgroundImages(
      p.sectionBackgroundImages,
      mergeBase.sectionBackgroundImages,
    ),
    heroBreadcrumbTone: parseStoredPageBreadcrumbTone(p.heroBreadcrumbTone) ?? mergeBase.heroBreadcrumbTone,
    hideFooter: typeof p.hideFooter === 'boolean' ? p.hideFooter : (mergeBase.hideFooter ?? false),
  }
}

export function mergeCrewingPageData(locale: MarineContentLocale, raw: unknown): CrewingPageData {
  return mergeLinePageData(locale, raw, 'crewing-management')
}
