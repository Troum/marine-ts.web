import tailwindcss from '@tailwindcss/vite'

/** Бэкенд Laravel (без завершающего слэша). Для dev-прокси и SSR по умолчанию. */
const defaultApiOrigin = import.meta.env.NUXT_API_ORIGIN ?? 'http://marine-ts.test'

const isDev = import.meta.env.NODE_ENV !== 'production'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  srcDir: 'app',
  modules: ['@nuxtjs/i18n'],
  i18n: {
    /** Нужен для hreflang / SEO в useLocaleHead (иначе предупреждение в консоли). */
    baseUrl: import.meta.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    lazy: true,
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
    plugins: [tailwindcss()],
    server: {
      proxy: isDev
        ? {
            '/api': {
              target: defaultApiOrigin,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  },
  runtimeConfig: {
    /**
     * SSR / серверные запросы: абсолютный URL API (обход относительного `public.apiBase` в dev).
     * В Docker: например `http://api:8000/api`.
     */
    apiBaseServer: process.env.NUXT_API_BASE_SERVER ?? `${defaultApiOrigin}/api`,
    public: {
      /**
       * В dev по умолчанию `/api` — тот же origin, что и Nuxt (Vite proxy → Laravel), без CORS.
       * В production задайте `NUXT_PUBLIC_API_BASE` (полный URL с `/api`).
       */
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ?? (isDev ? '/api' : `${defaultApiOrigin}/api`),
      /** Google Analytics 4 — измерение G-XXXXXXXX (если задано, Plausible не подключается) */
      analyticsGtagId: import.meta.env.NUXT_PUBLIC_ANALYTICS_GTAG_ID ?? '',
      /** Домен для Plausible (например marine-ts.com), без https */
      analyticsPlausibleDomain: import.meta.env.NUXT_PUBLIC_ANALYTICS_PLAUSIBLE_DOMAIN ?? '',
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
