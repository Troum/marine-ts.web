import type { SiteContactSettings } from '~/types'

/** Запасной вариант, если API недоступен. */
export const contactSettingsDefaults: SiteContactSettings = {
  quick: [
    { iconKey: 'phone', label: 'Телефон', value: '8 (4012) 35-52-90', href: 'tel:84012355290' },
    { iconKey: 'mail', label: 'Email', value: 'info@marine-ts.com', href: 'mailto:info@marine-ts.com' },
    { iconKey: 'map-pin', label: 'Адрес', value: 'г. Калининград, Россия', href: null },
    { iconKey: 'clock', label: 'Режим работы', value: 'Пн-Пт: 9:00 - 18:00', href: null },
    {
      iconKey: 'link',
      label: 'Соцсеть',
      value: 'vk.com/marine_ts',
      href: 'https://vk.com/marine_ts',
    },
  ],
  offices: [
    {
      city: 'Калининград',
      country: 'Россия',
      address: 'Головной офис Marine Technical Solutions',
      phone: '8 (4012) 35-52-90',
      email: 'info@marin-ts.com',
    },
    {
      city: 'Дубай',
      country: 'ОАЭ',
      address: 'Представительство в Объединенных Арабских Эмиратах',
      phone: '',
      email: 'info@marin-ts.com',
    },
  ],
}
