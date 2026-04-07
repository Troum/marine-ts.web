<script setup lang="ts">
import { ArrowLeft, Loader2, ClipboardList } from 'lucide-vue-next'
import type { VacancyItem } from '~/types'

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

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  requirementsText: '',
  location: '',
  employmentType: '',
  sortOrder: 0,
  isPublished: true,
})

const loading = ref(!isNew.value)
const saving = ref(false)

onMounted(async () => {
  if (isNew.value) {
    loading.value = false
    return
  }
  try {
    const item = await api.vacancies.getById(Number(idParam.value))
    form.value = {
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      content: item.content ?? '',
      requirementsText: (item.requirements ?? []).join('\n'),
      location: item.location ?? '',
      employmentType: item.employmentType ?? '',
      sortOrder: item.sortOrder,
      isPublished: item.isPublished,
    }
  } catch {
    await navigateTo('/admin/vacancies')
  } finally {
    loading.value = false
  }
})

function buildPayload(): Partial<VacancyItem> & { requirements: string[] } {
  const requirements = form.value.requirementsText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return {
    title: form.value.title,
    slug: form.value.slug || undefined,
    excerpt: form.value.excerpt,
    content: form.value.content || null,
    requirements,
    location: form.value.location || null,
    employmentType: form.value.employmentType || null,
    sortOrder: Number(form.value.sortOrder) || 0,
    isPublished: form.value.isPublished,
  }
}

async function submit() {
  saving.value = true
  try {
    const payload = buildPayload()
    if (isNew.value) {
      await api.vacancies.create(payload as Omit<VacancyItem, 'id'>)
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
      <div class="mx-auto max-w-4xl px-6 lg:px-12">
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

    <main class="mx-auto max-w-4xl px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <form v-else class="relative border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <div class="absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 border-mts-accent" />
        <div class="absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2 border-mts-accent" />

        <div class="space-y-6">
          <div>
            <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
              >Название *</label
            >
            <input
              v-model="form.title"
              required
              type="text"
              class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">URL (slug)</label>
            <input
              v-model="form.slug"
              type="text"
              placeholder="Пусто — сгенерируется из названия"
              class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-mono text-sm focus:border-mts-accent focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
              >Краткое описание *</label
            >
            <textarea
              v-model="form.excerpt"
              required
              rows="3"
              class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
              >Полный текст</label
            >
            <textarea
              v-model="form.content"
              rows="8"
              class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
              >Требования (каждый пункт с новой строки)</label
            >
            <textarea
              v-model="form.requirementsText"
              rows="8"
              placeholder="Пункт 1&#10;Пункт 2"
              class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-mono text-xs focus:border-mts-accent focus:outline-none"
            />
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Локация</label
              >
              <input
                v-model="form.location"
                type="text"
                class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Тип занятости</label
              >
              <input
                v-model="form.employmentType"
                type="text"
                placeholder="Полная занятость"
                class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
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
              <input
                v-model="form.isPublished"
                type="checkbox"
                class="mts-checkbox"
              />
              <span>Опубликовано на сайте</span>
            </label>
          </div>
        </div>

        <div class="mt-8 flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          <NuxtLink to="/admin/vacancies" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
