<script setup lang="ts">
import { ArrowLeft, Eye, EyeOff, Loader2, Save } from 'lucide-vue-next'
import type { SiteSectionKey } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const adminToast = useAdminToast()
const { show: showAdminAlert } = useAdminAlert()

interface SectionDef {
  key: SiteSectionKey
  label: string
  desc: string
  path: string
}

const SECTIONS: SectionDef[] = [
  { key: 'about', label: 'О компании', desc: 'Страница /about — история, миссия, география', path: '/about' },
  { key: 'services', label: 'Судоремонт', desc: 'Каталог сервисов /ship-repair и дочерние страницы', path: '/ship-repair' },
  { key: 'ship_management', label: 'Судовой менеджмент', desc: 'Страница /ship-management и подразделы', path: '/ship-management' },
  { key: 'crewing_management', label: 'Крюинг-менеджмент', desc: 'Страница /crewing-management и подразделы', path: '/crewing-management' },
  { key: 'lnk', label: 'ЛНК', desc: 'Страница /lnk и подразделы', path: '/lnk' },
  { key: 'contacts', label: 'Контакты', desc: 'Страница /contacts — офисы и форма обратной связи', path: '/contacts' },
  { key: 'gallery', label: 'Галерея', desc: 'Страница /gallery — фотографии', path: '/gallery' },
  { key: 'projects', label: 'Проекты', desc: 'Список /projects и страницы отдельных проектов', path: '/projects' },
  { key: 'news', label: 'Новости', desc: 'Лента /news и страницы отдельных новостей', path: '/news' },
  { key: 'vacancies', label: 'Вакансии', desc: 'Страница /vacancies, вакансии и анкеты', path: '/vacancies' },
]

const loading = ref(true)
const saving = ref(false)
const hidden = ref<Partial<Record<SiteSectionKey, boolean>>>({})
let savedTheme = 'default'

onMounted(async () => {
  try {
    const settings = await api.appearanceSettings.get()
    hidden.value = { ...settings.hiddenSections }
    savedTheme = settings.theme
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить настройки разделов', variant: 'error' })
  } finally {
    loading.value = false
  }
})

function toggle(key: SiteSectionKey) {
  hidden.value = { ...hidden.value, [key]: !hidden.value[key] }
}

async function save() {
  saving.value = true
  try {
    await api.appearanceSettings.update({
      theme: savedTheme as 'default' | 'scglobal',
      hiddenSections: hidden.value,
    })
    adminToast.success('Видимость разделов сохранена')
    await refreshNuxtData('site-appearance')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить настройки', variant: 'error' })
  } finally {
    saving.value = false
  }
}

const hiddenCount = computed(() => Object.values(hidden.value).filter(Boolean).length)
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
              <ArrowLeft class="h-5 w-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Разделы сайта</h1>
            <span v-if="hiddenCount > 0" class="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] text-amber-700">
              {{ hiddenCount }} скрыт{{ hiddenCount === 1 ? '' : hiddenCount < 5 ? 'о' : 'о' }}
            </span>
          </div>
          <button
            type="button"
            :disabled="saving"
            class="btn-primary inline-flex items-center gap-2"
            @click="save"
          >
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
            <Save v-else class="h-4 w-4" />
            Сохранить
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>

      <template v-else>
        <p class="mb-6 font-body text-sm text-mts-text-secondary">
          Скрытые разделы недоступны для посетителей сайта — вместо страницы показывается 404.
          Ссылки в навигации на скрытые разделы рекомендуется убрать вручную в настройках меню.
        </p>

        <div class="space-y-3">
          <div
            v-for="section in SECTIONS"
            :key="section.key"
            class="flex items-center justify-between gap-4 border border-mts-border bg-white px-5 py-4 transition-colors"
            :class="hidden[section.key] ? 'border-amber-200 bg-amber-50/40' : ''"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-body text-base text-mts-text">{{ section.label }}</p>
                <span class="font-mono text-[11px] text-mts-text-secondary">{{ section.path }}</span>
                <span
                  v-if="hidden[section.key]"
                  class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] text-amber-700"
                >
                  <EyeOff class="h-3 w-3" /> скрыт
                </span>
              </div>
              <p class="mt-0.5 font-body text-sm text-mts-text-secondary">{{ section.desc }}</p>
            </div>

            <button
              type="button"
              class="shrink-0 inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs uppercase transition-colors"
              :class="hidden[section.key]
                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400'
                : 'border-mts-border text-mts-text-secondary hover:border-mts-accent hover:text-mts-accent'"
              @click="toggle(section.key)"
            >
              <EyeOff v-if="hidden[section.key]" class="h-3.5 w-3.5" />
              <Eye v-else class="h-3.5 w-3.5" />
              {{ hidden[section.key] ? 'Показать' : 'Скрыть' }}
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
