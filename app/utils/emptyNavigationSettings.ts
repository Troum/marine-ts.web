import type { NavigationMenuSettings } from '~/types'

/** Пустая структура меню (нет записи в API или ошибка загрузки). Не содержит пунктов. */
export const emptyNavigationSettings = (): NavigationMenuSettings => ({
  main: [],
  more: [],
  menuVariant: 'overlay',
  menuFontSize: 'base',
  menuFontWeight: 'medium',
  menuTextCase: 'none',
  menuJustify: 'between',
  menuItemColor: undefined,
  menuItemHoverColor: undefined,
  horizItems: undefined,
  burgerContacts: undefined,
})
