import type {
  HomePageData,
  ListingPageData,
  ProjectsPageData,
  ContactsPageData,
  MarineContentLocale,
} from '~/types'

/* ── Home page ── */

const HOME_DEFAULTS: Record<MarineContentLocale, HomePageData> = {
  ru: {
    hero: {
      label: 'Судоремонтные услуги',
      titleLine1: 'Техническое обслуживание',
      titleAccent: 'судов',
      titleSuffix: ' по всему миру',
      lead: 'Сертифицированный ремонт корпусов, двигателей и электрооборудования. Работаем в 15+ портах мира. Гарантия качества и соблюдение сроков.',
      ctaConsult: 'Получить консультацию',
      ctaServices: 'Наши услуги',
      badgeIso: '9001:2015',
      badgeIacs: 'Member',
      badgeYears: 'лет опыта',
      scroll: 'Листайте',
    },
    statsCard: {
      label: 'Статистика 2024',
      items: [
        { icon: 'Ship', value: '150+', label: 'Судов отремонтировано' },
        { icon: 'MapPin', value: '15', label: 'Портов присутствия' },
        { icon: 'Users', value: '50+', label: 'Сертифицированных инженеров' },
        { icon: 'Calendar', value: '14', label: 'Лет на рынке' },
      ],
    },
    about: {
      label: 'О компании',
      title: 'Marine Technical Solutions —',
      titleAccent: 'интегрированный подход',
      titleEnd: ' к управлению флотом',
      text: 'Основанная в 2010 году, MTS прошла путь от инженерного стартапа до международного EPC-контрактора и частной судоходной компании. Мы создаём условия для безопасной, экологичной и прибыльной эксплуатации судов в любой точке мирового океана.',
      more: 'Подробнее о компании',
    },
    services: {
      label: 'Услуги',
      heading: 'Полный спектр ',
      headingAccent: 'судоремонтных',
      headingEnd: ' услуг',
      all: 'Все услуги',
      more: 'Подробнее →',
      cards: [
        { image: '/images/services/hull.jpg', title: 'Ремонт корпусов', description: 'Ультразвуковая дефектоскопия, сварка корпусных конструкций' },
        { image: '/images/services/general.jpg', title: 'Ремонт двигателей', description: 'Капитальный ремонт главных и вспомогательных двигателей' },
        { image: '/images/services/electro.jpg', title: 'Электротехнические работы', description: 'Ремонт генераторов, электродвигателей, трансформаторов' },
      ],
    },
    process: {
      label: 'Процесс',
      heading: 'Три шага к ',
      headingAccent: 'надёжному ремонту',
      steps: [
        { title: 'Заявка и оценка', text: 'Принимаем обращение, согласуем объём работ и сроки выезда специалистов.' },
        { title: 'Диагностика и ремонт', text: 'Проводим обследование, выполняем ремонт по классу и стандартам IACS.' },
        { title: 'Сдача и гарантия', text: 'Оформляем документацию, передаём объект и сопровождаем по гарантии.' },
      ],
    },
    cta: {
      label: 'Свяжитесь с нами',
      title: 'Нужен',
      titleAccent: 'срочный ремонт?',
      text: 'Свяжитесь с нашим техническим отделом. Мы ответим в течение 2 часов и подготовим коммерческое предложение.',
      button: 'Получить консультацию',
    },
    showInquiryForm: false,
  },
  en: {
    hero: {
      label: 'Ship repair services',
      titleLine1: 'Technical maintenance for',
      titleAccent: 'vessels',
      titleSuffix: ' worldwide',
      lead: 'Certified hull, engine and electrical repairs. We operate in 15+ ports worldwide. Quality assurance and on-time delivery.',
      ctaConsult: 'Request a consultation',
      ctaServices: 'Our services',
      badgeIso: '9001:2015',
      badgeIacs: 'Member',
      badgeYears: 'Years exp.',
      scroll: 'Scroll',
    },
    statsCard: {
      label: '2024 figures',
      items: [
        { icon: 'Ship', value: '150+', label: 'Vessels repaired' },
        { icon: 'MapPin', value: '15', label: 'Ports covered' },
        { icon: 'Users', value: '50+', label: 'Certified engineers' },
        { icon: 'Calendar', value: '14', label: 'Years in the market' },
      ],
    },
    about: {
      label: 'About us',
      title: 'Marine Technical Solutions —',
      titleAccent: 'an integrated approach',
      titleEnd: ' to fleet management',
      text: 'Founded in 2010, MTS has grown from an engineering start-up into an international EPC contractor and private shipping company. We create the conditions for safe, eco-friendly and profitable vessel operation anywhere in the world.',
      more: 'Learn more about the company',
    },
    services: {
      label: 'Services',
      heading: 'Full range of ',
      headingAccent: 'ship repair',
      headingEnd: ' services',
      all: 'All services',
      more: 'Learn more →',
      cards: [
        { image: '/images/services/hull.jpg', title: 'Hull repair', description: 'Ultrasonic testing, welding of hull structures' },
        { image: '/images/services/general.jpg', title: 'Engine repair', description: 'Overhaul of main and auxiliary engines' },
        { image: '/images/services/electro.jpg', title: 'Electrical works', description: 'Generators, motors, transformers' },
      ],
    },
    process: {
      label: 'Process',
      heading: 'Three steps to ',
      headingAccent: 'reliable repair',
      steps: [
        { title: 'Request & estimate', text: 'We take your request, agree on scope and mobilisation timeline.' },
        { title: 'Diagnosis & repair', text: 'We survey the vessel and perform class-compliant work to IACS standards.' },
        { title: 'Handover & warranty', text: 'We complete documentation, hand over the job and support under warranty.' },
      ],
    },
    cta: {
      label: 'Contact us',
      title: 'Need',
      titleAccent: 'urgent repairs?',
      text: 'Contact our technical team. We respond within two hours and prepare a commercial proposal.',
      button: 'Request a consultation',
    },
    showInquiryForm: false,
  },
}

