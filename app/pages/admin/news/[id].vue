<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { NewsItem } from '~/types'

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

const form = ref<Partial<NewsItem>>({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  date: '',
  author: '',
  category: 'Компания',
  featured: false,
})

const categories = ['Компания', 'Проекты', 'Технологии', 'Сертификация', 'Мероприятия', 'Обучение']

const categoryOptions = categories.map((c) => ({ value: c, label: c }))
const loading = ref(!isNew.value)
const saving = ref(false)

onMounted(async () => {
  if (isNew.value) {
    const d = new Date()
    form.value.date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    loading.value = false
    return
  }
  try {
    const item = await api.news.getById(Number(idParam.value))
    form.value = { ...item }
  } catch {
    await navigateTo('/admin/news')
  } finally {
    loading.value = false
  }
})

async function submit() {
  saving.value = true
  try {
    if (isNew.value) {
      await api.news.create(form.value as Omit<NewsItem, 'id'>)
    } else {
      await api.news.update(Number(idParam.value), form.value)
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
      <div class="max-w-4xl mx-auto px-6 lg:px-12">
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

    <main class="max-w-4xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <form v-else class="bg-white border border-mts-border shadow-tech p-8 relative" @submit.prevent="submit">
        <div class="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-mts-accent" />
        <div class="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-mts-accent" />

        <div class="space-y-6">
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Заголовок *</label>
            <input
              v-model="form.title"
              required
              type="text"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent"
            />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
              >URL (slug)</label
            >
            <input
              v-model="form.slug"
              type="text"
              placeholder="Оставьте пустым — сгенерируется из заголовка"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm font-mono focus:outline-none focus:border-mts-accent"
            />
            <p class="mt-1 font-body text-xs text-mts-text-secondary">
              Латиница, цифры и дефисы. Можно задать вручную для сохранения старых ссылок (SEO).
            </p>
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Краткое описание *</label>
            <textarea
              v-model="form.excerpt"
              required
              rows="3"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent"
            />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Текст</label>
            <textarea
              v-model="form.content"
              rows="8"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent"
            />
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Дата *</label>
              <input
                v-model="form.date"
                required
                type="text"
                class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm"
              />
            </div>
            <div>
              <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Автор *</label>
              <input
                v-model="form.author"
                required
                type="text"
                class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm"
              />
            </div>
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Категория</label>
            <AdminSelect v-model="form.category" :options="categoryOptions" />
          </div>
          <label class="flex items-center gap-2 font-body text-sm">
            <input v-model="form.featured" type="checkbox" class="mts-checkbox" />
            Избранная новость
          </label>
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
