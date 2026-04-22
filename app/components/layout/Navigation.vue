<script setup lang="ts">
import { Menu, X, Phone, MoreVertical, ChevronDown } from 'lucide-vue-next'
import LanguageSwitch from '~/components/layout/LanguageSwitch.vue'
import type { NavigationMenuItem } from '~/types'
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

/** SSR иногда не достучится до API — повторяем запрос на клиенте. */
onMounted(async () => {
  if (navigationRemote.value == null) {
    await refreshNavigation()
  }
})

const menu = computed(() => navigationRemote.value ?? emptyNavigationSettings())

function labelForLocale(item: NavigationMenuItem): string {
  const loc = locale.value === 'en' ? 'en' : 'ru'
  return item.label[loc] || item.label.ru || item.label.en || ''
}

function isExternalPath(p: string) {
  return /^https?:\/\//i.test(p.trim())
}

const mainItems = computed(() => menu.value.main)

const moreLinks = computed(() =>
  menu.value.more.map((item) => ({
    path: item.path,
    label: labelForLocale(item),
  })),
)

const showMoreBlock = computed(() => moreLinks.value.length > 0)

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const moreOpen = ref(false)
const moreMenuRoot = ref<HTMLElement | null>(null)
const openDropdownIndex = ref<number | null>(null)
const mobileOpenSubIndex = ref<number | null>(null)

function closeNavOverlays() {
  moreOpen.value = false
  openDropdownIndex.value = null
}

onMounted(() => {
  const onScroll = () => {
    isScrolled.value = window.scrollY > 50
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  function onDocumentClick(e: MouseEvent) {
    const target = e.target
    if (!(target instanceof Node)) {
      return
    }
    if (target.closest('[data-nav-dropdown]')) {
      return
    }
    closeNavOverlays()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeNavOverlays()
    }
  }
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeydown)
  })
})

watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false
    mobileOpenSubIndex.value = null
    closeNavOverlays()
  },
)

function isActivePath(href: string) {
  if (isExternalPath(href)) {
    return false
  }
  const resolved = localePath(href)
  const path = route.path.replace(/\/$/, '') || '/'
  const target = String(resolved).replace(/\/$/, '') || '/'
  if (href === '/') {
    return path === '/' || path === '/en'
  }
  return path === target || path.startsWith(`${target}/`)
}

function isNavGroupActive(item: NavigationMenuItem): boolean {
  if (item.children?.length) {
    if (item.children.some((c) => isActivePath(c.path))) {
      return true
    }
  }
  if (item.path === '#') {
    return false
  }
  return isActivePath(item.path)
}

function toggleNavDropdown(i: number, e: Event) {
  e.stopPropagation()
  moreOpen.value = false
  openDropdownIndex.value = openDropdownIndex.value === i ? null : i
}

function toggleMore(e: Event) {
  e.stopPropagation()
  openDropdownIndex.value = null
  moreOpen.value = !moreOpen.value
}

function toggleMobileSub(i: number) {
  mobileOpenSubIndex.value = mobileOpenSubIndex.value === i ? null : i
}

const isMoreSectionActive = computed(() => moreLinks.value.some((link) => isActivePath(link.path)))
</script>

