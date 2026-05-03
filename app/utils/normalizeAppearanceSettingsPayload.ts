import type { SiteAppearanceSettings, SitePublicThemeId } from '~/types'

function unwrapAppearancePayload(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return null
  }
  let cur: unknown = json
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) {
      return null
    }
    const o = cur as Record<string, unknown>
    if (typeof o.theme === 'string') {
      return o
    }
    const next = o.data
    if (next && typeof next === 'object' && !Array.isArray(next)) {
      cur = next
      continue
    }
    return null
  }
  return null
}

function normTheme(raw: unknown): SitePublicThemeId {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (s === 'scglobal' || s === 'sepia') {
    return 'scglobal'
  }
  return 'default'
}

export function normalizeAppearanceSettingsPayload(json: unknown): SiteAppearanceSettings {
  const inner = unwrapAppearancePayload(json)
  return { theme: normTheme(inner?.theme) }
}
