import type { FooterMenuSettings } from '~/types'

export function emptyFooterMenuSettings(): FooterMenuSettings {
  return {
    columns: [
      {
        title: { ru: 'Компания', en: 'Company' },
        links: [
          { path: '/about', label: { ru: 'О компании', en: 'About' } },
          { path: '/contacts', label: { ru: 'Контакты', en: 'Contacts' } },
        ],
      },
      {
        title: { ru: 'Судоремонт', en: 'Ship Repair' },
        links: [
          { path: '/services', label: { ru: 'Судоремонт', en: 'Ship Repair' } },
          { path: '/ship-management', label: { ru: 'Судовой менеджмент', en: 'Ship management' } },
          { path: '/crewing-management', label: { ru: 'Крюинг-менеджмент', en: 'Crew management' } },
        ],
      },
      {
        title: { ru: 'Кандидатам', en: 'For candidates' },
        links: [
          { path: '/vacancies', label: { ru: 'Вакансии', en: 'Vacancies' } },
          { path: '/application-form', label: { ru: 'Анкета', en: 'Application' } },
        ],
      },
    ],
    legal: [
      { path: '/privacy', label: { ru: 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ', en: 'PRIVACY POLICY' } },
      { path: '/terms', label: { ru: 'УСЛОВИЯ ИСПОЛЬЗОВАНИЯ', en: 'TERMS OF USE' } },
    ],
    hideFooterGlobally: false,
    hideFooterPaths: [],
  }
}
