<script setup lang="ts">
import {
  ArrowLeft, Loader2, Plus, Trash2, Upload, ExternalLink, ChevronDown,
  Wrench, Ship, Users, Layers, ShieldCheck, Leaf, Target,
  Anchor, Settings, Award, Compass, Gauge, Truck, Globe, Zap, Hammer, HeartPulse, Factory,
} from 'lucide-vue-next'
import type { AboutPageData, ContentPage, MarineContentLocale } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import { defaultAboutData, syncStructuralFields } from '~/utils/aboutPageDefaults'

const ICON_OPTIONS = [
  { value: 'Wrench', label: 'Ключ', icon: Wrench },
  { value: 'Ship', label: 'Корабль', icon: Ship },
  { value: 'Users', label: 'Команда', icon: Users },
  { value: 'Layers', label: 'Слои', icon: Layers },
  { value: 'ShieldCheck', label: 'Щит', icon: ShieldCheck },
  { value: 'Leaf', label: 'Лист', icon: Leaf },
  { value: 'Target', label: 'Цель', icon: Target },
  { value: 'Anchor', label: 'Якорь', icon: Anchor },
  { value: 'Settings', label: 'Шестерёнка', icon: Settings },
  { value: 'Award', label: 'Награда', icon: Award },
  { value: 'Compass', label: 'Компас', icon: Compass },
  { value: 'Gauge', label: 'Манометр', icon: Gauge },
  { value: 'Truck', label: 'Транспорт', icon: Truck },
  { value: 'Globe', label: 'Глобус', icon: Globe },
  { value: 'Zap', label: 'Молния', icon: Zap },
  { value: 'Hammer', label: 'Молоток', icon: Hammer },
  { value: 'HeartPulse', label: 'Пульс', icon: HeartPulse },
  { value: 'Factory', label: 'Завод', icon: Factory },
]

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

const data = ref<Record<MarineContentLocale, AboutPageData>>({
  ru: defaultAboutData('ru'),
  en: defaultAboutData('en'),
})

const d = computed(() => data.value[localeTab.value])

const collapsed = ref<Record<string, boolean>>({
  hero: false,
  ecosystem: true,
  mission: true,
  why: true,
  geography: true,
  certificates: true,
})

function toggle(section: string) {
  collapsed.value[section] = !collapsed.value[section]
}

onMounted(async () => {
  try {
    const page = await api.contentPages.getPublicBySlug('about')
    if (page) {
      existingId.value = page.id
      const managed = await api.contentPages.getManageById(page.id)
      for (const loc of MARINE_CONTENT_LOCALES) {
        const body = managed.translations?.[loc]?.body
        if (body) {
          try {
            const parsed = JSON.parse(body)
            if (parsed?.hero) {
              data.value[loc] = { ...defaultAboutData(loc), ...parsed }
            }
          } catch { /* not JSON, keep defaults */ }
        }
      }
    }
  } catch {
    // No existing page — use defaults
  } finally {
    loading.value = false
  }
})

// --- list operations ---
function addService() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].ecosystem.services.push({ icon: 'Wrench', title: '', text: '' })
  }
}
function removeService(i: number) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].ecosystem.services.splice(i, 1)
  }
}
function addPrinciple() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].mission.principles.push({ icon: 'ShieldCheck', text: '' })
  }
}
function removePrinciple(i: number) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].mission.principles.splice(i, 1)
  }
}
function addLocation() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].geography.locations.push({ x: 50, y: 50, labelOnRight: true, name: '' })
  }
}
function removeLocation(i: number) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].geography.locations.splice(i, 1)
  }
}
function addCertificate() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].certificates.items.push({ name: '', desc: '', fileUrl: '' })
  }
}
function removeCertificate(i: number) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].certificates.items.splice(i, 1)
  }
}

// --- file upload for certificates ---
const uploadingIdx = ref<number | null>(null)

async function uploadCertFile(idx: number) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.jpg,.jpeg,.png,.webp'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    uploadingIdx.value = idx
    try {
      const res = await api.media.upload(file)
      for (const loc of MARINE_CONTENT_LOCALES) {
        if (data.value[loc].certificates.items[idx]) {
          data.value[loc].certificates.items[idx].fileUrl = res.url
        }
      }
      adminToast.success('Файл загружен')
    } catch {
      await showAdminAlert({ message: 'Не удалось загрузить файл', variant: 'error' })
    } finally {
      uploadingIdx.value = null
    }
  }
  input.click()
}

