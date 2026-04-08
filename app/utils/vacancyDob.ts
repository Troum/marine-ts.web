/** Преобразует ДД.ММ.ГГГГ или YYYY-MM-DD в YYYY-MM-DD для input[type=date]. */
export function vacancyDobToIso(raw: string | undefined): string {
  const v = raw?.trim() ?? ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return isValidYmd(v) ? v : ''
  }
  const m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) {
    return ''
  }
  const d = m[1].padStart(2, '0')
  const mo = m[2].padStart(2, '0')
  const y = m[3]
  const iso = `${y}-${mo}-${d}`
  return isValidYmd(iso) ? iso : ''
}

function isValidYmd(iso: string): boolean {
  const [y, mo, d] = iso.split('-').map(Number)
  const dt = new Date(y, mo - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
}

export function isVacancyDobComplete(raw: string | undefined): boolean {
  const t = raw?.trim()
  if (!t) {
    return false
  }
  const iso = vacancyDobToIso(t) || (/^\d{4}-\d{2}-\d{2}$/.test(t) ? t : '')
  return !!iso && isValidYmd(iso)
}

/** Перед отправкой: единый формат YYYY-MM-DD. */
export function normalizeVacancyDob(raw: string | undefined): string {
  const iso = vacancyDobToIso(raw ?? '')
  if (iso) {
    return iso
  }
  return raw?.trim() ?? ''
}
