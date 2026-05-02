import type { FooterMenuSettings, MarineContentLocale } from '~/types'
import { emptyFooterMenuSettings } from '~/utils/emptyFooterMenuSettings'

function normLabel(raw: unknown): Record<MarineContentLocale, string> {
  if (!raw || typeof raw !== 'object') {
    return { ru: '', en: '' }
  }
  const o = raw as Record<string, unknown>
  return {
    ru: typeof o.ru === 'string' ? o.ru : '',
    en: typeof o.en === 'string' ? o.en : '',
  }
}

function normLink(raw: unknown): { path: string; label: Record<MarineContentLocale, string> } {
  if (!raw || typeof raw !== 'object') {
    return { path: '/', label: { ru: '', en: '' } }
  }
  const o = raw as Record<string, unknown>
  return {
    path: typeof o.path === 'string' ? o.path : '/',
    label: normLabel(o.label),
  }
}

function normColumn(raw: unknown, fallback: FooterMenuSettings['columns'][0]): FooterMenuSettings['columns'][0] {
  if (!raw || typeof raw !== 'object') {
    return { ...fallback, links: [...fallback.links] }
  }
  const o = raw as Record<string, unknown>
  const title = normLabel(o.title)
  const linksRaw = o.links
  const links: FooterMenuSettings['columns'][0]['links'] = []
  if (Array.isArray(linksRaw)) {
    for (const row of linksRaw) {
      links.push(normLink(row))
    }
  }
  return {
    title: { ru: title.ru || fallback.title.ru, en: title.en || fallback.title.en },
    links: links.length > 0 ? links : [...fallback.links],
  }
}

/**
 * Снимает вложенные обёртки `data` (Laravel JsonResource, прокси, двойной `data`),
 * пока не найдёт объект с полем `columns` — массивом.
 */
function unwrapFooterPayload(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return null
  }
  let cur: unknown = json
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) {
      return null
    }
    const o = cur as Record<string, unknown>
    if (Array.isArray(o.columns) || typeof o.hideFooterGlobally === 'boolean') {
      return o
    }
    const next = o.data
    if (next !== undefined && next !== null && typeof next === 'object' && !Array.isArray(next)) {
      cur = next
      continue
    }
    return null
  }
  return null
}

/** Ответ GET `/footer-navigation-settings` (Laravel JsonResource: `{ data: … }` или корень). */
export function normalizeFooterMenuSettingsPayload(json: unknown): FooterMenuSettings {
  const def = emptyFooterMenuSettings()
  const inner = unwrapFooterPayload(json)
  if (!inner) {
    return def
  }

  const columnsRaw = inner.columns
  const columns: FooterMenuSettings['columns'] = []
  if (Array.isArray(columnsRaw)) {
    for (let i = 0; i < 3; i++) {
      columns.push(normColumn(columnsRaw[i], def.columns[i]!))
    }
  } else {
    return def
  }

  const legalRaw = inner.legal
  const legal: FooterMenuSettings['legal'] = []
  if (Array.isArray(legalRaw)) {
    for (const row of legalRaw) {
      legal.push(normLink(row))
    }
  }

  return {
    columns,
    legal: legal.length > 0 ? legal : [...def.legal],
    hideFooterGlobally: inner.hideFooterGlobally === true || inner.hide_footer_globally === true,
    hideFooterPaths: normalizeFooterHidePaths(inner.hideFooterPaths ?? inner.hide_footer_paths),
  }
}

function normalizeFooterHidePaths(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  const out: string[] = []
  for (const p of raw) {
    if (typeof p !== 'string') {
      continue
    }
    const t = p.trim()
    if (!t) {
      continue
    }
    out.push(t.startsWith('/') ? t : `/${t}`)
  }
  return [...new Set(out)]
}
