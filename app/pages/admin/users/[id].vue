<script setup lang="ts">
import { ArrowLeft, Loader2, Trash2 } from 'lucide-vue-next'
import type { AdminPanelUser, AdminRoleOption } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const api = useMarineApi()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { canManageUsers } = useAdminPermissions()

const idParam = computed(() => route.params.id as string)
const isNew = computed(() => idParam.value === 'new')

const roleOptions = ref<AdminRoleOption[]>([])
const form = ref({
  name: '',
  username: '',
  email: '',
  password: '',
  roleNames: [] as string[],
})

const loading = ref(!isNew.value)
const saving = ref(false)

const currentUserId = computed(() => {
  if (!import.meta.client) {
    return null
  }
  const raw = sessionStorage.getItem('mts_admin_user_id')
  return raw ? Number(raw) : null
})

const isEditingSelf = computed(() => !isNew.value && Number(idParam.value) === currentUserId.value)

onMounted(async () => {
  if (!canManageUsers.value) {
    loading.value = false
    return
  }
  try {
    roleOptions.value = await api.users.getRolesCatalog()
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить роли', variant: 'error' })
  }
  if (isNew.value) {
    loading.value = false
    return
  }
  try {
    const item = await api.users.getById(Number(idParam.value))
    form.value = {
      name: item.name,
      username: item.username,
      email: item.email,
      password: '',
      roleNames: [...(item.roles ?? [])],
    }
  } catch {
    await navigateTo('/admin/users')
  } finally {
    loading.value = false
  }
})

function toggleRole(name: string) {
  const set = new Set(form.value.roleNames)
  if (set.has(name)) {
    set.delete(name)
  } else {
    set.add(name)
  }
  form.value.roleNames = [...set]
}

async function submit() {
  saving.value = true
  try {
    if (isNew.value) {
      await api.users.create({
        name: form.value.name,
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
        roles: form.value.roleNames,
      })
    } else {
      const id = Number(idParam.value)
      await api.users.update(id, {
        name: form.value.name,
        username: form.value.username,
        email: form.value.email,
        roles: form.value.roleNames,
        ...(form.value.password.trim() ? { password: form.value.password } : {}),
      })
    }
    adminToast.success(isNew.value ? 'Учётная запись создана' : 'Изменения сохранены')
    await navigateTo('/admin/users')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить пользователя', variant: 'error' })
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (isNew.value || isEditingSelf.value) {
    return
  }
  const ok = await confirm({
    title: 'Удаление пользователя',
    message: 'Удалить эту учётную запись?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    await api.users.delete(Number(idParam.value))
    adminToast.success('Пользователь удалён')
    await navigateTo('/admin/users')
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить пользователя', variant: 'error' })
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-4xl mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin/users" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">
              {{ isNew ? 'Новый пользователь' : 'Редактирование пользователя' }}
            </h1>
          </div>
          <button
            v-if="!isNew && canManageUsers && !isEditingSelf"
            type="button"
            class="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 font-mono text-xs uppercase hover:bg-red-50 transition-colors"
            @click="handleDelete"
          >
            <Trash2 class="w-4 h-4" />
            Удалить
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="!canManageUsers" class="bg-amber-50 border border-amber-200 px-4 py-3 font-body text-sm text-amber-900">
        Нет права «manage users».
      </div>
      <div v-else-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <form v-else class="bg-white border border-mts-border shadow-tech p-8 relative" @submit.prevent="submit">
        <div class="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-mts-accent" />
        <div class="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-mts-accent" />

        <div class="space-y-6">
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Имя *</label>
            <input
              v-model="form.name"
              required
              type="text"
              autocomplete="name"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent"
            />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Логин *</label>
            <input
              v-model="form.username"
              required
              type="text"
              autocomplete="username"
              pattern="[a-zA-Z0-9._\-]+"
              title="Латиница, цифры, . _ -"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm font-mono focus:outline-none focus:border-mts-accent"
            />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Email *</label>
            <input
              v-model="form.email"
              required
              type="email"
              autocomplete="email"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent"
            />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">
              {{ isNew ? 'Пароль *' : 'Новый пароль' }}
            </label>
            <input
              v-model="form.password"
              :required="isNew"
              type="password"
              autocomplete="new-password"
              minlength="8"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent"
            />
            <p v-if="!isNew" class="mt-1 font-body text-xs text-mts-text-secondary">Оставьте пустым, чтобы не менять пароль.</p>
          </div>

          <div>
            <p class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-3">Роли</p>
            <div class="space-y-3">
              <label
                v-for="opt in roleOptions"
                :key="opt.name"
                class="flex cursor-pointer items-start gap-3 font-body text-sm text-mts-text"
              >
                <input
                  type="checkbox"
                  class="mts-checkbox mt-0.5"
                  :checked="form.roleNames.includes(opt.name)"
                  @change="toggleRole(opt.name)"
                />
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span>{{ opt.label }}</span>
                  <span class="font-mono text-xs text-mts-text-secondary">({{ opt.name }})</span>
                </span>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <NuxtLink
              to="/admin/users"
              class="px-6 py-3 border border-mts-border font-mono text-xs uppercase text-mts-text-secondary hover:border-mts-accent hover:text-mts-accent transition-colors"
            >
              Отмена
            </NuxtLink>
            <button
              type="submit"
              :disabled="saving"
              class="px-6 py-3 bg-mts-accent text-white font-mono text-xs uppercase hover:bg-mts-accent-dark transition-colors disabled:opacity-50"
            >
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </form>
    </main>
  </div>
</template>
