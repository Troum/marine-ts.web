<script setup lang="ts">
import { Phone, Send, Loader2 } from 'lucide-vue-next'
import type { ContactsPageData, MarineContentLocale } from '~/types'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ListingHeroShell from '~/components/common/ListingHeroShell.vue'
import { contactSettingsDefaults } from '~/utils/contactSettingsDefaults'
import { contactQuickIcons } from '~/utils/contactQuickIcons'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { CONTACTS_SECTION_DEFAULT_ORDER, defaultContactsData, mergeContactsPageData } from '~/utils/pageDefaults'
import { isSectionVisible, resolveSectionOrder } from '~/utils/sectionVisibility'

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
  if (body) {
    try {
      const p = JSON.parse(body) as unknown
      if (p && typeof p === 'object' && 'hero' in (p as object)) {
        return mergeContactsPageData(loc.value, p)
      }
    } catch {
      /* */
    }
  }
  return defaultContactsData(loc.value)
})

const { setHidden: setFooterHidden } = usePageFooterHidden()
watchEffect(() => { setFooterHidden(cms.value?.hideFooter ?? false) })

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
const officesTitle = computed(() => cms.value.officesTitle || (loc.value === 'en' ? 'Offices' : 'Офисы'))
const departmentsTitle = computed(() => (loc.value === 'en' ? 'Departments' : 'Отделы'))

const form = ref({
  name: '',
  email: '',
  phone: '',
  message: '',
})

const sending = ref(false)
const formError = ref<string | null>(null)
const formSuccess = ref(false)

/**
 * Эффективный порядок секций (после hero) с учётом сохранённого `sectionOrder`,
 * актуальных кастомных секций и дефолтов.
 */
const sectionOrderEffective = computed(() =>
  resolveSectionOrder(cms.value.sectionOrder, CONTACTS_SECTION_DEFAULT_ORDER, cms.value.customSections),
)

function sectionShown(id: string): boolean {
  return isSectionVisible(cms.value.sectionVisibility, id)
}

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
  <div class="bg-white">
    <ListingHeroShell :hero-image="cms.heroImage">
      <div class="max-w-7xl">
        <Breadcrumbs :items="crumbItems" />
        <div class="mb-4 flex items-center gap-3">
          <div class="h-px w-6 bg-primary" />
          <span class="section-label">{{ t('pages.contacts.heroEyebrow') }}</span>
        </div>
        <h1 class="font-display mb-6 text-3xl leading-tight text-body lg:text-4xl">
          <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
        </h1>
        <div class="mb-6 h-0.5 w-12 bg-primary" />
        <p class="font-body text-lg leading-relaxed text-muted">
          <ThemedContentString :content="cms.hero.lead" />
        </p>
      </div>
    </ListingHeroShell>

    <template v-for="sid in sectionOrderEffective" :key="sid">
      <section v-if="sid === 'contacts' && sectionShown('contacts')" class="relative py-24 overflow-hidden">
      <div class="mts-content-wrap relative z-10">
        <div class="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 class="font-display text-xl text-body mb-8"><ThemedContentString :content="cms.infoTitle" /></h2>
            <div v-if="contactsPending" class="flex items-center gap-2 text-muted font-body text-sm mb-12">
              <Loader2 class="h-4 w-4 animate-spin" />
              {{ t('pages.common.loading') }}
            </div>
            <div v-else class="space-y-4 mb-12">
              <component
                :is="item.href ? 'a' : 'div'"
                v-for="(item, idx) in resolvedContacts.quick"
                :key="`${item.label}-${idx}`"
                :href="item.href || undefined"
                class="public-card-interactive flex items-center gap-4 p-4"
                :class="item.href ? '' : 'cursor-default'"
              >
                <div class="w-10 h-10 bg-white border border-border flex items-center justify-center">
                  <component :is="contactQuickIcons[item.iconKey] ?? Phone" class="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p class="font-mono text-[10px] uppercase tracking-wide text-muted">{{ item.label }}</p>
                  <p class="font-body text-sm text-body">{{ item.value }}</p>
                </div>
              </component>
            </div>

            <div v-if="resolvedContacts.departments.length" class="mb-12">
              <h3 class="font-display text-lg text-body mb-4">{{ departmentsTitle }}</h3>
              <div class="grid gap-4">
                <div
                  v-for="(department, idx) in resolvedContacts.departments"
                  :key="`${department.title}-${idx}`"
                  class="public-card p-5"
                >
                  <h4 class="font-display text-base text-body">{{ department.title }}</h4>
                  <p class="mt-3 font-body text-sm text-muted">{{ department.phone }}</p>
                  <a
                    :href="`mailto:${department.email}`"
                    class="mt-2 inline-flex font-mono text-xs text-primary hover:underline"
                  >
                    {{ department.email }}
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="card-tech w-full p-8">
            <h3 class="font-display mb-4 flex items-center gap-2 text-lg text-body">
              <Send class="h-5 w-5 text-primary" />
              <ThemedContentString :content="cms.formTitle" />
            </h3>
            <p class="mb-6 font-body text-sm text-muted">
              <ThemedContentString :content="cms.formLead" />
            </p>
            <form class="space-y-4" @submit.prevent="submitFeedback">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.contacts.labelName')
                }}</label>
                <input
                  v-model="form.name"
                  required
                  type="text"
                  autocomplete="name"
                  class="form-input"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.contacts.labelEmail')
                }}</label>
                <input
                  v-model="form.email"
                  required
                  type="email"
                  autocomplete="email"
                  class="form-input"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.contacts.labelPhone')
                }}</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  autocomplete="tel"
                  class="form-input"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.contacts.labelMessage')
                }}</label>
                <textarea
                  v-model="form.message"
                  required
                  rows="5"
                  class="form-input"
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
          <h2 class="font-display text-xl text-body mb-8"><ThemedContentString :content="officesTitle" /></h2>
          <div class="grid md:grid-cols-3 gap-6">
            <div
              v-for="(o, oi) in resolvedContacts.offices"
              :key="`${o.city}-${o.country}-${oi}`"
              class="card-tech p-6"
            >
              <p class="font-mono text-xs text-primary mb-1">{{ o.country }}</p>
              <h3 class="font-display text-lg text-body mb-2">{{ o.city }}</h3>
              <p class="font-body text-sm text-muted mb-4">{{ o.address }}</p>
              <p class="font-body text-sm">{{ o.phone }}</p>
              <p class="font-mono text-xs text-primary mt-2">{{ o.email }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

      <CommonCustomPageSectionsRender
        v-else-if="sid.startsWith('custom:') && sectionShown(sid)"
        :sections="(cms.customSections ?? []).filter((s) => `custom:${s.id}` === sid)"
        :page-crumb-items="crumbItems"
      />
    </template>

    <CommonPageInquiryForm
      v-if="cms.showInquiryForm"
      source-page="contacts"
      :hide-intro="cms.hideInquiryFormIntro === true"
      :hide-form-card-heading="cms.hideInquiryFormCardHeading === true"
    />
  </div>
</template>
