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
  PageBreadcrumbTone,
} from '~/types'
import { incomingCmsValueToHtml } from '~/utils/adminHtmlField'
import { plainMetaString } from '~/utils/adminThemedTextCodec'
import { defaultLinePageData, mergeLinePageData } from '~/utils/pageDefaults'
import { themeTitleTriple } from '~/utils/themeFormattedTitle'
import {
  CREWING_MANAGEMENT_V2_SECTION_ORDER,
  defaultCrewingManagementContent,
  mergeCrewingManagementContent,
} from '~/utils/crewingManagementPageDefaults'
import AdminIconSelect from '~/components/admin/AdminIconSelect.vue'
import AdminImageListField from '~/components/admin/AdminImageListField.vue'
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
  SHIP_MANAGEMENT_V2_SECTION_ADMIN_LABELS,
} from '~/utils/lineMarketingPages'
import {
  defaultShipManagementContent,
  mergeShipManagementContent,
  SHIP_MANAGEMENT_V2_SECTION_ORDER,
} from '~/utils/shipManagementPageDefaults'
import {
  CUSTOM_SECTION_BREADCRUMB_TONE_ADMIN_OPTIONS,
  HERO_BREADCRUMB_TONE_ADMIN_OPTIONS,
} from '~/utils/pageBreadcrumbTone'
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
const editorRevision = ref(0)

const data = ref<Record<MarineContentLocale, CrewingPageData> | null>(null)

const d = computed(() => {
  if (!data.value || !slug.value) {
    return null
  }
  return data.value[localeTab.value]
})

const isShipV2 = computed(
  () => slug.value === 'ship-management' && d.value?.shipPageLayout === 'v2' && !!d.value?.shipV2,
)

const isCrewingV2 = computed(
  () => slug.value === 'crewing-management' && d.value?.crewingPageLayout === 'v2' && !!d.value?.crewingV2,
)

const showLegacyLineSections = computed(() => !isCrewingV2.value && !isShipV2.value)

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
    if (cur.crewingPageLayout === 'v2' || cur.shipPageLayout === 'v2') {
      return
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
  crewV2sec1: false,
  crewV2approach: true,
  crewV2services: true,
  crewV2advantages: true,
  crewV2trust: true,
  crewV2cta: true,
  shipV2approach: true,
  shipV2services: true,
  shipV2advantages: true,
  shipV2closing: true,
})

const crewingStructureOptions: AdminSelectOption[] = [
  { value: 'v2', label: 'Новая структура (секции как на «О компании»)' },
  { value: 'legacy', label: 'Классическая (направления, чек-лист, принципы)' },
]

function onCrewingStructureChange(mode: string) {
  if (!data.value) {
    return
  }
  const toV2 = mode === 'v2'
  for (const loc of MARINE_CONTENT_LOCALES) {
    const cur = data.value[loc]
    cur.crewingPageLayout = toV2 ? 'v2' : 'legacy'
    if (toV2) {
      cur.crewingV2 = mergeCrewingManagementContent(cur.crewingV2, defaultCrewingManagementContent(loc))
      const customs = cur.sectionOrder.filter((k) => k.startsWith('custom:'))
      cur.sectionOrder = [...CREWING_MANAGEMENT_V2_SECTION_ORDER, ...customs]
      const vis = { ...cur.sectionVisibility }
      for (const id of CREWING_MANAGEMENT_V2_SECTION_ORDER) {
        if (vis[id] === undefined) {
          vis[id] = true
        }
      }
      cur.sectionVisibility = vis
    }
  }
}

function normCmsHtml(s: string) {
  return incomingCmsValueToHtml(s ?? '')
}

function normalizeCrewingV2Payload(page: CrewingPageData) {
  if (page.crewingPageLayout !== 'v2' || !page.crewingV2) {
    return
  }
  const v = page.crewingV2
  const n = normCmsHtml
  v.sec1Hero.title = n(v.sec1Hero.title)
  v.sec1Hero.lead = n(v.sec1Hero.lead)
  v.sec1Hero.body = n(v.sec1Hero.body)
  v.sec2Approach.title = n(v.sec2Approach.title)
  v.sec2Approach.body = n(v.sec2Approach.body)
  v.sec2Approach.cardsHeading = n(v.sec2Approach.cardsHeading)
  v.sec2Approach.cards.forEach((c) => {
    c.title = n(c.title)
    c.text = n(c.text)
  })
  v.sec3Services.title = n(v.sec3Services.title)
  v.sec3Services.body = n(v.sec3Services.body)
  v.sec3Services.cards.forEach((c) => {
    c.title = n(c.title)
    c.text = n(c.text)
  })
  v.sec4Advantages.title = n(v.sec4Advantages.title)
  v.sec4Advantages.cards.forEach((c) => {
    c.title = n(c.title)
    c.text = n(c.text)
  })
  v.sec5Trust.title = n(v.sec5Trust.title)
  v.sec5Trust.paragraph1 = n(v.sec5Trust.paragraph1)
  v.sec5Trust.paragraph2 = n(v.sec5Trust.paragraph2)
  v.sec6Cta.title = n(v.sec6Cta.title)
  v.sec6Cta.body = n(v.sec6Cta.body)
}

