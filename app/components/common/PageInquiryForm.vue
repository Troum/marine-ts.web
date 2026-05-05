<script setup lang="ts">
import { Check, ChevronDown, Loader2, Mail, Phone, Search, X } from 'lucide-vue-next'
import type { PageInquiryFormConfig, SiteContactSettings } from '~/types'
import { contactSettingsDefaults } from '~/utils/contactSettingsDefaults'
import { normalizePageInquiryFormConfig } from '~/utils/pageInquiryFormOptions'
import 'flag-icons/css/flag-icons.min.css'

/**
 * Поля и подписи синхронизированы с дизайном Figma «Оставьте заявку»:
 * имя, компания, должность (опц.), телефон, email, типы судна (множ.),
 * количество судов, флаг судна, основные порты захода (опц.), требуемые
 * услуги (множ.), особые требования/комментарии (опц.) и согласие с
 * политикой конфиденциальности.
 *
 * Наборы чек-боксов приходят из CMS (`props.config`) и могут отличаться
 * в зависимости от страницы (`sourcePage`), например для /contacts или /about.
 */
const props = withDefaults(
  defineProps<{
    /** Идентификатор страницы для админки (например home, about, crewing-management, services/hull). */
    sourcePage: string
    /** Скрыть верхний блок (метка «Заявка», заголовок, лид) — `/request` или `hideInquiryFormIntro` в CMS листингов и line-страниц. */
    hideIntro?: boolean
    /** Скрыть заголовок, подзаголовок и лид внутри белой карточки над полями (см. `hideInquiryFormCardHeading` в CMS line-страниц). */
    hideFormCardHeading?: boolean
    /** Конфиг состава чекбоксов (админка страницы). */
    config?: PageInquiryFormConfig | null
    /**
     * Доп. email в колонке «Не хотите заполнять форму?» (только где передано, напр. судовой менеджмент).
     * Не показывается, если совпадает с основным контактным email.
     */
    noFormSecondaryEmail?: string
  }>(),
  { hideIntro: false, hideFormCardHeading: false, config: null },
)

const { t, te, locale } = useI18n()
const api = useMarineApi()

const normalizedConfig = computed(() => normalizePageInquiryFormConfig(props.config))
const vesselTypeOptions = computed(() => normalizedConfig.value.vesselTypes ?? [])
const requiredServiceOptions = computed(() => normalizedConfig.value.requiredServices ?? [])
const vesselTypeLabelMap = computed(() => normalizedConfig.value.vesselTypeLabels ?? {})
const requiredServiceLabelMap = computed(() => normalizedConfig.value.requiredServiceLabels ?? {})
const vesselTypeSet = computed(() => new Set(vesselTypeOptions.value))
const requiredServiceSet = computed(() => new Set(requiredServiceOptions.value))

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
  vesselTypes: string[]
  vesselsCount: number | null
  vesselFlag: string
  mainPorts: string
  requiredServices: string[]
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

/** Доп. адрес в колонке «Не хотите заполнять форму?». */
const noFormSecondaryEmail = computed(() => {
  const raw = props.noFormSecondaryEmail?.trim() ?? ''
  if (!raw || !SIMPLE_EMAIL_RE.test(raw)) {
    return null
  }
  const primary = emailContact.value?.value.trim().toLowerCase() ?? ''
  if (raw.toLowerCase() === primary) {
    return null
  }
  return raw
})

