import { normalizeAppearanceSettingsPayload } from '~/utils/normalizeAppearanceSettingsPayload'
import { routePathToSiteSectionKey } from '~/utils/siteSectionRoutes'

/**
 * Скрытые в админке «Разделы сайта» (`appearance.hiddenSections`) маршруты для посетителей → 404.
 * Совпадает с описанием на /admin/sections.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const p = to.path
  if (p.includes('/admin') || p.includes('/__nuxt')) {
    return
  }

  const { data } = await useAsyncData(
    'site-appearance',
    async () => {
      const api = useMarineApi()
      try {
        return await api.appearanceSettings.get()
      } catch {
        return null
      }
    },
    { server: true, default: () => null },
  )

  const settings = normalizeAppearanceSettingsPayload(data.value)

  const key = routePathToSiteSectionKey(p)
  if (key && settings.hiddenSections[key] === true) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
})
