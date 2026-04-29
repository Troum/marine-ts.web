import type { AboutRichCard, CrewingManagementPageContent, MarineContentLocale } from '~/types'

/** Порядок встроенных секций v2 после hero (включаются в `sectionOrder` без префикса `custom:`). */
export const CREWING_MANAGEMENT_V2_SECTION_ORDER = [
  'approach',
  'checklist',
  'services',
  'advantages',
  'trust',
  'cta',
] as const

export type CrewingManagementV2SectionId = (typeof CREWING_MANAGEMENT_V2_SECTION_ORDER)[number]

function normalizeRichCards(incoming: unknown, fallback: AboutRichCard[]): AboutRichCard[] {
  if (!Array.isArray(incoming)) {
    return fallback.map((c) => ({ ...c }))
  }
  if (incoming.length === 0) {
    return []
  }
  return incoming.map((item, i) => {
    const fb = fallback[i]
    return {
      title:
        typeof (item as { title?: unknown })?.title === 'string'
          ? (item as { title: string }).title
          : (fb?.title ?? ''),
      text:
        typeof (item as { text?: unknown })?.text === 'string'
          ? (item as { text: string }).text
          : (fb?.text ?? ''),
    }
  })
}

const CREWING_V2_RU: CrewingManagementPageContent = {
  sec1Hero: {
    title: 'Крюинг-менеджмент от Марин Техникал Солюшнс',
    lead: 'Профессиональный экипаж — залог стабильности рейса.',
    body:
      '<p>Успех любой морской операции на <strong>90%</strong> зависит '
      + 'от людей на борту. В условиях растущего дефицита квалифицированных кадров, '
      + 'компания «Марин Текникал Солюшнс» (МТС) берёт на себя решение самой сложной задачи — '
      + 'подбор, подготовку и полное администрирование экипажей для вашего флота.</p>',
  },
  sec2Approach: {
    title: 'Наш подход к формированию экипажей',
    body:
      '<p>Мы не просто «агентство по найму». МТС выстраивает систему долгосрочного сотрудничества с моряками, '
      + 'что позволяет нам формировать стабильные, сработанные экипажи, которые знают специфику конкретных судов '
      + 'и требования судовладельца.</p>',
    cardsHeading: 'Наши принципы в крюинге:',
    cards: [
      {
        title: 'Тщательный отбор',
        text:
          '<p>Многоуровневое тестирование (CES, Safebridge и др.), проверка отзывов с предыдущих мест работы '
          + 'и профессиональное интервью с техническими специалистами.</p>',
      },
      {
        title: 'Лояльность и удержание',
        text:
          '<p>Высокий коэффициент возвращаемости (retention rate), что снижает риски поломок оборудования '
          + 'из-за «человеческого фактора».</p>',
      },
      {
        title: 'Непрерывное обучение',
        text:
          '<p>Организация дополнительных курсов и инструктажей перед посадкой на судно.</p>',
      },
    ],
  },
  sec3Services: {
    title: 'Комплекс услуг Crew Management',
    body:
      '<p>МТС предлагает как частичный подбор специалистов, так и полный менеджмент экипажа «под ключ»:</p>',
    cards: [
      {
        title: 'Рекрутинг и найм',
        text:
          '<p>Поиск офицеров и рядового состава в соответствии с матрицей опыта судовладельца '
          + 'и требованиями флага.</p>',
      },
      {
        title: 'Визовая и проездная поддержка',
        text:
          '<p>Оформление подфлажных документов, виз, организация трансферов и смен в любой точке мира.</p>',
      },
      {
        title: 'Управление кадрами',
        text:
          '<p>Расчёт и выплата заработной платы, ведение контрактов, медицинское страхование и социальное обеспечение.</p>',
      },
      {
        title: 'Бюджетирование',
        text:
          '<p>Прозрачное планирование расходов на содержание экипажа и контроль соблюдения бюджета.</p>',
      },
      {
        title: 'Смена экипажей',
        text:
          '<p>Координация процессов смены для минимизации простоев судна и оптимизации логистических затрат.</p>',
      },
    ],
  },
  sec4Advantages: {
    title: 'Преимущества работы с нами',
    cards: [
      {
        title: 'База проверенных специалистов',
        text:
          '<p>Доступ к широкому кадровому резерву моряков с опытом работы на различных типах судов '
          + '(от танкерного флота до офшорных судов).</p>',
      },
      {
        title: 'Соответствие MLC 2006',
        text:
          '<p>Работа строго в рамках Конвенции о труде в морском судоходстве, гарантируя юридическую чистоту всех процессов.</p>',
      },
      {
        title: 'Контроль качества',
        text:
          '<p>Регулярная оценка деятельности моряков на борту и анализ отзывов капитанов/суперинтендантов.</p>',
      },
    ],
  },
  sec5Trust: {
    title: 'Профессионалы, которым можно доверять',
    paragraph1:
      '<p>Доверяя крюинг-менеджмент компании «Марин Текникал Солюшнс», вы получаете не просто персонал, '
      + 'а <strong>надёжную команду</strong>, способную решать сложные задачи в море.</p>',
    paragraph2:
      '<p>Мы берём на себя всю бюрократию и кадровые риски, чтобы вы могли сосредоточиться на глобальных целях вашего бизнеса.</p>',
  },
  sec6Cta: {
    title: 'Нужен надёжный экипаж?',
    body: '<p>Оставьте запрос, и мы подготовим предложение по комплектованию вашего судна.</p>',
  },
}

