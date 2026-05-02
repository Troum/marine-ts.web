<script setup lang="ts">
import { ArrowRight, ChevronDown, ExternalLink } from 'lucide-vue-next'
import type {
  MainNavMenuFontSize,
  MainNavMenuFontWeight,
  MainNavMenuJustify,
  MainNavMenuTextCase,
  NavigationBurgerOffice,
  NavigationBurgerSocial,
  NavigationMenuItem,
} from '~/types'
import { stripHtmlToPlain } from '~/utils/adminHtmlField'
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'
import { emptyNavigationSettings } from '~/utils/emptyNavigationSettings'
import { sanitizeRichContentHtml } from '~/composables/useMarkdownSafeHtml'
import { stripLocalePrefix } from '~/utils/stripLocalePrefix'

const route = useRoute()
const localePath = useLocalePath()
const { locale } = useI18n()
const api = useMarineApi()

const { data: navigationRemote, refresh: refreshNavigation } = await useAsyncData(
  'site-navigation',
  async () => {
    try {
      return await api.navigationSettings.get()
    } catch {
      return null
    }
  },
)

onMounted(async () => {
  if (navigationRemote.value == null) {
    await refreshNavigation()
  }
})

const fallbackItems = computed<NavigationMenuItem[]>(() => [
  { path: '/', label: { ru: 'Главная', en: 'Home' } },
  { path: '/about', label: { ru: 'О компании', en: 'About' } },
  { path: '/services', label: { ru: 'Судоремонт', en: 'Ship Repair' } },
  { path: '/projects', label: { ru: 'Проекты', en: 'Projects' } },
  { path: '/ship-management', label: { ru: 'Судовой менеджмент', en: 'Ship management' } },
  { path: '/crewing-management', label: { ru: 'Крюинг-менеджмент', en: 'Crewing management' } },
  { path: '/vacancies', label: { ru: 'Вакансии', en: 'Vacancies' } },
  { path: '/contacts', label: { ru: 'Контакты', en: 'Contacts' } },
])

const menu = computed(() => navigationRemote.value ?? emptyNavigationSettings())

/** HTML из админки (TipTap / вставка тегов): безопасный вывод в v-html. */
function burgerContactRichHtml(raw: string | undefined | null): string {
  const t = raw?.trim()
  if (!t) {
    return ''
  }
  return sanitizeRichContentHtml(t)
}

/** Для `tel:` / `mailto:`: берём видимый текст из HTML TipTap. */
function burgerContactPlainOneLine(raw: string): string {
  return stripHtmlToPlain(raw).replace(/\s+/g, ' ').trim()
}

function burgerContactTelHref(phoneHtml: string): string {
  const plain = burgerContactPlainOneLine(phoneHtml)
  const digits = plain.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : '#'
}

function burgerContactMailtoHref(emailHtml: string): string {
  const plain = burgerContactPlainOneLine(emailHtml)
  return plain ? `mailto:${plain}` : '#'
}

const bcOverlay = computed(() => menu.value.burgerContacts)

const burgerOverlayPhones = computed(() => {
  const p = bcOverlay.value?.phones
  return p?.map(s => s.trim()).filter(Boolean) ?? []
})

const burgerOverlayEmails = computed(() => {
  const c = bcOverlay.value
  if (c?.emails?.length) {
    return c.emails.map(e => e.trim()).filter(Boolean)
  }
  if (c?.email?.trim()) {
    return [c.email.trim()]
  }
  return []
})

const burgerOverlaySocials = computed((): NavigationBurgerSocial[] => {
  const c = bcOverlay.value
  if (c?.socials?.length) {
    return c.socials.filter(s => s.url.trim())
  }
  if (c?.socialUrl?.trim()) {
    const url = c.socialUrl.trim()
    const label = c.socialLabel?.trim() || url
    return [{ url, label }]
  }
  return []
})

const burgerOverlayOfficesHeading = computed(() => {
  const c = bcOverlay.value
  if (c?.officesColumnTitle?.trim()) {
    return c.officesColumnTitle.trim()
  }
  if (c?.officeTitle?.trim() && !c?.offices?.length) {
    return c.officeTitle.trim()
  }
  return ''
})

const burgerOverlayOffices = computed((): NavigationBurgerOffice[] => {
  const c = bcOverlay.value
  if (c?.offices?.length) {
    return c.offices.filter(o => o.address.trim())
  }
  if (c?.officeAddress?.trim()) {
    return [{ address: c.officeAddress.trim() }]
  }
  return []
})

const burgerPhoneColVisible = computed(() => {
  const c = bcOverlay.value
  return burgerOverlayPhones.value.length > 0 || !!c?.phonesTitle?.trim()
})

