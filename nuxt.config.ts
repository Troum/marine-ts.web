import tailwindcss from '@tailwindcss/vite'
import { legacyRouteRules } from './config/legacyRouteRules'

const isDev = import.meta.env.NODE_ENV !== 'production'

/** Публичный URL фронта (i18n baseUrl, canonical, SEO). */
const siteUrl = (import.meta.env.NUXT_PUBLIC_SITE_URL ?? '').trim()

/**
 * Базовый URL API с суффиксом /api (браузер и SSR).
 * Прод: https://api.marin-ts.com/api
 */
const publicApiBase = (import.meta.env.NUXT_PUBLIC_API_BASE ?? '').trim().replace(/\/+$/, '')
const serverApiBase = (import.meta.env.NUXT_API_BASE_SERVER ?? '').trim().replace(/\/+$/, '') || publicApiBase

/**
 * Только dev: origin Laravel для Vite proxy (/api → origin/api).
 * Не путать с NUXT_PUBLIC_SITE_URL — это бэкенд, не marin-ts.com.
 */
const devApiOrigin = (import.meta.env.NUXT_API_ORIGIN ?? 'http://marine-ts.test').trim().replace(/\/+$/, '')

const yandexMetrikaId = (import.meta.env.NUXT_PUBLIC_YANDEX_METRIKA_ID ?? '').trim()

const modules: string[] = ['@nuxtjs/i18n']
if (yandexMetrikaId) {
  modules.push('nuxt-yandex-metrika')
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: isDev },
  features: {
    inlineStyles: false,
  },
  css: ['~/assets/css/main.css'],
  srcDir: 'app',
  routeRules: legacyRouteRules,
  modules,
  ...(yandexMetrikaId
    ? {
        yandexMetrika: {
          id: yandexMetrikaId,
          debug: isDev,
          options: {
            defer: false,
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true,
          },
        },
      }
    : {}),
  hooks: {
    ready(nuxt) {
      nuxt.options.plugins = nuxt.options.plugins.filter((plugin) => {
        const src = typeof plugin === 'string' ? plugin : (plugin?.src ?? '')
        if (String(src).includes('yandex-metrika.client')) {
          return Boolean(yandexMetrikaId)
        }
        if (!yandexMetrikaId) {
          return true
        }
        return !String(src).includes('nuxt-yandex-metrika/dist/runtime/plugin')
      })
    },
  },
  i18n: {
    baseUrl: siteUrl || (isDev ? 'http://localhost:3000' : 'https://marin-ts.com'),
    langDir: 'locales',
    locales: [
      { code: 'ru', language: 'ru-RU', file: 'ru.json' },
      { code: 'en', language: 'en-US', file: 'en.json' },
    ],
    defaultLocale: 'ru',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },
  vite: {
    build: {
      cssCodeSplit: false,
    },
    plugins: [tailwindcss()],
    server: isDev
      ? {
          proxy: {
            '/api': {
              target: devApiOrigin,
              changeOrigin: true,
            },
          },
        }
      : undefined,
  },
  runtimeConfig: {
    /** SSR: полный URL API (NUXT_API_BASE_SERVER). */
    apiBaseServer: serverApiBase || (isDev ? `${devApiOrigin}/api` : ''),
    public: {
      /** Клиент: полный URL API в проде или /api через Vite proxy в dev. */
      apiBase: publicApiBase || (isDev ? '/api' : ''),
      siteUrl: siteUrl || (isDev ? 'http://localhost:3000' : 'https://marin-ts.com'),
      analyticsGtagId: import.meta.env.NUXT_PUBLIC_ANALYTICS_GTAG_ID ?? '',
      analyticsPlausibleDomain: import.meta.env.NUXT_PUBLIC_ANALYTICS_PLAUSIBLE_DOMAIN ?? '',
      mapboxToken:
        import.meta.env.NUXT_PUBLIC_MAPBOX_TOKEN
        ?? 'pk.eyJ1IjoidHJvdW0iLCJhIjoiY2tlZWdvMWVoMTJiYzJ6bWkzbWp4NmR4ZSJ9.GUTHIgv8DFR8rwZ2WzsjhA',
      yandexMapsApiKey: import.meta.env.NUXT_PUBLIC_YANDEX_MAPS_API_KEY ?? '',
      adminHiddenSections: (import.meta.env.NUXT_PUBLIC_ADMIN_HIDDEN_SECTIONS ?? '')
        .split(',')
        .map((s) => s.trim().toLowerCase().replace(/-/g, '_'))
        .filter(Boolean),
    },
  },
  app: {
    head: {
      title: 'Marine Technical Solutions',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/favicon.ico' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500&display=swap',
        },
      ],
    },
  },
})
