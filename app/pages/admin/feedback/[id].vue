<script setup lang="ts">
import { ArrowLeft, Loader2, Paperclip, Send, Trash2, X } from 'lucide-vue-next'
import type { FeedbackMessage } from '~/types'
import { useConfirm } from '~/composables/useConfirmAction'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const api = useMarineApi()
const { confirm } = useConfirm()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const id = computed(() => Number(route.params.id))

const item = ref<FeedbackMessage | null>(null)
const loading = ref(true)
const deleting = ref(false)

const replyBody = ref('')
const replyFiles = ref<File[]>([])
const fileInputKey = ref(0)
const replying = ref(false)

onMounted(async () => {
  if (!Number.isFinite(id.value) || id.value < 1) {
    await showAdminAlert({ message: 'Некорректная ссылка на сообщение', variant: 'error' })
    await navigateTo('/admin/feedback')
    loading.value = false
    return
  }
  try {
    item.value = await api.feedback.getById(id.value)
  } catch (e: unknown) {
    const err = e as { statusCode?: number; status?: number; data?: { message?: string } }
    const msg =
      err?.statusCode === 403 || err?.status === 403
        ? 'Нет доступа к этому сообщению (нужно право «manage feedback»).'
        : err?.statusCode === 404 || err?.status === 404
          ? 'Сообщение не найдено.'
          : err?.data?.message ?? 'Не удалось загрузить сообщение.'
    await showAdminAlert({ message: msg, variant: 'error' })
    await navigateTo('/admin/feedback')
  } finally {
    loading.value = false
  }
})

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

function onReplyFilesChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const list = input.files ? Array.from(input.files) : []
  const next = [...replyFiles.value]
  for (const f of list) {
    if (next.length >= 5) {
      break
    }
    next.push(f)
  }
  replyFiles.value = next
  input.value = ''
}

