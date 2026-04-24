import type { AboutPageData, MarineContentLocale } from '~/types'
import { normalizeCustomPageSections } from '~/utils/customPageSections'
import { mergeAboutHero, themeFormattedTitleToHtml, themeTitleTriple } from '~/utils/themeFormattedTitle'

const DEFAULTS: Record<MarineContentLocale, AboutPageData> = {
  ru: {
    hero: {
      title: themeFormattedTitleToHtml(themeTitleTriple('Marine Technical Solutions ', '(MTS)', '')),
      subtitle: 'Интегрированный подход. Глобальный охват. Технологическое лидерство.',
      lead: 'Основанная в 2010 году, компания Marine Technical Solutions (MTS) прошла путь от амбициозного инженерного стартапа до международного EPC-контрактора и частной судоходной компании с головным офисом в Калининграде и стратегическим представительством в ОАЭ.',
      lead2: 'Мы не просто управляем судами — мы создаем условия для их безопасной, экологичной и прибыльной эксплуатации в любой точке мирового океана.',
    },
    ecosystem: {
      title: 'Наша экосистема сервисов',
      lead: 'MTS — это уникальная структура, объединяющая все аспекты жизнеобеспечения флота:',
      services: [
        { icon: 'Wrench', title: 'Технический менеджмент (Technical Management)', text: 'Мы берем на себя полную ответственность за техническое состояние вашего актива, внедряя современные стандарты обслуживания и контроля затрат.' },
        { icon: 'Ship', title: 'Мобильный судоремонт 24/7 (Voyage Repairs)', text: 'Наша гордость — мобильные бригады, выполняющие ремонт и обслуживание непосредственно в ходе рейса. Мы исключаем простои (off-hire), обеспечивая работоспособность систем без захода в док.' },
        { icon: 'Users', title: 'Собственный крюинг (In-house Crewing)', text: 'Мы предоставляем высококвалифицированные российские экипажи. Наши моряки — это профессионалы, обученные работе со сложным оборудованием и современными материалами.' },
        { icon: 'Layers', title: 'Инновации в материалах (EPC & Composites)', text: 'Как эксперты в EPC, мы активно внедряем композитные решения GRE/GRV. Замена коррозийной стали на долговечный стеклопластик — наш вклад в снижение ваших операционных расходов (OPEX).' },
      ],
    },
    mission: {
      title: 'Миссия и Цели: Стратегия «Трех Нулей»',
      lead: 'Наша главная цель — стать эталоном в управлении судами через постоянное обучение и инвестиции в людей. Мы строим работу на принципах:',
      principles: [
        { icon: 'ShieldCheck', text: 'Zero Incidents (Ноль инцидентов) — абсолютная безопасность экипажа и судна.' },
        { icon: 'Leaf', text: 'Zero Pollution (Ноль загрязнений) — использование технологий, исключающих вред экологии.' },
        { icon: 'Target', text: 'Sustainable Management — переход к «зелёным» технологиям на борту и на берегу.' },
      ],
    },
    why: {
      title: 'Почему выбирают MTS?',
      text: 'Мы говорим на языке судовладельцев, нацеленных на результат. Наш опыт позволяет превращать сложные технические задачи в прозрачные и прибыльные бизнес-процессы. Если вы ищете надёжную управляющую компанию, способную защитить ваш флот и повысить его капитализацию — добро пожаловать на борт MTS.',
      ctaText: 'Связаться с нами',
    },
    geography: {
      label: 'География',
      title: 'География технического обслуживания судов',
      lead: 'База в Калининграде, мобильные бригады и партнёрская сеть — работаем в ключевых портах по всему миру.',
      /**
       * Координаты — точное местоположение порта/терминала, а не центр
       * города. Это критично при глобальном zoom 1–3 в Mapbox: маркер
       * должен лежать на акватории, а не на «суше за портом». Те же
       * значения зашиты в `AboutPageLocationsSeeder` (Laravel) — менять
       * нужно в обоих местах.
       */
      locations: [
        { lng: 20.4945, lat: 54.7066, labelOnRight: false, name: 'Калининград' },
        { lng: 21.1192, lat: 55.7007, labelOnRight: true, name: 'Клайпеда' },
        { lng: -0.2589, lat: 53.7290, labelOnRight: true, name: 'Халл' },
        { lng: 18.1117, lat: 59.3496, labelOnRight: false, name: 'Стокгольм' },
        { lng: 6.1496, lat: 62.4724, labelOnRight: false, name: 'Олесунн' },
        { lng: -15.4148, lat: 28.1410, labelOnRight: true, name: 'Лас-Пальмас' },
        { lng: 29.8669, lat: 31.1925, labelOnRight: false, name: 'Александрия' },
        { lng: 55.1107, lat: 25.0213, labelOnRight: false, name: 'Дубай (Джебель-Али)' },
        { lng: -79.5630, lat: 8.9528, labelOnRight: true, name: 'Панама (Бальбоа)' },
        { lng: -68.9333, lat: 12.1138, labelOnRight: true, name: 'Кюрасао (Виллемстад)' },
      ],
    },
    certificates: {
      title: 'Сертификаты',
      items: [
        { name: 'ISO 9001:2015', desc: 'Система менеджмента качества', fileUrl: '' },
        { name: 'ISO 14001:2015', desc: 'Система экологического менеджмента', fileUrl: '' },
        { name: 'ISO 45001:2018', desc: 'Система менеджмента безопасности', fileUrl: '' },
      ],
    },
    showInquiryForm: false,
  },
  en: {
    hero: {
      title: themeFormattedTitleToHtml(themeTitleTriple('Marine Technical Solutions ', '(MTS)', '')),
      subtitle: 'Integrated Approach. Global Reach. Technological Leadership.',
      lead: 'Founded in 2010, Marine Technical Solutions (MTS) has evolved from an ambitious engineering start-up into an international EPC contractor and private shipping company, headquartered in Kaliningrad with a strategic office in the UAE.',
      lead2: 'We do not simply manage vessels — we create the conditions for their safe, eco-friendly and profitable operation anywhere in the world\'s oceans.',
    },
    ecosystem: {
      title: 'Our Service Ecosystem',
      lead: 'MTS is a unique structure uniting every aspect of fleet life-support:',
      services: [
        { icon: 'Wrench', title: 'Technical Management', text: 'We assume full responsibility for the technical condition of your asset, implementing modern maintenance standards and cost control.' },
        { icon: 'Ship', title: 'Mobile Ship Repair 24/7 (Voyage Repairs)', text: 'Our pride — mobile teams carrying out repairs and maintenance during the voyage itself. We eliminate off-hire downtime, keeping systems operational without dry-docking.' },
        { icon: 'Users', title: 'In-house Crewing', text: 'We supply highly qualified Russian crews. Our seafarers are professionals trained to work with complex equipment and modern materials.' },
        { icon: 'Layers', title: 'Material Innovation (EPC & Composites)', text: 'As EPC experts we actively deploy GRE/GRV composite solutions. Replacing corrosive steel with durable fibreglass is our contribution to reducing your OPEX.' },
      ],
    },
    mission: {
      title: 'Mission & Goals: The Three-Zero Strategy',
      lead: 'Our ultimate goal is to become the benchmark in vessel management through continuous learning and investment in people. We operate on the principles of:',
      principles: [
        { icon: 'ShieldCheck', text: 'Zero Incidents — absolute safety for crew and vessel.' },
        { icon: 'Leaf', text: 'Zero Pollution — technologies that eliminate environmental harm.' },
        { icon: 'Target', text: 'Sustainable Management — a transition to green technologies on board and ashore.' },
      ],
    },
    why: {
      title: 'Why Choose MTS?',
      text: 'We speak the language of results-driven shipowners. Our experience allows us to turn complex technical challenges into transparent and profitable business processes. If you are looking for a reliable management company capable of protecting your fleet and increasing its capitalisation — welcome aboard MTS.',
      ctaText: 'Contact us',
    },
    geography: {
      label: 'Coverage',
      title: 'Where we support vessels',
      lead: 'Kaliningrad headquarters, mobile teams and partner network — key ports worldwide.',
      /** См. комментарий в `ru.geography.locations`. */
      locations: [
        { lng: 20.4945, lat: 54.7066, labelOnRight: false, name: 'Kaliningrad' },
        { lng: 21.1192, lat: 55.7007, labelOnRight: true, name: 'Klaipėda' },
        { lng: -0.2589, lat: 53.7290, labelOnRight: true, name: 'Hull' },
        { lng: 18.1117, lat: 59.3496, labelOnRight: false, name: 'Stockholm' },
        { lng: 6.1496, lat: 62.4724, labelOnRight: false, name: 'Ålesund' },
        { lng: -15.4148, lat: 28.1410, labelOnRight: true, name: 'Las Palmas' },
        { lng: 29.8669, lat: 31.1925, labelOnRight: false, name: 'Alexandria' },
        { lng: 55.1107, lat: 25.0213, labelOnRight: false, name: 'Dubai (Jebel Ali)' },
        { lng: -79.5630, lat: 8.9528, labelOnRight: true, name: 'Panama (Balboa)' },
        { lng: -68.9333, lat: 12.1138, labelOnRight: true, name: 'Curaçao (Willemstad)' },
      ],
    },
    certificates: {
      title: 'Certificates',
      items: [
        { name: 'ISO 9001:2015', desc: 'Quality management system', fileUrl: '' },
        { name: 'ISO 14001:2015', desc: 'Environmental management system', fileUrl: '' },
        { name: 'ISO 45001:2018', desc: 'Occupational health and safety management system', fileUrl: '' },
      ],
    },
    showInquiryForm: false,
  },
}