function addCrewV2Card(sec: 'approach' | 'services' | 'advantages') {
  if (!d.value?.crewingV2) {
    return
  }
  const v = d.value.crewingV2
  const max = sec === 'services' ? 5 : 3
  if (sec === 'approach' && v.sec2Approach.cards.length >= max) {
    return
  }
  if (sec === 'services' && v.sec3Services.cards.length >= max) {
    return
  }
  if (sec === 'advantages' && v.sec4Advantages.cards.length >= max) {
    return
  }
  const blank = { title: '', text: '' }
  if (sec === 'approach') {
    v.sec2Approach.cards.push({ ...blank })
  } else if (sec === 'services') {
    v.sec3Services.cards.push({ ...blank })
  } else {
    v.sec4Advantages.cards.push({ ...blank })
  }
}

function moveCrewV2Card(sec: 'approach' | 'services' | 'advantages', index: number, delta: number) {
  if (!d.value?.crewingV2) {
    return
  }
  const v = d.value.crewingV2
  const arr =
    sec === 'approach' ? v.sec2Approach.cards : sec === 'services' ? v.sec3Services.cards : v.sec4Advantages.cards
  const j = index + delta
  if (j < 0 || j >= arr.length) {
    return
  }
  const a = arr[index]!
  const b = arr[j]!
  arr[index] = b
  arr[j] = a
}

