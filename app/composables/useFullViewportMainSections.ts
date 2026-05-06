/**
 * Секции на высоту первого экрана (`mts-hero-min-h` / `mts-main--full-viewport-sections` в main.css):
 * главная, «О компании», маркетинг крюинга и судового менеджмента (включая дочерние slug).
 */
export function isFullViewportSectionsPath(path: string): boolean {
  const normalized = path.replace(/\/+$/, '') || '/'
  if (normalized === '/' || normalized === '/en') {
    return true
  }
  if (normalized === '/about' || normalized === '/en/about') {
    return true
  }
  if (
    normalized.startsWith('/crewing-management')
    || normalized.startsWith('/en/crewing-management')
  ) {
    return true
  }
  if (
    normalized.startsWith('/ship-management')
    || normalized.startsWith('/en/ship-management')
  ) {
    return true
  }
  if (
    normalized.startsWith('/lnk')
    || normalized.startsWith('/en/lnk')
  ) {
    return true
  }
  return false
}

export function useFullViewportMainSections() {
  const route = useRoute()
  return computed(() => isFullViewportSectionsPath(route.path))
}
