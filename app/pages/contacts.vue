<script setup lang="ts">
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { ContactQuickIconKey, ContactsPageData, MarineContentLocale } from '~/types'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ListingHeroShell from '~/components/common/ListingHeroShell.vue'
import { contactSettingsDefaults } from '~/utils/contactSettingsDefaults'
import { defaultContactsData } from '~/utils/pageDefaults'

useSiteSeoMeta('contacts')

const { t, locale } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const { data: cmsPage } = await useAsyncData('contacts-page-cms', async () => {
  try { return await api.contentPages.getPublicBySlug('contacts-page') } catch { return null }
}, { server: true })

const cms = computed<ContactsPageData>(() => {
  const body = cmsPage.value?.body
  if (body) { try { const p = JSON.parse(body); if (p?.hero) return p } catch { /* */ } }
  return defaultContactsData(loc.value)
})

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.contacts'), to: '/contacts' }),
)

const { data: contactSettings, pending: contactsPending } = await useAsyncData(
  'contact-settings',
  async () => {
    try {
      return await api.contactSettings.get()
    } catch {
      return null
    }
  },
  {
    default: () => null,
    server: true,
  },
)

const resolvedContacts = computed(() => contactSettings.value ?? contactSettingsDefaults)

const quickIcons: Record<ContactQuickIconKey, Component> = {
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
  clock: Clock,
}

const form = ref({
  name: '',
  email: '',
  phone: '',
  message: '',
})

const sending = ref(false)
const formError = ref<string | null>(null)
const formSuccess = ref(false)

async function submitFeedback() {
  formError.value = null
  formSuccess.value = false
  sending.value = true
  try {
    await api.feedback.submit({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim() || null,
      message: form.value.message.trim(),
    })
    formSuccess.value = true
    form.value = { name: '', email: '', phone: '', message: '' }
  } catch {
    formError.value = t('pages.contacts.formError')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="bg-mts-bg">
    <ListingHeroShell :hero-image="cms.heroImage">
      <div class="max-w-3xl">
        <Breadcrumbs :items="crumbItems" />
        <div class="mb-4 flex items-center gap-3">
          <div class="h-px w-6 bg-mts-accent" />
          <span class="section-label">{{ t('pages.contacts.heroEyebrow') }}</span>
        </div>
        <h1 class="font-display mb-6 text-4xl leading-tight text-mts-text lg:text-5xl">
          {{ cms.hero.title }}<span class="text-mts-accent">{{ cms.hero.titleAccent }}</span>
        </h1>
        <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
        <p class="font-body text-lg leading-relaxed text-mts-text-secondary">
          {{ cms.hero.lead }}
        </p>
      </div>
    </ListingHeroShell>

    <section class="relative py-24 overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 class="font-display text-2xl text-mts-text mb-8">{{ cms.infoTitle }}</h2>
            <div v-if="contactsPending" class="flex items-center gap-2 text-mts-text-secondary font-body text-sm mb-12">
              <Loader2 class="h-4 w-4 animate-spin" />
              {{ t('pages.common.loading') }}
            </div>
            <div v-else class="space-y-4 mb-12">
              <component
                :is="item.href ? 'a' : 'div'"
                v-for="(item, idx) in resolvedContacts.quick"
                :key="`${item.label}-${idx}`"
                :href="item.href || undefined"
                class="flex items-center gap-4 p-4 bg-white border border-mts-border hover:border-mts-accent/30 transition-all"
                :class="item.href ? '' : 'cursor-default'"
              >
                <div class="w-10 h-10 bg-mts-bg border border-mts-border flex items-center justify-center">
                  <component :is="quickIcons[item.iconKey] ?? Phone" class="w-4 h-4 text-mts-accent" />
                </div>
                <div>
                  <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{ item.label }}</p>
                  <p class="font-body text-sm text-mts-text">{{ item.value }}</p>
                </div>
              </component>
            </div>
          </div>
          <div class="card-tech border border-mts-border p-8">
            <h3 class="font-display mb-4 flex items-center gap-2 text-lg text-mts-text">
              <Send class="h-5 w-5 text-mts-accent" />
              {{ cms.formTitle }}
            </h3>
            <p class="mb-6 font-body text-sm text-mts-text-secondary">
              {{ cms.formLead }}
            </p>
            <form class="space-y-4" @submit.prevent="submitFeedback">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.contacts.labelName')
                }}</label>
                <input
                  v-model="form.name"
                  required
                  type="text"
                  autocomplete="name"
                  class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.contacts.labelEmail')
                }}</label>
                <input
                  v-model="form.email"
                  required
                  type="email"
                  autocomplete="email"
                  class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.contacts.labelPhone')
                }}</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  autocomplete="tel"
                  class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.contacts.labelMessage')
                }}</label>
                <textarea
                  v-model="form.message"
                  required
                  rows="5"
                  class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                  :placeholder="t('pages.contacts.placeholderMessage')"
                />
              </div>
              <p v-if="formError" class="font-body text-sm text-red-600">{{ formError }}</p>
              <p v-if="formSuccess" class="font-body text-sm text-green-700">
                {{ t('pages.contacts.formSuccess') }}
              </p>
              <button
                type="submit"
                :disabled="sending"
                class="btn-primary inline-flex w-full justify-center sm:w-auto sm:min-w-[200px]"
              >
                <Loader2 v-if="sending" class="h-4 w-4 animate-spin" />
                <span v-if="sending">{{ t('pages.common.sending') }}</span>
                <span v-else>{{ t('pages.contacts.submit') }}</span>
              </button>
            </form>
          </div>
        </div>

        <div class="mt-16">
          <h2 class="font-display text-2xl text-mts-text mb-8">{{ cms.officesTitle }}</h2>
          <div class="grid md:grid-cols-3 gap-6">
            <div
              v-for="(o, oi) in resolvedContacts.offices"
              :key="`${o.city}-${o.country}-${oi}`"
              class="card-tech p-6 border border-mts-border"
            >
              <p class="font-mono text-xs text-mts-accent mb-1">{{ o.country }}</p>
              <h3 class="font-display text-lg text-mts-text mb-2">{{ o.city }}</h3>
              <p class="font-body text-sm text-mts-text-secondary mb-4">{{ o.address }}</p>
              <p class="font-body text-sm">{{ o.phone }}</p>
              <p class="font-mono text-xs text-mts-accent mt-2">{{ o.email }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <CommonPageInquiryForm v-if="cms.showInquiryForm" source-page="contacts" />
  </div>
</template>
