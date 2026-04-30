<script setup lang="ts">
import { ArrowLeft, Loader2, Plus, Trash2, Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-vue-next'
import type { SiteContactSettings } from '~/types'
import AdminSelect from '~/components/admin/AdminSelect.vue'
import { contactSettingsDefaults } from '~/utils/contactSettingsDefaults'
import { useConfirm } from '~/composables/useConfirmAction'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { canManageContacts } = useAdminPermissions()
const { confirm } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const form = ref<SiteContactSettings>(structuredClone(contactSettingsDefaults))

const iconOptions = [
  { value: 'phone' as const, label: 'Телефон', icon: Phone },
  { value: 'mail' as const, label: 'Почта', icon: Mail },
  { value: 'map-pin' as const, label: 'Адрес', icon: MapPin },
  { value: 'clock' as const, label: 'Время', icon: Clock },
  { value: 'link' as const, label: 'Ссылка', icon: ExternalLink },
]

onMounted(async () => {
  if (!canManageContacts.value) {
    await navigateTo('/admin')
    return
  }
  try {
    form.value = await api.contactSettings.get()
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить контакты', variant: 'error' })
    form.value = structuredClone(contactSettingsDefaults)
  } finally {
    loading.value = false
  }
})

function addQuick() {
  form.value.quick.push({
    iconKey: 'phone',
    label: '',
    value: '',
    href: null,
  })
}

async function removeQuick(i: number) {
  if (form.value.quick.length <= 1) {
    return
  }
  const ok = await confirm({
    message: 'Удалить эту строку быстрых контактов?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.quick.splice(i, 1)
}

function addOffice() {
  form.value.offices.push({
    city: '',
    country: '',
    address: '',
    phone: '',
    email: '',
  })
}

async function removeOffice(i: number) {
  if (form.value.offices.length <= 1) {
    return
  }
  const ok = await confirm({
    message: 'Удалить этот офис из списка?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.offices.splice(i, 1)
}

async function submit() {
  saving.value = true
  try {
    const payload: SiteContactSettings = {
      quick: form.value.quick.map((r) => ({
        ...r,
        href: r.href?.trim() ? r.href.trim() : null,
      })),
      offices: form.value.offices.map((o) => ({ ...o })),
    }
    form.value = await api.contactSettings.update(payload)
    adminToast.success('Контактные данные сохранены')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto flex h-16 max-w-[1600px] items-center px-6 lg:px-12">
        <NuxtLink to="/admin" class="mr-4 text-mts-text-secondary hover:text-mts-accent">
          <ArrowLeft class="h-5 w-5" />
        </NuxtLink>
        <h1 class="font-display text-xl text-mts-text">Контактные данные</h1>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <form v-else class="relative border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <CommonAccentCorners />

        <p class="font-body text-sm text-mts-text-secondary mb-8">
          Данные отображаются на странице «Контакты»: блок «Контактная информация» и карточки офисов.
        </p>

        <h2 class="font-display text-lg text-mts-text mb-4">Контактная информация (список с иконками)</h2>
        <div class="space-y-6 mb-10">
          <div
            v-for="(row, i) in form.quick"
            :key="i"
            class="grid gap-4 border border-mts-border p-4 bg-mts-bg/50 sm:grid-cols-2"
          >
            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Иконка</label
              >
              <AdminSelect v-model="row.iconKey" :options="iconOptions" />
            </div>
            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Подпись</label
              >
              <input
                v-model="row.label"
                type="text"
                required
                class="w-full border border-mts-border bg-white px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Текст</label
              >
              <input
                v-model="row.value"
                type="text"
                required
                class="w-full border border-mts-border bg-white px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Ссылка (tel:, mailto: или пусто)</label
              >
              <input
                v-model="row.href"
                type="text"
                class="w-full border border-mts-border bg-white px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                placeholder="Например tel:84012355290"
              />
            </div>
            <div class="sm:col-span-2 flex justify-end">
              <button
                v-if="form.quick.length > 1"
                type="button"
                class="btn-secondary inline-flex items-center gap-2 text-red-700 border-red-200 hover:border-red-400"
                @click="removeQuick(i)"
              >
                <Trash2 class="h-4 w-4" />
                Удалить строку
              </button>
            </div>
          </div>
          <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addQuick">
            <Plus class="h-4 w-4" />
            Добавить строку
          </button>
        </div>

        <h2 class="font-display text-lg text-mts-text mb-4">Офисы</h2>
        <div class="space-y-8 mb-10">
          <div
            v-for="(o, i) in form.offices"
            :key="i"
            class="border border-mts-border p-4 space-y-4 bg-mts-bg/30"
          >
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Город</label
                >
                <input
                  v-model="o.city"
                  type="text"
                  required
                  class="w-full border border-mts-border bg-white px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Страна</label
                >
                <input
                  v-model="o.country"
                  type="text"
                  required
                  class="w-full border border-mts-border bg-white px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Адрес</label
              >
              <input
                v-model="o.address"
                type="text"
                required
                class="w-full border border-mts-border bg-white px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
              />
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Телефон</label
                >
                <input
                  v-model="o.phone"
                  type="text"
                  required
                  class="w-full border border-mts-border bg-white px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Email</label
                >
                <input
                  v-model="o.email"
                  type="email"
                  required
                  class="w-full border border-mts-border bg-white px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
            </div>
            <div class="flex justify-end">
              <button
                v-if="form.offices.length > 1"
                type="button"
                class="btn-secondary inline-flex items-center gap-2 text-red-700 border-red-200 hover:border-red-400"
                @click="removeOffice(i)"
              >
                <Trash2 class="h-4 w-4" />
                Удалить офис
              </button>
            </div>
          </div>
          <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addOffice">
            <Plus class="h-4 w-4" />
            Добавить офис
          </button>
        </div>

        <div class="flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          <NuxtLink to="/admin" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
