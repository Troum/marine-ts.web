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
import {
  DEFAULT_CREWING_CHECKLIST_SECTIONS_EN,
  DEFAULT_CREWING_CHECKLIST_SECTIONS_RU,
} from '~/utils/crewingChecklistDefaults'
import { normalizeCustomPageSections } from '~/utils/customPageSections'
import { SHIP_MANAGEMENT_DEFAULTS } from '~/utils/extraLinePageDefaults'
import type { LineMarketingPageSlug } from '~/utils/lineMarketingPages'
import { LINE_MARKETING_SECTION_DEFAULT_ORDER } from '~/utils/lineMarketingPages'
import {
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

/* ── Home page ── */

const HOME_DEFAULTS: Record<MarineContentLocale, HomePageData> = {
  ru: {
    hero: {
      label: 'Marine Technical Solutions',
      titleFormatted: migrateHomeHeroLegacy('Судовой и крюинг', 'менеджмент', ''),
      lead: 'Подбор экипажей и обслуживание судов. Работаем с судовладельцами и моряками по всему миру: классификация IACS, прозрачные процессы, понятный следующий шаг.',
      ctaClient: 'Оставить заявку',
      ctaClientHref: '/request',
      ctaSeafarer: 'Заполнить анкету',
      ctaSeafarerHref: '/application-form',
      badgeIso: '9001:2015',
      badgeIacs: 'Member',
      badgeYears: 'лет опыта',
      scroll: 'Листайте',
    },
    statsCard: {
      label: 'В цифрах',
      items: [
        { icon: 'Ship', value: '150+', label: 'Проектов по флоту' },
        { icon: 'MapPin', value: '15+', label: 'Портов и регионов' },
        { icon: 'Users', value: '50+', label: 'Специалистов' },
        { icon: 'Calendar', value: '14+', label: 'Лет на рынке' },
      ],
    },
    funnelShip: {
      label: 'Судовой менеджмент',
      titleFormatted: themeTitleTriple('Операционное и техническое', 'сопровождение', ' флота'),
      text: 'Планирование ремонтов, снабжение, взаимодействие с классом и подрядчиками — одна команда для судовладельца.',
      cta: 'Подробнее',
      href: '/ship-management',
    },
    funnelCrewing: {
      label: 'Крюинг',
      titleFormatted: themeTitleTriple('Работа для', 'моряков', ''),
      text: 'Актуальные вакансии и открытая анкета в базу кандидатов — выберите удобный сценарий.',
      cta: 'Вакансии',
      href: '/vacancies',
      secondaryCta: 'Заполнить анкету',
      secondaryHref: '/application-form',
    },
    funnelTechnical: {
      label: 'Сервисы',
      titleFormatted: themeTitleTriple('Инженерные ', 'решения', ' для флота'),
      text: 'Каталог услуг: техническое сопровождение, проекты и консультации — выберите направление и свяжитесь с нами.',
      cta: 'Каталог сервисов',
      href: '/services',
    },
    directions: {
      label: 'Направления',
      headingFormatted: themeTitleTriple('Чем мы', 'занимаемся', ''),
      rows: [
        {
          title: 'Судовой менеджмент',
          description: 'Управление эксплуатацией, ТОиР, контроль подрядчиков и документации.',
          cta: 'Перейти',
          href: '/ship-management',
        },
        {
          title: 'Крюинг',
          description: 'Подбор экипажей, контракты, сопровождение моряков и компаний.',
          cta: 'Крюинг',
          href: '/crewing-management',
        },
      ],
    },
    about: {
      label: 'О компании',
      titleFormatted: themeTitleTriple('Marine Technical Solutions —', 'международная', ' команда'),
      text: 'Инженерный и крюинговый опыт в одном окне: от заявки до сдачи работ и экипажа на борт.',
      more: 'Подробнее о компании',
    },
    trust: {
      label: 'Почему нам доверяют',
      titleFormatted: themeTitlePair('Опыт, география', 'и прозрачность'),
      bullets: [
        'Международные проекты и классификационные общества (IACS)',
        'Более 14 лет в судоходстве и сервисе',
        'Портфель завершённых работ и регулярные рейсы клиентов',
      ],
    },
    services: {
      label: 'Сервисы',
      headingFormatted: themeTitleTriple('Полный спектр ', 'морских', ' услуг'),
      all: 'Все сервисы',
      more: 'Подробнее →',
      featuredServiceIds: [],
    },
    process: {
      label: 'Процесс',
      headingFormatted: themeTitlePair('Три шага к', 'результату'),
      steps: [
        { title: 'Заявка и консультация', text: 'Принимаем обращение, уточняем задачу и согласуем следующий шаг.' },
        { title: 'Решение и реализация', text: 'Подбираем команду и формат работ в соответствии с требованиями класса и судовладельца.' },
        { title: 'Сдача и сопровождение', text: 'Передаём результат, оформляем документацию и остаёмся на связи по согласованным вопросам.' },
      ],
    },
    cta: {
      label: 'Свяжитесь с нами',
      titleFormatted: themeTitlePair('Готовы', 'обсудить задачу?'),
      text: 'Оставьте заявку или напишите на почту — ответим в рабочее время и предложим следующий шаг.',
      button: 'Оставить заявку',
    },
    showProcess: false,
    showInquiryForm: false,
  },
  en: {
    hero: {
      label: 'Marine Technical Solutions',
      titleFormatted: migrateHomeHeroLegacy('Ship & crew', 'management', ''),
      lead: 'Crewing and vessel support worldwide: IACS-aligned processes, one point of contact for owners and seafarers.',
      ctaClient: 'Request a quote',
      ctaClientHref: '/request',
      ctaSeafarer: 'Fill in application',
      ctaSeafarerHref: '/application-form',
      badgeIso: '9001:2015',
      badgeIacs: 'Member',
      badgeYears: 'years',
      scroll: 'Scroll',
    },
    statsCard: {
      label: 'Figures',
      items: [
        { icon: 'Ship', value: '150+', label: 'Fleet projects' },
        { icon: 'MapPin', value: '15+', label: 'Ports & regions' },
        { icon: 'Users', value: '50+', label: 'Specialists' },
        { icon: 'Calendar', value: '14+', label: 'Years in business' },
      ],
    },
    funnelShip: {
      label: 'Ship management',
      titleFormatted: themeTitleTriple('Operational & technical', 'support', ''),
      text: 'Repairs planning, supplies, class and yard coordination — one team for the shipowner.',
      cta: 'Learn more',
      href: '/ship-management',
    },
    funnelCrewing: {
      label: 'Crewing',
      titleFormatted: themeTitleTriple('Careers for', 'seafarers', ''),
      text: 'Open vacancies or submit an open application to our candidate pool.',
      cta: 'Vacancies',
      href: '/vacancies',
      secondaryCta: 'Fill in application',
      secondaryHref: '/application-form',
    },
    funnelTechnical: {
      label: 'Services',
      titleFormatted: themeTitleTriple('Engineering ', 'solutions', ''),
      text: 'Browse the catalogue — technical support, projects and consulting. Pick a line and get in touch.',
      cta: 'All services',
      href: '/services',
    },
    directions: {
      label: 'Focus areas',
      headingFormatted: themeTitleTriple('What we', 'do', ''),
      rows: [
        {
          title: 'Ship management',
          description: 'Operations, maintenance, contractors and documentation.',
          cta: 'Open',
          href: '/ship-management',
        },
        {
          title: 'Crewing',
          description: 'Recruitment, contracts, support for crews and companies.',
          cta: 'Crewing',
          href: '/crewing-management',
        },
      ],
    },
    about: {
      label: 'About',
      titleFormatted: themeTitleTriple('Marine Technical Solutions —', 'international', ' team'),
      text: 'Engineering and crewing in one window: from enquiry to delivery and crew on board.',
      more: 'About the company',
    },
    trust: {
      label: 'Why us',
      titleFormatted: themeTitlePair('Experience &', 'coverage'),
      bullets: [
        'International projects and IACS classification societies',
        '14+ years in shipping and marine services',
        'Delivered projects and repeat voyages with clients',
      ],
    },
    services: {
      label: 'Services',
      headingFormatted: themeTitleTriple('Full range of ', 'marine', ' services'),
      all: 'All services',
      more: 'Learn more →',
      featuredServiceIds: [],
    },
    process: {
      label: 'Process',
      headingFormatted: themeTitlePair('Three steps to', 'delivery'),
      steps: [
        { title: 'Request & consultation', text: 'We take your enquiry, clarify the scope and agree on the next step.' },
        { title: 'Solution & execution', text: 'We align the team and scope with class and owner requirements.' },
        { title: 'Handover & follow-up', text: 'We deliver results, complete documentation and stay available as agreed.' },
      ],
    },
    cta: {
      label: 'Contact us',
      titleFormatted: themeTitlePair('Ready to', 'talk?'),
      text: 'Leave a request or email us — we reply during business hours with the next step.',
      button: 'Request a quote',
    },
    showProcess: false,
    showInquiryForm: false,
  },
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
    showProcess: parsed.showProcess ?? def.showProcess,
    showInquiryForm: parsed.showInquiryForm ?? def.showInquiryForm,
    heroImage: parsed.heroImage !== undefined ? parsed.heroImage : def.heroImage,
    customSections: normalizeCustomPageSections(parsed.customSections),
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
    d.showProcess = src.showProcess
    d.heroImage = src.heroImage
    while (d.directions.rows.length < src.directions.rows.length) {
      d.directions.rows.push({ title: '', description: '', cta: '', href: '' })
    }
    d.directions.rows.length = src.directions.rows.length
    while (d.trust.bullets.length < src.trust.bullets.length) {
      d.trust.bullets.push('')
    }
    d.trust.bullets.length = src.trust.bullets.length
  }
}

