<script setup lang="ts">
import { Loader2, Mail, Phone } from 'lucide-vue-next'
import type { PageInquiryServiceId, PageInquiryVesselType, SiteContactSettings } from '~/types'
import { contactSettingsDefaults } from '~/utils/contactSettingsDefaults'

/**
 * Поля и подписи синхронизированы с дизайном Figma «Оставьте заявку»:
 * имя, компания, должность (опц.), телефон, email, типы судна (множ.),
 * количество судов, флаг судна, основные порты захода (опц.), требуемые
 * услуги (множ.), особые требования/комментарии (опц.) и согласие с
 * политикой конфиденциальности.
 *
 * Машинно-читаемые id чек-боксов (`vessel_types[]`, `required_services[]`)
 * захардкожены здесь и продублированы:
 *   – на бэкенде: `StorePageInquiryRequest::ALLOWED_*` (валидация);
 *   – в типах фронта: `PageInquiryVesselType` / `PageInquiryServiceId`.
 * Если добавляешь новый id — обнови все три места.
 */
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

const VESSEL_TYPES: PageInquiryVesselType[] = [
  'dry_cargo',
  'tanker',
  'container',
  'tug',
  'service',
  'other',
]
const REQUIRED_SERVICES: PageInquiryServiceId[] = [
  'technical',
  'crewing',
  'audit',
  'commercial',
  'insurance',
  'other',
]

interface InquiryFormState {
  name: string
  company: string
  position: string
  phone: string
  email: string
  vesselTypes: PageInquiryVesselType[]
  vesselsCount: number | null
  vesselFlag: string
  mainPorts: string
  requiredServices: PageInquiryServiceId[]
  message: string
  consent: boolean
}

function makeEmptyState(): InquiryFormState {
  return {
    name: '',
    company: '',
    position: '',
    phone: '',
    email: '',
    vesselTypes: [],
    vesselsCount: null,
    vesselFlag: '',
    mainPorts: '',
    requiredServices: [],
    message: '',
    consent: false,
  }
}

const form = ref<InquiryFormState>(makeEmptyState())

const sending = ref(false)
const formError = ref<string | null>(null)
const formSuccess = ref(false)

/**
 * Контакты для правой колонки («Срочно?» / «Не хотите заполнять форму?»).
 * Тянем из `/contact-settings` (настраивается в админке), а до прихода
 * ответа подставляем дефолты из `contactSettingsDefaults`, чтобы блок
 * никогда не отображался пустым (важно для SSR).
 */
const contacts = ref<SiteContactSettings>(contactSettingsDefaults)
onMounted(async () => {
  try {
    contacts.value = await api.contactSettings.get()
  } catch {
    // Игнорируем — оставляем дефолтные значения.
  }
})

const phoneContact = computed(() =>
  contacts.value.quick.find((q) => q.iconKey === 'phone') ?? null,
)
const emailContact = computed(() =>
  contacts.value.quick.find((q) => q.iconKey === 'mail') ?? null,
)

async function onSubmit() {
  formError.value = null
  formSuccess.value = false

  if (form.value.vesselTypes.length === 0 || form.value.requiredServices.length === 0) {
    formError.value = t('pages.pageInquiry.error')
    return
  }
  if (!form.value.vesselsCount || form.value.vesselsCount < 1) {
    formError.value = t('pages.pageInquiry.error')
    return
  }
  if (!form.value.consent) {
    return
  }

  sending.value = true
  try {
    await api.pageInquiries.submit({
      name: form.value.name.trim(),
      company: form.value.company.trim(),
      position: form.value.position.trim() || null,
      phone: form.value.phone.trim(),
      email: form.value.email.trim(),
      vesselTypes: form.value.vesselTypes,
      vesselsCount: form.value.vesselsCount,
      vesselFlag: form.value.vesselFlag.trim(),
      mainPorts: form.value.mainPorts.trim() || null,
      requiredServices: form.value.requiredServices,
      message: form.value.message.trim() || null,
      sourcePage: props.sourcePage,
      consent: form.value.consent,
    })
    formSuccess.value = true
    form.value = makeEmptyState()
  } catch {
    formError.value = t('pages.pageInquiry.error')
  } finally {
    sending.value = false
  }
}

function vesselTypeLabel(id: PageInquiryVesselType): string {
  return t(`pages.pageInquiry.vesselTypes.${id}`)
}
function requiredServiceLabel(id: PageInquiryServiceId): string {
  return t(`pages.pageInquiry.requiredServices.${id}`)
}

/**
 * Стиль «подчёркнутая линия» из дизайна Figma — выносим утилиты в
 * константы, чтобы не дублировать длинные `class`-строки на каждом из
 * восьми полей формы и не упираться в Tailwind v4: `@apply` в
 * `<style scoped>` требует `@reference` к проектным токенам.
 *
 * Меняй эти константы — и стиль обновится сразу для всех инпутов.
 */
