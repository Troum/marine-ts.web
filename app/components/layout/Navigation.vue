<script setup lang="ts">
import { Menu, X, Phone, MoreVertical } from 'lucide-vue-next'
import LanguageSwitch from '~/components/layout/LanguageSwitch.vue'
import type { NavigationMenuItem } from '~/types'
import { navigationMenuDefaults } from '~/utils/navigationDefaults'

const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()
const api = useMarineApi()

const { data: navigationRemote } = await useAsyncData('site-navigation', async () => {
  try {
    return await api.navigationSettings.get()
  } catch {
    return null
  }
})

const menu = computed(() => navigationRemote.value ?? navigationMenuDefaults)

function labelForLocale(item: NavigationMenuItem): string {
  const loc = locale.value === 'en' ? 'en' : 'ru'
  return item.label[loc] || item.label.ru || item.label.en || ''
}

function isExternalPath(p: string) {
  return /^https?:\/\//i.test(p.trim())
}

const primaryLinks = computed(() =>
  menu.value.main.map((item) => ({
    path: item.path,
    label: labelForLocale(item),
  })),
)

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

onMounted(() => {
  const onScroll = () => {
    isScrolled.value = window.scrollY > 50
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  function onDocumentClick(e: MouseEvent) {
    const el = moreMenuRoot.value
    if (!moreOpen.value || !el) {
      return
    }
    const target = e.target
    if (target instanceof Node && !el.contains(target)) {
      moreOpen.value = false
    }
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      moreOpen.value = false
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
    moreOpen.value = false
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

const isMoreSectionActive = computed(() => moreLinks.value.some((link) => isActivePath(link.path)))

function toggleMore(e: Event) {
  e.stopPropagation()
  moreOpen.value = !moreOpen.value
}
</script>

<template>
  <nav
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled ? 'bg-white/95 backdrop-blur-sm border-b border-mts-border shadow-tech' : 'bg-transparent',
    ]"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-12">
      <div class="flex items-center justify-between h-16">
        <NuxtLink :to="localePath('/')" class="flex items-center group shrink-0">
          <AppLogo img-class="h-9 w-auto max-w-[min(55vw,260px)] object-contain object-left md:h-10" />
        </NuxtLink>

        <div class="hidden lg:flex items-center gap-6 xl:gap-8">
          <template v-for="(link, i) in primaryLinks" :key="`nav-p-${i}-${link.path}`">
            <a
              v-if="isExternalPath(link.path)"
              :href="link.path"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-200 relative group text-mts-text-secondary hover:text-mts-accent"
            >
              {{ link.label }}
              <span class="absolute -bottom-1 left-0 h-px bg-mts-accent transition-all duration-200 w-0 group-hover:w-full" />
            </a>
            <NuxtLink
              v-else
              :to="localePath(link.path)"
              :class="[
                'font-mono text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-200 relative group',
                isActivePath(link.path) ? 'text-mts-accent' : 'text-mts-text-secondary hover:text-mts-accent',
              ]"
            >
              {{ link.label }}
              <span
                :class="[
                  'absolute -bottom-1 left-0 h-px bg-mts-accent transition-all duration-200',
                  isActivePath(link.path) ? 'w-full' : 'w-0 group-hover:w-full',
                ]"
              />
            </NuxtLink>
          </template>

          <div v-if="showMoreBlock" ref="moreMenuRoot" class="relative">
            <button
              type="button"
              class="flex items-center gap-1.5 font-mono text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-200 relative group"
              :class="[
                isMoreSectionActive || moreOpen ? 'text-mts-accent' : 'text-mts-text-secondary hover:text-mts-accent',
              ]"
              :aria-expanded="moreOpen"
              :aria-haspopup="true"
              :aria-label="t('nav.moreAria')"
              @click="toggleMore"
            >
              <MoreVertical class="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{{ t('nav.more') }}</span>
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
                class="absolute right-0 top-[calc(100%+0.5rem)] z-[60] min-w-[12rem] border border-mts-border bg-white py-1 shadow-tech"
                role="menu"
              >
                <template v-for="(link, i) in moreLinks" :key="`nav-m-${i}-${link.path}`">
                  <a
                    v-if="isExternalPath(link.path)"
                    :href="link.path"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    class="block px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.08em] transition-colors text-mts-text-secondary hover:bg-mts-bg hover:text-mts-accent"
                    @click="moreOpen = false"
                  >
                    {{ link.label }}
                  </a>
                  <NuxtLink
                    v-else
                    :to="localePath(link.path)"
                    role="menuitem"
                    class="block px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.08em] transition-colors"
                    :class="[
                      isActivePath(link.path) ? 'bg-mts-bg text-mts-accent' : 'text-mts-text-secondary hover:bg-mts-bg hover:text-mts-accent',
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

        <div class="hidden lg:flex items-center gap-4 xl:gap-6">
          <LanguageSwitch />
          <a
            href="tel:84012355290"
            class="flex items-center gap-2 text-mts-text"
          >
            <Phone class="w-3.5 h-3.5" />
            <span class="font-mono text-xs font-medium tracking-wide">{{ t('header.phoneDisplay') }}</span>
          </a>
          <NuxtLink :to="localePath('/contacts')" class="btn-primary">{{ t('header.ctaContact') }}</NuxtLink>
        </div>

        <div class="flex lg:hidden items-center gap-3">
          <LanguageSwitch />
          <button
            type="button"
            class="p-2 border border-mts-border text-mts-text hover:text-mts-accent hover:border-mts-accent transition-colors"
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
    <div class="absolute inset-0 bg-mts-text/20 backdrop-blur-sm" @click="isMobileMenuOpen = false" />
    <div
      :class="[
        'absolute top-16 left-0 right-0 bg-white border-b border-mts-border p-6 transition-all duration-300',
        isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
      ]"
    >
      <div class="space-y-1">
        <template v-for="(link, i) in primaryLinks" :key="`nav-mob-p-${i}-${link.path}`">
          <a
            v-if="isExternalPath(link.path)"
            :href="link.path"
            target="_blank"
            rel="noopener noreferrer"
            class="block font-mono text-xs font-medium uppercase tracking-wide px-4 py-3 transition-colors text-mts-text-secondary hover:text-mts-accent hover:bg-mts-bg"
          >
            {{ link.label }}
          </a>
          <NuxtLink
            v-else
            :to="localePath(link.path)"
            :class="[
              'block font-mono text-xs font-medium uppercase tracking-wide px-4 py-3 transition-colors',
              isActivePath(link.path) ? 'text-mts-accent bg-mts-bg' : 'text-mts-text-secondary hover:text-mts-accent hover:bg-mts-bg',
            ]"
          >
            {{ link.label }}
          </NuxtLink>
        </template>
        <template v-if="showMoreBlock">
          <div class="px-4 pt-3 pb-1">
            <p class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">{{ t('nav.more') }}</p>
          </div>
          <template v-for="(link, i) in moreLinks" :key="`nav-mob-m-${i}-${link.path}`">
            <a
              v-if="isExternalPath(link.path)"
              :href="link.path"
              target="_blank"
              rel="noopener noreferrer"
              class="block font-mono text-xs font-medium uppercase tracking-wide px-4 py-3 transition-colors text-mts-text-secondary hover:text-mts-accent hover:bg-mts-bg"
            >
              {{ link.label }}
            </a>
            <NuxtLink
              v-else
              :to="localePath(link.path)"
              :class="[
                'block font-mono text-xs font-medium uppercase tracking-wide px-4 py-3 transition-colors',
                isActivePath(link.path) ? 'text-mts-accent bg-mts-bg' : 'text-mts-text-secondary hover:text-mts-accent hover:bg-mts-bg',
              ]"
            >
              {{ link.label }}
            </NuxtLink>
          </template>
        </template>
      </div>
      <div class="mt-4 pt-4 border-t border-mts-border">
        <a href="tel:84012355290" class="flex items-center gap-3 text-mts-text px-4 py-3">
          <div class="w-10 h-10 bg-mts-accent/10 flex items-center justify-center">
            <Phone class="w-4 h-4 text-mts-accent" />
          </div>
          <span class="font-mono text-sm font-medium">{{ t('header.phoneDisplay') }}</span>
        </a>
      </div>
    </div>
  </div>
</template>
