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
    /** Скрыть верхний блок (метка «Заявка», заголовок, лид) — `/request` или `hideInquiryFormIntro` в CMS листингов и line-страниц. */
    hideIntro?: boolean
    /** Скрыть заголовок, подзаголовок и лид внутри белой карточки над полями (см. `hideInquiryFormCardHeading` в CMS line-страниц). */
    hideFormCardHeading?: boolean
  }>(),
  { hideIntro: false, hideFormCardHeading: false },
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
const VESSEL_TYPE_SET = new Set<PageInquiryVesselType>(VESSEL_TYPES)
const REQUIRED_SERVICE_SET = new Set<PageInquiryServiceId>(REQUIRED_SERVICES)

const FIELD_LIMITS = {
  name: 255,
  company: 255,
  position: 255,
  phone: 64,
  email: 255,
  vesselFlag: 255,
  mainPorts: 1000,
  message: 10000,
  sourcePage: 255,
}

const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
const validationErrors = ref<string[]>([])
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
const emailContact = computed(() => {
  const fromQuick = contacts.value.quick.find((q) => {
    const value = q.value.trim()
    const href = q.href?.trim() ?? ''
    return (
      q.iconKey === 'mail' ||
      href.toLowerCase().startsWith('mailto:') ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )
  })
  if (fromQuick) {
    return fromQuick
  }
  const officeEmail = contacts.value.offices.find((office) => office.email.trim())?.email.trim()
  return officeEmail
    ? { iconKey: 'mail' as const, label: 'Email', value: officeEmail, href: `mailto:${officeEmail}` }
    : null
})

function trimmedForm() {
  return {
    name: form.value.name.trim(),
    company: form.value.company.trim(),
    position: form.value.position.trim(),
    phone: form.value.phone.trim(),
    email: form.value.email.trim(),
    vesselTypes: form.value.vesselTypes.filter((v) => VESSEL_TYPE_SET.has(v)),
    vesselsCount: form.value.vesselsCount,
    vesselFlag: form.value.vesselFlag.trim(),
    mainPorts: form.value.mainPorts.trim(),
    requiredServices: form.value.requiredServices.filter((v) => REQUIRED_SERVICE_SET.has(v)),
    message: form.value.message.trim(),
    sourcePage: props.sourcePage.trim(),
    consent: form.value.consent,
  }
}

function tooLong(value: string, limit: number): boolean {
  return value.length > limit
}

function validateForm(): ReturnType<typeof trimmedForm> | null {
  const payload = trimmedForm()
  const errors: string[] = []

  if (!payload.name) errors.push(t('pages.pageInquiry.validation.nameRequired'))
  if (!payload.company) errors.push(t('pages.pageInquiry.validation.companyRequired'))
  if (!payload.phone) errors.push(t('pages.pageInquiry.validation.phoneRequired'))
  if (!payload.email) {
    errors.push(t('pages.pageInquiry.validation.emailRequired'))
  } else if (!SIMPLE_EMAIL_RE.test(payload.email)) {
    errors.push(t('pages.pageInquiry.validation.emailInvalid'))
  }
  if (payload.vesselTypes.length === 0) {
    errors.push(t('pages.pageInquiry.validation.vesselTypesRequired'))
  }
  if (!Number.isInteger(payload.vesselsCount) || payload.vesselsCount == null || payload.vesselsCount < 1) {
    errors.push(t('pages.pageInquiry.validation.vesselsCountRequired'))
  } else if (payload.vesselsCount > 100000) {
    errors.push(t('pages.pageInquiry.validation.vesselsCountMax'))
  }
  if (!payload.vesselFlag) errors.push(t('pages.pageInquiry.validation.vesselFlagRequired'))
  if (payload.requiredServices.length === 0) {
    errors.push(t('pages.pageInquiry.validation.requiredServicesRequired'))
  }
  if (!payload.sourcePage) errors.push(t('pages.pageInquiry.validation.sourcePageRequired'))
  if (!payload.consent) errors.push(t('pages.pageInquiry.validation.consentRequired'))

  if (tooLong(payload.name, FIELD_LIMITS.name)) errors.push(t('pages.pageInquiry.validation.nameMax'))
  if (tooLong(payload.company, FIELD_LIMITS.company)) errors.push(t('pages.pageInquiry.validation.companyMax'))
  if (tooLong(payload.position, FIELD_LIMITS.position)) errors.push(t('pages.pageInquiry.validation.positionMax'))
  if (tooLong(payload.phone, FIELD_LIMITS.phone)) errors.push(t('pages.pageInquiry.validation.phoneMax'))
  if (tooLong(payload.email, FIELD_LIMITS.email)) errors.push(t('pages.pageInquiry.validation.emailMax'))
  if (tooLong(payload.vesselFlag, FIELD_LIMITS.vesselFlag)) errors.push(t('pages.pageInquiry.validation.vesselFlagMax'))
  if (tooLong(payload.mainPorts, FIELD_LIMITS.mainPorts)) errors.push(t('pages.pageInquiry.validation.mainPortsMax'))
  if (tooLong(payload.message, FIELD_LIMITS.message)) errors.push(t('pages.pageInquiry.validation.messageMax'))
  if (tooLong(payload.sourcePage, FIELD_LIMITS.sourcePage)) errors.push(t('pages.pageInquiry.validation.sourcePageMax'))

  validationErrors.value = errors
  return errors.length === 0 ? payload : null
}