/* ── Listing pages (Services, Projects, Gallery, News) ── */

type ListingSlug = 'services-page' | 'projects-page' | 'gallery-page' | 'news-page' | 'vacancies-page'

const LISTING_DEFAULTS: Record<ListingSlug, Record<MarineContentLocale, ListingPageData | ProjectsPageData>> = {
  'services-page': {
    ru: {
      hero: {
        titleFormatted: themeTitleTriple('Полный спектр ', 'морских', ' услуг'),
        lead: 'Мы предоставляем комплексные инженерные и сервисные решения для морского флота любого типа и размера.',
      },
      cta: { title: '', buttonText: 'Запросить консультацию' },
      showInquiryForm: false,
    },
    en: {
      hero: {
        titleFormatted: themeTitleTriple('Full range of ', 'marine', ' services'),
        lead: 'We deliver engineering and marine services for vessels of any type and size.',
      },
      cta: { title: '', buttonText: 'Request a consultation' },
      showInquiryForm: false,
    },
  },
  'projects-page': {
    ru: {
      hero: {
        titleFormatted: themeTitleTriple('Наши ', 'выполненные', ' проекты'),
        lead: 'Портфолио выполненных работ по ремонту и техническому обслуживанию морских судов в портах по всему миру.',
      },
      cta: { title: 'Нужен расчёт по вашему судну?', buttonText: 'Оставить заявку' },
      heroImage: '/images/marin-figma/mission-dock.jpg',
      showInquiryForm: false,
    } as ProjectsPageData,
    en: {
      hero: {
        titleFormatted: themeTitleTriple('Our ', 'completed', ' projects'),
        lead: 'A portfolio of repair and maintenance work for seagoing vessels in ports worldwide.',
      },
      cta: { title: 'Need an estimate for your vessel?', buttonText: 'Send a request' },
      heroImage: '/images/marin-figma/mission-dock.jpg',
      showInquiryForm: false,
    } as ProjectsPageData,
  },
  'gallery-page': {
    ru: {
      hero: {
        titleFormatted: themeTitleTriple('Фото с ', 'объектов', ' и производства'),
        lead: 'Подборка снимков выполненных работ и инфраструктуры Marine Technical Solutions. Нажмите на фото, чтобы открыть крупный план. Навигация стрелками на клавиатуре или кнопками в окне просмотра.',
      },
      showInquiryForm: false,
    },
    en: {
      hero: {
        titleFormatted: themeTitleTriple('Photos from ', 'projects', ' and workshops'),
        lead: 'A selection of completed work and infrastructure at Marine Technical Solutions. Click a photo for a larger view. Use keyboard arrows or the on-screen controls.',
      },
      showInquiryForm: false,
    },
  },
  'news-page': {
    ru: {
      hero: {
        titleFormatted: themeTitleTriple('Последние ', 'новости', ' компании'),
        lead: 'Следите за развитием компании, новыми проектами и новостями отрасли.',
      },
      showInquiryForm: false,
    },
    en: {
      hero: {
        titleFormatted: themeTitleTriple('Latest ', 'news', ' from the company'),
        lead: 'Follow our development, new projects and maritime industry updates.',
      },
      showInquiryForm: false,
    },
  },
  'vacancies-page': {
    ru: {
      hero: {
        titleFormatted: themeTitleTriple('Открытые ', 'вакансии', ''),
        lead:
          'Присоединяйтесь к команде Marine Technical Solutions. Мы предлагаем работу в судоремонте и сервисе морского флота. Среди открытых вакансий нет подходящей — можно просто заполнить анкету: мы свяжемся с вами, когда появится подходящая позиция.',
      },
      cta: { title: 'Вопросы по вакансиям и сотрудничеству?', buttonText: 'Оставить заявку' },
      heroImage: '/images/marin-figma/mission-dock.jpg',
      showInquiryForm: false,
    } as ProjectsPageData,
    en: {
      hero: {
        titleFormatted: themeTitleTriple('Open ', 'positions', ''),
        lead:
          "Join the Marine Technical Solutions team. We offer roles in ship repair and maritime services. Don't see a role that fits? You can simply fill in our application form — we'll get in touch when something relevant opens up.",
      },
      cta: { title: 'Questions about careers or cooperation?', buttonText: 'Request a quote' },
      heroImage: '/images/marin-figma/mission-dock.jpg',
      showInquiryForm: false,
    } as ProjectsPageData,
  },
}

