import type {
  HomePageData,
  ListingPageData,
  ProjectsPageData,
  ContactsPageData,
  CrewingChecklistBlock,
  CrewingChecklistPoint,
  CrewingChecklistSection,
  CrewingPageData,
  MarineContentLocale,
} from '~/types'
import {
  DEFAULT_CREWING_CHECKLIST_SECTIONS_EN,
  DEFAULT_CREWING_CHECKLIST_SECTIONS_RU,
} from '~/utils/crewingChecklistDefaults'
import { SHIP_MANAGEMENT_DEFAULTS } from '~/utils/extraLinePageDefaults'
import type { LineMarketingPageSlug } from '~/utils/lineMarketingPages'

/* ── Home page ── */

const HOME_DEFAULTS: Record<MarineContentLocale, HomePageData> = {
  ru: {
    hero: {
      label: 'Marine Technical Solutions',
      titleLine1: 'Судовой и крюинг',
      titleAccent: 'менеджмент',
      titleSuffix: '',
      lead: 'Подбор экипажей и обслуживание судов. Работаем с судовладельцами и моряками по всему миру: классификация IACS, прозрачные процессы, понятный следующий шаг.',
      ctaClient: 'Оставить заявку',
      ctaClientHref: '/contacts',
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
      title: 'Операционное и техническое',
      titleAccent: 'сопровождение',
      titleEnd: ' флота',
      text: 'Планирование ремонтов, снабжение, взаимодействие с классом и подрядчиками — одна команда для судовладельца.',
      cta: 'Подробнее',
      href: '/ship-management',
    },
    funnelCrewing: {
      label: 'Крюинг',
      title: 'Работа для',
      titleAccent: 'моряков',
      titleEnd: '',
      text: 'Актуальные вакансии и открытая анкета в базу кандидатов — выберите удобный сценарий.',
      cta: 'Вакансии',
      href: '/vacancies',
    },
    funnelTechnical: {
      label: 'Услуги',
      title: 'Инженерные ',
      titleAccent: 'решения',
      titleEnd: ' для флота',
      text: 'Каталог услуг: техническое сопровождение, проекты и консультации — выберите направление и свяжитесь с нами.',
      cta: 'Каталог услуг',
      href: '/services',
    },
    directions: {
      label: 'Направления',
      heading: 'Чем мы',
      headingAccent: 'занимаемся',
      headingEnd: '',
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
      title: 'Marine Technical Solutions —',
      titleAccent: 'международная',
      titleEnd: ' команда',
      text: 'Инженерный и крюинговый опыт в одном окне: от заявки до сдачи работ и экипажа на борт.',
      more: 'Подробнее о компании',
    },
    trust: {
      label: 'Почему нам доверяют',
      title: 'Опыт, география',
      titleAccent: 'и прозрачность',
      bullets: [
        'Международные проекты и классификационные общества (IACS)',
        'Более 14 лет в судоходстве и сервисе',
        'Портфель завершённых работ и регулярные рейсы клиентов',
      ],
    },
    services: {
      label: 'Услуги',
      heading: 'Полный спектр ',
      headingAccent: 'морских',
      headingEnd: ' услуг',
      all: 'Все услуги',
      more: 'Подробнее →',
      featuredServiceIds: [],
    },
    process: {
      label: 'Процесс',
      heading: 'Три шага к',
      headingAccent: 'результату',
      steps: [
        { title: 'Заявка и консультация', text: 'Принимаем обращение, уточняем задачу и согласуем следующий шаг.' },
        { title: 'Решение и реализация', text: 'Подбираем команду и формат работ в соответствии с требованиями класса и судовладельца.' },
        { title: 'Сдача и сопровождение', text: 'Передаём результат, оформляем документацию и остаёмся на связи по согласованным вопросам.' },
      ],
    },
    cta: {
      label: 'Свяжитесь с нами',
      title: 'Готовы',
      titleAccent: 'обсудить задачу?',
      text: 'Оставьте заявку или напишите на почту — ответим в рабочее время и предложим следующий шаг.',
      button: 'Оставить заявку',
    },
    showProcess: false,
    showInquiryForm: false,
  },
  en: {
    hero: {
      label: 'Marine Technical Solutions',
      titleLine1: 'Ship & crew',
      titleAccent: 'management',
      titleSuffix: '',
      lead: 'Crewing and vessel support worldwide: IACS-aligned processes, one point of contact for owners and seafarers.',
      ctaClient: 'Request a quote',
      ctaClientHref: '/contacts',
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
      title: 'Operational & technical',
      titleAccent: 'support',
      titleEnd: '',
      text: 'Repairs planning, supplies, class and yard coordination — one team for the shipowner.',
      cta: 'Learn more',
      href: '/ship-management',
    },
    funnelCrewing: {
      label: 'Crewing',
      title: 'Careers for',
      titleAccent: 'seafarers',
      titleEnd: '',
      text: 'Open vacancies or submit an open application to our candidate pool.',
      cta: 'Vacancies',
      href: '/vacancies',
    },
    funnelTechnical: {
      label: 'Services',
      title: 'Engineering ',
      titleAccent: 'solutions',
      titleEnd: '',
      text: 'Browse the catalogue — technical support, projects and consulting. Pick a line and get in touch.',
      cta: 'All services',
      href: '/services',
    },
    directions: {
      label: 'Focus areas',
      heading: 'What we',
      headingAccent: 'do',
      headingEnd: '',
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
      title: 'Marine Technical Solutions —',
      titleAccent: 'international',
      titleEnd: ' team',
      text: 'Engineering and crewing in one window: from enquiry to delivery and crew on board.',
      more: 'About the company',
    },
    trust: {
      label: 'Why us',
      title: 'Experience &',
      titleAccent: 'coverage',
      bullets: [
        'International projects and IACS classification societies',
        '14+ years in shipping and marine services',
        'Delivered projects and repeat voyages with clients',
      ],
    },
    services: {
      label: 'Services',
      heading: 'Full range of ',
      headingAccent: 'marine',
      headingEnd: ' services',
      all: 'All services',
      more: 'Learn more →',
      featuredServiceIds: [],
    },
    process: {
      label: 'Process',
      heading: 'Three steps to',
      headingAccent: 'delivery',
      steps: [
        { title: 'Request & consultation', text: 'We take your enquiry, clarify the scope and agree on the next step.' },
        { title: 'Solution & execution', text: 'We align the team and scope with class and owner requirements.' },
        { title: 'Handover & follow-up', text: 'We deliver results, complete documentation and stay available as agreed.' },
      ],
    },
    cta: {
      label: 'Contact us',
      title: 'Ready to',
      titleAccent: 'talk?',
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
  const h = parsed.hero
  const hero: HomePageData['hero'] = {
    ...def.hero,
    ...h,
    ctaClient: h?.ctaClient ?? h?.ctaConsult ?? def.hero.ctaClient,
    ctaClientHref: h?.ctaClientHref ?? '/contacts',
    ctaSeafarer: h?.ctaSeafarer ?? h?.ctaServices ?? def.hero.ctaSeafarer,
    ctaSeafarerHref: h?.ctaSeafarerHref ?? '/application-form',
  }
  return {
    ...def,
    ...parsed,
    hero,
    funnelShip: { ...def.funnelShip, ...parsed.funnelShip },
    funnelCrewing: { ...def.funnelCrewing, ...parsed.funnelCrewing },
    funnelTechnical: { ...def.funnelTechnical, ...parsed.funnelTechnical },
    directions: {
      ...def.directions,
      ...parsed.directions,
      rows:
        parsed.directions?.rows && parsed.directions.rows.length > 0
          ? parsed.directions.rows
          : def.directions.rows,
    },
    trust: { ...def.trust, ...parsed.trust, bullets: parsed.trust?.bullets?.length ? parsed.trust.bullets : def.trust.bullets },
    about: { ...def.about, ...parsed.about },
    services: (() => {
      const ps = parsed.services as Record<string, unknown> | undefined
      const withoutLegacyCards = ps
        ? (Object.fromEntries(Object.entries(ps).filter(([k]) => k !== 'cards')) as Partial<HomePageData['services']>)
        : {}
      return {
        ...def.services,
        ...withoutLegacyCards,
        featuredServiceIds: Array.isArray(parsed.services?.featuredServiceIds)
          ? [...parsed.services.featuredServiceIds]
          : def.services.featuredServiceIds,
      }
    })(),
    process: { ...def.process, ...parsed.process, steps: parsed.process?.steps?.length ? parsed.process.steps : def.process.steps },
    cta: { ...def.cta, ...parsed.cta },
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

type ListingSlug = 'services-page' | 'projects-page' | 'gallery-page' | 'news-page'

const LISTING_DEFAULTS: Record<ListingSlug, Record<MarineContentLocale, ListingPageData | ProjectsPageData>> = {
  'services-page': {
    ru: {
      hero: { title: 'Полный спектр ', titleAccent: 'морских', titleEnd: ' услуг', lead: 'Мы предоставляем комплексные инженерные и сервисные решения для морского флота любого типа и размера.' },
      cta: { title: '', buttonText: 'Запросить консультацию' },
      showInquiryForm: false,
    },
    en: {
      hero: { title: 'Full range of ', titleAccent: 'marine', titleEnd: ' services', lead: 'We deliver engineering and marine services for vessels of any type and size.' },
      cta: { title: '', buttonText: 'Request a consultation' },
      showInquiryForm: false,
    },
  },
  'projects-page': {
    ru: {
      hero: { title: 'Наши ', titleAccent: 'выполненные', titleEnd: ' проекты', lead: 'Портфолио выполненных работ по ремонту и техническому обслуживанию морских судов в портах по всему миру.' },
      cta: { title: 'Нужен расчёт по вашему судну?', buttonText: 'Оставить заявку' },
      heroImage: '/about-workshop.jpg',
      showInquiryForm: false,
    } as ProjectsPageData,
    en: {
      hero: { title: 'Our ', titleAccent: 'completed', titleEnd: ' projects', lead: 'A portfolio of repair and maintenance work for seagoing vessels in ports worldwide.' },
      cta: { title: 'Need an estimate for your vessel?', buttonText: 'Send a request' },
      heroImage: '/about-workshop.jpg',
      showInquiryForm: false,
    } as ProjectsPageData,
  },
  'gallery-page': {
    ru: {
      hero: { title: 'Фото с ', titleAccent: 'объектов', titleEnd: ' и производства', lead: 'Подборка снимков выполненных работ и инфраструктуры Marine Technical Solutions. Нажмите на фото, чтобы открыть крупный план. Навигация стрелками на клавиатуре или кнопками в окне просмотра.' },
      showInquiryForm: false,
    },
    en: {
      hero: { title: 'Photos from ', titleAccent: 'projects', titleEnd: ' and workshops', lead: 'A selection of completed work and infrastructure at Marine Technical Solutions. Click a photo for a larger view. Use keyboard arrows or the on-screen controls.' },
      showInquiryForm: false,
    },
  },
  'news-page': {
    ru: {
      hero: { title: 'Последние ', titleAccent: 'новости', titleEnd: ' компании', lead: 'Следите за развитием компании, новыми проектами и новостями отрасли.' },
      showInquiryForm: false,
    },
    en: {
      hero: { title: 'Latest ', titleAccent: 'news', titleEnd: ' from the company', lead: 'Follow our development, new projects and maritime industry updates.' },
      showInquiryForm: false,
    },
  },
}

export function defaultListingData(slug: string, locale: MarineContentLocale): ListingPageData {
  const key = slug as ListingSlug
  if (LISTING_DEFAULTS[key]) {
    return JSON.parse(JSON.stringify(LISTING_DEFAULTS[key][locale]))
  }
  return { hero: { title: '', titleAccent: '', titleEnd: '', lead: '' } }
}

/* ── Contacts page ── */

const CONTACTS_DEFAULTS: Record<MarineContentLocale, ContactsPageData> = {
  ru: {
    hero: { title: 'Свяжитесь ', titleAccent: 'с нами', lead: 'Свяжитесь с нашим техническим отделом. Мы ответим в течение 2 часов и подготовим коммерческое предложение под ваши задачи.' },
    infoTitle: 'Контактная информация',
    formTitle: 'Обратная связь',
    formLead: 'Заполните форму — мы ответим на email в течение рабочего дня. Для срочных вопросов звоните по телефону.',
    officesTitle: 'Офисы',
    showInquiryForm: false,
  },
  en: {
    hero: { title: 'Get in ', titleAccent: 'touch', lead: 'Contact our technical department. We respond within two hours and prepare a commercial proposal for your needs.' },
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

function mergeCrewingChecklistBlock(
  base: CrewingChecklistBlock,
  p?: Partial<CrewingChecklistBlock> & { bodyMarkdown?: string },
): CrewingChecklistBlock {
  if (!p) {
    return base
  }
  const toggles = {
    toggleShow: p.toggleShow ?? base.toggleShow,
    toggleHide: p.toggleHide ?? base.toggleHide,
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

const CREWING_DEFAULTS: Record<MarineContentLocale, CrewingPageData> = {
  ru: {
    hero: {
      label: 'Судовой и крюинг менеджмент',
      title: 'Подбор ',
      titleAccent: 'экипажей и обслуживание',
      titleEnd: ' судов',
      lead: 'Комплексный крюинг-менеджмент для судовладельцев: от подбора моряков до документооборота и логистики смены экипажа. Мы помогаем снизить риски и административную нагрузку, сохраняя фокус на безопасной эксплуатации судна.',
    },
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
      toggleShow: 'Показать полный чек-лист',
      toggleHide: 'Скрыть чек-лист',
      intro:
        'Мы не просто проверяем наличие «корок», мы гарантируем профпригодность каждого члена экипажа по следующим критериям:',
      sections: JSON.parse(JSON.stringify(DEFAULT_CREWING_CHECKLIST_SECTIONS_RU)),
    },
    showInquiryForm: true,
  },
  en: {
    hero: {
      label: 'Ship & crew management',
      title: 'Crew ',
      titleAccent: 'recruitment & ship',
      titleEnd: ' services',
      lead: 'End-to-end crew management for shipowners: from seafarer selection to paperwork and crew-change logistics. We help reduce risk and admin load while you keep focus on safe vessel operations.',
    },
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
      toggleShow: 'Show full checklist',
      toggleHide: 'Hide checklist',
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
  const dirs = base.directions.map((row, i) => ({
    ...row,
    ...(Array.isArray(p.directions) ? p.directions[i] : {}),
  }))
  const checklist = mergeCrewingChecklistBlock(base.checklist, p.checklist)

  return {
    hero: { ...base.hero, ...p.hero },
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
  }
}

export function mergeCrewingPageData(locale: MarineContentLocale, raw: unknown): CrewingPageData {
  return mergeLinePageData(locale, raw, 'crewing-management')
}