function trimmedForm() {
  return {
    name: form.value.name.trim(),
    company: form.value.company.trim(),
    position: form.value.position.trim(),
    phone: form.value.phone.trim(),
    email: form.value.email.trim(),
    vesselTypes: form.value.vesselTypes.filter((v) => vesselTypeSet.value.has(v)),
    vesselsCount: form.value.vesselsCount,
    vesselFlag: form.value.vesselFlag.trim(),
    mainPorts: form.value.mainPorts.trim(),
    requiredServices: form.value.requiredServices.filter((v) => requiredServiceSet.value.has(v)),
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
  if (vesselTypeOptions.value.length > 0 && payload.vesselTypes.length === 0) {
    errors.push(t('pages.pageInquiry.validation.vesselTypesRequired'))
  }
  if (!Number.isInteger(payload.vesselsCount) || payload.vesselsCount == null || payload.vesselsCount < 1) {
    errors.push(t('pages.pageInquiry.validation.vesselsCountRequired'))
  } else if (payload.vesselsCount > 100000) {
    errors.push(t('pages.pageInquiry.validation.vesselsCountMax'))
  }
  if (!payload.vesselFlag) errors.push(t('pages.pageInquiry.validation.vesselFlagRequired'))
  if (requiredServiceOptions.value.length > 0 && payload.requiredServices.length === 0) {
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
      vesselTypeLabels: normalizedConfig.value.vesselTypeLabels ?? undefined,
      vesselsCount: payload.vesselsCount!,
      vesselFlag: payload.vesselFlag,
      mainPorts: payload.mainPorts || null,
      requiredServices: payload.requiredServices,
      requiredServiceLabels: normalizedConfig.value.requiredServiceLabels ?? undefined,
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

function humanizeOptionId(value: string): string {
  const normalized = value.replace(/[_-]+/g, ' ').trim()
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : value
}

function vesselTypeLabel(id: string): string {
  const custom = vesselTypeLabelMap.value[id]
  if (custom) {
    return custom
  }
  const key = `pages.pageInquiry.vesselTypes.${id}`
  return te(key) ? t(key) : humanizeOptionId(id)
}
function requiredServiceLabel(id: string): string {
  const custom = requiredServiceLabelMap.value[id]
  if (custom) {
    return custom
  }
  const key = `pages.pageInquiry.requiredServices.${id}`
  return te(key) ? t(key) : humanizeOptionId(id)
}

type FlagCountryOption = { code: string; name: string }

const flagPickerOpen = ref(false)
const flagSearch = ref('')

// Full ISO 3166-1 alpha-2 list (sorted). Intl.supportedValuesOf does not support 'region'.
const ALL_COUNTRY_CODES: readonly string[] = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
  'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
  'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
  'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
  'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
  'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM',
  'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
  'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG',
  'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
]

const countryCodes = computed<string[]>(() => [...ALL_COUNTRY_CODES])

const flagDisplayNames = computed(() =>
  new Intl.DisplayNames([locale.value === 'ru' ? 'ru' : 'en'], { type: 'region' }),
)

const allFlagCountries = computed<FlagCountryOption[]>(() =>
  countryCodes.value.map((code) => ({
    code,
    name: flagDisplayNames.value.of(code) ?? code,
  })),
)

const filteredFlagCountries = computed<FlagCountryOption[]>(() => {
  const q = flagSearch.value.trim().toLowerCase()
  if (!q) {
    return allFlagCountries.value
  }
  return allFlagCountries.value.filter((row) =>
    row.code.toLowerCase().includes(q) || row.name.toLowerCase().includes(q),
  )
})

const selectedFlagCountry = computed<FlagCountryOption | null>(() => {
  const code = form.value.vesselFlag.trim().toUpperCase()
  if (!code) {
    return null
  }
  return allFlagCountries.value.find((row) => row.code === code) ?? { code, name: code }
})

function flagClass(code: string): string {
  return `fi fi-${code.toLowerCase()}`
}

function openFlagPicker() {
  flagSearch.value = ''
  flagPickerOpen.value = true
}

function closeFlagPicker() {
  flagPickerOpen.value = false
}

function pickFlagCountry(code: string) {
  form.value.vesselFlag = code.toUpperCase()
  flagPickerOpen.value = false
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
            <fieldset v-if="vesselTypeOptions.length > 0">
              <legend :class="FIELD_GROUP_LABEL_CLASS">
                {{ t('pages.pageInquiry.labelVesselTypes') }}
              </legend>
              <div class="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <CommonMarinCheckbox
                  v-for="id in vesselTypeOptions"
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
                <input :id="`pi-${sourcePage}-flag`" v-model="form.vesselFlag" type="hidden" />
                <button
                  type="button"
                  class="mt-1.5 flex w-full items-center justify-between border-0 border-b border-border bg-transparent px-0 py-2 text-left text-sm text-body transition-colors hover:border-primary focus:border-primary focus:outline-none"
                  @click="openFlagPicker"
                >
                  <span class="inline-flex items-center gap-2">
                    <span
                      v-if="selectedFlagCountry"
                      :class="flagClass(selectedFlagCountry.code)"
                      class="h-4 w-6 rounded-[2px] bg-contain bg-center bg-no-repeat"
                      aria-hidden="true"
                    />
                    <span class="font-body">
                      {{
                        selectedFlagCountry
                          ? `${selectedFlagCountry.name} (${selectedFlagCountry.code})`
                          : t('pages.pageInquiry.labelVesselFlag')
                      }}
                    </span>
                  </span>
                  <ChevronDown class="h-4 w-4 text-muted" />
                </button>
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
            <fieldset v-if="requiredServiceOptions.length > 0">
              <legend :class="FIELD_GROUP_LABEL_CLASS">
                {{ t('pages.pageInquiry.labelRequiredServices') }}
              </legend>
              <div class="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <CommonMarinCheckbox
                  v-for="id in requiredServiceOptions"
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
              <ul class="mts-arrow-bullets mt-2 list-none space-y-1">
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
            <div v-if="emailContact || noFormSecondaryEmail" class="mt-2 flex flex-col gap-2">
              <a
                v-if="emailContact"
                :href="emailContact.href ?? `mailto:${emailContact.value}`"
                class="inline-flex items-center gap-2 font-body text-base text-primary hover:underline"
              >
                <Mail class="h-4 w-4 shrink-0" />
                {{ emailContact.value }}
              </a>
              <a
                v-if="noFormSecondaryEmail"
                :href="`mailto:${noFormSecondaryEmail}`"
                class="inline-flex items-center gap-2 font-body text-base text-primary hover:underline"
              >
                <Mail class="h-4 w-4 shrink-0" />
                {{ noFormSecondaryEmail }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Teleport to="body">
      <div
        v-if="flagPickerOpen"
        class="fixed inset-0 z-[160] bg-slate-900/60 p-4 backdrop-blur-[2px]"
        @click.self="closeFlagPicker"
      >
        <div class="mx-auto flex h-full w-full max-w-4xl flex-col rounded-md border border-border bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-border px-4 py-3">
            <p class="font-display text-lg text-body">{{ t('pages.pageInquiry.labelVesselFlag') }}</p>
            <button type="button" class="rounded-sm p-1 text-muted hover:text-body" @click="closeFlagPicker">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div class="border-b border-border px-4 py-3">
            <label class="flex items-center gap-2 border border-border px-3 py-2">
              <Search class="h-4 w-4 text-muted" />
              <input
                v-model="flagSearch"
                type="search"
                class="w-full bg-transparent text-sm text-body outline-none placeholder:text-muted"
                placeholder="Поиск по стране или коду (US, DE, ...)"
              />
            </label>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <!-- Desktop: tile grid (12 columns) -->
            <div class="hidden sm:grid sm:grid-cols-[repeat(12,minmax(0,1fr))] sm:gap-1">
              <button
                v-for="country in filteredFlagCountries"
                :key="country.code"
                type="button"
                :title="`${country.name} (${country.code})`"
                class="group relative flex flex-col items-center gap-1 rounded-sm p-1.5 text-center transition-colors hover:bg-bg-light"
                :class="selectedFlagCountry?.code === country.code ? 'bg-bg-light ring-1 ring-primary/40' : ''"
                @click="pickFlagCountry(country.code)"
              >
                <span
                  :class="flagClass(country.code)"
                  class="block h-5 w-7 rounded-[2px] bg-contain bg-center bg-no-repeat shadow-sm"
                  aria-hidden="true"
                />
                <span class="block truncate font-mono text-[9px] leading-none text-muted group-hover:text-body">
                  {{ country.code }}
                </span>
                <Check
                  v-if="selectedFlagCountry?.code === country.code"
                  class="absolute right-0.5 top-0.5 h-3 w-3 text-primary"
                />
              </button>
            </div>
            <!-- Mobile: compact list -->
            <div class="sm:hidden">
              <button
                v-for="country in filteredFlagCountries"
                :key="country.code"
                type="button"
                class="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm text-body hover:bg-bg-light"
                @click="pickFlagCountry(country.code)"
              >
                <span class="inline-flex items-center gap-3">
                  <span
                    :class="flagClass(country.code)"
                    class="h-4 w-6 rounded-[2px] bg-contain bg-center bg-no-repeat"
                    aria-hidden="true"
                  />
                  <span>{{ country.name }}</span>
                </span>
                <span class="inline-flex items-center gap-2 text-xs text-muted">
                  {{ country.code }}
                  <Check
                    v-if="selectedFlagCountry?.code === country.code"
                    class="h-3.5 w-3.5 text-primary"
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