async function removeCrewV2Card(sec: 'approach' | 'services' | 'advantages', index: number) {
  if (!d.value?.crewingV2) {
    return
  }
  const min = 1
  const v = d.value.crewingV2
  const ok = await confirm({
    message: 'Удалить эту карточку?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  if (sec === 'approach') {
    if (v.sec2Approach.cards.length <= min) {
      return
    }
    v.sec2Approach.cards.splice(index, 1)
  } else if (sec === 'services') {
    if (v.sec3Services.cards.length <= min) {
      return
    }
    v.sec3Services.cards.splice(index, 1)
  } else {
    if (v.sec4Advantages.cards.length <= min) {
      return
    }
    v.sec4Advantages.cards.splice(index, 1)
  }
}

function onShipStructureChange(mode: string) {
  if (!data.value) {
    return
  }
  const toV2 = mode === 'v2'
  for (const loc of MARINE_CONTENT_LOCALES) {
    const cur = data.value[loc]
    cur.shipPageLayout = toV2 ? 'v2' : 'legacy'
    if (toV2) {
      cur.shipV2 = mergeShipManagementContent(cur.shipV2, defaultShipManagementContent(loc))
      const customs = cur.sectionOrder.filter((k) => k.startsWith('custom:'))
      cur.sectionOrder = [...SHIP_MANAGEMENT_V2_SECTION_ORDER, ...customs]
      const vis = { ...cur.sectionVisibility }
      for (const id of SHIP_MANAGEMENT_V2_SECTION_ORDER) {
        if (vis[id] === undefined) {
          vis[id] = true
        }
      }
      cur.sectionVisibility = vis
    }
  }
}

function normalizeShipV2Payload(page: CrewingPageData) {
  if (page.shipPageLayout !== 'v2' || !page.shipV2) {
    return
  }
  const v = page.shipV2
  const n = normCmsHtml
  v.sec1Hero.title = n(v.sec1Hero.title)
  v.sec1Hero.lead = n(v.sec1Hero.lead)
  v.sec1Hero.body = n(v.sec1Hero.body)
  v.sec2Approach.title = n(v.sec2Approach.title)
  v.sec2Approach.body = n(v.sec2Approach.body)
  v.sec2Approach.cardsHeading = n(v.sec2Approach.cardsHeading)
  v.sec2Approach.cards.forEach((c) => {
    c.title = n(c.title)
    c.text = n(c.text)
  })
  v.sec3Services.title = n(v.sec3Services.title)
  v.sec3Services.body = n(v.sec3Services.body)
  v.sec3Services.cards.forEach((c) => {
    c.title = n(c.title)
    c.text = n(c.text)
  })
  v.sec4Advantages.title = n(v.sec4Advantages.title)
  v.sec4Advantages.cards.forEach((c) => {
    c.title = n(c.title)
    c.text = n(c.text)
  })
  v.sec5Closing.title = n(v.sec5Closing.title)
  v.sec5Closing.paragraph1 = n(v.sec5Closing.paragraph1)
  v.sec5Closing.paragraph2 = n(v.sec5Closing.paragraph2)
}

function addShipV2Card(sec: 'approach' | 'services' | 'advantages') {
  if (!d.value?.shipV2) {
    return
  }
  const v = d.value.shipV2
  const max = sec === 'services' ? 5 : 3
  if (sec === 'approach' && v.sec2Approach.cards.length >= max) {
    return
  }
  if (sec === 'services' && v.sec3Services.cards.length >= max) {
    return
  }
  if (sec === 'advantages' && v.sec4Advantages.cards.length >= max) {
    return
  }
  const blank = { title: '', text: '' }
  if (sec === 'approach') {
    v.sec2Approach.cards.push({ ...blank })
  } else if (sec === 'services') {
    v.sec3Services.cards.push({ ...blank })
  } else {
    v.sec4Advantages.cards.push({ ...blank })
  }
}

async function removeShipV2Card(sec: 'approach' | 'services' | 'advantages', index: number) {
  if (!d.value?.shipV2) {
    return
  }
  const min = 1
  const v = d.value.shipV2
  const ok = await confirm({
    message: 'Удалить эту карточку?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  if (sec === 'approach') {
    if (v.sec2Approach.cards.length <= min) {
      return
    }
    v.sec2Approach.cards.splice(index, 1)
  } else if (sec === 'services') {
    if (v.sec3Services.cards.length <= min) {
      return
    }
    v.sec3Services.cards.splice(index, 1)
  } else {
    if (v.sec4Advantages.cards.length <= min) {
      return
    }
    v.sec4Advantages.cards.splice(index, 1)
  }
}

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
  if (slug.value === 'ship-management' && d.value?.shipPageLayout === 'v2') {
    const shipLab = SHIP_MANAGEMENT_V2_SECTION_ADMIN_LABELS[sid as keyof typeof SHIP_MANAGEMENT_V2_SECTION_ADMIN_LABELS]
    if (shipLab) {
      return shipLab
    }
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
      columns: 3,
      itemsAlign: 'left',
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

  const sorted = [...pages].sort((a, b) =>
    (plainMetaString(a.title) || a.slug).localeCompare(plainMetaString(b.title) || b.slug, 'ru'),
  )
  for (const p of sorted) {
    if (lineSlug && p.slug === lineSlug) {
      continue
    }
    if (seen.has(p.slug)) {
      continue
    }
    seen.add(p.slug)
    opts.push({ value: p.slug, label: `${plainMetaString(p.title) || p.slug} · ${p.slug}` })
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

async function loadLinePage(): Promise<void> {
  if (!canManageContentPages.value) {
    await navigateTo('/admin')
    return
  }
  if (!slug.value) {
    await navigateTo('/admin')
    return
  }
  loading.value = true
  existingId.value = null
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
    editorRevision.value += 1
    loading.value = false
  }
  await loadContentPagesCatalog()
}

watch(
  slug,
  () => {
    void loadLinePage()
  },
  { immediate: true },
)

onMounted(async () => {
  await loadContentPagesCatalog()
})

async function submit() {
  const s = slug.value
  if (!s || !data.value) {
    return
  }
  if (import.meta.client && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  await nextTick()
  const inq = data.value[localeTab.value].showInquiryForm
  const inquiryForm = data.value[localeTab.value].inquiryForm
  const hideInquiryCardHeading = data.value[localeTab.value].hideInquiryFormCardHeading
  const hideInquiryIntro = data.value[localeTab.value].hideInquiryFormIntro
  const heroBg = data.value[localeTab.value].heroBackgroundImage
  const sectionOrder = data.value[localeTab.value].sectionOrder
  const sectionVisibility = data.value[localeTab.value].sectionVisibility
  const hideFooter = data.value[localeTab.value].hideFooter
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].showInquiryForm = inq
    data.value[loc].inquiryForm = inquiryForm
      ? {
          vesselTypes: [...(inquiryForm.vesselTypes ?? [])],
          requiredServices: [...(inquiryForm.requiredServices ?? [])],
          vesselTypeLabels: { ...(inquiryForm.vesselTypeLabels ?? {}) },
          requiredServiceLabels: { ...(inquiryForm.requiredServiceLabels ?? {}) },
        }
      : undefined
    data.value[loc].hideInquiryFormCardHeading = hideInquiryCardHeading
    data.value[loc].hideInquiryFormIntro = hideInquiryIntro
    data.value[loc].heroBackgroundImage = heroBg
    data.value[loc].sectionOrder = [...sectionOrder]
    data.value[loc].sectionVisibility = { ...sectionVisibility }
    data.value[loc].hideFooter = hideFooter
  }
  saving.value = true
  try {
    const translations = {} as Record<
      MarineContentLocale,
      { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }
    >
    for (const loc of MARINE_CONTENT_LOCALES) {
      const page = data.value[loc]
      normalizeCrewingV2Payload(page)
      normalizeShipV2Payload(page)
      if (page.crewingPageLayout === 'v2' && page.crewingV2) {
        page.hero.lead = page.crewingV2.sec1Hero.lead
        page.hero.titleFormatted = themeTitleTriple(page.crewingV2.sec1Hero.title, '', '')
      }
      if (page.shipPageLayout === 'v2' && page.shipV2) {
        page.hero.lead = page.shipV2.sec1Hero.lead
        page.hero.titleFormatted = themeTitleTriple(page.shipV2.sec1Hero.title, '', '')
      }
      const titles = LINE_MARKETING_PAGE_CONTENT_TITLES[s]
      translations[loc] = {
        title: titles[loc],
        excerpt: '',
        body: JSON.stringify(page),
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
      <div class="mx-auto flex h-16 max-w-[1600px] items-center px-6 lg:px-12">
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

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <div v-if="loading || !d" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <section
          v-if="slug === 'crewing-management'"
          class="relative space-y-3 border border-mts-border bg-white p-6 shadow-tech"
        >
          <label :class="sectionLabel">Структура страницы «Крюинг-менеджмент»</label>
          <AdminSelect
            :model-value="d.crewingPageLayout === 'v2' ? 'v2' : 'legacy'"
            :options="crewingStructureOptions"
            class="max-w-xl"
            @update:model-value="onCrewingStructureChange"
          />
          <p class="font-body text-xs text-mts-text-secondary">
            Классическая вёрстка сохраняет направления, чек-лист и блоки принципов/аудитории. Новая — шесть секций с
            rich-текстом (TipTap), порядок и видимость как у пользовательских блоков ниже.
          </p>
        </section>

        <section
          v-if="slug === 'ship-management'"
          class="relative space-y-3 border border-mts-border bg-white p-6 shadow-tech"
        >
          <label :class="sectionLabel">Структура страницы «Судовой менеджмент»</label>
          <AdminSelect
            :model-value="d.shipPageLayout === 'v2' ? 'v2' : 'legacy'"
            :options="crewingStructureOptions"
            class="max-w-xl"
            @update:model-value="onShipStructureChange"
          />
          <p class="font-body text-xs text-mts-text-secondary">
            Классическая вёрстка — направления, чек-лист и блоки принципов/аудитории. Новая — пять секций (технический
            менеджмент), Rich Text через TipTap; отдельного блока CTA перед формой нет — текст призыва в финальной секции.
          </p>
        </section>

        <!-- Hero — фиксирована, не скрывается, не переносится. -->
        <AdminCollapsibleSection
          title="1. Hero"
          :collapsed="collapsed.hero"
          @update:collapsed="(v) => (collapsed.hero = v)"
        >
          <template v-if="isCrewingV2 && d.crewingV2">
            <div>
              <label :class="sectionLabel">Подпись над заголовком (как в макете)</label>
              <AdminThemedTextField
                :key="`hero-label-${slug}-${localeTab}-${editorRevision}`"
                v-model="d.hero.label"
                :multiline="false"
              />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок (H1)</label>
              <AdminThemedTextField v-model="d.crewingV2.sec1Hero.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Лид</label>
              <AdminThemedTextField v-model="d.crewingV2.sec1Hero.lead" />
            </div>
            <div>
              <label :class="sectionLabel">Текст под лидом (TipTap)</label>
              <AdminRichTextEditor v-model="d.crewingV2.sec1Hero.body" />
            </div>
          </template>
          <template v-else-if="isShipV2 && d.shipV2">
            <div>
              <label :class="sectionLabel">Подпись над заголовком (как в макете)</label>
              <AdminThemedTextField
                :key="`ship-hero-label-${slug}-${localeTab}-${editorRevision}`"
                v-model="d.hero.label"
                :multiline="false"
              />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок (H1)</label>
              <AdminThemedTextField v-model="d.shipV2.sec1Hero.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Лид</label>
              <AdminThemedTextField v-model="d.shipV2.sec1Hero.lead" />
            </div>
            <div>
              <label :class="sectionLabel">Текст под лидом (TipTap)</label>
              <AdminRichTextEditor v-model="d.shipV2.sec1Hero.body" />
            </div>
          </template>
          <template v-else>
            <div>
              <label :class="sectionLabel">Подпись над заголовком (как в макете)</label>
              <AdminThemedTextField
                :key="`hero-label-${slug}-${localeTab}-${editorRevision}`"
                v-model="d.hero.label"
                :multiline="false"
              />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemeTitleEditor
                :key="`hero-title-${slug}-${localeTab}-${editorRevision}`"
                v-model="d.hero.titleFormatted"
              />
            </div>
            <div>
              <label :class="sectionLabel">Лид</label>
              <AdminThemedTextField
                :key="`hero-lead-${slug}-${localeTab}-${editorRevision}`"
                v-model="d.hero.lead"
              />
            </div>
          </template>
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
          <div>
            <label :class="sectionLabel">Цвет хлебных крошек в hero</label>
            <AdminSelect
              :model-value="d.heroBreadcrumbTone ?? 'auto'"
              :options="HERO_BREADCRUMB_TONE_ADMIN_OPTIONS"
              @update:model-value="(v) => (d.heroBreadcrumbTone = v as PageBreadcrumbTone)"
            />
            <p class="mt-2 font-body text-xs text-mts-text-secondary">
              «Авто» — светлый текст при структуре v2 и непустом фоне hero.
            </p>
          </div>
        </AdminCollapsibleSection>

        <template v-if="showLegacyLineSections">
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
        </template>

        <template v-if="isCrewingV2 && d.crewingV2">
          <AdminCollapsibleSection
            :title="`${indexInOrder('approach') + 2}. ${sectionOrderRowLabel('approach')}`"
            :collapsed="collapsed.crewV2approach"
            :visible="sectionVisible('approach')"
            :can-move-up="canMove('approach', -1)"
            :can-move-down="canMove('approach', 1)"
            @update:collapsed="(v) => (collapsed.crewV2approach = v)"
            @update:visible="(v) => setSectionVisible('approach', v)"
            @move-up="moveSection('approach', -1)"
            @move-down="moveSection('approach', 1)"
          >
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <AdminThemedTextField v-model="d.crewingV2.sec2Approach.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Вводный текст</label>
              <AdminRichTextEditor v-model="d.crewingV2.sec2Approach.body" />
            </div>
            <div>
              <label :class="sectionLabel">Микро-заголовок над карточками</label>
              <AdminThemedTextField v-model="d.crewingV2.sec2Approach.cardsHeading" :multiline="false" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">Карточки принципов — до 3 штук.</p>
            <div
              v-for="(card, ci) in d.crewingV2.sec2Approach.cards"
              :key="`c2-${ci}`"
              class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Карточка {{ ci + 1 }}</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                    :disabled="ci === 0"
                    title="Выше"
                    aria-label="Выше"
                    @click="moveCrewV2Card('approach', ci, -1)"
                  >
                    <ArrowUp class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                    :disabled="ci >= d.crewingV2.sec2Approach.cards.length - 1"
                    title="Ниже"
                    aria-label="Ниже"
                    @click="moveCrewV2Card('approach', ci, 1)"
                  >
                    <ArrowDown class="h-4 w-4" />
                  </button>
                  <button
                    v-if="d.crewingV2.sec2Approach.cards.length > 1"
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs text-red-700"
                    @click="removeCrewV2Card('approach', ci)"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              <div>
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemedTextField v-model="card.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Описание</label>
                <AdminRichTextEditor v-model="card.text" />
              </div>
            </div>
            <button
              v-if="d.crewingV2.sec2Approach.cards.length < 3"
              type="button"
              class="btn-secondary inline-flex items-center gap-2"
              @click="addCrewV2Card('approach')"
            >
              <Plus class="h-4 w-4" />
              Добавить карточку
            </button>
          </AdminCollapsibleSection>

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
              :key="`cv2-cl-${si}`"
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

          <AdminCollapsibleSection
            :title="`${indexInOrder('services') + 2}. ${sectionOrderRowLabel('services')}`"
            :collapsed="collapsed.crewV2services"
            :visible="sectionVisible('services')"
            :can-move-up="canMove('services', -1)"
            :can-move-down="canMove('services', 1)"
            @update:collapsed="(v) => (collapsed.crewV2services = v)"
            @update:visible="(v) => setSectionVisible('services', v)"
            @move-up="moveSection('services', -1)"
            @move-down="moveSection('services', 1)"
          >
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <AdminThemedTextField v-model="d.crewingV2.sec3Services.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Вводный текст</label>
              <AdminRichTextEditor v-model="d.crewingV2.sec3Services.body" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">Услуги — до 5 карточек.</p>
            <div
              v-for="(card, ci) in d.crewingV2.sec3Services.cards"
              :key="`c3-${ci}`"
              class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Услуга {{ ci + 1 }}</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                    :disabled="ci === 0"
                    title="Выше"
                    aria-label="Выше"
                    @click="moveCrewV2Card('services', ci, -1)"
                  >
                    <ArrowUp class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                    :disabled="ci >= d.crewingV2.sec3Services.cards.length - 1"
                    title="Ниже"
                    aria-label="Ниже"
                    @click="moveCrewV2Card('services', ci, 1)"
                  >
                    <ArrowDown class="h-4 w-4" />
                  </button>
                  <button
                    v-if="d.crewingV2.sec3Services.cards.length > 1"
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs text-red-700"
                    @click="removeCrewV2Card('services', ci)"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              <div>
                <label :class="sectionLabel">Название</label>
                <AdminThemedTextField v-model="card.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Описание</label>
                <AdminRichTextEditor v-model="card.text" />
              </div>
            </div>
            <button
              v-if="d.crewingV2.sec3Services.cards.length < 5"
              type="button"
              class="btn-secondary inline-flex items-center gap-2"
              @click="addCrewV2Card('services')"
            >
              <Plus class="h-4 w-4" />
              Добавить услугу
            </button>
          </AdminCollapsibleSection>

          <AdminCollapsibleSection
            :title="`${indexInOrder('advantages') + 2}. ${sectionOrderRowLabel('advantages')}`"
            :collapsed="collapsed.crewV2advantages"
            :visible="sectionVisible('advantages')"
            :can-move-up="canMove('advantages', -1)"
            :can-move-down="canMove('advantages', 1)"
            @update:collapsed="(v) => (collapsed.crewV2advantages = v)"
            @update:visible="(v) => setSectionVisible('advantages', v)"
            @move-up="moveSection('advantages', -1)"
            @move-down="moveSection('advantages', 1)"
          >
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <AdminThemedTextField v-model="d.crewingV2.sec4Advantages.title" :multiline="false" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">Преимущества — до 3 карточек.</p>
            <div
              v-for="(card, ci) in d.crewingV2.sec4Advantages.cards"
              :key="`c4-${ci}`"
              class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Преимущество {{ ci + 1 }}</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                    :disabled="ci === 0"
                    title="Выше"
                    aria-label="Выше"
                    @click="moveCrewV2Card('advantages', ci, -1)"
                  >
                    <ArrowUp class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                    :disabled="ci >= d.crewingV2.sec4Advantages.cards.length - 1"
                    title="Ниже"
                    aria-label="Ниже"
                    @click="moveCrewV2Card('advantages', ci, 1)"
                  >
                    <ArrowDown class="h-4 w-4" />
                  </button>
                  <button
                    v-if="d.crewingV2.sec4Advantages.cards.length > 1"
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs text-red-700"
                    @click="removeCrewV2Card('advantages', ci)"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              <div>
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemedTextField v-model="card.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Описание</label>
                <AdminRichTextEditor v-model="card.text" />
              </div>
            </div>
            <button
              v-if="d.crewingV2.sec4Advantages.cards.length < 3"
              type="button"
              class="btn-secondary inline-flex items-center gap-2"
              @click="addCrewV2Card('advantages')"
            >
              <Plus class="h-4 w-4" />
              Добавить карточку
            </button>
          </AdminCollapsibleSection>

          <AdminCollapsibleSection
            :title="`${indexInOrder('trust') + 2}. ${sectionOrderRowLabel('trust')}`"
            :collapsed="collapsed.crewV2trust"
            :visible="sectionVisible('trust')"
            :can-move-up="canMove('trust', -1)"
            :can-move-down="canMove('trust', 1)"
            @update:collapsed="(v) => (collapsed.crewV2trust = v)"
            @update:visible="(v) => setSectionVisible('trust', v)"
            @move-up="moveSection('trust', -1)"
            @move-down="moveSection('trust', 1)"
          >
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.crewingV2.sec5Trust.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 1</label>
              <AdminRichTextEditor v-model="d.crewingV2.sec5Trust.paragraph1" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 2</label>
              <AdminRichTextEditor v-model="d.crewingV2.sec5Trust.paragraph2" />
            </div>
          </AdminCollapsibleSection>

          <AdminCollapsibleSection
            :title="`${indexInOrder('cta') + 2}. ${sectionOrderRowLabel('cta')}`"
            :collapsed="collapsed.crewV2cta"
            :visible="sectionVisible('cta')"
            :can-move-up="canMove('cta', -1)"
            :can-move-down="canMove('cta', 1)"
            @update:collapsed="(v) => (collapsed.crewV2cta = v)"
            @update:visible="(v) => setSectionVisible('cta', v)"
            @move-up="moveSection('cta', -1)"
            @move-down="moveSection('cta', 1)"
          >
            <div>
              <label :class="sectionLabel">Заголовок перед формой</label>
              <AdminThemedTextField v-model="d.crewingV2.sec6Cta.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Подпись (TipTap)</label>
              <AdminRichTextEditor v-model="d.crewingV2.sec6Cta.body" />
            </div>
          </AdminCollapsibleSection>
        </template>

        <template v-if="isShipV2 && d.shipV2">
          <AdminCollapsibleSection
            :title="`${indexInOrder('approach') + 2}. ${sectionOrderRowLabel('approach')}`"
            :collapsed="collapsed.shipV2approach"
            :visible="sectionVisible('approach')"
            :can-move-up="canMove('approach', -1)"
            :can-move-down="canMove('approach', 1)"
            @update:collapsed="(v) => (collapsed.shipV2approach = v)"
            @update:visible="(v) => setSectionVisible('approach', v)"
            @move-up="moveSection('approach', -1)"
            @move-down="moveSection('approach', 1)"
          >
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <AdminThemedTextField v-model="d.shipV2.sec2Approach.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Вводный текст</label>
              <AdminRichTextEditor v-model="d.shipV2.sec2Approach.body" />
            </div>
            <div>
              <label :class="sectionLabel">Микро-заголовок над карточками</label>
              <AdminThemedTextField v-model="d.shipV2.sec2Approach.cardsHeading" :multiline="false" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">Приоритеты — до 3 карточек.</p>
            <div
              v-for="(card, ci) in d.shipV2.sec2Approach.cards"
              :key="`s2-${ci}`"
              class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Карточка {{ ci + 1 }}</p>
                <button
                  v-if="d.shipV2.sec2Approach.cards.length > 1"
                  type="button"
                  class="btn-secondary px-2 py-1 text-xs text-red-700"
                  @click="removeShipV2Card('approach', ci)"
                >
                  Удалить
                </button>
              </div>
              <div>
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemedTextField v-model="card.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Описание</label>
                <AdminRichTextEditor v-model="card.text" />
              </div>
            </div>
            <button
              v-if="d.shipV2.sec2Approach.cards.length < 3"
              type="button"
              class="btn-secondary inline-flex items-center gap-2"
              @click="addShipV2Card('approach')"
            >
              <Plus class="h-4 w-4" />
              Добавить карточку
            </button>
          </AdminCollapsibleSection>

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
              :key="`sv2-cl-${si}`"
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

          <AdminCollapsibleSection
            :title="`${indexInOrder('services') + 2}. ${sectionOrderRowLabel('services')}`"
            :collapsed="collapsed.shipV2services"
            :visible="sectionVisible('services')"
            :can-move-up="canMove('services', -1)"
            :can-move-down="canMove('services', 1)"
            @update:collapsed="(v) => (collapsed.shipV2services = v)"
            @update:visible="(v) => setSectionVisible('services', v)"
            @move-up="moveSection('services', -1)"
            @move-down="moveSection('services', 1)"
          >
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <AdminThemedTextField v-model="d.shipV2.sec3Services.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Вводный текст</label>
              <AdminRichTextEditor v-model="d.shipV2.sec3Services.body" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">Услуги в пакете — до 5 карточек.</p>
            <div
              v-for="(card, ci) in d.shipV2.sec3Services.cards"
              :key="`s3-${ci}`"
              class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Услуга {{ ci + 1 }}</p>
                <button
                  v-if="d.shipV2.sec3Services.cards.length > 1"
                  type="button"
                  class="btn-secondary px-2 py-1 text-xs text-red-700"
                  @click="removeShipV2Card('services', ci)"
                >
                  Удалить
                </button>
              </div>
              <div>
                <label :class="sectionLabel">Название</label>
                <AdminThemedTextField v-model="card.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Описание</label>
                <AdminRichTextEditor v-model="card.text" />
              </div>
            </div>
            <button
              v-if="d.shipV2.sec3Services.cards.length < 5"
              type="button"
              class="btn-secondary inline-flex items-center gap-2"
              @click="addShipV2Card('services')"
            >
              <Plus class="h-4 w-4" />
              Добавить услугу
            </button>
          </AdminCollapsibleSection>

          <AdminCollapsibleSection
            :title="`${indexInOrder('advantages') + 2}. ${sectionOrderRowLabel('advantages')}`"
            :collapsed="collapsed.shipV2advantages"
            :visible="sectionVisible('advantages')"
            :can-move-up="canMove('advantages', -1)"
            :can-move-down="canMove('advantages', 1)"
            @update:collapsed="(v) => (collapsed.shipV2advantages = v)"
            @update:visible="(v) => setSectionVisible('advantages', v)"
            @move-up="moveSection('advantages', -1)"
            @move-down="moveSection('advantages', 1)"
          >
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <AdminThemedTextField v-model="d.shipV2.sec4Advantages.title" :multiline="false" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">Преимущества — до 3 карточек.</p>
            <div
              v-for="(card, ci) in d.shipV2.sec4Advantages.cards"
              :key="`s4-${ci}`"
              class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Преимущество {{ ci + 1 }}</p>
                <button
                  v-if="d.shipV2.sec4Advantages.cards.length > 1"
                  type="button"
                  class="btn-secondary px-2 py-1 text-xs text-red-700"
                  @click="removeShipV2Card('advantages', ci)"
                >
                  Удалить
                </button>
              </div>
              <div>
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemedTextField v-model="card.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Описание</label>
                <AdminRichTextEditor v-model="card.text" />
              </div>
            </div>
            <button
              v-if="d.shipV2.sec4Advantages.cards.length < 3"
              type="button"
              class="btn-secondary inline-flex items-center gap-2"
              @click="addShipV2Card('advantages')"
            >
              <Plus class="h-4 w-4" />
              Добавить карточку
            </button>
          </AdminCollapsibleSection>

          <AdminCollapsibleSection
            :title="`${indexInOrder('trust') + 2}. ${sectionOrderRowLabel('trust')}`"
            :collapsed="collapsed.shipV2closing"
            :visible="sectionVisible('trust')"
            :can-move-up="canMove('trust', -1)"
            :can-move-down="canMove('trust', 1)"
            @update:collapsed="(v) => (collapsed.shipV2closing = v)"
            @update:visible="(v) => setSectionVisible('trust', v)"
            @move-up="moveSection('trust', -1)"
            @move-down="moveSection('trust', 1)"
          >
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.shipV2.sec5Closing.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 1</label>
              <AdminRichTextEditor v-model="d.shipV2.sec5Closing.paragraph1" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 2</label>
              <AdminRichTextEditor v-model="d.shipV2.sec5Closing.paragraph2" />
            </div>
          </AdminCollapsibleSection>
        </template>

        <!-- Custom marketing sections -->
        <section class="relative border border-mts-border bg-white shadow-tech">
          <CommonAccentCorners />
          <div class="border-b border-mts-border p-6">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">
              Пользовательские секции
            </h2>
            <p class="mt-2 max-w-[1600px] font-body text-xs text-mts-text-secondary">
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
                <div class="md:col-span-2">
                  <label :class="sectionLabel">Хлебные крошки на баннере секции</label>
                  <AdminSelect
                    :model-value="getCustomSectionById(sid.slice(7))!.breadcrumbTone ?? ''"
                    :options="CUSTOM_SECTION_BREADCRUMB_TONE_ADMIN_OPTIONS"
                    @update:model-value="
                      (v) => {
                        const sec = getCustomSectionById(sid.slice(7))!
                        sec.breadcrumbTone = v ? (v as PageBreadcrumbTone) : undefined
                      }
                    "
                  />
                  <p class="mt-2 font-body text-xs text-mts-text-secondary">
                    Отображаются над первым блоком «Баннер / изображение» в этой секции (те же пункты, что в hero
                    страницы).
                  </p>
                </div>
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
                  <AdminImageListField
                    :model-value="block.images"
                    label="Изображения"
                    hint="Один URL — статичная картинка. Несколько URL и режим «Слайдер» — будут листаться на сайте."
                    dialog-title="Изображения для split-блока"
                    @update:model-value="(v) => (block.images = v)"
                  />
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

        <section class="relative border border-mts-border bg-white p-6 shadow-tech space-y-4">
          <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.showInquiryForm" type="checkbox" class="mts-checkbox" />
            Показать форму заявки внизу страницы
          </label>
          <label
            v-if="d.showInquiryForm"
            class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text"
          >
            <input v-model="d.hideInquiryFormIntro" type="checkbox" class="mts-checkbox" />
            Скрыть блок над карточкой («Заявка», заголовок и лид из переводов сайта)
          </label>
          <label
            v-if="d.showInquiryForm"
            class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text"
          >
            <input v-model="d.hideInquiryFormCardHeading" type="checkbox" class="mts-checkbox" />
            Скрыть заголовок и подписи внутри белой карточки (над полями формы)
          </label>
          <AdminPageInquiryConfigEditor v-if="d.showInquiryForm" v-model="d.inquiryForm" />
          <div class="border-t border-mts-border pt-4">
            <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
              <input v-model="d.hideFooter" type="checkbox" class="mts-checkbox" />
              Скрыть подвал на этой странице
            </label>
          </div>
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
