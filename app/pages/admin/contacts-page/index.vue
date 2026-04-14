<script setup lang="ts">
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-vue-next'
import type { ContactsPageData, ContentPage, MarineContentLocale } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import { defaultContactsData } from '~/utils/pageDefaults'

const SLUG = 'contacts-page'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

const data = ref<Record<MarineContentLocale, ContactsPageData>>({
  ru: defaultContactsData('ru'),
  en: defaultContactsData('en'),
})

const d = computed(() => data.value[localeTab.value])

const collapsed = ref<Record<string, boolean>>({ hero: false, sections: true })
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
            if (parsed?.hero) data.value[loc] = { ...defaultContactsData(loc), ...parsed }
          } catch { /* keep defaults */ }
        }
      }
    }
  } catch { /* no existing page */ }
  finally {
    loading.value = false
  }
})

async function submit() {
  const inq = data.value[localeTab.value].showInquiryForm
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].showInquiryForm = inq
  }
  saving.value = true
  try {
    const translations = {} as Record<MarineContentLocale, { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }>
    for (const loc of MARINE_CONTENT_LOCALES) {
      translations[loc] = {
        title: loc === 'ru' ? 'Контакты' : 'Contacts',
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
    adminToast.success('Страница «Контакты» сохранена')
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
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Страница «Контакты»</h1>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/contacts" target="_blank" class="font-body text-sm text-mts-text-secondary hover:text-mts-accent transition-colors">
              Открыть на сайте ↗
            </NuxtLink>
            <button type="button" :disabled="saving || loading" class="btn-primary px-6 disabled:opacity-50" @click="submit">
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>

      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <!-- Hero -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('hero')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">1. Hero-блок</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.hero }" />
          </button>
          <div v-show="!collapsed.hero" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label :class="sectionLabel">Заголовок (начало)</label>
                <input v-model="d.hero.title" :class="sectionInput" />
              </div>
              <div>
                <label :class="sectionLabel">Акцент (цветной)</label>
                <input v-model="d.hero.titleAccent" :class="sectionInput" />
              </div>
            </div>
            <div>
              <label :class="sectionLabel">Лид</label>
              <textarea v-model="d.hero.lead" rows="3" :class="sectionInput" />
            </div>
          </div>
        </section>

        <!-- Contact sections -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('sections')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">2. Секции контактов</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.sections }" />
          </button>
          <div v-show="!collapsed.sections" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div>
              <label :class="sectionLabel">Заголовок блока контактной информации</label>
              <input v-model="d.infoTitle" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок формы</label>
              <input v-model="d.formTitle" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Текст под заголовком формы</label>
              <textarea v-model="d.formLead" rows="3" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок блока офисов</label>
              <input v-model="d.officesTitle" :class="sectionInput" />
            </div>
          </div>
        </section>

        <section class="bg-white border border-mts-border shadow-tech relative p-6">
          <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.showInquiryForm" type="checkbox" class="mts-checkbox" />
            Показать дополнительную форму заявки под блоком офисов (ниже основной формы обратной связи)
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
