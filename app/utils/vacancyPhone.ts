import { isValidPhoneNumber } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'

const DEFAULT_NATIONAL: CountryCode = 'RU'

/**
 * Проверка мобильного/контактного номера для анкеты: международный с «+» или национальный с default country.
 */
export function isVacancyPhoneValid(raw: string | undefined, defaultCountry: CountryCode = DEFAULT_NATIONAL): boolean {
  const t = raw?.trim()
  if (!t) {
    return false
  }
  try {
    if (t.startsWith('+')) {
      return isValidPhoneNumber(t)
    }
    return isValidPhoneNumber(t, defaultCountry)
  } catch {
    return false
  }
}
