<script setup lang="ts">
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()
const localePath = useLocalePath()
const { t } = useI18n()
const api = useMarineApi()

const navLinks = computed(() => [
  { label: t('nav.home'), href: '/' },
  { label: t('nav.about'), href: '/about' },
  { label: t('nav.services'), href: '/services' },
  { label: t('nav.crewing'), href: '/crewing-management' },
  { label: t('nav.projects'), href: '/projects' },
  { label: t('nav.gallery'), href: '/gallery' },
  { label: t('nav.news'), href: '/news' },
  { label: t('nav.vacancies'), href: '/vacancies' },
  { label: t('nav.contacts'), href: '/contacts' },
])

const { data: apiServices } = await useAsyncData('footer-services', () => api.services.getAll())

const serviceLinks = computed(() => {
  if (apiServices.value?.length) {
    return apiServices.value.map((s) => ({
      label: s.title,
      href: s.contentPage?.slug ? `/services/${s.contentPage.slug}` : '/services',
    }))
  }
  return [
    { label: t('footer.svcHull'), href: '/services' },
    { label: t('footer.svcEngine'), href: '/services' },
    { label: t('footer.svcElectro'), href: '/services' },
    { label: t('footer.svcPipes'), href: '/services' },
    { label: t('footer.svcDock'), href: '/services' },
    { label: t('footer.svcEng'), href: '/services' },
  ]
})
</script>

<template>
  <footer class="relative bg-mts-dark text-white overflow-hidden">
    <div class="absolute inset-0 opacity-5">
      <div
        class="absolute inset-0"
        style="
          background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 30px 30px;
        "
      />
    </div>

    <div class="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20 relative z-10">
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        <div class="lg:col-span-1">
          <NuxtLink :to="localePath('/')" class="inline-block mb-6 group">
            <AppLogo img-class="h-9 w-auto max-w-[min(100%,260px)] object-contain object-left opacity-95 group-hover:opacity-100 transition-opacity" />
          </NuxtLink>
          <p class="font-body text-xs text-white/50 leading-relaxed">
            {{ t('footer.tagline') }}
          </p>
        </div>

        <div>
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white/30 mb-6">{{ t('footer.sectionNav') }}</h4>
          <ul class="space-y-2">
            <li v-for="link in navLinks" :key="link.href + link.label">
              <NuxtLink
                :to="localePath(link.href)"
                class="font-body text-xs text-white/60 hover:text-mts-accent transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white/30 mb-6">{{ t('footer.sectionServices') }}</h4>
          <ul class="space-y-2">
            <li v-for="service in serviceLinks" :key="service.label">
              <NuxtLink
                :to="localePath(service.href)"
                class="font-body text-xs text-white/60 hover:text-mts-accent transition-colors"
              >
                {{ service.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white/30 mb-6">{{ t('footer.sectionContacts') }}</h4>
          <ul class="space-y-3">
            <li>
              <a
                href="tel:84012355290"
                class="flex items-center gap-3 text-white/60 hover:text-mts-accent transition-colors"
              >
                <div class="w-7 h-7 bg-white/10 flex items-center justify-center">
                  <Phone class="w-3.5 h-3.5" />
                </div>
                <span class="font-body text-xs">{{ t('footer.phone') }}</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:info@marin-ts.com"
                class="flex items-center gap-3 text-white/60 hover:text-mts-accent transition-colors"
              >
                <div class="w-7 h-7 bg-white/10 flex items-center justify-center">
                  <Mail class="w-3.5 h-3.5" />
                </div>
                <span class="font-body text-xs">info@marin-ts.com</span>
              </a>
            </li>
            <li class="flex items-start gap-3 text-white/60">
              <div class="w-7 h-7 bg-white/10 flex items-center justify-center flex-shrink-0">
                <MapPin class="w-3.5 h-3.5" />
              </div>
              <span class="font-body text-xs">{{ t('footer.address') }}</span>
            </li>
            <li>
              <a
                href="https://vk.com/marine_ts"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 text-white/60 hover:text-mts-accent transition-colors"
              >
                <div class="w-7 h-7 bg-white/10 flex items-center justify-center">
                  <ExternalLink class="w-3.5 h-3.5" />
                </div>
                <span class="font-body text-xs">{{ t('footer.vk') }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-16 pt-8 border-t border-white/10">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="font-mono text-[10px] text-white/30">
            {{ t('footer.copyright', { year: currentYear }) }}
          </p>
          <div class="flex items-center gap-6">
            <NuxtLink
              :to="localePath('/privacy')"
              class="font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              {{ t('footer.privacy') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/terms')"
              class="font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              {{ t('footer.terms') }}
            </NuxtLink>
            <NuxtLink to="/admin" class="font-mono text-[10px] text-white/30 hover:text-mts-accent transition-colors">
              {{ t('footer.admin') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
