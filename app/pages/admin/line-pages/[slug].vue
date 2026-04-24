<script setup lang="ts">
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-vue-next'
import AdminCollapsibleSection from '~/components/admin/AdminCollapsibleSection.vue'
import type {
  ContentPage,
  CrewingPageData,
  LineMarketingContentBlock,
  LineMarketingCustomSection,
  LineMarketingSectionId,
  MarineContentLocale,
} from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import { defaultLinePageData, mergeLinePageData } from '~/utils/pageDefaults'
import AdminIconSelect from '~/components/admin/AdminIconSelect.vue'
import AdminInputNumberStepper from '~/components/admin/AdminInputNumberStepper.vue'
import AdminPlusLink from '~/components/admin/AdminPlusLink.vue'
import AdminThemeTitleEditor from '~/components/admin/AdminThemeTitleEditor.vue'
import AdminSelect, { type AdminSelectOption } from '~/components/admin/AdminSelect.vue'
import { crewingIconSelectOptions } from '~/utils/crewingIcons'
import {
  isLineMarketingPageSlug,
  LINE_MARKETING_PAGE_ADMIN_LABELS,
  LINE_MARKETING_PAGE_CONTENT_TITLES,
  LINE_MARKETING_SECTION_ADMIN_LABELS,
} from '~/utils/lineMarketingPages'
import { useConfirm } from '~/composables/useConfirmAction'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const rawSlug = computed(() => (Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug) ?? '')

