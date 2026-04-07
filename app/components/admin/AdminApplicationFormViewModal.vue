<script setup lang="ts">
import { FileDown, FileText, Loader2, X } from 'lucide-vue-next'
import type { ApplicationFormItem, ApplicationFormStatus, DocumentRequestCatalogEntry } from '~/types'
import {
  applicationFormPayloadRows,
  supplementaryFilesFromPayload,
} from '~/utils/applicationFormPayloadDisplay'

const props = defineProps<{
  open: boolean
  form: ApplicationFormItem | null
}>()

const emit = defineEmits<{
  close: []
}>()

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const detail = ref<ApplicationFormItem | null>(null)
const detailPending = ref(false)
const docCatalog = ref<DocumentRequestCatalogEntry[]>([])
const downloadingKey = ref<string | null>(null)
const pdfLoading = ref(false)

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

function labelForDocumentKey(key: string): string {
  return docCatalog.value.find((e) => e.key === key)?.label ?? key
}

const payloadRows = computed(() => applicationFormPayloadRows(detail.value?.payload as Record<string, unknown> | undefined))

const supplementaryList = computed(() =>
  supplementaryFilesFromPayload(detail.value?.payload as Record<string, unknown> | undefined),
)

watch(
  () => [props.open, props.form] as const,
  async ([open, form]) => {
    if (!open || !form) {
      detail.value = null
      return
    }
    detailPending.value = true
    try {
      detail.value = await api.applicationForms.getById(form.id)
    } catch {
      detail.value = form
      await showAdminAlert({
        message: 'Не удалось обновить данные анкеты. Показана копия из списка.',
        variant: 'error',
      })
    } finally {
      detailPending.value = false
    }
  },
  { immediate: true },
)

watch(
  () => props.open,
  async (open) => {
    if (open && docCatalog.value.length === 0) {
      try {
        docCatalog.value = await api.applicationForms.getDocumentRequestCatalog()
      } catch {
        /* labels fallback to raw keys */
      }
    }
  },
)

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    e.preventDefault()
    emit('close')
  }
}

watch(
  () => props.open,
  (open) => {
    if (import.meta.client) {
      if (open) {
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKeydown)
      } else {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', onKeydown)
      }
    }
  },
)

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKeydown)
  }
})

async function downloadPdf() {
  if (!detail.value) {
    return
  }
  pdfLoading.value = true
  try {
    await api.applicationForms.downloadApplicationFormPdf(detail.value.id)
    adminToast.success('PDF сохранён')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Не удалось скачать PDF'
    await showAdminAlert({ message: msg, variant: 'error' })
  } finally {
    pdfLoading.value = false
  }
}

