import type { NavigationMenuSettings } from '~/types'

/** Совпадает с `NavigationSettingsService::defaultNavigation()` в API. */
export const navigationMenuDefaults: NavigationMenuSettings = {
  main: [
    { path: '/', label: { ru: 'Главная', en: 'Home' } },
    { path: '/about', label: { ru: 'О компании', en: 'About' } },
    {
      path: '/services',
      label: { ru: 'Сервис', en: 'Service' },
      children: [
        { path: '/ship-repair', label: { ru: 'Судоремонт', en: 'Ship repair' } },
        { path: '/spare-parts', label: { ru: 'Запчасти', en: 'Spare parts' } },
      ],
    },
    {
      path: '#',
      label: { ru: 'Менеджмент', en: 'Management' },
      children: [
        { path: '/ship-management', label: { ru: 'Судовой менеджмент', en: 'Ship management' } },
        { path: '/crewing-management', label: { ru: 'Крюинг', en: 'Crewing' } },
      ],
    },
    { path: '/vacancies', label: { ru: 'Вакансии', en: 'Vacancies' } },
    { path: '/contacts', label: { ru: 'Контакты', en: 'Contacts' } },
  ],
  more: [
    { path: '/projects', label: { ru: 'Проекты', en: 'Projects' } },
    { path: '/gallery', label: { ru: 'Галерея', en: 'Gallery' } },
    { path: '/news', label: { ru: 'Новости', en: 'News' } },
  ],
}