async function removeReplyFile(index: number) {
  const ok = await confirm({
    message: 'Убрать этот файл из вложений к ответу?',
    confirmLabel: 'Убрать',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  replyFiles.value = replyFiles.value.filter((_, i) => i !== index)
}

function formatReplyError(e: unknown): string {
  const err = e as { data?: { message?: string; errors?: Record<string, string[]> } }
  const errors = err?.data?.errors
  if (errors) {
    const first = Object.values(errors).flat()[0]
    if (first) {
      return first
    }
  }
  return err?.data?.message ?? 'Не удалось отправить ответ.'
}

async function handleSendReply() {
  if (!item.value) {
    return
  }
  const body = replyBody.value.trim()
  if (!body) {
    await showAdminAlert({ message: 'Введите текст ответа.', variant: 'error' })
    return
  }
  replying.value = true
  try {
    const updated = await api.feedback.reply(item.value.id, body, replyFiles.value)
    item.value = updated
    replyBody.value = ''
    replyFiles.value = []
    fileInputKey.value += 1
    adminToast.success('Ответ отправлен на ' + updated.email)
  } catch (e: unknown) {
    await showAdminAlert({ message: formatReplyError(e), variant: 'error' })
  } finally {
    replying.value = false
  }
}

async function handleDelete() {
  if (!item.value) {
    return
  }
  const ok = await confirm({
    title: 'Удаление сообщения',
    message: 'Удалить это сообщение? Его нельзя будет восстановить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  deleting.value = true
  try {
    await api.feedback.delete(item.value.id)
    adminToast.success('Сообщение удалено')
    await navigateTo('/admin/feedback')
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить сообщение', variant: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-4xl px-6 lg:px-12">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin/feedback" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
              <ArrowLeft class="h-5 w-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Сообщение</h1>
          </div>
          <button
            v-if="item"
            type="button"
            :disabled="deleting"
            class="btn-secondary border-red-200 text-red-700 hover:border-red-400 hover:text-red-800"
            @click="handleDelete"
          >
            <Trash2 class="h-4 w-4" />
            Удалить
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <div v-else-if="item" class="card-tech border border-mts-border p-8">
        <dl class="space-y-6">
          <div>
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Получено</dt>
            <dd class="mt-1 font-body text-mts-text">{{ formatDate(item.createdAt) }}</dd>
          </div>
          <div>
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Имя</dt>
            <dd class="mt-1 font-body text-mts-text">{{ item.name }}</dd>
          </div>
          <div>
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Email</dt>
            <dd class="mt-1">
              <a :href="`mailto:${item.email}`" class="font-mono text-sm text-mts-accent hover:underline">{{
                item.email
              }}</a>
            </dd>
          </div>
          <div v-if="item.phone">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Телефон</dt>
            <dd class="mt-1 font-body text-mts-text">{{ item.phone }}</dd>
          </div>
          <div v-if="item.ip">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">IP</dt>
            <dd class="mt-1 font-mono text-xs text-mts-text-secondary">{{ item.ip }}</dd>
          </div>
          <div>
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Сообщение</dt>
            <dd class="mt-1 whitespace-pre-wrap font-body leading-relaxed text-mts-text">{{ item.message }}</dd>
          </div>
          <div v-if="item.repliedAt">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Ответ отправлен</dt>
            <dd class="mt-1 font-body text-mts-text">{{ formatDate(item.repliedAt) }}</dd>
          </div>
        </dl>

        <div class="mt-10 border-t border-mts-border pt-8">
          <h2 class="font-display text-lg text-mts-text">Ответить по email</h2>
          <p class="mt-2 text-sm leading-relaxed text-mts-text-secondary">
            Письмо уйдёт на
            <a :href="`mailto:${item.email}`" class="text-mts-accent hover:underline">{{ item.email }}</a>
            с вашего адреса в поле «Ответить». При необходимости приложите до 5 файлов (каждый до 10 МБ): PDF, Office, изображения,
            ZIP.
          </p>
          <div class="mt-4 space-y-4">
            <div>
              <label for="feedback-reply-body" class="sr-only">Текст ответа</label>
              <div id="feedback-reply-body" :class="{ 'pointer-events-none opacity-60': replying }">
                <AdminThemedTextField v-model="replyBody" placeholder="Текст ответа клиенту…" :compact="true" />
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <label
                class="inline-flex cursor-pointer items-center gap-2 rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50"
              >
                <Paperclip class="h-4 w-4" />
                Прикрепить файлы
                <input
                  :key="fileInputKey"
                  type="file"
                  class="hidden"
                  multiple
                  :disabled="replying || replyFiles.length >= 5"
                  @change="onReplyFilesChange"
                />
              </label>
              <span class="text-xs text-mts-text-secondary">{{ replyFiles.length }} / 5</span>
            </div>
            <ul v-if="replyFiles.length" class="space-y-1 rounded border border-mts-border bg-mts-bg-muted/30 p-3 text-sm">
              <li
                v-for="(f, i) in replyFiles"
                :key="i + f.name + f.size"
                class="flex items-center justify-between gap-2"
              >
                <span class="min-w-0 truncate font-mono text-xs text-mts-text">{{ f.name }}</span>
                <button
                  type="button"
                  class="shrink-0 rounded p-1 text-mts-text-secondary hover:bg-red-50 hover:text-red-700"
                  :disabled="replying"
                  title="Убрать"
                  @click="removeReplyFile(i)"
                >
                  <X class="h-4 w-4" />
                </button>
              </li>
            </ul>
            <div class="flex justify-end">
              <button
                type="button"
                class="btn-primary inline-flex items-center gap-2"
                :disabled="replying || !replyBody.trim()"
                @click="handleSendReply"
              >
                <Loader2 v-if="replying" class="h-4 w-4 animate-spin" />
                <Send v-else class="h-4 w-4" />
                {{ replying ? 'Отправка…' : 'Отправить ответ' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
