import type { NavigationMenuSettings } from '~/types'

/** Пустая структура меню (нет записи в API или ошибка загрузки). Не содержит пунктов. */
export const emptyNavigationSettings = (): NavigationMenuSettings => ({
  main: [],
  more: [],
})
