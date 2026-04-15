<script setup lang="ts">
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()
const localePath = useLocalePath()
const { t } = useI18n()
const api = useMarineApi()

const companyLinks = computed(() => [
  { label: t('nav.about'), href: '/about' },
  { label: t('nav.contacts'), href: '/contacts' },
])

const serviceLinks = computed(() => [
  { label: t('nav.services'), href: '/services' },
  { label: t('nav.shipManagement'), href: '/ship-management' },
  { label: t('nav.crewing'), href: '/crewing-management' },
])

const candidateLinks = computed(() => [
  { label: t('nav.vacancies'), href: '/vacancies' },
  { label: t('footer.linkApplication'), href: '/application-form' },
])

const { data: apiServices } = await useAsyncData('footer-services', () => api.services.getAll())

const dynamicServiceLinks = computed(() => {
  if (apiServices.value?.length) {
    return apiServices.value.slice(0, 6).map((s) => ({
      label: s.title,
      href: s.contentPage?.slug ? `/services/${s.contentPage.slug}` : '/services',
    }))
  }
  return [
    { label: t('footer.svcHull'), href: '/services' },
    { label: t('footer.svcEngine'), href: '/services' },
    { label: t('footer.svcElectro'), href: '/services' },
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
      <div class="grid md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
        <div class="md:col-span-2 lg:col-span-2">
          <NuxtLink :to="localePath('/')" class="inline-block mb-6 group">
            <AppLogo img-class="h-9 w-auto max-w-[min(100%,260px)] object-contain object-left opacity-95 group-hover:opacity-100 transition-opacity" />
          </NuxtLink>
          <p class="font-body text-xs text-white/50 leading-relaxed">
            {{ t('footer.tagline') }}
          </p>
        </div>

        <div>
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white/30 mb-6">{{ t('footer.sectionCompany') }}</h4>
          <ul class="space-y-2">
            <li v-for="link in companyLinks" :key="link.href">
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
            <li v-for="link in serviceLinks" :key="link.href">
              <NuxtLink
                :to="localePath(link.href)"
                class="font-body text-xs text-white/60 hover:text-mts-accent transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
            <li v-for="link in dynamicServiceLinks" :key="link.label + link.href">
              <NuxtLink
                :to="localePath(link.href)"
                class="font-body text-xs text-white/50 hover:text-mts-accent transition-colors"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white/30 mb-6">{{ t('footer.sectionCandidates') }}</h4>
          <ul class="space-y-2">
            <li v-for="link in candidateLinks" :key="link.href">
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
        <div class="flex flex-col gap-4 md:flex-row md:flex-wrap md:justify-between md:items-center">
          <p class="font-mono text-[10px] text-white/30 text-center md:text-left">
            {{ t('footer.copyright', { year: currentYear }) }}
          </p>
          <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
            <NuxtLink
              :to="localePath('/privacy')"
              class="font-mono text-[10px] text-white/40 hover:text-mts-accent transition-colors uppercase tracking-[0.06em]"
            >
              {{ t('footer.privacy') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/terms')"
              class="font-mono text-[10px] text-white/40 hover:text-mts-accent transition-colors uppercase tracking-[0.06em]"
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
