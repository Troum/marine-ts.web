import type { NavigationMenuSettings } from '~/types'

/**
 * Разбирает ответ GET `/navigation-settings`: Laravel JsonResource даёт `{ data: { main, more } }`,
 * при прямом JSON возможен и корень `{ main, more }`.
 */
export function normalizeNavigationSettingsPayload(json: unknown): NavigationMenuSettings {
  if (!json || typeof json !== 'object') {
    return { main: [], more: [] }
  }
  const root = json as Record<string, unknown>
  const inner =
    root.data !== undefined && root.data !== null && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root
  return {
    main: Array.isArray(inner.main) ? inner.main : [],
    more: Array.isArray(inner.more) ? inner.more : [],
  }
}
