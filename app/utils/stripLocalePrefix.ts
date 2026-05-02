/** Убирает префикс локали `/en` из пути маршрута Nuxt i18n (`prefix_except_default`). */
export function stripLocalePrefix(path: string): string {
  const p = path || '/'
  if (p === '/en') {
    return '/'
  }
  if (p.startsWith('/en/')) {
    return p.slice(4) || '/'
  }
  return p
}
