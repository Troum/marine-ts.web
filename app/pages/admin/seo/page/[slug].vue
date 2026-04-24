<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { MarineContentLocale, SeoFields } from '~/types'
import SeoAdminFields from '~/components/admin/SeoAdminFields.vue'
import { mergeSiteSeoTranslations } from '~/utils/adminTranslationForms'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())

const page = ref<{ slug: string; label: string | null } | null>(null)
const form = ref({
  translations: mergeSiteSeoTranslations(),
})

const loading = ref(true)
const saving = ref(false)

const seoForTab = computed<SeoFields>({
  get() {
    const t = form.value.translations[localeTab.value]
    return {
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      seoKeywords: t.seoKeywords,
    }
  },
  set(v: SeoFields) {
    const t = form.value.translations[localeTab.value]
    t.seoTitle = v.seoTitle
    t.seoDescription = v.seoDescription
    t.seoKeywords = v.seoKeywords
  },
})

onMounted(async () => {
  try {
    const p = await api.seoPages.getManageBySlug(slug.value)
    page.value = { slug: p.slug, label: p.label }
    form.value.translations = mergeSiteSeoTranslations(p.translations)
  } catch {
    await navigateTo('/admin/seo')
  } finally {
    loading.value = false
  }
})

function validate(): boolean {
  for (const loc of MARINE_CONTENT_LOCALES) {
    if (!form.value.translations[loc].label?.trim()) {
      return false
    }
  }
  return true
}

async function submit() {
  if (!validate()) {
    await showAdminAlert({
      message: 'Укажите подпись страницы на русском и английском.',
      variant: 'error',
    })
    return
  }
  saving.value = true
  try {
    await api.seoPages.update(slug.value, { translations: form.value.translations })
    adminToast.success('Настройки SEO сохранены')
    await navigateTo('/admin/seo')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить SEO', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-12">
        <NuxtLink to="/admin/seo" class="mr-4 text-mts-text-secondary hover:text-mts-accent">
          <ArrowLeft class="h-5 w-5" />
        </NuxtLink>
        <h1 class="font-display text-xl text-mts-text">
          SEO: {{ page?.label || slug }}
        </h1>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <form v-else class="relative border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <CommonAccentCorners />

        <div class="space-y-8">
          <AdminLocaleTabs v-model="localeTab" label="Язык" />
          <div>
            <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
              Подпись в интерфейсе *
            </label>
            <input
              v-model="form.translations[localeTab].label"
              type="text"
              class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm text-mts-text focus:border-mts-accent focus:outline-none"
            />
          </div>
          <div class="rounded-md border border-mts-border/80 bg-mts-bg/40 p-4">
            <p class="mb-3 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Мета-теги</p>
            <SeoAdminFields v-model="seoForTab" />
          </div>
        </div>

        <div class="mt-8 flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          <NuxtLink to="/admin/seo" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
