<script setup lang="ts">
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-vue-next'
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

const columnLabels = ['Компания / первая колонка', 'Судоремонт / вторая колонка', 'Кандидатам / третья колонка']

function emptyLink(): FooterNavLink {
  return { path: '/', label: { ru: '', en: '' } }
}

function trimFooterPayload(data: FooterMenuSettings): FooterMenuSettings {
  return {
    columns: data.columns.map((col) => ({
      title: { ru: col.title.ru.trim(), en: col.title.en.trim() },
      links: col.links.map((l) => ({
        path: l.path.trim() || '/',
        label: { ru: l.label.ru.trim(), en: l.label.en.trim() },
      })),
    })),
    legal: data.legal.map((l) => ({
      path: l.path.trim() || '/',
      label: { ru: l.label.ru.trim(), en: l.label.en.trim() },
    })),
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
    for (const loc of MARINE_CONTENT_LOCALES) {
      for (const c of payload.columns) {
        if (!c.title[loc]?.trim()) {
          await showAdminAlert({
            message: `Заполните заголовки колонок (${loc.toUpperCase()}).`,
            variant: 'error',
          })
          saving.value = false
          return
        }
      }
      const labels = payload.columns.flatMap((c) => c.links.map((l) => l.label[loc]))
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
          Три колонки ссылок (как на сайте) и нижняя полоса документов. Подменю нет — только плоский список. Колонка
          «Контакты» с телефоном и почтой по-прежнему задаётся на странице
          <NuxtLink to="/admin/contacts" class="text-mts-accent underline">контактов</NuxtLink>.
        </p>

        <section v-for="(col, ci) in form.columns" :key="ci" class="border border-mts-border p-6 bg-mts-bg/40">
          <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary mb-4">{{ columnLabels[ci] }}</h2>
          <div class="grid gap-4 sm:grid-cols-2 mb-6">
            <div>
              <label :class="sectionLabel">Заголовок колонки (RU)</label>
              <AdminThemedTextField v-model="col.title.ru" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок колонки (EN)</label>
              <AdminThemedTextField v-model="col.title.en" :multiline="false" />
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
                  <AdminThemedTextField v-model="link.label.ru" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Подпись (EN)</label>
                  <AdminThemedTextField v-model="link.label.en" :multiline="false" />
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
                  <AdminThemedTextField v-model="link.label.ru" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Подпись (EN)</label>
                  <AdminThemedTextField v-model="link.label.en" :multiline="false" />
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
