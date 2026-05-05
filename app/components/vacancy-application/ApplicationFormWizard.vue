<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-vue-next'
import VacancyCertTable from '~/components/vacancy-application/VacancyCertTable.vue'
import VacancyEducationTable from '~/components/vacancy-application/VacancyEducationTable.vue'
import VacancySeaServiceTable from '~/components/vacancy-application/VacancySeaServiceTable.vue'
import MarinePhoneField from '~/components/vacancy-application/MarinePhoneField.vue'
import MtsDateInput from '~/components/common/MtsDateInput.vue'
import AdminSelect from '~/components/admin/AdminSelect.vue'
import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'
import type { VacancyApplicationForm } from '~/types/applicationForm'
import { createVacancyApplicationForm } from '~/composables/useVacancyApplicationForm'
import { isVacancyPhoneValid } from '~/utils/vacancyPhone'
import { normalizeVacancyDob, vacancyDobToIso, isVacancyDobComplete } from '~/utils/vacancyDob'

const props = withDefaults(
  defineProps<{
    variant: 'vacancy' | 'open'
    /** Только для variant=vacancy */
    pending?: boolean
    vacancyMissing?: boolean
    vacancySlug?: string
    vacancyTitle?: string
  }>(),
  { pending: false, vacancyMissing: false },
)

const fieldInputClass =
  'form-input text-sm'

const api = useMarineApi()
const { t, locale } = useI18n()
const localePath = useLocalePath()
/** Связка label ↔ AdminSelect для семейного положения */
const maritalSelectId = useId()

const form = ref<VacancyApplicationForm | null>(null)
/**
 * File с фотографией хранится отдельно от form (не нужно сериализовать в JSON
 * и не должен попадать в localStorage-копию payload).
 */
const photoFile = ref<File | null>(null)
/** Превью выбранного фото (data URL), чтобы пользователь сразу видел, что прикрепил. */
const photoPreview = ref<string | null>(null)

/**
 * Поля, обязательные для конкретного шага. Используются как для inline-валидации
 * (выделение красным + сообщение под полем), так и для общего баннера сверху.
 */
type RequiredField =
  | 'positionApplyingFor'
  | 'lastName'
  | 'firstName'
  | 'dateOfBirth'
  | 'email'
  | 'mobilePhone'
  | 'consentRuAccuracy'
  | 'consentRuPd'
  | 'consentEnAccuracy'
  | 'consentEnPd'

/**
 * Сообщения об ошибках по полям. Заполняются `validateField()` и читаются
 * из шаблона через `errorOf()` (показываем только если поле «touched»).
 * Объявлены до watch на props, потому что immediate-watch их сбрасывает при инициализации.
 */
const fieldErrors = ref<Partial<Record<RequiredField, string>>>({})
const touched = ref<Set<RequiredField>>(new Set())

const dateOfBirthIso = computed({
  get: () => {
    const f = form.value
    if (!f?.dateOfBirth) {
      return ''
    }
    return vacancyDobToIso(f.dateOfBirth) || ''
  },
  set: (v: string) => {
    if (form.value) {
      form.value.dateOfBirth = v
    }
  },
})

watch(
  () =>
    [props.variant, props.vacancySlug, props.vacancyTitle, props.pending, props.vacancyMissing] as const,
  () => {
    photoFile.value = null
    if (photoPreview.value) {
      URL.revokeObjectURL(photoPreview.value)
      photoPreview.value = null
    }
    fieldErrors.value = {}
    touched.value = new Set()
    if (props.variant === 'open') {
      form.value = createVacancyApplicationForm('open', '')
      return
    }
    if (props.pending || props.vacancyMissing || !props.vacancySlug || !props.vacancyTitle) {
      form.value = null
      return
    }
    form.value = createVacancyApplicationForm(props.vacancySlug, props.vacancyTitle)
  },
  { immediate: true },
)

const step = ref(1)
const totalSteps = 10
const submitted = ref(false)
const stepError = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref<string | null>(null)

