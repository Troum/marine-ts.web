<script setup lang="ts">
import { ArrowLeft, Edit, Loader2 } from 'lucide-vue-next'
import type { NewsItem } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const items = ref<NewsItem[]>([])
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

async function load() {
  pending.value = true
  try {
    items.value = await api.news.getAll({
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
  searchDebounce = setTimeout(load, 320)
}

onMounted(load)

watch([sort, order], () => {
  load()
})
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto flex h-16 max-w-[1600px] items-center px-6 lg:px-12">
        <NuxtLink to="/admin/seo" class="mr-4 text-mts-text-secondary hover:text-mts-accent">
          <ArrowLeft class="h-5 w-5" />
        </NuxtLink>
        <h1 class="font-display text-xl text-mts-text">SEO новостей</h1>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <AdminListToolbar
        :search="search"
        :sort="sort"
        :order="order"
        :sort-options="sortOptions"
        search-placeholder="Заголовок, slug…"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
      />
      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <div v-else class="overflow-x-auto border border-mts-border bg-white">
        <table class="w-full min-w-[640px]">
          <thead class="border-b border-mts-border bg-mts-bg">
            <tr>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Заголовок</th>
              <th class="w-32 p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">SEO</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in items" :key="n.id" class="border-b border-mts-border last:border-0">
              <td class="p-4 font-body text-sm text-mts-text">{{ n.title }}</td>
              <td class="p-4">
                <NuxtLink
                  :to="`/admin/seo/news/${n.id}`"
                  class="inline-flex items-center gap-1 font-mono text-xs text-mts-accent hover:underline"
                >
                  <Edit class="h-4 w-4" />
                  Редактировать
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
