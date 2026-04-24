<script setup lang="ts">
import { CheckCircle2, Loader2 } from 'lucide-vue-next'
import type { DocumentUploadSession } from '~/types'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const token = computed(() => (route.params.token as string) || '')

const api = useMarineApi()
const { t, locale } = useI18n()

const session = ref<DocumentUploadSession | null>(null)
const loadError = ref<string | null>(null)
const pending = ref(true)

const fileInputs = ref<Record<string, File | null>>({})
const uploading = ref(false)
const uploadError = ref<string | null>(null)
const uploadDone = ref(false)

useSeoMeta({
  title: t('pages.upload.title'),
  robots: 'noindex, nofollow',
})

async function loadSession() {
  pending.value = true
  loadError.value = null
  try {
    session.value = await api.applicationForms.getDocumentUploadSession(token.value)
    const next: Record<string, File | null> = {}
    for (const d of session.value.requestedDocuments) {
      next[d.key] = null
    }
    fileInputs.value = next
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    loadError.value = err?.data?.message ?? err?.message ?? t('pages.upload.loadErr')
    session.value = null
  } finally {
    pending.value = false
  }
}

onMounted(loadSession)

function onFileChange(key: string, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  fileInputs.value = { ...fileInputs.value, [key]: file }
}

function formatExp(iso: string | null) {
  if (!iso) {
    return '—'
  }
  try {
    const loc = locale.value === 'en' ? 'en-GB' : 'ru-RU'
    return new Date(iso).toLocaleString(loc, {
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

async function submitUpload() {
  uploadError.value = null
  const fd = new FormData()
  let any = false
  for (const [key, file] of Object.entries(fileInputs.value)) {
    if (file) {
      fd.append(`documents[${key}]`, file)
      any = true
    }
  }
  if (!any) {
    uploadError.value = t('pages.upload.pickOne')
    return
  }
  uploading.value = true
  try {
    await api.applicationForms.uploadSupplementaryDocuments(token.value, fd)
    uploadDone.value = true
    await loadSession()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string; errors?: Record<string, string[]> } }
    uploadError.value =
      err?.data?.errors?.documents?.[0] ??
      err?.data?.message ??
      t('pages.upload.uploadErr')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="bg-mts-bg pt-20 pb-24">
    <div class="mx-auto max-w-7xl px-6">
      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="h-10 w-10 animate-spin text-mts-accent" />
      </div>

      <div v-else-if="loadError" class="border border-red-200 bg-red-50 p-6 text-center font-body text-red-800">
        {{ loadError }}
      </div>

      <div v-else-if="session" class="border border-mts-border bg-mts-surface p-8 shadow-tech">
        <h1 class="font-display text-2xl text-mts-text">{{ t('pages.upload.title') }}</h1>
        <p class="mt-2 font-body text-sm text-mts-text-secondary">
          {{ t('pages.upload.intro', { name: session.fullName }) }}
          <strong>{{ formatExp(session.expiresAt) }}</strong>
        </p>

        <div v-if="uploadDone" class="mt-4 flex items-start gap-2 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0" />
          <span>{{ t('pages.upload.successNote') }}</span>
        </div>

        <ul class="mt-8 space-y-6">
          <li v-for="doc in session.requestedDocuments" :key="doc.key" class="border-b border-mts-border pb-6 last:border-0">
            <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
              {{ doc.label }}
            </p>
            <div v-if="session.uploaded[doc.key]" class="mt-1 text-sm text-green-800">
              {{ t('pages.upload.uploadedLabel') }} {{ session.uploaded[doc.key]?.originalName }}
              ({{ formatExp(session.uploaded[doc.key]?.uploadedAt ?? null) }})
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
              class="mt-3 block w-full font-body text-sm file:mr-4 file:rounded file:border file:border-mts-border file:bg-mts-bg file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase"
              @change="onFileChange(doc.key, $event)"
            />
          </li>
        </ul>

        <p v-if="uploadError" class="mt-4 text-sm text-red-700">
          {{ uploadError }}
        </p>

        <button
          type="button"
          class="btn-primary mt-8 inline-flex items-center gap-2 disabled:opacity-50"
          :disabled="uploading"
          @click="submitUpload"
        >
          <Loader2 v-if="uploading" class="h-4 w-4 animate-spin" />
          {{ uploading ? t('pages.common.uploading') : t('pages.upload.submitFiles') }}
        </button>

        <p class="mt-8 font-body text-xs text-mts-text-muted">
          {{ t('pages.upload.formatsNote') }}
        </p>
      </div>
    </div>
  </div>
</template>