/**
 * Дефолтный порядок секций раздела «О компании», применяемый, когда в данных
 * нет сохранённого `sectionOrder`. Hero фиксирован первым и не входит сюда.
 */
export const ABOUT_SECTION_DEFAULT_ORDER = [
  'ecosystem',
  'mission',
  'why',
  'stats',
  'geography',
  'certificates',
] as const

export type AboutSectionId = (typeof ABOUT_SECTION_DEFAULT_ORDER)[number]

/** Подписи разделов в админке для inline-контролов. */
export const ABOUT_SECTION_ADMIN_LABELS: Record<AboutSectionId, string> = {
  ecosystem: 'Экосистема сервисов',
  mission: 'Миссия и Цели',
  why: 'Почему выбирают MTS?',
  stats: 'Компания в цифрах',
  geography: 'География обслуживания',
  certificates: 'Сертификаты',
}

export function defaultAboutData(locale: MarineContentLocale): AboutPageData {
  const base = JSON.parse(JSON.stringify(DEFAULTS[locale])) as AboutPageData
  base.sectionOrder = [...ABOUT_SECTION_DEFAULT_ORDER]
  base.sectionVisibility = {}
  return base
}

export function mergeAboutPageData(locale: MarineContentLocale, raw: unknown): AboutPageData {
  const base = defaultAboutData(locale)
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const p = raw as Partial<AboutPageData>
  return {
    ...base,
    ...p,
    hero: mergeAboutHero(p.hero, base.hero),
    customSections: normalizeCustomPageSections(p.customSections),
    sectionOrder: p.sectionOrder ?? base.sectionOrder,
    sectionVisibility: p.sectionVisibility ?? base.sectionVisibility,
  }
}

