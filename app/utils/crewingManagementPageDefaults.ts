import type { CrewingManagementPageContent, MarineContentLocale } from '~/types'
import { normalizeAboutRichCards } from '~/utils/aboutRichCardNormalize'

/** Порядок встроенных секций v2 после hero (включаются в `sectionOrder` без префикса `custom:`). */
export const CREWING_MANAGEMENT_V2_SECTION_ORDER = [
  'approach',
  'checklist',
  'services',
  'advantages',
  'trust',
  'cta',
] as const

export type CrewingManagementV2SectionId = (typeof CREWING_MANAGEMENT_V2_SECTION_ORDER)[number]

const EMPTY_CREWING_V2: CrewingManagementPageContent = {
  sec1Hero: {
    title: '',
    lead: '',
    body: '<p></p>',
  },
  sec2Approach: {
    title: '',
    body: '<p></p>',
    cardsHeading: '',
    cards: [],
  },
  sec3Services: {
    title: '',
    body: '<p></p>',
    cards: [],
  },
  sec4Advantages: {
    title: '',
    cards: [],
  },
  sec5Trust: {
    title: '',
    paragraph1: '<p></p>',
    paragraph2: '<p></p>',
  },
  sec6Cta: {
    title: '',
    body: '<p></p>',
  },
}

export function defaultCrewingManagementContent(_locale: MarineContentLocale): CrewingManagementPageContent {
  return JSON.parse(JSON.stringify(EMPTY_CREWING_V2)) as CrewingManagementPageContent
}

function splitLegacyTrustBody(body: string): { paragraph1: string; paragraph2: string } {
  const trimmed = body.trim()
  const paras = trimmed.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi)
  if (paras && paras.length >= 2) {
    return { paragraph1: paras[0]!, paragraph2: paras.slice(1).join('') }
  }
  return { paragraph1: trimmed, paragraph2: '' }
}

function mergeSec5Trust(
  raw: unknown,
  base: CrewingManagementPageContent['sec5Trust'],
): CrewingManagementPageContent['sec5Trust'] {
  const r = raw as Partial<{
    title?: string
    body?: string
    paragraph1?: string
    paragraph2?: string
  }>
  const title = typeof r.title === 'string' ? r.title : base.title
  if (typeof r.paragraph1 === 'string' || typeof r.paragraph2 === 'string') {
    return {
      title,
      paragraph1: typeof r.paragraph1 === 'string' ? r.paragraph1 : base.paragraph1,
      paragraph2: typeof r.paragraph2 === 'string' ? r.paragraph2 : base.paragraph2,
    }
  }
  if (typeof r.body === 'string' && r.body.trim()) {
    const sp = splitLegacyTrustBody(r.body)
    return {
      title,
      paragraph1: sp.paragraph1 || base.paragraph1,
      paragraph2: sp.paragraph2,
    }
  }
  return { ...base }
}

export function mergeCrewingManagementContent(
  raw: unknown,
  base: CrewingManagementPageContent,
): CrewingManagementPageContent {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(base)) as CrewingManagementPageContent
  }
  const r = raw as Partial<CrewingManagementPageContent>
  const s2 = r.sec2Approach
  const s3 = r.sec3Services
  const s4 = r.sec4Advantages
  return {
    sec1Hero: {
      title: typeof r.sec1Hero?.title === 'string' ? r.sec1Hero.title : base.sec1Hero.title,
      lead: typeof r.sec1Hero?.lead === 'string' ? r.sec1Hero.lead : base.sec1Hero.lead,
      body: typeof r.sec1Hero?.body === 'string' ? r.sec1Hero.body : base.sec1Hero.body,
    },
    sec2Approach: {
      title: typeof s2?.title === 'string' ? s2.title : base.sec2Approach.title,
      body: typeof s2?.body === 'string' ? s2.body : base.sec2Approach.body,
      cardsHeading:
        typeof s2?.cardsHeading === 'string' ? s2.cardsHeading : base.sec2Approach.cardsHeading,
      cards: normalizeAboutRichCards(s2?.cards, base.sec2Approach.cards),
    },
    sec3Services: {
      title: typeof s3?.title === 'string' ? s3.title : base.sec3Services.title,
      body: typeof s3?.body === 'string' ? s3.body : base.sec3Services.body,
      cards: normalizeAboutRichCards(s3?.cards, base.sec3Services.cards),
    },
    sec4Advantages: {
      title: typeof s4?.title === 'string' ? s4.title : base.sec4Advantages.title,
      cards: normalizeAboutRichCards(s4?.cards, base.sec4Advantages.cards),
    },
    sec5Trust: mergeSec5Trust(r.sec5Trust, base.sec5Trust),
    sec6Cta: {
      title: typeof r.sec6Cta?.title === 'string' ? r.sec6Cta.title : base.sec6Cta.title,
      body: typeof r.sec6Cta?.body === 'string' ? r.sec6Cta.body : base.sec6Cta.body,
    },
  }
}