const burgerEmailColVisible = computed(() => {
  const c = bcOverlay.value
  return (
    burgerOverlayEmails.value.length > 0 ||
    burgerOverlaySocials.value.length > 0 ||
    !!c?.emailTitle?.trim()
  )
})

const burgerOfficeColVisible = computed(() => {
  return burgerOverlayOffices.value.length > 0 || !!burgerOverlayOfficesHeading.value
})

const burgerOverlaySectionVisible = computed(
  () => burgerPhoneColVisible.value || burgerEmailColVisible.value || burgerOfficeColVisible.value,
)

const menuItems = computed(() => {
  if (menu.value.more.length) {
    return fallbackItems.value
  }
  const saved = [...menu.value.main, ...menu.value.more]
  return saved.length ? saved : fallbackItems.value
})

const horizMenuItems = computed(() => {
  const hi = menu.value.horizItems
  if (hi && hi.length > 0) {
    return hi
  }
  return menuItems.value
})

const menuVariant = computed(() => menu.value.menuVariant ?? 'overlay')
const menuFontSize = computed<MainNavMenuFontSize>(() => menu.value.menuFontSize ?? 'base')
const menuFontWeight = computed<MainNavMenuFontWeight>(() => menu.value.menuFontWeight ?? 'medium')
const menuTextCase = computed<MainNavMenuTextCase>(() => menu.value.menuTextCase ?? 'none')
const menuJustify = computed<MainNavMenuJustify>(() => menu.value.menuJustify ?? 'between')

const horizSizeClass = computed(() => {
  const m: Record<MainNavMenuFontSize, string> = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  }
  return m[menuFontSize.value] ?? 'text-base'
})

const horizWeightClass = computed(() => {
  const m: Record<MainNavMenuFontWeight, string> = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }
  return m[menuFontWeight.value] ?? 'font-medium'
})

const horizCaseClass = computed(() => {
  const m: Record<MainNavMenuTextCase, string> = {
    none: '',
    lowercase: 'lowercase',
    uppercase: 'uppercase',
    capitalize: 'capitalize',
  }
  return m[menuTextCase.value] ?? ''
})

const horizJustifyClass = computed(() =>
  menuJustify.value === 'center' ? 'justify-center' : 'justify-between',
)

const navColorVars = computed(() => {
  const hover = menu.value.menuItemHoverColor
  if (!hover) return {}
  return { '--mts-nav-item-hover-color': hover }
})

/**
 * Определяет, прокрутил ли пользователь страницу вниз.
 * При прокрутке nav получает непрозрачный фон и тёмный текст;
 * в самом верху — прозрачный фон и белый текст (на тёмном hero).
 */
const scrollY = ref(0)
if (import.meta.client) {
  onMounted(() => {
    const onScroll = () => { scrollY.value = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })
    onUnmounted(() => window.removeEventListener('scroll', onScroll))
  })
}
const isScrolled = computed(() => scrollY.value > 40)

const hasCustomHoverColor = computed(() => !!menu.value.menuItemHoverColor)

const isHomePage = computed(() => stripLocalePrefix(route.path) === '/')

const horizLinkClasses = computed(() => {
  const colorClasses = isScrolled.value
    ? 'text-body hover:text-primary'
    : 'text-white/90 hover:text-white'
  return [
    horizSizeClass.value,
    horizWeightClass.value,
    horizCaseClass.value,
    'tracking-tight transition-colors',
    colorClasses,
    hasCustomHoverColor.value ? 'mts-nav-hover-custom' : '',
  ].filter(Boolean)
})

const horizActiveClass = '!border-primary text-primary'

const isMenuOpen = ref(false)

function labelForLocale(item: NavigationMenuItem): string {
  const loc = locale.value === 'en' ? 'en' : 'ru'
  const raw = item.label[loc] || item.label.ru || item.label.en || ''
  return flattenEncodedOrPlain(raw)
}

function isExternalPath(path: string) {
  return /^https?:\/\//i.test(path.trim())
}

function localizedPath(path: string) {
  return path === '#' ? localePath('/') : localePath(path)
}

function isActivePath(path: string) {
  if (isExternalPath(path) || path === '#') {
    return false
  }
  const current = stripLocalePrefix(route.path).replace(/\/$/, '') || '/'
  const localized = String(localePath(path))
  const target = stripLocalePrefix(localized).replace(/\/$/, '') || '/'
  return target === '/' ? current === '/' : current === target || current.startsWith(`${target}/`)
}

function closeMenu() {
  isMenuOpen.value = false
}

watch(
  () => route.path,
  () => closeMenu(),
)
</script>

