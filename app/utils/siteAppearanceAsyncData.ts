import { useMarineApi } from '~/composables/useMarineApi'

/**
 * Общий handler для `useAsyncData('site-appearance', …)` — одна ссылка на функцию,
 * иначе Nuxt предупреждает о «different handler» при вызове из composable и middleware.
 */
export async function fetchSiteAppearanceForAsyncData() {
  const api = useMarineApi()
  try {
    return await api.appearanceSettings.get()
  } catch {
    return null
  }
}

export const siteAppearanceAsyncDataOptions = {
  server: true as const,
  default: () => null,
}
