<script setup lang="ts">
import { ArrowLeft, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next'
import AdminNavPathPick from '~/components/admin/AdminNavPathPick.vue'
import type { HomePageData, ContentPage, MarineContentLocale, ServiceItem } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import AdminThemeTitleEditor from '~/components/admin/AdminThemeTitleEditor.vue'
import { defaultHomeData, mergeHomePageData, syncHomeStructuralFields } from '~/utils/pageDefaults'
import { getAllLucideAdminIconOptions } from '~/utils/lucideIconRegistry'
import { useConfirm } from '~/composables/useConfirmAction'

const STAT_ICON_OPTIONS = getAllLucideAdminIconOptions()

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useMarineApi()
const { pathOptions, loadPathOptions } = useAdminPathOptions()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { confirm } = useConfirm()

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
  funnel: true,
  stats: true,
  about: true,
  services: true,
  process: true,
  cta: true,
})

function toggle(s: string) { collapsed.value[s] = !collapsed.value[s] }

onMounted(async () => {
  await loadPathOptions()
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
            if (parsed?.hero) data.value[loc] = mergeHomePageData(loc, parsed)
          } catch { /* keep defaults */ }
        }
      }
    }
  } catch { /* no existing page */ }
  try {
    catalogServices.value = await api.services.getAll()
  } catch {
    catalogServices.value = []
  }
  finally { loading.value = false }
})

function addStat() {
  for (const loc of MARINE_CONTENT_LOCALES)
    data.value[loc].statsCard.items.push({ icon: 'Ship', value: '', label: '' })
}
async function removeStat(i: number) {
  const ok = await confirm({
    message: 'Удалить этот показатель?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) data.value[loc].statsCard.items.splice(i, 1)
}
function setFeaturedServiceIds(ids: number[]) {
  const next = [...ids]
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].services.featuredServiceIds = next
  }
}

const catalogServices = ref<ServiceItem[]>([])
const pickServiceId = ref<string>('')

function serviceTitleById(id: number): string {
  return catalogServices.value.find((s) => s.id === id)?.title ?? `#${id}`
}

function addFeaturedService() {
  const id = Number(pickServiceId.value)
  if (!id || Number.isNaN(id)) {
    return
  }
  const cur = data.value.ru.services.featuredServiceIds ?? []
  if (cur.includes(id)) {
    return
  }
  setFeaturedServiceIds([...cur, id])
  pickServiceId.value = ''
}

