import tailwindcss from '@tailwindcss/vite'

const defaultApiOrigin = import.meta.env.NUXT_API_ORIGIN ?? 'http://marine-ts.test'
const isDev = import.meta.env.NODE_ENV !== 'production'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  features: {
    inlineStyles: false,
  },
  css: ['~/assets/css/main.css'],
  srcDir: 'app',
  routeRules: {
    '/ru': { redirect: { to: '/', statusCode: 301 } },
    '/ru/': { redirect: { to: '/', statusCode: 301 } },
    '/ru/o-nas': { redirect: { to: '/about', statusCode: 301 } },
    '/ru/nashi-raboty': { redirect: { to: '/projects', statusCode: 301 } },
    '/ru/sudovoj-menedzhment': { redirect: { to: '/ship-management', statusCode: 301 } },
    '/ru/sudoremont': { redirect: { to: '/ship-repair', statusCode: 301 } },
    '/services': { redirect: { to: '/ship-repair', statusCode: 301 } },
    '/en/services': { redirect: { to: '/en/ship-repair', statusCode: 301 } },
    '/ru/inzheneriya': { redirect: { to: '/inzheneriya', statusCode: 301 } },
    '/ru/obespechenie-zapasnymi-chastyami-i-uslugi-po-zakupkam': {
      redirect: { to: '/obespechenie-zapasnymi-chastyami-i-uslugi-po-zakupkam', statusCode: 301 },
    },
    '/ru/karera': { redirect: { to: '/vacancies', statusCode: 301 } },
    '/ru/kontakty': { redirect: { to: '/contacts', statusCode: 301 } },
    '/ru/glavnye-i-vspomogatelnye-dvigateli': {
      redirect: { to: '/glavnye-i-vspomogatelnye-dvigateli', statusCode: 301 },
    },
    '/ru/elektrooborudovanie-i-avtomatika': {
      redirect: { to: '/elektrooborudovanie-i-avtomatika', statusCode: 301 },
    },
    '/ru/truboprovodnye-sistemy': {
      redirect: { to: '/truboprovodnye-sistemy', statusCode: 301 },
    },
    '/ru/bwts': { redirect: { to: '/bwts', statusCode: 301 } },
    '/ru/tehnicheskoe-obsluzhivanie': {
      redirect: { to: '/tehnicheskoe-obsluzhivanie', statusCode: 301 },
    },
  },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    baseUrl: import.meta.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
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
    apiBaseServer:
      import.meta.env.NUXT_API_BASE_SERVER
      ?? import.meta.env.NUXT_PUBLIC_API_BASE
      ?? `${defaultApiOrigin}/api`,
    public: {
      apiBase:
        import.meta.env.NUXT_PUBLIC_API_BASE ?? (isDev ? '/api' : `${defaultApiOrigin}/api`),
      siteUrl: import.meta.env.NUXT_PUBLIC_SITE_URL ?? '',
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
