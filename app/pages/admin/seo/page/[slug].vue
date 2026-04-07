<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { SeoFields, SiteSeoPage } from '~/types'
import SeoAdminFields from "~/components/admin/SeoAdminFields.vue";

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const page = ref<SiteSeoPage | null>(null)
const seo = ref<SeoFields>({ seoTitle: '', seoDescription: '', seoKeywords: '' })
const loading = ref(true)
const saving = ref(false)

onMounted(async () => {
  try {
    const p = await api.seoPages.getBySlug(slug.value)
    page.value = p
    seo.value = {
      seoTitle: p.seoTitle ?? '',
      seoDescription: p.seoDescription ?? '',
      seoKeywords: p.seoKeywords ?? '',
    }
  } catch {
    await navigateTo('/admin/seo')
  } finally {
    loading.value = false
  }
})

async function submit() {
  saving.value = true
  try {
    await api.seoPages.update(slug.value, seo.value)
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
      <div class="mx-auto flex h-16 max-w-4xl items-center px-6 lg:px-12">
        <NuxtLink to="/admin/seo" class="mr-4 text-mts-text-secondary hover:text-mts-accent">
          <ArrowLeft class="h-5 w-5" />
        </NuxtLink>
        <h1 class="font-display text-xl text-mts-text">
          SEO: {{ page?.label || slug }}
        </h1>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <form v-else class="relative border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <div class="absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 border-mts-accent" />
        <div class="absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2 border-mts-accent" />

        <SeoAdminFields v-model="seo" />

        <div class="mt-8 flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          <NuxtLink to="/admin/seo" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
