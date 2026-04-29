<script setup lang="ts">
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-vue-next'
import AdminNavPathPick from '~/components/admin/AdminNavPathPick.vue'
import type { NavigationMenuItem, NavigationMenuSettings } from '~/types'
import { emptyNavigationSettings } from '~/utils/emptyNavigationSettings'
import { useConfirm } from '~/composables/useConfirmAction'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { canManageNavigation } = useAdminPermissions()
const { pathOptions, loadPathOptions } = useAdminPathOptions()
const { confirm } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const form = ref<NavigationMenuSettings>(emptyNavigationSettings())

function defaultMenuItems(): NavigationMenuItem[] {
  return [
    { path: '/', label: { ru: 'Главная', en: 'Home' } },
    { path: '/about', label: { ru: 'О компании', en: 'About' } },
    { path: '/services', label: { ru: 'Судоремонт', en: 'Ship Repair' } },
    { path: '/projects', label: { ru: 'Проекты', en: 'Projects' } },
    { path: '/ship-management', label: { ru: 'Судовой менеджмент', en: 'Ship management' } },
    { path: '/crewing-management', label: { ru: 'Крюинг-менеджмент', en: 'Crewing management' } },
    { path: '/vacancies', label: { ru: 'Вакансии', en: 'Vacancies' } },
    { path: '/contacts', label: { ru: 'Контакты', en: 'Contacts' } },
  ]
}

function emptyItem(): NavigationMenuItem {
  return { path: '/', label: { ru: '', en: '' } }
}

function serializeNavItem(row: NavigationMenuItem): NavigationMenuItem {
  return {
    path: row.path.trim() || '/',
    label: {
      ru: row.label.ru.trim(),
      en: row.label.en.trim(),
    },
  }
}

function normalizeForEditor(settings: NavigationMenuSettings): NavigationMenuSettings {
  if (settings.more.length) {
    return {
      main: defaultMenuItems(),
      more: [],
    }
  }
  const items = [...settings.main, ...settings.more].map(serializeNavItem)
  return {
    main: items.length ? items : defaultMenuItems(),
    more: [],
  }
}

onMounted(async () => {
  if (!canManageNavigation.value) {
    await navigateTo('/admin')
    return
  }
  try {
    await loadPathOptions()
    form.value = normalizeForEditor(await api.navigationSettings.get())
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить меню', variant: 'error' })
    form.value = { main: defaultMenuItems(), more: [] }
  } finally {
    loading.value = false
  }
})

function addItem() {
  form.value.main.push(emptyItem())
}

async function removeItem(i: number) {
  const ok = await confirm({
    message: 'Удалить этот пункт fullscreen-меню?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.main.splice(i, 1)
}

function moveItem(i: number, dir: -1 | 1) {
  const arr = form.value.main
  const j = i + dir
  if (j < 0 || j >= arr.length) {
    return
  }
  const a = arr[i]!
  const b = arr[j]!
  arr[i] = b
  arr[j] = a
}

async function restoreDefaultMenu() {
  const ok = await confirm({
    message: 'Заменить текущий список пунктами из нового дизайна?',
    confirmLabel: 'Заменить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.main = defaultMenuItems()
  form.value.more = []
}

async function submit() {
  saving.value = true
  try {
    const payload: NavigationMenuSettings = {
      main: form.value.main.map(serializeNavItem),
      more: [],
    }
    await api.navigationSettings.update(payload)
    form.value = normalizeForEditor(await api.navigationSettings.get())
    adminToast.success('Fullscreen-меню сохранено')
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
      <div class="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-12">
        <NuxtLink to="/admin" class="mr-4 text-mts-text-secondary hover:text-mts-accent">
          <ArrowLeft class="h-5 w-5" />
        </NuxtLink>
        <h1 class="font-display text-xl text-mts-text">Fullscreen-меню</h1>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>

      <form v-else class="relative border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <CommonAccentCorners />

        <div class="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <p class="font-body text-sm leading-relaxed text-mts-text-secondary">
              Новый клиентский дизайн использует один список пунктов в полноэкранном меню. Прежние блоки
              «Основное меню», «Ещё» и вложенные подменю больше не выводятся на сайте.
            </p>
            <p class="mt-3 font-body text-sm leading-relaxed text-mts-text-secondary">
              Список «Раздел сайта» строится из файлов <span class="font-mono">app/pages</span> и опубликованных
              контентных страниц API. Можно ввести путь вручную: внутренний
              (<span class="font-mono">/services</span>) или полный URL (<span class="font-mono">https://…</span>).
            </p>
          </div>

          <div class="border border-mts-border bg-mts-bg p-4">
            <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Как будет выглядеть</p>
            <div class="mt-3 rounded bg-mts-navy p-4">
              <div
                v-for="(row, i) in form.main.slice(0, 5)"
                :key="`preview-${i}`"
                class="flex items-center justify-between border-b border-white/10 py-2 last:border-b-0"
              >
                <span class="text-sm font-bold text-white/75">{{ row.label.ru || 'Без подписи' }}</span>
                <span class="text-white/20">→</span>
              </div>
              <p v-if="form.main.length > 5" class="mt-3 text-xs text-white/40">+ ещё {{ form.main.length - 5 }}</p>
            </div>
          </div>
        </div>

        <div class="mb-10 space-y-4">
          <div
            v-for="(row, i) in form.main"
            :key="`menu-item-${i}`"
            class="grid gap-4 border border-mts-border bg-mts-bg/50 p-4 sm:grid-cols-2"
          >
            <div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
              <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                Пункт {{ i + 1 }}
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                  :disabled="i === 0"
                  aria-label="Выше"
                  @click="moveItem(i, -1)"
                >
                  <ChevronUp class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                  :disabled="i === form.main.length - 1"
                  aria-label="Ниже"
                  @click="moveItem(i, 1)"
                >
                  <ChevronDown class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-2 border-red-200 text-red-700 hover:border-red-400"
                  @click="removeItem(i)"
                >
                  <Trash2 class="h-4 w-4" />
                  Удалить
                </button>
              </div>
            </div>

            <div class="sm:col-span-2">
              <AdminNavPathPick v-model="row.path" :path-options="pathOptions" input-placeholder="/services или https://…" />
            </div>

            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                Подпись (RU)
              </label>
              <AdminThemedTextField v-model="row.label.ru" :multiline="false" />
            </div>

            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                Подпись (EN)
              </label>
              <AdminThemedTextField v-model="row.label.en" :multiline="false" />
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addItem">
              <Plus class="h-4 w-4" />
              Добавить пункт
            </button>
            <button type="button" class="btn-secondary" @click="restoreDefaultMenu">
              Восстановить пункты нового дизайна
            </button>
          </div>
        </div>

        <div class="flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
          <NuxtLink to="/admin" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
