<script setup lang="ts">
import { ArrowLeft, Loader2, Palette } from 'lucide-vue-next'
import type { SiteAppearanceSettings } from '~/types'
import AdminSelect from '~/components/admin/AdminSelect.vue'
import { normalizeAppearanceSettingsPayload } from '~/utils/normalizeAppearanceSettingsPayload'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { canManageNavigation } = useAdminPermissions()

const loading = ref(true)
const saving = ref(false)
const form = ref<SiteAppearanceSettings>(normalizeAppearanceSettingsPayload(null))

const themeOptions = [
  { value: 'default' as const, label: 'Стандартная (Marin)' },
  { value: 'scglobal' as const, label: 'Golden Sepia' },
]

onMounted(async () => {
  if (!canManageNavigation.value) {
    await navigateTo('/admin')
    return
  }
  try {
    form.value = await api.appearanceSettings.get()
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить настройки оформления', variant: 'error' })
    form.value = normalizeAppearanceSettingsPayload(null)
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const theme = form.value.theme === 'scglobal' ? 'scglobal' : 'default'
    await api.appearanceSettings.update({ theme })
    form.value = { theme }
    adminToast.success('Оформление сайта сохранено')
    await refreshNuxtData('site-appearance')
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
      <div class="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-12">
        <div class="flex items-center gap-4">
          <NuxtLink to="/admin" class="text-mts-text-secondary transition-colors hover:text-mts-accent" aria-label="Назад в панель">
            <ArrowLeft class="h-5 w-5" />
          </NuxtLink>
          <div class="flex items-center gap-2">
            <Palette class="h-5 w-5 text-mts-accent" />
            <h1 class="font-display text-xl text-mts-text">Оформление сайта</h1>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-none border border-mts-accent bg-mts-accent px-4 py-2 font-mono text-xs uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          :disabled="loading || saving"
          @click="save"
        >
          <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
          Сохранить
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-10 lg:px-12">
      <p class="mb-8 max-w-2xl font-body text-mts-text-secondary">
        Тема публичного сайта: цвета фона, шапки и карточек. Админ-панель не меняется.
      </p>

      <div v-if="loading" class="flex justify-center py-20">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>

      <div v-else class="max-w-xl border border-mts-border bg-white p-6">
        <label class="mb-2 block font-mono text-xs uppercase text-mts-text-secondary" for="site-theme">
          Тема
        </label>
        <AdminSelect
          id="site-theme"
          v-model="form.theme"
          :options="themeOptions"
          :disabled="saving"
        />
      </div>
    </main>
  </div>
</template>
