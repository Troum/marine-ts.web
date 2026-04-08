import type { SiteContactSettings } from '~/types'

/** Запасной вариант, если API недоступен. */
export const contactSettingsDefaults: SiteContactSettings = {
  quick: [
    { iconKey: 'phone', label: 'Телефон', value: '8 (4012) 35-52-90', href: 'tel:84012355290' },
    { iconKey: 'mail', label: 'Email', value: 'info@marin-ts.com', href: 'mailto:info@marin-ts.com' },
    { iconKey: 'map-pin', label: 'Адрес', value: 'г. Калининград, Россия', href: null },
    { iconKey: 'clock', label: 'Режим работы', value: 'Пн-Пт: 9:00 - 18:00', href: null },
  ],
  offices: [
    {
      city: 'Калининград',
      country: 'Россия',
      address: 'ул. Портовая, 15, офис 302',
      phone: '8 (4012) 35-52-90',
      email: 'info@marin-ts.com',
    },
    {
      city: 'Дубай',
      country: 'ОАЭ',
      address: 'Dubai Maritime City, Building 45',
      phone: '+971 4 123 4567',
      email: 'dubai@marin-ts.com',
    },
    {
      city: 'Роттердам',
      country: 'Нидерланды',
      address: 'Wilhelminakade 123, 3072 AP',
      phone: '+31 10 123 4567',
      email: 'rotterdam@marin-ts.com',
    },
  ],
}