export function defaultListingData(slug: string, locale: MarineContentLocale): ListingPageData {
  const key = slug as ListingSlug
  if (LISTING_DEFAULTS[key]) {
    return JSON.parse(JSON.stringify(LISTING_DEFAULTS[key][locale]))
  }
  return { hero: { titleFormatted: themeTitleTriple('', '', ''), lead: '' } }
}

export function mergeListingPageData(slug: string, locale: MarineContentLocale, raw: unknown): ListingPageData {
  const base = defaultListingData(slug, locale)
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const p = raw as Partial<ListingPageData>
  return {
    ...base,
    ...p,
    hero: mergeListingHero(p.hero, base.hero),
    cta: p.cta ? { ...base.cta!, ...p.cta } : base.cta,
    showInquiryForm: p.showInquiryForm ?? base.showInquiryForm,
    heroImage: p.heroImage !== undefined ? p.heroImage : base.heroImage,
    customSections: normalizeCustomPageSections(p.customSections),
  }
}

/* ── Contacts page ── */

const CONTACTS_DEFAULTS: Record<MarineContentLocale, ContactsPageData> = {
  ru: {
    hero: {
      titleFormatted: themeTitlePair('Свяжитесь ', 'с нами'),
      lead: 'Свяжитесь с нашим техническим отделом. Мы ответим в течение 2 часов и подготовим коммерческое предложение под ваши задачи.',
    },
    infoTitle: 'Контактная информация',
    formTitle: 'Обратная связь',
    formLead: 'Заполните форму — мы ответим на email в течение рабочего дня. Для срочных вопросов звоните по телефону.',
    officesTitle: 'Офисы',
    showInquiryForm: false,
  },
  en: {
    hero: {
      titleFormatted: themeTitlePair('Get in ', 'touch'),
      lead: 'Contact our technical department. We respond within two hours and prepare a commercial proposal for your needs.',
    },
    infoTitle: 'Contact details',
    formTitle: 'Feedback',
    formLead: 'Fill in the form — we reply by email within a business day. For urgent matters, call us.',
    officesTitle: 'Offices',
    showInquiryForm: false,
  },
}

