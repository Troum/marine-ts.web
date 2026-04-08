import type { MarineContentLocale } from '~/types'

export const MARINE_CONTENT_LOCALES: MarineContentLocale[] = ['ru', 'en']

export const MARINE_LOCALE_META: Record<
  MarineContentLocale,
  { label: string; short: string; hint: string }
> = {
  ru: {
    label: 'Русский',
    short: 'RU',
    hint: 'Основная версия сайта',
  },
  en: {
    label: 'English',
    short: 'EN',
    hint: 'English site copy',
  },
}

export function defaultMarineLocale(): MarineContentLocale {
  return 'ru'
}
