<script setup lang="ts">
import { ArrowLeft, Loader2, Trash2 } from 'lucide-vue-next'
import type { PageInquiry } from '~/types'
import { triState01 } from '~/utils/adminFilters'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const items = ref<PageInquiry[]>([])
const pending = ref(true)

const search = ref('')
const sort = ref('id')
const order = ref<'asc' | 'desc'>('desc')
const read = ref<'' | '1' | '0'>('')

const readOptions = [
  { value: '', label: 'Все' },
  { value: '0', label: 'Новые' },
  { value: '1', label: 'Прочитанные' },
]

const sortOptions = [
  { value: 'id', label: 'ID' },
  { value: 'created_at', label: 'Дата' },
  { value: 'updated_at', label: 'Обновлено' },
  { value: 'read_at', label: 'Прочитано' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

async function fetchList() {
  pending.value = true
  try {
    items.value = await api.pageInquiries.getManageAll({
      search: search.value.trim() || undefined,
      sort: sort.value,
      order: order.value,
      read: read.value === '' ? undefined : read.value,
    })
  } catch {
    items.value = []
  } finally {
    pending.value = false
  }
}

function onSearchInput(v: string) {
  search.value = v
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
  searchDebounce = setTimeout(fetchList, 320)
}

onMounted(fetchList)

watch([sort, order, read], () => {
  fetchList()
})

function formatDate(iso: string | null) {
  if (!iso) {
    return '—'
  }
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

async function handleDelete(id: number) {
  const ok = await confirm({
    title: 'Удаление заявки',
    message: 'Удалить эту заявку? Её нельзя будет восстановить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    await api.pageInquiries.delete(id)
    adminToast.success('Заявка удалена')
    items.value = items.value.filter((x) => x.id !== id)
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить заявку', variant: 'error' })
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
              <ArrowLeft class="h-5 w-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Заявки</h1>
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
        search-placeholder="Имя, email, страница, текст…"
        :extra-filter="read"
        extra-filter-label="Статус"
        :extra-filter-options="readOptions"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
        @update:extra-filter="read = triState01($event)"
      />
      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <div v-else class="overflow-x-auto border border-mts-border bg-white">
        <table class="w-full min-w-[900px]">
          <thead class="border-b border-mts-border bg-mts-bg">
            <tr>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">ID</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Дата</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Страница</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Имя</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Компания</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Контакты</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Статус</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="items.length === 0">
              <td colspan="8" class="p-8 text-center font-body text-mts-text-secondary">Заявок пока нет</td>
            </tr>
            <tr
              v-for="m in items"
              :key="m.id"
              class="cursor-pointer border-b border-mts-border last:border-0 transition-colors hover:bg-mts-bg/60"
              @click="navigateTo(`/admin/inquiries/${m.id}`)"
            >
              <td class="p-4 font-mono text-sm text-mts-text-muted">#{{ m.id }}</td>
              <td class="p-4 font-body text-sm text-mts-text-secondary">{{ formatDate(m.createdAt) }}</td>
              <td class="p-4 font-mono text-xs text-mts-text-secondary">{{ m.sourcePage }}</td>
              <td class="p-4 font-body text-sm text-mts-text">{{ m.name }}</td>
              <td class="p-4 font-body text-sm text-mts-text">{{ m.company || '—' }}</td>
              <td class="p-4 font-mono text-xs text-mts-text-secondary">
                <div>{{ m.email }}</div>
                <div v-if="m.phone" class="text-mts-text-muted">{{ m.phone }}</div>
              </td>
              <td class="p-4 font-body text-sm">
                <span :class="m.readAt ? 'text-mts-text-muted' : 'text-mts-accent font-mono text-xs uppercase'">
                  {{ m.readAt ? 'Прочитано' : 'Новое' }}
                </span>
              </td>
              <td class="p-4">
                <button
                  type="button"
                  class="p-2 text-mts-text-secondary hover:text-red-600"
                  aria-label="Удалить заявку"
                  @click.stop="handleDelete(m.id)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
