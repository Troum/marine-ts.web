import {
  fetchSiteAppearanceForAsyncData,
  siteAppearanceAsyncDataOptions,
} from '~/utils/siteAppearanceAsyncData'
import { normalizeAppearanceSettingsPayload } from '~/utils/normalizeAppearanceSettingsPayload'
import { routePathToSiteSectionKey } from '~/utils/siteSectionRoutes'

/**
 * Скрытые в админке «Разделы сайта» (`appearance.hiddenSections`) маршруты для посетителей → 404.
 * Совпадает с описанием на /admin/sections.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const requestPath = import.meta.server ? useRequestURL().pathname : to.path
  if (requestPath.includes('/admin') || requestPath.includes('/__nuxt')) {
    return
  }

  const { data } = await useAsyncData(
    'site-appearance',
    fetchSiteAppearanceForAsyncData,
    siteAppearanceAsyncDataOptions,
  )

  const settings = normalizeAppearanceSettingsPayload(data.value)

  const key = routePathToSiteSectionKey(requestPath)
  if (key && settings.hiddenSections[key] === true) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
})
