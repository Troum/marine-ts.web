<script setup lang="ts">
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-vue-next'
import type { ContentPage, MarineContentLocale, VacanciesPageData } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import AdminThemeTitleEditor from '~/components/admin/AdminThemeTitleEditor.vue'
import { defaultListingData, mergeListingPageData } from '~/utils/pageDefaults'

const SLUG = 'vacancies-page'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

const data = ref<Record<MarineContentLocale, VacanciesPageData>>({
  ru: defaultListingData(SLUG, 'ru') as VacanciesPageData,
  en: defaultListingData(SLUG, 'en') as VacanciesPageData,
})

const d = computed(() => data.value[localeTab.value])

const collapsed = ref<Record<string, boolean>>({ hero: false, cta: true })
function toggle(s: string) {
  collapsed.value[s] = !collapsed.value[s]
}

onMounted(async () => {
  try {
    const page = await api.contentPages.getPublicBySlug(SLUG)
    if (page) {
      existingId.value = page.id
      const managed = await api.contentPages.getManageById(page.id)
      for (const loc of MARINE_CONTENT_LOCALES) {
        const body = managed.translations?.[loc]?.body
        if (body) {
          try {
            const parsed = JSON.parse(body)
            if (parsed?.hero) {
              data.value[loc] = mergeListingPageData(SLUG, loc, parsed) as VacanciesPageData
            }
          } catch {
            /* keep defaults */
          }
        }
      }
    }
  } catch {
    /* no existing page */
  } finally {
    loading.value = false
  }
})

async function submit() {
  const inq = data.value[localeTab.value].showInquiryForm
  const heroImg = data.value[localeTab.value].heroImage
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].showInquiryForm = inq
    data.value[loc].heroImage = heroImg
  }
  saving.value = true
  try {
    const translations = {} as Record<
      MarineContentLocale,
      { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }
    >
    for (const loc of MARINE_CONTENT_LOCALES) {
      translations[loc] = {
        title: loc === 'ru' ? 'Вакансии' : 'Vacancies',
        excerpt: '',
        body: JSON.stringify(data.value[loc]),
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
      }
    }
    if (existingId.value) {
      await api.contentPages.update(existingId.value, { slug: SLUG, isPublished: true, translations })
    } else {
      const created = await api.contentPages.create({ slug: SLUG, isPublished: true, sortOrder: 0, translations })
      existingId.value = (created as ContentPage).id
    }
    adminToast.success('Страница «Вакансии» сохранена')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally {
    saving.value = false
  }
}

const sectionLabel = 'block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2'
const sectionInput = 'w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent'
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-7xl px-6 lg:px-12">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary transition-colors hover:text-mts-accent"
              ><ArrowLeft class="h-5 w-5"
            /></NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Страница «Вакансии»</h1>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/vacancies"
              target="_blank"
              class="font-body text-sm text-mts-text-secondary transition-colors hover:text-mts-accent"
              >Открыть на сайте ↗</NuxtLink
            >
            <button type="button" :disabled="saving || loading" class="btn-primary px-6 disabled:opacity-50" @click="submit">
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <!-- HERO -->
        <section class="relative border border-mts-border bg-white shadow-tech">
          <CommonAccentCorners />
          <button type="button" class="flex w-full items-center justify-between p-6" @click="toggle('hero')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">1. Hero-блок</h2>
            <ChevronDown
              class="h-4 w-4 text-mts-text-secondary transition-transform"
              :class="{ 'rotate-180': !collapsed.hero }"
            />
          </button>
          <div v-show="!collapsed.hero" class="space-y-4 border-t border-mts-border px-6 pt-4 pb-6">
            <AdminHeroImageField
              v-model="d.heroImage"
              label="Фон hero страницы «Вакансии»"
              hint="Необязательно. Нажмите «Загрузить файл» (jpeg, png, webp) или вставьте URL — фон отображается над списком вакансий на /vacancies. Один файл для обоих языков."
            />
            <div>
              <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
              <AdminThemeTitleEditor v-model="d.hero.titleFormatted" />
            </div>
            <div>
              <label :class="sectionLabel">Лид</label>
              <AdminThemedTextField v-model="d.hero.lead" />
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="relative border border-mts-border bg-white shadow-tech">
          <CommonAccentCorners />
          <button type="button" class="flex w-full items-center justify-between p-6" @click="toggle('cta')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">2. CTA под списком вакансий</h2>
            <ChevronDown
              class="h-4 w-4 text-mts-text-secondary transition-transform"
              :class="{ 'rotate-180': !collapsed.cta }"
            />
          </button>
          <div v-show="!collapsed.cta" class="space-y-4 border-t border-mts-border px-6 pt-4 pb-6">
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.cta!.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Текст кнопки (ведёт на страницу заявки)</label>
              <AdminThemedTextField v-model="d.cta!.buttonText" :multiline="false" />
            </div>
          </div>
        </section>

        <AdminCustomSectionsEditor
          :model-value="d.customSections ?? []"
          @update:model-value="(v) => (d.customSections = v)"
        />

        <section class="relative border border-mts-border bg-white p-6 shadow-tech">
          <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.showInquiryForm" type="checkbox" class="mts-checkbox" />
            Показать форму заявки внизу страницы «Вакансии»
          </label>
        </section>

        <div class="flex justify-end">
          <button type="button" :disabled="saving" class="btn-primary px-8 disabled:opacity-50" @click="submit">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
