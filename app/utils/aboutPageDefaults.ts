import type {
  AboutPageData,
  AboutPrinciple,
  AboutRichCard,
  AboutServiceCard,
  MarineContentLocale,
} from '~/types'
import { normalizeCustomPageSections } from '~/utils/customPageSections'
import { incomingCmsValueToHtml } from '~/utils/adminHtmlField'
import { mergeAboutHero, themeFormattedTitleToHtml, themeTitleTriple } from '~/utils/themeFormattedTitle'
import { normalizePageInquiryFormConfig } from '~/utils/pageInquiryFormOptions'

import { normalizeAboutRichCards } from '~/utils/aboutRichCardNormalize'

const LEGACY_SECTION_IDS = new Set(['ecosystem', 'mission', 'why', 'stats'])

function principleToRichCard(p: AboutPrinciple): AboutRichCard {
  const raw = p.text ?? ''
  const m = raw.match(/^(.*?)\s+[—–-]\s+(.+)$/)
  if (m) {
    return { title: (m[1]?.trim() ?? ''), text: (m[2]?.trim() ?? '') }
  }
  return { title: '', text: raw }
}

function migrateSectionOrder(raw: unknown, base: string[]): string[] {
  if (!Array.isArray(raw)) {
    return [...base]
  }
  const ids = raw.filter((id): id is string => typeof id === 'string')
  const filtered = ids.filter((id) => !LEGACY_SECTION_IDS.has(id))
  return filtered.length ? [...filtered] : [...base]
}

function isLegacyAboutRaw(p: Record<string, unknown>): boolean {
  if (p.sec1Hero != null && typeof p.sec1Hero === 'object') {
    return false
  }
  return p.hero != null && typeof p.hero === 'object'
}

