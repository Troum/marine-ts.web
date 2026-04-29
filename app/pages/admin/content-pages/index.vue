<script setup lang="ts">
import { Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { ContentPage } from '~/types'
import AdminPlusLink from "~/components/admin/AdminPlusLink.vue";
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'
import { triState01 } from '~/utils/adminFilters'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const pages = ref<ContentPage[]>([])
const pending = ref(true)

const search = ref('')
const sort = ref('sort_order')
const order = ref<'asc' | 'desc'>('asc')
const published = ref<'' | '1' | '0'>('')

const publishedOptions = [
  { value: '', label: 'Все' },
  { value: '1', label: 'Опубликовано' },
  { value: '0', label: 'Черновик' },
]

const sortOptions = [
  { value: 'id', label: 'ID' },
  { value: 'slug', label: 'Slug' },
  { value: 'title', label: 'Заголовок' },
  { value: 'sort_order', label: 'Порядок' },
  { value: 'created_at', label: 'Создано' },
  { value: 'updated_at', label: 'Обновлено' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

async function fetchPages() {
  pending.value = true
  try {
    const { data } = await api.contentPages.getManageAll({
      search: search.value.trim() || undefined,
      sort: sort.value,
      order: order.value,
      published: published.value === '' ? undefined : published.value,
    })
    pages.value = data
  } finally {
    pending.value = false
  }
}

function onSearchInput(v: string) {
  search.value = v
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
  searchDebounce = setTimeout(() => {
    fetchPages()
  }, 320)
}

onMounted(fetchPages)

watch([sort, order, published], () => {
  fetchPages()
})

async function handleDelete(id: number) {
  const ok = await confirm({
    title: 'Удаление страницы',
    message: 'Вы уверены, что хотите удалить эту страницу? Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    await api.contentPages.delete(id)
    adminToast.success('Страница удалена')
    pages.value = pages.value.filter((p) => p.id !== id)
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить страницу', variant: 'error' })
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex flex-wrap items-center justify-between gap-3 h-auto min-h-16 py-2">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Сервисы</h1>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <AdminPlusLink to="/admin/services/new" variant="outline">Карточка</AdminPlusLink>
            <AdminPlusLink to="/admin/content-pages/new">Страница</AdminPlusLink>
          </div>
        </div>
      </div>
    </header>

    <AdminServicesSectionNav active="pages" />

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <AdminListToolbar
        :search="search"
        :sort="sort"
        :order="order"
        :sort-options="sortOptions"
        search-placeholder="Заголовок, slug…"
        :extra-filter="published"
        extra-filter-label="Публикация"
        :extra-filter-options="publishedOptions"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
        @update:extra-filter="published = triState01($event)"
      />

      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <div v-else class="bg-white border border-mts-border overflow-x-auto">
        <table class="w-full min-w-[720px]">
          <thead class="bg-mts-bg border-b border-mts-border">
            <tr>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Заголовок</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Slug</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Порядок</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Статус</th>
              <th class="text-right p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pages" :key="row.id" class="border-b border-mts-border last:border-0">
              <td class="p-4">
                <p class="font-body text-sm text-mts-text">{{ flattenEncodedOrPlain(row.title) }}</p>
              </td>
              <td class="p-4">
                <span class="font-mono text-xs text-mts-text-secondary">{{ row.slug }}</span>
              </td>
              <td class="p-4">
                <span class="font-body text-sm text-mts-text-secondary">{{ row.sortOrder }}</span>
              </td>
              <td class="p-4">
                <span
                  :class="
                    row.isPublished
                      ? 'inline-block px-2 py-0.5 bg-green-100 text-green-800 font-mono text-[9px] uppercase'
                      : 'inline-block px-2 py-0.5 bg-mts-bg text-mts-text-secondary font-mono text-[9px] uppercase'
                  "
                >
                  {{ row.isPublished ? 'Опубликовано' : 'Черновик' }}
                </span>
              </td>
              <td class="p-4 text-right">
                <NuxtLink
                  :to="`/admin/content-pages/${row.id}`"
                  class="p-2 text-mts-text-secondary hover:text-mts-accent transition-colors inline-flex"
                >
                  <Edit class="w-4 h-4" />
                </NuxtLink>
                <button
                  type="button"
                  class="p-2 text-mts-text-secondary hover:text-red-600 transition-colors inline-flex"
                  @click="handleDelete(row.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="pages.length === 0" class="p-8 text-center font-body text-sm text-mts-text-secondary">Страниц пока нет.</p>
      </div>
    </main>
  </div>
</template>
