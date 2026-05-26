<script setup lang="ts">
import { ArrowLeft, Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-vue-next'
import AdminNavPathPick from '~/components/admin/AdminNavPathPick.vue'
import type { FooterMenuSettings, FooterNavLink } from '~/types'
import { MARINE_CONTENT_LOCALES } from '~/utils/marineLocales'
import { emptyFooterMenuSettings } from '~/utils/emptyFooterMenuSettings'
import { useConfirm } from '~/composables/useConfirmAction'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useMarineApi()
const { pathOptions, loadPathOptions } = useAdminPathOptions()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { canManageNavigation } = useAdminPermissions()
const { confirm } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const form = ref<FooterMenuSettings>(emptyFooterMenuSettings())

function columnLabel(ci: number): string {
  return `Колонка ${ci + 1}`
}

function addColumn() {
  form.value.columns.push({
    title: { ru: '', en: '' },
    links: [],
    hidden: false,
  })
}

async function removeColumn(ci: number) {
  const ok = await confirm({
    message: 'Удалить эту колонку со всеми ссылками?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) return
  form.value.columns.splice(ci, 1)
}

function toggleColumnHidden(ci: number) {
  const col = form.value.columns[ci]
  if (col) col.hidden = !col.hidden
}

const footerVisibilityRoutes = [
  { path: '/', label: 'Главная' },
  { path: '/about', label: 'О компании' },
  { path: '/ship-repair', label: 'Судоремонт' },
  { path: '/projects', label: 'Проекты' },
  { path: '/gallery', label: 'Галерея' },
  { path: '/news', label: 'Новости' },
  { path: '/vacancies', label: 'Вакансии' },
  { path: '/contacts', label: 'Контакты' },
  { path: '/application-form', label: 'Анкета' },
  { path: '/ship-management', label: 'Судовой менеджмент' },
  { path: '/crewing-management', label: 'Крюинг' },
  { path: '/lnk', label: 'ЛНК' },
] as const

function isFooterPathHidden(path: string): boolean {
  return form.value.hideFooterPaths?.includes(path) ?? false
}

function toggleFooterPathHidden(path: string, hide: boolean) {
  const cur = [...(form.value.hideFooterPaths ?? [])]
  const i = cur.indexOf(path)
  if (hide && i < 0) {
    cur.push(path)
  }
  if (!hide && i >= 0) {
    cur.splice(i, 1)
  }
  form.value.hideFooterPaths = cur
}

function emptyLink(): FooterNavLink {
  return { path: '/', label: { ru: '', en: '' } }
}

function trimFooterPayload(data: FooterMenuSettings): FooterMenuSettings {
  const paths = [...(data.hideFooterPaths ?? [])]
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('/') ? p : `/${p}`))
  return {
    columns: data.columns.map((col) => ({
      title: { ru: col.title.ru.trim(), en: col.title.en.trim() },
      links: col.links.map((l) => ({
        path: l.path.trim() || '/',
        label: { ru: l.label.ru.trim(), en: l.label.en.trim() },
      })),
      hidden: col.hidden === true,
    })),
    legal: data.legal.map((l) => ({
      path: l.path.trim() || '/',
      label: { ru: l.label.ru.trim(), en: l.label.en.trim() },
    })),
    hideFooterGlobally: data.hideFooterGlobally === true,
    hideFooterPaths: [...new Set(paths)],
  }
}

onMounted(async () => {
  if (!canManageNavigation.value) {
    await navigateTo('/admin')
    return
  }
  await loadPathOptions()
  try {
    form.value = await api.footerNavigationSettings.get()
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить меню подвала', variant: 'error' })
    form.value = emptyFooterMenuSettings()
  } finally {
    loading.value = false
  }
})

function addLink(colIndex: number) {
  form.value.columns[colIndex]?.links.push(emptyLink())
}

async function removeLink(colIndex: number, li: number) {
  const ok = await confirm({
    message: 'Удалить эту ссылку?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  const col = form.value.columns[colIndex]
  if (!col) {
    return
  }
  col.links.splice(li, 1)
}

function addLegal() {
  form.value.legal.push(emptyLink())
}

async function removeLegal(i: number) {
  const ok = await confirm({
    message: 'Удалить эту ссылку в юридическом блоке?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.legal.splice(i, 1)
}

async function submit() {
  saving.value = true
  try {
    const payload = trimFooterPayload(form.value)
    const visibleColumns = payload.columns.filter((c) => !c.hidden)
    for (const loc of MARINE_CONTENT_LOCALES) {
      for (const c of visibleColumns) {
        if (!c.title[loc]?.trim()) {
          await showAdminAlert({
            message: `Заполните заголовки видимых колонок (${loc.toUpperCase()}).`,
            variant: 'error',
          })
          saving.value = false
          return
        }
      }
      const labels = visibleColumns.flatMap((c) => c.links.map((l) => l.label[loc]))
      const legalLabels = payload.legal.map((l) => l.label[loc])
      if ([...labels, ...legalLabels].some((s) => !s?.trim())) {
        await showAdminAlert({
          message: `Заполните подписи (${loc.toUpperCase()}) у всех ссылок.`,
          variant: 'error',
        })
        saving.value = false
        return
      }
    }
    await api.footerNavigationSettings.update(payload)
    form.value = await api.footerNavigationSettings.get()
    adminToast.success('Меню подвала сохранено')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally {
    saving.value = false
  }
}

const sectionLabel = 'block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2'
const sectionInput = 'w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent'
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto flex h-16 max-w-[1600px] items-center px-6 lg:px-12">
        <NuxtLink to="/admin" class="mr-4 text-mts-text-secondary hover:text-mts-accent">
          <ArrowLeft class="h-5 w-5" />
        </NuxtLink>
        <h1 class="font-display text-xl text-mts-text">Меню в подвале</h1>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <form v-else class="relative space-y-8 border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <CommonAccentCorners />

        <p class="font-body text-sm text-mts-text-secondary">
          Колонки ссылок (как на сайте) и нижняя полоса документов. Подменю нет — только плоский список. Колонка
          «Контакты» с телефоном и почтой по-прежнему задаётся на странице
          <NuxtLink to="/admin/contacts" class="text-mts-accent underline">контактов</NuxtLink>.
        </p>

        <section class="space-y-4 border border-mts-border bg-mts-bg/40 p-6">
          <h2 class="mb-2 font-mono text-xs uppercase tracking-widest text-mts-text-secondary">Видимость подвала</h2>
          <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
            <input v-model="form.hideFooterGlobally" type="checkbox" class="mts-checkbox" />
            Полностью скрыть подвал на всём сайте
          </label>
          <div>
            <p class="mb-2 font-body text-xs text-mts-text-secondary">
              Скрыть подвал на отдельных разделах (путь без префикса <span class="font-mono">/en</span>):
            </p>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <label
                v-for="opt in footerVisibilityRoutes"
                :key="opt.path"
                class="inline-flex items-center gap-2 font-body text-sm text-mts-text"
              >
                <input
                  type="checkbox"
                  class="mts-checkbox"
                  :checked="isFooterPathHidden(opt.path)"
                  @change="toggleFooterPathHidden(opt.path, ($event.target as HTMLInputElement).checked)"
                />
                {{ opt.label }}
                <span class="font-mono text-[10px] text-mts-text-secondary">{{ opt.path }}</span>
              </label>
            </div>
          </div>
        </section>

        <section
          v-for="(col, ci) in form.columns"
          :key="ci"
          class="border p-6 bg-mts-bg/40 transition-opacity"
          :class="col.hidden ? 'border-mts-border/50 opacity-60' : 'border-mts-border'"
        >
          <div class="flex items-center justify-between mb-4 gap-3">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">
              {{ columnLabel(ci) }}
              <span v-if="col.hidden" class="ml-2 text-mts-text-secondary/60 normal-case tracking-normal">(скрыта)</span>
            </h2>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 border transition-colors"
                :class="col.hidden
                  ? 'border-mts-accent text-mts-accent hover:bg-mts-accent hover:text-white'
                  : 'border-mts-border text-mts-text-secondary hover:border-mts-accent hover:text-mts-accent'"
                :title="col.hidden ? 'Показать колонку на сайте' : 'Скрыть колонку на сайте'"
                @click="toggleColumnHidden(ci)"
              >
                <EyeOff v-if="!col.hidden" class="h-3.5 w-3.5" />
                <Eye v-else class="h-3.5 w-3.5" />
                {{ col.hidden ? 'Показать' : 'Скрыть' }}
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 border border-mts-border text-mts-text-secondary hover:border-red-500 hover:text-red-600 transition-colors"
                title="Удалить колонку"
                @click="removeColumn(ci)"
              >
                <Trash2 class="h-3.5 w-3.5" />
                Удалить
              </button>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 mb-6">
            <div>
              <label :class="sectionLabel">Заголовок колонки (RU)</label>
              <input v-model="col.title.ru" type="text" :class="sectionInput" placeholder="Компания" />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок колонки (EN)</label>
              <input v-model="col.title.en" type="text" :class="sectionInput" placeholder="Company" />
            </div>
          </div>
          <div class="space-y-4">
            <div
              v-for="(link, li) in col.links"
              :key="li"
              class="border border-mts-border bg-white p-4 space-y-3"
            >
              <div class="flex justify-end">
                <button
                  type="button"
                  class="text-mts-text-secondary hover:text-red-600"
                  aria-label="Удалить ссылку"
                  @click="removeLink(ci, li)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label :class="sectionLabel">Подпись (RU)</label>
                  <input v-model="link.label.ru" type="text" :class="sectionInput" placeholder="О компании" />
                </div>
                <div>
                  <label :class="sectionLabel">Подпись (EN)</label>
                  <input v-model="link.label.en" type="text" :class="sectionInput" placeholder="About" />
                </div>
              </div>
              <AdminNavPathPick v-model="link.path" :path-options="pathOptions" />
            </div>
            <button type="button" class="btn-secondary inline-flex items-center gap-2 text-sm" @click="addLink(ci)">
              <Plus class="h-4 w-4" />
              Добавить ссылку
            </button>
          </div>
        </section>

        <button type="button" class="btn-secondary inline-flex items-center gap-2 text-sm" @click="addColumn">
          <Plus class="h-4 w-4" />
          Добавить колонку
        </button>

        <section class="border border-mts-border p-6 bg-mts-bg/40">
          <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary mb-4">Нижняя полоса (юридические ссылки)</h2>
          <p class="font-body text-xs text-mts-text-secondary mb-4">
            Ссылка «Admin» в подвале сайта ведёт в панель и не редактируется здесь.
          </p>
          <div class="space-y-4">
            <div v-for="(link, i) in form.legal" :key="i" class="border border-mts-border bg-white p-4 space-y-3">
              <div class="flex justify-end">
                <button type="button" class="text-mts-text-secondary hover:text-red-600" @click="removeLegal(i)">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <label :class="sectionLabel">Подпись (RU)</label>
                  <input v-model="link.label.ru" type="text" :class="sectionInput" placeholder="Политика конфиденциальности" />
                </div>
                <div>
                  <label :class="sectionLabel">Подпись (EN)</label>
                  <input v-model="link.label.en" type="text" :class="sectionInput" placeholder="Privacy Policy" />
                </div>
              </div>
              <AdminNavPathPick v-model="link.path" :path-options="pathOptions" />
            </div>
            <button type="button" class="btn-secondary inline-flex items-center gap-2 text-sm" @click="addLegal">
              <Plus class="h-4 w-4" />
              Добавить ссылку
            </button>
          </div>
        </section>

        <div class="flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          <NuxtLink to="/admin" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
