import type { CrewingPageData, MarineContentLocale } from '~/types'
import { LINE_MARKETING_SECTION_DEFAULT_ORDER } from '~/utils/lineMarketingPages'
import { themeTitleTriple } from '~/utils/themeFormattedTitle'

const emptyChecklist = {
  sectionTitle: '',
  intro: '',
  sections: [] as CrewingPageData['checklist']['sections'],
}

export const SHIP_MANAGEMENT_DEFAULTS: Record<MarineContentLocale, CrewingPageData> = {
  ru: {
    hero: {
      label: 'Судовой менеджмент',
      titleFormatted: themeTitleTriple('Операционное и техническое ', 'сопровождение', ' флота'),
      lead: 'Единая точка ответственности за эксплуатацию судна: планирование ТОиР, контроль подрядчиков, взаимодействие с классом и береговым офисом судовладельца.',
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
      lead: 'Комплексное управление жизненным циклом судна в эксплуатации: от стратегии до отчётности по флоту.',
    },
    directions: [
      {
        icon: 'Anchor',
        title: 'Операционное управление',
        text: 'Координация рейсов, смена экипажа с точки зрения судовладельца, контроль ключевых показателей.',
      },
      {
        icon: 'Calendar',
        title: 'Планирование ТОиР',
        text: 'Графики обслуживания, докование, согласование окон с классом и портами.',
      },
      {
        icon: 'Wrench',
        title: 'Технический надзор',
        text: 'Контроль исполнения ремонтов, качества работ и соответствия процедурам компании.',
      },
      {
        icon: 'FileCheck',
        title: 'Документация и класс',
        text: 'Ведение записей, взаимодействие с классификационным обществом и флагом.',
      },
      {
        icon: 'Package',
        title: 'Снабжение и логистика',
        text: 'Согласование поставок, критичных запасов и сроков под рейс.',
      },
      {
        icon: 'Ship',
        title: 'Отчётность судовладельцу',
        text: 'Регулярные сводки по состоянию судна, затратам и рискам.',
      },
    ],
    principles: {
      title: 'Принципы',
      items: [
        'Прозрачность процессов и договорных рамок с судовладельцем',
        'Соблюдение требований класса, флага и внутренних стандартов компании',
        'Оперативная эскалация при отклонениях от плана или выявленных дефектах',
      ],
    },
    audience: {
      title: 'Кому подходит',
      paragraph1:
        'Судовладельцам и техническим менеджерам, которым нужна предсказуемая эксплуатация без раздувания берегового штата.',
      paragraph2: 'Оставьте заявку — предложим модель сопровождения под ваш флот и регион плавания.',
      ctaLabel: 'Связаться с нами',
      ctaHref: '/contacts',
    },
    checklist: {
      ...emptyChecklist,
      sectionTitle: 'Детали компетенций',
    },
    showInquiryForm: true,
  },
  en: {
    hero: {
      label: 'Ship management',
      titleFormatted: themeTitleTriple('Operational & technical ', 'fleet support', ''),
      lead: 'A single point of accountability for safe operations: maintenance planning, contractor control, class liaison and owner reporting.',
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
      lead: 'End-to-end oversight of the vessel in service — from planning to fleet-level reporting.',
    },
    directions: [
      {
        icon: 'Anchor',
        title: 'Operations oversight',
        text: 'Voyage coordination, owner-side crew-change alignment, KPI monitoring.',
      },
      {
        icon: 'Calendar',
        title: 'Maintenance planning',
        text: 'Docking windows, class cycles, port coordination.',
      },
      {
        icon: 'Wrench',
        title: 'Technical supervision',
        text: 'Quality and compliance monitoring for yard and on-board work.',
      },
      {
        icon: 'FileCheck',
        title: 'Documentation & class',
        text: 'Records, surveys and flag administration interface.',
      },
      {
        icon: 'Package',
        title: 'Supply & logistics',
        text: 'Critical spares and timing aligned with trading pattern.',
      },
      {
        icon: 'Ship',
        title: 'Owner reporting',
        text: 'Structured updates on vessel condition, cost and risk.',
      },
    ],
    principles: {
      title: 'Principles',
      items: [
        'Transparent processes and contractual clarity with the owner',
        'Compliance with class, flag and company procedures',
        'Fast escalation when plans or condition deviate',
      ],
    },
    audience: {
      title: 'Who it is for',
      paragraph1: 'Owners and technical managers who need predictable operations without expanding the shore team.',
      paragraph2: 'Send a request — we will propose a management model for your fleet.',
      ctaLabel: 'Contact us',
      ctaHref: '/contacts',
    },
    checklist: {
      ...emptyChecklist,
      sectionTitle: 'Competency details',
    },
    showInquiryForm: true,
  },
}
