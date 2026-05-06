import type {
  AboutGeoLocation,
  AboutRichCard,
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

const SERVICES_V2_RU: ServicesMarketingPageContent = {
  sec1Hero: {
    title: 'Судоремонт в любой точке мира. Техническая экспертиза и глобальная логистика Marine Technical Solutions',
    lead: 'В морском бизнесе время — самый ценный ресурс.',
    body:
      '<p>Каждый день вынужденного простоя судна из-за технической неисправности оборачивается значительными убытками для судовладельца. '
      + 'Marine Technical Solutions (MTS) предлагает услуги по организации и проведению судоремонта '
      + '<strong>любой уровня сложности</strong> в любой точке мира, обеспечивая восстановление технической готовности вашего флота в кратчайшие сроки.</p>',
  },
  sec2Reach: {
    title: 'Глобальный охват. Мы там, где ваше судно',
    paragraph1:
      '<p>Благодаря штаб-квартире в Калининграде, MTS обладает уникальной возможностью координировать ремонтные работы в ключевых морских регионах — '
      + 'от Балтики и Северной Европы до Персидского залива и Юго-Восточной Азии.</p>',
    paragraph2:
      '<p>Мы не ограничены мощностями одной верфи. Наша партнерская сеть включает ведущие судоремонтные предприятия по всему миру, '
      + 'что позволяет нам выбирать оптимальную локацию для ремонта, исходя из текущего местоположения судна и специфики требуемых работ.</p>',
  },
  sec3Solutions: {
    title: 'Комплексные решения по судоремонту',
    body:
      '<p>MTS обеспечивает полное сопровождение ремонтных процессов, действуя как единый центр ответственности:</p>',
    cards: [
      {
        title: 'Плановое докование (Dry-docking)',
        text:
          '<p>Полный цикл управления процессом: от подготовки детальных ремонтных ведомостей и проведения тендеров среди верфей до финальной приемки работ и закрытия счетов.</p>',
      },
      {
        title: 'Аварийный ремонт (Emergency Repairs)',
        text:
          '<p>Оперативное реагирование на внеплановые поломки. Организация выезда мобильных ремонтных бригад и доставки необходимых запчастей в любой порт мира.</p>',
      },
      {
        title: 'Ремонт во время рейса (Riding Squads)',
        text:
          '<p>Выполнение работ без вывода судна из эксплуатации. Квалифицированные специалисты проводят ремонт двигателей, систем автоматики и стальных конструкций прямо во время перехода.</p>',
      },
      {
        title: 'Модернизация и переоборудование',
        text:
          '<p>Техническое сопровождение проектов по установке систем очистки балластных вод (BWTS), скрубберов и адаптации судов под новые экологические стандарты (EEXI/CII).</p>',
      },
    ],
  },
  sec4Advantages: {
    title: 'Преимущества ремонта с Marine Technical Solutions',
    cards: [
      {
        title: 'Инженерный бэкграунд',
        text:
          '<p>Опыт как EPC-компании позволяет проводить глубокую дефектовку и находить эффективные инженерные решения там, где другие предлагают дорогостоящую замену узлов.</p>',
      },
      {
        title: 'Прозрачность и контроль',
        text:
          '<p>Технические суперинтенданты лично присутствуют на борту, осуществляя ежечасный надзор за качеством и соблюдением графиков работ.</p>',
      },
      {
        title: 'Собственная база специалистов',
        text:
          '<p>Благодаря крюинговому подразделению, привлекаем опытных механиков и инженеров, имеющих реальный опыт эксплуатации данного типа оборудования.</p>',
      },
      {
        title: 'Снабжение и логистика',
        text:
          '<p>Поиск оригинальных запчастей и их таможенная очистка, минимизация логистических задержек.</p>',
      },
    ],
  },
  sec5Guarantees: {
    title: 'Надежность, подтвержденная результатом',
    paragraph1:
      '<p>Для Marine Technical Solutions судоремонт — это не просто устранение поломки, а вклад в долгосрочную стоимость вашего актива. '
      + 'Мы гарантируем соблюдение стандартов классификационных обществ и международных норм безопасности на каждом этапе работ.</p>',
    paragraph2:
      '<p>Независимо от того, требуется ли вам плановое обслуживание в <strong>Сингапуре</strong>, замена двигателя в <strong>Роттердаме</strong> '
      + 'или оперативный ремонт в <strong>Дубае</strong> — MTS обеспечит профессиональный результат.</p>',
  },
  sec6PreForm: {
    title: 'Вашему судну требуется ремонт или техническая инспекция?',
    body: '<p>Свяжитесь с нашими техническими специалистами для получения предварительной оценки и расчета сметы.</p>',
  },
}

const SERVICES_V2_EN: ServicesMarketingPageContent = {
  sec1Hero: {
    title: 'Ship repair worldwide. Technical expertise and global logistics by Marine Technical Solutions',
    lead: 'In shipping, time is your most valuable asset.',
    body:
      '<p>Every day of forced downtime caused by a technical failure means significant losses for the owner. '
      + 'Marine Technical Solutions (MTS) organises and delivers ship repair of <strong>any complexity</strong> anywhere in the world, '
      + 'restoring your fleet’s technical readiness as quickly as possible.</p>',
  },
  sec2Reach: {
    title: 'Global reach. We are where your vessel is',
    paragraph1:
      '<p>From our headquarters in Kaliningrad, MTS can coordinate repair work across key maritime regions — '
      + 'from the Baltic and Northern Europe to the Persian Gulf and South-East Asia.</p>',
    paragraph2:
      '<p>We are not limited to a single yard. Our partner network includes leading ship repair facilities worldwide, '
      + 'so we can choose the optimal location based on the vessel’s position and the work scope.</p>',
  },
  sec3Solutions: {
    title: 'Integrated ship repair solutions',
    body: '<p>MTS provides end-to-end repair support, acting as a single point of accountability:</p>',
    cards: [
      {
        title: 'Planned dry-docking',
        text:
          '<p>Full process control: from detailed repair specifications and yard tendering to final acceptance and invoice closure.</p>',
      },
      {
        title: 'Emergency repairs',
        text:
          '<p>Rapid response to unplanned breakdowns. Deployment of mobile repair teams and delivery of critical spares to any port worldwide.</p>',
      },
      {
        title: 'Riding squads',
        text:
          '<p>Repairs without off-hire. Skilled specialists work on engines, automation and steel while the vessel remains in service during the passage.</p>',
      },
      {
        title: 'Retrofits & upgrades',
        text:
          '<p>Technical support for BWTS and scrubber projects, and compliance with environmental rules such as EEXI/CII.</p>',
      },
    ],
  },
  sec4Advantages: {
    title: 'Why repair with Marine Technical Solutions',
    cards: [
      {
        title: 'Engineering depth',
        text:
          '<p>Our EPC background enables thorough defect analysis and cost-effective engineering options instead of premature replacement.</p>',
      },
      {
        title: 'Transparency & control',
        text:
          '<p>Superintendents are on board to supervise quality and keep the work schedule on track, hour by hour.</p>',
      },
      {
        title: 'In-house specialist pool',
        text:
          '<p>Through our crewing arm we source experienced marine engineers and technicians with relevant equipment experience.</p>',
      },
      {
        title: 'Supply & logistics',
        text:
          '<p>OEM spares sourcing and customs clearance, with logistics delays kept to a minimum.</p>',
      },
    ],
  },
  sec5Guarantees: {
    title: 'Reliability backed by delivery',
    paragraph1:
      '<p>For MTS, ship repair is not only fixing a fault — it protects the long-term value of your asset. '
      + 'We uphold classification society requirements and international safety standards at every stage.</p>',
    paragraph2:
      '<p>Whether you need scheduled work in <strong>Singapore</strong>, an engine replacement in <strong>Rotterdam</strong> '
      + 'or a fast response in <strong>Dubai</strong> — MTS will deliver a professional result.</p>',
  },
  sec6PreForm: {
    title: 'Does your vessel need repair or a technical inspection?',
    body: '<p>Contact our technical team for a preliminary assessment and budget estimate.</p>',
  },
}

export function defaultServicesMarketingContent(locale: MarineContentLocale): ServicesMarketingPageContent {
  const src = locale === 'en' ? SERVICES_V2_EN : SERVICES_V2_RU
  return JSON.parse(JSON.stringify(src)) as ServicesMarketingPageContent
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

export function defaultServicesHeroButtons(locale: MarineContentLocale): LineMarketingHeroButton[] {
  return [
    {
      label: locale === 'en' ? 'Request a quote' : 'Рассчитать смету',
      href: '#page-inquiry',
    },
    {
      label: locale === 'en' ? 'Urgent repair' : 'Срочный ремонт',
      href: '/contacts',
    },
  ]
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
