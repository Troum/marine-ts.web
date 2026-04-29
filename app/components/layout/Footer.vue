<script setup lang="ts">
import { Phone, Mail, MapPin, ExternalLink, Clock } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { ContactQuickIconKey, FooterNavColumn, FooterNavLink } from '~/types'
import { emptyFooterMenuSettings } from '~/utils/emptyFooterMenuSettings'
import { contactSettingsDefaults } from '~/utils/contactSettingsDefaults'

const currentYear = new Date().getFullYear()
const localePath = useLocalePath()
const { t, locale } = useI18n()
const api = useMarineApi()

const quickIcons: Record<ContactQuickIconKey, Component> = {
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
  clock: Clock,
  link: ExternalLink,
}

const { data: contactSettings } = await useAsyncData(
  'contact-settings',
  async () => {
    try {
      return await api.contactSettings.get()
    } catch {
      return null
    }
  },
  { default: () => null, server: true },
)

const resolvedContacts = computed(() => contactSettings.value ?? contactSettingsDefaults)

function isExternalHttpHref(href: string | null) {
  return href != null && /^https?:\/\//i.test(href.trim())
}

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru'))

const { data: footerRemote, refresh: refreshFooterNav } = await useAsyncData(
  'site-footer-nav',
  async () => {
    try {
      return await api.footerNavigationSettings.get()
    } catch {
      return null
    }
  },
)

onMounted(async () => {
  if (footerRemote.value == null) {
    await refreshFooterNav()
  }
})

const footerMenu = computed(() => footerRemote.value ?? emptyFooterMenuSettings())

function isExternalPath(p: string) {
  return /^https?:\/\//i.test(p.trim())
}

function linkLabel(link: FooterNavLink): string {
  const l = loc.value
  return link.label[l] || link.label.ru || link.label.en || ''
}

function columnHeading(col: FooterNavColumn): string {
  const l = loc.value
  return col.title[l] || col.title.ru || col.title.en || ''
}
</script>

<template>
  <!-- Футер на brand-surface (`bg-mts-navy`, текст `mts-frost`). -->
  <footer class="relative bg-mts-navy text-mts-frost overflow-hidden">
    <div class="mts-content-wrap py-16 lg:py-20 relative z-10">
      <div class="grid md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
        <div class="md:col-span-2 lg:col-span-2">
          <NuxtLink :to="localePath('/')" class="inline-block mb-6 group">
            <AppLogo img-class="h-9 w-auto max-w-[min(100%,260px)] object-contain object-left opacity-95 group-hover:opacity-100 transition-opacity" />
          </NuxtLink>
          <p class="font-body text-xs text-mts-frost/55 leading-relaxed">
            {{ t('footer.tagline') }}
          </p>
        </div>

        <div v-for="(col, ci) in footerMenu.columns" :key="ci">
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-mts-frost/40 mb-6">
            <span v-html="columnHeading(col)"></span>
          </h4>
          <ul class="space-y-2">
            <li v-for="(link, li) in col.links" :key="`${ci}-${li}-${link.path}`">
              <a
                v-if="isExternalPath(link.path)"
                :href="link.path"
                target="_blank"
                rel="noopener noreferrer"
                class="font-body text-xs text-mts-frost/65 hover:text-primary transition-colors"
              >
                {{ linkLabel(link) }}
              </a>
              <NuxtLink
                v-else
                :to="localePath(link.path)"
                class="font-body text-xs text-mts-frost/65 hover:text-primary transition-colors"
              >
                {{ linkLabel(link) }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-mts-frost/40 mb-6">{{ t('footer.sectionContacts') }}</h4>
          <ul class="space-y-3">
            <li v-for="(item, idx) in resolvedContacts.quick" :key="`${item.label}-${idx}`">
              <component
                :is="item.href ? 'a' : 'div'"
                :href="item.href || undefined"
                :target="isExternalHttpHref(item.href) ? '_blank' : undefined"
                :rel="isExternalHttpHref(item.href) ? 'noopener noreferrer' : undefined"
                class="flex gap-3 text-mts-frost/65"
                :class="[
                  item.href ? 'items-center hover:text-primary transition-colors cursor-pointer' : 'items-start',
                ]"
              >
                <div class="w-7 h-7 bg-mts-frost/10 flex items-center justify-center flex-shrink-0">
                  <component :is="quickIcons[item.iconKey] ?? Phone" class="w-3.5 h-3.5" />
                </div>
                <span class="font-body text-xs leading-snug">{{ item.value }}</span>
              </component>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-16 pt-8 border-t border-mts-frost/10">
        <div class="flex flex-col gap-4 md:flex-row md:flex-wrap md:justify-between md:items-center">
          <p class="font-mono text-[10px] text-mts-frost/40 text-center md:text-left">
            {{ t('footer.copyright', { year: currentYear }) }}
          </p>
          <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
            <template v-for="(link, i) in footerMenu.legal" :key="`legal-${i}-${link.path}`">
              <a
                v-if="isExternalPath(link.path)"
                :href="link.path"
                target="_blank"
                rel="noopener noreferrer"
                class="font-mono text-[10px] text-mts-frost/45 hover:text-primary transition-colors uppercase tracking-[0.06em]"
              >
                {{ linkLabel(link) }}
              </a>
              <NuxtLink
                v-else
                :to="localePath(link.path)"
                class="font-mono text-[10px] text-mts-frost/45 hover:text-primary transition-colors uppercase tracking-[0.06em]"
              >
                {{ linkLabel(link) }}
              </NuxtLink>
            </template>
            <NuxtLink to="/admin" class="font-mono text-[10px] text-mts-frost/40 hover:text-primary transition-colors">
              {{ t('footer.admin') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