function migrateLegacyAbout(
  locale: MarineContentLocale,
  p: Record<string, unknown>,
  base: AboutPageData,
): AboutPageData {
  const heroRaw = p.hero
  const heroBase = {
    title: base.sec1Hero.title,
    subtitle: '',
    lead: '',
    lead2: '',
  }
  const mergedHero = mergeAboutHero(heroRaw, heroBase)
  const bodyChunks = [mergedHero.lead, mergedHero.lead2].filter(
    (x) => typeof x === 'string' && x.trim().length > 0,
  )
  const sec1Body = bodyChunks.length ? bodyChunks.join('<br><br>') : base.sec1Hero.body

  const eco = p.ecosystem as { title?: string; lead?: string; services?: AboutServiceCard[] } | undefined
  const s2Cards: AboutRichCard[] =
    Array.isArray(eco?.services) && eco!.services.length > 0
      ? eco!.services.map((s) => ({
        title: typeof s.title === 'string' ? s.title : '',
        text: typeof s.text === 'string' ? s.text : '',
      }))
      : base.sec2History.cards.map((c) => ({ ...c }))

  const miss = p.mission as { principles?: AboutPrinciple[] } | undefined
  const s5Cards: AboutRichCard[] =
    Array.isArray(miss?.principles) && miss!.principles!.length > 0
      ? miss!.principles!.map(principleToRichCard)
      : base.sec5Mission.cards.map((c) => ({ ...c }))

  const historyImage =
    typeof p.historyImage === 'string' && p.historyImage
      ? p.historyImage
      : typeof p.introImage === 'string'
        ? p.introImage
        : base.historyImage

  const technicalImage =
    typeof p.technicalImage === 'string' && p.technicalImage
      ? p.technicalImage
      : typeof p.ecosystemImage === 'string'
        ? p.ecosystemImage
        : base.technicalImage

  const geoLegacy = p.geography as Partial<AboutPageData['geography']> | undefined
  const geographyMerged =
    geoLegacy && typeof geoLegacy === 'object'
      ? {
          ...base.geography,
          ...geoLegacy,
          locations: geoLegacy.locations ?? base.geography.locations,
        }
      : base.geography

  const certLegacy = p.certificates as Partial<AboutPageData['certificates']> | undefined
  const certificatesMerged =
    certLegacy && typeof certLegacy === 'object'
      ? {
          ...base.certificates,
          ...certLegacy,
          items: certLegacy.items ?? base.certificates.items,
        }
      : base.certificates

  return {
    ...base,
    aboutVersion: 2,
    sec1Hero: {
      label: '',
      title: mergedHero.title,
      subtitle:
        typeof mergedHero.subtitle === 'string' && mergedHero.subtitle.trim() !== ''
          ? mergedHero.subtitle
          : '',
      body: incomingCmsValueToHtml(sec1Body),
    },
    sec2History: {
      title: typeof eco?.title === 'string' ? eco.title : base.sec2History.title,
      body: typeof eco?.lead === 'string' ? incomingCmsValueToHtml(eco.lead) : base.sec2History.body,
      cards: s2Cards,
    },
    sec3Technical: { ...base.sec3Technical },
    sec4Crewing: { ...base.sec4Crewing },
    sec5Mission: {
      title:
        typeof (p.mission as { title?: string } | undefined)?.title === 'string'
          ? (p.mission as { title: string }).title
          : base.sec5Mission.title,
      body:
        typeof (p.mission as { lead?: string } | undefined)?.lead === 'string'
          ? incomingCmsValueToHtml((p.mission as { lead: string }).lead)
          : base.sec5Mission.body,
      cards: s5Cards,
    },
    sec6Closing: {
      title:
        typeof (p.why as { title?: string } | undefined)?.title === 'string'
          ? (p.why as { title: string }).title
          : base.sec6Closing.title,
      body:
        typeof (p.why as { text?: string } | undefined)?.text === 'string'
          ? incomingCmsValueToHtml((p.why as { text: string }).text)
          : base.sec6Closing.body,
    },
    heroImage: typeof p.heroImage === 'string' ? p.heroImage : base.heroImage,
    historyImage,
    technicalImage,
    crewingImage: typeof p.crewingImage === 'string' ? p.crewingImage : base.crewingImage,
    missionImage: typeof p.missionImage === 'string' ? p.missionImage : base.missionImage,
    geography: geographyMerged,
    certificates: certificatesMerged,
    showInquiryForm: typeof p.showInquiryForm === 'boolean' ? p.showInquiryForm : base.showInquiryForm,
    hideHeroPrimaryButton:
      typeof p.hideHeroPrimaryButton === 'boolean' ? p.hideHeroPrimaryButton : base.hideHeroPrimaryButton,
    hideHeroSecondaryButton:
      typeof p.hideHeroSecondaryButton === 'boolean' ? p.hideHeroSecondaryButton : base.hideHeroSecondaryButton,
    inquiryForm: normalizePageInquiryFormConfig(p.inquiryForm),
    hideInquiryFormIntro:
      typeof p.hideInquiryFormIntro === 'boolean' ? p.hideInquiryFormIntro : base.hideInquiryFormIntro,
    hideInquiryFormCardHeading:
      typeof p.hideInquiryFormCardHeading === 'boolean'
        ? p.hideInquiryFormCardHeading
        : base.hideInquiryFormCardHeading,
    customSections: normalizeCustomPageSections(p.customSections),
    sectionOrder: migrateSectionOrder(p.sectionOrder, base.sectionOrder ?? [...ABOUT_SECTION_DEFAULT_ORDER]),
    sectionVisibility:
      p.sectionVisibility && typeof p.sectionVisibility === 'object'
        ? (p.sectionVisibility as Record<string, boolean>)
        : { ...base.sectionVisibility },
  }
}