async function removeFeaturedService(index: number) {
  const ok = await confirm({
    message: 'Убрать этот сервис из списка на главной?',
    confirmLabel: 'Убрать',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  const cur = [...(data.value.ru.services.featuredServiceIds ?? [])]
  cur.splice(index, 1)
  setFeaturedServiceIds(cur)
}

async function clearFeaturedServices() {
  const ok = await confirm({
    message: 'Очистить весь список избранных сервисов на главной?',
    confirmLabel: 'Очистить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  setFeaturedServiceIds([])
}

function moveFeaturedService(index: number, dir: -1 | 1) {
  const cur = [...(data.value.ru.services.featuredServiceIds ?? [])]
  const j = index + dir
  if (j < 0 || j >= cur.length) {
    return
  }
  const t = cur[index]!
  cur[index] = cur[j]!
  cur[j] = t
  setFeaturedServiceIds(cur)
}

const pickServiceOptions = computed(() => {
  const taken = new Set(data.value.ru.services.featuredServiceIds ?? [])
  return catalogServices.value.filter((s) => !taken.has(s.id))
})

function addStep() {
  for (const loc of MARINE_CONTENT_LOCALES)
    data.value[loc].process.steps.push({ title: '', text: '' })
}
async function removeStep(i: number) {
  const ok = await confirm({
    message: 'Удалить этот шаг процесса?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
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
            <AdminHeroImageField
              v-model="d.heroImage"
              label="Фон первого экрана"
              hint="Необязательно. Если не задано, используется /images/marin-figma/hero-ship.jpg из сайта."
            />
            <div>
              <label :class="sectionLabel">Метка (label)</label>
              <AdminThemedTextField v-model="d.hero.label" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
              <AdminThemeTitleEditor v-model="d.hero.titleFormatted" />
            </div>
            <div><label :class="sectionLabel">Описание (lead)</label><AdminThemedTextField v-model="d.hero.lead" /></div>
            <div class="grid md:grid-cols-2 gap-4">
              <div><label :class="sectionLabel">CTA клиент (заявка)</label><AdminThemedTextField v-model="d.hero.ctaClient" :multiline="false" /></div>
              <div><label :class="sectionLabel">CTA моряк (анкета)</label><AdminThemedTextField v-model="d.hero.ctaSeafarer" :multiline="false" /></div>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div><label :class="sectionLabel">Ссылка CTA клиента</label><AdminThemedTextField v-model="d.hero.ctaClientHref" :multiline="false" /></div>
              <div><label :class="sectionLabel">Ссылка CTA моряка</label><AdminThemedTextField v-model="d.hero.ctaSeafarerHref" :multiline="false" /></div>
            </div>
            <div class="grid md:grid-cols-3 gap-4">
              <div><label :class="sectionLabel">Бейдж ISO</label><AdminThemedTextField v-model="d.hero.badgeIso" :multiline="false" /></div>
              <div><label :class="sectionLabel">Бейдж IACS</label><AdminThemedTextField v-model="d.hero.badgeIacs" :multiline="false" /></div>
              <div><label :class="sectionLabel">Бейдж «Лет опыта»</label><AdminThemedTextField v-model="d.hero.badgeYears" :multiline="false" /></div>
            </div>
            <div><label :class="sectionLabel">Текст «Листайте»</label><AdminThemedTextField v-model="d.hero.scroll" :multiline="false" /></div>
          </div>
        </section>

        <!-- 2. FUNNEL CARDS -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('funnel')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">
              2. Три карточки под первым экраном
            </h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.funnel }" />
          </button>
          <div v-show="!collapsed.funnel" class="px-6 pb-6 space-y-8 border-t border-mts-border pt-4">
            <p class="font-body text-sm text-mts-text-secondary">
              Три колонки с меткой, заголовком (акцентное слово красным), текстом и ссылками — как на главной сразу под hero.
            </p>

            <div class="border border-mts-border bg-mts-bg/40 p-5 space-y-4">
              <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">Судовой менеджмент (левая)</h3>
              <div><label :class="sectionLabel">Метка (над заголовком)</label><AdminThemedTextField v-model="d.funnelShip.label" :multiline="false" /></div>
              <div>
                <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
                <AdminThemeTitleEditor v-model="d.funnelShip.titleFormatted" />
              </div>
              <div><label :class="sectionLabel">Текст</label><AdminThemedTextField v-model="d.funnelShip.text" /></div>
              <div class="grid md:grid-cols-2 gap-4">
                <div><label :class="sectionLabel">Подпись кнопки</label><AdminThemedTextField v-model="d.funnelShip.cta" :multiline="false" /></div>
              </div>
              <AdminNavPathPick v-model="d.funnelShip.href" :path-options="pathOptions" input-placeholder="/ship-management" />
            </div>

            <div class="border border-mts-border bg-mts-bg/40 p-5 space-y-4">
              <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">Крюинг (центр, две ссылки)</h3>
              <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.funnelCrewing.label" :multiline="false" /></div>
              <div>
                <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
                <AdminThemeTitleEditor v-model="d.funnelCrewing.titleFormatted" />
              </div>
              <div><label :class="sectionLabel">Текст</label><AdminThemedTextField v-model="d.funnelCrewing.text" /></div>
              <div class="grid md:grid-cols-2 gap-4">
                <div><label :class="sectionLabel">Первая ссылка — подпись</label><AdminThemedTextField v-model="d.funnelCrewing.cta" :multiline="false" /></div>
                <div><label :class="sectionLabel">Вторая ссылка — подпись</label><AdminThemedTextField v-model="d.funnelCrewing.secondaryCta" :multiline="false" /></div>
              </div>
              <div>
                <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Первая ссылка</p>
                <AdminNavPathPick v-model="d.funnelCrewing.href" :path-options="pathOptions" input-placeholder="/vacancies" />
              </div>
              <div>
                <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Вторая ссылка</p>
                <AdminNavPathPick v-model="d.funnelCrewing.secondaryHref" :path-options="pathOptions" input-placeholder="/application-form" />
              </div>
            </div>

            <div class="border border-mts-border bg-mts-bg/40 p-5 space-y-4">
              <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">Сервисы (правая)</h3>
              <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.funnelTechnical.label" :multiline="false" /></div>
              <div>
                <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
                <AdminThemeTitleEditor v-model="d.funnelTechnical.titleFormatted" />
              </div>
              <div><label :class="sectionLabel">Текст</label><AdminThemedTextField v-model="d.funnelTechnical.text" /></div>
              <div class="grid md:grid-cols-2 gap-4">
                <div><label :class="sectionLabel">Подпись кнопки</label><AdminThemedTextField v-model="d.funnelTechnical.cta" :multiline="false" /></div>
              </div>
              <AdminNavPathPick v-model="d.funnelTechnical.href" :path-options="pathOptions" input-placeholder="/services" />
            </div>
          </div>
        </section>

        <!-- 3. STATS -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('stats')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">3. Статистика</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.stats }" />
          </button>
          <div v-show="!collapsed.stats" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Заголовок карточки</label><AdminThemedTextField v-model="d.statsCard.label" :multiline="false" /></div>
            <div class="space-y-3">
              <div v-for="(item, i) in d.statsCard.items" :key="i" class="border border-mts-border p-4 bg-mts-bg/50">
                <div class="flex items-center justify-between mb-3">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Показатель {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeStat(i)"><Trash2 class="w-4 h-4" /></button>
                </div>
                <div class="grid md:grid-cols-3 gap-3">
                  <div><label :class="sectionLabel">Иконка</label><AdminSelect v-model="item.icon" :options="STAT_ICON_OPTIONS" /></div>
                  <div><label :class="sectionLabel">Значение</label><AdminThemedTextField v-model="item.value" :multiline="false" /></div>
                  <div><label :class="sectionLabel">Подпись</label><AdminThemedTextField v-model="item.label" :multiline="false" /></div>
                </div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addStat"><Plus class="w-4 h-4" /> Добавить показатель</button>
            </div>
          </div>
        </section>

        <!-- 4. ABOUT PREVIEW -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('about')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">4. Превью «О компании»</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.about }" />
          </button>
          <div v-show="!collapsed.about" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.about.label" :multiline="false" /></div>
            <div>
              <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
              <AdminThemeTitleEditor v-model="d.about.titleFormatted" />
            </div>
            <div><label :class="sectionLabel">Текст</label><AdminThemedTextField v-model="d.about.text" /></div>
            <div><label :class="sectionLabel">Текст кнопки «Подробнее»</label><AdminThemedTextField v-model="d.about.more" :multiline="false" /></div>
          </div>
        </section>

        <!-- 5. SERVICES PREVIEW -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('services')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">5. Превью сервисов</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.services }" />
          </button>
          <div v-show="!collapsed.services" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.services.label" :multiline="false" /></div>
            <div>
              <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
              <AdminThemeTitleEditor v-model="d.services.headingFormatted" />
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div><label :class="sectionLabel">Текст «Все сервисы»</label><AdminThemedTextField v-model="d.services.all" :multiline="false" /></div>
              <div><label :class="sectionLabel">Текст «Подробнее →»</label><AdminThemedTextField v-model="d.services.more" :multiline="false" /></div>
            </div>

            <div class="rounded-md border border-mts-accent/30 bg-mts-bg/60 p-4 space-y-3">
              <p class="font-body text-sm text-mts-text leading-relaxed">
                <strong class="text-mts-text">Какие сервисы показать на главной.</strong>
                Тексты и фото берутся из карточек каталога (текущая локаль API). Если список пуст, блок «Сервисы» на главной не отображается.
              </p>
              <div v-if="(d.services.featuredServiceIds?.length ?? 0) > 0" class="space-y-2">
                <div
                  v-for="(sid, idx) in d.services.featuredServiceIds"
                  :key="sid"
                  class="flex flex-wrap items-center gap-2 border border-mts-border bg-white px-3 py-2"
                >
                  <span class="font-mono text-xs text-mts-text-secondary w-6">{{ idx + 1 }}.</span>
                  <span class="font-body text-sm text-mts-text flex-1 min-w-[12rem]">{{ serviceTitleById(sid) }}</span>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="p-1.5 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                      :disabled="idx === 0"
                      aria-label="Выше"
                      @click="moveFeaturedService(idx, -1)"
                    >
                      <ChevronUp class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                      :disabled="idx === (d.services.featuredServiceIds?.length ?? 0) - 1"
                      aria-label="Ниже"
                      @click="moveFeaturedService(idx, 1)"
                    >
                      <ChevronDown class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-red-500/80 hover:text-red-600"
                      aria-label="Удалить"
                      @click="removeFeaturedService(idx)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="font-body text-xs text-mts-text-secondary">Список пуст — блок «Сервисы» на сайте скрыт.</div>
              <div class="flex flex-wrap items-end gap-3">
                <div class="min-w-[14rem] flex-1">
                  <label :class="sectionLabel">Добавить из каталога</label>
                  <select v-model="pickServiceId" :class="sectionInput">
                    <option value="">— выберите карточку —</option>
                    <option v-for="s in pickServiceOptions" :key="s.id" :value="String(s.id)">{{ s.title }}</option>
                  </select>
                </div>
                <button
                  type="button"
                  class="border border-mts-border bg-white px-4 py-3 font-mono text-xs uppercase text-mts-text hover:border-mts-accent mb-0"
                  :disabled="!pickServiceId"
                  @click="addFeaturedService"
                >
                  Добавить
                </button>
                <button
                  v-if="(d.services.featuredServiceIds?.length ?? 0) > 0"
                  type="button"
                  class="font-mono text-xs uppercase text-mts-text-secondary hover:text-mts-accent py-3"
                  @click="clearFeaturedServices"
                >
                  Очистить список
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 6. PROCESS -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('process')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">6. Процесс работы</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.process }" />
          </button>
          <div v-show="!collapsed.process" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.process.label" :multiline="false" /></div>
            <div>
              <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
              <AdminThemeTitleEditor v-model="d.process.headingFormatted" />
            </div>
            <div class="space-y-3">
              <div v-for="(step, i) in d.process.steps" :key="i" class="border border-mts-border p-4 bg-mts-bg/50 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Шаг {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeStep(i)"><Trash2 class="w-4 h-4" /></button>
                </div>
                <div><label :class="sectionLabel">Название</label><AdminThemedTextField v-model="step.title" :multiline="false" /></div>
                <div><label :class="sectionLabel">Описание</label><AdminThemedTextField v-model="step.text" /></div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addStep"><Plus class="w-4 h-4" /> Добавить шаг</button>
            </div>
          </div>
        </section>

        <!-- 7. CTA -->
        <section class="bg-white border border-mts-border shadow-tech relative">
          <CommonAccentCorners />
          <button type="button" class="w-full flex items-center justify-between p-6" @click="toggle('cta')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">7. Нижний CTA-блок</h2>
            <ChevronDown class="w-4 h-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.cta }" />
          </button>
          <div v-show="!collapsed.cta" class="px-6 pb-6 space-y-4 border-t border-mts-border pt-4">
            <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.cta.label" :multiline="false" /></div>
            <div>
              <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
              <AdminThemeTitleEditor v-model="d.cta.titleFormatted" />
            </div>
            <div><label :class="sectionLabel">Текст</label><AdminThemedTextField v-model="d.cta.text" /></div>
            <div><label :class="sectionLabel">Текст кнопки</label><AdminThemedTextField v-model="d.cta.button" :multiline="false" /></div>
          </div>
        </section>

        <AdminCustomSectionsEditor
          :model-value="d.customSections ?? []"
          @update:model-value="(v) => (d.customSections = v)"
        />

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
