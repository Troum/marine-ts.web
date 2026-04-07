<script setup lang="ts">
import {ArrowLeft, ArrowRight, Check, Loader2} from 'lucide-vue-next'
import VacancyCertTable from '~/components/vacancy-application/VacancyCertTable.vue'
import VacancyEducationTable from '~/components/vacancy-application/VacancyEducationTable.vue'
import VacancySeaServiceTable from '~/components/vacancy-application/VacancySeaServiceTable.vue'
import type {VacancyApplicationForm} from '~/types/applicationForm'
import {createVacancyApplicationForm} from '~/composables/useVacancyApplicationForm'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const api = useMarineApi()

const { data: vacancy, pending } = await useAsyncData(
  () => `vacancy-application-form-${slug.value}`,
  async () => {
    try {
      return await api.vacancies.getBySlug(slug.value)
    } catch {
      return null
    }
  },
  { watch: [slug] },
)

const form = ref<VacancyApplicationForm | null>(null)

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

const stepsMeta = [
  { n: 1, title: 'Начало' },
  { n: 2, title: 'Личные данные' },
  { n: 3, title: 'Контакты и адрес' },
  { n: 4, title: 'Родственник (NOK)' },
  { n: 5, title: 'Документы для поездок' },
  { n: 6, title: 'Сертификаты компетенций' },
  { n: 7, title: 'Прочие сертификаты' },
  { n: 8, title: 'Морская служба' },
  { n: 9, title: 'Образование и размеры' },
  { n: 10, title: 'Согласия и отправка' },
]

useSeoMeta({
  title: 'Анкета — Marine Technical Solutions',
  robots: 'noindex, nofollow',
})