const CREWING_V2_EN: CrewingManagementPageContent = {
  sec1Hero: {
    title: 'Crew management by Marine Technical Solutions',
    lead: 'A professional crew is the foundation of a stable voyage.',
    body:
      '<p>The success of any marine operation depends on the people on board by about <strong>90%</strong>. '
      + 'Amid a growing shortage of qualified seafarers, Marine Technical Solutions (MTS) takes on the hardest challenge — '
      + 'recruitment, training, and full crew administration for your fleet.</p>',
  },
  sec2Approach: {
    title: 'Our approach to building crews',
    body:
      '<p>We are not just a “hiring agency”. MTS builds long-term cooperation with seafarers, allowing us to form '
      + 'stable, well-oiled crews familiar with your vessels and the shipowner’s expectations.</p>',
    cardsHeading: 'Our crewing principles:',
    cards: [
      {
        title: 'Rigorous screening',
        text:
          '<p>Multi-level testing (CES, Safebridge, etc.), reference checks from previous employments, '
          + 'and technical interviews with our specialists.</p>',
      },
      {
        title: 'Retention and loyalty',
        text:
          '<p>High return rates that reduce equipment risks linked to frequent crew turnover.</p>',
      },
      {
        title: 'Continuous training',
        text:
          '<p>Additional courses and briefings before joining a vessel.</p>',
      },
    ],
  },
  sec3Services: {
    title: 'Full-scope crew management services',
    body: '<p>MTS offers both partial recruitment and full turnkey crew management:</p>',
    cards: [
      {
        title: 'Recruitment & hiring',
        text:
          '<p>Finding officers and ratings according to the owner’s experience matrix and flag requirements.</p>',
      },
      {
        title: 'Travel & visa support',
        text:
          '<p>Flag-state documents, visas, transfers, and crew changes worldwide.</p>',
      },
      {
        title: 'HR administration',
        text:
          '<p>Payroll, contracts, medical insurance, and social compliance.</p>',
      },
      {
        title: 'Budgeting',
        text:
          '<p>Transparent crew cost planning and budget control.</p>',
      },
      {
        title: 'Crew changes',
        text:
          '<p>Coordinated reliefs to minimise off-hire and logistics costs.</p>',
      },
    ],
  },
  sec4Advantages: {
    title: 'Why work with us',
    cards: [
      {
        title: 'Vetted talent pool',
        text:
          '<p>Access to seafarers with experience across tankers, offshore units, and other segments.</p>',
      },
      {
        title: 'MLC 2006 compliance',
        text:
          '<p>Processes aligned with the Maritime Labour Convention for legal certainty.</p>',
      },
      {
        title: 'Quality control',
        text:
          '<p>Regular onboard performance reviews and feedback from captains and superintendents.</p>',
      },
    ],
  },
  sec5Trust: {
    title: 'Professionals you can rely on',
    paragraph1:
      '<p>By outsourcing crew management to MTS, you gain not just manpower but a <strong>dependable team</strong> '
      + 'that solves complex challenges at sea.</p>',
    paragraph2:
      '<p>We absorb bureaucracy and HR risk so you can focus on your business goals.</p>',
  },
  sec6Cta: {
    title: 'Need a reliable crew?',
    body: '<p>Send a request and we will propose a manning solution for your vessel.</p>',
  },
}

