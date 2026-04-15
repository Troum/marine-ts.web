import type { CrewingPageData, MarineContentLocale } from '~/types'

const emptyChecklist = {
  toggleShow: '',
  toggleHide: '',
  intro: '',
  sections: [] as CrewingPageData['checklist']['sections'],
}

export const SHIP_MANAGEMENT_DEFAULTS: Record<MarineContentLocale, CrewingPageData> = {
  ru: {
    hero: {
      label: 'Судовой менеджмент',
      title: 'Операционное и техническое ',
      titleAccent: 'сопровождение',
      titleEnd: ' флота',
      lead: 'Единая точка ответственности за эксплуатацию судна: планирование ТОиР, контроль подрядчиков, взаимодействие с классом и береговым офисом судовладельца.',
    },
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
      toggleShow: 'Показать детали компетенций',
      toggleHide: 'Скрыть',
    },
    showInquiryForm: true,
  },
  en: {
    hero: {
      label: 'Ship management',
      title: 'Operational & technical ',
      titleAccent: 'fleet support',
      titleEnd: '',
      lead: 'A single point of accountability for safe operations: maintenance planning, contractor control, class liaison and owner reporting.',
    },
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
      toggleShow: 'Show competency details',
      toggleHide: 'Hide',
    },
    showInquiryForm: true,
  },
}

export const SHIP_REPAIR_DEFAULTS: Record<MarineContentLocale, CrewingPageData> = {
  ru: {
    hero: {
      label: 'Судоремонт',
      title: 'Ремонт и модернизация ',
      titleAccent: 'корпуса и техники',
      titleEnd: '',
      lead: 'Полный цикл или точечные работы в портах присутствия: корпус, главные и вспомогательные машины, электроавтоматика, докование.',
    },
    directionsSection: {
      title: 'Направления работ',
      lead: 'Инженерное сопровождение от дефекта до приёмки с классом и судовладельцем.',
    },
    directions: [
      {
        icon: 'Anchor',
        title: 'Корпус и дефектоскопия',
        text: 'Ремонт обшивки, УЗК/МПД, подготовка к классовым и внеочередным обследованиям.',
      },
      {
        icon: 'Cog',
        title: 'Главный и вспомогательные двигатели',
        text: 'Механика, регулировка, капитальный ремонт агрегатов по согласованной спецификации.',
      },
      {
        icon: 'Zap',
        title: 'Электроавтоматика',
        text: 'Силовые и осветительные сети, АПС, средства автоматики главного двигателя.',
      },
      {
        icon: 'Warehouse',
        title: 'Докование',
        text: 'Подготовка проекта, контроль сроков и качества работ на доке.',
      },
      {
        icon: 'Truck',
        title: 'Аварийный выезд',
        text: 'Организация бригады и логистики для срочного устранения повреждений.',
      },
      {
        icon: 'ClipboardCheck',
        title: 'Приёмка и гарантия',
        text: 'Совместная приёмка с капитаном и классом, гарантийные обязательства подрядчиков.',
      },
    ],
    principles: {
      title: 'Принципы',
      items: [
        'Соответствие правилам класса и требованиям судовладельца',
        'Прозрачная смета и согласование отклонений до начала работ',
        'Документирование дефектов, актов и сертификатов материалов',
      ],
    },
    audience: {
      title: 'Кому подходит',
      paragraph1:
        'Судовладельцам и операторам, которым нужен контролируемый ремонт в сжатые сроки с понятной ответственностью сторон.',
      paragraph2: 'Опишите задачу — подготовим коммерческое предложение и план работ.',
      ctaLabel: 'Связаться с нами',
      ctaHref: '/contacts',
    },
    checklist: {
      ...emptyChecklist,
      toggleShow: 'Показать этапы работ',
      toggleHide: 'Скрыть',
    },
    showInquiryForm: true,
  },
  en: {
    hero: {
      label: 'Ship repair',
      title: 'Hull & machinery ',
      titleAccent: 'repair',
      titleEnd: '',
      lead: 'Full cycle or targeted jobs in our ports: hull, main and auxiliary machinery, electrical and automation, docking.',
    },
    directionsSection: {
      title: 'Workstreams',
      lead: 'Engineering support from defect identification to handover with class and owner.',
    },
    directions: [
      {
        icon: 'Anchor',
        title: 'Hull & NDT',
        text: 'Steel work, UT/MP inspection prep for class and emergency repairs.',
      },
      {
        icon: 'Cog',
        title: 'Main & auxiliary engines',
        text: 'Mechanical overhaul and alignment per agreed scope.',
      },
      {
        icon: 'Zap',
        title: 'Electrical & automation',
        text: 'Power distribution, alarms and main engine control systems.',
      },
      {
        icon: 'Warehouse',
        title: 'Docking',
        text: 'Project preparation, schedule and quality control in dock.',
      },
      {
        icon: 'Truck',
        title: 'Emergency response',
        text: 'Rapid team mobilisation for urgent damage control.',
      },
      {
        icon: 'ClipboardCheck',
        title: 'Handover & warranty',
        text: 'Joint acceptance with master and class; contractor warranty tracking.',
      },
    ],
    principles: {
      title: 'Principles',
      items: [
        'Class and owner requirements as the baseline',
        'Transparent estimates and change-order discipline',
        'Full paper trail for defects, certificates and materials',
      ],
    },
    audience: {
      title: 'Who it is for',
      paragraph1: 'Owners who need controlled repairs on time with clear accountability.',
      paragraph2: 'Share the job scope — we will respond with pricing and a work plan.',
      ctaLabel: 'Contact us',
      ctaHref: '/contacts',
    },
    checklist: {
      ...emptyChecklist,
      toggleShow: 'Show work stages',
      toggleHide: 'Hide',
    },
    showInquiryForm: true,
  },
}