const stepsMeta = computed(() => [
  { n: 1, title: t('pages.vacancyForm.s1') },
  { n: 2, title: t('pages.vacancyForm.s2') },
  { n: 3, title: t('pages.vacancyForm.s3') },
  { n: 4, title: t('pages.vacancyForm.s4') },
  { n: 5, title: t('pages.vacancyForm.s5') },
  { n: 6, title: t('pages.vacancyForm.s6') },
  { n: 7, title: t('pages.vacancyForm.s7') },
  { n: 8, title: t('pages.vacancyForm.s8') },
  { n: 9, title: t('pages.vacancyForm.s9') },
  { n: 10, title: t('pages.vacancyForm.s10') },
])

const showPending = computed(() => props.variant === 'vacancy' && props.pending)
const showNotFound = computed(() => props.variant === 'vacancy' && props.vacancyMissing)

/**
 * Опции «Семейного положения». В payload пишем уже локализованную строку (как и
 * остальные текстовые поля анкеты) — это удобно и для PDF, и для письма crewing,
 * где не нужно знать про машинные коды.
 */
const maritalOptions = computed<AdminSelectOption[]>(() => [
  { value: '', label: t('pages.vacancyForm.maritalOptions.placeholder') },
  { value: t('pages.vacancyForm.maritalOptions.married'), label: t('pages.vacancyForm.maritalOptions.married') },
  { value: t('pages.vacancyForm.maritalOptions.single'), label: t('pages.vacancyForm.maritalOptions.single') },
  { value: t('pages.vacancyForm.maritalOptions.divorced'), label: t('pages.vacancyForm.maritalOptions.divorced') },
])

const requiredByStep = computed<Record<number, RequiredField[]>>(() => ({
  2:
    props.variant === 'open'
      ? ['positionApplyingFor', 'lastName', 'firstName', 'dateOfBirth']
      : ['lastName', 'firstName', 'dateOfBirth'],
  3: ['email', 'mobilePhone'],
  10: ['consentRuAccuracy', 'consentRuPd', 'consentEnAccuracy', 'consentEnPd'],
}))

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateField(field: RequiredField): string | null {
  const f = form.value
  if (!f) {
    return null
  }
  let err: string | null = null
  switch (field) {
    case 'positionApplyingFor':
      if (props.variant === 'open' && !f.positionApplyingFor?.trim()) {
        err = t('pages.vacancyForm.errPositionOpen')
      }
      break
    case 'lastName':
    case 'firstName':
      if (!f[field]?.trim()) {
        err = t('pages.vacancyForm.errFieldRequired')
      }
      break
    case 'dateOfBirth':
      if (!isVacancyDobComplete(f.dateOfBirth)) {
        err = t('pages.vacancyForm.errDobInvalid')
      }
      break
    case 'email':
      if (!f.email?.trim()) {
        err = t('pages.vacancyForm.errFieldRequired')
      } else if (!emailRe.test(f.email.trim())) {
        err = t('pages.vacancyForm.errEmailInvalid')
      }
      break
    case 'mobilePhone':
      if (!f.mobilePhone?.trim()) {
        err = t('pages.vacancyForm.errFieldRequired')
      } else if (!isVacancyPhoneValid(f.mobilePhone)) {
        err = t('pages.vacancyForm.errPhoneInvalid')
      }
      break
    case 'consentRuAccuracy':
    case 'consentRuPd':
    case 'consentEnAccuracy':
    case 'consentEnPd':
      if (!f[field]) {
        err = t('pages.vacancyForm.errFieldRequired')
      }
      break
  }
  const next = { ...fieldErrors.value }
  if (err) {
    next[field] = err
  } else {
    delete next[field]
  }
  fieldErrors.value = next
  return err
}

function markTouched(field: RequiredField) {
  if (!touched.value.has(field)) {
    const s = new Set(touched.value)
    s.add(field)
    touched.value = s
  }
  validateField(field)
}

/** Возвращает текст ошибки для поля, только если оно «touched». */
function errorOf(field: RequiredField): string | null {
  return touched.value.has(field) ? fieldErrors.value[field] ?? null : null
}

const fieldErrorClass = 'mt-1 font-mono text-[10px] text-red-700'
function inputErrClass(field: RequiredField): string {
  return errorOf(field) ? 'border-b-red-500 focus:border-red-500' : ''
}

