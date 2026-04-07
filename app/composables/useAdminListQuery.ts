/** Собирает query string для списков админки (search, sort, order, фильтры). */
export function buildListQuery(params: Record<string, string | number | undefined | null | boolean>): string {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') {
      continue
    }
    u.set(k, String(v))
  }
  return u.toString()
}
