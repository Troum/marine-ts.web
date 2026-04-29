<script setup lang="ts">
import { Edit, Trash2, ArrowLeft, Loader2, ClipboardList } from 'lucide-vue-next'
import type { VacancyItem } from '~/types'
import AdminPlusLink from "~/components/admin/AdminPlusLink.vue";
import { triState01 } from '~/utils/adminFilters'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const vacancies = ref<VacancyItem[]>([])
const pending = ref(true)

const search = ref('')
const sort = ref('sort_order')
const order = ref<'asc' | 'desc'>('asc')
const published = ref<'' | '1' | '0'>('')

const publishedOptions = [
  { value: '', label: 'Все' },
  { value: '1', label: 'Да' },
  { value: '0', label: 'Нет' },
]

const sortOptions = [
  { value: 'sort_order', label: 'Порядок' },
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Название' },
  { value: 'slug', label: 'Slug' },
  { value: 'is_published', label: 'На сайте' },
  { value: 'location', label: 'Локация' },
  { value: 'employment_type', label: 'Тип занятости' },
  { value: 'created_at', label: 'Создано' },
  { value: 'updated_at', label: 'Обновлено' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

async function fetchVacancies() {
  pending.value = true
  try {
    vacancies.value = await api.vacancies.getManageAll({
      search: search.value.trim() || undefined,
      sort: sort.value,
      order: order.value,
      published: published.value === '' ? undefined : published.value,
    })
  } finally {
    pending.value = false
  }
}

function onSearchInput(v: string) {
  search.value = v
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
  searchDebounce = setTimeout(fetchVacancies, 320)
}

onMounted(fetchVacancies)

watch([sort, order, published], () => {
  fetchVacancies()
})

async function handleDelete(id: number) {
  const ok = await confirm({
    title: 'Удаление вакансии',
    message: 'Вы уверены, что хотите удалить эту вакансию? Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    await api.vacancies.delete(id)
    adminToast.success('Вакансия удалена')
    vacancies.value = vacancies.value.filter((v) => v.id !== id)
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить вакансию', variant: 'error' })
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div class="flex h-16 flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
              <ArrowLeft class="h-5 w-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Вакансии</h1>
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <NuxtLink
              to="/admin/vacancies/application-forms"
              class="inline-flex shrink-0 items-center gap-1.5 border border-mts-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent"
            >
              <ClipboardList class="h-3.5 w-3.5" aria-hidden="true" />
              Все анкеты
            </NuxtLink>
            <AdminPlusLink to="/admin/vacancies/new">Добавить вакансию</AdminPlusLink>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <AdminListToolbar
        :search="search"
        :sort="sort"
        :order="order"
        :sort-options="sortOptions"
        search-placeholder="Название, slug, локация…"
        :extra-filter="published"
        extra-filter-label="На сайте"
        :extra-filter-options="publishedOptions"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
        @update:extra-filter="published = triState01($event)"
      />
      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <div v-else class="overflow-x-auto border border-mts-border bg-white">
        <table class="w-full min-w-[720px]">
          <thead class="border-b border-mts-border bg-mts-bg">
            <tr>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">ID</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Название</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Slug</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">На сайте</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Порядок</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Анкеты</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="vacancies.length === 0">
              <td colspan="7" class="p-8 text-center">
                <p class="font-body text-mts-text-secondary">Вакансий пока нет</p>
                <NuxtLink to="/admin/vacancies/new" class="mt-2 inline-block text-mts-accent hover:underline">
                  Добавить первую вакансию
                </NuxtLink>
              </td>
            </tr>
            <tr v-for="v in vacancies" :key="v.id" class="border-b border-mts-border last:border-0">
              <td class="p-4 font-mono text-sm text-mts-text-muted">#{{ v.id }}</td>
              <td class="p-4 font-body text-sm text-mts-text">{{ v.title }}</td>
              <td class="p-4 font-mono text-xs text-mts-text-secondary">{{ v.slug }}</td>
              <td class="p-4 font-body text-sm">
                <span :class="v.isPublished ? 'text-green-600' : 'text-mts-text-muted'">
                  {{ v.isPublished ? 'Да' : 'Нет' }}
                </span>
              </td>
              <td class="p-4 font-mono text-sm text-mts-text-secondary">{{ v.sortOrder }}</td>
              <td class="p-4">
                <NuxtLink
                  :to="`/admin/vacancies/${v.id}/application-forms`"
                  class="inline-flex items-center gap-1.5 font-mono text-xs text-mts-accent hover:underline"
                >
                  <ClipboardList class="h-4 w-4 shrink-0" />
                  {{ v.applicationFormsCount ?? 0 }}
                </NuxtLink>
              </td>
              <td class="p-4">
                <div class="flex gap-1">
                  <NuxtLink :to="`/admin/vacancies/${v.id}`" class="p-2 text-mts-text-secondary hover:text-mts-accent">
                    <Edit class="h-4 w-4" />
                  </NuxtLink>
                  <button
                    type="button"
                    class="p-2 text-mts-text-secondary hover:text-red-600"
                    @click="handleDelete(v.id)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
