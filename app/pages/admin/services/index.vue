<script setup lang="ts">
import { Edit, Trash2, ArrowLeft, Loader2, ExternalLink, FileText } from 'lucide-vue-next'
import type { ServiceItem } from '~/types'
import { resolveServiceIcon } from '~/utils/serviceIcons'
import AdminPlusLink from "~/components/admin/AdminPlusLink.vue";
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const localePath = useLocalePath()
const { canManageContentPages } = useAdminPermissions()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const services = ref<ServiceItem[]>([])
const pending = ref(true)

const search = ref('')
const sort = ref('sort_order')
const order = ref<'asc' | 'desc'>('asc')

const sortOptions = [
  { value: 'sort_order', label: 'Порядок' },
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Название' },
  { value: 'icon_key', label: 'Иконка' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

async function fetchServices() {
  pending.value = true
  try {
    services.value = await api.services.getAll({
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
  searchDebounce = setTimeout(fetchServices, 320)
}

onMounted(fetchServices)

watch([sort, order], () => {
  fetchServices()
})

async function handleDelete(id: number) {
  const ok = await confirm({
    title: 'Удаление карточки',
    message: 'Удалить эту карточку сервиса? Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    await api.services.delete(id)
    adminToast.success('Карточка удалена')
    services.value = services.value.filter((s) => s.id !== id)
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить карточку', variant: 'error' })
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
            <h1 class="font-display text-xl text-mts-text">Судоремонт</h1>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <AdminPlusLink v-if="canManageContentPages" to="/admin/content-pages/new" variant="outline">
              Страница
            </AdminPlusLink>
            <AdminPlusLink to="/admin/services/new">Карточка</AdminPlusLink>
          </div>
        </div>
      </div>
    </header>

    <AdminServicesSectionNav active="cards" />

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <AdminListToolbar
        :search="search"
        :sort="sort"
        :order="order"
        :sort-options="sortOptions"
        search-placeholder="Название, иконка…"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
      />
      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <div v-else class="bg-white border border-mts-border overflow-x-auto">
        <table class="w-full min-w-[720px]">
          <thead class="bg-mts-bg border-b border-mts-border">
            <tr>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">ID</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Название</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Иконка</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Порядок</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Страница</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase text-mts-text-secondary">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="services.length === 0">
              <td colspan="6" class="p-8 text-center">
                <p class="font-body text-mts-text-secondary">Карточек сервисов пока нет</p>
                <NuxtLink to="/admin/services/new" class="text-mts-accent hover:underline mt-2 inline-block">
                  Добавить первую карточку
                </NuxtLink>
              </td>
            </tr>
            <tr v-for="s in services" :key="s.id" class="border-b border-mts-border last:border-0">
              <td class="p-4 font-mono text-sm text-mts-text-muted">#{{ s.id }}</td>
              <td class="p-4 font-body text-sm text-mts-text">{{ flattenEncodedOrPlain(s.title) }}</td>
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center border border-mts-border bg-mts-bg">
                    <component :is="resolveServiceIcon(s.iconKey)" class="h-5 w-5 text-mts-accent" />
                  </div>
                  <span class="font-mono text-xs text-mts-text-secondary">{{ s.iconKey }}</span>
                </div>
              </td>
              <td class="p-4 font-mono text-sm text-mts-text-secondary">{{ s.sortOrder }}</td>
              <td class="p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <NuxtLink
                    v-if="s.contentPage?.slug"
                    :to="localePath(`/${s.contentPage.slug}`)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-mts-accent hover:underline"
                    title="Открыть текстовую страницу на сайте"
                  >
                    <ExternalLink class="h-3.5 w-3.5" />
                    Сайт
                  </NuxtLink>
                  <NuxtLink
                    v-if="canManageContentPages && s.contentPage?.id"
                    :to="`/admin/content-pages/${s.contentPage.id}`"
                    class="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-mts-text-secondary hover:text-mts-accent"
                    title="Редактировать страницу"
                  >
                    <FileText class="h-3.5 w-3.5" />
                    В админке
                  </NuxtLink>
                  <NuxtLink
                    v-if="canManageContentPages && !s.contentPage"
                    :to="`/admin/content-pages/new?contentableType=service&contentableId=${s.id}`"
                    class="font-mono text-[10px] uppercase text-mts-text-muted hover:text-mts-accent"
                  >
                    + страница
                  </NuxtLink>
                  <span v-if="!s.contentPage && !canManageContentPages" class="font-body text-xs text-mts-text-muted">—</span>
                </div>
              </td>
              <td class="p-4">
                <div class="flex gap-1">
                  <NuxtLink :to="`/admin/services/${s.id}`" class="p-2 text-mts-text-secondary hover:text-mts-accent">
                    <Edit class="w-4 h-4" />
                  </NuxtLink>
                  <button
                    type="button"
                    class="p-2 text-mts-text-secondary hover:text-red-600"
                    @click="handleDelete(s.id)"
                  >
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
