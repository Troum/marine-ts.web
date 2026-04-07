import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  srcDir: 'app',
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    /** SSR в Docker: `http://api:8000/api` (см. docker-compose). Браузер использует `public.apiBase`. */
    apiBaseServer: '',
    public: {
      apiBase: import.meta.env.NUXT_PUBLIC_API_BASE ?? 'http://marine-ts.test/api',
      /** Google Analytics 4 — измерение G-XXXXXXXX (если задано, Plausible не подключается) */
      analyticsGtagId: import.meta.env.NUXT_PUBLIC_ANALYTICS_GTAG_ID ?? '',
      /** Домен для Plausible (например marine-ts.com), без https */
      analyticsPlausibleDomain: import.meta.env.NUXT_PUBLIC_ANALYTICS_PLAUSIBLE_DOMAIN ?? '',
    },
  },
  app: {
    head: {
      title: 'Marine Technical Solutions',
      htmlAttrs: { lang: 'ru' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/favicon.ico' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Manrope:wght@300;400;500;600;700&family=Oranienbaum&family=Space+Grotesk:wght@400;500&display=swap',
        },
      ],
    },
  },
})
