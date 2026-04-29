<script setup lang="ts">
import { ArrowRight, ExternalLink } from 'lucide-vue-next'
import type { NavigationMenuItem } from '~/types'
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'
import { emptyNavigationSettings } from '~/utils/emptyNavigationSettings'

const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()
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
const menuItems = computed(() => {
  if (menu.value.more.length) {
    return fallbackItems.value
  }
  const saved = [...menu.value.main, ...menu.value.more]
  return saved.length ? saved : fallbackItems.value
})

const isScrolled = ref(false)
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
  if (isExternalPath(path) || path === '#') return false
  const current = route.path.replace(/\/$/, '') || '/'
  const target = String(localePath(path)).replace(/\/$/, '') || '/'
  return target === '/' ? current === '/' || current === '/en' : current === target || current.startsWith(`${target}/`)
}

function closeMenu() {
  isMenuOpen.value = false
}

onMounted(() => {
  const handleScroll = () => {
    isScrolled.value = window.scrollY > 50
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})

watch(
  () => route.path,
  () => closeMenu(),
)
</script>

<template>
  <header>
    <nav
      :class="[
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
        'bg-transparent',
      ]"
    >
      <div class="flex w-full items-center justify-between px-6 py-4 lg:px-10">
        <NuxtLink :to="localePath('/')" class="group flex items-center gap-3">
          <AppLogo img-class="h-10 w-auto max-w-[210px] object-contain object-left transition-opacity group-hover:opacity-90" />
        </NuxtLink>

        <div class="flex items-center gap-5">
          <LayoutLanguageSwitch dark class="hidden sm:inline-flex" />
          <button
            type="button"
            class="group flex items-center gap-2 rounded-full border-0 bg-transparent p-2.5 text-primary transition-opacity duration-200 hover:opacity-90"
            :aria-expanded="isMenuOpen"
            aria-label="Открыть меню"
            @click="isMenuOpen = true"
          >
            <span class="flex w-6 flex-col gap-1">
              <span class="block h-0.5 w-full bg-primary transition-all duration-300 group-hover:w-4" />
              <span class="block h-0.5 w-full bg-primary" />
              <span class="ml-auto block h-0.5 w-4 bg-primary transition-all duration-300 group-hover:w-full" />
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
            <AppLogo img-class="h-10 w-auto max-w-[210px] object-contain object-left" />
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
          <nav class="mx-auto max-w-5xl">
            <template v-for="(item, index) in menuItems" :key="`menu-${index}-${item.path}`">
              <a
                v-if="isExternalPath(item.path)"
                :href="item.path"
                target="_blank"
                rel="noopener noreferrer"
                class="group flex items-center justify-between border-b border-border py-4 md:py-5"
                @click="closeMenu"
              >
                <span class="text-2xl font-bold text-body transition-colors duration-300 group-hover:text-primary md:text-3xl lg:text-5xl">
                  {{ labelForLocale(item) }}
                </span>
                <ExternalLink class="h-6 w-6 shrink-0 text-muted transition-all duration-300 group-hover:text-primary md:h-8 md:w-8" />
              </a>
              <NuxtLink
                v-else
                :to="localizedPath(item.path)"
                class="group flex items-center justify-between border-b border-border py-4 md:py-5"
                @click="closeMenu"
              >
                <span
                  :class="[
                    'text-2xl font-bold transition-colors duration-300 md:text-3xl lg:text-5xl',
                    isActivePath(item.path) ? 'text-primary' : 'text-body group-hover:text-primary',
                  ]"
                >
                  {{ labelForLocale(item) }}
                </span>
                <ArrowRight
                  :class="[
                    'h-6 w-6 shrink-0 transition-all duration-300 md:h-8 md:w-8',
                    isActivePath(item.path) ? 'translate-x-0 text-primary' : 'text-muted group-hover:translate-x-2 group-hover:text-primary',
                  ]"
                />
              </NuxtLink>
            </template>
          </nav>
        </div>

        <div class="px-6 pb-12 lg:px-10">
          <div class="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h4 class="mb-4 text-xs uppercase tracking-widest text-muted">Телефоны</h4>
              <div class="space-y-2">
                <a href="tel:+79114757025" class="block text-body transition-colors hover:text-primary">+7 (911) 475-70-25</a>
                <a href="tel:84012355290" class="block text-body transition-colors hover:text-primary">8 (4012) 35-52-90</a>
              </div>
            </div>
            <div>
              <h4 class="mb-4 text-xs uppercase tracking-widest text-muted">Email</h4>
              <a href="mailto:info@marin-ts.com" class="mb-4 block text-body transition-colors hover:text-primary">info@marin-ts.com</a>
              <a href="https://vk.com/marine_ts" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary">
                <ExternalLink class="h-4 w-4" />
                vk.com/marine_ts
              </a>
            </div>
            <div>
              <h4 class="mb-4 text-xs uppercase tracking-widest text-muted">Office in U.A.E.</h4>
              <p class="text-sm leading-relaxed text-muted">
                Al Shmookh Business Center,<br>
                One UAQ, UAQ Free Trade Zone,<br>
                Umm Al Quwain, U.A.E.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>
