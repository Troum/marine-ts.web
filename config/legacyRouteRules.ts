import type { NuxtConfig } from 'nuxt/schema'

/** 301 со старого сайта — см. deploy/nginx/legacy-redirects.map */
export const legacyRouteRules: NuxtConfig['routeRules'] = {
  '/ru': { redirect: { to: '/', statusCode: 301 } },
  '/ru/': { redirect: { to: '/', statusCode: 301 } },
  '/ru/o-nas': { redirect: { to: '/about', statusCode: 301 } },
  '/ru/nashi-raboty': { redirect: { to: '/about', statusCode: 301 } },
  '/ru/sudovoj-menedzhment': { redirect: { to: '/ship-management', statusCode: 301 } },
  '/ru/sudoremont': { redirect: { to: '/ship-repair', statusCode: 301 } },
  '/ru/inzheneriya': { redirect: { to: '/engineering', statusCode: 301 } },
  '/ru/obespechenie-zapasnymi-chastyami-i-uslugi-po-zakupkam': {
    redirect: { to: '/spare-parts-supply-and-procurement-services', statusCode: 301 },
  },
  '/ru/karera': { redirect: { to: '/crewing-management', statusCode: 301 } },
  '/ru/kontakty': { redirect: { to: '/contacts', statusCode: 301 } },
  '/ru/remont-sudovih-dvigateley': { redirect: { to: '/ship-repair', statusCode: 301 } },
  '/ru/remont-sudovogo-elektrooborudovaniya': { redirect: { to: '/ship-repair', statusCode: 301 } },
  '/ru/truboprovodnye-raboty': { redirect: { to: '/ship-repair', statusCode: 301 } },
  '/ru/ustanovka-sistem-ochistki-ballastnykh-vod': { redirect: { to: '/ship-repair', statusCode: 301 } },
  '/ru/politika-konfidentsialnosti': { redirect: { to: '/privacy', statusCode: 301 } },
  '/ru/vypolnennye-proekty': { redirect: { to: '/about', statusCode: 301 } },
  '/ru/vypolnennye-proekty/stroitelstvo-sektsij-dlya-morskikh-kruiznykh-lajnerov': {
    redirect: { to: '/engineering', statusCode: 301 },
  },
  '/ru/vypolnennye-proekty/ustanovka-sistemy-bwts': { redirect: { to: '/ship-repair', statusCode: 301 } },
  '/ru/palubnie-raboti': { redirect: { to: '/ship-repair', statusCode: 301 } },
  '/ru/tehnicheskoe-obsluzhivanie': { redirect: { to: '/ship-repair', statusCode: 301 } },
  '/en/about-us': { redirect: { to: '/en/about', statusCode: 301 } },
  '/en/career': { redirect: { to: '/en/crewing-management', statusCode: 301 } },
  '/en/contact-us': { redirect: { to: '/en/contacts', statusCode: 301 } },
  '/en/pipeline': { redirect: { to: '/en/ship-repair', statusCode: 301 } },
  '/en/provision-of-spare-parts-and-procurement-services': {
    redirect: { to: '/en/spare-parts-supply-and-procurement-services', statusCode: 301 },
  },
  '/en/completed-projects': { redirect: { to: '/en/about', statusCode: 301 } },
  '/en/completed-projects/bwts-installation': { redirect: { to: '/en/ship-repair', statusCode: 301 } },
  '/en/completed-projects/deck-works': { redirect: { to: '/en/ship-repair', statusCode: 301 } },
  '/en/completed-projects/installation-of-the-platform-varandey-crane': {
    redirect: { to: '/en/ship-repair', statusCode: 301 },
  },
  '/en/installation-of-ballast-water-treatment-systems': {
    redirect: { to: '/en/ship-repair', statusCode: 301 },
  },
  '/index.php/en/kontakty': { redirect: { to: '/en/contacts', statusCode: 301 } },
  '/index.php/en/karera': { redirect: { to: '/en/crewing-management', statusCode: 301 } },
  '/index.php/en/sudoremont': { redirect: { to: '/en/ship-repair', statusCode: 301 } },
  '/services': { redirect: { to: '/ship-repair', statusCode: 301 } },
  '/en/services': { redirect: { to: '/en/ship-repair', statusCode: 301 } },
}
