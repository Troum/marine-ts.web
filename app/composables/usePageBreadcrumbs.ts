/**
 * Хлебные крошки с учётом локали: первая — «Главная», далее пары label + путь.
 */
export function usePageBreadcrumbs() {
  const { t } = useI18n()
  const localePath = useLocalePath()

  function breadcrumbs(...segments: { label: string; to?: string }[]) {
    const items = [{ label: t('nav.home'), to: localePath('/') }]
    for (const s of segments) {
      items.push({
        label: s.label,
        to: s.to !== undefined ? localePath(s.to) : undefined,
      })
    }
    return items
  }

  return { breadcrumbs, localePath, t }
}