/**
 * Валидирует все обязательные поля шага, помечает их touched.
 * Возвращает общий баннер «Проверьте выделенные поля» (или null, если ок).
 * Для шага 10 по-прежнему требуем ВСЕ согласия одновременно.
 */
function validateStep(s: number): string | null {
  const f = form.value
  if (!f) {
    return t('pages.vacancyForm.formNotLoaded')
  }
  const fields = requiredByStep.value[s] ?? []
  if (fields.length === 0) {
    return null
  }
  const newTouched = new Set(touched.value)
  let hasError = false
  for (const field of fields) {
    newTouched.add(field)
    if (validateField(field) !== null) {
      hasError = true
    }
  }
  touched.value = newTouched
  return hasError ? t('pages.vacancyForm.errCheckFields') : null
}

/**
 * Если поле уже было «touched», моментально перевалидируем его при изменении —
 * чтобы ошибка исчезала как только пользователь её исправил.
 */
watch(
  () => form.value,
  () => {
    if (!form.value || touched.value.size === 0) {
      return
    }
    for (const field of touched.value) {
      validateField(field)
    }
  },
  { deep: true },
)

function nextStep() {
  stepError.value = validateStep(step.value)
  if (stepError.value) {
    return
  }
  if (step.value < totalSteps) {
    step.value += 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function prevStep() {
  stepError.value = null
  if (step.value > 1) {
    step.value -= 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function onPhotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  photoFile.value = file
  if (form.value) {
    form.value.photoFileName = file?.name ?? null
  }
  if (photoPreview.value) {
    URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = null
  }
  if (file && import.meta.client) {
    photoPreview.value = URL.createObjectURL(file)
  }
}

onBeforeUnmount(() => {
  if (photoPreview.value) {
    URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = null
  }
})

async function submitForm() {
  if (!form.value) {
    return
  }
  /**
   * Перед отправкой проверяем все шаги с обязательными полями (а не только 10),
   * иначе пользователь может проскочить мимо них через таб-навигацию шагов сверху.
   * При первой ошибке возвращаемся на проблемный шаг и показываем баннер.
   */
  for (const s of [2, 3, 10]) {
    const err = validateStep(s)
    if (err) {
      stepError.value = err
      step.value = s
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
  }
  stepError.value = null
  submitting.value = true
  submitError.value = null
  try {
    syncSurnameName()
    const payload: VacancyApplicationForm = {
      ...form.value,
      dateOfBirth: normalizeVacancyDob(form.value.dateOfBirth),
    }
    if (props.variant === 'open') {
      await api.applicationForms.submitOpen(payload, photoFile.value)
    } else if (props.vacancySlug) {
      await api.applicationForms.submit(props.vacancySlug, payload, photoFile.value)
    }
    try {
      const key = `mts-application-form-${form.value.vacancySlug}-${Date.now()}`
      localStorage.setItem(
        key,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          payload: { ...form.value, dateOfBirth: normalizeVacancyDob(form.value.dateOfBirth) },
        }),
      )
    } catch {
      /* ignore quota */
    }
    submitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {
    submitError.value = t('pages.vacancyForm.submitErr')
  } finally {
    submitting.value = false
  }
}

function syncSurnameName() {
  const f = form.value
  if (!f) {
    return
  }
  f.surnameAndName = [f.lastName, f.firstName].filter(Boolean).join(' ')
}

const positionReadonly = computed(() => props.variant === 'vacancy')
</script>

<template>
  <div class="bg-white pt-16">
    <div v-if="showPending" class="flex justify-center py-24">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>
    <div v-else-if="showNotFound" class="mx-auto max-w-7xl px-6 py-24 text-center">
      <p class="mb-6 font-body text-muted">{{ t('pages.common.notFoundVacancy') }}</p>
      <NuxtLink :to="localePath('/vacancies')" class="btn-primary inline-flex">{{ t('pages.common.toVacancies') }}</NuxtLink>
    </div>
    <div v-else-if="form" class="relative mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-12">
      <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <NuxtLink
          v-if="variant === 'vacancy' && vacancySlug"
          :to="localePath(`/vacancies/${vacancySlug}`)"
          class="inline-flex items-center gap-2 font-mono text-xs uppercase text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ t('pages.common.toVacancy') }}
        </NuxtLink>
        <NuxtLink
          v-else
          :to="localePath('/vacancies')"
          class="inline-flex items-center gap-2 font-mono text-xs uppercase text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ t('pages.vacancyForm.backToVacanciesList') }}
        </NuxtLink>
        <span class="font-mono text-[10px] uppercase tracking-wide text-muted">
          {{ t('pages.vacancyForm.stepProgress', { n: step, total: totalSteps }) }}
        </span>
      </div>

      <div class="mb-8 flex flex-wrap gap-2">
        <button
          v-for="s in stepsMeta"
          :key="s.n"
          type="button"
          class="rounded-sm border px-2 py-1 font-mono text-[9px] uppercase transition-colors"
          :class="
            step === s.n
              ? 'border-primary bg-primary text-white'
              : s.n < step
                ? 'border-border bg-bg-light text-muted'
                : 'border-border bg-white text-muted'
          "
          @click="step = s.n"
        >
          {{ s.n }}. {{ s.title }}
        </button>
      </div>

      <div class="card-tech p-6 md:p-10">
        <div v-if="submitted" class="text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600/10">
            <Check class="h-7 w-7 text-green-700" />
          </div>
          <h1 class="font-display text-2xl text-body">{{ t('pages.vacancyForm.successTitle') }}</h1>
          <p class="mt-4 font-body text-sm leading-relaxed text-muted">
            {{ variant === 'open' ? t('pages.vacancyForm.successLeadOpen') : t('pages.vacancyForm.successLead') }}
          </p>
          <NuxtLink
            v-if="variant === 'vacancy' && vacancySlug"
            :to="localePath(`/vacancies/${vacancySlug}`)"
            class="btn-primary mt-8 inline-flex"
          >
            {{ t('pages.vacancyForm.backToVacancy') }}
          </NuxtLink>
          <NuxtLink v-else :to="localePath('/vacancies')" class="btn-primary mt-8 inline-flex">
            {{ t('pages.common.toVacancies') }}
          </NuxtLink>
        </div>

        <template v-else>
          <h1 class="font-display text-2xl text-body md:text-3xl">
            <span class="text-primary">{{ t('pages.vacancyForm.formHeading') }}</span>
            <template v-if="variant === 'vacancy' && vacancyTitle"> — {{ vacancyTitle }}</template>
            <template v-else><span class="text-body">&nbsp;{{ t('pages.vacancyForm.openFormSubtitle') }}</span></template>
          </h1>
          <p class="mt-2 font-body text-sm text-muted">
            {{ variant === 'open' ? t('pages.vacancyForm.openFormIntro') : t('pages.vacancyForm.formIntro') }}
          </p>

          <p v-if="stepError" class="mt-6 border border-red-200 bg-red-50 px-4 py-2 font-body text-sm text-red-800">
            {{ stepError }}
          </p>
          <p v-if="submitError" class="mt-4 border border-red-200 bg-red-50 px-4 py-2 font-body text-sm text-red-800">
            {{ submitError }}
          </p>

          <!-- Step 1 -->
          <section v-show="step === 1" class="mt-8 space-y-4">
            <p class="font-body text-muted">
              {{ t('pages.vacancyForm.step1p1') }}
              <strong class="text-body">{{ form.positionApplyingFor || '—' }}</strong
              >{{ t('pages.vacancyForm.step1p2') }}
            </p>
            <ul class="mts-arrow-bullets list-none space-y-2 font-body text-sm text-muted">
              <li>{{ t('pages.vacancyForm.step1li1') }}</li>
              <li>{{ t('pages.vacancyForm.step1li2') }}</li>
              <li>{{ t('pages.vacancyForm.step1li3') }}</li>
            </ul>
          </section>

          <!-- Step 2 -->
          <section v-show="step === 2" class="mt-8 space-y-4">
            <h2 class="font-display text-lg text-body">{{ t('pages.vacancyForm.step2title') }}</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">
                  {{ t('pages.vacancyForm.fields.positionApplyingFor') }}<span v-if="variant === 'open'" class="text-red-700"> *</span>
                </label>
                <input
                  v-model="form.positionApplyingFor"
                  type="text"
                  :readonly="positionReadonly"
                  :aria-invalid="!!errorOf('positionApplyingFor') || undefined"
                  :class="[
                    fieldInputClass,
                    positionReadonly ? 'cursor-not-allowed opacity-90' : '',
                    inputErrClass('positionApplyingFor'),
                  ]"
                  :placeholder="variant === 'open' ? t('pages.vacancyForm.positionPlaceholderOpen') : undefined"
                  @blur="variant === 'open' ? markTouched('positionApplyingFor') : undefined"
                />
                <p v-if="errorOf('positionApplyingFor')" :class="fieldErrorClass">{{ errorOf('positionApplyingFor') }}</p>
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.lastName')
                }}</label>
                <input
                  v-model="form.lastName"
                  type="text"
                  :aria-invalid="!!errorOf('lastName') || undefined"
                  :class="[fieldInputClass, inputErrClass('lastName')]"
                  @blur="syncSurnameName(); markTouched('lastName')"
                />
                <p v-if="errorOf('lastName')" :class="fieldErrorClass">{{ errorOf('lastName') }}</p>
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.firstName')
                }}</label>
                <input
                  v-model="form.firstName"
                  type="text"
                  :aria-invalid="!!errorOf('firstName') || undefined"
                  :class="[fieldInputClass, inputErrClass('firstName')]"
                  @blur="syncSurnameName(); markTouched('firstName')"
                />
                <p v-if="errorOf('firstName')" :class="fieldErrorClass">{{ errorOf('firstName') }}</p>
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.fathersName')
                }}</label>
                <input v-model="form.fathersName" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.dateOfBirth')
                }}</label>
                <MtsDateInput
                  v-model="dateOfBirthIso"
                  variant="underline"
                  :placeholder="t('pages.vacancyForm.dobPlaceholder')"
                  :input-class="inputErrClass('dateOfBirth')"
                />
                <p v-if="errorOf('dateOfBirth')" :class="fieldErrorClass">{{ errorOf('dateOfBirth') }}</p>
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted" :for="maritalSelectId">{{
                  t('pages.vacancyForm.fields.maritalStatus')
                }}</label>
                <AdminSelect
                  :id="maritalSelectId"
                  v-model="form.maritalStatus"
                  variant="underline"
                  :options="maritalOptions"
                  :placeholder="t('pages.vacancyForm.maritalOptions.placeholder')"
                  :searchable="false"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.placeOfBirth')
                }}</label>
                <input v-model="form.placeOfBirth" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.photo')
                }}</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  :lang="locale"
                  class="w-full border-0 bg-white p-2 font-body text-sm file:mr-3 file:border file:border-border file:bg-bg-light file:px-3 file:py-1.5 file:font-mono file:text-xs"
                  @change="onPhotoChange"
                />
                <div v-if="photoPreview" class="mt-2 flex items-start gap-3">
                  <img
                    :src="photoPreview"
                    alt=""
                    class="h-24 w-24 rounded-sm border border-border object-cover"
                  />
                  <p v-if="form.photoFileName" class="font-mono text-[10px] text-muted">
                    {{ form.photoFileName }}
                  </p>
                </div>
                <p v-else-if="form.photoFileName" class="mt-1 font-mono text-[10px] text-muted">
                  {{ form.photoFileName }}
                </p>
              </div>
            </div>
          </section>

          <!-- Step 3 -->
          <section v-show="step === 3" class="mt-8 space-y-4">
            <h2 class="font-display text-lg text-body">{{ t('pages.vacancyForm.step3title') }}</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.citizenship')
                }}</label>
                <input v-model="form.citizenship" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.availableFrom')
                }}</label>
                <input v-model="form.availableFrom" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.englishLevel')
                }}</label>
                <input v-model="form.englishLevel" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.mobilePhone')
                }}</label>
                <MarinePhoneField
                  v-model="form.mobilePhone"
                  :input-class="`${fieldInputClass} ${inputErrClass('mobilePhone')}`"
                />
                <p v-if="errorOf('mobilePhone')" :class="fieldErrorClass">{{ errorOf('mobilePhone') }}</p>
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.homePhone')
                }}</label>
                <MarinePhoneField v-model="form.homePhone" :input-class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.email')
                }}</label>
                <input
                  v-model="form.email"
                  type="email"
                  :aria-invalid="!!errorOf('email') || undefined"
                  :class="[fieldInputClass, inputErrClass('email')]"
                  @blur="markTouched('email')"
                />
                <p v-if="errorOf('email')" :class="fieldErrorClass">{{ errorOf('email') }}</p>
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.messenger')
                }}</label>
                <input v-model="form.messenger" type="text" :class="fieldInputClass" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.homeAddress')
                }}</label>
                <textarea v-model="form.homeAddress" rows="3" :class="fieldInputClass" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.nearestAirport')
                }}</label>
                <input v-model="form.nearestAirport" type="text" :class="fieldInputClass" />
              </div>
            </div>
          </section>

          <!-- Step 4 NOK -->
          <section v-show="step === 4" class="mt-8 space-y-4">
            <h2 class="font-display text-lg text-body">{{ t('pages.vacancyForm.step4title') }}</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.nokLastName')
                }}</label>
                <input v-model="form.nokLastName" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.nokContactNumber')
                }}</label>
                <MarinePhoneField v-model="form.nokContactNumber" :input-class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.nokFirstName')
                }}</label>
                <input v-model="form.nokFirstName" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.nokEmail')
                }}</label>
                <input v-model="form.nokEmail" type="email" :class="fieldInputClass" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.nokRelationship')
                }}</label>
                <input v-model="form.nokRelationship" type="text" :class="fieldInputClass" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                  t('pages.vacancyForm.fields.nokAddress')
                }}</label>
                <textarea v-model="form.nokAddress" rows="3" :class="fieldInputClass" />
              </div>
            </div>
          </section>

          <!-- Step 5 Travel -->
          <section v-show="step === 5" class="mt-8 space-y-6">
            <VacancyCertTable
              v-model:extra-rows="form.travelOtherRows"
              :title="t('pages.vacancyForm.travelTitle')"
              :rows="form.travelRows"
              :extra-hint="t('pages.vacancyForm.travelHint')"
            />
          </section>

          <!-- Step 6 Competency -->
          <section v-show="step === 6" class="mt-8 space-y-6">
            <VacancyCertTable
              v-model:extra-rows="form.competencyOtherRows"
              :title="t('pages.vacancyForm.compTitle')"
              :rows="form.competencyRows"
              :extra-hint="t('pages.vacancyForm.compHint')"
            />
          </section>

          <!-- Step 7 Other certs -->
          <section v-show="step === 7" class="mt-8 space-y-6">
            <VacancyCertTable
              v-model:extra-rows="form.otherCertificateExtraRows"
              :title="t('pages.vacancyForm.otherTitle')"
              :rows="form.otherCertificateRows"
              :extra-hint="t('pages.vacancyForm.otherHint')"
            />
          </section>

          <!-- Step 8 Sea service -->
          <section v-show="step === 8" class="mt-8">
            <VacancySeaServiceTable v-model:rows="form.seaServiceRows" />
          </section>

          <!-- Step 9 Education + safety -->
          <section v-show="step === 9" class="mt-8 space-y-8">
            <VacancyEducationTable v-model:rows="form.educationRows" />
            <div class="card-tech p-5">
              <h2 class="font-display mb-4 text-lg text-body">{{ t('pages.vacancies.safetySizes') }}</h2>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                    t('pages.vacancyForm.fields.safetyOverallSize')
                  }}</label>
                  <input v-model="form.safetyOverallSize" type="text" :class="fieldInputClass" />
                </div>
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                    t('pages.vacancyForm.fields.safetyHeight')
                  }}</label>
                  <input v-model="form.safetyHeight" type="text" :class="fieldInputClass" />
                </div>
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                    t('pages.vacancyForm.fields.safetyShoeSize')
                  }}</label>
                  <input v-model="form.safetyShoeSize" type="text" :class="fieldInputClass" />
                </div>
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-muted">{{
                    t('pages.vacancyForm.fields.safetyWeight')
                  }}</label>
                  <input v-model="form.safetyWeight" type="text" :class="fieldInputClass" />
                </div>
              </div>
            </div>
          </section>

          <!-- Step 10 Consents -->
          <section v-show="step === 10" class="mt-8 space-y-6">
            <h2 class="font-display text-lg text-body">{{ t('pages.vacancyForm.consentsTitle') }}</h2>
            <div>
              <label
                class="flex cursor-pointer gap-3"
                :class="errorOf('consentRuAccuracy') ? 'rounded-sm border border-red-300 bg-red-50/40 p-2' : ''"
              >
                <input
                  v-model="form.consentRuAccuracy"
                  type="checkbox"
                  class="mts-checkbox mt-1"
                  @change="markTouched('consentRuAccuracy')"
                />
                <span class="font-body text-[11px] leading-snug text-muted">
                  {{ t('pages.vacancyForm.consentRu1') }}
                </span>
              </label>
              <p v-if="errorOf('consentRuAccuracy')" :class="fieldErrorClass">{{ errorOf('consentRuAccuracy') }}</p>
            </div>
            <div>
              <label
                class="flex cursor-pointer gap-3"
                :class="errorOf('consentRuPd') ? 'rounded-sm border border-red-300 bg-red-50/40 p-2' : ''"
              >
                <input
                  v-model="form.consentRuPd"
                  type="checkbox"
                  class="mt-1 size-4 accent-mts-accent"
                  @change="markTouched('consentRuPd')"
                />
                <span class="font-body text-[11px] leading-snug text-muted">
                  {{ t('pages.vacancyForm.consentRu2') }}
                </span>
              </label>
              <p v-if="errorOf('consentRuPd')" :class="fieldErrorClass">{{ errorOf('consentRuPd') }}</p>
            </div>
            <div>
              <label
                class="flex cursor-pointer gap-3"
                :class="errorOf('consentEnAccuracy') ? 'rounded-sm border border-red-300 bg-red-50/40 p-2' : ''"
              >
                <input
                  v-model="form.consentEnAccuracy"
                  type="checkbox"
                  class="mts-checkbox mt-1"
                  @change="markTouched('consentEnAccuracy')"
                />
                <span class="font-body text-[11px] leading-snug text-muted">
                  {{ t('pages.vacancyForm.consentEn1') }}
                </span>
              </label>
              <p v-if="errorOf('consentEnAccuracy')" :class="fieldErrorClass">{{ errorOf('consentEnAccuracy') }}</p>
            </div>
            <div>
              <label
                class="flex cursor-pointer gap-3"
                :class="errorOf('consentEnPd') ? 'rounded-sm border border-red-300 bg-red-50/40 p-2' : ''"
              >
                <input
                  v-model="form.consentEnPd"
                  type="checkbox"
                  class="mts-checkbox mt-1"
                  @change="markTouched('consentEnPd')"
                />
                <span class="font-body text-[11px] leading-snug text-muted">
                  {{ t('pages.vacancyForm.consentEn2') }}
                </span>
              </label>
              <p v-if="errorOf('consentEnPd')" :class="fieldErrorClass">{{ errorOf('consentEnPd') }}</p>
            </div>
          </section>

          <div v-if="!submitted" class="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
            <button
              v-if="step > 1"
              type="button"
              class="btn-secondary inline-flex items-center gap-2"
              @click="prevStep"
            >
              <ArrowLeft class="h-4 w-4" />
              {{ t('pages.common.back') }}
            </button>
            <div v-else />
            <div class="flex gap-3">
              <button
                v-if="step < totalSteps"
                type="button"
                class="btn-primary inline-flex items-center gap-2"
                @click="nextStep"
              >
                {{ t('pages.common.next') }}
                <ArrowRight class="h-4 w-4" />
              </button>
              <button
                v-else
                type="button"
                class="btn-primary inline-flex items-center gap-2"
                :disabled="submitting"
                @click="submitForm"
              >
                <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
                <Check v-else class="h-4 w-4" />
                {{ submitting ? t('pages.common.sending') : t('pages.common.finish') }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
