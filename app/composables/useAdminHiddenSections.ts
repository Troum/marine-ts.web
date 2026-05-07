/**
 * Скрытие карточек и пунктов дашборда админки по `NUXT_PUBLIC_ADMIN_HIDDEN_SECTIONS`.
 * Никак не влияет на публичный сайт.
 *
 * Ключи (через запятую, регистр не важен, дефисы в путях можно):
 *   application_forms, vacancies, news, gallery, projects, about, services,
 *   ship_management, crewing_management, lnk, contacts, home,
 *   inquiries, feedback, section_editor, content_pages, sections_panel,
 *   appearance, navigation, footer_navigation, users, seo
 */
export function useAdminHiddenSections() {
  const runtimeConfig = useRuntimeConfig()

  const hiddenKeys = computed(() => {
    /**
     * В nuxt.config задано `adminHiddenSections` как массив, но переменная окружения
     * `NUXT_PUBLIC_ADMIN_HIDDEN_SECTIONS` подменяет значение **строкой** — тогда
     * прежняя проверка `Array.isArray` давала пустой Set и ничего не скрывалось.
     */
    const raw = runtimeConfig.public.adminHiddenSections
    const parts: string[] = []
    if (Array.isArray(raw)) {
      for (const k of raw) {
        if (typeof k === 'string' && k.trim()) {
          parts.push(k.trim().toLowerCase().replace(/-/g, '_'))
        }
      }
    } else if (typeof raw === 'string' && raw.trim()) {
      for (const piece of raw.split(',')) {
        const n = piece.trim().toLowerCase().replace(/-/g, '_')
        if (n) {
          parts.push(n)
        }
      }
    }
    return new Set(parts)
  })

  function isAdminSectionHidden(key: string): boolean {
    const n = key.trim().toLowerCase().replace(/-/g, '_')
    return n !== '' && hiddenKeys.value.has(n)
  }

  return {
    isAdminSectionHidden,
  }
}