function validateStep(s: number): string | null {
  const f = form.value
  if (!f) {
    return 'Форма не загружена'
  }
  if (s === 2) {
    if (!f.lastName?.trim() || !f.firstName?.trim() || !f.dateOfBirth?.trim()) {
      return 'Укажите фамилию, имя и дату рождения'
    }
  }
  if (s === 3) {
    if (!f.email?.trim() || !f.mobilePhone?.trim()) {
      return 'Укажите email и мобильный телефон'
    }
  }
  if (s === 10 && !submitted.value) {
    if (!f.consentRuAccuracy || !f.consentRuPd || !f.consentEnAccuracy || !f.consentEnPd) {
      return 'Необходимо подтвердить все пункты согласия'
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
    await api.applicationForms.submit(slug.value, form.value)
    try {
      const key = `mts-application-form-${form.value.vacancySlug}-${Date.now()}`
      localStorage.setItem(
        key,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          payload: form.value,
        }),
      )
    } catch {
      /* ignore quota */
    }
    submitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {
    submitError.value = 'Не удалось отправить анкету. Проверьте соединение и попробуйте снова.'
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
      <p class="mb-6 font-body text-mts-text-secondary">Вакансия не найдена или снята с публикации.</p>
      <NuxtLink to="/vacancies" class="btn-primary inline-flex">К списку вакансий</NuxtLink>
    </div>
    <div v-else class="relative mx-auto max-w-4xl px-6 pb-24 pt-8 lg:px-12">
      <div class="absolute inset-0 -z-10 grid-bg opacity-20" />

      <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <NuxtLink
          :to="`/vacancies/${slug}`"
          class="inline-flex items-center gap-2 font-mono text-xs uppercase text-mts-text-secondary transition-colors hover:text-mts-accent"
        >
          <ArrowLeft class="h-4 w-4" />
          К вакансии
        </NuxtLink>
        <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
          Шаг {{ step }} / {{ totalSteps }}
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
          <h1 class="font-display text-2xl text-mts-text">Анкета отправлена</h1>
          <p class="mt-4 font-body text-sm leading-relaxed text-mts-text-secondary">
            Мы получили ваши данные и свяжемся с вами при необходимости.
          </p>
          <NuxtLink :to="`/vacancies/${slug}`" class="btn-primary mt-8 inline-flex"> Вернуться к вакансии </NuxtLink>
        </div>

        <template v-else>
          <h1 class="font-display text-2xl text-mts-text md:text-3xl">
            <span class="text-mts-accent">Анкета</span> — {{ vacancy.title }}
          </h1>
          <p class="mt-2 font-body text-sm text-mts-text-secondary">
            Заполнение по шагам. После отправки данные сохраняются на сервере.
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
              Вы заполняете анкету на позицию
              <strong class="text-mts-text">{{ form.positionApplyingFor }}</strong>. Потребуется около 15–25 минут. Можно
              вернуться к предыдущим шагам кнопкой «Назад».
            </p>
            <ul class="list-inside list-disc space-y-2 font-body text-sm text-mts-text-secondary">
              <li>Документы и сертификаты — фиксированный список плюс дополнительные строки, если нужно.</li>
              <li>Фото можно приложить файлом с устройства.</li>
              <li>В конце — согласия на обработку персональных данных (RU/EN).</li>
            </ul>
          </section>

          <!-- Step 2 -->
          <section v-show="step === 2" class="mt-8 space-y-4">
            <h2 class="font-display text-lg text-mts-text">Персональные данные</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Position applying for</label>
                <input v-model="form.positionApplyingFor" type="text" readonly class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Last name / Surname *</label>
                <input v-model="form.lastName" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" @blur="syncSurnameName" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">First name *</label>
                <input v-model="form.firstName" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" @blur="syncSurnameName" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Father's name</label>
                <input v-model="form.fathersName" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Date of birth *</label>
                <input v-model="form.dateOfBirth" type="text" placeholder="ДД.ММ.ГГГГ" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Marital status</label>
                <input v-model="form.maritalStatus" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Place of birth</label>
                <input v-model="form.placeOfBirth" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Photo (файл)</label>
                <input
                  type="file"
                  accept="image/*"
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
            <h2 class="font-display text-lg text-mts-text">Контакты и адрес</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Citizenship</label>
                <input v-model="form.citizenship" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Available from</label>
                <input v-model="form.availableFrom" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">English level (basic / medium / fluent)</label>
                <input v-model="form.englishLevel" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Mobile phone *</label>
                <input v-model="form.mobilePhone" type="tel" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Home phone</label>
                <input v-model="form.homePhone" type="tel" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">E-mail *</label>
                <input v-model="form.email" type="email" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Messenger (WhatsApp / Telegram и т.д.)</label>
                <input v-model="form.messenger" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Complete home address</label>
                <textarea v-model="form.homeAddress" rows="3" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Nearest airport</label>
                <input v-model="form.nearestAirport" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
            </div>
          </section>

          <!-- Step 4 NOK -->
          <section v-show="step === 4" class="mt-8 space-y-4">
            <h2 class="font-display text-lg text-mts-text">Next of kin (NOK) — экстренный контакт</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Last name</label>
                <input v-model="form.nokLastName" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">NOK contact number</label>
                <input v-model="form.nokContactNumber" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">First name</label>
                <input v-model="form.nokFirstName" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">E-mail address</label>
                <input v-model="form.nokEmail" type="email" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Relationship (spouse, mother, father, etc.)</label>
                <input v-model="form.nokRelationship" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">NOK address</label>
                <textarea v-model="form.nokAddress" rows="3" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
              </div>
            </div>
          </section>

          <!-- Step 5 Travel -->
          <section v-show="step === 5" class="mt-8 space-y-6">
            <VacancyCertTable
              v-model:extra-rows="form.travelOtherRows"
              title="Документы для поездок"
              :rows="form.travelRows"
              extra-hint="Если есть другие документы для поездок, заполните блоки ниже — можно добавить несколько строк."
            />
          </section>

          <!-- Step 6 Competency -->
          <section v-show="step === 6" class="mt-8 space-y-6">
            <VacancyCertTable
              v-model:extra-rows="form.competencyOtherRows"
              title="Сертификаты компетенций (CoC, GMDSS и др.)"
              :rows="form.competencyRows"
              extra-hint="Дополнительные сертификаты компетенций — укажите ниже, при необходимости добавьте строки."
            />
          </section>

          <!-- Step 7 Other certs -->
          <section v-show="step === 7" class="mt-8 space-y-6">
            <VacancyCertTable
              v-model:extra-rows="form.otherCertificateExtraRows"
              title="Прочие сертификаты (безопасность, ECDIS и др.)"
              :rows="form.otherCertificateRows"
              extra-hint="Любые другие сертификаты — в отдельных блоках; при необходимости добавьте ещё строки."
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
              <h2 class="font-display mb-4 text-lg text-mts-text">Размеры спецодежды</h2>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Overall size</label>
                  <input v-model="form.safetyOverallSize" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
                </div>
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Height</label>
                  <input v-model="form.safetyHeight" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
                </div>
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Shoe size</label>
                  <input v-model="form.safetyShoeSize" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
                </div>
                <div>
                  <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Weight</label>
                  <input v-model="form.safetyWeight" type="text" class="w-full border border-mts-border bg-mts-bg px-3 py-2.5 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none" />
                </div>
              </div>
            </div>
          </section>

          <!-- Step 10 Consents -->
          <section v-show="step === 10" class="mt-8 space-y-6">
            <h2 class="font-display text-lg text-mts-text">Согласия</h2>
            <label class="flex cursor-pointer gap-3">
              <input v-model="form.consentRuAccuracy" type="checkbox" class="mts-checkbox mt-1" />
              <span class="font-body text-[11px] leading-snug text-mts-text-secondary">
                Настоящим я подтверждаю, что все данные, насколько они были мне известны, точны и верны...
              </span>
            </label>
            <label class="flex cursor-pointer gap-3">
              <input v-model="form.consentRuPd" type="checkbox" class="mt-1 size-4 accent-mts-accent" />
              <span class="font-body text-[11px] leading-snug text-mts-text-secondary">
                Отправляя анкету, я предоставляю согласие ООО «Марин Техникал Солюшионс» на обработку персональных данных...
              </span>
            </label>
            <label class="flex cursor-pointer gap-3">
              <input v-model="form.consentEnAccuracy" type="checkbox" class="mts-checkbox mt-1" />
              <span class="font-body text-[11px] leading-snug text-mts-text-secondary">
                I confirm that the details given are to the best of my knowledge accurate and true...
              </span>
            </label>
            <label class="flex cursor-pointer gap-3">
              <input v-model="form.consentEnPd" type="checkbox" class="mts-checkbox mt-1" />
              <span class="font-body text-[11px] leading-snug text-mts-text-secondary">
                By submitting the application form, I give my consent to LLC "Marine Technical Solutions" for the
                processing of personal data...
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
              Назад
            </button>
            <div v-else />
            <div class="flex gap-3">
              <button
                v-if="step < totalSteps"
                type="button"
                class="btn-primary inline-flex items-center gap-2"
                @click="nextStep"
              >
                Далее
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
                {{ submitting ? 'Отправка…' : 'Завершить' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
