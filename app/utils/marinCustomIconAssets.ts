/**
 * Сырые SVG из assets/icons/marin-custom (иконки бренда / экспорт с рабочего стола).
 * Ключ — slug файла без .svg.
 */
const rawModules = import.meta.glob<string>('~/assets/icons/marin-custom/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function pathToSlug(path: string): string {
  const base = path.split('/').pop() ?? ''
  return base.replace(/\.svg$/i, '')
}

export const marinCustomSvgBySlug: Record<string, string> = {}

for (const path of Object.keys(rawModules)) {
  const slug = pathToSlug(path)
  marinCustomSvgBySlug[slug] = rawModules[path] as string
}

export const marinCustomIconSlugs = Object.keys(marinCustomSvgBySlug).sort((a, b) =>
  a.localeCompare(b),
)
