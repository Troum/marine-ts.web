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

/** Ответ GET `/footer-navigation-settings` (Laravel JsonResource: `{ data: … }` или корень). */
export function normalizeFooterMenuSettingsPayload(json: unknown): FooterMenuSettings {
  const def = emptyFooterMenuSettings()
  if (!json || typeof json !== 'object') {
    return def
  }
  const root = json as Record<string, unknown>
  const inner =
    root.data !== undefined && root.data !== null && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root

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
  }
}
