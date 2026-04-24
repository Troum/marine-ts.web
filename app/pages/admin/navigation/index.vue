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

function emptyItem(): NavigationMenuItem {
  return { path: '/', label: { ru: '', en: '' } }
}

/** Сохраняем одну вложенность; глубже не отдаём на API. */
function serializeNavItem(row: NavigationMenuItem): NavigationMenuItem {
  const path = row.path.trim() || '/'
  const label = { ru: row.label.ru.trim(), en: row.label.en.trim() }
  if (row.children?.length) {
    return {
      path,
      label,
      children: row.children.map((c) => {
        const p = c.path.trim() || '/'
        const lab = { ru: c.label.ru.trim(), en: c.label.en.trim() }
        return { path: p, label: lab }
      }),
    }
  }
  return { path, label }
}

onMounted(async () => {
  if (!canManageNavigation.value) {
    await navigateTo('/admin')
    return
  }
  try {
    await loadPathOptions()
    form.value = await api.navigationSettings.get()
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить меню', variant: 'error' })
    form.value = emptyNavigationSettings()
  } finally {
    loading.value = false
  }
})

function addMain() {
  form.value.main.push(emptyItem())
}

async function removeMain(i: number) {
  const ok = await confirm({
    message: 'Удалить этот пункт главного меню?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.main.splice(i, 1)
}

function moveMain(i: number, dir: -1 | 1) {
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

function addMore() {
  form.value.more.push(emptyItem())
}

async function removeMore(i: number) {
  const ok = await confirm({
    message: 'Удалить этот пункт блока «Ещё»?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.more.splice(i, 1)
}

function moveMore(i: number, dir: -1 | 1) {
  const arr = form.value.more
  const j = i + dir
  if (j < 0 || j >= arr.length) {
    return
  }
  const a = arr[i]!
  const b = arr[j]!
  arr[i] = b
  arr[j] = a
}

function addMainChild(i: number) {
  const row = form.value.main[i]
  if (!row) {
    return
  }
  if (!row.children) {
    row.children = []
  }
  row.children.push(emptyItem())
}

async function removeMainChild(i: number, ci: number) {
  const ok = await confirm({
    message: 'Удалить этот подпункт?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  const row = form.value.main[i]
  if (!row?.children) {
    return
  }
  row.children.splice(ci, 1)
  if (row.children.length === 0) {
    delete row.children
  }
}

async function clearMainChildren(i: number) {
  const ok = await confirm({
    message: 'Удалить все подпункты у этого пункта?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  const row = form.value.main[i]
  if (row) {
    delete row.children
  }
}

async function submit() {
  saving.value = true
  try {
    const payload: NavigationMenuSettings = {
      main: form.value.main.map(serializeNavItem),
      more: form.value.more.map(serializeNavItem),
    }
    await api.navigationSettings.update(payload)
    form.value = await api.navigationSettings.get()
    adminToast.success('Меню сохранено')
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
        <h1 class="font-display text-xl text-mts-text">Меню в шапке</h1>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <form v-else class="relative border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <CommonAccentCorners />

        <p class="font-body text-sm text-mts-text-secondary mb-8">
          Первый ряд ссылок в шапке и пункты в выпадающем списке «Ещё». Список «Раздел сайта» строится из файлов
          <span class="font-mono">app/pages</span> (статические маршруты) и из опубликованных контентных страниц в API
          (в т.ч. карточки сервисов и проектов). Можно ввести путь вручную: внутренний (например
          <span class="font-mono">/news</span>) или полный URL (<span class="font-mono">https://…</span>).
        </p>

        <h2 class="font-display text-lg text-mts-text mb-4">Основное меню</h2>
        <div class="space-y-4 mb-10">
          <div
            v-for="(row, i) in form.main"
            :key="`main-${i}`"
            class="grid gap-4 border border-mts-border p-4 bg-mts-bg/50 sm:grid-cols-2"
          >
            <div class="sm:col-span-2 flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                :disabled="i === 0"
                aria-label="Выше"
                @click="moveMain(i, -1)"
              >
                <ChevronUp class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                :disabled="i === form.main.length - 1"
                aria-label="Ниже"
                @click="moveMain(i, 1)"
              >
                <ChevronDown class="h-4 w-4" />
              </button>
            </div>
            <div class="sm:col-span-2">
              <AdminNavPathPick v-model="row.path" :path-options="pathOptions" input-placeholder="/services или https://…" />
            </div>
            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Подпись (RU)</label
              >
              <AdminThemedTextField v-model="row.label.ru" :multiline="false" />
            </div>
            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Подпись (EN)</label
              >
              <AdminThemedTextField v-model="row.label.en" :multiline="false" />
            </div>

            <div class="sm:col-span-2 border-t border-mts-border pt-4 mt-1">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Подпункты (выпадающее меню)
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-if="row.children?.length"
                    type="button"
                    class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5 text-xs"
                    @click="addMainChild(i)"
                  >
                    <Plus class="h-3.5 w-3.5" />
                    Подпункт
                  </button>
                  <button
                    v-if="row.children?.length"
                    type="button"
                    class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5 text-xs border-red-200 text-red-800"
                    @click="clearMainChildren(i)"
                  >
                    Убрать подменю
                  </button>
                  <button
                    v-else
                    type="button"
                    class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5 text-xs"
                    @click="addMainChild(i)"
                  >
                    <Plus class="h-3.5 w-3.5" />
                    Добавить подменю
                  </button>
                </div>
              </div>
              <p v-if="!row.children?.length" class="font-body text-xs text-mts-text-secondary">
                Если нужен только заголовок группы без своей страницы, задайте путь родителя
                <span class="font-mono">#</span>
                и добавьте подпункты.
              </p>
              <div v-else class="space-y-3">
                <div
                  v-for="(child, ci) in row.children"
                  :key="`main-${i}-sub-${ci}`"
                  class="grid gap-3 border border-mts-border bg-white p-3 sm:grid-cols-2"
                >
                  <div class="sm:col-span-2">
                    <AdminNavPathPick
                      v-model="child.path"
                      compact
                      label="Путь подпункта"
                      :path-options="pathOptions"
                      input-placeholder="/ship-management или https://…"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                      >Подпись (RU)</label
                    >
                    <AdminThemedTextField v-model="child.label.ru" :multiline="false" />
                  </div>
                  <div>
                    <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                      >Подпись (EN)</label
                    >
                    <AdminThemedTextField v-model="child.label.en" :multiline="false" />
                  </div>
                  <div class="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      class="btn-secondary inline-flex items-center gap-2 text-red-700 border-red-200 text-xs py-1.5"
                      @click="removeMainChild(i, ci)"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                      Удалить подпункт
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="sm:col-span-2 flex justify-end">
              <button
                type="button"
                class="btn-secondary inline-flex items-center gap-2 text-red-700 border-red-200 hover:border-red-400"
                @click="removeMain(i)"
              >
                <Trash2 class="h-4 w-4" />
                Удалить
              </button>
            </div>
          </div>
          <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addMain">
            <Plus class="h-4 w-4" />
            Добавить пункт
          </button>
        </div>

        <h2 class="font-display text-lg text-mts-text mb-4">Меню «Ещё»</h2>
        <div class="space-y-4 mb-10">
          <div
            v-for="(row, i) in form.more"
            :key="`more-${i}`"
            class="grid gap-4 border border-mts-border p-4 bg-mts-bg/30 sm:grid-cols-2"
          >
            <div class="sm:col-span-2 flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                :disabled="i === 0"
                aria-label="Выше"
                @click="moveMore(i, -1)"
              >
                <ChevronUp class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                :disabled="i === form.more.length - 1"
                aria-label="Ниже"
                @click="moveMore(i, 1)"
              >
                <ChevronDown class="h-4 w-4" />
              </button>
            </div>
            <div class="sm:col-span-2">
              <AdminNavPathPick v-model="row.path" :path-options="pathOptions" input-placeholder="/gallery или https://…" />
            </div>
            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Подпись (RU)</label
              >
              <AdminThemedTextField v-model="row.label.ru" :multiline="false" />
            </div>
            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Подпись (EN)</label
              >
              <AdminThemedTextField v-model="row.label.en" :multiline="false" />
            </div>
            <div class="sm:col-span-2 flex justify-end">
              <button
                type="button"
                class="btn-secondary inline-flex items-center gap-2 text-red-700 border-red-200 hover:border-red-400"
                @click="removeMore(i)"
              >
                <Trash2 class="h-4 w-4" />
                Удалить
              </button>
            </div>
          </div>
          <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addMore">
            <Plus class="h-4 w-4" />
            Добавить пункт
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
