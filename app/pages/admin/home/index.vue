<script setup lang="ts">
import {
  ArrowLeft, Loader2, Plus, Trash2, ChevronDown, Upload,
  Ship, MapPin, Users, Calendar,
} from 'lucide-vue-next'
import type { HomePageData, ContentPage, MarineContentLocale } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import { defaultHomeData, syncHomeStructuralFields } from '~/utils/pageDefaults'

const STAT_ICON_OPTIONS = [
  { value: 'Ship', label: 'Корабль', icon: Ship },
  { value: 'MapPin', label: 'Локация', icon: MapPin },
  { value: 'Users', label: 'Команда', icon: Users },
  { value: 'Calendar', label: 'Календарь', icon: Calendar },
]

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

const data = ref<Record<MarineContentLocale, HomePageData>>({
  ru: defaultHomeData('ru'),
  en: defaultHomeData('en'),
})

const d = computed(() => data.value[localeTab.value])

const collapsed = ref<Record<string, boolean>>({
  hero: false,
  stats: true,
  about: true,
  services: true,
  process: true,
  cta: true,
})

function toggle(s: string) { collapsed.value[s] = !collapsed.value[s] }

onMounted(async () => {
  try {
    const page = await api.contentPages.getPublicBySlug('home')
    if (page) {
      existingId.value = page.id
      const managed = await api.contentPages.getManageById(page.id)
      for (const loc of MARINE_CONTENT_LOCALES) {
        const body = managed.translations?.[loc]?.body
        if (body) {
          try {
            const parsed = JSON.parse(body)
            if (parsed?.hero) data.value[loc] = { ...defaultHomeData(loc), ...parsed }
          } catch { /* keep defaults */ }
        }
      }
    }
  } catch { /* no existing page */ }
  finally { loading.value = false }
})

function addStat() {
  for (const loc of MARINE_CONTENT_LOCALES)
    data.value[loc].statsCard.items.push({ icon: 'Ship', value: '', label: '' })
}
function removeStat(i: number) {
  for (const loc of MARINE_CONTENT_LOCALES) data.value[loc].statsCard.items.splice(i, 1)
}
function addServiceCard() {
  for (const loc of MARINE_CONTENT_LOCALES)
    data.value[loc].services.cards.push({ image: '', title: '', description: '' })
}
function removeServiceCard(i: number) {
  for (const loc of MARINE_CONTENT_LOCALES) data.value[loc].services.cards.splice(i, 1)
}

const uploadingCardIdx = ref<number | null>(null)
async function uploadCardImage(idx: number) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.jpg,.jpeg,.png,.webp'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    uploadingCardIdx.value = idx
    try {
      const res = await api.media.upload(file)
      for (const loc of MARINE_CONTENT_LOCALES) {
        if (data.value[loc].services.cards[idx]) {
          data.value[loc].services.cards[idx].image = res.url
        }
      }
      adminToast.success('Изображение загружено')
    } catch {
      await showAdminAlert({ message: 'Не удалось загрузить изображение', variant: 'error' })
    } finally {
      uploadingCardIdx.value = null
    }
  }
  input.click()
}

function addStep() {
  for (const loc of MARINE_CONTENT_LOCALES)
    data.value[loc].process.steps.push({ title: '', text: '' })
}
function removeStep(i: number) {
  for (const loc of MARINE_CONTENT_LOCALES) data.value[loc].process.steps.splice(i, 1)
}

