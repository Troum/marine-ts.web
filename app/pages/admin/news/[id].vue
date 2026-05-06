<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { MarineContentLocale, SeoFields } from '~/types'
import SeoAdminFields from '~/components/admin/SeoAdminFields.vue'
import MtsDateInput from '~/components/common/MtsDateInput.vue'
import { mergeNewsTranslations } from '~/utils/adminTranslationForms'
import { defaultMarineLocale } from '~/utils/marineLocales'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const api = useMarineApi()
const { t } = useI18n()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const idParam = computed(() => route.params.id as string)
const isNew = computed(() => idParam.value === 'new')

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())

const form = ref({
  slug: '',
  /** ISO YYYY-MM-DD для корректной локализации даты на сайте */
  date: '',
  author: '',
  featured: false,
  translations: mergeNewsTranslations(),
})

/** Если в БД была длинная строка без ISO — показываем подсказку */
const loadedLegacyDate = ref('')

const categories = ['Компания', 'Проекты', 'Технологии', 'Сертификация', 'Мероприятия', 'Обучение']

const categoryOptions = categories.map((c) => ({ value: c, label: c }))
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

function dateToIsoInput(raw: string | undefined): { iso: string; legacy: string } {
  const m = raw?.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) {
    return { iso: m[1], legacy: '' }
  }
  if (raw?.trim()) {
    return { iso: new Date().toISOString().slice(0, 10), legacy: raw.trim() }
  }
  return { iso: new Date().toISOString().slice(0, 10), legacy: '' }
}

onMounted(async () => {
  if (isNew.value) {
    form.value.date = new Date().toISOString().slice(0, 10)
    loadedLegacyDate.value = ''
    loading.value = false
    return
  }
  try {
    const item = await api.news.getById(Number(idParam.value))
    const { iso, legacy } = dateToIsoInput(item.date)
    loadedLegacyDate.value = legacy
    form.value = {
      slug: item.slug,
      date: iso,
      author: item.author,
      featured: item.featured ?? false,
      translations: mergeNewsTranslations(item.translations),
    }
  } catch {
    await navigateTo('/admin/news')
  } finally {
    loading.value = false
  }
})

function validateTranslations(): boolean {
  for (const loc of ['ru', 'en'] as const) {
    const t = form.value.translations[loc]
    if (!t.title?.trim() || !t.excerpt?.trim()) {
      return false
    }
  }
  return true
}

async function submit() {
  if (!validateTranslations()) {
    await showAdminAlert({
      message: 'Заполните заголовок и краткое описание на русском и английском.',
      variant: 'error',
    })
    return
  }
  saving.value = true
  try {
    const payload = {
      slug: form.value.slug?.trim() || undefined,
      date: form.value.date,
      author: form.value.author,
      featured: form.value.featured,
      translations: form.value.translations,
    }
    if (isNew.value) {
      await api.news.create(payload)
    } else {
      await api.news.update(Number(idParam.value), payload)
    }
    adminToast.success(isNew.value ? 'Новость создана' : 'Новость сохранена')
    await navigateTo('/admin/news')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить новость', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin/news" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">
              {{ isNew ? 'Новая новость' : 'Редактирование новости' }}
            </h1>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <form v-else class="bg-white border border-mts-border shadow-tech p-8 relative" @submit.prevent="submit">
        <CommonAccentCorners />

        <div class="space-y-8">
          <section class="space-y-6">
            <h2 class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">Общие поля</h2>
            <div>
              <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">URL (slug)</label>
              <input
                v-model="form.slug"
                type="text"
                placeholder="Оставьте пустым — сгенерируется из заголовка"
                class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm font-mono focus:outline-none focus:border-mts-accent"
              />
              <p class="mt-1 font-body text-xs text-mts-text-secondary">
                Латиница, цифры и дефисы. Один slug для всех языков.
              </p>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Дата *</label>
                <MtsDateInput
                  v-model="form.date"
                  required
                  :placeholder="t('pages.common.datePlaceholder')"
                  input-class="!rounded-none border-mts-border bg-mts-bg py-3 pe-4 font-body text-sm"
                />
                <p v-if="loadedLegacyDate" class="mt-2 font-body text-xs text-amber-800">
                  Ранее в базе: «{{ loadedLegacyDate }}». Уточните дату в календаре и сохраните — так дата корректно отобразится на сайте на русском и английском.
                </p>
              </div>
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Автор *</label>
                <AdminThemedTextField v-model="form.author" :multiline="false" />
              </div>
            </div>
            <label class="flex items-center gap-2 font-body text-sm">
              <input v-model="form.featured" type="checkbox" class="mts-checkbox" />
              Избранная новость
            </label>
          </section>

          <section class="space-y-6 border-t border-mts-border pt-8">
            <AdminLocaleTabs v-model="localeTab" label="Тексты и SEO" />
            <div class="space-y-6">
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Заголовок *</label>
                <AdminThemedTextField v-model="form.translations[localeTab].title" :multiline="false" />
              </div>
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Краткое описание *</label>
                <AdminThemedTextField v-model="form.translations[localeTab].excerpt" />
              </div>
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Текст</label>
                <AdminThemedTextField v-model="form.translations[localeTab].content" />
              </div>
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Категория</label>
                <AdminSelect v-model="form.translations[localeTab].category" :options="categoryOptions" />
              </div>
              <div class="rounded-md border border-mts-border/80 bg-mts-bg/40 p-4">
                <p class="mb-3 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">SEO</p>
                <SeoAdminFields v-model="seoForTab" />
              </div>
            </div>
          </section>
        </div>

        <div class="mt-8 flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
          <NuxtLink to="/admin/news" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
