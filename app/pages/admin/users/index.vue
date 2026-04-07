<script setup lang="ts">
import { Edit, Trash2, ArrowLeft, Loader2, Shield } from 'lucide-vue-next'
import type { AdminPanelUser } from '~/types'
import AdminPlusLink from "~/components/admin/AdminPlusLink.vue";

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { canManageUsers } = useAdminPermissions()

const users = ref<AdminPanelUser[]>([])
const pending = ref(true)

const search = ref('')
const sort = ref('id')
const order = ref<'asc' | 'desc'>('desc')

const sortOptions = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Имя' },
  { value: 'username', label: 'Логин' },
  { value: 'email', label: 'Email' },
  { value: 'created_at', label: 'Создан' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

async function fetchUsers() {
  pending.value = true
  try {
    users.value = await api.users.getManageAll({
      search: search.value.trim() || undefined,
      sort: sort.value,
      order: order.value,
    })
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить список пользователей', variant: 'error' })
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
    fetchUsers()
  }, 320)
}

onMounted(fetchUsers)

watch([sort, order], () => {
  fetchUsers()
})

async function handleDelete(id: number) {
  const ok = await confirm({
    title: 'Удаление пользователя',
    message: 'Удалить учётную запись? Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    await api.users.delete(id)
    adminToast.success('Пользователь удалён')
    users.value = users.value.filter((u) => u.id !== id)
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить пользователя', variant: 'error' })
  }
}

function roleLabel(name: string): string {
  const map: Record<string, string> = {
    admin: 'Администратор',
    content_manager: 'Контент-менеджер',
    hr_manager: 'HR',
  }
  return map[name] ?? name
}

const currentUserId = computed(() => {
  if (!import.meta.client) {
    return null
  }
  const raw = sessionStorage.getItem('mts_admin_user_id')
  return raw ? Number(raw) : null
})
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
            <h1 class="font-display text-xl text-mts-text">Пользователи панели</h1>
          </div>
          <AdminPlusLink v-if="canManageUsers" to="/admin/users/new">Добавить</AdminPlusLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="!canManageUsers" class="bg-amber-50 border border-amber-200 px-4 py-3 font-body text-sm text-amber-900">
        Нет права «manage users». Войдите под учётной записью с соответствующими правами или обновите сессию (повторный вход).
      </div>
      <template v-else>
        <AdminListToolbar
          :search="search"
          :sort="sort"
          :order="order"
          :sort-options="sortOptions"
          search-placeholder="Имя, логин, email…"
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
                <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Имя</th>
                <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Логин</th>
                <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Email</th>
                <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Роли</th>
                <th class="text-right p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id" class="border-b border-mts-border last:border-0">
                <td class="p-4 font-mono text-sm text-mts-text-secondary">{{ u.id }}</td>
                <td class="p-4 font-body text-sm text-mts-text">{{ u.name }}</td>
                <td class="p-4 font-mono text-sm text-mts-text">{{ u.username }}</td>
                <td class="p-4 font-body text-sm text-mts-text-secondary">{{ u.email }}</td>
                <td class="p-4">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="r in u.roles"
                      :key="r"
                      class="inline-flex items-center gap-1 px-2 py-0.5 bg-mts-bg border border-mts-border font-mono text-[10px] uppercase text-mts-text-secondary"
                    >
                      <Shield class="w-3 h-3" />
                      {{ roleLabel(r) }}
                    </span>
                  </div>
                </td>
                <td class="p-4 text-right">
                  <NuxtLink
                    :to="`/admin/users/${u.id}`"
                    class="p-2 text-mts-text-secondary hover:text-mts-accent transition-colors inline-flex"
                  >
                    <Edit class="w-4 h-4" />
                  </NuxtLink>
                  <button
                    v-if="u.id !== currentUserId"
                    type="button"
                    class="p-2 text-mts-text-secondary hover:text-red-600 transition-colors inline-flex"
                    @click="handleDelete(u.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </main>
  </div>
</template>
