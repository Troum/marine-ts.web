<script setup lang="ts">
import { ArrowLeft, Loader2, Trash2 } from 'lucide-vue-next'
import type { FeedbackMessage } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const api = useMarineApi()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const id = computed(() => Number(route.params.id))

const item = ref<FeedbackMessage | null>(null)
const loading = ref(true)
const deleting = ref(false)

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
        </dl>
      </div>
    </main>
  </div>
</template>
