import type { AboutRichCard, MarineContentLocale, ShipManagementPageContent } from '~/types'
import { normalizeAboutRichCards } from '~/utils/aboutRichCardNormalize'

/** Встроенные секции v2 после hero (без отдельного CTA — финальный блок в `sec5Closing`). */
export const SHIP_MANAGEMENT_V2_SECTION_ORDER = ['approach', 'checklist', 'services', 'advantages', 'trust'] as const

export type ShipManagementV2SectionId = (typeof SHIP_MANAGEMENT_V2_SECTION_ORDER)[number]

const SHIP_V2_RU: ShipManagementPageContent = {
  sec1Hero: {
    title: 'Технический менеджмент от Марин Техникал Солюшнс',
    lead: 'Безопасность, надёжность и эффективность вашего флота',
    body:
      '<p>В современных условиях судоходства техническое состояние судна — это не просто вопрос отсутствия поломок, '
      + 'а фундамент коммерческого успеха. Компания «Марин Текникал Солюшнс» (МТС) предлагает комплексный подход '
      + 'к техническому менеджменту, который позволяет судовладельцам минимизировать простои '
      + 'и оптимизировать операционные расходы.</p>',
  },
  sec2Approach: {
    title: 'Почему технический менеджмент доверяют МТС?',
    body:
      '<p>Технический менеджмент от МТС — это передача заботы о судне в руки профессионалов с многолетним опытом. '
      + 'Мы берём на себя полную ответственность за поддержание мореходных качеств и эксплуатационную готовность вашего флота.</p>',
    cardsHeading: 'Наши ключевые приоритеты:',
    cards: [
      {
        title: 'Безопасность (Safety First)',
        text:
          '<p>Строгое соответствие международным стандартам (МКУБ, МАРПОЛ, СОЛАС) и требованиям классификационных обществ.</p>',
      },
      {
        title: 'Эффективность затрат',
        text:
          '<p>Превентивное обслуживание, которое позволяет избегать дорогостоящего экстренного ремонта.</p>',
      },
      {
        title: 'Прозрачность',
        text:
          '<p>Детальная отчётность о техническом состоянии и целевом использовании бюджета.</p>',
      },
    ],
  },
  sec3Services: {
    title: 'Что входит в пакет услуг технического менеджмента?',
    body: '<p>Мы обеспечиваем полный жизненный цикл эксплуатации судна:</p>',
    cards: [
      {
        title: 'Плановое техническое обслуживание (PMS)',
        text:
          '<p>Внедрение и контроль систем планово-предупредительного ремонта для всех узлов и механизмов.</p>',
      },
      {
        title: 'Снабжение и логистика',
        text:
          '<p>Организация поставок качественных запчастей (OEM и проверенные аналоги), расходных материалов и ГСМ по оптимальным ценам.</p>',
      },
      {
        title: 'Организация ремонтов и докований',
        text:
          '<p>Полное сопровождение: от составления ремонтных ведомостей и выбора верфи до технического надзора за выполнением работ.</p>',
      },
      {
        title: 'Инспекции и аудит',
        text:
          '<p>Регулярные посещения судов техническими суперинтендантами для оценки состояния и подготовки к проверкам PSC (Port State Control) и флага.</p>',


      },
      {
        title: 'Энергоэффективность',
        text:
          '<p>Мониторинг расхода топлива и внедрение решений по снижению вредных выбросов в соответствии с актуальными экологическими нормами (EEXI, CII).</p>',
      },
    ],
  },
  sec4Advantages: {
    title: 'Преимущества работы с нами',
    cards: [
      {
        title: 'Индивидуальный подход',
        text:
          '<p>Адаптация стратегии обслуживания под тип судна, его возраст и район плавания.</p>',
      },
      {
        title: 'Квалифицированные суперинтенданты',
        text:
          '<p>За каждым судном закреплён опытный технический специалист, доступный в режиме <strong>24/7</strong>.</p>',
      },
      {
        title: 'Минимизация рисков',
        text:
          '<p>Предвидение потенциальных технических проблем до того, как они станут критическими.</p>',
      },
    ],
  },
  sec5Closing: {
    title: 'Ваш флот в надёжных руках',
    paragraph1:
      '<p>Технический менеджмент от «Марин Текникал Солюшнс» освобождает судовладельца от рутинных операционных задач, '
      + 'позволяя сосредоточиться на коммерческом управлении и развитии бизнеса.</p>',
    paragraph2:
      '<p>Мы гарантируем, что ваши активы будут работать <strong>эффективно, безопасно и приносить максимальную прибыль</strong>.</p>',
  },
}

