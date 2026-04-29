<script setup lang="ts">
import { ArrowLeft, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next'
import AdminNavPathPick from '~/components/admin/AdminNavPathPick.vue'
import AdminCollapsibleSection from '~/components/admin/AdminCollapsibleSection.vue'
import type { HomePageData, ContentPage, MarineContentLocale, ServiceItem } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import AdminThemeTitleEditor from '~/components/admin/AdminThemeTitleEditor.vue'
import {
  HOME_SECTION_ADMIN_LABELS,
  HOME_SECTION_DEFAULT_ORDER,
  defaultHomeData,
  mergeHomePageData,
  syncHomeStructuralFields,
} from '~/utils/pageDefaults'
import { getAllLucideAdminIconOptions } from '~/utils/lucideIconRegistry'
import { useConfirm } from '~/composables/useConfirmAction'
import { isSectionVisible, moveOrderItem, resolveSectionOrder } from '~/utils/sectionVisibility'

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
  directions: true,
  funnel: true,
  about: true,
  services: true,
  process: true,
  cta: true,
})

function toggle(s: string) { collapsed.value[s] = !collapsed.value[s] }

/**
 * Эффективный порядок секций (без hero) с учётом сохранённого `sectionOrder`,
 * актуальных кастомных секций и дефолтов. Используется для inline-контролов.
 */
const effectiveSectionOrder = computed<string[]>(() => {
  const cur = data.value[localeTab.value]
  return resolveSectionOrder(cur.sectionOrder, HOME_SECTION_DEFAULT_ORDER, cur.customSections)
})

function sectionVisible(id: string): boolean {
  return isSectionVisible(data.value[localeTab.value].sectionVisibility, id)
}

function setSectionVisible(id: string, v: boolean) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const cur = data.value[loc].sectionVisibility ?? {}
    data.value[loc].sectionVisibility = { ...cur, [id]: v }
  }
}

function indexInOrder(id: string): number {
  return effectiveSectionOrder.value.indexOf(id)
}

function canMove(id: string, delta: number): boolean {
  const idx = indexInOrder(id)
  if (idx < 0) return false
  const j = idx + delta
  return j >= 0 && j < effectiveSectionOrder.value.length
}

function moveSection(id: string, delta: number) {
  const order = effectiveSectionOrder.value
  const idx = order.indexOf(id)
  if (idx < 0) return
  const next = moveOrderItem(order, idx, delta)
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].sectionOrder = [...next]
  }
}

function sectionTitle(id: string): string {
  const pos = indexInOrder(id) + 2
  const label = HOME_SECTION_ADMIN_LABELS[id as keyof typeof HOME_SECTION_ADMIN_LABELS] ?? id
  return `${pos}. ${label}`
}

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

function addDirectionRow() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].directions.rows.push({
      title: '',
      description: '',
      cta: loc === 'en' ? 'Open' : 'Подробнее',
      href: '/services',
      hoverTitle: '',
      hoverDescription: '',
      heroImage: '',
    })
  }
}

