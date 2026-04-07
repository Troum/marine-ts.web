<script setup lang="ts">
import { Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { NewsItem } from '~/types'
import AdminPlusLink from "~/components/admin/AdminPlusLink.vue";
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const news = ref<NewsItem[]>([])
const pending = ref(true)

const search = ref('')
const sort = ref('id')
const order = ref<'asc' | 'desc'>('desc')

const sortOptions = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Заголовок' },
  { value: 'date', label: 'Дата' },
  { value: 'category', label: 'Категория' },
  { value: 'author', label: 'Автор' },
  { value: 'slug', label: 'Slug' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

async function fetchNews() {
  pending.value = true
  try {
    news.value = await api.news.getAll({
      search: search.value.trim() || undefined,
      sort: sort.value,
      order: order.value,
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
  searchDebounce = setTimeout(() => {
    fetchNews()
  }, 320)
}

onMounted(fetchNews)

watch([sort, order], () => {
  fetchNews()
})

async function handleDelete(id: number) {
  const ok = await confirm({
    title: 'Удаление новости',
    message: 'Вы уверены, что хотите удалить эту новость? Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    await api.news.delete(id)
    adminToast.success('Новость удалена')
    news.value = news.value.filter((n) => n.id !== id)
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить новость', variant: 'error' })
  }
}
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
            <h1 class="font-display text-xl text-mts-text">Управление новостями</h1>
          </div>
          <AdminPlusLink to="/admin/news/new">Добавить новость</AdminPlusLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <AdminListToolbar
        :search="search"
        :sort="sort"
        :order="order"
        :sort-options="sortOptions"
        search-placeholder="Заголовок, slug, категория…"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
      />
      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <div v-else class="bg-white border border-mts-border overflow-x-auto">
        <table class="w-full min-w-[800px]">
          <thead class="bg-mts-bg border-b border-mts-border">
            <tr>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">ID</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Заголовок</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Категория</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Дата</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Автор</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="news.length === 0">
              <td colspan="6" class="p-8 text-center">
                <p class="font-body text-mts-text-secondary">Новостей пока нет</p>
                <NuxtLink to="/admin/news/new" class="text-mts-accent hover:underline mt-2 inline-block">
                  Добавить первую новость
                </NuxtLink>
              </td>
            </tr>
            <tr
              v-for="item in news"
              :key="item.id"
              class="border-b border-mts-border last:border-0 hover:bg-mts-bg/50"
            >
              <td class="p-4">
                <span class="font-mono text-sm text-mts-text-muted">#{{ item.id }}</span>
              </td>
              <td class="p-4">
                <p class="font-body text-sm text-mts-text max-w-md truncate">{{ item.title }}</p>
              </td>
              <td class="p-4">
                <span class="font-body text-sm text-mts-text-secondary">{{ item.category }}</span>
              </td>
              <td class="p-4">
                <span class="font-body text-sm text-mts-text-secondary">{{ item.date }}</span>
              </td>
              <td class="p-4">
                <span class="font-body text-sm text-mts-text-secondary">{{ item.author }}</span>
              </td>
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <NuxtLink :to="`/admin/news/${item.id}`" class="p-2 text-mts-text-secondary hover:text-mts-accent">
                    <Edit class="w-4 h-4" />
                  </NuxtLink>
                  <button type="button" class="p-2 text-mts-text-secondary hover:text-red-600" @click="handleDelete(item.id)">
                    <Trash2 class="w-4 h-4" />
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