async function downloadDoc(key: string, originalName: string) {
  if (!detail.value) {
    return
  }
  downloadingKey.value = key
  try {
    await api.applicationForms.downloadApplicationSupplementaryFile(detail.value.id, key, originalName)
    adminToast.success('Файл скачан')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Не удалось скачать файл'
    await showAdminAlert({ message: msg, variant: 'error' })
  } finally {
    downloadingKey.value = null
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && form"
        class="fixed inset-0 z-[245] flex items-center justify-center p-4 sm:p-6"
        role="presentation"
        @click="onBackdropClick"
      >
        <div class="absolute inset-0 bg-mts-text/40 backdrop-blur-[2px]" aria-hidden="true" />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-form-view-title"
          class="relative z-10 flex max-h-[min(90vh,900px)] w-full max-w-3xl flex-col overflow-hidden border border-mts-border bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
          @click.stop
        >
          <div class="flex shrink-0 items-start justify-between gap-4 border-b border-mts-border bg-mts-bg/80 px-5 py-4">
            <div class="min-w-0">
              <h2 id="app-form-view-title" class="font-display text-lg text-mts-text">Анкета кандидата</h2>
              <p v-if="detail" class="mt-1 font-mono text-xs text-mts-text-secondary">#{{ detail.id }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="detail && !detailPending"
                type="button"
                class="inline-flex items-center gap-1.5 border border-mts-border bg-white px-3 py-2 font-mono text-[10px] uppercase text-mts-text hover:border-mts-accent hover:text-mts-accent disabled:opacity-50"
                :disabled="pdfLoading || downloadingKey !== null"
                @click="downloadPdf"
              >
                <Loader2 v-if="pdfLoading" class="h-4 w-4 animate-spin" />
                <FileText v-else class="h-4 w-4" />
                {{ pdfLoading ? 'PDF…' : 'Скачать PDF' }}
              </button>
              <button
                type="button"
                class="shrink-0 border border-mts-border bg-white p-2 text-mts-text-secondary hover:text-mts-text"
                aria-label="Закрыть"
                @click="emit('close')"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div v-if="detailPending" class="flex justify-center py-16">
              <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
            </div>
            <template v-else-if="detail">
              <div class="mb-6 grid gap-3 border border-mts-border bg-white p-4 sm:grid-cols-2">
                <div>
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Вакансия</p>
                  <p class="font-body text-sm text-mts-text">{{ detail.vacancyTitle ?? '—' }}</p>
                </div>
                <div>
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">ФИО</p>
                  <p class="font-body text-sm text-mts-text">{{ detail.fullName }}</p>
                </div>
                <div>
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Email</p>
                  <p class="font-mono text-xs text-mts-text">{{ detail.email }}</p>
                </div>
                <div>
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Телефон</p>
                  <p class="font-mono text-xs text-mts-text">{{ detail.phone || '—' }}</p>
                </div>
                <div>
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Статус</p>
                  <span
                    class="inline-block rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase"
                    :class="statusClass(detail.status)"
                  >
                    {{ statusLabel[detail.status] }}
                  </span>
                </div>
                <div>
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Подана</p>
                  <p class="font-mono text-xs text-mts-text-secondary">{{ formatDate(detail.createdAt) }}</p>
                </div>
              </div>

              <section v-if="supplementaryList.length > 0" class="mb-8">
                <h3 class="mb-3 font-display text-base text-mts-text">Документы по ссылке</h3>
                <ul class="space-y-2 border border-mts-border bg-mts-bg/50 p-3">
                  <li
                    v-for="doc in supplementaryList"
                    :key="doc.key"
                    class="flex flex-wrap items-center justify-between gap-3 border-b border-mts-border/80 py-2 last:border-0"
                  >
                    <div class="min-w-0">
                      <p class="font-body text-sm font-medium text-mts-text">{{ labelForDocumentKey(doc.key) }}</p>
                      <p class="font-mono text-[11px] text-mts-text-secondary">{{ doc.originalName }}</p>
                      <p v-if="doc.uploadedAt" class="font-mono text-[10px] text-mts-text-muted">
                        {{ formatDate(doc.uploadedAt) }}
                      </p>
                    </div>
                    <button
                      type="button"
                      class="inline-flex shrink-0 items-center gap-1.5 border border-mts-accent bg-mts-accent px-3 py-1.5 font-mono text-[10px] uppercase text-white hover:opacity-90 disabled:opacity-50"
                      :disabled="downloadingKey !== null"
                      @click="downloadDoc(doc.key, doc.originalName)"
                    >
                      <Loader2 v-if="downloadingKey === doc.key" class="h-3.5 w-3.5 animate-spin" />
                      <FileDown v-else class="h-3.5 w-3.5" />
                      {{ downloadingKey === doc.key ? '…' : 'Скачать' }}
                    </button>
                  </li>
                </ul>
              </section>
              <section v-else class="mb-8 rounded-sm border border-dashed border-mts-border bg-mts-bg/30 px-4 py-3">
                <p class="font-body text-sm text-mts-text-secondary">
                  Нет файлов, загруженных по ссылке из письма. Указанное в анкете имя файла фото — только имя, без загрузки на
                  сервер.
                </p>
              </section>

              <section>
                <h3 class="mb-3 font-display text-base text-mts-text">Данные анкеты</h3>
                <div class="space-y-0 border border-mts-border">
                  <div
                    v-for="(row, idx) in payloadRows"
                    :key="idx"
                    class="grid border-b border-mts-border last:border-b-0 sm:grid-cols-[minmax(0,240px)_1fr] sm:gap-4"
                  >
                    <div class="border-b border-mts-border bg-mts-bg/50 px-3 py-2 font-mono text-[10px] uppercase text-mts-text-secondary sm:border-b-0">
                      {{ row.label }}
                    </div>
                    <div class="whitespace-pre-wrap px-3 py-2 font-body text-sm text-mts-text">{{ row.value }}</div>
                  </div>
                </div>
              </section>
            </template>
          </div>

          <div class="shrink-0 border-t border-mts-border bg-white px-5 py-3 text-right">
            <button
              type="button"
              class="border border-mts-border bg-white px-4 py-2 font-mono text-xs uppercase text-mts-text hover:bg-mts-bg"
              @click="emit('close')"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