async function submit() {
  syncHomeStructuralFields(data.value, localeTab.value)
  saving.value = true
  try {
    const translations = {} as Record<MarineContentLocale, { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }>
    for (const loc of MARINE_CONTENT_LOCALES) {
      translations[loc] = {
        title: loc === 'ru' ? 'Главная' : 'Home',
        excerpt: '', body: JSON.stringify(data.value[loc]),
        seoTitle: '', seoDescription: '', seoKeywords: '',
      }
    }
    if (existingId.value) {
      await api.contentPages.update(existingId.value, { slug: 'home', isPublished: true, translations })
    } else {
      const created = await api.contentPages.create({ slug: 'home', isPublished: true, sortOrder: 0, translations })
      existingId.value = (created as ContentPage).id
    }
    adminToast.success('Главная страница сохранена')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally { saving.value = false }
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
            <NuxtLink to="/admin" class="text-mts-text-secondary hover:text-mts-accent transition-colors"><ArrowLeft class="w-5 h-5" /></NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Главная страница</h1>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/" target="_blank" class="font-body text-sm text-mts-text-secondary hover:text-mts-accent transition-colors">Открыть на сайте ↗</NuxtLink>
            <button type="button" :disabled="saving || loading" class="btn-primary px-6 disabled:opacity-50" @click="submit">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24"><Loader2 class="w-8 h-8 text-mts-accent animate-spin" /></div>

      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <!-- 1. HERO -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('hero')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">1. Hero-блок</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.hero }" />
          </button>
          <div v-show="!collapsed.hero" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div>
              <label :class="sectionLabel">Метка (label)</label>
              <input v-model="d.hero.label" :class="sectionInput" />
            </div>
            <div class="grid md:grid-cols-3 gap-4">
              <div><label :class="sectionLabel">Заголовок (строка 1)</label><input v-model="d.hero.titleLine1" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Акцент (цветной)</label><input v-model="d.hero.titleAccent" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Суффикс</label><input v-model="d.hero.titleSuffix" :class="sectionInput" /></div>
            </div>
            <div><label :class="sectionLabel">Описание (lead)</label><textarea v-model="d.hero.lead" rows="3" :class="sectionInput" /></div>
            <div class="grid md:grid-cols-2 gap-4">
              <div><label :class="sectionLabel">CTA «Консультация»</label><input v-model="d.hero.ctaConsult" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">CTA «Услуги»</label><input v-model="d.hero.ctaServices" :class="sectionInput" /></div>
            </div>
            <div class="grid md:grid-cols-3 gap-4">
              <div><label :class="sectionLabel">Бейдж ISO</label><input v-model="d.hero.badgeIso" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Бейдж IACS</label><input v-model="d.hero.badgeIacs" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Бейдж «Лет опыта»</label><input v-model="d.hero.badgeYears" :class="sectionInput" /></div>
            </div>
            <div><label :class="sectionLabel">Текст «Листайте»</label><input v-model="d.hero.scroll" :class="sectionInput" /></div>
          </div>
        </section>

        <!-- 2. STATS -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('stats')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">2. Статистика</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.stats }" />
          </button>
          <div v-show="!collapsed.stats" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Заголовок карточки</label><input v-model="d.statsCard.label" :class="sectionInput" /></div>
            <div class="space-y-3">
              <div v-for="(item, i) in d.statsCard.items" :key="i" class="border border-mts-border p-4 bg-mts-bg/50">
                <div class="flex items-center justify-between mb-3">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Показатель {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeStat(i)"><Trash2 class="w-4 h-4" /></button>
                </div>
                <div class="grid md:grid-cols-3 gap-3">
                  <div><label :class="sectionLabel">Иконка</label><AdminSelect v-model="item.icon" :options="STAT_ICON_OPTIONS" /></div>
                  <div><label :class="sectionLabel">Значение</label><input v-model="item.value" :class="sectionInput" /></div>
                  <div><label :class="sectionLabel">Подпись</label><input v-model="item.label" :class="sectionInput" /></div>
                </div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addStat"><Plus class="w-4 h-4" /> Добавить показатель</button>
            </div>
          </div>
        </section>

        <!-- 3. ABOUT PREVIEW -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('about')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">3. Превью «О компании»</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.about }" />
          </button>
          <div v-show="!collapsed.about" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Метка</label><input v-model="d.about.label" :class="sectionInput" /></div>
            <div class="grid md:grid-cols-3 gap-4">
              <div><label :class="sectionLabel">Заголовок</label><input v-model="d.about.title" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Акцент</label><input v-model="d.about.titleAccent" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Окончание</label><input v-model="d.about.titleEnd" :class="sectionInput" /></div>
            </div>
            <div><label :class="sectionLabel">Текст</label><textarea v-model="d.about.text" rows="4" :class="sectionInput" /></div>
            <div><label :class="sectionLabel">Текст кнопки «Подробнее»</label><input v-model="d.about.more" :class="sectionInput" /></div>
          </div>
        </section>

        <!-- 4. SERVICES PREVIEW -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('services')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">4. Превью услуг</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.services }" />
          </button>
          <div v-show="!collapsed.services" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Метка</label><input v-model="d.services.label" :class="sectionInput" /></div>
            <div class="grid md:grid-cols-3 gap-4">
              <div><label :class="sectionLabel">Заголовок</label><input v-model="d.services.heading" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Акцент</label><input v-model="d.services.headingAccent" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Окончание</label><input v-model="d.services.headingEnd" :class="sectionInput" /></div>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div><label :class="sectionLabel">Текст «Все услуги»</label><input v-model="d.services.all" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Текст «Подробнее →»</label><input v-model="d.services.more" :class="sectionInput" /></div>
            </div>
            <div class="space-y-4">
              <div v-for="(card, i) in d.services.cards" :key="i" class="border border-mts-border p-4 bg-mts-bg/50 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Карточка {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeServiceCard(i)"><Trash2 class="w-4 h-4" /></button>
                </div>
                <div><label :class="sectionLabel">URL изображения</label><input v-model="card.image" :class="sectionInput" placeholder="/images/services/hull.jpg" /></div>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    :disabled="uploadingCardIdx === i"
                    class="flex items-center gap-2 shrink-0 border border-mts-border px-4 py-3 font-mono text-xs uppercase text-mts-text-secondary hover:text-mts-accent hover:border-mts-accent transition-colors disabled:opacity-50"
                    @click="uploadCardImage(i)"
                  >
                    <Loader2 v-if="uploadingCardIdx === i" class="w-4 h-4 animate-spin" />
                    <Upload v-else class="w-4 h-4" />
                    Загрузить
                  </button>
                  <img
                    v-if="card.image"
                    :src="card.image"
                    alt=""
                    class="h-12 w-20 object-cover border border-mts-border"
                  />
                </div>
                <div><label :class="sectionLabel">Название</label><input v-model="card.title" :class="sectionInput" /></div>
                <div><label :class="sectionLabel">Описание</label><textarea v-model="card.description" rows="2" :class="sectionInput" /></div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addServiceCard"><Plus class="w-4 h-4" /> Добавить карточку</button>
            </div>
          </div>
        </section>

        <!-- 5. PROCESS -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('process')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">5. Процесс работы</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.process }" />
          </button>
          <div v-show="!collapsed.process" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Метка</label><input v-model="d.process.label" :class="sectionInput" /></div>
            <div class="grid md:grid-cols-2 gap-4">
              <div><label :class="sectionLabel">Заголовок</label><input v-model="d.process.heading" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Акцент</label><input v-model="d.process.headingAccent" :class="sectionInput" /></div>
            </div>
            <div class="space-y-3">
              <div v-for="(step, i) in d.process.steps" :key="i" class="border border-mts-border p-4 bg-mts-bg/50 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Шаг {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeStep(i)"><Trash2 class="w-4 h-4" /></button>
                </div>
                <div><label :class="sectionLabel">Название</label><input v-model="step.title" :class="sectionInput" /></div>
                <div><label :class="sectionLabel">Описание</label><textarea v-model="step.text" rows="2" :class="sectionInput" /></div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addStep"><Plus class="w-4 h-4" /> Добавить шаг</button>
            </div>
          </div>
        </section>

        <!-- 6. CTA -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('cta')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">6. Нижний CTA-блок</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.cta }" />
          </button>
          <div v-show="!collapsed.cta" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Метка</label><input v-model="d.cta.label" :class="sectionInput" /></div>
            <div class="grid md:grid-cols-2 gap-4">
              <div><label :class="sectionLabel">Заголовок</label><input v-model="d.cta.title" :class="sectionInput" /></div>
              <div><label :class="sectionLabel">Акцент</label><input v-model="d.cta.titleAccent" :class="sectionInput" /></div>
            </div>
            <div><label :class="sectionLabel">Текст</label><textarea v-model="d.cta.text" rows="2" :class="sectionInput" /></div>
            <div><label :class="sectionLabel">Текст кнопки</label><input v-model="d.cta.button" :class="sectionInput" /></div>
          </div>
        </section>

        <section class="bg-white border border-mts-border shadow-tech relative p-6">
          <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.showInquiryForm" type="checkbox" class="mts-checkbox" />
            Показать форму заявки внизу главной страницы
          </label>
        </section>

        <div class="flex justify-end">
          <button type="button" :disabled="saving" class="btn-primary px-8 disabled:opacity-50" @click="submit">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
        </div>
      </div>
    </main>
  </div>
</template>
