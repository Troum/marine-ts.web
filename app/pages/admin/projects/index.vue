<script setup lang="ts">
import { Edit, Trash2, ArrowLeft, Loader2, ExternalLink, FileText } from 'lucide-vue-next'
import type { Project } from '~/types'
import AdminPlusLink from "~/components/admin/AdminPlusLink.vue";

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { canManageContentPages } = useAdminPermissions()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const projects = ref<Project[]>([])
const pending = ref(true)

const search = ref('')
const sort = ref('id')
const order = ref<'asc' | 'desc'>('desc')

const sortOptions = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Название' },
  { value: 'type', label: 'Тип' },
  { value: 'type_label', label: 'Тип (подпись)' },
  { value: 'location', label: 'Локация' },
  { value: 'date', label: 'Дата' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

async function load() {
  pending.value = true
  try {
    projects.value = await api.projects.getAll({
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

async function handleDelete(id: number) {
  const ok = await confirm({
    title: 'Удаление проекта',
    message: 'Удалить этот проект? Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    await api.projects.delete(id)
    adminToast.success('Проект удалён')
    projects.value = projects.value.filter((p) => p.id !== id)
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить проект', variant: 'error' })
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div class="flex flex-wrap items-center justify-between gap-3 h-auto min-h-16 py-2">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Управление проектами</h1>
          </div>
          <AdminPlusLink to="/admin/projects/new">Добавить проект</AdminPlusLink>
        </div>
      </div>
    </header>

    <main class="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
      <AdminListToolbar
        :search="search"
        :sort="sort"
        :order="order"
        :sort-options="sortOptions"
        search-placeholder="Название, тип, локация…"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
      />
      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <div v-else class="bg-white border border-mts-border overflow-x-auto">
        <table class="w-full min-w-[920px]">
          <thead class="bg-mts-bg border-b border-mts-border">
            <tr>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">ID</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Название</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Тип</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Локация</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Страница</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in projects" :key="p.id" class="border-b border-mts-border last:border-0">
              <td class="p-4 font-mono text-sm text-mts-text-muted">#{{ p.id }}</td>
              <td class="p-4 font-body text-sm text-mts-text">{{ p.title }}</td>
              <td class="p-4 font-body text-sm text-mts-text-secondary">{{ p.typeLabel }}</td>
              <td class="p-4 font-body text-sm text-mts-text-secondary">{{ p.location }}</td>
              <td class="p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <NuxtLink
                    v-if="p.contentPage?.slug"
                    :to="`/projects/${p.contentPage.slug}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-mts-accent hover:underline"
                    title="Открыть текстовую страницу на сайте"
                  >
                    <ExternalLink class="h-3.5 w-3.5" />
                    Сайт
                  </NuxtLink>
                  <NuxtLink
                    v-if="canManageContentPages && p.contentPage?.id"
                    :to="`/admin/content-pages/${p.contentPage.id}`"
                    class="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-mts-text-secondary hover:text-mts-accent"
                    title="Редактировать страницу"
                  >
                    <FileText class="h-3.5 w-3.5" />
                    В админке
                  </NuxtLink>
                  <NuxtLink
                    v-if="canManageContentPages && !p.contentPage"
                    :to="`/admin/content-pages/new?contentableType=project&contentableId=${p.id}`"
                    class="font-mono text-[10px] uppercase text-mts-text-muted hover:text-mts-accent"
                  >
                    + страница
                  </NuxtLink>
                  <span v-if="!p.contentPage && !canManageContentPages" class="font-body text-xs text-mts-text-muted">—</span>
                </div>
              </td>
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <NuxtLink :to="`/admin/projects/${p.id}`" class="p-2 text-mts-text-secondary hover:text-mts-accent">
                    <Edit class="w-4 h-4" />
                  </NuxtLink>
                  <button type="button" class="p-2 text-mts-text-secondary hover:text-red-600" @click="handleDelete(p.id)">
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