export function defaultHomeData(locale: MarineContentLocale): HomePageData {
  return JSON.parse(JSON.stringify(HOME_DEFAULTS[locale]))
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
    while (d.services.cards.length < src.services.cards.length) {
      d.services.cards.push({ image: '', title: '', description: '' })
    }
    d.services.cards.length = src.services.cards.length
    for (let i = 0; i < src.services.cards.length; i++) {
      d.services.cards[i].image = src.services.cards[i].image
    }
    while (d.process.steps.length < src.process.steps.length) {
      d.process.steps.push({ title: '', text: '' })
    }
    d.process.steps.length = src.process.steps.length
    d.showInquiryForm = src.showInquiryForm
  }
}

/* ── Listing pages (Services, Projects, Gallery, News) ── */

type ListingSlug = 'services-page' | 'projects-page' | 'gallery-page' | 'news-page'

const LISTING_DEFAULTS: Record<ListingSlug, Record<MarineContentLocale, ListingPageData | ProjectsPageData>> = {
  'services-page': {
    ru: {
      hero: { title: 'Полный спектр ', titleAccent: 'судоремонтных', titleEnd: ' услуг', lead: 'Мы предоставляем комплексные решения для технического обслуживания и ремонта морских судов любого типа и размера.' },
      cta: { title: '', buttonText: 'Запросить консультацию' },
      showInquiryForm: false,
    },
    en: {
      hero: { title: 'Full range of ', titleAccent: 'ship repair', titleEnd: ' services', lead: 'We deliver end-to-end maintenance and repair solutions for vessels of any type and size.' },
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
      hero: { title: 'Последние ', titleAccent: 'новости', titleEnd: ' компании', lead: 'Следите за развитием компании, новыми проектами и достижениями в сфере судоремонта.' },
      showInquiryForm: false,
    },
    en: {
      hero: { title: 'Latest ', titleAccent: 'news', titleEnd: ' from the company', lead: 'Follow our development, new projects and achievements in ship repair.' },
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
