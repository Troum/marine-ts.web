<script setup lang="ts">
import {
  ArrowLeft,
  Briefcase,
  FileText,
  LayoutGrid,
  Loader2,
  Newspaper,
  ScanSearch,
  Ship,
  Wrench,
} from 'lucide-vue-next'
import type { SiteSeoPage } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const pages = ref<SiteSeoPage[]>([])
const pending = ref(true)

const search = ref('')
const sort = ref('slug')
const order = ref<'asc' | 'desc'>('asc')

const sortOptions = [
  { value: 'slug', label: 'Slug' },
  { value: 'label', label: 'Подпись' },
  { value: 'id', label: 'ID' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

async function loadPages() {
  pending.value = true
  try {
    pages.value = await api.seoPages.getAll({
      search: search.value.trim() || undefined,
      sort: sort.value,
      order: order.value,
    })
  } catch {
    pages.value = []
  } finally {
    pending.value = false
  }
}

function onSearchInput(v: string) {
  search.value = v
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
  searchDebounce = setTimeout(loadPages, 320)
}

onMounted(loadPages)

watch([sort, order], () => {
  loadPages()
})
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-12">
        <div class="flex items-center gap-4">
          <NuxtLink to="/admin" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
            <ArrowLeft class="h-5 w-5" />
          </NuxtLink>
          <div class="flex items-center gap-2">
            <LayoutGrid class="h-5 w-5 text-mts-accent" />
            <h1 class="font-display text-xl text-mts-text">SEO</h1>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-10 lg:px-12">
      <p class="font-body mb-8 max-w-[1600px] text-mts-text-secondary">
        Meta title, description и keywords для разделов сайта и отдельных материалов (новости, проекты, сервисы).
      </p>

      <AdminListToolbar
        :search="search"
        :sort="sort"
        :order="order"
        :sort-options="sortOptions"
        search-placeholder="Slug или подпись…"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
      />

      <div v-if="pending" class="flex justify-center py-20">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <template v-else>
        <section class="mb-12">
          <h2 class="font-display mb-4 flex items-center gap-2 text-lg text-mts-text">
            <FileText class="h-5 w-5 text-mts-accent" />
            Страницы сайта
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="p in pages"
              :key="p.slug"
              :to="`/admin/seo/page/${p.slug}`"
              class="border border-mts-border bg-white p-4 transition-colors hover:border-mts-accent/40"
            >
              <p class="font-body text-sm font-medium text-mts-text">{{ p.label || p.slug }}</p>
              <p class="font-mono text-[10px] text-mts-text-muted">{{ p.slug }}</p>
            </NuxtLink>
          </div>
        </section>

        <section>
          <h2 class="font-display mb-4 text-lg text-mts-text">Материалы</h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <NuxtLink
              to="/admin/seo/news"
              class="flex items-center gap-3 border border-mts-border bg-white p-5 transition-colors hover:border-mts-accent/40"
            >
              <Newspaper class="h-8 w-8 text-mts-accent" />
              <div>
                <p class="font-body font-medium text-mts-text">Новости</p>
                <p class="font-mono text-[10px] text-mts-text-secondary">SEO записей</p>
              </div>
            </NuxtLink>
            <NuxtLink
              to="/admin/seo/projects"
              class="flex items-center gap-3 border border-mts-border bg-white p-5 transition-colors hover:border-mts-accent/40"
            >
              <Briefcase class="h-8 w-8 text-mts-accent" />
              <div>
                <p class="font-body font-medium text-mts-text">Проекты</p>
                <p class="font-mono text-[10px] text-mts-text-secondary">SEO записей</p>
              </div>
            </NuxtLink>
            <NuxtLink
              to="/admin/seo/page/lnk"
              class="flex items-center gap-3 border border-mts-border bg-white p-5 transition-colors hover:border-mts-accent/40"
            >
              <ScanSearch class="h-8 w-8 text-mts-accent" />
              <div>
                <p class="font-body font-medium text-mts-text">ЛНК</p>
                <p class="font-mono text-[10px] text-mts-text-secondary">Страница /lnk</p>
              </div>
            </NuxtLink>
            <NuxtLink
              to="/admin/seo/page/services"
              class="flex items-center gap-3 border border-mts-border bg-white p-5 transition-colors hover:border-mts-accent/40"
            >
              <Ship class="h-8 w-8 text-mts-accent" />
              <div>
                <p class="font-body font-medium text-mts-text">Судоремонт</p>
                <p class="font-mono text-[10px] text-mts-text-secondary">Страница /ship-repair</p>
              </div>
            </NuxtLink>
            <NuxtLink
              to="/admin/seo/services"
              class="flex items-center gap-3 border border-mts-border bg-white p-5 transition-colors hover:border-mts-accent/40"
            >
              <Wrench class="h-8 w-8 text-mts-accent" />
              <div>
                <p class="font-body font-medium text-mts-text">Карточки сервисов</p>
                <p class="font-mono text-[10px] text-mts-text-secondary">SEO карточек каталога</p>
              </div>
            </NuxtLink>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
