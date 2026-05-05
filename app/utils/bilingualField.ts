import type { MarineContentLocale } from '~/types'

/** Значение из CMS: одна строка (legacy) или ru/en. */
export type BilingualValue = string | { ru: string; en: string }

export function parseBilingual(raw: unknown, fallbackRu = '', fallbackEn = ''): { ru: string; en: string } {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>
    const ru = typeof o.ru === 'string' ? o.ru : fallbackRu
    const en = typeof o.en === 'string' ? o.en : fallbackEn
    return { ru, en }
  }
  if (typeof raw === 'string') {
    return { ru: raw, en: raw }
  }
  return { ru: fallbackRu, en: fallbackEn }
}

export function pickLocalized(
  value: BilingualValue | undefined | null,
  loc: MarineContentLocale,
  fallback = '',
): string {
  if (value == null) {
    return fallback
  }
  if (typeof value === 'string') {
    return value.trim() || fallback
  }
  const primary = loc === 'en' ? value.en?.trim() : value.ru?.trim()
  if (primary) {
    return primary
  }
  const alt = loc === 'en' ? value.ru?.trim() : value.en?.trim()
  return alt || fallback
}

/** Для отправки в API: одна строка, если en совпадает с ru или пустой. */
export function serializeBilingual(ru: string, en: string): BilingualValue {
  const r = ru.trim()
  const e = en.trim()
  if (!e || e === r) {
    return r
  }
  return { ru: r, en: e }
}