async function removeDirectionRow(i: number) {
  const ok = await confirm({
    message: 'Удалить эту карточку первого экрана?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].directions.rows.splice(i, 1)
  }
}

function moveDirectionRow(index: number, dir: -1 | 1) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const rows = data.value[loc].directions.rows
    const j = index + dir
    if (j < 0 || j >= rows.length) {
      continue
    }
    const t = rows[index]!
    rows[index] = rows[j]!
    rows[j] = t
  }
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

        <!-- 1. HERO — фиксирована, не скрывается, не переносится. -->
        <AdminCollapsibleSection
          title="1. Hero-блок"
          :collapsed="collapsed.hero"
          @update:collapsed="(v) => (collapsed.hero = v)"
        >
          <div class="space-y-4">
            <AdminHeroImageField
              v-model="d.heroImage"
              label="Фон первого экрана"
              hint="Необязательно. Если не задано, на главной показывается сплошной фон без фото."
            />
            <div>
              <label :class="sectionLabel">Метка (label)</label>
              <AdminThemedTextField v-model="d.hero.label" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemeTitleEditor v-model="d.hero.titleFormatted" />
            </div>
            <div><label :class="sectionLabel">Описание (lead)</label><AdminThemedTextField v-model="d.hero.lead" /></div>
            <div class="grid md:grid-cols-2 gap-4">
              <div><label :class="sectionLabel">CTA клиент (заявка)</label><AdminThemedTextField v-model="d.hero.ctaClient" :multiline="false" /></div>
              <div><label :class="sectionLabel">CTA моряк (анкета)</label><AdminThemedTextField v-model="d.hero.ctaSeafarer" :multiline="false" /></div>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label :class="sectionLabel">Ссылка CTA клиента</label>
                <input v-model="d.hero.ctaClientHref" type="text" :class="sectionInput" placeholder="/contacts" />
              </div>
              <div>
                <label :class="sectionLabel">Ссылка CTA моряка</label>
                <input v-model="d.hero.ctaSeafarerHref" type="text" :class="sectionInput" placeholder="/vacancies" />
              </div>
            </div>
            <div class="grid md:grid-cols-3 gap-4">
              <div><label :class="sectionLabel">Бейдж ISO</label><AdminThemedTextField v-model="d.hero.badgeIso" :multiline="false" /></div>
              <div><label :class="sectionLabel">Бейдж IACS</label><AdminThemedTextField v-model="d.hero.badgeIacs" :multiline="false" /></div>
              <div><label :class="sectionLabel">Бейдж «Лет опыта»</label><AdminThemedTextField v-model="d.hero.badgeYears" :multiline="false" /></div>
            </div>
            <div><label :class="sectionLabel">Текст «Листайте»</label><AdminThemedTextField v-model="d.hero.scroll" :multiline="false" /></div>

            <div class="mt-4 border border-mts-border bg-mts-bg/40 p-4 space-y-4">
              <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">Карточка «В цифрах» (внутри hero)</h3>
              <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
                <input v-model="d.showStatsCard" type="checkbox" class="mts-checkbox" />
                Показывать карточку в Hero
              </label>
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
          </div>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          title="Карточки внизу первого экрана"
          :collapsed="collapsed.directions"
          @update:collapsed="(v) => (collapsed.directions = v)"
        >
          <div class="space-y-5">
            <p class="font-body text-sm text-mts-text-secondary">
              Эти карточки находятся поверх hero внизу первого экрана. На сайте они берутся из блока
              <span class="font-mono text-mts-text">directions.rows</span>.
            </p>

            <div>
              <label :class="sectionLabel">Метка секции ниже на странице</label>
              <AdminThemedTextField v-model="d.directions.label" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок секции ниже на странице</label>
              <AdminThemeTitleEditor v-model="d.directions.headingFormatted" />
            </div>

            <div class="space-y-4">
              <div
                v-for="(row, i) in d.directions.rows"
                :key="`direction-${i}`"
                class="border border-mts-border bg-mts-bg/40 p-5"
              >
                <div class="mb-4 flex items-center justify-between gap-3">
                  <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">
                    Карточка {{ i + 1 }}
                  </h3>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="p-1.5 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                      :disabled="i === 0"
                      aria-label="Выше"
                      @click="moveDirectionRow(i, -1)"
                    >
                      <ChevronUp class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                      :disabled="i === d.directions.rows.length - 1"
                      aria-label="Ниже"
                      @click="moveDirectionRow(i, 1)"
                    >
                      <ChevronDown class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-red-500/80 hover:text-red-600"
                      aria-label="Удалить"
                      @click="removeDirectionRow(i)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <label :class="sectionLabel">Название</label>
                    <AdminThemedTextField v-model="row.title" :multiline="false" />
                  </div>
                  <div>
                    <label :class="sectionLabel">CTA</label>
                    <AdminThemedTextField v-model="row.cta" :multiline="false" />
                  </div>
                </div>
                <div class="mt-4">
                  <label :class="sectionLabel">Описание</label>
                  <AdminThemedTextField v-model="row.description" />
                </div>
                <div class="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label :class="sectionLabel">Заголовок в Hero при наведении</label>
                    <AdminThemedTextField
                      v-model="row.hoverTitle"
                      :multiline="false"
                      placeholder="Если пусто, используется название карточки"
                    />
                  </div>
                  <div>
                    <label :class="sectionLabel">Описание в Hero при наведении</label>
                    <AdminThemedTextField
                      v-model="row.hoverDescription"
                      placeholder="Если пусто, используется описание карточки"
                    />
                  </div>
                </div>
                <div class="mt-4">
                  <AdminHeroImageField
                    v-model="row.heroImage"
                    label="Фон Hero при выборе карточки"
                    hint="Если не задано, останется общий фон первого экрана."
                  />
                </div>
                <div class="mt-4">
                  <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Ссылка</p>
                  <AdminNavPathPick v-model="row.href" :path-options="pathOptions" input-placeholder="/services" />
                </div>
              </div>

              <button
                type="button"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
                @click="addDirectionRow"
              >
                <Plus class="w-4 h-4" />
                Добавить карточку
              </button>
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- 2. FUNNEL CARDS -->
        <AdminCollapsibleSection
          :title="sectionTitle('funnel')"
          :collapsed="collapsed.funnel"
          :visible="sectionVisible('funnel')"
          :can-move-up="canMove('funnel', -1)"
          :can-move-down="canMove('funnel', 1)"
          @update:collapsed="(v) => (collapsed.funnel = v)"
          @update:visible="(v) => setSectionVisible('funnel', v)"
          @move-up="moveSection('funnel', -1)"
          @move-down="moveSection('funnel', 1)"
        >
          <div class="space-y-8">
            <p class="font-body text-sm text-mts-text-secondary">
              Три колонки с меткой, заголовком (акцентное слово красным), текстом и ссылками — как на главной сразу под hero.
            </p>

            <div class="border border-mts-border bg-mts-bg/40 p-5 space-y-4">
              <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">Судовой менеджмент (левая)</h3>
              <div><label :class="sectionLabel">Метка (над заголовком)</label><AdminThemedTextField v-model="d.funnelShip.label" :multiline="false" /></div>
              <div>
                <label :class="sectionLabel">Заголовок</label>
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
                <label :class="sectionLabel">Заголовок</label>
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
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemeTitleEditor v-model="d.funnelTechnical.titleFormatted" />
              </div>
              <div><label :class="sectionLabel">Текст</label><AdminThemedTextField v-model="d.funnelTechnical.text" /></div>
              <div class="grid md:grid-cols-2 gap-4">
                <div><label :class="sectionLabel">Подпись кнопки</label><AdminThemedTextField v-model="d.funnelTechnical.cta" :multiline="false" /></div>
              </div>
              <AdminNavPathPick v-model="d.funnelTechnical.href" :path-options="pathOptions" input-placeholder="/services" />
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- 4. ABOUT PREVIEW -->
        <AdminCollapsibleSection
          :title="sectionTitle('about')"
          :collapsed="collapsed.about"
          :visible="sectionVisible('about')"
          :can-move-up="canMove('about', -1)"
          :can-move-down="canMove('about', 1)"
          @update:collapsed="(v) => (collapsed.about = v)"
          @update:visible="(v) => setSectionVisible('about', v)"
          @move-up="moveSection('about', -1)"
          @move-down="moveSection('about', 1)"
        >
          <div class="space-y-4">
            <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.about.label" :multiline="false" /></div>
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.about.title" />
            </div>
            <div><label :class="sectionLabel">Подзаголовок</label><AdminThemedTextField v-model="d.about.subtitle" :multiline="false" /></div>
            <div><label :class="sectionLabel">Абзац 1</label><AdminThemedTextField v-model="d.about.lead" /></div>
            <div><label :class="sectionLabel">Абзац 2</label><AdminThemedTextField v-model="d.about.lead2" /></div>
            <div><label :class="sectionLabel">Текст кнопки «Подробнее»</label><AdminThemedTextField v-model="d.about.more" :multiline="false" /></div>
          </div>
        </AdminCollapsibleSection>

        <!-- 5. SERVICES PREVIEW -->
        <AdminCollapsibleSection
          :title="sectionTitle('services')"
          :collapsed="collapsed.services"
          :visible="sectionVisible('services')"
          :can-move-up="canMove('services', -1)"
          :can-move-down="canMove('services', 1)"
          @update:collapsed="(v) => (collapsed.services = v)"
          @update:visible="(v) => setSectionVisible('services', v)"
          @move-up="moveSection('services', -1)"
          @move-down="moveSection('services', 1)"
        >
          <div class="space-y-4">
            <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.services.label" :multiline="false" /></div>
            <div>
              <label :class="sectionLabel">Заголовок</label>
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
        </AdminCollapsibleSection>

        <!-- 6. PROCESS -->
        <AdminCollapsibleSection
          :title="sectionTitle('process')"
          :collapsed="collapsed.process"
          :visible="sectionVisible('process')"
          :can-move-up="canMove('process', -1)"
          :can-move-down="canMove('process', 1)"
          @update:collapsed="(v) => (collapsed.process = v)"
          @update:visible="(v) => setSectionVisible('process', v)"
          @move-up="moveSection('process', -1)"
          @move-down="moveSection('process', 1)"
        >
          <div class="space-y-4">
            <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.process.label" :multiline="false" /></div>
            <div>
              <label :class="sectionLabel">Заголовок</label>
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
        </AdminCollapsibleSection>

        <!-- 7. CTA -->
        <AdminCollapsibleSection
          :title="sectionTitle('cta')"
          :collapsed="collapsed.cta"
          :visible="sectionVisible('cta')"
          :can-move-up="canMove('cta', -1)"
          :can-move-down="canMove('cta', 1)"
          @update:collapsed="(v) => (collapsed.cta = v)"
          @update:visible="(v) => setSectionVisible('cta', v)"
          @move-up="moveSection('cta', -1)"
          @move-down="moveSection('cta', 1)"
        >
          <div class="space-y-4">
            <div><label :class="sectionLabel">Метка</label><AdminThemedTextField v-model="d.cta.label" :multiline="false" /></div>
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemeTitleEditor v-model="d.cta.titleFormatted" />
            </div>
            <div><label :class="sectionLabel">Текст</label><AdminThemedTextField v-model="d.cta.text" /></div>
            <div><label :class="sectionLabel">Текст кнопки</label><AdminThemedTextField v-model="d.cta.button" :multiline="false" /></div>
          </div>
        </AdminCollapsibleSection>

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
