export type AccentTitlePart = { kind: 'plain' | 'accent'; text: string }

/**
 * Собирает заголовок из трёх полей (до акцента / акцент / после).
 * Между непустыми частями вставляется один пробел — в CMS не нужно дописывать пробелы вручную.
 */
export function accentTitleParts(before: string, accent: string, after: string): AccentTitlePart[] {
  const b = (before ?? '').trim()
  const a = (accent ?? '').trim()
  const e = (after ?? '').trim()
  const out: AccentTitlePart[] = []
  if (b) {
    out.push({ kind: 'plain', text: b })
  }
  if (a) {
    out.push({ kind: 'accent', text: a })
  }
  if (e) {
    out.push({ kind: 'plain', text: e })
  }
  return out
}
