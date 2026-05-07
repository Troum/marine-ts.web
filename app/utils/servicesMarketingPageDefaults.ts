import type {
  AboutGeoLocation,
  LineMarketingHeroButton,
  ListingPageData,
  MarineContentLocale,
  ServicesMarketingPageContent,
} from '~/types'
import { normalizeAboutRichCards } from '~/utils/aboutRichCardNormalize'
import { themeTitleTriple } from '~/utils/themeFormattedTitle'

/** Точки Mapbox для секции «Глобальный охват» (порты/хабы сети MTS). */
export const SERVICES_REACH_MAP_LOCATIONS: AboutGeoLocation[] = [
  { lng: 4.4777, lat: 51.9244, labelOnRight: true, name: 'Rotterdam' },
  { lng: 103.8198, lat: 1.3521, labelOnRight: false, name: 'Singapore' },
  { lng: 55.2708, lat: 25.2048, labelOnRight: true, name: 'Dubai' },
  { lng: 20.5069, lat: 54.7104, labelOnRight: false, name: 'Kaliningrad' },
  { lng: 21.1443, lat: 55.7033, labelOnRight: true, name: 'Klaipeda' },
  { lng: -0.3367, lat: 53.7457, labelOnRight: false, name: 'Hull' },
  { lng: 6.1549, lat: 62.4722, labelOnRight: true, name: 'Ålesund' },
  { lng: -15.4363, lat: 28.1235, labelOnRight: false, name: 'Las Palmas' },
  { lng: 29.9187, lat: 31.2001, labelOnRight: true, name: 'Alexandria' },
  { lng: -68.9335, lat: 12.1084, labelOnRight: false, name: 'Curaçao' },
  { lng: -79.5199, lat: 8.9824, labelOnRight: true, name: 'Panama City' },
  { lng: 18.0686, lat: 59.3293, labelOnRight: false, name: 'Stockholm' },
]

/** Порядок секций v2 листинга «Судоремонт» (после hero). */
export const SERVICES_MARKETING_V2_SECTION_ORDER = [
  'reach',
  'solutions',
  'advantages',
  'guarantees',
  'preForm',
  'listing',
] as const

export type ServicesMarketingV2SectionId = (typeof SERVICES_MARKETING_V2_SECTION_ORDER)[number]

export const SERVICES_V2_SECTION_ADMIN_LABELS: Record<ServicesMarketingV2SectionId, string> = {
  reach: 'Глобальный охват',
  solutions: 'Комплексные решения',
  advantages: 'Преимущества',
  guarantees: 'Гарантии качества',
  preForm: 'CTA перед формой',
  listing: 'Каталог услуг (карточки из админки)',
}

const EMPTY_SERVICES_V2: ServicesMarketingPageContent = {
  sec1Hero: {
    title: '',
    lead: '',
    body: '<p></p>',
  },
  sec2Reach: {
    title: '',
    paragraph1: '<p></p>',
    paragraph2: '<p></p>',
  },
  sec3Solutions: {
    title: '',
    body: '<p></p>',
    cards: [],
  },
  sec4Advantages: {
    title: '',
    cards: [],
  },
  sec5Guarantees: {
    title: '',
    paragraph1: '<p></p>',
    paragraph2: '<p></p>',
  },
  sec6PreForm: {
    title: '',
    body: '<p></p>',
  },
}

export function defaultServicesMarketingContent(_locale: MarineContentLocale): ServicesMarketingPageContent {
  return JSON.parse(JSON.stringify(EMPTY_SERVICES_V2)) as ServicesMarketingPageContent
}

export function mergeServicesMarketingContent(
  raw: unknown,
  base: ServicesMarketingPageContent,
): ServicesMarketingPageContent {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(base)) as ServicesMarketingPageContent
  }
  const r = raw as Partial<ServicesMarketingPageContent>
  const s2 = r.sec2Reach
  const s3 = r.sec3Solutions
  const s4 = r.sec4Advantages
  const s5 = r.sec5Guarantees
  const s6 = r.sec6PreForm
  return {
    sec1Hero: {
      title: typeof r.sec1Hero?.title === 'string' ? r.sec1Hero.title : base.sec1Hero.title,
      lead: typeof r.sec1Hero?.lead === 'string' ? r.sec1Hero.lead : base.sec1Hero.lead,
      body: typeof r.sec1Hero?.body === 'string' ? r.sec1Hero.body : base.sec1Hero.body,
    },
    sec2Reach: {
      title: typeof s2?.title === 'string' ? s2.title : base.sec2Reach.title,
      paragraph1: typeof s2?.paragraph1 === 'string' ? s2.paragraph1 : base.sec2Reach.paragraph1,
      paragraph2: typeof s2?.paragraph2 === 'string' ? s2.paragraph2 : base.sec2Reach.paragraph2,
    },
    sec3Solutions: {
      title: typeof s3?.title === 'string' ? s3.title : base.sec3Solutions.title,
      body: typeof s3?.body === 'string' ? s3.body : base.sec3Solutions.body,
      cards: normalizeAboutRichCards(s3?.cards, base.sec3Solutions.cards),
    },
    sec4Advantages: {
      title: typeof s4?.title === 'string' ? s4.title : base.sec4Advantages.title,
      cards: normalizeAboutRichCards(s4?.cards, base.sec4Advantages.cards),
    },
    sec5Guarantees: {
      title: typeof s5?.title === 'string' ? s5.title : base.sec5Guarantees.title,
      paragraph1: typeof s5?.paragraph1 === 'string' ? s5.paragraph1 : base.sec5Guarantees.paragraph1,
      paragraph2: typeof s5?.paragraph2 === 'string' ? s5.paragraph2 : base.sec5Guarantees.paragraph2,
    },
    sec6PreForm: {
      title: typeof s6?.title === 'string' ? s6.title : base.sec6PreForm.title,
      body: typeof s6?.body === 'string' ? s6.body : base.sec6PreForm.body,
    },
  }
}

