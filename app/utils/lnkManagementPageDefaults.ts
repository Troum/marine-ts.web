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

const LNK_V2_RU: LnkPageContent = {
  sec1Hero: {
    title: 'Лаборатория неразрушающего контроля (ЛНК) «Марин Техникал Солюшионс»',
    lead:
      'Лаборатория неразрушающего контроля ООО «МТС» — это специализированное подразделение, обеспечивающее высокоточный технический аудит морских активов. Наша деятельность направлена на превентивное выявление износа корпусных конструкций и систем, что является фундаментом безопасности мореплавания и экономической устойчивости судовладельца.',
    body: '',
  },
  sec2Competencies: {
    title: 'Ключевые компетенции и услуги',
    columns: 2,
    cards: [
      {
        icon: 'ClipboardList',
        hideIcon: false,
        title: 'Ультразвуковая толщинометрия (UTM):',
        text:
          '<p>Проведение комплексных замеров остаточных толщин корпуса судна, настилов палуб, переборок и элементов набора. Мы предоставляем детализированные отчеты, соответствующие требованиям классификационных обществ.</p>',
      },
      {
        icon: 'Plane',
        hideIcon: false,
        title: 'Диагностика судовых систем:',
        text:
          '<p>Дефектоскопия трубопроводов гидравлических и топливных систем. Своевременный контроль позволяет исключить риск внезапных протечек и загрязнения окружающей среды.</p>',
      },
      {
        icon: 'Users',
        hideIcon: false,
        title: 'Подготовка к освидетельствованию:',
        text:
          '<p>Проведение дефектации судна перед плановыми ремонтами или предъявлением инспекторам классификационного общества.</p>',
      },
      {
        icon: 'PieChart',
        hideIcon: false,
        title: 'Контроль сварных соединений:',
        text:
          '<p>Проверка качества ремонтных работ на соответствие международным стандартам прочности.</p>',
      },
    ],
  },
  sec3StrategicAdvantages: {
    title: 'Стратегические преимущества для заказчика',
    columns: 2,
    cards: [
      {
        icon: 'Database',
        hideIcon: false,
        title: '1. Минимизация рисков PSC:',
        text:
          '<p>Качественная диагностика ЛНК позволяет устранить потенциальные замечания Портового государственного контроля (PSC) еще на стадии подготовки, исключая необоснованные задержки судна в порту.</p>',
      },
      {
        icon: 'Scale',
        hideIcon: false,
        title: '2. Оптимизация ремонтного бюджета:',
        text:
          '<p>Благодаря точным данным о состоянии металла, судовладелец может планировать объем сварочных и корпусных работ с точностью до квадратного метра, избегая лишних затрат.</p>',
      },
      {
        icon: 'BadgeCheck',
        hideIcon: false,
        title: '3. Защита инвестиций:',
        text:
          '<p>Регулярный неразрушающий контроль продлевает жизненный цикл актива и сохраняет его высокую рыночную стоимость (resale value).</p>',
      },
      {
        icon: 'Shield',
        hideIcon: false,
        title: '4. Мобильность и оперативность:',
        text:
          '<p>Наши специалисты готовы к выезду для проведения работ в портах и на судоремонтных предприятиях, минимизируя время нахождения судна вне коммерческой эксплуатации.</p>',
      },
    ],
  },
  sec4TechBase: {
    titleHtml: '<p>Технологическая база</p>',
    bodyHtml:
      '<p>Лаборатория оснащена современным поверенным оборудованием, позволяющим проводить замеры даже в труднодоступных местах и через лакокрасочные покрытия. Все работы выполняются квалифицированным персоналом, имеющим соответствующие допуски и сертификаты.</p>'
      + '<p>Точность измерений — гарантия долголетия вашего флота.</p>',
  },
}

const LNK_V2_EN: LnkPageContent = {
  sec1Hero: {
    title: 'Non-destructive testing laboratory (NDT), Marine Technical Solutions',
    lead:
      'Marine Technical Solutions’ non-destructive testing laboratory is a dedicated unit delivering high-precision technical audits of marine assets. We focus on proactively identifying wear in hull structures and systems — the foundation of safe navigation and the shipowner’s long-term resilience.',
    body: '',
  },
  sec2Competencies: {
    title: 'Key competencies and services',
    columns: 2,
    cards: [
      {
        icon: 'ClipboardList',
        hideIcon: false,
        title: 'Ultrasonic thickness measurement (UTM):',
        text:
          '<p>Comprehensive residual thickness surveys of the hull, deck plating, bulkheads and stiffeners. We deliver detailed reports aligned with classification society requirements.</p>',
      },
      {
        icon: 'Plane',
        hideIcon: false,
        title: 'Ship systems diagnostics:',
        text:
          '<p>Non-destructive testing of hydraulic and fuel piping. Early detection reduces the risk of sudden leaks and environmental incidents.</p>',
      },
      {
        icon: 'Users',
        hideIcon: false,
        title: 'Survey preparation:',
        text:
          '<p>Vessel defect surveys ahead of scheduled repairs or class inspections.</p>',
      },
      {
        icon: 'PieChart',
        hideIcon: false,
        title: 'Welded joint inspection:',
        text:
          '<p>Verification of repair quality against international strength and workmanship standards.</p>',
      },
    ],
  },
  sec3StrategicAdvantages: {
    title: 'Strategic benefits for our clients',
    columns: 2,
    cards: [
      {
        icon: 'Database',
        hideIcon: false,
        title: '1. Minimizing PSC risks:',
        text:
          '<p>High-quality NDT diagnostics help address potential Port State Control findings before they arise, avoiding unwarranted vessel delays in port.</p>',
      },
      {
        icon: 'Scale',
        hideIcon: false,
        title: '2. Repair budget optimization:',
        text:
          '<p>Accurate steel condition data lets owners plan welding and hull work down to square metres, reducing unnecessary spend.</p>',
      },
      {
        icon: 'BadgeCheck',
        hideIcon: false,
        title: '3. Protecting your investment:',
        text:
          '<p>Regular non-destructive testing extends asset life and helps preserve strong resale value.</p>',
      },
      {
        icon: 'Shield',
        hideIcon: false,
        title: '4. Mobility and responsiveness:',
        text:
          '<p>Our specialists deploy to ports and shipyards to keep time off-hire to a minimum.</p>',
      },
    ],
  },
  sec4TechBase: {
    titleHtml: '<p>Technical capabilities</p>',
    bodyHtml:
      '<p>The laboratory is equipped with modern, calibrated instruments that allow measurements even in hard-to-reach areas and through paint coatings. All work is performed by qualified personnel with the appropriate approvals and certificates.</p>'
      + '<p>Measurement accuracy is the foundation of your fleet’s long service life.</p>',
  },
}

export function defaultLnkManagementContent(locale: MarineContentLocale): LnkPageContent {
  const src = locale === 'en' ? LNK_V2_EN : LNK_V2_RU
  return JSON.parse(JSON.stringify(src)) as LnkPageContent
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