/**
 * Sync non-locale fields (icon, lng/lat, labelOnRight, fileUrl, фоновые изображения)
 * from source locale to all others.
 * Text fields (title, text, name, desc, lead, etc.) stay locale-specific.
 */
export function syncStructuralFields(
  data: Record<MarineContentLocale, AboutPageData>,
  sourceLocale: MarineContentLocale,
): void {
  const src = data[sourceLocale]
  for (const loc of Object.keys(data) as MarineContentLocale[]) {
    if (loc === sourceLocale) continue
    const dst = data[loc]

    // Ecosystem: sync icons, keep text fields
    src.ecosystem.services.forEach((s, i) => {
      if (!dst.ecosystem.services[i]) {
        dst.ecosystem.services[i] = { ...s }
      } else {
        dst.ecosystem.services[i].icon = s.icon
      }
    })
    // Remove extra items if source has fewer
    dst.ecosystem.services.length = src.ecosystem.services.length

    // Mission: sync icons
    src.mission.principles.forEach((p, i) => {
      if (!dst.mission.principles[i]) {
        dst.mission.principles[i] = { ...p }
      } else {
        dst.mission.principles[i].icon = p.icon
      }
    })
    dst.mission.principles.length = src.mission.principles.length

    // Geography: sync coordinates and labelOnRight
    src.geography.locations.forEach((loc_src, i) => {
      if (!dst.geography.locations[i]) {
        dst.geography.locations[i] = { ...loc_src }
      } else {
        dst.geography.locations[i].lng = loc_src.lng
        dst.geography.locations[i].lat = loc_src.lat
        dst.geography.locations[i].labelOnRight = loc_src.labelOnRight
      }
    })
    dst.geography.locations.length = src.geography.locations.length

    // Certificates: sync fileUrl
    src.certificates.items.forEach((c, i) => {
      if (!dst.certificates.items[i]) {
        dst.certificates.items[i] = { ...c }
      } else {
        dst.certificates.items[i].fileUrl = c.fileUrl
      }
    })
    dst.certificates.items.length = src.certificates.items.length

    dst.showInquiryForm = src.showInquiryForm
    dst.heroImage = src.heroImage
    dst.introImage = src.introImage
    dst.ecosystemImage = src.ecosystemImage
    dst.missionImage = src.missionImage
    dst.statsImage = src.statsImage
  }
}