async function onSubmit() {
  formError.value = null
  validationErrors.value = []
  formSuccess.value = false

  const payload = validateForm()
  if (!payload) {
    return
  }

  sending.value = true
  try {
    await api.pageInquiries.submit({
      name: payload.name,
      company: payload.company,
      position: payload.position || null,
      phone: payload.phone,
      email: payload.email,
      vesselTypes: payload.vesselTypes,
      vesselsCount: payload.vesselsCount!,
      vesselFlag: payload.vesselFlag,
      mainPorts: payload.mainPorts || null,
      requiredServices: payload.requiredServices,
      message: payload.message || null,
      sourcePage: payload.sourcePage,
      consent: payload.consent,
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
const FIELD_LABEL_CLASS = 'block font-body text-xs text-muted'
const FIELD_INPUT_CLASS =
  'mt-1.5 block w-full border-0 border-b border-border bg-transparent px-0 py-2 font-body text-sm text-body placeholder:text-muted focus:border-primary focus:outline-none focus:ring-0'
const FIELD_GROUP_LABEL_CLASS = 'mb-3 block font-body text-sm text-body'
</script>

<template>
  <section
    id="page-inquiry"
    class="relative scroll-mt-24 overflow-hidden border-t border-border bg-bg-light"
    :class="hideIntro ? 'py-16 lg:py-20' : 'py-24 lg:py-32'"
  >
    <div class="relative z-10 mts-content-wrap">
      <div class="mx-auto w-full max-w-7xl">
        <div v-if="!hideIntro" class="mb-10">
          <div class="mb-4 flex items-center gap-3">
            <div class="h-px w-8 bg-primary" />
            <span class="section-label">{{ t('pages.pageInquiry.sectionLabel') }}</span>
          </div>
          <h2 class="font-display text-2xl leading-tight text-body lg:text-3xl">
            {{ t('pages.pageInquiry.title') }}<span class="text-primary">{{ t('pages.pageInquiry.titleAccent') }}</span
            >{{ t('pages.pageInquiry.titleEnd') }}
          </h2>
          <div class="mb-6 mt-6 h-0.5 w-12 bg-primary" />
          <p class="font-body text-lg leading-relaxed text-muted">
            {{ t('pages.pageInquiry.lead') }}
          </p>
        </div>

        <div class="card-tech p-8 lg:p-10">
          <div v-if="!hideFormCardHeading" class="mb-8 text-center">
            <h3 class="font-display text-xl text-body lg:text-2xl">
              {{ t('pages.pageInquiry.formTitle') }}
            </h3>
            <p class="mt-3 font-body text-sm font-semibold text-body lg:text-base">
              {{ t('pages.pageInquiry.formSubtitle') }}
            </p>
            <p class="mt-2 font-body text-sm text-muted">
              {{ t('pages.pageInquiry.formLead') }}
            </p>
          </div>

          <form class="space-y-6" novalidate @submit.prevent="onSubmit">
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
              <span class="font-body text-xs leading-snug text-muted">
                {{ t('pages.pageInquiry.consent')
                }}<NuxtLink to="/privacy" class="text-primary hover:underline">{{
                  t('pages.pageInquiry.consentLink')
                }}</NuxtLink>
              </span>
            </CommonMarinCheckbox>

            <div
              v-if="validationErrors.length"
              class="rounded-sm border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700"
              role="alert"
            >
              <p class="font-semibold">{{ t('pages.pageInquiry.validation.title') }}</p>
              <ul class="mt-2 list-disc space-y-1 pl-5">
                <li v-for="err in validationErrors" :key="err">{{ err }}</li>
              </ul>
            </div>
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
          <div class="card-tech p-8">
            <h4 class="font-display text-xl text-body">
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
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary font-display text-base text-primary"
                >
                  {{ idx + 1 }}
                </span>
                <span class="font-body text-sm leading-relaxed text-body">{{ step }}</span>
              </li>
            </ol>
          </div>

          <div class="card-tech p-8">
            <h4 class="font-display text-xl text-body">
              {{ t('pages.pageInquiry.urgentTitle') }}
            </h4>
            <p class="mt-3 font-body text-sm text-muted">
              {{ t('pages.pageInquiry.urgentLead') }}
            </p>
            <a
              v-if="phoneContact"
              :href="phoneContact.href ?? `tel:${phoneContact.value.replace(/[^+\d]/g, '')}`"
              class="mt-2 inline-flex items-center gap-2 font-display text-lg text-primary hover:underline"
            >
              <Phone class="h-4 w-4" />
              {{ phoneContact.value }}
            </a>

            <h4 class="mt-8 font-display text-xl text-body">
              {{ t('pages.pageInquiry.noFormTitle') }}
            </h4>
            <p class="mt-3 font-body text-sm text-muted">
              {{ t('pages.pageInquiry.noFormLead') }}
            </p>
            <a
              v-if="emailContact"
              :href="emailContact.href ?? `mailto:${emailContact.value}`"
              class="mt-2 inline-flex items-center gap-2 font-body text-base text-primary hover:underline"
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
