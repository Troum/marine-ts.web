<script setup lang="ts">
import { Menu, X, Phone } from 'lucide-vue-next'

const route = useRoute()
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

onMounted(() => {
  const onScroll = () => {
    isScrolled.value = window.scrollY > 50
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
})

watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false
  },
)

const navLinks = [
  { label: 'Главная', href: '/' },
  { label: 'О компании', href: '/about' },
  { label: 'Услуги', href: '/services' },
  { label: 'Проекты', href: '/projects' },
  { label: 'Галерея', href: '/gallery' },
  { label: 'Новости', href: '/news' },
  { label: 'Контакты', href: '/contacts' },
]

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
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
        <NuxtLink to="/" class="flex items-center group shrink-0">
          <AppLogo img-class="h-9 w-auto max-w-[min(55vw,260px)] object-contain object-left md:h-10" />
        </NuxtLink>

        <div class="hidden lg:flex items-center gap-8">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.href"
            :to="link.href"
            :class="[
              'font-mono text-[11px] font-medium tracking-[0.1em] uppercase transition-colors duration-200 relative group',
              isActive(link.href) ? 'text-mts-accent' : 'text-mts-text-secondary hover:text-mts-accent',
            ]"
          >
            {{ link.label }}
            <span
              :class="[
                'absolute -bottom-1 left-0 h-px bg-mts-accent transition-all duration-200',
                isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full',
              ]"
            />
          </NuxtLink>
        </div>

        <div class="hidden lg:flex items-center gap-6">
          <a
            href="tel:84012355290"
            class="flex items-center gap-2 text-mts-text-secondary hover:text-mts-accent transition-colors"
          >
            <Phone class="w-3.5 h-3.5" />
            <span class="font-mono text-[11px] font-medium tracking-wide">8 (4012) 35-52-90</span>
          </a>
          <NuxtLink to="/contacts" class="btn-primary">Связаться</NuxtLink>
        </div>

        <button
          type="button"
          class="lg:hidden p-2 border border-mts-border text-mts-text hover:text-mts-accent hover:border-mts-accent transition-colors"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <X v-if="isMobileMenuOpen" class="w-5 h-5" />
          <Menu v-else class="w-5 h-5" />
        </button>
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
        <NuxtLink
          v-for="link in navLinks"
          :key="link.href"
          :to="link.href"
          :class="[
            'block font-mono text-xs font-medium uppercase tracking-wide px-4 py-3 transition-colors',
            isActive(link.href) ? 'text-mts-accent bg-mts-bg' : 'text-mts-text-secondary hover:text-mts-accent hover:bg-mts-bg',
          ]"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
      <div class="mt-4 pt-4 border-t border-mts-border">
        <a href="tel:84012355290" class="flex items-center gap-3 text-mts-text px-4 py-3">
          <div class="w-10 h-10 bg-mts-accent/10 flex items-center justify-center">
            <Phone class="w-4 h-4 text-mts-accent" />
          </div>
          <span class="font-mono text-sm font-medium">8 (4012) 35-52-90</span>
        </a>
      </div>
    </div>
  </div>
</template>
