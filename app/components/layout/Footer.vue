<script setup lang="ts">
import { Phone } from 'lucide-vue-next'
import type { FooterNavColumn, FooterNavLink } from '~/types'
import { emptyFooterMenuSettings } from '~/utils/emptyFooterMenuSettings'
import { contactSettingsDefaults } from '~/utils/contactSettingsDefaults'
import { contactQuickIcons } from '~/utils/contactQuickIcons'
import { heroOverlaySocialIcons } from '~/utils/heroOverlaySocialIcons'
import { stripLocalePrefix } from '~/utils/stripLocalePrefix'

const currentYear = new Date().getFullYear()
const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()
const api = useMarineApi()

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

const footerContactItems = computed(() =>
  resolvedContacts.value.quick.filter((item) => item.showInFooter !== false),
)
const footerSocialItems = computed(() => resolvedContacts.value.socials ?? [])
const footerDepartments = computed(() =>
  resolvedContacts.value.departments.filter((department) => department.showInFooter === true),
)

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

const { hidden: pageFooterHidden } = usePageFooterHidden()

const showFooter = computed(() => {
  if (pageFooterHidden.value) {
    return false
  }
  const fm = footerMenu.value
  if (fm.hideFooterGlobally) {
    return false
  }
  const path = stripLocalePrefix(route.path).replace(/\/$/, '') || '/'
  for (const raw of fm.hideFooterPaths ?? []) {
    const prefix = (raw.trim().startsWith('/') ? raw.trim() : `/${raw.trim()}`).replace(/\/$/, '') || '/'
    if (path === prefix || (prefix !== '/' && path.startsWith(`${prefix}/`))) {
      return false
    }
  }
  return true
})

function isExternalPath(p: string) {
  return /^https?:\/\//i.test(p.trim())
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim()
}

function linkLabel(link: FooterNavLink): string {
  const l = loc.value
  return stripHtml(link.label[l] || link.label.ru || link.label.en || '')
}

function columnHeading(col: FooterNavColumn): string {
  const l = loc.value
  return stripHtml(col.title[l] || col.title.ru || col.title.en || '')
}
</script>

<template>
  <!-- Футер на brand-surface (`bg-mts-navy`, текст `mts-frost`). -->
  <footer v-if="showFooter" class="relative bg-mts-navy text-mts-frost overflow-hidden">
    <div class="mts-content-wrap py-16 lg:py-20 relative z-10">
      <!-- Лого на мобильных (отдельная строка) -->
      <div class="mb-8 lg:hidden">
        <NuxtLink :to="localePath('/')" class="inline-block mb-4 group">
          <AppLogo img-class="h-8 w-auto max-w-[220px] object-contain object-left opacity-95 group-hover:opacity-100 transition-opacity" />
        </NuxtLink>
        <p class="font-body text-xs text-mts-frost/55 leading-relaxed max-w-xs">
          {{ t('footer.tagline') }}
        </p>
      </div>

      <div class="flex gap-8 lg:gap-12">
        <!-- Логотип (десктоп) -->
        <div class="w-48 xl:w-56 shrink-0 hidden lg:block">
          <NuxtLink :to="localePath('/')" class="inline-block mb-6 group">
            <AppLogo img-class="h-9 w-auto max-w-[min(100%,260px)] object-contain object-left opacity-95 group-hover:opacity-100 transition-opacity" />
          </NuxtLink>
          <p class="font-body text-xs text-mts-frost/55 leading-relaxed">
            {{ t('footer.tagline') }}
          </p>
        </div>

        <!-- Правая группа: CMS + Контакты + Соцсети -->
        <div class="flex flex-wrap lg:flex-nowrap gap-8 lg:gap-10 xl:gap-14 ml-auto w-full lg:w-auto">

        <!-- CMS-колонки (управляются в админке, могут быть скрыты) -->
        <div v-for="(col, ci) in footerMenu.columns.filter(c => !c.hidden)" :key="ci" class="min-w-[120px]">
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-mts-frost/40 mb-6">
            {{ columnHeading(col) }}
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

        <!-- Колонка «Контакты» — всегда видима, редактируется в /admin/contacts -->
        <div class="min-w-[150px] shrink-0">
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-mts-frost/40 mb-6">
            {{ t('footer.sectionContacts') }}
          </h4>
          <ul class="space-y-3">
            <li v-for="(item, idx) in footerContactItems" :key="`quick-${item.label}-${idx}`">
              <component
                :is="item.href ? 'a' : 'div'"
                :href="item.href || undefined"
                :target="isExternalHttpHref(item.href) ? '_blank' : undefined"
                :rel="isExternalHttpHref(item.href) ? 'noopener noreferrer' : undefined"
                class="flex gap-3 text-mts-frost/65"
                :class="item.href ? 'items-center hover:text-primary transition-colors cursor-pointer' : 'items-start'"
              >
                <div class="w-7 h-7 bg-mts-frost/10 flex items-center justify-center flex-shrink-0">
                  <component :is="contactQuickIcons[item.iconKey] ?? Phone" class="w-3.5 h-3.5" />
                </div>
                <span class="font-body text-xs leading-snug">{{ item.value }}</span>
              </component>
            </li>
            <li v-for="(department, idx) in footerDepartments" :key="`department-${department.title}-${idx}`">
              <a
                :href="`mailto:${department.email}`"
                class="flex items-start gap-3 text-mts-frost/65 transition-colors hover:text-primary"
              >
                <div class="w-7 h-7 bg-mts-frost/10 flex items-center justify-center flex-shrink-0">
                  <component :is="contactQuickIcons.mail" class="w-3.5 h-3.5" />
                </div>
                <span class="font-body text-xs leading-snug">
                  <span class="block text-mts-frost/85">{{ department.title }}</span>
                  <span class="block">{{ department.phone }}</span>
                  <span class="block font-mono text-[10px]">{{ department.email }}</span>
                </span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Колонка «Соцсети» — всегда видима, иконки берутся из /admin/contacts -->
        <div v-if="footerSocialItems.length > 0" class="shrink-0">
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-mts-frost/40 mb-6">
            {{ t('footer.sectionSocials') }}
          </h4>
          <div class="flex flex-wrap gap-2">
            <a
              v-for="(item, idx) in footerSocialItems"
              :key="`social-${idx}`"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              class="w-9 h-9 flex items-center justify-center text-mts-frost/60 hover:text-primary transition-colors"
            >
              <component :is="heroOverlaySocialIcons[item.iconKey] ?? Phone" class="w-4 h-4" />
            </a>
          </div>
        </div>

        </div><!-- /right group -->
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
