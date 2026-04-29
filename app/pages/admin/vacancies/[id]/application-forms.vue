<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { ApplicationFormItem, ApplicationFormStatus, DocumentRequestCatalogEntry, VacancyItem } from '~/types'
import AdminApplicationFormViewModal from '~/components/admin/AdminApplicationFormViewModal.vue'
import AdminRequestDocumentsModal from '~/components/admin/AdminRequestDocumentsModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const api = useMarineApi()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const idParam = computed(() => route.params.id as string)
const vacancyId = computed(() => Number(idParam.value))

const vacancy = ref<VacancyItem | null>(null)
const rows = ref<ApplicationFormItem[]>([])
const pending = ref(true)
const actionId = ref<number | null>(null)

const docCatalog = ref<DocumentRequestCatalogEntry[]>([])
const docCatalogPending = ref(false)
const requestDocsOpen = ref(false)
const requestDocsRow = ref<ApplicationFormItem | null>(null)
const requestDocsSubmitting = ref(false)
const viewOpen = ref(false)
const viewRow = ref<ApplicationFormItem | null>(null)

const search = ref('')
const sort = ref('id')
const order = ref<'asc' | 'desc'>('desc')
const statusFilter = ref<'' | ApplicationFormStatus>('')

const statusFilterOptions = [
  { value: '', label: 'Все' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'accepted', label: 'Принята' },
  { value: 'rejected', label: 'Отклонена' },
  { value: 'documents_requested', label: 'Запрошены документы' },
]

