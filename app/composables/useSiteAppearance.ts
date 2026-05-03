import type { SiteAppearanceSettings } from '~/types'
import { normalizeAppearanceSettingsPayload } from '~/utils/normalizeAppearanceSettingsPayload'

/**
 * Глобальная тема публичного сайта (Marin / Golden Sepia): загрузка и класс на `<body>` для SSR/CSR.
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

  return {
    settings,
    refresh,
  }
}
