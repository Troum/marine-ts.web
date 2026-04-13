<script setup lang="ts">
import {ArrowLeft, ArrowRight, Check, Loader2} from 'lucide-vue-next'
import VacancyCertTable from '~/components/vacancy-application/VacancyCertTable.vue'
import VacancyEducationTable from '~/components/vacancy-application/VacancyEducationTable.vue'
import VacancySeaServiceTable from '~/components/vacancy-application/VacancySeaServiceTable.vue'
import MarinePhoneField from '~/components/vacancy-application/MarinePhoneField.vue'
import MtsDateInput from '~/components/common/MtsDateInput.vue'
import type {VacancyApplicationForm} from '~/types/applicationForm'
import {createVacancyApplicationForm} from '~/composables/useVacancyApplicationForm'
import {isVacancyPhoneValid} from '~/utils/vacancyPhone'
import {normalizeVacancyDob, vacancyDobToIso, isVacancyDobComplete} from '~/utils/vacancyDob'

const fieldInputClass =
  'w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const api = useMarineApi()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: vacancy, pending } = await useAsyncData(
  () => `vacancy-application-form-${locale.value}-${slug.value}`,
  async () => {
    try {
      return await api.vacancies.getBySlug(slug.value)
    } catch {
      return null
    }
  },
  { watch: [slug, locale] },
)

const form = ref<VacancyApplicationForm | null>(null)

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
  vacancy,
  (v) => {
    if (v) {
      form.value = createVacancyApplicationForm(slug.value, v.title)
    }
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

useSeoMeta({
  title: t('pages.vacancyForm.seoTitle'),
  robots: 'noindex, nofollow',
})

function validateStep(s: number): string | null {
  const f = form.value
  if (!f) {
    return t('pages.vacancyForm.formNotLoaded')
  }
  if (s === 2) {
    if (!f.lastName?.trim() || !f.firstName?.trim()) {
      return t('pages.vacancyForm.errNameDob')
    }
    if (!isVacancyDobComplete(f.dateOfBirth)) {
      return t('pages.vacancyForm.errDobInvalid')
    }
  }
  if (s === 3) {
    if (!f.email?.trim() || !f.mobilePhone?.trim()) {
      return t('pages.vacancyForm.errContact')
    }
    if (!isVacancyPhoneValid(f.mobilePhone)) {
      return t('pages.vacancyForm.errPhoneInvalid')
    }
  }
  if (s === 10 && !submitted.value) {
    if (!f.consentRuAccuracy || !f.consentRuPd || !f.consentEnAccuracy || !f.consentEnPd) {
      return t('pages.vacancyForm.errConsent')
    }
  }
  return null
}

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
  const file = input.files?.[0]
  if (file && form.value) {
    form.value.photoFileName = file.name
  }
}