export function defaultContactsData(locale: MarineContentLocale): ContactsPageData {
  return JSON.parse(JSON.stringify(CONTACTS_DEFAULTS[locale]))
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
    heroImage: p.heroImage !== undefined ? p.heroImage : base.heroImage,
    customSections: normalizeCustomPageSections(p.customSections),
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

const BUILTIN_SECTION_ORDER_KEYS = new Set<string>(['directions', 'checklist', 'principles', 'audience'])

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
  return {
    id: typeof r.id === 'string' && r.id.trim() ? r.id.trim() : fallback.id,
    type: 'cards',
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
  return mergeCardsBlock(raw, fb.type === 'cards' ? fb : { id: newLineMarketingBlockId(), type: 'cards', items: [{ icon: 'UserCheck', hideIcon: false, title: '', text: '', detailSlug: '' }] })
}

function mergeOneCustomSection(raw: unknown, fallback?: LineMarketingCustomSection): LineMarketingCustomSection {
  const fb =
    fallback ??
    ({
      id: newLineMarketingBlockId(),
      title: '',
      showTitle: true,
      blocks: [],
    } as LineMarketingCustomSection)
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(fb)) as LineMarketingCustomSection
  }
  const p = raw as Partial<LineMarketingCustomSection>
  const id = typeof p.id === 'string' && p.id.trim() ? p.id.trim() : fb.id
  const blocksRaw = Array.isArray(p.blocks) ? p.blocks : []
  const blocks = blocksRaw.map((b, i) => mergeContentBlock(b, fb.blocks[i]))
  return {
    id,
    title: typeof p.title === 'string' ? p.title : fb.title,
    showTitle: typeof p.showTitle === 'boolean' ? p.showTitle : fb.showTitle,
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

function mergeSectionOrder(raw: unknown, customIds: string[]): string[] {
  const defaultOrder = [...LINE_MARKETING_SECTION_DEFAULT_ORDER]
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
    if (BUILTIN_SECTION_ORDER_KEYS.has(x) && !seen.has(x)) {
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

function mergeSectionVisibility(raw: unknown, allKeys: string[]): Record<string, boolean> {
  const base: Record<string, boolean> = {
    directions: true,
    checklist: true,
    principles: true,
    audience: true,
  }
  for (const k of allKeys) {
    if (!(k in base)) {
      base[k] = true
    }
  }
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const p = raw as Record<string, boolean>
  for (const k of Object.keys(base)) {
    if (typeof p[k] === 'boolean') {
      base[k] = p[k]
    }
  }
  for (const k of allKeys) {
    if (typeof p[k] === 'boolean') {
      base[k] = p[k]
    }
  }
  return base
}

function mergeLineMarketingHeroButtons(
  locale: MarineContentLocale,
  base: LineMarketingHeroButton[],
  raw: unknown,
  legacyShowInquiry: boolean | undefined,
  hadHeroButtonsKey: boolean,
): LineMarketingHeroButton[] {
  const MAX = 2
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
  const out: LineMarketingHeroButton[] = []
  for (let i = 0; i < MAX; i++) {
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

const CREWING_DEFAULTS: Record<MarineContentLocale, CrewingPageData> = {
  ru: {
    hero: {
      label: 'Судовой и крюинг менеджмент',
      titleFormatted: themeTitleTriple('Подбор ', 'экипажей и обслуживание', ' судов'),
      lead: 'Комплексный крюинг-менеджмент для судовладельцев: от подбора моряков до документооборота и логистики смены экипажа. Мы помогаем снизить риски и административную нагрузку, сохраняя фокус на безопасной эксплуатации судна.',
    },
    heroButtons: [{ label: 'К форме заявки', href: '#page-inquiry' }],
    sectionOrder: [...LINE_MARKETING_SECTION_DEFAULT_ORDER],
    sectionVisibility: {
      directions: true,
      checklist: true,
      principles: true,
      audience: true,
    },
    customSections: [],
    directionsSection: {
      title: 'Направления работы',
      lead: 'Единый подход к кадрам на море: от стратегии комплектования до операционного сопровождения в портах и офисе.',
    },
    directions: [
      {
        icon: 'UserCheck',
        title: 'Подбор и смена экипажа',
        text: 'Поиск квалифицированных специалистов под требования судна и флага, планирование ротации и смены экипажа в согласованные сроки.',
      },
      {
        icon: 'FileCheck',
        title: 'Документооборот и соответствие',
        text: 'Оформление контрактов, сертификатов и записей в соответствии с требованиями STCW, кодексами MLC и регистрами судовладельца.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Контроль квалификации',
        text: 'Проверка дипломов, допусков и медицинских заключений, напоминания о продлении документов и обучении.',
      },
      {
        icon: 'Globe2',
        title: 'Визы и логистика',
        text: 'Сопровождение при посадке и высадке экипажа: визовая поддержка, билеты, трансферы и взаимодействие с агентами в портах.',
      },
      {
        icon: 'Ship',
        title: 'Работа с судовладельцем',
        text: 'Единая точка контакта по кадровым вопросам: отчётность, согласование замен, взаимодействие с капитаном и береговым офисом.',
      },
      {
        icon: 'ClipboardList',
        title: 'Учёт и прозрачность',
        text: 'Структурированные данные по составу экипажа, срокам контрактов и затратам — для прогнозирования и аудита.',
      },
    ],
    principles: {
      title: 'Принципы',
      items: [
        'Соблюдение международных и национальных норм в области труда на море',
        'Конфиденциальность персональных данных моряков и судовладельца',
        'Оперативная коммуникация в нештатных ситуациях и при срочной смене экипажа',
      ],
    },
    audience: {
      title: 'Кому подходит сервис',
      paragraph1:
        'Судовладельцам и операторам, которым нужен предсказуемый состав экипажа и прозрачные процессы без перегрузки внутренних HR- и флотских служб. Формат сотрудничества и перечень услуг согласуем под ваш флот и регион плавания.',
      paragraph2:
        'Для уточнения задач и коммерческого предложения оставьте заявку — мы свяжемся и предложим оптимальную модель крюинг-менеджмента.',
      ctaLabel: 'Связаться с нами',
      ctaHref: '/contacts',
    },
    checklist: {
      sectionTitle: 'Полный чек-лист',
      intro:
        'Мы не просто проверяем наличие «корок», мы гарантируем профпригодность каждого члена экипажа по следующим критериям:',
      sections: JSON.parse(JSON.stringify(DEFAULT_CREWING_CHECKLIST_SECTIONS_RU)),
    },
    showInquiryForm: true,
  },
  en: {
    hero: {
      label: 'Ship & crew management',
      titleFormatted: themeTitleTriple('Crew ', 'recruitment & ship', ' services'),
      lead: 'End-to-end crew management for shipowners: from seafarer selection to paperwork and crew-change logistics. We help reduce risk and admin load while you keep focus on safe vessel operations.',
    },
    heroButtons: [{ label: 'To the inquiry form', href: '#page-inquiry' }],
    sectionOrder: [...LINE_MARKETING_SECTION_DEFAULT_ORDER],
    sectionVisibility: {
      directions: true,
      checklist: true,
      principles: true,
      audience: true,
    },
    customSections: [],
    directionsSection: {
      title: 'What we cover',
      lead: 'One approach to people at sea: from manning strategy to day-to-day support in ports and ashore.',
    },
    directions: [
      {
        icon: 'UserCheck',
        title: 'Recruitment & crew change',
        text: 'Qualified seafarers matched to vessel and flag requirements, rotation planning and timely crew changes.',
      },
      {
        icon: 'FileCheck',
        title: 'Compliance & documentation',
        text: 'Contracts, certificates and records aligned with STCW, MLC codes and owner policies.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Competence control',
        text: 'Verification of licences, endorsements and medicals, with reminders for renewals and training.',
      },
      {
        icon: 'Globe2',
        title: 'Visas & logistics',
        text: 'Support for sign-on/off: visas, tickets, transfers and coordination with port agents.',
      },
      {
        icon: 'Ship',
        title: 'Shipowner interface',
        text: 'A single point of contact for crew matters: reporting, replacements, captain and shore-office liaison.',
      },
      {
        icon: 'ClipboardList',
        title: 'Records & transparency',
        text: 'Structured data on crew composition, contract timelines and costs — for forecasting and audit.',
      },
    ],
    principles: {
      title: 'Principles',
      items: [
        'Compliance with international and national maritime labour standards',
        'Confidentiality of seafarer and owner data',
        'Responsive communication in emergencies and urgent crew changes',
      ],
    },
    audience: {
      title: 'Who it is for',
      paragraph1:
        'Owners and operators who need predictable crewing and clear processes without overloading in-house HR and marine teams. We tailor scope and commercial terms to your fleet and trading area.',
      paragraph2:
        'Leave a request to discuss tasks and pricing — we will respond with a suitable crew-management model.',
      ctaLabel: 'Contact us',
      ctaHref: '/contacts',
    },
    checklist: {
      sectionTitle: 'Full checklist',
      intro:
        'We do not only verify certificates — we ensure professional suitability of every crew member against the following criteria:',
      sections: JSON.parse(JSON.stringify(DEFAULT_CREWING_CHECKLIST_SECTIONS_EN)),
    },
    showInquiryForm: true,
  },
}

const LINE_PAGE_DATA: Record<LineMarketingPageSlug, Record<MarineContentLocale, CrewingPageData>> = {
  'crewing-management': CREWING_DEFAULTS,
  'ship-management': SHIP_MANAGEMENT_DEFAULTS,
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
  const dirs = mergeCrewingDirections(base.directions, p.directions)
  const checklist = mergeCrewingChecklistBlock(base.checklist, p.checklist)
  const hadHeroButtonsKey = typeof raw === 'object' && raw !== null && 'heroButtons' in raw
  // Используем общий normalizer — он понимает все типы блоков
  // (cards/text/split + heroImage/gallery/accordion/htmlMarkdown).
  // Старая локальная функция `mergeCustomSections` сохранена ниже для
  // обратной совместимости с возможными внешними импортами, но в новом
  // пайплайне не используется (поглощала бы новые типы блоков под cards).
  const customSections =
    Array.isArray(p.customSections)
      ? normalizeCustomPageSections(p.customSections)
      : base.customSections.map((s) => normalizeCustomPageSections([s])[0]!)
  const customIds = customSections.map((s) => s.id)
  const sectionOrder = mergeSectionOrder(p.sectionOrder, customIds)
  const sectionVisibility = mergeSectionVisibility(p.sectionVisibility, sectionOrder)

  return {
    hero: mergeCrewingHero(p.hero, base.hero),
    heroButtons: mergeLineMarketingHeroButtons(
      locale,
      base.heroButtons,
      p.heroButtons,
      p.showInquiryForm,
      hadHeroButtonsKey,
    ),
    sectionOrder,
    sectionVisibility,
    customSections,
    directionsSection: { ...base.directionsSection, ...p.directionsSection },
    directions: dirs,
    principles: {
      title: p.principles?.title ?? base.principles.title,
      items:
        Array.isArray(p.principles?.items) && p.principles.items.length > 0
          ? p.principles.items
          : base.principles.items,
    },
    audience: { ...base.audience, ...p.audience },
    checklist,
    showInquiryForm: p.showInquiryForm ?? base.showInquiryForm,
    heroBackgroundImage:
      p.heroBackgroundImage !== undefined && p.heroBackgroundImage !== null
        ? p.heroBackgroundImage
        : base.heroBackgroundImage,
  }
}

export function mergeCrewingPageData(locale: MarineContentLocale, raw: unknown): CrewingPageData {
  return mergeLinePageData(locale, raw, 'crewing-management')
}