const FIELD_LABEL_CLASS = 'block font-body text-xs text-mts-text-secondary'
const FIELD_INPUT_CLASS =
  'mt-1.5 block w-full border-0 border-b border-mts-border bg-transparent px-0 py-2 font-body text-sm text-mts-text placeholder:text-mts-text-muted focus:border-mts-accent focus:outline-none focus:ring-0'
const FIELD_GROUP_LABEL_CLASS = 'mb-3 block font-body text-sm text-mts-text'
</script>

<template>
  <section
    id="page-inquiry"
    class="relative scroll-mt-24 overflow-hidden border-t border-mts-border bg-mts-surface"
    :class="hideIntro ? 'py-16 lg:py-20' : 'py-24 lg:py-32'"
  >
    <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
      <div class="mx-auto w-full max-w-4xl">
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

        <div class="border border-mts-border bg-mts-bg p-8 lg:p-10">
          <div class="mb-8 text-center">
            <h3 class="font-display text-2xl text-mts-text lg:text-3xl">
              {{ t('pages.pageInquiry.formTitle') }}
            </h3>
            <p class="mt-3 font-body text-sm font-semibold text-mts-text lg:text-base">
              {{ t('pages.pageInquiry.formSubtitle') }}
            </p>
            <p class="mt-2 font-body text-sm text-mts-text-secondary">
              {{ t('pages.pageInquiry.formLead') }}
            </p>
          </div>

          <form class="space-y-6" @submit.prevent="onSubmit">
            <!-- Контакты -->
            <div class="space-y-5">
              <div>
                <label :for="`pi-${sourcePage}-name`" :class="FIELD_LABEL_CLASS">{{
                  t('pages.pageInquiry.labelName')
                }}</label>
                <input
                  :id="`pi-${sourcePage}-name`"
                  v-model="form.name"
                  required
                  type="text"
                  autocomplete="name"
                  :class="FIELD_INPUT_CLASS"
                />
              </div>
              <div>
                <label :for="`pi-${sourcePage}-company`" :class="FIELD_LABEL_CLASS">{{
                  t('pages.pageInquiry.labelCompany')
                }}</label>
                <input
                  :id="`pi-${sourcePage}-company`"
                  v-model="form.company"
                  required
                  type="text"
                  autocomplete="organization"
                  :class="FIELD_INPUT_CLASS"
                />
              </div>
              <div>
                <label :for="`pi-${sourcePage}-position`" :class="FIELD_LABEL_CLASS">{{
                  t('pages.pageInquiry.labelPosition')
                }}</label>
                <input
                  :id="`pi-${sourcePage}-position`"
                  v-model="form.position"
                  type="text"
                  autocomplete="organization-title"
                  :class="FIELD_INPUT_CLASS"
                />
              </div>
              <div>
                <label :for="`pi-${sourcePage}-phone`" :class="FIELD_LABEL_CLASS">{{
                  t('pages.pageInquiry.labelPhone')
                }}</label>
                <input
                  :id="`pi-${sourcePage}-phone`"
                  v-model="form.phone"
                  required
                  type="tel"
                  autocomplete="tel"
                  :class="FIELD_INPUT_CLASS"
                />
              </div>
              <div>
                <label :for="`pi-${sourcePage}-email`" :class="FIELD_LABEL_CLASS">{{
                  t('pages.pageInquiry.labelEmail')
                }}</label>
                <input
                  :id="`pi-${sourcePage}-email`"
                  v-model="form.email"
                  required
                  type="email"
                  autocomplete="email"
                  :class="FIELD_INPUT_CLASS"
                />
              </div>
            </div>

            <!-- Тип судна -->
            <fieldset>
              <legend :class="FIELD_GROUP_LABEL_CLASS">
                {{ t('pages.pageInquiry.labelVesselTypes') }}
              </legend>
              <div class="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <CommonMarinCheckbox
                  v-for="id in VESSEL_TYPES"
                  :key="id"
                  v-model="form.vesselTypes"
                  :value="id"
                  :label="vesselTypeLabel(id)"
                />
              </div>
            </fieldset>

            <div class="space-y-5">
              <div>
                <label :for="`pi-${sourcePage}-vcount`" :class="FIELD_LABEL_CLASS">{{
                  t('pages.pageInquiry.labelVesselsCount')
                }}</label>
                <CommonMarinNumberInput
                  :id="`pi-${sourcePage}-vcount`"
                  v-model="form.vesselsCount"
                  required
                  :min="1"
                  :max="100000"
                  :step="1"
                  :decrement-label="t('pages.pageInquiry.labelVesselsCount')"
                  :increment-label="t('pages.pageInquiry.labelVesselsCount')"
                />
              </div>
              <div>
                <label :for="`pi-${sourcePage}-flag`" :class="FIELD_LABEL_CLASS">{{
                  t('pages.pageInquiry.labelVesselFlag')
                }}</label>
                <input
                  :id="`pi-${sourcePage}-flag`"
                  v-model="form.vesselFlag"
                  required
                  type="text"
                  :class="FIELD_INPUT_CLASS"
                />
              </div>
              <div>
                <label :for="`pi-${sourcePage}-ports`" :class="FIELD_LABEL_CLASS">{{
                  t('pages.pageInquiry.labelMainPorts')
                }}</label>
                <input
                  :id="`pi-${sourcePage}-ports`"
                  v-model="form.mainPorts"
                  type="text"
                  :class="FIELD_INPUT_CLASS"
                />
              </div>
            </div>

            <!-- Требуемые услуги -->
            <fieldset>
              <legend :class="FIELD_GROUP_LABEL_CLASS">
                {{ t('pages.pageInquiry.labelRequiredServices') }}
              </legend>
              <div class="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <CommonMarinCheckbox
                  v-for="id in REQUIRED_SERVICES"
                  :key="id"
                  v-model="form.requiredServices"
                  :value="id"
                  :label="requiredServiceLabel(id)"
                  align="start"
                />
              </div>
            </fieldset>

            <div>
              <label :for="`pi-${sourcePage}-message`" :class="FIELD_LABEL_CLASS">{{
                t('pages.pageInquiry.labelMessage')
              }}</label>
              <textarea
                :id="`pi-${sourcePage}-message`"
                v-model="form.message"
                rows="4"
                :class="[FIELD_INPUT_CLASS, 'resize-y']"
                :placeholder="t('pages.pageInquiry.placeholderMessage')"
              />
            </div>

            <CommonMarinCheckbox v-model="form.consent" required align="start">
              <span class="font-body text-xs leading-snug text-mts-text-secondary">
                {{ t('pages.pageInquiry.consent')
                }}<NuxtLink to="/privacy" class="text-mts-accent hover:underline">{{
                  t('pages.pageInquiry.consentLink')
                }}</NuxtLink>
              </span>
            </CommonMarinCheckbox>

            <p v-if="formError" class="font-body text-sm text-red-500">{{ formError }}</p>
            <p v-if="formSuccess" class="font-body text-sm text-green-500">
              {{ t('pages.pageInquiry.success') }}
            </p>

            <div class="flex justify-center pt-2">
              <button
                type="submit"
                :disabled="sending"
                class="btn-primary inline-flex min-w-[260px] justify-center"
              >
                <Loader2 v-if="sending" class="h-4 w-4 animate-spin" />
                <span v-if="sending">{{ t('pages.common.sending') }}</span>
                <span v-else>{{ t('pages.pageInquiry.submit') }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Что будет после отправки + Срочно? / Email -->
        <div class="mt-8 grid gap-6 lg:grid-cols-2">
          <div class="border border-mts-border bg-mts-bg p-8">
            <h4 class="font-display text-xl text-mts-text">
              {{ t('pages.pageInquiry.afterTitle') }}
            </h4>
            <ol class="mt-6 space-y-5">
              <li
                v-for="(step, idx) in [
                  t('pages.pageInquiry.afterStep1'),
                  t('pages.pageInquiry.afterStep2'),
                  t('pages.pageInquiry.afterStep3'),
                ]"
                :key="idx"
                class="flex items-start gap-4"
              >
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-mts-accent font-display text-base text-mts-accent"
                >
                  {{ idx + 1 }}
                </span>
                <span class="font-body text-sm leading-relaxed text-mts-text">{{ step }}</span>
              </li>
            </ol>
          </div>

          <div class="border border-mts-border bg-mts-bg p-8">
            <h4 class="font-display text-xl text-mts-text">
              {{ t('pages.pageInquiry.urgentTitle') }}
            </h4>
            <p class="mt-3 font-body text-sm text-mts-text-secondary">
              {{ t('pages.pageInquiry.urgentLead') }}
            </p>
            <a
              v-if="phoneContact"
              :href="phoneContact.href ?? `tel:${phoneContact.value.replace(/[^+\d]/g, '')}`"
              class="mt-2 inline-flex items-center gap-2 font-display text-lg text-mts-accent hover:underline"
            >
              <Phone class="h-4 w-4" />
              {{ phoneContact.value }}
            </a>

            <h4 class="mt-8 font-display text-xl text-mts-text">
              {{ t('pages.pageInquiry.noFormTitle') }}
            </h4>
            <p class="mt-3 font-body text-sm text-mts-text-secondary">
              {{ t('pages.pageInquiry.noFormLead') }}
            </p>
            <a
              v-if="emailContact"
              :href="emailContact.href ?? `mailto:${emailContact.value}`"
              class="mt-2 inline-flex items-center gap-2 font-body text-base text-mts-accent hover:underline"
            >
              <Mail class="h-4 w-4" />
              {{ emailContact.value }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
