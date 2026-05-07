import type { MarineContentLocale, ShipManagementPageContent } from '~/types'
import { normalizeAboutRichCards } from '~/utils/aboutRichCardNormalize'

/** Встроенные секции v2 после hero (без отдельного CTA — финальный блок в `sec5Closing`). */
export const SHIP_MANAGEMENT_V2_SECTION_ORDER = ['approach', 'checklist', 'services', 'advantages', 'trust'] as const

export type ShipManagementV2SectionId = (typeof SHIP_MANAGEMENT_V2_SECTION_ORDER)[number]

const EMPTY_SHIP_V2: ShipManagementPageContent = {
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
  sec5Closing: {
    title: '',
    paragraph1: '<p></p>',
    paragraph2: '<p></p>',
  },
}

export function defaultShipManagementContent(_locale: MarineContentLocale): ShipManagementPageContent {
  return JSON.parse(JSON.stringify(EMPTY_SHIP_V2)) as ShipManagementPageContent
}

export function mergeShipManagementContent(
  raw: unknown,
  base: ShipManagementPageContent,
): ShipManagementPageContent {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(base)) as ShipManagementPageContent
  }
  const r = raw as Partial<ShipManagementPageContent>
  const s2 = r.sec2Approach
  const s3 = r.sec3Services
  const s4 = r.sec4Advantages
  const s5 = r.sec5Closing
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
    sec5Closing: {
      title: typeof s5?.title === 'string' ? s5.title : base.sec5Closing.title,
      paragraph1:
        typeof s5?.paragraph1 === 'string' ? s5.paragraph1 : base.sec5Closing.paragraph1,
      paragraph2:
        typeof s5?.paragraph2 === 'string' ? s5.paragraph2 : base.sec5Closing.paragraph2,
    },
  }
}
