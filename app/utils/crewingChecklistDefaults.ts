import type { CrewingChecklistBlock, CrewingChecklistSection } from '~/types'

/** Сколько непустых пунктов (title или text) во всех секциях. */
export function countFilledCrewingChecklistPoints(sections: CrewingChecklistSection[]): number {
  let n = 0
  for (const s of sections) {
    for (const p of s.points) {
      if ((p.title?.trim() ?? '') || (p.text?.trim() ?? '')) {
        n++
      }
    }
  }
  return n
}

export type CrewingChecklistRenderRow =
  | { type: 'heading'; text: string }
  | { type: 'point'; num: number; title: string; text: string }

/** Плоский список заголовков секций и пронумерованных пунктов для вёрстки. */
export function buildCrewingChecklistRenderRows(checklist: CrewingChecklistBlock): CrewingChecklistRenderRow[] {
  const rows: CrewingChecklistRenderRow[] = []
  let num = 0
  for (const sec of checklist.sections) {
    const pts = sec.points.filter(p => (p.title?.trim() ?? '') || (p.text?.trim() ?? ''))
    if (!pts.length) {
      continue
    }
    const h = sec.heading?.trim() ?? ''
    if (h) {
      rows.push({ type: 'heading', text: h })
    }
    for (const pt of pts) {
      num++
      rows.push({ type: 'point', num, title: pt.title, text: pt.text })
    }
  }
  return rows
}

/** Дефолтные секции и пункты чек-листа (RU) — стартовое наполнение для CMS. */
export const DEFAULT_CREWING_CHECKLIST_SECTIONS_RU: CrewingChecklistSection[] = [
  {
    heading: 'I. Легитимность и документы (Compliance)',
    points: [
      {
        title: 'Верификация дипломов (CoC):',
        text: 'Прямая проверка через реестры администраций флагов.',
      },
      {
        title: 'Танкерные/Специальные подтверждения:',
        text: 'Соответствие типа судна и перевозимого груза.',
      },
      {
        title: 'Легитимность СТОР (Seaman\'s Book):',
        text: 'Проверка истории ценза и отсутствия «черных меток».',
      },
      {
        title: 'Визовый статус:',
        text: 'Наличие действующих виз (Шенген, США, ОАЭ) для оперативной смены.',
      },
      {
        title: 'Медицинская пригодность:',
        text: 'Действующий международный медотчет + дополнительные тесты по требованию судовладельца.',
      },
    ],
  },
  {
    heading: 'II. Профессиональные компетенции (Professional Skills)',
    points: [
      {
        title: 'Тестирование CES / Safebridge:',
        text: 'Оценка уровня теоретических знаний.',
      },
      {
        title: 'Marlins Test:',
        text: 'Подтверждение уровня английского языка (не ниже 80% для офицеров).',
      },
      {
        title: 'Опыт с СЭУ:',
        text: 'Проверка работы с конкретными марками двигателей и автоматики.',
      },
      {
        title: 'Навыки работы с композитами:',
        text: 'Знание специфики эксплуатации труб GRE/GRV (актуально для техменеджмента MTS).',
      },
      {
        title: 'Опыт инспекций:',
        text: 'Участие в прохождении проверок PSC, SIRE, CDI (для топ-офицеров).',
      },
    ],
  },
  {
    heading: 'III. Безопасность и экология (HSE & Environment)',
    points: [
      {
        title: 'Знание МКУБ (ISM Code):',
        text: 'Понимание процедур безопасности компании.',
      },
      {
        title: 'Экологическая грамотность:',
        text: 'Навыки работы с системами очистки балластных вод и контроля выбросов.',
      },
      {
        title: 'Обучение по охране судна:',
        text: 'Наличие сертификатов SSO/DSD.',
      },
      {
        title: 'Инструктаж по «Нулевому травматизму»:',
        text: 'Внутренний тренинг MTS перед контрактом.',
      },
    ],
  },
  {
    heading: 'IV. Личные качества и Soft Skills (Human Element)',
    points: [
      {
        title: 'Психологическое интервью:',
        text: 'Оценка стрессоустойчивости в длительном рейсе.',
      },
      {
        title: 'Рекомендации:',
        text: 'Обязательный обзвон 2–3 предыдущих работодателей.',
      },
      {
        title: 'Отсутствие вредных привычек:',
        text: 'Строгая политика Drug & Alcohol (тестирование).',
      },
      {
        title: 'Лидерские качества:',
        text: 'Для старшего комсостава — оценка навыков управления подчиненными.',
      },
      {
        title: 'Конфликтология:',
        text: 'Способность работать в многонациональном или специфическом коллективе.',
      },
      {
        title: 'Лояльность компании:',
        text: 'Готовность к долгосрочному сотрудничеству с MTS.',
      },
    ],
  },
]

export const DEFAULT_CREWING_CHECKLIST_SECTIONS_EN: CrewingChecklistSection[] = [
  {
    heading: 'I. Legitimacy & documentation (Compliance)',
    points: [
      { title: 'CoC verification:', text: 'Direct checks via flag administration registries.' },
      { title: 'Tanker / special endorsements:', text: 'Alignment with vessel type and cargo carried.' },
      { title: "Seaman's book legitimacy:", text: 'Service history and absence of adverse records.' },
      { title: 'Visa status:', text: 'Valid visas (Schengen, US, UAE) for timely crew changes.' },
      {
        title: 'Medical fitness:',
        text: 'Valid international medical certificate plus additional tests as required by the owner.',
      },
    ],
  },
  {
    heading: 'II. Professional skills',
    points: [
      { title: 'CES / Safebridge testing:', text: 'Assessment of theoretical knowledge.' },
      { title: 'Marlins test:', text: 'English proficiency (not below 80% for officers).' },
      { title: 'ME experience:', text: 'Verification of work with specific engine brands and automation.' },
      {
        title: 'Composite materials:',
        text: 'Knowledge of GRE/GRV piping specifics (relevant for MTS technical management).',
      },
      { title: 'Inspection experience:', text: 'PSC, SIRE, CDI exposure (for senior officers).' },
    ],
  },
  {
    heading: 'III. HSE & environment',
    points: [
      { title: 'ISM Code awareness:', text: 'Understanding of company safety procedures.' },
      {
        title: 'Environmental competence:',
        text: 'Ballast water treatment and emission control systems.',
      },
      { title: 'Ship security training:', text: 'Valid SSO/DSD certificates where applicable.' },
      { title: 'Zero-harm briefing:', text: 'Internal MTS training before joining.' },
    ],
  },
  {
    heading: 'IV. Human element & soft skills',
    points: [
      { title: 'Psychological interview:', text: 'Stress resilience for long voyages.' },
      { title: 'References:', text: 'Mandatory contact with 2–3 previous employers.' },
      { title: 'Drug & alcohol policy:', text: 'Strict screening and testing.' },
      { title: 'Leadership:', text: 'For senior ranks — people management skills.' },
      { title: 'Conflict management:', text: 'Working in multicultural or demanding teams.' },
      { title: 'Company loyalty:', text: 'Commitment to long-term cooperation with MTS.' },
    ],
  },
]