<template>
  <nav
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-mts-frost/10',
      isScrolled ? 'bg-mts-navy shadow-[0_4px_24px_rgba(0,0,0,0.25)]' : 'bg-mts-navy',
    ]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
      <div class="flex w-full min-w-0 items-center gap-2 sm:gap-3 lg:gap-4 h-16">
        <NuxtLink
          :to="localePath('/')"
          class="flex items-center group shrink-0 relative z-20 max-w-[min(52vw,200px)] sm:max-w-[220px] lg:max-w-[200px] xl:max-w-[240px]"
        >
          <AppLogo img-class="h-9 w-auto max-w-full object-contain object-left md:h-10" />
        </NuxtLink>

        <div
          class="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-x-1 xl:gap-x-2 2xl:gap-x-4 px-1"
        >
          <template v-for="(item, i) in mainItems" :key="`nav-p-${i}-${item.path}`">
            <!-- Пункт с подменю -->
            <div
              v-if="item.children?.length"
              data-nav-dropdown
              class="relative flex items-center gap-0.5"
            >
              <template v-if="item.path === '#'">
                <button
                  type="button"
                  class="font-display text-[11px] font-normal tracking-normal transition-colors duration-200 relative group inline-flex items-center gap-0.5 whitespace-nowrap text-mts-slate-muted hover:text-mts-frost"
                  :class="[isNavGroupActive(item) || openDropdownIndex === i ? 'text-mts-accent' : '']"
                  :aria-expanded="openDropdownIndex === i"
                  @click="toggleNavDropdown(i, $event)"
                >
                  {{ labelForLocale(item) }}
                  <ChevronDown class="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                  <span
                    :class="[
                      'absolute -bottom-1 left-0 h-px bg-mts-accent transition-all duration-200',
                      isNavGroupActive(item) || openDropdownIndex === i ? 'w-full' : 'w-0 group-hover:w-full',
                    ]"
                  />
                </button>
              </template>
              <template v-else>
                <NuxtLink
                  :to="localePath(item.path)"
                  class="font-display text-[11px] font-normal tracking-normal transition-colors duration-200 relative group whitespace-nowrap text-mts-slate-muted hover:text-mts-frost"
                  :class="[isNavGroupActive(item) ? 'text-mts-accent' : '']"
                >
                  {{ labelForLocale(item) }}
                  <span
                    :class="[
                      'absolute -bottom-1 left-0 h-px bg-mts-accent transition-all duration-200',
                      isNavGroupActive(item) ? 'w-full' : 'w-0 group-hover:w-full',
                    ]"
                  />
                </NuxtLink>
                <button
                  type="button"
                  class="p-0.5 shrink-0 rounded-sm text-mts-slate-muted hover:text-mts-accent transition-colors"
                  :aria-expanded="openDropdownIndex === i"
                  :aria-label="labelForLocale(item)"
                  @click="toggleNavDropdown(i, $event)"
                >
                  <ChevronDown class="h-3.5 w-3.5 xl:h-4 xl:w-4" aria-hidden="true" />
                </button>
              </template>

              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 -translate-y-0.5"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-0.5"
              >
                <div
                  v-show="openDropdownIndex === i"
                  class="absolute left-0 top-[calc(100%+0.5rem)] z-[60] min-w-[12rem] border border-mts-frost/15 bg-mts-navy py-1 shadow-tech"
                  role="menu"
                >
                  <template v-for="(child, ci) in item.children" :key="`nav-c-${i}-${ci}-${child.path}`">
                    <a
                      v-if="isExternalPath(child.path)"
                      :href="child.path"
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      class="block px-4 py-2.5 font-display text-xs font-normal transition-colors text-mts-slate-muted hover:bg-mts-frost/5 hover:text-mts-accent"
                      @click="closeNavOverlays"
                    >
                      {{ labelForLocale(child) }}
                    </a>
                    <NuxtLink
                      v-else
                      :to="localePath(child.path)"
                      role="menuitem"
                      class="block px-4 py-2.5 font-display text-xs font-normal transition-colors"
                      :class="[
                        isActivePath(child.path) ? 'bg-mts-frost/10 text-mts-accent' : 'text-mts-slate-muted hover:bg-mts-frost/5 hover:text-mts-accent',
                      ]"
                      @click="closeNavOverlays"
                    >
                      {{ labelForLocale(child) }}
                    </NuxtLink>
                  </template>
                </div>
              </Transition>
            </div>

            <!-- Обычный пункт -->
            <template v-else>
              <a
                v-if="isExternalPath(item.path)"
                :href="item.path"
                target="_blank"
                rel="noopener noreferrer"
                class="font-display text-[11px] font-normal tracking-normal transition-colors duration-200 relative group whitespace-nowrap text-mts-slate-muted hover:text-mts-frost"
              >
                {{ labelForLocale(item) }}
                <span class="absolute -bottom-1 left-0 h-px bg-mts-accent transition-all duration-200 w-0 group-hover:w-full" />
              </a>
              <NuxtLink
                v-else
                :to="localePath(item.path)"
                :class="[
                  'font-display text-[11px] font-normal tracking-normal transition-colors duration-200 relative group whitespace-nowrap',
                  isActivePath(item.path) ? 'text-mts-accent' : 'text-mts-slate-muted hover:text-mts-frost',
                ]"
              >
                {{ labelForLocale(item) }}
                <span
                  :class="[
                    'absolute -bottom-1 left-0 h-px bg-mts-accent transition-all duration-200',
                    isActivePath(item.path) ? 'w-full' : 'w-0 group-hover:w-full',
                  ]"
                />
              </NuxtLink>
            </template>
          </template>

          <div v-if="showMoreBlock" ref="moreMenuRoot" data-nav-dropdown class="relative">
            <button
              type="button"
              class="flex items-center gap-1 font-display text-[11px] font-normal tracking-normal transition-colors duration-200 relative group whitespace-nowrap"
              :class="[
                isMoreSectionActive || moreOpen ? 'text-mts-accent' : 'text-mts-slate-muted hover:text-mts-frost',
              ]"
              :aria-expanded="moreOpen"
              :aria-haspopup="true"
              :aria-label="t('nav.moreAria')"
              @click="toggleMore"
            >
              <span>{{ t('nav.more') }}</span>
              <MoreVertical class="h-4 w-4 shrink-0" aria-hidden="true" />
              <span
                :class="[
                  'absolute -bottom-1 left-0 h-px bg-mts-accent transition-all duration-200',
                  isMoreSectionActive || moreOpen ? 'w-full' : 'w-0 group-hover:w-full',
                ]"
              />
            </button>
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-0.5"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-0.5"
            >
              <div
                v-show="moreOpen"
                class="absolute right-0 top-[calc(100%+0.5rem)] z-[60] min-w-[12rem] border border-mts-frost/15 bg-mts-navy py-1 shadow-tech"
                role="menu"
              >
                <template v-for="(link, mi) in moreLinks" :key="`nav-m-${mi}-${link.path}`">
                  <a
                    v-if="isExternalPath(link.path)"
                    :href="link.path"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    class="block px-4 py-2.5 font-display text-xs font-normal transition-colors text-mts-slate-muted hover:bg-mts-frost/5 hover:text-mts-accent"
                    @click="moreOpen = false"
                  >
                    {{ link.label }}
                  </a>
                  <NuxtLink
                    v-else
                    :to="localePath(link.path)"
                    role="menuitem"
                    class="block px-4 py-2.5 font-display text-xs font-normal transition-colors"
                    :class="[
                      isActivePath(link.path) ? 'bg-mts-frost/10 text-mts-accent' : 'text-mts-slate-muted hover:bg-mts-frost/5 hover:text-mts-accent',
                    ]"
                    @click="moreOpen = false"
                  >
                    {{ link.label }}
                  </NuxtLink>
                </template>
              </div>
            </Transition>
          </div>
        </div>

        <div class="hidden lg:flex shrink-0 items-center gap-2 xl:gap-4 2xl:gap-6 min-w-0">
          <CommonMarinThemeToggle class="shrink-0" />
          <LanguageSwitch dark class="shrink-0" />
          <a
            href="tel:84012355290"
            class="hidden xl:flex items-center gap-1.5 text-mts-slate-muted hover:text-mts-frost shrink-0"
          >
            <Phone class="w-3 h-3 shrink-0" />
            <span class="font-display text-[11px] font-normal whitespace-nowrap">{{
              t('header.phoneDisplay')
            }}</span>
          </a>
          <a
            href="tel:84012355290"
            class="flex shrink-0 p-1 text-mts-slate-muted hover:text-mts-accent xl:hidden"
            :aria-label="t('header.phoneDisplay')"
          >
            <Phone class="w-4 h-4" />
          </a>
          <NuxtLink
            :to="localePath('/request')"
            class="shrink-0 whitespace-nowrap rounded-none border border-mts-accent bg-mts-navy px-3 py-2 text-[11px] font-display font-normal text-mts-accent transition-colors hover:bg-mts-accent/15 xl:px-4 xl:py-2.5"
          >
            {{ t('header.ctaContact') }}
          </NuxtLink>
        </div>

        <div class="flex lg:hidden items-center gap-3">
          <CommonMarinThemeToggle />
          <LanguageSwitch dark />
          <button
            type="button"
            class="p-2 border border-mts-frost/25 text-mts-frost hover:text-mts-accent hover:border-mts-accent transition-colors"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <X v-if="isMobileMenuOpen" class="w-5 h-5" />
            <Menu v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </nav>

  <div
    :class="[
      'fixed inset-0 z-40 lg:hidden transition-all duration-300',
      isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
    ]"
  >
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="isMobileMenuOpen = false" />
    <div
      :class="[
        'absolute top-16 left-0 right-0 border-b border-mts-frost/10 bg-mts-navy p-6 transition-all duration-300 max-h-[calc(100vh-4rem)] overflow-y-auto',
        isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
      ]"
    >
      <div class="space-y-1">
        <template v-for="(item, i) in mainItems" :key="`nav-mob-p-${i}-${item.path}`">
          <div v-if="item.children?.length" class="border-b border-mts-frost/10 pb-1 mb-1 last:border-0">
            <div class="flex items-stretch gap-1">
              <NuxtLink
                v-if="item.path !== '#'"
                :to="localePath(item.path)"
                class="flex-1 font-display text-xs font-normal px-4 py-3 transition-colors"
                :class="[
                  isNavGroupActive(item) ? 'text-mts-accent bg-mts-frost/10' : 'text-mts-slate-muted hover:text-mts-frost hover:bg-mts-frost/5',
                ]"
                @click="isMobileMenuOpen = false"
              >
                {{ labelForLocale(item) }}
              </NuxtLink>
              <button
                v-else
                type="button"
                class="flex flex-1 items-center justify-between gap-2 font-display text-xs font-normal px-4 py-3 text-left transition-colors text-mts-slate-muted hover:text-mts-frost hover:bg-mts-frost/5"
                :class="[isNavGroupActive(item) ? 'text-mts-accent bg-mts-frost/10' : '']"
                :aria-expanded="mobileOpenSubIndex === i"
                @click="toggleMobileSub(i)"
              >
                {{ labelForLocale(item) }}
                <ChevronDown
                  class="h-5 w-5 shrink-0 transition-transform"
                  :class="mobileOpenSubIndex === i ? 'rotate-180' : ''"
                />
              </button>
              <button
                v-if="item.path !== '#'"
                type="button"
                class="shrink-0 px-3 border-l border-mts-frost/15 text-mts-slate-muted hover:text-mts-accent"
                :aria-expanded="mobileOpenSubIndex === i"
                @click="toggleMobileSub(i)"
              >
                <ChevronDown
                  class="h-5 w-5 transition-transform"
                  :class="mobileOpenSubIndex === i ? 'rotate-180' : ''"
                />
              </button>
            </div>
            <div v-show="mobileOpenSubIndex === i" class="mt-1 space-y-0.5 pl-2 border-l-2 border-mts-accent/40 ml-4">
              <template v-for="(child, ci) in item.children" :key="`nav-mob-c-${i}-${ci}`">
                <a
                  v-if="isExternalPath(child.path)"
                  :href="child.path"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block font-display text-xs font-normal px-4 py-2.5 transition-colors text-mts-slate-muted hover:text-mts-frost hover:bg-mts-frost/5"
                  @click="isMobileMenuOpen = false"
                >
                  {{ labelForLocale(child) }}
                </a>
                <NuxtLink
                  v-else
                  :to="localePath(child.path)"
                  class="block font-display text-xs font-normal px-4 py-2.5 transition-colors"
                  :class="[
                    isActivePath(child.path) ? 'text-mts-accent bg-mts-frost/10' : 'text-mts-slate-muted hover:text-mts-frost hover:bg-mts-frost/5',
                  ]"
                  @click="isMobileMenuOpen = false"
                >
                  {{ labelForLocale(child) }}
                </NuxtLink>
              </template>
            </div>
          </div>
          <template v-else>
            <a
              v-if="isExternalPath(item.path)"
              :href="item.path"
              target="_blank"
              rel="noopener noreferrer"
              class="block font-display text-xs font-normal px-4 py-3 transition-colors text-mts-slate-muted hover:text-mts-frost hover:bg-mts-frost/5"
            >
              {{ labelForLocale(item) }}
            </a>
            <NuxtLink
              v-else
              :to="localePath(item.path)"
              :class="[
                'block font-display text-xs font-normal px-4 py-3 transition-colors',
                isActivePath(item.path) ? 'text-mts-accent bg-mts-frost/10' : 'text-mts-slate-muted hover:text-mts-frost hover:bg-mts-frost/5',
              ]"
            >
              {{ labelForLocale(item) }}
            </NuxtLink>
          </template>
        </template>
        <template v-if="showMoreBlock">
          <div class="px-4 pt-3 pb-1">
            <p class="font-display text-[10px] uppercase tracking-widest text-mts-slate-muted">{{ t('nav.more') }}</p>
          </div>
          <template v-for="(link, mi) in moreLinks" :key="`nav-mob-m-${mi}-${link.path}`">
            <a
              v-if="isExternalPath(link.path)"
              :href="link.path"
              target="_blank"
              rel="noopener noreferrer"
              class="block font-display text-xs font-normal px-4 py-3 transition-colors text-mts-slate-muted hover:text-mts-frost hover:bg-mts-frost/5"
            >
              {{ link.label }}
            </a>
            <NuxtLink
              v-else
              :to="localePath(link.path)"
              :class="[
                'block font-display text-xs font-normal px-4 py-3 transition-colors',
                isActivePath(link.path) ? 'text-mts-accent bg-mts-frost/10' : 'text-mts-slate-muted hover:text-mts-frost hover:bg-mts-frost/5',
              ]"
            >
              {{ link.label }}
            </NuxtLink>
          </template>
        </template>
      </div>
      <div class="mt-4 pt-4 border-t border-mts-frost/10">
        <a href="tel:84012355290" class="flex items-center gap-3 text-mts-frost px-4 py-3">
          <div class="w-10 h-10 bg-mts-accent/20 flex items-center justify-center">
            <Phone class="w-4 h-4 text-mts-accent" />
          </div>
          <span class="font-display text-sm font-normal">{{ t('header.phoneDisplay') }}</span>
        </a>
      </div>
    </div>
  </div>
</template>
