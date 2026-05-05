import type { SiteContactSettings } from '~/types'

/** Запасной вариант, если API недоступен. */
export const contactSettingsDefaults: SiteContactSettings = {
  quick: [
    { iconKey: 'phone', label: 'Телефон', value: '8 (4012) 35-52-90', href: 'tel:84012355290', showInFooter: true },
    { iconKey: 'mail', label: 'Email', value: 'info@marine-ts.com', href: 'mailto:info@marine-ts.com', showInFooter: true },
    { iconKey: 'map-pin', label: 'Адрес', value: 'г. Калининград, Россия', href: null, showInFooter: true },
    { iconKey: 'clock', label: 'Режим работы', value: 'Пн-Пт: 9:00 - 18:00', href: null, showInFooter: false },
  ],
  socials: [
    { iconKey: 'vk', url: 'https://vk.com/marine_ts' },
  ],
  departments: [
    {
      title: 'Отдел судового менеджмента',
      phone: '8 4012 35 52 90 (доб 1)',
      email: 'sblokhin@marin-ts.com',
      showInFooter: false,
    },
    {
      title: 'Отдел крюинга',
      phone: '8 4012 35 52 90 (доб 4)',
      email: 'cv@marin-ts.com',
      showInFooter: false,
    },
    {
      title: 'Отдел снабжения',
      phone: '8 4012 35 52 90 (доб 2)',
      email: 'snabzheniye@marin-ts.com',
      showInFooter: false,
    },
    {
      title: 'Отдел судоремонта',
      phone: '8 4012 35 52 90 (доб 3)',
      email: 'tech2@marin-ts.com',
      showInFooter: false,
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
