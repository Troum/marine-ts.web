<script setup lang="ts">
import { ClipboardList, Loader2 } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    /** Идентификатор страницы для админки (например home, about, crewing-management, services/hull). */
    sourcePage: string
    /** Скрыть верхний блок (метка + заголовок + лид) — для страницы `/request`, где тот же текст уже в шаблоне страницы. */
    hideIntro?: boolean
  }>(),
  { hideIntro: false },
)

const { t } = useI18n()
const api = useMarineApi()

const form = ref({
  name: '',
  email: '',
  phone: '',
  company: '',
  vesselName: '',
  imo: '',
  message: '',
})

const sending = ref(false)
const formError = ref<string | null>(null)
const formSuccess = ref(false)

async function onSubmit() {
  formError.value = null
  formSuccess.value = false
  sending.value = true
  try {
    await api.pageInquiries.submit({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim() || null,
      company: form.value.company.trim() || null,
      vesselName: form.value.vesselName.trim() || null,
      imo: form.value.imo.trim() || null,
      message: form.value.message.trim(),
      sourcePage: props.sourcePage,
    })
    formSuccess.value = true
    form.value = {
      name: '',
      email: '',
      phone: '',
      company: '',
      vesselName: '',
      imo: '',
      message: '',
    }
  } catch {
    formError.value = t('pages.pageInquiry.error')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section
    id="page-inquiry"
    class="relative scroll-mt-24 overflow-hidden border-t border-mts-border bg-white"
    :class="hideIntro ? 'py-16 lg:py-20' : 'py-24 lg:py-32'"
  >
    <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
      <div class="mx-auto w-full max-w-3xl">
        <div v-if="!hideIntro" class="mb-10">
          <div class="mb-4 flex items-center gap-3">
            <div class="h-px w-8 bg-mts-accent" />
            <span class="section-label">{{ t('pages.pageInquiry.sectionLabel') }}</span>
          </div>
          <h2 class="font-display text-3xl leading-tight text-mts-text lg:text-4xl">
            {{ t('pages.pageInquiry.title') }}<span class="text-mts-accent">{{ t('pages.pageInquiry.titleAccent') }}</span
            >{{ t('pages.pageInquiry.titleEnd') }}
          </h2>
          <div class="mb-6 mt-6 h-0.5 w-12 bg-mts-accent" />
          <p class="font-body text-lg leading-relaxed text-mts-text-secondary">
            {{ t('pages.pageInquiry.lead') }}
          </p>
        </div>

        <div class="card-tech border border-mts-border p-8">
        <h3 class="font-display mb-4 flex items-center gap-2 text-lg text-mts-text">
          <ClipboardList class="h-5 w-5 text-mts-accent" />
          {{ t('pages.pageInquiry.formTitle') }}
        </h3>
        <p class="mb-6 font-body text-sm text-mts-text-secondary">
          {{ t('pages.pageInquiry.formLead') }}
        </p>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                t('pages.pageInquiry.labelName')
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
                t('pages.pageInquiry.labelEmail')
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
                t('pages.pageInquiry.labelPhone')
              }}</label>
              <input
                v-model="form.phone"
                type="tel"
                autocomplete="tel"
                class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                t('pages.pageInquiry.labelCompany')
              }}</label>
              <input
                v-model="form.company"
                type="text"
                autocomplete="organization"
                class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                t('pages.pageInquiry.labelVessel')
              }}</label>
              <input
                v-model="form.vesselName"
                type="text"
                class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                t('pages.pageInquiry.labelImo')
              }}</label>
              <input
                v-model="form.imo"
                type="text"
                class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                t('pages.pageInquiry.labelMessage')
              }}</label>
              <textarea
                v-model="form.message"
                required
                rows="5"
                class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                :placeholder="t('pages.pageInquiry.placeholderMessage')"
              />
            </div>
          </div>
          <p v-if="formError" class="font-body text-sm text-red-600">{{ formError }}</p>
          <p v-if="formSuccess" class="font-body text-sm text-green-700">
            {{ t('pages.pageInquiry.success') }}
          </p>
          <button
            type="submit"
            :disabled="sending"
            class="btn-primary inline-flex w-full justify-center sm:w-auto sm:min-w-[200px]"
          >
            <Loader2 v-if="sending" class="h-4 w-4 animate-spin" />
            <span v-if="sending">{{ t('pages.common.sending') }}</span>
            <span v-else>{{ t('pages.pageInquiry.submit') }}</span>
          </button>
        </form>
        </div>
      </div>
    </div>
  </section>
</template>