export const SPARE_PARTS_DEFAULTS: Record<MarineContentLocale, CrewingPageData> = {
  ru: {
    hero: {
      label: 'Запчасти и снабжение',
      title: 'Поставки ',
      titleAccent: 'под задачу',
      titleEnd: ' судна',
      lead: 'Подбор по OEM и проверенным аналогам, логистика в порт захода, учёт и единое окно заявок для судовладельца.',
    },
    directionsSection: {
      title: 'Направления',
      lead: 'Снижаем время простоя за счёт прозрачного снабжения и контроля критичных позиций.',
    },
    directions: [
      {
        icon: 'Search',
        title: 'Подбор и верификация',
        text: 'Сверка с каталогами производителя, допустимые замены и сроки изготовления.',
      },
      {
        icon: 'Globe2',
        title: 'Логистика в порт',
        text: 'Маршруты, страхование, согласование с агентом и получателем на борту.',
      },
      {
        icon: 'Package',
        title: 'Склад и учёт',
        text: 'Учёт остатков, минимальные запасы под тип судна и регион.',
      },
      {
        icon: 'TriangleAlert',
        title: 'Критичные позиции',
        text: 'Ускоренная обработка заявок на узлы, влияющие на выход в рейс.',
      },
      {
        icon: 'FileCheck',
        title: 'Таможня и сертификаты',
        text: 'Сопровождение документов на поставку и соответствие флагу.',
      },
      {
        icon: 'Headphones',
        title: 'Единое окно',
        text: 'Один контакт по заявке: статус, сроки, альтернативы при срыве поставки.',
      },
    ],
    principles: {
      title: 'Принципы',
      items: [
        'Прозрачность происхождения запчастей и документации',
        'Никаких скрытых комиссий в цепочке поставки',
        'Регулярная отчётность по открытым заявкам',
      ],
    },
    audience: {
      title: 'Кому подходит',
      paragraph1: 'Судовладельцам и снабженцам, которым нужна предсказуемая поставка без размытия ответственности.',
      paragraph2: 'Пришлите спецификацию или заявку — рассчитаем сроки и стоимость.',
      ctaLabel: 'Связаться с нами',
      ctaHref: '/contacts',
    },
    checklist: {
      ...emptyChecklist,
      toggleShow: 'Показать критерии поставки',
      toggleHide: 'Скрыть',
    },
    showInquiryForm: true,
  },
  en: {
    hero: {
      label: 'Spare parts',
      title: 'Supply ',
      titleAccent: 'aligned',
      titleEnd: ' with operations',
      lead: 'OEM and approved alternatives, delivery to the port of call, stock discipline and a single request window.',
    },
    directionsSection: {
      title: 'What we deliver',
      lead: 'Fewer off-hire days through disciplined procurement and critical-part focus.',
    },
    directions: [
      {
        icon: 'Search',
        title: 'Sourcing & verification',
        text: 'Catalogue matching, approved substitutes and lead times.',
      },
      {
        icon: 'Globe2',
        title: 'Port logistics',
        text: 'Routing, insurance, coordination with agents and vessel receipt.',
      },
      {
        icon: 'Package',
        title: 'Stock & records',
        text: 'Min-max levels tailored to vessel type and trading area.',
      },
      {
        icon: 'TriangleAlert',
        title: 'Critical items',
        text: 'Fast-track handling for parts that gate sailing.',
      },
      {
        icon: 'FileCheck',
        title: 'Customs & certs',
        text: 'Documentation pack aligned with flag and import rules.',
      },
      {
        icon: 'Headphones',
        title: 'Single point of contact',
        text: 'One owner for the PO: status, ETA and contingency options.',
      },
    ],
    principles: {
      title: 'Principles',
      items: [
        'Traceable origin and documentation for every part',
        'No hidden mark-ups in the supply chain',
        'Regular reporting on open requests',
      ],
    },
    audience: {
      title: 'Who it is for',
      paragraph1: 'Owners and purchasers who need predictable delivery with clear accountability.',
      paragraph2: 'Share your RFQ — we will return pricing and lead times.',
      ctaLabel: 'Contact us',
      ctaHref: '/contacts',
    },
    checklist: {
      ...emptyChecklist,
      toggleShow: 'Show supply criteria',
      toggleHide: 'Hide',
    },
    showInquiryForm: true,
  },
}