<template>
  <header :style="navColorVars">
    <nav
      :class="[
        'fixed z-50 transition-all duration-500',
        isScrolled
          ? 'left-12 right-12 top-3 rounded-2xl bg-white/75 backdrop-blur-xl shadow-lg border border-black/[0.06]'
          : 'left-0 right-0 top-0 bg-transparent',
      ]"
    >
      <div class="flex w-full items-center gap-4 px-6 py-4 lg:px-10">
        <NuxtLink :to="localePath('/')" class="group flex shrink-0 items-center gap-3">
          <AppLogo img-class="h-12 w-auto max-w-[250px] object-contain object-left transition-opacity group-hover:opacity-90" />
        </NuxtLink>

        <!-- Горизонтальное меню (десктоп) -->
        <div
          :class="[
            'hidden min-w-0 mx-auto w-full max-w-7xl flex-nowrap items-center gap-x-3 overflow-x-auto px-2 lg:flex xl:gap-x-6 2xl:gap-x-8',
            horizJustifyClass,
          ]"
        >
          <template v-for="(item, index) in horizMenuItems" :key="`h-${index}-${item.path}`">
            <div
              v-if="item.children && item.children.length > 0"
              class="group/nav relative shrink-0"
            >
              <button
                type="button"
                :class="[
                  ...horizLinkClasses,
                  'inline-flex items-center gap-0.5 border-t-2 border-transparent pt-0.5',
                  'hover:!border-primary/60',
                  isActivePath(item.path) ? horizActiveClass : '',
                ]"
              >
                {{ labelForLocale(item) }}
                <ChevronDown class="h-3.5 w-3.5 opacity-70" />
              </button>
              <div
                class="pointer-events-none invisible absolute left-0 top-full z-[60] pt-2 opacity-0 transition group-hover/nav:pointer-events-auto group-hover/nav:visible group-hover/nav:opacity-100"
              >
                <ul class="min-w-[12rem] rounded-lg border border-border bg-white py-1 shadow-lg">
                  <li v-for="(child, ci) in item.children" :key="`c-${ci}-${child.path}`">
                    <a
                      v-if="isExternalPath(child.path)"
                      :href="child.path"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block px-4 py-2 text-sm font-body text-body hover:bg-mts-bg"
                    >
                      {{ labelForLocale(child) }}
                    </a>
                    <NuxtLink
                      v-else
                      :to="localizedPath(child.path)"
                      class="block px-4 py-2 text-sm font-body text-body hover:bg-mts-bg"
                    >
                      {{ labelForLocale(child) }}
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </div>
            <a
              v-else-if="isExternalPath(item.path)"
              :href="item.path"
              target="_blank"
              rel="noopener noreferrer"
              :class="[
                ...horizLinkClasses,
                'inline-flex shrink-0 items-center border-t-2 border-transparent pt-0.5',
                'hover:!border-primary/60',
              ]"
            >
              {{ labelForLocale(item) }}
            </a>
            <NuxtLink
              v-else
              :to="localizedPath(item.path)"
              :class="[
                ...horizLinkClasses,
                'inline-flex shrink-0 items-center border-t-2 border-transparent pt-0.5',
                'hover:!border-primary/60',
                isActivePath(item.path) ? horizActiveClass : '',
              ]"
            >
              {{ labelForLocale(item) }}
            </NuxtLink>
          </template>
        </div>

        <div class="ml-auto flex shrink-0 items-center gap-5">
          <LayoutLanguageSwitch dark class="hidden sm:inline-flex" />
          <button
            type="button"
            class="group flex items-center gap-2 rounded-full border-0 bg-transparent p-3 text-primary transition-opacity duration-200 hover:opacity-90"
            :aria-expanded="isMenuOpen"
            aria-label="Открыть меню"
            @click="isMenuOpen = true"
          >
            <span class="flex w-8 flex-col gap-1.5">
              <span class="block h-0.5 w-full bg-primary transition-all duration-300 group-hover:w-4" />
              <span class="block h-0.5 w-full bg-primary" />
              <span class="ml-auto block h-0.5 w-5 bg-primary transition-all duration-300 group-hover:w-full" />
            </span>
          </button>
        </div>
      </div>
    </nav>

    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isMenuOpen" class="fixed inset-0 z-[100] overflow-y-auto bg-white">
        <div class="flex items-center justify-between px-6 py-4 lg:px-10">
          <NuxtLink :to="localePath('/')" class="flex items-center gap-3" @click="closeMenu">
            <AppLogo img-class="h-12 w-auto max-w-[250px] object-contain object-left" />
          </NuxtLink>

          <button type="button" class="group flex items-center gap-3 text-body transition-colors hover:text-primary" @click="closeMenu">
            <span class="text-sm">закрыть</span>
            <span class="relative h-6 w-6">
              <span class="absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 rotate-45 bg-current transition-transform duration-300 group-hover:rotate-[225deg]" />
              <span class="absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 -rotate-45 bg-current transition-transform duration-300 group-hover:-rotate-[225deg]" />
            </span>
          </button>
        </div>

        <div class="px-6 pb-16 pt-10 lg:px-10">
          <nav class="mx-auto max-w-4xl">
            <template v-for="(item, index) in menuItems" :key="`menu-${index}-${item.path}`">
              <a
                v-if="isExternalPath(item.path)"
                :href="item.path"
                target="_blank"
                rel="noopener noreferrer"
                class="group flex items-center justify-between border-b border-border py-3.5 md:py-4"
                @click="closeMenu"
              >
                <span class="text-xl font-bold text-body transition-colors duration-300 group-hover:text-primary md:text-2xl lg:text-3xl">
                  {{ labelForLocale(item) }}
                </span>
                <ExternalLink class="h-5 w-5 shrink-0 text-muted transition-all duration-300 group-hover:text-primary md:h-7 md:w-7" />
              </a>
              <NuxtLink
                v-else
                :to="localizedPath(item.path)"
                class="group flex items-center justify-between border-b border-border py-3.5 md:py-4"
                @click="closeMenu"
              >
                <span
                  :class="[
                    'text-xl font-bold transition-colors duration-300 md:text-2xl lg:text-3xl',
                    isActivePath(item.path) ? 'text-primary' : 'text-body group-hover:text-primary',
                  ]"
                >
                  {{ labelForLocale(item) }}
                </span>
                <ArrowRight
                  :class="[
                    'h-5 w-5 shrink-0 transition-all duration-300 md:h-7 md:w-7',
                    isActivePath(item.path) ? 'translate-x-0 text-primary' : 'text-muted group-hover:translate-x-2 group-hover:text-primary',
                  ]"
                />
              </NuxtLink>
            </template>
          </nav>
        </div>

        <div v-if="burgerOverlaySectionVisible" class="px-6 pb-12 lg:px-10">
          <div class="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            <!-- Телефоны -->
            <div v-if="burgerPhoneColVisible">
              <div
                v-if="menu.burgerContacts?.phonesTitle?.trim()"
                class="mb-4 text-xs uppercase tracking-widest text-muted"
                v-html="burgerContactRichHtml(menu.burgerContacts.phonesTitle)"
              />
              <div class="space-y-2">
                <a
                  v-for="(phone, pi) in burgerOverlayPhones"
                  :key="`phone-${pi}`"
                  :href="burgerContactTelHref(phone)"
                  class="burger-contact-phone block text-body transition-colors hover:text-primary [&_p]:mb-2 [&_p:last-child]:mb-0"
                >
                  <span v-html="burgerContactRichHtml(phone)" />
                </a>
              </div>
            </div>
            <!-- Email / соцсети -->
            <div v-if="burgerEmailColVisible">
              <div
                v-if="menu.burgerContacts?.emailTitle?.trim()"
                class="mb-4 text-xs uppercase tracking-widest text-muted"
                v-html="burgerContactRichHtml(menu.burgerContacts.emailTitle)"
              />
              <div class="space-y-2">
                <a
                  v-for="(em, ei) in burgerOverlayEmails"
                  :key="`em-${ei}`"
                  :href="burgerContactMailtoHref(em)"
                  class="burger-contact-email block text-body transition-colors hover:text-primary [&_p]:mb-2 [&_p:last-child]:mb-0"
                >
                  <span v-html="burgerContactRichHtml(em)" />
                </a>
              </div>
              <div class="mt-4 space-y-2">
                <a
                  v-for="(soc, si) in burgerOverlaySocials"
                  :key="`soc-${si}`"
                  :href="soc.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary [&_p]:mb-0 [&_p:last-child]:mb-0"
                >
                  <ExternalLink class="h-4 w-4 shrink-0" />
                  <span v-html="burgerContactRichHtml(soc.label)" />
                </a>
              </div>
            </div>
            <!-- Офисы -->
            <div v-if="burgerOfficeColVisible">
              <div
                v-if="burgerOverlayOfficesHeading"
                class="mb-4 text-xs uppercase tracking-widest text-muted"
                v-html="burgerContactRichHtml(burgerOverlayOfficesHeading)"
              />
              <div class="space-y-6">
                <div v-for="(office, oi) in burgerOverlayOffices" :key="`of-${oi}`">
                  <div
                    v-if="office.title?.trim()"
                    class="mb-1 text-xs font-semibold uppercase tracking-wide text-body/90"
                    v-html="burgerContactRichHtml(office.title)"
                  />
                  <div
                    class="burger-contact-address text-sm leading-relaxed text-muted [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary [&_p]:mb-2 [&_p:last-child]:mb-0"
                    v-html="burgerContactRichHtml(office.address)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style>
.mts-nav-hover-custom:hover {
  color: var(--mts-nav-item-hover-color) !important;
}
</style>
