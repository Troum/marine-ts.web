<script setup lang="ts">
import { ArrowLeft, Loader2, ClipboardList } from 'lucide-vue-next'
import type { MarineContentLocale, SeoFields } from '~/types'
import SeoAdminFields from '~/components/admin/SeoAdminFields.vue'
import { mergeVacancyTranslations } from '~/utils/adminTranslationForms'
import { htmlToPlainLinesForBullets, incomingCmsValueToHtml } from '~/utils/adminHtmlField'
import { normalizeBodyForEditor } from '~/composables/useMarkdownSafeHtml'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const idParam = computed(() => route.params.id as string)
const isNew = computed(() => idParam.value === 'new')

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())

const form = ref({
  slug: '',
  sortOrder: 0,
  isPublished: true,
  translations: mergeVacancyTranslations(),
})

/** Текстовое представление списка требований по языкам. */
const requirementsText = ref<Record<MarineContentLocale, string>>(
  Object.fromEntries(MARINE_CONTENT_LOCALES.map((loc) => [loc, '<p></p>'])) as Record<
    MarineContentLocale,
    string
  >,
)

const loading = ref(!isNew.value)
const saving = ref(false)

const seoForTab = computed<SeoFields>({
  get() {
    const t = form.value.translations[localeTab.value]
    return {
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      seoKeywords: t.seoKeywords,
      seoImage: t.seoImage,
    }
  },
  set(v: SeoFields) {
    const t = form.value.translations[localeTab.value]
    t.seoTitle = v.seoTitle
    t.seoDescription = v.seoDescription
    t.seoKeywords = v.seoKeywords
    t.seoImage = v.seoImage
  },
})

function syncRequirementsTextFromForm() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    requirementsText.value[loc] = incomingCmsValueToHtml((form.value.translations[loc].requirements ?? []).join('\n'))
  }
}

function normalizeVacancyContentForEditor() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    form.value.translations[loc].content = normalizeBodyForEditor(form.value.translations[loc].content)
  }
}

onMounted(async () => {
  if (isNew.value) {
    loading.value = false
    return
  }
  try {
    const item = await api.vacancies.getById(Number(idParam.value))
    form.value = {
      slug: item.slug,
      sortOrder: item.sortOrder,
      isPublished: item.isPublished,
      translations: mergeVacancyTranslations(item.translations),
    }
    normalizeVacancyContentForEditor()
    syncRequirementsTextFromForm()
  } catch {
    await navigateTo('/admin/vacancies')
  } finally {
    loading.value = false
  }
})

function applyRequirementsTextToTranslations() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    form.value.translations[loc].requirements = htmlToPlainLinesForBullets(requirementsText.value[loc])
  }
}

function validate(): boolean {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const t = form.value.translations[loc]
    if (!t.title?.trim() || !t.excerpt?.trim()) {
      return false
    }
  }
  return true
}

async function submit() {
  applyRequirementsTextToTranslations()
  if (!validate()) {
    await showAdminAlert({
      message: 'Заполните название и краткое описание на русском и английском.',
      variant: 'error',
    })
    return
  }
  saving.value = true
  try {
    const payload = {
      slug: form.value.slug || undefined,
      sortOrder: Number(form.value.sortOrder) || 0,
      isPublished: form.value.isPublished,
      translations: form.value.translations,
    }
    if (isNew.value) {
      await api.vacancies.create(payload)
    } else {
      await api.vacancies.update(Number(idParam.value), payload)
    }
    adminToast.success(isNew.value ? 'Вакансия создана' : 'Вакансия сохранена')
    await navigateTo('/admin/vacancies')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить вакансию', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div class="flex h-16 flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin/vacancies" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
              <ArrowLeft class="h-5 w-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">
              {{ isNew ? 'Новая вакансия' : 'Редактирование вакансии' }}
            </h1>
          </div>
          <NuxtLink
            v-if="!isNew"
            :to="`/admin/vacancies/${idParam}/application-forms`"
            class="inline-flex items-center gap-2 border border-mts-border px-3 py-1.5 font-mono text-[10px] uppercase text-mts-text hover:border-mts-accent hover:text-mts-accent"
          >
            <ClipboardList class="h-4 w-4" />
            Анкеты
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <form v-else class="relative border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <CommonAccentCorners />

        <div class="space-y-8">
          <section class="space-y-6">
            <h2 class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">Общие поля</h2>
            <div>
              <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">URL (slug)</label>
              <input
                v-model="form.slug"
                type="text"
                placeholder="Пусто — сгенерируется из названия"
                class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-mono text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
            <div class="grid gap-4 md:grid-cols-[minmax(0,12rem)_1fr] md:items-center md:gap-x-8">
              <div class="space-y-2">
                <label
                  for="vacancy-sort-order"
                  class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Порядок сортировки</label
                >
                <AdminInputNumberStepper
                  id="vacancy-sort-order"
                  v-model="form.sortOrder"
                  hint="Целое число от 0 — меньшее значение выше в списке."
                  decrement-label="Уменьшить порядок сортировки"
                  increment-label="Увеличить порядок сортировки"
                />
              </div>
              <label
                class="flex cursor-pointer select-none items-center gap-2.5 font-body text-sm text-mts-text md:justify-start"
              >
                <input v-model="form.isPublished" type="checkbox" class="mts-checkbox" />
                <span>Опубликовано на сайте</span>
              </label>
            </div>
          </section>

          <section class="space-y-6 border-t border-mts-border pt-8">
            <AdminLocaleTabs v-model="localeTab" label="Тексты и SEO" />
            <div class="space-y-6">
              <div>
                <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Название *</label
                >
                <AdminThemedTextField v-model="form.translations[localeTab].title" :multiline="false" />
              </div>
              <div>
                <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Краткое описание *</label
                >
                <AdminThemedTextField v-model="form.translations[localeTab].excerpt" />
              </div>
              <div>
                <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Полный текст</label
                >
                <AdminRichTextEditor
                  :model-value="form.translations[localeTab].content"
                  :disabled="saving"
                  :allow-images="false"
                  placeholder="Полный текст вакансии…"
                  @update:model-value="form.translations[localeTab].content = $event"
                />
              </div>
              <div>
                <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Требования (каждый пункт — новый абзац или новая строка)</label
                >
                <AdminRichTextEditor
                  :model-value="requirementsText[localeTab]"
                  :disabled="saving"
                  :allow-images="false"
                  placeholder="Каждый пункт требования — отдельным абзацем или строкой…"
                  @update:model-value="requirementsText[localeTab] = $event"
                />
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                    >Локация</label
                  >
                  <AdminThemedTextField v-model="form.translations[localeTab].location" :multiline="false" />
                </div>
                <div>
                  <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                    >Тип занятости</label
                  >
                  <AdminThemedTextField
                    v-model="form.translations[localeTab].employmentType"
                    placeholder="Полная занятость"
                    :multiline="false"
                  />
                </div>
              </div>
              <div class="rounded-md border border-mts-border/80 bg-mts-bg/40 p-4">
                <p class="mb-3 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">SEO</p>
                <SeoAdminFields v-model="seoForTab" />
              </div>
            </div>
          </section>
        </div>

        <div class="mt-8 flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          <NuxtLink to="/admin/vacancies" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