const sortOptions = [
  { value: 'id', label: 'ID' },
  { value: 'created_at', label: 'Подана' },
  { value: 'full_name', label: 'ФИО' },
  { value: 'email', label: 'Email' },
  { value: 'status', label: 'Статус' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

const statusLabel: Record<ApplicationFormStatus, string> = {
  pending: 'Ожидает',
  accepted: 'Принята',
  rejected: 'Отклонена',
  documents_requested: 'Запрошены документы',
}

function statusClass(s: ApplicationFormStatus): string {
  switch (s) {
    case 'accepted':
      return 'text-green-700 bg-green-50'
    case 'rejected':
      return 'text-red-700 bg-red-50'
    case 'documents_requested':
      return 'text-amber-800 bg-amber-50'
    default:
      return 'text-mts-text-secondary bg-mts-bg'
  }
}

async function load() {
  if (idParam.value === 'new' || Number.isNaN(vacancyId.value)) {
    await navigateTo('/admin/vacancies')
    return
  }
  pending.value = true
  try {
    const [v, list] = await Promise.all([
      api.vacancies.getById(vacancyId.value),
      api.applicationForms.getByVacancy(vacancyId.value, {
        search: search.value.trim() || undefined,
        sort: sort.value,
        order: order.value,
        status: statusFilter.value || undefined,
        per_page: 500,
      }),
    ])
    vacancy.value = v
    rows.value = list
  } catch {
    await navigateTo('/admin/vacancies')
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
    load()
  }, 320)
}

function onExtraFilter(v: string) {
  statusFilter.value = v as '' | ApplicationFormStatus
}

onMounted(load)

watch([sort, order, statusFilter], () => {
  load()
})

async function runAction(row: ApplicationFormItem, status: 'accepted' | 'rejected', message: string) {
  const ok =
    status === 'accepted'
      ? await confirm({
          title: 'Принять анкету',
          message,
          confirmLabel: 'Принять',
          variant: 'default',
        })
      : await confirm({
          title: 'Отклонить анкету',
          message,
          confirmLabel: 'Отклонить',
          variant: 'danger',
        })
  if (!ok) {
    return
  }
  actionId.value = row.id
  try {
    const updated = await api.applicationForms.updateStatus(row.id, status)
    const i = rows.value.findIndex((r) => r.id === row.id)
    if (i !== -1) {
      rows.value[i] = updated
    }
    adminToast.success(status === 'accepted' ? 'Анкета принята' : 'Анкета отклонена')
  } catch {
    await showAdminAlert({ message: 'Не удалось обновить статус', variant: 'error' })
  } finally {
    actionId.value = null
  }
}

async function ensureDocCatalog() {
  if (docCatalog.value.length > 0) {
    return
  }
  docCatalogPending.value = true
  try {
    docCatalog.value = await api.applicationForms.getDocumentRequestCatalog()
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить список типов документов', variant: 'error' })
  } finally {
    docCatalogPending.value = false
  }
}

function openView(row: ApplicationFormItem) {
  viewRow.value = row
  viewOpen.value = true
}

function closeView() {
  viewOpen.value = false
  viewRow.value = null
}

async function openRequestDocs(row: ApplicationFormItem) {
  await ensureDocCatalog()
  if (docCatalog.value.length === 0) {
    return
  }
  requestDocsRow.value = row
  requestDocsOpen.value = true
}

function closeRequestDocs() {
  requestDocsOpen.value = false
  requestDocsRow.value = null
}

async function onRequestDocsConfirm(keys: string[]) {
  if (!requestDocsRow.value) {
    return
  }
  requestDocsSubmitting.value = true
  try {
    const updated = await api.applicationForms.requestDocuments(requestDocsRow.value.id, keys)
    const i = rows.value.findIndex((r) => r.id === requestDocsRow.value!.id)
    if (i !== -1) {
      rows.value[i] = updated
    }
    closeRequestDocs()
    adminToast.show({
      title: 'Запрос отправлен',
      message: 'Ссылка для загрузки документов отправлена на email кандидата.',
      durationMs: 5200,
    })
  } catch {
    await showAdminAlert({ message: 'Не удалось отправить запрос', variant: 'error' })
  } finally {
    requestDocsSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div class="flex h-16 flex-wrap items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4">
            <NuxtLink
              to="/admin/vacancies"
              class="inline-flex shrink-0 text-mts-text-secondary transition-colors hover:text-mts-accent"
              aria-label="Назад к списку вакансий"
            >
              <ArrowLeft class="h-5 w-5" />
            </NuxtLink>
            <div class="min-w-0">
              <h1 class="font-display text-xl text-mts-text">Анкеты по вакансии</h1>
              <p v-if="vacancy" class="font-body text-sm text-mts-text-secondary">{{ vacancy.title }}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            <NuxtLink
              v-if="idParam !== 'new'"
              :to="`/admin/vacancies/${idParam}`"
              class="font-mono text-xs uppercase text-mts-text-secondary underline-offset-2 hover:text-mts-accent hover:underline"
            >
              Редактировать вакансию
            </NuxtLink>
            <NuxtLink to="/admin/vacancies/application-forms" class="font-mono text-xs uppercase text-mts-accent hover:underline">
              Все анкеты
            </NuxtLink>
            <NuxtLink to="/admin/vacancies" class="font-mono text-xs uppercase text-mts-accent hover:underline">
              Все вакансии
            </NuxtLink>
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
        search-placeholder="ФИО, email, телефон…"
        :extra-filter="statusFilter"
        extra-filter-label="Статус"
        :extra-filter-options="statusFilterOptions"
        extra-filter-class="flex min-w-[260px] flex-col gap-1 sm:max-w-[300px]"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
        @update:extra-filter="onExtraFilter($event)"
      />

      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <div v-else class="overflow-x-auto border border-mts-border bg-white">
        <table class="w-full min-w-[900px]">
          <thead class="border-b border-mts-border bg-mts-bg">
            <tr>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">ФИО</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Email</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Телефон</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Статус</th>
              <th class="p-4 text-left font-mono text-[10px] uppercase text-mts-text-secondary">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td colspan="5" class="p-8 text-center font-body text-mts-text-secondary">Пока нет поданных анкет</td>
            </tr>
            <tr v-for="row in rows" :key="row.id" class="border-b border-mts-border last:border-0">
              <td class="p-4 font-body text-sm text-mts-text">{{ row.fullName }}</td>
              <td class="p-4 font-mono text-xs text-mts-text-secondary">{{ row.email }}</td>
              <td class="p-4 font-mono text-xs text-mts-text-secondary">{{ row.phone || '—' }}</td>
              <td class="p-4">
                <span
                  class="inline-block rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase"
                  :class="statusClass(row.status)"
                >
                  {{ statusLabel[row.status] }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="border border-mts-border bg-white px-2 py-1 font-mono text-[10px] uppercase text-mts-text hover:border-mts-accent hover:text-mts-accent disabled:opacity-50"
                    :disabled="actionId !== null || requestDocsSubmitting"
                    @click="openView(row)"
                  >
                    Просмотр
                  </button>
                  <button
                    type="button"
                    class="border border-mts-border bg-white px-2 py-1 font-mono text-[10px] uppercase text-mts-text hover:border-green-600 hover:text-green-700 disabled:opacity-50"
                    :disabled="actionId !== null || row.status === 'accepted'"
                    @click="
                      runAction(
                        row,
                        'accepted',
                        `Принять анкету от «${row.fullName}»?`,
                      )
                    "
                  >
                    {{ actionId === row.id ? '…' : 'Принять' }}
                  </button>
                  <button
                    type="button"
                    class="border border-mts-border bg-white px-2 py-1 font-mono text-[10px] uppercase text-mts-text hover:border-red-600 hover:text-red-700 disabled:opacity-50"
                    :disabled="actionId !== null || row.status === 'rejected'"
                    @click="
                      runAction(
                        row,
                        'rejected',
                        `Отклонить анкету от «${row.fullName}»?`,
                      )
                    "
                  >
                    {{ actionId === row.id ? '…' : 'Отклонить' }}
                  </button>
                  <button
                    type="button"
                    class="border border-mts-border bg-white px-2 py-1 font-mono text-[10px] uppercase text-mts-text hover:border-amber-600 hover:text-amber-800 disabled:opacity-50"
                    :disabled="actionId !== null || requestDocsSubmitting || docCatalogPending"
                    @click="openRequestDocs(row)"
                  >
                    {{ requestDocsSubmitting && requestDocsRow?.id === row.id ? '…' : 'Запросить документы' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <AdminRequestDocumentsModal
      :open="requestDocsOpen"
      :entries="docCatalog"
      :submitting="requestDocsSubmitting"
      @close="closeRequestDocs"
      @confirm="onRequestDocsConfirm"
    />

    <AdminApplicationFormViewModal :open="viewOpen" :form="viewRow" @close="closeView" />
  </div>
</template>
