import type { SiteSectionKey } from '~/types'
import { stripLocalePrefix } from '~/utils/stripLocalePrefix'

const ROUTE_PREFIXES: { prefix: string; key: SiteSectionKey }[] = [
  { prefix: '/about', key: 'about' },
  { prefix: '/ship-repair', key: 'services' },
  { prefix: '/ship-management', key: 'ship_management' },
  { prefix: '/crewing-management', key: 'crewing_management' },
  { prefix: '/lnk', key: 'lnk' },
  { prefix: '/contacts', key: 'contacts' },
  { prefix: '/gallery', key: 'gallery' },
  { prefix: '/projects', key: 'projects' },
  { prefix: '/news', key: 'news' },
  { prefix: '/vacancies', key: 'vacancies' },
]

/** Соответствие пути страницы (с учётом `/en`) ключу раздела из appearance.hiddenSections. */
export function routePathToSiteSectionKey(path: string): SiteSectionKey | null {
  const p = stripLocalePrefix(path).replace(/\/$/, '') || '/'
  if (p === '/') {
    return null
  }
  for (const { prefix, key } of ROUTE_PREFIXES) {
    if (p === prefix || p.startsWith(`${prefix}/`)) {
      return key
    }
  }
  return null
}