function mergeV2Fields(p: Record<string, unknown>, base: AboutPageData): AboutPageData {
  const g = p.geography as AboutPageData['geography'] | undefined
  const c = p.certificates as AboutPageData['certificates'] | undefined
  const s1 = p.sec1Hero as Partial<AboutPageData['sec1Hero']> | undefined
  const s2 = p.sec2History as Partial<AboutPageData['sec2History']> | undefined
  const s3 = p.sec3Technical as Partial<AboutPageData['sec3Technical']> | undefined
  const s4 = p.sec4Crewing as Partial<AboutPageData['sec4Crewing']> | undefined
  const s5 = p.sec5Mission as Partial<AboutPageData['sec5Mission']> | undefined
  const s6 = p.sec6Closing as Partial<AboutPageData['sec6Closing']> | undefined

  return {
    ...base,
    aboutVersion: 2,
    sec1Hero: {
      label: typeof s1?.label === 'string' ? s1.label : base.sec1Hero.label ?? '',
      title: typeof s1?.title === 'string' ? s1.title : base.sec1Hero.title,
      subtitle: typeof s1?.subtitle === 'string' ? s1.subtitle : base.sec1Hero.subtitle ?? '',
      body: typeof s1?.body === 'string' ? s1.body : base.sec1Hero.body,
    },
    sec2History: {
      title: typeof s2?.title === 'string' ? s2.title : base.sec2History.title,
      body: typeof s2?.body === 'string' ? s2.body : base.sec2History.body,
      cards: normalizeAboutRichCards(s2?.cards, base.sec2History.cards),
    },
    sec3Technical: {
      title: typeof s3?.title === 'string' ? s3.title : base.sec3Technical.title,
      lead: typeof s3?.lead === 'string' ? s3.lead : base.sec3Technical.lead,
      lead2: typeof s3?.lead2 === 'string' ? s3.lead2 : base.sec3Technical.lead2,
      cards: normalizeAboutRichCards(s3?.cards, base.sec3Technical.cards),
    },
    sec4Crewing: {
      title: typeof s4?.title === 'string' ? s4.title : base.sec4Crewing.title,
      lead: typeof s4?.lead === 'string' ? s4.lead : base.sec4Crewing.lead,
      lead2: typeof s4?.lead2 === 'string' ? s4.lead2 : base.sec4Crewing.lead2,
      cards: normalizeAboutRichCards(s4?.cards, base.sec4Crewing.cards),
    },
    sec5Mission: {
      title: typeof s5?.title === 'string' ? s5.title : base.sec5Mission.title,
      body: typeof s5?.body === 'string' ? s5.body : base.sec5Mission.body,
      cards: normalizeAboutRichCards(s5?.cards, base.sec5Mission.cards),
    },
    sec6Closing: {
      title: typeof s6?.title === 'string' ? s6.title : base.sec6Closing.title,
      body: typeof s6?.body === 'string' ? s6.body : base.sec6Closing.body,
    },
    heroImage: typeof p.heroImage === 'string' ? p.heroImage : base.heroImage,
    historyImage: typeof p.historyImage === 'string' ? p.historyImage : base.historyImage,
    technicalImage: typeof p.technicalImage === 'string' ? p.technicalImage : base.technicalImage,
    crewingImage: typeof p.crewingImage === 'string' ? p.crewingImage : base.crewingImage,
    missionImage: typeof p.missionImage === 'string' ? p.missionImage : base.missionImage,
    geography: g && typeof g === 'object' ? { ...base.geography, ...g, locations: g.locations ?? base.geography.locations } : base.geography,
    certificates:
      c && typeof c === 'object'
        ? { ...base.certificates, ...c, items: c.items ?? base.certificates.items }
        : base.certificates,
    showInquiryForm: typeof p.showInquiryForm === 'boolean' ? p.showInquiryForm : base.showInquiryForm,
    hideHeroPrimaryButton:
      typeof p.hideHeroPrimaryButton === 'boolean' ? p.hideHeroPrimaryButton : base.hideHeroPrimaryButton,
    hideHeroSecondaryButton:
      typeof p.hideHeroSecondaryButton === 'boolean' ? p.hideHeroSecondaryButton : base.hideHeroSecondaryButton,
    inquiryForm: normalizePageInquiryFormConfig(p.inquiryForm),
    hideInquiryFormIntro:
      typeof p.hideInquiryFormIntro === 'boolean' ? p.hideInquiryFormIntro : base.hideInquiryFormIntro,
    hideInquiryFormCardHeading:
      typeof p.hideInquiryFormCardHeading === 'boolean'
        ? p.hideInquiryFormCardHeading
        : base.hideInquiryFormCardHeading,
    customSections: normalizeCustomPageSections(p.customSections ?? base.customSections),
    sectionOrder: Array.isArray(p.sectionOrder) ? migrateSectionOrder(p.sectionOrder, base.sectionOrder ?? []) : base.sectionOrder,
    sectionVisibility:
      p.sectionVisibility && typeof p.sectionVisibility === 'object'
        ? (p.sectionVisibility as Record<string, boolean>)
        : base.sectionVisibility,
    hideFooter: typeof p.hideFooter === 'boolean' ? p.hideFooter : base.hideFooter,
  }
}

function emptyAboutPageData(_locale: MarineContentLocale): AboutPageData {
  const b = '<p></p>'
  return {
    aboutVersion: 2,
    sec1Hero: {
      label: '',
      title: '',
      subtitle: '',
      body: b,
    },
    hideHeroPrimaryButton: true,
    hideHeroSecondaryButton: true,
    sec2History: { title: '', body: b, cards: [] },
    sec3Technical: { title: '', lead: b, lead2: b, cards: [] },
    sec4Crewing: { title: '', lead: b, lead2: b, cards: [] },
    sec5Mission: { title: '', body: b, cards: [] },
    sec6Closing: { title: '', body: b },
    geography: { label: '', title: '', lead: '', locations: [] },
    certificates: { title: '', items: [] },
    showInquiryForm: false,
    inquiryForm: normalizePageInquiryFormConfig(undefined),
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    heroImage: '',
    historyImage: '',
    technicalImage: '',
    crewingImage: '',
    missionImage: '',
  }
}

