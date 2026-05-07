import type {
  LnkCardGridSection,
  LnkMarketingCard,
  LnkPageContent,
  MarineContentLocale,
  ShipManagementPageContent,
} from '~/types'

/** Порядок встроенных секций ЛНК после hero. */
export const LNK_V2_SECTION_ORDER = ['competencies', 'strategicAdvantages', 'techBase'] as const

export type LnkV2SectionId = (typeof LNK_V2_SECTION_ORDER)[number]

/** Подписи в админке (порядок секций / фоны). */
export const LNK_V2_SECTION_ADMIN_LABELS: Record<LnkV2SectionId, string> = {
  competencies: 'Ключевые компетенции и услуги',
  strategicAdvantages: 'Стратегические преимущества для заказчика',
  techBase: 'Технологическая база',
}

const ICON_CYCLE = ['ClipboardList', 'Plane', 'Users', 'PieChart', 'RefreshCw', 'Ship'] as const

function pickIcon(i: number): string {
  return ICON_CYCLE[i % ICON_CYCLE.length]!
}

function escapePlainTitleForHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function migrateShipShapedToLnkPage(old: ShipManagementPageContent, base: LnkPageContent): LnkPageContent {
  const t = old.sec5Closing.title.trim()
  return {
    sec1Hero: {
      title: old.sec1Hero.title || base.sec1Hero.title,
      lead: old.sec1Hero.lead || base.sec1Hero.lead,
      body: typeof old.sec1Hero.body === 'string' ? old.sec1Hero.body : base.sec1Hero.body,
    },
    sec2Competencies: {
      title: old.sec3Services.title || base.sec2Competencies.title,
      columns: base.sec2Competencies.columns,
      cards: old.sec3Services.cards.map((c, i) => ({
        icon: pickIcon(i),
        hideIcon: false,
        title: c.title,
        text: c.text,
      })),
    },
    sec3StrategicAdvantages: {
      title: old.sec4Advantages.title || base.sec3StrategicAdvantages.title,
      columns: base.sec3StrategicAdvantages.columns,
      cards: old.sec4Advantages.cards.map((c, i) => ({
        icon: pickIcon(i),
        hideIcon: false,
        title: c.title,
        text: c.text,
      })),
    },
    sec4TechBase: {
      titleHtml:
        t.length > 0 ? `<p>${escapePlainTitleForHtml(old.sec5Closing.title)}</p>` : base.sec4TechBase.titleHtml,
      bodyHtml:
        [old.sec5Closing.paragraph1, old.sec5Closing.paragraph2].filter((x) => x?.trim()).join('') ||
        base.sec4TechBase.bodyHtml,
    },
  }
}

/** Если в JSON ещё старая схема «как судовой менеджмент» — приводим к LnkPageContent. */
function coerceLegacyLnkV2Raw(raw: unknown, base: LnkPageContent): unknown {
  if (!raw || typeof raw !== 'object') {
    return raw
  }
  const r = raw as Record<string, unknown>
  if ('sec2Competencies' in r) {
    return raw
  }
  if ('sec3Services' in r && 'sec4Advantages' in r && 'sec5Closing' in r) {
    return migrateShipShapedToLnkPage(raw as ShipManagementPageContent, base)
  }
  return raw
}

function normalizeLnkCards(incoming: unknown, fallback: LnkMarketingCard[]): LnkMarketingCard[] {
  if (!Array.isArray(incoming)) {
    return fallback.map((c) => ({ ...c }))
  }
  if (incoming.length === 0) {
    return []
  }
  return incoming.map((item, i) => {
    const fb = fallback[i]
    const o = item as Partial<LnkMarketingCard>
    return {
      icon: typeof o.icon === 'string' ? o.icon : (fb?.icon ?? 'ClipboardList'),
      hideIcon: typeof o.hideIcon === 'boolean' ? o.hideIcon : fb?.hideIcon,
      title: typeof o.title === 'string' ? o.title : (fb?.title ?? ''),
      text: typeof o.text === 'string' ? o.text : (fb?.text ?? ''),
    }
  })
}

function mergeLnkCardGridSection(raw: Partial<LnkCardGridSection> | undefined, base: LnkCardGridSection): LnkCardGridSection {
  const cols = raw?.columns
  return {
    title: typeof raw?.title === 'string' ? raw.title : base.title,
    columns:
      typeof cols === 'number' && cols >= 1 && cols <= 6
        ? Math.floor(cols)
        : base.columns,
    cards: normalizeLnkCards(raw?.cards, base.cards),
  }
}

const EMPTY_LNK_V2: LnkPageContent = {
  sec1Hero: {
    title: '',
    lead: '',
    body: '<p></p>',
  },
  sec2Competencies: {
    title: '',
    columns: 2,
    cards: [],
  },
  sec3StrategicAdvantages: {
    title: '',
    columns: 2,
    cards: [],
  },
  sec4TechBase: {
    titleHtml: '<p></p>',
    bodyHtml: '<p></p>',
  },
}

export function defaultLnkManagementContent(_locale: MarineContentLocale): LnkPageContent {
  return JSON.parse(JSON.stringify(EMPTY_LNK_V2)) as LnkPageContent
}

export function mergeLnkManagementContent(raw: unknown, base: LnkPageContent): LnkPageContent {
  const coerced = coerceLegacyLnkV2Raw(raw, base)
  if (!coerced || typeof coerced !== 'object') {
    return JSON.parse(JSON.stringify(base)) as LnkPageContent
  }
  const r = coerced as Partial<LnkPageContent>
  const tb = r.sec4TechBase
  return {
    sec1Hero: {
      title: typeof r.sec1Hero?.title === 'string' ? r.sec1Hero.title : base.sec1Hero.title,
      lead: typeof r.sec1Hero?.lead === 'string' ? r.sec1Hero.lead : base.sec1Hero.lead,
      body: typeof r.sec1Hero?.body === 'string' ? r.sec1Hero.body : base.sec1Hero.body,
    },
    sec2Competencies: mergeLnkCardGridSection(r.sec2Competencies, base.sec2Competencies),
    sec3StrategicAdvantages: mergeLnkCardGridSection(r.sec3StrategicAdvantages, base.sec3StrategicAdvantages),
    sec4TechBase: {
      titleHtml: typeof tb?.titleHtml === 'string' ? tb.titleHtml : base.sec4TechBase.titleHtml,
      bodyHtml: typeof tb?.bodyHtml === 'string' ? tb.bodyHtml : base.sec4TechBase.bodyHtml,
    },
  }
}