async function submitForm() {
  stepError.value = validateStep(10)
  if (stepError.value) {
    return
  }
  if (!form.value) {
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    const payload: VacancyApplicationForm = {
      ...form.value,
      dateOfBirth: normalizeVacancyDob(form.value.dateOfBirth),
    }
    await api.applicationForms.submit(slug.value, payload)
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
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <div v-if="pending" class="flex justify-center py-24">
      <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
    </div>
    <div v-else-if="!vacancy || !form" class="mx-auto max-w-3xl px-6 py-24 text-center">
      <p class="mb-6 font-body text-mts-text-secondary">{{ t('pages.common.notFoundVacancy') }}</p>
      <NuxtLink :to="localePath('/vacancies')" class="btn-primary inline-flex">{{ t('pages.common.toVacancies') }}</NuxtLink>
    </div>
    <div v-else class="relative mx-auto max-w-4xl px-6 pb-24 pt-8 lg:px-12">
      <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <NuxtLink
          :to="localePath(`/vacancies/${slug}`)"
          class="inline-flex items-center gap-2 font-mono text-xs uppercase text-mts-text-secondary transition-colors hover:text-mts-accent"
        >
          <ArrowLeft class="h-4 w-4" />
          {{ t('pages.common.toVacancy') }}
        </NuxtLink>
        <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
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
              ? 'border-mts-accent bg-mts-accent text-white'
              : s.n < step
                ? 'border-mts-border bg-white text-mts-text-secondary'
                : 'border-mts-border bg-mts-bg text-mts-text-muted'
          "
          @click="step = s.n"
        >
          {{ s.n }}. {{ s.title }}
        </button>
      </div>

      <div class="border border-mts-border bg-white p-6 shadow-tech md:p-10">
        <div v-if="submitted" class="text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600/10">
            <Check class="h-7 w-7 text-green-700" />
          </div>
          <h1 class="font-display text-2xl text-mts-text">{{ t('pages.vacancyForm.successTitle') }}</h1>
          <p class="mt-4 font-body text-sm leading-relaxed text-mts-text-secondary">
            {{ t('pages.vacancyForm.successLead') }}
          </p>
          <NuxtLink :to="localePath(`/vacancies/${slug}`)" class="btn-primary mt-8 inline-flex">
            {{ t('pages.vacancyForm.backToVacancy') }}
          </NuxtLink>
        </div>

        <template v-else>
          <h1 class="font-display text-2xl text-mts-text md:text-3xl">
            <span class="text-mts-accent">{{ t('pages.vacancyForm.formHeading') }}</span> — {{ vacancy.title }}
          </h1>
          <p class="mt-2 font-body text-sm text-mts-text-secondary">
            {{ t('pages.vacancyForm.formIntro') }}
          </p>

          <p v-if="stepError" class="mt-6 border border-red-200 bg-red-50 px-4 py-2 font-body text-sm text-red-800">
            {{ stepError }}
          </p>
          <p v-if="submitError" class="mt-4 border border-red-200 bg-red-50 px-4 py-2 font-body text-sm text-red-800">
            {{ submitError }}
          </p>

          <!-- Step 1 -->
          <section v-show="step === 1" class="mt-8 space-y-4">
            <p class="font-body text-mts-text-secondary">
              {{ t('pages.vacancyForm.step1p1') }}
              <strong class="text-mts-text">{{ form.positionApplyingFor }}</strong>{{ t('pages.vacancyForm.step1p2') }}
            </p>
            <ul class="list-inside list-disc space-y-2 font-body text-sm text-mts-text-secondary">
              <li>{{ t('pages.vacancyForm.step1li1') }}</li>
              <li>{{ t('pages.vacancyForm.step1li2') }}</li>
              <li>{{ t('pages.vacancyForm.step1li3') }}</li>
            </ul>
          </section>

          <!-- Step 2 -->
          <section v-show="step === 2" class="mt-8 space-y-4">
            <h2 class="font-display text-lg text-mts-text">{{ t('pages.vacancyForm.step2title') }}</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.positionApplyingFor')
                }}</label>
                <input v-model="form.positionApplyingFor" type="text" readonly class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.lastName')
                }}</label>
                <input v-model="form.lastName" type="text" :class="fieldInputClass" @blur="syncSurnameName" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.firstName')
                }}</label>
                <input v-model="form.firstName" type="text" :class="fieldInputClass" @blur="syncSurnameName" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.fathersName')
                }}</label>
                <input v-model="form.fathersName" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.dateOfBirth')
                }}</label>
                <MtsDateInput v-model="dateOfBirthIso" :placeholder="t('pages.vacancyForm.dobPlaceholder')" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.maritalStatus')
                }}</label>
                <input v-model="form.maritalStatus" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.placeOfBirth')
                }}</label>
                <input v-model="form.placeOfBirth" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.photo')
                }}</label>
                <input
                  type="file"
                  accept="image/*"
                  :lang="locale"
                  class="w-full border-0 bg-mts-bg p-2 font-body text-sm file:mr-3 file:border file:border-mts-border file:bg-white file:px-3 file:py-1.5 file:font-mono file:text-xs"
                  @change="onPhotoChange"
                />
                <p v-if="form.photoFileName" class="mt-1 font-mono text-[10px] text-mts-text-secondary">
                  {{ form.photoFileName }}
                </p>
              </div>
            </div>
          </section>

          <!-- Step 3 -->
          <section v-show="step === 3" class="mt-8 space-y-4">
            <h2 class="font-display text-lg text-mts-text">{{ t('pages.vacancyForm.step3title') }}</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.citizenship')
                }}</label>
                <input v-model="form.citizenship" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.availableFrom')
                }}</label>
                <input v-model="form.availableFrom" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.englishLevel')
                }}</label>
                <input v-model="form.englishLevel" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.mobilePhone')
                }}</label>
                <MarinePhoneField v-model="form.mobilePhone" :input-class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.homePhone')
                }}</label>
                <MarinePhoneField v-model="form.homePhone" :input-class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.email')
                }}</label>
                <input v-model="form.email" type="email" :class="fieldInputClass" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.messenger')
                }}</label>
                <input v-model="form.messenger" type="text" :class="fieldInputClass" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.homeAddress')
                }}</label>
                <textarea v-model="form.homeAddress" rows="3" :class="fieldInputClass" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.nearestAirport')
                }}</label>
                <input v-model="form.nearestAirport" type="text" :class="fieldInputClass" />
              </div>
            </div>
          </section>

          <!-- Step 4 NOK -->
          <section v-show="step === 4" class="mt-8 space-y-4">
            <h2 class="font-display text-lg text-mts-text">{{ t('pages.vacancyForm.step4title') }}</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.nokLastName')
                }}</label>
                <input v-model="form.nokLastName" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.nokContactNumber')
                }}</label>
                <MarinePhoneField v-model="form.nokContactNumber" :input-class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.nokFirstName')
                }}</label>
                <input v-model="form.nokFirstName" type="text" :class="fieldInputClass" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.nokEmail')
                }}</label>
                <input v-model="form.nokEmail" type="email" :class="fieldInputClass" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                  t('pages.vacancyForm.fields.nokRelationship')
                }}</label>
                <input v-model="form.nokRelationship" type="text" :class="fieldInputClass" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
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
            <div class="rounded-xl border border-mts-border bg-white p-5 shadow-sm">
              <h2 class="font-display mb-4 text-lg text-mts-text">{{ t('pages.vacancies.safetySizes') }}</h2>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                    t('pages.vacancyForm.fields.safetyOverallSize')
                  }}</label>
                  <input v-model="form.safetyOverallSize" type="text" :class="fieldInputClass" />
                </div>
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                    t('pages.vacancyForm.fields.safetyHeight')
                  }}</label>
                  <input v-model="form.safetyHeight" type="text" :class="fieldInputClass" />
                </div>
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                    t('pages.vacancyForm.fields.safetyShoeSize')
                  }}</label>
                  <input v-model="form.safetyShoeSize" type="text" :class="fieldInputClass" />
                </div>
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
                    t('pages.vacancyForm.fields.safetyWeight')
                  }}</label>
                  <input v-model="form.safetyWeight" type="text" :class="fieldInputClass" />
                </div>
              </div>
            </div>
          </section>

          <!-- Step 10 Consents -->
          <section v-show="step === 10" class="mt-8 space-y-6">
            <h2 class="font-display text-lg text-mts-text">{{ t('pages.vacancyForm.consentsTitle') }}</h2>
            <label class="flex cursor-pointer gap-3">
              <input v-model="form.consentRuAccuracy" type="checkbox" class="mts-checkbox mt-1" />
              <span class="font-body text-[11px] leading-snug text-mts-text-secondary">
                {{ t('pages.vacancyForm.consentRu1') }}
              </span>
            </label>
            <label class="flex cursor-pointer gap-3">
              <input v-model="form.consentRuPd" type="checkbox" class="mt-1 size-4 accent-mts-accent" />
              <span class="font-body text-[11px] leading-snug text-mts-text-secondary">
                {{ t('pages.vacancyForm.consentRu2') }}
              </span>
            </label>
            <label class="flex cursor-pointer gap-3">
              <input v-model="form.consentEnAccuracy" type="checkbox" class="mts-checkbox mt-1" />
              <span class="font-body text-[11px] leading-snug text-mts-text-secondary">
                {{ t('pages.vacancyForm.consentEn1') }}
              </span>
            </label>
            <label class="flex cursor-pointer gap-3">
              <input v-model="form.consentEnPd" type="checkbox" class="mts-checkbox mt-1" />
              <span class="font-body text-[11px] leading-snug text-mts-text-secondary">
                {{ t('pages.vacancyForm.consentEn2') }}
              </span>
            </label>
          </section>

          <div v-if="!submitted" class="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-mts-border pt-8">
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
