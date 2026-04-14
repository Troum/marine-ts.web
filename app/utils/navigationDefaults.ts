import type { NavigationMenuSettings } from '~/types'

/** Совпадает с `NavigationSettingsService::defaultNavigation()` в API. */
export const navigationMenuDefaults: NavigationMenuSettings = {
  main: [
    { path: '/', label: { ru: 'Главная', en: 'Home' } },
    { path: '/about', label: { ru: 'О компании', en: 'About' } },
    { path: '/services', label: { ru: 'Услуги', en: 'Services' } },
    { path: '/contacts', label: { ru: 'Контакты', en: 'Contacts' } },
  ],
  more: [
    { path: '/projects', label: { ru: 'Проекты', en: 'Projects' } },
    { path: '/gallery', label: { ru: 'Галерея', en: 'Gallery' } },
    { path: '/news', label: { ru: 'Новости', en: 'News' } },
  ],
}