const slug = computed(() => {
  const s = rawSlug.value
  return isLineMarketingPageSlug(s) ? s : null
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { canManageContentPages } = useAdminPermissions()
const { confirm } = useConfirm()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

const data = ref<Record<MarineContentLocale, CrewingPageData> | null>(null)

const d = computed(() => {
  if (!data.value || !slug.value) {
    return null
  }
  return data.value[localeTab.value]
})

watch(
  () => d.value,
  (cur) => {
    if (!cur) {
      return
    }
    if (!Array.isArray(cur.heroButtons)) {
      cur.heroButtons = []
    }
    if (cur.heroButtons.length > 2) {
      cur.heroButtons.splice(2)
    }
    if (!cur.hero.titleFormatted?.spans?.length) {
      cur.hero.titleFormatted = { spans: [{ text: '', tone: 'text' }] }
    }
  },
  { deep: true, immediate: true },
)

const collapsed = ref<Record<string, boolean>>({
  hero: false,
  directions: false,
  checklist: true,
  principles: true,
  audience: true,
})

function toggle(s: string) {
  collapsed.value[s] = !collapsed.value[s]
}

function addPrinciple() {
  if (!d.value) {
    return
  }
  d.value.principles.items.push('')
}

async function removePrinciple(i: number) {
  if (!d.value || d.value.principles.items.length <= 1) {
    return
  }
  const ok = await confirm({
    message: 'Удалить этот пункт?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  d.value.principles.items.splice(i, 1)
}

function addChecklistSection() {
  if (!d.value) {
    return
  }
  d.value.checklist.sections.push({ heading: '', points: [{ title: '', text: '' }] })
}

async function removeChecklistSection(si: number) {
  if (!d.value) {
    return
  }
  const ok = await confirm({
    message: 'Удалить эту секцию чек-листа?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  d.value.checklist.sections.splice(si, 1)
}

function addChecklistPoint(si: number) {
  if (!d.value) {
    return
  }
  d.value.checklist.sections[si].points.push({ title: '', text: '' })
}

async function removeChecklistPoint(si: number, pi: number) {
  if (!d.value) {
    return
  }
  const ok = await confirm({
    message: 'Удалить этот пункт?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  d.value.checklist.sections[si].points.splice(pi, 1)
}

function addDirection() {
  if (!d.value) {
    return
  }
  d.value.directions.push({
    icon: 'UserCheck',
    hideIcon: false,
    title: '',
    text: '',
    detailSlug: '',
  })
}

async function removeDirection(i: number) {
  if (!d.value || d.value.directions.length <= 1) {
    return
  }
  const ok = await confirm({
    message: 'Удалить эту карточку направления?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  d.value.directions.splice(i, 1)
}

function addHeroButton() {
  if (!d.value || d.value.heroButtons.length >= 2) {
    return
  }
  d.value.heroButtons.push({ label: '', href: '' })
}

async function removeHeroButton(i: number) {
  if (!d.value) {
    return
  }
  const ok = await confirm({
    message: 'Удалить эту кнопку в hero?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  d.value.heroButtons.splice(i, 1)
}

function moveSectionOrder(index: number, delta: number) {
  if (!data.value) {
    return
  }
  const order = [...data.value[localeTab.value].sectionOrder]
  const j = index + delta
  if (j < 0 || j >= order.length) {
    return
  }
  const t = order[index]
  order[index] = order[j]!
  order[j] = t!
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].sectionOrder = [...order]
  }
}

function sectionVisibilityToggle(id: string, checked: boolean) {
  if (!data.value) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].sectionVisibility = { ...data.value[loc].sectionVisibility, [id]: checked }
  }
}

function newLmId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `lm-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function sectionOrderRowLabel(sid: string): string {
  if (sid.startsWith('custom:')) {
    const id = sid.slice(7)
    const sec = d.value?.customSections.find((s) => s.id === id)
    return sec?.title?.trim() ? sec.title : 'Пользовательская секция'
  }
  return LINE_MARKETING_SECTION_ADMIN_LABELS[sid as LineMarketingSectionId]
}

function sectionVisible(sid: string): boolean {
  return d.value?.sectionVisibility?.[sid] !== false
}

function setSectionVisible(sid: string, v: boolean) {
  sectionVisibilityToggle(sid, v)
}

function indexInOrder(sid: string): number {
  return d.value?.sectionOrder?.indexOf(sid) ?? -1
}

function canMove(sid: string, delta: number): boolean {
  const idx = indexInOrder(sid)
  const len = d.value?.sectionOrder?.length ?? 0
  if (idx < 0) return false
  const j = idx + delta
  return j >= 0 && j < len
}

function moveSection(sid: string, delta: number) {
  const idx = indexInOrder(sid)
  if (idx < 0) return
  moveSectionOrder(idx, delta)
}

function getCustomSectionById(id: string): LineMarketingCustomSection | undefined {
  return d.value?.customSections.find((s) => s.id === id)
}

function addCustomSection() {
  if (!data.value) {
    return
  }
  const id = newLmId()
  const key = `custom:${id}`
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].customSections.push({
      id,
      title: '',
      showTitle: true,
      blocks: [],
    })
    data.value[loc].sectionOrder.push(key)
    data.value[loc].sectionVisibility[key] = true
  }
}

async function removeCustomSection(id: string) {
  if (!data.value) {
    return
  }
  const ok = await confirm({
    message: 'Удалить пользовательскую секцию для всех языков?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  const key = `custom:${id}`
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].customSections = data.value[loc].customSections.filter((s) => s.id !== id)
    data.value[loc].sectionOrder = data.value[loc].sectionOrder.filter((k) => k !== key)
    const vis = { ...data.value[loc].sectionVisibility }
    delete vis[key]
    data.value[loc].sectionVisibility = vis
  }
}

function newBlock(type: 'cards' | 'text' | 'split'): LineMarketingContentBlock {
  const bid = newLmId()
  if (type === 'cards') {
    return {
      id: bid,
      type: 'cards',
      items: [{ icon: 'UserCheck', hideIcon: false, title: '', text: '', detailSlug: '' }],
    }
  }
  if (type === 'text') {
    return { id: bid, type: 'text', title: '', subtitle: '', description: '' }
  }
  return { id: bid, type: 'split', leftText: '', leftWidthPercent: 50, rightMode: 'image', images: [''] }
}

function addCustomBlock(sectionId: string, type: 'cards' | 'text' | 'split') {
  if (!data.value) {
    return
  }
  const block = newBlock(type)
  const serialized = JSON.parse(JSON.stringify(block)) as LineMarketingContentBlock
  for (const loc of MARINE_CONTENT_LOCALES) {
    const sec = data.value[loc].customSections.find((s) => s.id === sectionId)
    if (!sec) {
      continue
    }
    sec.blocks.push(JSON.parse(JSON.stringify(serialized)) as LineMarketingContentBlock)
  }
}

function moveCustomBlock(sectionId: string, blockIndex: number, delta: number) {
  if (!data.value) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    const sec = data.value[loc].customSections.find((s) => s.id === sectionId)
    if (!sec) {
      continue
    }
    const j = blockIndex + delta
    if (j < 0 || j >= sec.blocks.length) {
      continue
    }
    const t = sec.blocks[blockIndex]!
    sec.blocks[blockIndex] = sec.blocks[j]!
    sec.blocks[j] = t
  }
}

async function removeCustomBlock(sectionId: string, blockIndex: number) {
  if (!data.value) {
    return
  }
  const ok = await confirm({
    message: 'Удалить этот блок?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    const sec = data.value[loc].customSections.find((s) => s.id === sectionId)
    if (!sec) {
      continue
    }
    sec.blocks.splice(blockIndex, 1)
  }
}

function addCardItem(sectionId: string, blockIndex: number) {
  if (!data.value) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    const sec = data.value[loc].customSections.find((s) => s.id === sectionId)
    if (!sec) {
      continue
    }
    const b = sec.blocks[blockIndex]
    if (!b || b.type !== 'cards') {
      continue
    }
    b.items.push({ icon: 'UserCheck', hideIcon: false, title: '', text: '', detailSlug: '' })
  }
}

async function removeCardItem(sectionId: string, blockIndex: number, itemIndex: number) {
  if (!data.value) {
    return
  }
  const ok = await confirm({
    message: 'Удалить эту карточку?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    const sec = data.value[loc].customSections.find((s) => s.id === sectionId)
    if (!sec) {
      continue
    }
    const b = sec.blocks[blockIndex]
    if (!b || b.type !== 'cards') {
      continue
    }
    if (b.items.length <= 1) {
      continue
    }
    b.items.splice(itemIndex, 1)
  }
}

function addSplitImageRow(sectionId: string, blockIndex: number) {
  if (!data.value) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    const sec = data.value[loc].customSections.find((s) => s.id === sectionId)
    if (!sec) {
      continue
    }
    const b = sec.blocks[blockIndex]
    if (!b || b.type !== 'split') {
      continue
    }
    b.images.push('')
  }
}

async function removeSplitImageRow(sectionId: string, blockIndex: number, imageIndex: number) {
  if (!data.value) {
    return
  }
  const ok = await confirm({
    message: 'Удалить эту строку изображений?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    const sec = data.value[loc].customSections.find((s) => s.id === sectionId)
    if (!sec) {
      continue
    }
    const b = sec.blocks[blockIndex]
    if (!b || b.type !== 'split') {
      continue
    }
    if (b.images.length <= 1) {
      continue
    }
    b.images.splice(imageIndex, 1)
  }
}

const splitRightModeOptions: AdminSelectOption[] = [
  { value: 'image', label: 'Одно изображение' },
  { value: 'slider', label: 'Слайдер (несколько URL)' },
]

const contentPagesCatalog = ref<ContentPage[]>([])
const contentPagesCatalogLoading = ref(false)

async function loadContentPagesCatalog() {
  contentPagesCatalogLoading.value = true
  try {
    const { data } = await api.contentPages.getManageAll({
      sort: 'title',
      order: 'asc',
      per_page: 500,
    })
    contentPagesCatalog.value = data
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить список контентных страниц', variant: 'error' })
  } finally {
    contentPagesCatalogLoading.value = false
  }
}

/** Опции выбора детальной страницы; для «осиротевшего» slug добавляется отдельный пункт. */
function directionDetailOptionsForRow(row: { detailSlug?: string }): AdminSelectOption[] {
  const lineSlug = slug.value
  const pages = contentPagesCatalog.value
  const seen = new Set<string>()
  const opts: AdminSelectOption[] = [{ value: '', label: 'Без отдельной страницы' }]

  const sorted = [...pages].sort((a, b) => a.title.localeCompare(b.title, 'ru'))
  for (const p of sorted) {
    if (lineSlug && p.slug === lineSlug) {
      continue
    }
    if (seen.has(p.slug)) {
      continue
    }
    seen.add(p.slug)
    opts.push({ value: p.slug, label: `${p.title} · ${p.slug}` })
  }
  const d = row.detailSlug?.trim()
  if (d && !seen.has(d)) {
    opts.push({ value: d, label: `${d} — нет в списке, проверьте slug` })
  }
  return opts
}

function contentPageAdminEditPath(detailSlug?: string): string | null {
  const s = detailSlug?.trim()
  if (!s) {
    return null
  }
  const id = contentPagesCatalog.value.find((p) => p.slug === s)?.id
  return id != null ? `/admin/content-pages/${id}` : null
}

onMounted(async () => {
  if (!canManageContentPages.value) {
    await navigateTo('/admin')
    return
  }
  if (!slug.value) {
    await navigateTo('/admin')
    return
  }
  const s = slug.value
  const initial: Record<MarineContentLocale, CrewingPageData> = {
    ru: defaultLinePageData(s, 'ru'),
    en: defaultLinePageData(s, 'en'),
  }
  data.value = initial
  try {
    const page = await api.contentPages.getPublicBySlug(s)
    if (page) {
      existingId.value = page.id
      const managed = await api.contentPages.getManageById(page.id)
      for (const loc of MARINE_CONTENT_LOCALES) {
        const body = managed.translations?.[loc]?.body
        if (body) {
          try {
            const parsed = JSON.parse(body) as unknown
            if (data.value) {
              data.value[loc] = mergeLinePageData(loc, parsed, s)
            }
          } catch {
            /* keep defaults */
          }
        }
      }
    }
  } catch {
    /* no page yet */
  } finally {
    loading.value = false
  }
  await loadContentPagesCatalog()
})

async function submit() {
  const s = slug.value
  if (!s || !data.value) {
    return
  }
  const inq = data.value[localeTab.value].showInquiryForm
  const heroBg = data.value[localeTab.value].heroBackgroundImage
  const sectionOrder = data.value[localeTab.value].sectionOrder
  const sectionVisibility = data.value[localeTab.value].sectionVisibility
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].showInquiryForm = inq
    data.value[loc].heroBackgroundImage = heroBg
    data.value[loc].sectionOrder = [...sectionOrder]
    data.value[loc].sectionVisibility = { ...sectionVisibility }
  }
  saving.value = true
  try {
    const translations = {} as Record<
      MarineContentLocale,
      { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }
    >
    for (const loc of MARINE_CONTENT_LOCALES) {
      const titles = LINE_MARKETING_PAGE_CONTENT_TITLES[s]
      translations[loc] = {
        title: titles[loc],
        excerpt: '',
        body: JSON.stringify(data.value[loc]),
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
      }
    }
    if (existingId.value) {
      await api.contentPages.update(existingId.value, {
        slug: s,
        isPublished: true,
        showInquiryForm: inq,
        translations,
      })
    } else {
      const created = await api.contentPages.create({
        slug: s,
        isPublished: true,
        sortOrder: 0,
        showInquiryForm: inq,
        translations,
      })
      existingId.value = (created as ContentPage).id
    }
    adminToast.success(`Страница «${LINE_MARKETING_PAGE_ADMIN_LABELS[s]}» сохранена`)
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally {
    saving.value = false
  }
}

const sectionLabel = 'mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary'
const sectionInput =
  'w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none'

const adminPageTitle = computed(() => (slug.value ? LINE_MARKETING_PAGE_ADMIN_LABELS[slug.value] : ''))
const localePath = useLocalePath()
const previewPath = computed(() => (slug.value ? localePath(`/${slug.value}`) : localePath('/')))

function directionPreviewPath(detailSlug: string) {
  const s = slug.value
  const d = detailSlug.trim()
  if (!s || !d) {
    return null
  }
  return localePath(`/${s}/${d}`)
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-12">
        <div class="flex flex-1 items-center gap-4">
          <NuxtLink to="/admin" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
            <ArrowLeft class="h-5 w-5" />
          </NuxtLink>
          <h1 class="font-display text-xl text-mts-text">Страница «{{ adminPageTitle }}»</h1>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink
            v-if="slug"
            :to="previewPath"
            target="_blank"
            class="font-body text-sm text-mts-text-secondary transition-colors hover:text-mts-accent"
            >Открыть на сайте ↗</NuxtLink
          >
          <button type="button" :disabled="saving || loading || !slug" class="btn-primary px-6 disabled:opacity-50" @click="submit">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8 lg:px-12">
      <div v-if="loading || !d" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <!-- Hero — фиксирована, не скрывается, не переносится. -->
        <AdminCollapsibleSection
          title="1. Hero"
          :collapsed="collapsed.hero"
          @update:collapsed="(v) => (collapsed.hero = v)"
        >
          <div>
            <label :class="sectionLabel">Подпись над заголовком (как в макете)</label>
            <AdminThemedTextField v-model="d.hero.label" :multiline="false" />
          </div>
          <div>
            <label :class="sectionLabel">Заголовок (сегменты и акценты темы)</label>
            <AdminThemeTitleEditor v-model="d.hero.titleFormatted" />
          </div>
          <div>
            <label :class="sectionLabel">Лид</label>
            <AdminThemedTextField v-model="d.hero.lead" />
          </div>
          <div class="space-y-4 border-t border-mts-border pt-4">
            <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Кнопки в hero (до 2)</p>
            <p class="font-body text-xs text-mts-text-secondary">
              Внутренние страницы: <code class="font-mono text-[11px]">/contacts</code>,
              <code class="font-mono text-[11px]">/services</code> и т.д.; форма внизу этой страницы:
              <code class="font-mono text-[11px]">#page-inquiry</code>; внешние ссылки — полный URL.
            </p>
            <div
              v-for="(row, hi) in d.heroButtons"
              :key="hi"
              class="space-y-2 rounded border border-mts-border bg-mts-bg/50 p-3"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Кнопка {{ hi + 1 }}</p>
                <button
                  type="button"
                  class="btn-secondary shrink-0 px-2 py-1 text-xs text-red-700"
                  @click="removeHeroButton(hi)"
                >
                  Удалить
                </button>
              </div>
              <div>
                <label :class="sectionLabel">Подпись</label>
                <AdminThemedTextField v-model="row.label" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Ссылка</label>
                <input
                  v-model="row.href"
                  type="text"
                  :class="sectionInput"
                  placeholder="#page-inquiry или /contacts"
                />
              </div>
            </div>
            <button
              v-if="d.heroButtons.length < 2"
              type="button"
              class="btn-secondary inline-flex items-center gap-2"
              @click="addHeroButton"
            >
              <Plus class="h-4 w-4" />
              Добавить кнопку
            </button>
          </div>
          <AdminHeroImageField v-model="d.heroBackgroundImage" label="Фон hero (по умолчанию из макета страницы)" />
        </AdminCollapsibleSection>

        <!-- Directions -->
        <AdminCollapsibleSection
          :title="`${indexInOrder('directions') + 2}. ${sectionOrderRowLabel('directions')}`"
          :collapsed="collapsed.directions"
          :visible="sectionVisible('directions')"
          :can-move-up="canMove('directions', -1)"
          :can-move-down="canMove('directions', 1)"
          @update:collapsed="(v) => (collapsed.directions = v)"
          @update:visible="(v) => setSectionVisible('directions', v)"
          @move-up="moveSection('directions', -1)"
          @move-down="moveSection('directions', 1)"
        >
          <div class="space-y-6">
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <AdminThemedTextField v-model="d.directionsSection.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Лид под заголовком</label>
              <AdminThemedTextField v-model="d.directionsSection.lead" />
            </div>
            <div
              class="flex flex-col gap-3 rounded border border-dashed border-mts-border bg-mts-bg/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p class="font-body text-xs text-mts-text-secondary">
                Выберите готовую страницу или создайте новую. После создания нажмите «Обновить список».
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
                  :disabled="contentPagesCatalogLoading"
                  @click="loadContentPagesCatalog"
                >
                  {{ contentPagesCatalogLoading ? 'Загрузка…' : 'Обновить список' }}
                </button>
                <AdminPlusLink to="/admin/content-pages/new" variant="outline">Новая страница</AdminPlusLink>
                <NuxtLink to="/admin/content-pages" class="font-body text-xs text-mts-accent underline-offset-2 hover:underline"
                  >Все страницы</NuxtLink
                >
              </div>
            </div>
            <div
              v-for="(row, i) in d.directions"
              :key="i"
              class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Карточка {{ i + 1 }}</p>
                <button
                  v-if="d.directions.length > 1"
                  type="button"
                  class="btn-secondary shrink-0 px-2 py-1 text-xs text-red-700"
                  @click="removeDirection(i)"
                >
                  Удалить карточку
                </button>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label :class="sectionLabel">Иконка</label>
                  <AdminIconSelect
                    :icon="row.icon"
                    :hide-icon="row.hideIcon"
                    :options="crewingIconSelectOptions"
                    @update:icon="(v) => (row.icon = v)"
                    @update:hide-icon="(v) => (row.hideIcon = v)"
                  />
                </div>
                <div>
                  <label :class="sectionLabel">Заголовок</label>
                  <AdminThemedTextField v-model="row.title" :multiline="false" />
                </div>
              </div>
              <div>
                <label :class="sectionLabel">Текст</label>
                <AdminThemedTextField v-model="row.text" />
              </div>
              <div>
                <label :class="sectionLabel">Детальная страница</label>
                <AdminSelect
                  :model-value="row.detailSlug ?? ''"
                  :options="directionDetailOptionsForRow(row)"
                  placeholder="Без отдельной страницы"
                  search-placeholder="Название или slug…"
                  @update:model-value="(v) => (row.detailSlug = v)"
                />
                <p class="mt-2 font-body text-xs text-mts-text-secondary">
                  Публичный URL —
                  <code class="font-mono text-[11px] text-mts-text">{{ slug }}/…</code>
                  <template v-if="directionPreviewPath(row.detailSlug ?? '')">
                    —
                    <NuxtLink
                      :to="directionPreviewPath(row.detailSlug ?? '')!"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-mts-accent underline-offset-2 hover:underline"
                      >на сайте ↗</NuxtLink
                    >
                  </template>
                  <template v-if="contentPageAdminEditPath(row.detailSlug)">
                    —
                    <NuxtLink
                      :to="contentPageAdminEditPath(row.detailSlug)!"
                      class="text-mts-accent underline-offset-2 hover:underline"
                      >редактировать</NuxtLink
                    >
                  </template>
                </p>
              </div>
            </div>
            <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addDirection">
              <Plus class="h-4 w-4" />
              Добавить карточку
            </button>
          </div>
        </AdminCollapsibleSection>

        <!-- Checklist -->
        <AdminCollapsibleSection
          :title="`${indexInOrder('checklist') + 2}. ${sectionOrderRowLabel('checklist')}`"
          :collapsed="collapsed.checklist"
          :visible="sectionVisible('checklist')"
          :can-move-up="canMove('checklist', -1)"
          :can-move-down="canMove('checklist', 1)"
          @update:collapsed="(v) => (collapsed.checklist = v)"
          @update:visible="(v) => setSectionVisible('checklist', v)"
          @move-up="moveSection('checklist', -1)"
          @move-down="moveSection('checklist', 1)"
        >
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <AdminThemedTextField v-model="d.checklist.sectionTitle" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Вводный абзац (если есть пункты)</label>
              <AdminThemedTextField v-model="d.checklist.intro" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">
              На сайте блок целиком скрыт, если нет ни одного пункта с непустым заголовком или текстом.
            </p>
            <div
              v-for="(sec, si) in d.checklist.sections"
              :key="si"
              class="space-y-4 border border-mts-border bg-mts-bg/50 p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Секция {{ si + 1 }}</p>
                <button
                  type="button"
                  class="btn-secondary shrink-0 px-2 py-1 text-xs text-red-700"
                  @click="removeChecklistSection(si)"
                >
                  Удалить секцию
                </button>
              </div>
              <div>
                <label :class="sectionLabel">Подзаголовок секции (I, II, …)</label>
                <AdminThemedTextField v-model="sec.heading" :multiline="false" />
              </div>
              <div
                v-for="(pt, pi) in sec.points"
                :key="pi"
                class="space-y-2 border border-dashed border-mts-border bg-white p-3"
              >
                <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Пункт {{ pi + 1 }}</p>
                <div>
                  <label :class="sectionLabel">Заголовок пункта</label>
                  <AdminThemedTextField v-model="pt.title" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Текст</label>
                  <AdminThemedTextField v-model="pt.text" />
                </div>
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-1 text-xs text-red-700"
                  @click="removeChecklistPoint(si, pi)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  Удалить пункт
                </button>
              </div>
              <button type="button" class="btn-secondary inline-flex items-center gap-2 text-sm" @click="addChecklistPoint(si)">
                <Plus class="h-4 w-4" />
                Добавить пункт в секцию
              </button>
            </div>
            <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addChecklistSection">
              <Plus class="h-4 w-4" />
              Добавить секцию
            </button>
        </AdminCollapsibleSection>

        <!-- Principles -->
        <AdminCollapsibleSection
          :title="`${indexInOrder('principles') + 2}. ${sectionOrderRowLabel('principles')}`"
          :collapsed="collapsed.principles"
          :visible="sectionVisible('principles')"
          :can-move-up="canMove('principles', -1)"
          :can-move-down="canMove('principles', 1)"
          @update:collapsed="(v) => (collapsed.principles = v)"
          @update:visible="(v) => setSectionVisible('principles', v)"
          @move-up="moveSection('principles', -1)"
          @move-down="moveSection('principles', 1)"
        >
            <div>
              <label :class="sectionLabel">Заголовок блока</label>
              <AdminThemedTextField v-model="d.principles.title" :multiline="false" />
            </div>
            <div v-for="(line, pi) in d.principles.items" :key="pi" class="flex items-stretch gap-2">
              <div class="min-w-0 flex-1">
                <AdminThemedTextField v-model="d.principles.items[pi]" :multiline="false" />
              </div>
              <button
                v-if="d.principles.items.length > 1"
                type="button"
                class="btn-secondary shrink-0 px-3 text-red-700"
                aria-label="Удалить"
                @click="removePrinciple(pi)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
            <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addPrinciple">
              <Plus class="h-4 w-4" />
              Добавить пункт
            </button>
        </AdminCollapsibleSection>

        <!-- Audience -->
        <AdminCollapsibleSection
          :title="`${indexInOrder('audience') + 2}. ${sectionOrderRowLabel('audience')}`"
          :collapsed="collapsed.audience"
          :visible="sectionVisible('audience')"
          :can-move-up="canMove('audience', -1)"
          :can-move-down="canMove('audience', 1)"
          @update:collapsed="(v) => (collapsed.audience = v)"
          @update:visible="(v) => setSectionVisible('audience', v)"
          @move-up="moveSection('audience', -1)"
          @move-down="moveSection('audience', 1)"
        >
          <div>
            <label :class="sectionLabel">Заголовок</label>
            <AdminThemedTextField v-model="d.audience.title" :multiline="false" />
          </div>
          <div>
            <label :class="sectionLabel">Абзац 1</label>
            <AdminThemedTextField v-model="d.audience.paragraph1" />
          </div>
          <div>
            <label :class="sectionLabel">Абзац 2</label>
            <AdminThemedTextField v-model="d.audience.paragraph2" />
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label :class="sectionLabel">Текст кнопки</label>
              <AdminThemedTextField v-model="d.audience.ctaLabel" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Ссылка кнопки (путь, напр. /contacts)</label>
              <input
                v-model="d.audience.ctaHref"
                type="text"
                :class="sectionInput"
                placeholder="/contacts"
              />
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- Custom marketing sections -->
        <section class="relative border border-mts-border bg-white shadow-tech">
          <CommonAccentCorners />
          <div class="border-b border-mts-border p-6">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">
              Пользовательские секции
            </h2>
            <p class="mt-2 max-w-7xl font-body text-xs text-mts-text-secondary">
              Порядок в списке выше задаётся теми же строками с ключами
              <code class="font-mono text-[11px]">custom:…</code>. При добавлении и удалении блоков структура
              совпадает на RU и EN; тексты редактируются отдельно для каждого языка.
            </p>
            <button type="button" class="btn-secondary mt-4 inline-flex items-center gap-2" @click="addCustomSection">
              <Plus class="h-4 w-4" />
              Добавить секцию
            </button>
          </div>
        </section>

        <template v-for="sid in d.sectionOrder.filter((x) => x.startsWith('custom:'))" :key="sid">
          <AdminCollapsibleSection
            v-if="getCustomSectionById(sid.slice(7))"
            :title="`Секция: ${getCustomSectionById(sid.slice(7))!.title.trim() || 'Без названия'}`"
            :collapsed="collapsed['custom-' + sid.slice(7)] !== false"
            :visible="sectionVisible(sid)"
            :can-move-up="canMove(sid, -1)"
            :can-move-down="canMove(sid, 1)"
            @update:collapsed="(v) => (collapsed['custom-' + sid.slice(7)] = v)"
            @update:visible="(v) => setSectionVisible(sid, v)"
            @move-up="moveSection(sid, -1)"
            @move-down="moveSection(sid, 1)"
          >
            <template #headerExtra>
              <button
                type="button"
                class="btn-secondary shrink-0 px-2 py-1 text-xs text-red-700"
                @click.stop="removeCustomSection(sid.slice(7))"
              >
                Удалить секцию
              </button>
            </template>
            <div class="space-y-6">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="md:col-span-2">
                  <label :class="sectionLabel">Заголовок секции (на сайте)</label>
                  <input
                    v-model="getCustomSectionById(sid.slice(7))!.title"
                    type="text"
                    :class="sectionInput"
                    placeholder="Например: Дополнительные услуги"
                  />
                </div>
                <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text md:col-span-2">
                  <input v-model="getCustomSectionById(sid.slice(7))!.showTitle" type="checkbox" class="mts-checkbox" />
                  Показывать заголовок секции
                </label>
              </div>

              <div
                v-for="(block, bi) in getCustomSectionById(sid.slice(7))!.blocks"
                :key="block.id"
                class="space-y-4 rounded border border-mts-border bg-mts-bg/40 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                    Блок {{ bi + 1 }} ·
                    {{
                      block.type === 'cards'
                        ? 'Карточки'
                        : block.type === 'text'
                          ? 'Текст'
                          : 'Текст + изображение / слайдер'
                    }}
                  </p>
                  <div class="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      class="btn-secondary p-1.5 disabled:opacity-40"
                      :disabled="bi === 0"
                      aria-label="Выше"
                      @click="moveCustomBlock(sid.slice(7), bi, -1)"
                    >
                      <ArrowUp class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="btn-secondary p-1.5 disabled:opacity-40"
                      :disabled="bi >= getCustomSectionById(sid.slice(7))!.blocks.length - 1"
                      aria-label="Ниже"
                      @click="moveCustomBlock(sid.slice(7), bi, 1)"
                    >
                      <ArrowDown class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="btn-secondary px-2 py-1 text-xs text-red-700"
                      @click="removeCustomBlock(sid.slice(7), bi)"
                    >
                      Удалить блок
                    </button>
                  </div>
                </div>

                <template v-if="block.type === 'cards'">
                  <div
                    v-for="(card, ci) in block.items"
                    :key="ci"
                    class="space-y-3 border border-dashed border-mts-border bg-white p-3"
                  >
                    <div class="flex flex-wrap items-start justify-between gap-2">
                      <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Карточка {{ ci + 1 }}</p>
                      <button
                        v-if="block.items.length > 1"
                        type="button"
                        class="btn-secondary px-2 py-1 text-xs text-red-700"
                        @click="removeCardItem(sid.slice(7), bi, ci)"
                      >
                        Удалить
                      </button>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                      <div>
                        <label :class="sectionLabel">Иконка</label>
                        <AdminIconSelect
                          :icon="card.icon"
                          :hide-icon="card.hideIcon"
                          :options="crewingIconSelectOptions"
                          @update:icon="(v) => (card.icon = v)"
                          @update:hide-icon="(v) => (card.hideIcon = v)"
                        />
                      </div>
                      <div>
                        <label :class="sectionLabel">Заголовок</label>
                        <AdminThemedTextField v-model="card.title" :multiline="false" />
                      </div>
                    </div>
                    <div>
                      <label :class="sectionLabel">Текст</label>
                      <AdminThemedTextField v-model="card.text" />
                    </div>
                    <div>
                      <label :class="sectionLabel">Детальная страница</label>
                      <AdminSelect
                        :model-value="card.detailSlug ?? ''"
                        :options="directionDetailOptionsForRow(card)"
                        placeholder="Без отдельной страницы"
                        search-placeholder="Название или slug…"
                        @update:model-value="(v) => (card.detailSlug = v)"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn-secondary inline-flex items-center gap-2 text-sm"
                    @click="addCardItem(sid.slice(7), bi)"
                  >
                    <Plus class="h-4 w-4" />
                    Добавить карточку
                  </button>
                </template>

                <template v-else-if="block.type === 'text'">
                  <div>
                    <label :class="sectionLabel">Заголовок</label>
                    <AdminThemedTextField v-model="block.title" :multiline="false" />
                  </div>
                  <div>
                    <label :class="sectionLabel">Подзаголовок</label>
                    <AdminThemedTextField v-model="block.subtitle" :multiline="false" />
                  </div>
                  <div>
                    <label :class="sectionLabel">Описание (Markdown)</label>
                    <AdminThemedTextField v-model="block.description" />
                  </div>
                </template>

                <template v-else-if="block.type === 'split'">
                  <div>
                    <label :class="sectionLabel">Текст слева (Markdown)</label>
                    <AdminThemedTextField v-model="block.leftText" />
                  </div>
                  <div class="grid gap-4 md:grid-cols-2 md:items-end">
                    <div>
                      <label :class="sectionLabel">Доля ширины левой колонки, %</label>
                      <AdminInputNumberStepper v-model="block.leftWidthPercent" :min="10" :max="90" :step="5" />
                      <p class="mt-1 font-body text-[11px] text-mts-text-secondary">
                        Правая колонка занимает оставшуюся ширину; между колонками есть отступ (gap).
                      </p>
                    </div>
                    <div>
                      <label :class="sectionLabel">Справа</label>
                      <AdminSelect v-model="block.rightMode" :options="splitRightModeOptions" />
                    </div>
                  </div>
                  <div v-for="(img, ii) in block.images" :key="ii" class="flex flex-wrap items-end gap-2">
                    <div class="min-w-0 flex-1">
                      <label :class="sectionLabel">URL изображения {{ ii + 1 }}</label>
                      <input v-model="block.images[ii]" type="text" :class="sectionInput" placeholder="/images/…" />
                    </div>
                    <button
                      v-if="block.images.length > 1"
                      type="button"
                      class="btn-secondary px-2 py-2 text-xs text-red-700"
                      @click="removeSplitImageRow(sid.slice(7), bi, ii)"
                    >
                      Удалить
                    </button>
                  </div>
                  <button
                    type="button"
                    class="btn-secondary inline-flex items-center gap-2 text-sm"
                    @click="addSplitImageRow(sid.slice(7), bi)"
                  >
                    <Plus class="h-4 w-4" />
                    Добавить изображение в галерею
                  </button>
                </template>
              </div>

              <div class="flex flex-wrap gap-2 border-t border-mts-border pt-4">
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-2 text-sm"
                  @click="addCustomBlock(sid.slice(7), 'cards')"
                >
                  <Plus class="h-4 w-4" />
                  Блок «Карточки»
                </button>
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-2 text-sm"
                  @click="addCustomBlock(sid.slice(7), 'text')"
                >
                  <Plus class="h-4 w-4" />
                  Блок «Текст»
                </button>
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-2 text-sm"
                  @click="addCustomBlock(sid.slice(7), 'split')"
                >
                  <Plus class="h-4 w-4" />
                  Блок «Текст + медиа»
                </button>
              </div>
            </div>
          </AdminCollapsibleSection>
        </template>

        <section class="relative border border-mts-border bg-white p-6 shadow-tech">
          <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.showInquiryForm" type="checkbox" class="mts-checkbox" />
            Показать форму заявки внизу страницы
          </label>
        </section>

        <div class="flex justify-end">
          <button type="button" :disabled="saving" class="btn-primary px-8 disabled:opacity-50" @click="submit">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
