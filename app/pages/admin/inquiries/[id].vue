<script setup lang="ts">
import 'flag-icons/css/flag-icons.min.css'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-vue-next'
import type { PageInquiry } from '~/types'

const BUILT_IN_VESSEL_TYPE_LABEL: Record<string, string> = {
  dry_cargo: 'Сухогруз',
  tanker: 'Танкер',
  container: 'Контейнеровоз',
  tug: 'Буксир',
  service: 'Служебное судно',
  other: 'Другое',
}
const BUILT_IN_REQUIRED_SERVICE_LABEL: Record<string, string> = {
  technical: 'Технический менеджмент (ремонт, докование, снабжение)',
  crewing: 'Крюинг (подбор и обучение экипажей)',
  audit: 'Аудит и сертификация (ISM, ISPS, MLC)',
  commercial: 'Коммерческий менеджмент (фрахтование, агенты)',
  insurance: 'Страхование (P&I, КАСКО)',
  other: 'Другое',
}

/** Убирает суффикс-временну́ю метку (_1746123456789) и делает текст читаемым. */
function humanizeId(id: string): string {
  return id
    .replace(/_[a-z0-9]{5,}$/i, '')   // strip timestamp / base36 suffix
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function vesselTypeLabel(id: string, labelsMap?: Record<string, string>): string {
  return labelsMap?.[id] ?? BUILT_IN_VESSEL_TYPE_LABEL[id] ?? humanizeId(id)
}
function requiredServiceLabel(id: string, labelsMap?: Record<string, string>): string {
  return labelsMap?.[id] ?? BUILT_IN_REQUIRED_SERVICE_LABEL[id] ?? humanizeId(id)
}

const SOURCE_PAGE_LABELS: Record<string, string> = {
  home: 'Главная',
  about: 'О компании',
  services: 'Судоремонт',
  'ship-repair': 'Судоремонт',
  'ship-management': 'Судовой менеджмент',
  'crewing-management': 'Крюинг-менеджмент',
  lnk: 'ЛНК',
  contacts: 'Контакты',
  gallery: 'Галерея',
  projects: 'Проекты',
  news: 'Новости',
  vacancies: 'Вакансии',
  request: 'Форма заявки',
}

function sourcePageLabel(page: string): string {
  return SOURCE_PAGE_LABELS[page] ?? page
}

const regionDisplayNames = new Intl.DisplayNames(['ru'], { type: 'region' })
function flagLabel(code: string): string {
  try {
    return regionDisplayNames.of(code) ?? code
  } catch {
    return code
  }
}

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

const item = ref<PageInquiry | null>(null)
const loading = ref(true)
const deleting = ref(false)

onMounted(async () => {
  if (!Number.isFinite(id.value) || id.value < 1) {
    await showAdminAlert({ message: 'Некорректная ссылка на заявку', variant: 'error' })
    await navigateTo('/admin/inquiries')
    loading.value = false
    return
  }
  try {
    item.value = await api.pageInquiries.getById(id.value)
  } catch (e: unknown) {
    const err = e as { statusCode?: number; status?: number; data?: { message?: string } }
    const msg =
      err?.statusCode === 403 || err?.status === 403
        ? 'Нет доступа к заявкам (нужно право «manage page inquiries»).'
        : err?.statusCode === 404 || err?.status === 404
          ? 'Заявка не найдена.'
          : err?.data?.message ?? 'Не удалось загрузить заявку.'
    await showAdminAlert({ message: msg, variant: 'error' })
    await navigateTo('/admin/inquiries')
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
    title: 'Удаление заявки',
    message: 'Удалить эту заявку? Её нельзя будет восстановить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  deleting.value = true
  try {
    await api.pageInquiries.delete(item.value.id)
    adminToast.success('Заявка удалена')
    await navigateTo('/admin/inquiries')
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить заявку', variant: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin/inquiries" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
              <ArrowLeft class="h-5 w-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Заявка</h1>
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

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
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
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Страница (источник)</dt>
            <dd class="mt-1 flex items-center gap-2 font-body text-mts-text">
              {{ sourcePageLabel(item.sourcePage) }}
              <span class="font-mono text-xs text-mts-text-secondary">({{ item.sourcePage }})</span>
            </dd>
          </div>
          <div>
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Имя</dt>
            <dd class="mt-1 font-body text-mts-text">{{ item.name }}</dd>
          </div>
          <div v-if="item.company">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Компания</dt>
            <dd class="mt-1 font-body text-mts-text">{{ item.company }}</dd>
          </div>
          <div v-if="item.position">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Должность</dt>
            <dd class="mt-1 font-body text-mts-text">{{ item.position }}</dd>
          </div>
          <div v-if="item.phone">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Телефон</dt>
            <dd class="mt-1">
              <a :href="`tel:${item.phone}`" class="font-mono text-sm text-mts-accent hover:underline">{{ item.phone }}</a>
            </dd>
          </div>
          <div>
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Email</dt>
            <dd class="mt-1">
              <a :href="`mailto:${item.email}`" class="font-mono text-sm text-mts-accent hover:underline">{{ item.email }}</a>
            </dd>
          </div>
          <div v-if="item.vesselTypes && item.vesselTypes.length > 0">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Тип судна</dt>
            <dd class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="t in item.vesselTypes"
                :key="t"
                class="inline-flex items-center border border-mts-border bg-mts-bg px-2.5 py-1 font-body text-sm text-mts-text"
              >
                {{ vesselTypeLabel(t, item.vesselTypeLabels) }}
              </span>
            </dd>
          </div>
          <div v-if="item.vesselsCount !== null && item.vesselsCount !== undefined">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Количество судов</dt>
            <dd class="mt-1 font-body text-mts-text">{{ item.vesselsCount }}</dd>
          </div>
          <div v-if="item.vesselFlag">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Флаг судна</dt>
            <dd class="mt-1 flex items-center gap-2.5 font-body text-mts-text">
              <span
                :class="`fi fi-${item.vesselFlag.toLowerCase()}`"
                class="inline-block h-4 w-6 rounded-[2px] bg-cover bg-center shadow-sm"
                aria-hidden="true"
              />
              <span>{{ flagLabel(item.vesselFlag) }}</span>
              <span class="font-mono text-xs text-mts-text-secondary">({{ item.vesselFlag }})</span>
            </dd>
          </div>
          <div v-if="item.mainPorts">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Основные порты захода</dt>
            <dd class="mt-1 whitespace-pre-wrap font-body text-mts-text">{{ item.mainPorts }}</dd>
          </div>
          <div v-if="item.requiredServices && item.requiredServices.length > 0">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Требуемые услуги</dt>
            <dd class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="s in item.requiredServices"
                :key="s"
                class="inline-flex items-center border border-mts-border bg-mts-bg px-2.5 py-1 font-body text-sm text-mts-text"
              >
                {{ requiredServiceLabel(s, item.requiredServiceLabels) }}
              </span>
            </dd>
          </div>
          <div v-if="item.message">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Особые требования / комментарии</dt>
            <dd class="mt-1 whitespace-pre-wrap font-body leading-relaxed text-mts-text">{{ item.message }}</dd>
          </div>
          <div v-if="item.ip">
            <dt class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">IP</dt>
            <dd class="mt-1 font-mono text-xs text-mts-text-secondary">{{ item.ip }}</dd>
          </div>
        </dl>
      </div>
    </main>
  </div>
</template>