// --- save ---
async function submit() {
  syncStructuralFields(data.value, localeTab.value)

  saving.value = true
  try {
    const translations = {} as Record<MarineContentLocale, { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }>
    for (const loc of MARINE_CONTENT_LOCALES) {
      translations[loc] = {
        title: loc === 'ru' ? 'О компании' : 'About us',
        excerpt: '',
        body: JSON.stringify(data.value[loc]),
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
      }
    }

    if (existingId.value) {
      await api.contentPages.update(existingId.value, {
        slug: 'about',
        isPublished: true,
        translations,
      })
    } else {
      const created = await api.contentPages.create({
        slug: 'about',
        isPublished: true,
        sortOrder: 0,
        translations,
      })
      existingId.value = (created as ContentPage).id
    }
    adminToast.success('Раздел «О компании» сохранён')
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
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Раздел «О компании»</h1>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/about" target="_blank" class="font-body text-sm text-mts-text-secondary hover:text-mts-accent transition-colors">
              Открыть на сайте ↗
            </NuxtLink>
            <button type="button" :disabled="saving || loading" class="btn-primary px-6 disabled:opacity-50" @click="submit">
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>

      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <!-- HERO -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('hero')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">1. Начальное описание (Hero)</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.hero }" />
          </button>
          <div v-show="!collapsed.hero" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div class="grid md:grid-cols-3 gap-4">
              <div>
                <label :class="sectionLabel">Заголовок (начало)</label>
                <input v-model="d.hero.title" :class="sectionInput" />
              </div>
              <div>
                <label :class="sectionLabel">Акцент (цветной)</label>
                <input v-model="d.hero.titleAccent" :class="sectionInput" />
              </div>
              <div>
                <label :class="sectionLabel">Окончание</label>
                <input v-model="d.hero.titleEnd" :class="sectionInput" />
              </div>
            </div>
            <div>
              <label :class="sectionLabel">Подзаголовок</label>
              <input v-model="d.hero.subtitle" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 1</label>
              <textarea v-model="d.hero.lead" rows="3" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 2 (выделенный)</label>
              <textarea v-model="d.hero.lead2" rows="3" :class="sectionInput" />
            </div>
          </div>
        </section>

        <!-- ECOSYSTEM -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('ecosystem')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">2. Экосистема сервисов</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.ecosystem }" />
          </button>
          <div v-show="!collapsed.ecosystem" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <input v-model="d.ecosystem.title" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Вводный текст</label>
              <textarea v-model="d.ecosystem.lead" rows="2" :class="sectionInput" />
            </div>
            <div class="space-y-4">
              <div v-for="(svc, i) in d.ecosystem.services" :key="i" class="border border-mts-border p-4 bg-mts-bg/50 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Услуга {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeService(i)">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div class="grid md:grid-cols-[12rem_1fr] gap-3">
                  <div>
                    <label :class="sectionLabel">Иконка</label>
                    <AdminSelect v-model="svc.icon" :options="ICON_OPTIONS" />
                  </div>
                  <div>
                    <label :class="sectionLabel">Название</label>
                    <input v-model="svc.title" :class="sectionInput" />
                  </div>
                </div>
                <div>
                  <label :class="sectionLabel">Описание</label>
                  <textarea v-model="svc.text" rows="2" :class="sectionInput" />
                </div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addService">
                <Plus class="w-4 h-4" /> Добавить услугу
              </button>
            </div>
          </div>
        </section>

        <!-- MISSION -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('mission')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">3. Миссия и Цели</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.mission }" />
          </button>
          <div v-show="!collapsed.mission" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <input v-model="d.mission.title" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Вводный текст</label>
              <textarea v-model="d.mission.lead" rows="2" :class="sectionInput" />
            </div>
            <div class="space-y-3">
              <div v-for="(p, i) in d.mission.principles" :key="i" class="border border-mts-border p-4 bg-mts-bg/50 flex items-start gap-4">
                <div class="w-44 shrink-0">
                  <label :class="sectionLabel">Иконка</label>
                  <AdminSelect v-model="p.icon" :options="ICON_OPTIONS" />
                </div>
                <div class="flex-1">
                  <label :class="sectionLabel">Текст принципа</label>
                  <textarea v-model="p.text" rows="2" :class="sectionInput" />
                </div>
                <button type="button" class="mt-6 text-mts-text-secondary hover:text-red-500 transition-colors" @click="removePrinciple(i)">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addPrinciple">
                <Plus class="w-4 h-4" /> Добавить принцип
              </button>
            </div>
          </div>
        </section>

        <!-- WHY MTS -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('why')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">4. Почему выбирают MTS?</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.why }" />
          </button>
          <div v-show="!collapsed.why" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <input v-model="d.why.title" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Текст</label>
              <textarea v-model="d.why.text" rows="4" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Текст кнопки CTA</label>
              <input v-model="d.why.ctaText" :class="sectionInput" />
            </div>
          </div>
        </section>

        <!-- GEOGRAPHY -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('geography')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">5. География обслуживания</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.geography }" />
          </button>
          <div v-show="!collapsed.geography" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div class="grid md:grid-cols-3 gap-4">
              <div>
                <label :class="sectionLabel">Метка</label>
                <input v-model="d.geography.label" :class="sectionInput" />
              </div>
              <div class="md:col-span-2">
                <label :class="sectionLabel">Заголовок</label>
                <input v-model="d.geography.title" :class="sectionInput" />
              </div>
            </div>
            <div>
              <label :class="sectionLabel">Описание</label>
              <textarea v-model="d.geography.lead" rows="2" :class="sectionInput" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">
              Координаты X и Y — проценты на карте мира (950×620). Изменяйте их для перемещения точек.
            </p>
            <div class="overflow-x-auto border border-mts-border">
              <table class="w-full min-w-[600px] text-left text-sm">
                <thead class="bg-mts-bg font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  <tr>
                    <th class="px-3 py-2">Название</th>
                    <th class="px-3 py-2 w-24">X (%)</th>
                    <th class="px-3 py-2 w-24">Y (%)</th>
                    <th class="px-3 py-2 w-28">Подпись справа</th>
                    <th class="px-3 py-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(loc, i) in d.geography.locations" :key="i" class="border-t border-mts-border">
                    <td class="px-3 py-1.5">
                      <input v-model="loc.name" class="w-full bg-transparent border-b border-mts-border px-1 py-1 font-body text-sm focus:outline-none focus:border-mts-accent" />
                    </td>
                    <td class="px-3 py-1.5">
                      <input v-model.number="loc.x" type="number" step="0.1" class="w-full bg-transparent border-b border-mts-border px-1 py-1 font-mono text-sm focus:outline-none focus:border-mts-accent" />
                    </td>
                    <td class="px-3 py-1.5">
                      <input v-model.number="loc.y" type="number" step="0.1" class="w-full bg-transparent border-b border-mts-border px-1 py-1 font-mono text-sm focus:outline-none focus:border-mts-accent" />
                    </td>
                    <td class="px-3 py-1.5 text-center">
                      <input v-model="loc.labelOnRight" type="checkbox" class="mts-checkbox" />
                    </td>
                    <td class="px-3 py-1.5 text-center">
                      <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeLocation(i)">
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addLocation">
              <Plus class="w-4 h-4" /> Добавить локацию
            </button>
          </div>
        </section>

        <!-- CERTIFICATES -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('certificates')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">6. Сертификаты</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.certificates }" />
          </button>
          <div v-show="!collapsed.certificates" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <input v-model="d.certificates.title" :class="sectionInput" />
            </div>
            <div class="space-y-3">
              <div v-for="(cert, i) in d.certificates.items" :key="i" class="border border-mts-border p-4 bg-mts-bg/50 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Сертификат {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeCertificate(i)">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div class="grid md:grid-cols-2 gap-3">
                  <div>
                    <label :class="sectionLabel">Название</label>
                    <input v-model="cert.name" :class="sectionInput" />
                  </div>
                  <div>
                    <label :class="sectionLabel">Описание</label>
                    <input v-model="cert.desc" :class="sectionInput" />
                  </div>
                </div>
                <div>
                  <label :class="sectionLabel">Файл сертификата</label>
                  <div class="flex items-center gap-3">
                    <input v-model="cert.fileUrl" placeholder="URL файла" :class="[sectionInput, 'flex-1']" />
                    <button
                      type="button"
                      :disabled="uploadingIdx === i"
                      class="flex items-center gap-2 shrink-0 border border-mts-border px-4 py-3 font-mono text-xs uppercase text-mts-text-secondary hover:text-mts-accent hover:border-mts-accent transition-colors disabled:opacity-50"
                      @click="uploadCertFile(i)"
                    >
                      <Loader2 v-if="uploadingIdx === i" class="w-4 h-4 animate-spin" />
                      <Upload v-else class="w-4 h-4" />
                      Загрузить
                    </button>
                    <a
                      v-if="cert.fileUrl"
                      :href="cert.fileUrl"
                      target="_blank"
                      class="flex items-center shrink-0 text-mts-accent hover:underline"
                      title="Открыть файл"
                    >
                      <ExternalLink class="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addCertificate">
                <Plus class="w-4 h-4" /> Добавить сертификат
              </button>
            </div>
          </div>
        </section>

        <!-- Save button (bottom) -->
        <div class="flex justify-end">
          <button type="button" :disabled="saving" class="btn-primary px-8 disabled:opacity-50" @click="submit">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