const SHIP_V2_EN: ShipManagementPageContent = {
  sec1Hero: {
    title: 'Technical management by Marine Technical Solutions',
    lead: 'Safety, reliability, and efficiency for your fleet',
    body:
      '<p>In today’s shipping environment, a vessel’s technical condition is more than the absence of breakdowns — '
      + 'it is the foundation of commercial success. Marine Technical Solutions (MTS) delivers a comprehensive '
      + 'technical management approach that helps owners minimise off-hire and optimise operating expenditure.</p>',
  },
  sec2Approach: {
    title: 'Why owners trust MTS with technical management?',
    body:
      '<p>MTS technical management means placing vessel care in the hands of seasoned professionals. '
      + 'We assume full responsibility for seaworthiness and operational readiness across your fleet.</p>',
    cardsHeading: 'Our key priorities:',
    cards: [
      {
        title: 'Safety first',
        text:
          '<p>Strict alignment with international standards (ISM, MARPOL, SOLAS) and classification society requirements.</p>',
      },
      {
        title: 'Cost effectiveness',
        text:
          '<p>Preventive maintenance that reduces the need for costly emergency repairs.</p>',
      },
      {
        title: 'Transparency',
        text:
          '<p>Detailed reporting on technical condition and how the budget is deployed.</p>',
      },
    ],
  },
  sec3Services: {
    title: 'What is included in the technical management package?',
    body: '<p>We cover the full operating lifecycle of the vessel:</p>',
    cards: [
      {
        title: 'Planned maintenance (PMS)',
        text:
          '<p>Implementation and control of planned maintenance systems for all machinery and systems.</p>',
      },
      {
        title: 'Supply & logistics',
        text:
          '<p>Procurement of quality spares (OEM and validated alternatives), consumables, and bunkers at competitive terms.</p>',
      },
      {
        title: 'Repairs & dockings',
        text:
          '<p>End-to-end support: from repair specifications and yard selection to on-site technical supervision.</p>',
      },
      {
        title: 'Inspections & audits',
        text:
          '<p>Regular superintendent visits, condition assessment, and preparation for PSC and flag inspections.</p>',
      },
      {
        title: 'Energy efficiency',
        text:
          '<p>Fuel monitoring and solutions to lower emissions in line with EEXI, CII, and evolving environmental rules.</p>',
      },
    ],
  },
  sec4Advantages: {
    title: 'Why work with us',
    cards: [
      {
        title: 'Tailored approach',
        text:
          '<p>Maintenance strategies adapted to vessel type, age, and trading pattern.</p>',
      },
      {
        title: 'Qualified superintendents',
        text:
          '<p>Each ship is supported by an experienced technical specialist, available <strong>24/7</strong>.</p>',
      },
      {
        title: 'Risk reduction',
        text:
          '<p>We spot technical risks before they become critical incidents.</p>',
      },
    ],
  },
  sec5Closing: {
    title: 'Your fleet in safe hands',
    paragraph1:
      '<p>MTS technical management removes day-to-day operational noise so owners can focus on commercial leadership and growth.</p>',
    paragraph2:
      '<p>We make sure your assets operate <strong>efficiently, safely, and profitably</strong>.</p>',
  },
}

export function defaultShipManagementContent(locale: MarineContentLocale): ShipManagementPageContent {
  const src = locale === 'en' ? SHIP_V2_EN : SHIP_V2_RU
  return JSON.parse(JSON.stringify(src)) as ShipManagementPageContent
}

export function mergeShipManagementContent(
  raw: unknown,
  base: ShipManagementPageContent,
): ShipManagementPageContent {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(base)) as ShipManagementPageContent
  }
  const r = raw as Partial<ShipManagementPageContent>
  const s2 = r.sec2Approach
  const s3 = r.sec3Services
  const s4 = r.sec4Advantages
  const s5 = r.sec5Closing
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
      cards: normalizeAboutRichCards(s2?.cards, base.sec2Approach.cards),
    },
    sec3Services: {
      title: typeof s3?.title === 'string' ? s3.title : base.sec3Services.title,
      body: typeof s3?.body === 'string' ? s3.body : base.sec3Services.body,
      cards: normalizeAboutRichCards(s3?.cards, base.sec3Services.cards),
    },
    sec4Advantages: {
      title: typeof s4?.title === 'string' ? s4.title : base.sec4Advantages.title,
      cards: normalizeAboutRichCards(s4?.cards, base.sec4Advantages.cards),
    },
    sec5Closing: {
      title: typeof s5?.title === 'string' ? s5.title : base.sec5Closing.title,
      paragraph1:
        typeof s5?.paragraph1 === 'string' ? s5.paragraph1 : base.sec5Closing.paragraph1,
      paragraph2:
        typeof s5?.paragraph2 === 'string' ? s5.paragraph2 : base.sec5Closing.paragraph2,
    },
  }
}
