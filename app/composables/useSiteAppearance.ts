import type { SiteAppearanceSettings } from '~/types'
import {
  fetchSiteAppearanceForAsyncData,
  siteAppearanceAsyncDataOptions,
} from '~/utils/siteAppearanceAsyncData'
import { normalizeAppearanceSettingsPayload } from '~/utils/normalizeAppearanceSettingsPayload'

/**
 * Глобальная тема публичного сайта: Marin (тёмный navy + красные акценты) или Golden Sepia
 * (та же база в CSS, золотые `--color-primary` / `mts-accent*`). Класс `mts-theme-scglobal` на `<body>`.
 * Настройки внешнего вида (в т.ч. `hiddenSections` для админки «Разделы сайта») подгружаются с API.
 * Админка (`admin-shell` на body) не затрагивается.
 */
export function useSiteAppearance() {
  const { data, refresh } = useAsyncData(
    'site-appearance',
    fetchSiteAppearanceForAsyncData,
    siteAppearanceAsyncDataOptions,
  )

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
