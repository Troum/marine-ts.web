import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'

/**
 * Человекочитаемые подписи для маршрутов, которые совпадают с файлами в `pages/`.
 * Остальные подписываются как «Маршрут …».
 */
const ROUTE_LABELS_RU: Record<string, string> = {
  '/': 'Главная',
  '/about': 'О компании',
  '/contacts': 'Контакты',
  '/request': 'Заявка',
  '/services': 'Судоремонт',
  '/projects': 'Проекты',
  '/gallery': 'Галерея',
  '/news': 'Новости',
  '/vacancies': 'Вакансии',
  '/privacy': 'Политика конфиденциальности',
  '/terms': 'Условия использования',
  '/ship-management': 'Судовой менеджмент',
  '/crewing-management': 'Крюинг-менеджмент',
  '/application-form': 'Форма заявки',
}

function extractPagesRelativePath(globKey: string): string | null {
  const k = globKey.replace(/\\/g, '/')
  const m = k.match(/\/pages\/(.+)\.vue$/i)
  return m?.[1] ?? null
}

/**
 * Согласовано с file-based routing Nuxt: `index.vue` → `/`, `news/[slug].vue` → `/news/:slug`.
 * Возвращает `null` для admin и для путей только с динамическими сегментами (их даёт API по slug).
 */
export function vueFileRelativeToStaticRoute(rel: string): string | null {
  if (rel.startsWith('admin')) {
    return null
  }
  const parts = rel.replace(/\\/g, '/').split('/').filter(Boolean)
  while (parts.length > 0 && parts[parts.length - 1] === 'index') {
    parts.pop()
  }
  if (parts.length === 0) {
    return '/'
  }
  const pathSegments: string[] = []
  for (const seg of parts) {
    if (/^\[[^\]]+]$/.test(seg)) {
      return null
    }
    pathSegments.push(seg)
  }
  return `/${pathSegments.join('/')}`
}

function labelForStaticRoute(path: string): string {
  const name = ROUTE_LABELS_RU[path] ?? `Маршрут ${path}`
  return `${name} — ${path}`
}

/**
 * Статические URL из каталога pages (import.meta.glob перечисляет .vue на этапе сборки).
 * Динамические страницы ([slug].vue и т.п.) не попадают в список — для них по-прежнему нужны slug из API.
 */
export function adminSelectOptionsFromPages(): AdminSelectOption[] {
  const modules = import.meta.glob('../pages/**/*.vue', { eager: false })
  const routes = new Set<string>()

  for (const key of Object.keys(modules)) {
    const rel = extractPagesRelativePath(key)
    if (!rel) {
      continue
    }
    const path = vueFileRelativeToStaticRoute(rel)
    if (path !== null) {
      routes.add(path)
    }
  }

  return [...routes]
    .sort((a, b) => {
      if (a === '/') {
        return -1
      }
      if (b === '/') {
        return 1
      }
      return a.localeCompare(b, undefined, { sensitivity: 'base' })
    })
    .map((path) => ({ value: path, label: labelForStaticRoute(path) }))
}
