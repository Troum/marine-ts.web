import type { ContentPageContentableType } from '~/types'

/**
 * Публичный URL для пункта меню по slug и типу контентной страницы.
 * Должен совпадать с тем, как страницы открываются в `app/pages`.
 */
export function contentPageSlugToPublicPath(
  slug: string,
  contentableType: ContentPageContentableType | null | undefined,
): string {
  const special: Record<string, string> = {
    home: '/',
    'services-page': '/ship-repair',
    'projects-page': '/projects',
    'vacancies-page': '/vacancies',
    'gallery-page': '/gallery',
    'news-page': '/news',
    'contacts-page': '/contacts',
  }
  if (special[slug] !== undefined) {
    return special[slug]!
  }
  if (contentableType === 'service') {
    return `/${slug}`
  }
  if (contentableType === 'project') {
    return `/projects/${slug}`
  }
  return `/${slug}`
}

/** Нормализация для сравнения с опциями быстрого выбора. */
export function normalizeInternalNavPath(raw: string): string {
  const t = raw.trim()
  if (!t || t === '/') {
    return '/'
  }
  if (t === '#') {
    return '#'
  }
  if (/^https?:\/\//i.test(t)) {
    return t
  }
  return t.startsWith('/') ? t : `/${t}`
}
