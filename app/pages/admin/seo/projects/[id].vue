<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { MarineContentLocale, SeoFields } from '~/types'
import SeoAdminFields from '~/components/admin/SeoAdminFields.vue'
import { mergeProjectTranslations } from '~/utils/adminTranslationForms'
import { defaultMarineLocale } from '~/utils/marineLocales'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const id = computed(() => Number(route.params.id))
const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const titleHint = ref('')
const translations = ref(mergeProjectTranslations())
const loading = ref(true)
const saving = ref(false)

const seoForTab = computed<SeoFields>({
  get() {
    const t = translations.value[localeTab.value]
    return {
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      seoKeywords: t.seoKeywords,
      seoImage: t.seoImage,
    }
  },
  set(v: SeoFields) {
    const t = translations.value[localeTab.value]
    t.seoTitle = v.seoTitle
    t.seoDescription = v.seoDescription
    t.seoKeywords = v.seoKeywords
    t.seoImage = v.seoImage
  },
})

onMounted(async () => {
  try {
    const item = await api.projects.getById(id.value)
    titleHint.value = item.translations?.ru?.title ?? item.title
    translations.value = mergeProjectTranslations(item.translations)
  } catch {
    await navigateTo('/admin/seo/projects')
  } finally {
    loading.value = false
  }
})

async function submit() {
  saving.value = true
  try {
    await api.projects.update(id.value, { translations: translations.value })
    adminToast.success('SEO для проекта сохранено')
    await navigateTo('/admin/seo/projects')
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
      <div class="mx-auto flex h-16 max-w-[1600px] items-center px-6 lg:px-12">
        <NuxtLink to="/admin/seo/projects" class="mr-4 text-mts-text-secondary hover:text-mts-accent">
          <ArrowLeft class="h-5 w-5" />
        </NuxtLink>
        <h1 class="font-display text-xl text-mts-text">SEO проекта</h1>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <p class="font-body mb-6 text-mts-text-secondary">{{ titleHint }}</p>
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <form v-else class="relative border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <CommonAccentCorners />
        <div class="space-y-6">
          <AdminLocaleTabs v-model="localeTab" label="Язык" />
          <SeoAdminFields v-model="seoForTab" />
        </div>
        <div class="mt-8 flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          <NuxtLink to="/admin/seo/projects" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