/** Демо-контент v2 для локали (публичный сайт до заполнения CMS). */
export function defaultCrewingManagementContent(locale: MarineContentLocale): CrewingManagementPageContent {
  const src = locale === 'en' ? CREWING_V2_EN : CREWING_V2_RU
  return JSON.parse(JSON.stringify(src)) as CrewingManagementPageContent
}

function splitLegacyTrustBody(body: string): { paragraph1: string; paragraph2: string } {
  const trimmed = body.trim()
  const paras = trimmed.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi)
  if (paras && paras.length >= 2) {
    return { paragraph1: paras[0]!, paragraph2: paras.slice(1).join('') }
  }
  return { paragraph1: trimmed, paragraph2: '' }
}

function mergeSec5Trust(
  raw: unknown,
  base: CrewingManagementPageContent['sec5Trust'],
): CrewingManagementPageContent['sec5Trust'] {
  const r = raw as Partial<{
    title?: string
    body?: string
    paragraph1?: string
    paragraph2?: string
  }>
  const title = typeof r.title === 'string' ? r.title : base.title
  if (typeof r.paragraph1 === 'string' || typeof r.paragraph2 === 'string') {
    return {
      title,
      paragraph1: typeof r.paragraph1 === 'string' ? r.paragraph1 : base.paragraph1,
      paragraph2: typeof r.paragraph2 === 'string' ? r.paragraph2 : base.paragraph2,
    }
  }
  if (typeof r.body === 'string' && r.body.trim()) {
    const sp = splitLegacyTrustBody(r.body)
    return {
      title,
      paragraph1: sp.paragraph1 || base.paragraph1,
      paragraph2: sp.paragraph2,
    }
  }
  return { ...base }
}

export function mergeCrewingManagementContent(
  raw: unknown,
  base: CrewingManagementPageContent,
): CrewingManagementPageContent {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(base)) as CrewingManagementPageContent
  }
  const r = raw as Partial<CrewingManagementPageContent>
  const s2 = r.sec2Approach
  const s3 = r.sec3Services
  const s4 = r.sec4Advantages
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
      cards: normalizeRichCards(s2?.cards, base.sec2Approach.cards),
    },
    sec3Services: {
      title: typeof s3?.title === 'string' ? s3.title : base.sec3Services.title,
      body: typeof s3?.body === 'string' ? s3.body : base.sec3Services.body,
      cards: normalizeRichCards(s3?.cards, base.sec3Services.cards),
    },
    sec4Advantages: {
      title: typeof s4?.title === 'string' ? s4.title : base.sec4Advantages.title,
      cards: normalizeRichCards(s4?.cards, base.sec4Advantages.cards),
    },
    sec5Trust: mergeSec5Trust(r.sec5Trust, base.sec5Trust),
    sec6Cta: {
      title: typeof r.sec6Cta?.title === 'string' ? r.sec6Cta.title : base.sec6Cta.title,
      body: typeof r.sec6Cta?.body === 'string' ? r.sec6Cta.body : base.sec6Cta.body,
    },
  }
}