export function defaultServicesHeroButtons(_locale: MarineContentLocale): LineMarketingHeroButton[] {
  return []
}

export function defaultServicesPageListingData(locale: MarineContentLocale): ListingPageData {
  const v2 = defaultServicesMarketingContent(locale)
  const vis: Record<string, boolean> = {}
  for (const id of SERVICES_MARKETING_V2_SECTION_ORDER) {
    vis[id] = true
  }
  return {
    hero: { titleFormatted: themeTitleTriple(v2.sec1Hero.title, '', ''), lead: v2.sec1Hero.lead },
    cta: { title: '', buttonText: '' },
    showInquiryForm: true,
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    heroImage: '',
    heroButtons: defaultServicesHeroButtons(locale),
    servicesPageLayout: 'v2',
    servicesV2: v2,
    sectionOrder: [...SERVICES_MARKETING_V2_SECTION_ORDER],
    sectionVisibility: vis,
    customSections: [],
  }
}

/** Классический листинг услуг (hero в CMS + сетка + отдельный CTA), без маркетинговых секций v2. */
export function defaultServicesPageLegacyListingData(locale: MarineContentLocale): ListingPageData {
  return {
    hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' },
    cta: { title: '', buttonText: '' },
    showInquiryForm: false,
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    heroImage: '',
    servicesPageLayout: 'legacy',
    sectionOrder: ['listing', 'cta'],
    sectionVisibility: {},
    customSections: [],
  }
}

/** Определяем режим по сохранённому JSON (обратная совместимость без `servicesV2`). */
export function servicesPageDataIsLegacy(p: Partial<ListingPageData>): boolean {
  if (p.servicesPageLayout === 'legacy') {
    return true
  }
  if (p.servicesPageLayout === 'v2') {
    return false
  }
  return p.servicesV2 == null || typeof p.servicesV2 !== 'object'
}

function trimStr(s: string): string {
  return s.trim()
}

/** Перед сохранением в CMS: обрезка полей и лимит карточек. */
export function normalizeServicesV2Payload(page: ListingPageData): void {
  if (page.servicesPageLayout !== 'v2' || !page.servicesV2) {
    return
  }
  const v = page.servicesV2
  v.sec1Hero.title = trimStr(v.sec1Hero.title)
  v.sec1Hero.lead = trimStr(v.sec1Hero.lead)
  v.sec1Hero.body = v.sec1Hero.body.trim()
  v.sec2Reach.title = trimStr(v.sec2Reach.title)
  v.sec2Reach.paragraph1 = v.sec2Reach.paragraph1.trim()
  v.sec2Reach.paragraph2 = v.sec2Reach.paragraph2.trim()
  v.sec3Solutions.title = trimStr(v.sec3Solutions.title)
  v.sec3Solutions.body = v.sec3Solutions.body.trim()
  v.sec3Solutions.cards = v.sec3Solutions.cards.slice(0, 4)
  v.sec4Advantages.title = trimStr(v.sec4Advantages.title)
  v.sec4Advantages.cards = v.sec4Advantages.cards.slice(0, 4)
  v.sec5Guarantees.title = trimStr(v.sec5Guarantees.title)
  v.sec5Guarantees.paragraph1 = v.sec5Guarantees.paragraph1.trim()
  v.sec5Guarantees.paragraph2 = v.sec5Guarantees.paragraph2.trim()
  v.sec6PreForm.title = trimStr(v.sec6PreForm.title)
  v.sec6PreForm.body = v.sec6PreForm.body.trim()
  for (const c of v.sec3Solutions.cards) {
    c.title = trimStr(c.title)
    c.text = c.text.trim()
  }
  for (const c of v.sec4Advantages.cards) {
    c.title = trimStr(c.title)
    c.text = c.text.trim()
  }
}