const DEFAULTS: Record<MarineContentLocale, AboutPageData> = {
  ru: emptyAboutPageData('ru'),
  en: emptyAboutPageData('en'),
}

/** Дефолтный порядок блоков после шести основных секций. */
export const ABOUT_SECTION_DEFAULT_ORDER = ['geography', 'certificates'] as const

export type AboutSectionId = (typeof ABOUT_SECTION_DEFAULT_ORDER)[number]

/** Подписи разделов в админке для inline-контролов. */
export const ABOUT_SECTION_ADMIN_LABELS: Record<AboutSectionId, string> = {
  geography: 'География обслуживания',
  certificates: 'Сертификаты',
}

export function defaultAboutData(locale: MarineContentLocale): AboutPageData {
  const base = JSON.parse(JSON.stringify(DEFAULTS[locale])) as AboutPageData
  base.sectionOrder = [...ABOUT_SECTION_DEFAULT_ORDER]
  base.sectionVisibility = { ...base.sectionVisibility }
  return base
}

export function mergeAboutPageData(locale: MarineContentLocale, raw: unknown): AboutPageData {
  const base = defaultAboutData(locale)
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const p = raw as Record<string, unknown>
  if (isLegacyAboutRaw(p)) {
    return migrateLegacyAbout(locale, p, base)
  }
  return mergeV2Fields(p, base)
}

/**
 * Sync non-locale fields (lng/lat, labelOnRight, fileUrl, фоновые изображения, число карточек)
 * from source locale to all others.
 */
export function syncStructuralFields(
  data: Record<MarineContentLocale, AboutPageData>,
  sourceLocale: MarineContentLocale,
): void {
  const src = data[sourceLocale]
  for (const loc of Object.keys(data) as MarineContentLocale[]) {
    if (loc === sourceLocale) continue
    const dst = data[loc]

    const syncCards = (a: AboutRichCard[], b: AboutRichCard[]) => {
      if (b.length < a.length) {
        while (b.length < a.length) {
          b.push({ title: '', text: '' })
        }
      } else if (b.length > a.length) {
        b.length = a.length
      }
    }

    syncCards(src.sec2History.cards, dst.sec2History.cards)
    syncCards(src.sec3Technical.cards, dst.sec3Technical.cards)
    syncCards(src.sec4Crewing.cards, dst.sec4Crewing.cards)
    syncCards(src.sec5Mission.cards, dst.sec5Mission.cards)

    src.geography.locations.forEach((locSrc, i) => {
      if (!dst.geography.locations[i]) {
        dst.geography.locations[i] = { ...locSrc }
      } else {
        dst.geography.locations[i].lng = locSrc.lng
        dst.geography.locations[i].lat = locSrc.lat
        dst.geography.locations[i].labelOnRight = locSrc.labelOnRight
      }
    })
    dst.geography.locations.length = src.geography.locations.length

    src.certificates.items.forEach((c, i) => {
      if (!dst.certificates.items[i]) {
        dst.certificates.items[i] = { ...c }
      } else {
        dst.certificates.items[i].fileUrl = c.fileUrl
      }
    })
    dst.certificates.items.length = src.certificates.items.length

    dst.showInquiryForm = src.showInquiryForm
    dst.hideHeroPrimaryButton = src.hideHeroPrimaryButton
    dst.hideHeroSecondaryButton = src.hideHeroSecondaryButton
    dst.inquiryForm = normalizePageInquiryFormConfig(src.inquiryForm)
    dst.hideInquiryFormIntro = src.hideInquiryFormIntro
    dst.hideInquiryFormCardHeading = src.hideInquiryFormCardHeading
    dst.heroImage = src.heroImage
    dst.historyImage = src.historyImage
    dst.technicalImage = src.technicalImage
    dst.crewingImage = src.crewingImage
    dst.missionImage = src.missionImage

    if (Array.isArray(src.sectionOrder)) {
      dst.sectionOrder = [...src.sectionOrder]
    }
    if (src.sectionVisibility && typeof src.sectionVisibility === 'object') {
      dst.sectionVisibility = { ...src.sectionVisibility }
    }
    dst.hideFooter = src.hideFooter
  }
}
