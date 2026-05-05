import type { SiteAppearanceSettings, SiteSectionKey } from '~/types'
import { normalizeAppearanceSettingsPayload } from '~/utils/normalizeAppearanceSettingsPayload'

/**
 * Глобальная тема публичного сайта: Marin (тёмный navy + красные акценты) или Golden Sepia
 * (та же база в CSS, золотые `--color-primary` / `mts-accent*`). Класс `mts-theme-scglobal` на `<body>`.
 * Также хранит `hiddenSections` — разделы, скрытые администратором (отдают 404).
 * Админка (`admin-shell` на body) не затрагивается.
 */
export function useSiteAppearance() {
  const api = useMarineApi()

  const { data, refresh } = useAsyncData('site-appearance', async () => {
    try {
      return await api.appearanceSettings.get()
    } catch {
      return null
    }
  }, { server: true, default: () => null })

  const settings = computed<SiteAppearanceSettings>(() =>
    data.value ?? normalizeAppearanceSettingsPayload(null),
  )

  const bodyThemeClass = computed(() =>
    settings.value.theme === 'scglobal' ? 'mts-theme-scglobal' : '',
  )

  useHead({
    bodyAttrs: {
      class: bodyThemeClass,
    },
  })

  function isSectionHidden(key: SiteSectionKey): boolean {
    return settings.value.hiddenSections[key] === true
  }

  return {
    settings,
    refresh,
    isSectionHidden,
  }
}
