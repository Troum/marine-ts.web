import type {
  CustomPageBlock,
  CustomPageBlockType,
  CustomPageSection,
  LineMarketingAccordionBlock,
  LineMarketingAccordionItem,
  LineMarketingCardItem,
  LineMarketingCardsBlock,
  LineMarketingContentBlock,
  LineMarketingCustomSection,
  LineMarketingGalleryBlock,
  LineMarketingHeroImageBlock,
  LineMarketingHtmlMarkdownBlock,
  LineMarketingSplitBlock,
  LineMarketingTextBlock,
} from '~/types'

/**
 * Общие утилиты для пользовательских секций ("custom sections") — единый
 * формат, который используется на всех редактируемых страницах админки
 * (главная, о компании, листинги, контакты, line-marketing). См.
 * `~/components/admin/AdminCustomSectionsEditor.client.vue` (редактор) и
 * `~/components/common/CustomPageSectionsRender.vue` (публичный рендер).
 */

export const CUSTOM_BLOCK_TYPES: readonly CustomPageBlockType[] = [
  'cards',
  'text',
  'split',
  'heroImage',
  'gallery',
  'accordion',
  'htmlMarkdown',
] as const

export const CUSTOM_BLOCK_TYPE_LABELS: Record<CustomPageBlockType, string> = {
  cards: 'Карточки',
  text: 'Текст',
  split: 'Текст + изображение / слайдер',
  heroImage: 'Баннер / изображение',
  gallery: 'Галерея',
  accordion: 'Аккордеон',
  htmlMarkdown: 'Произвольный текст (Markdown)',
}

/** Безопасный генератор id (UUID v4 если есть, иначе timestamp+random). */
export function newCustomPageBlockId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `cs-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/* ── Дефолты блоков ── */

export function defaultCardItem(): LineMarketingCardItem {
  return { icon: 'UserCheck', hideIcon: false, title: '', text: '', detailSlug: '' }
}

export function defaultBlock(type: CustomPageBlockType): CustomPageBlock {
  const id = newCustomPageBlockId()
  switch (type) {
    case 'cards':
      return { id, type: 'cards', items: [defaultCardItem()] }
    case 'text':
      return { id, type: 'text', title: '', subtitle: '', description: '' }
    case 'split':
      return {
        id,
        type: 'split',
        leftText: '',
        leftWidthPercent: 50,
        rightMode: 'image',
        images: [''],
      }
    case 'heroImage':
      return {
        id,
        type: 'heroImage',
        imageUrl: '',
        height: 'medium',
        title: '',
        caption: '',
        overlayOpacity: 30,
      }
    case 'gallery':
      return { id, type: 'gallery', title: '', images: [''], columns: 3 }
    case 'accordion':
      return { id, type: 'accordion', title: '', items: [{ question: '', answer: '' }] }
    case 'htmlMarkdown':
      return { id, type: 'htmlMarkdown', title: '', content: '', align: 'left' }
  }
}

export function defaultCustomSection(): CustomPageSection {
  return {
    id: newCustomPageBlockId(),
    title: '',
    showTitle: true,
    blocks: [],
  }
}

/* ── Нормализаторы (восстановление из CMS JSON) ── */

function pickString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function pickBoolean(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function pickNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(v)))
}

function pickStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) {
    return []
  }
  return v.filter((x): x is string => typeof x === 'string')
}

function normalizeCardItem(raw: unknown): LineMarketingCardItem {
  const fb = defaultCardItem()
  if (!raw || typeof raw !== 'object') {
    return fb
  }
  const r = raw as Partial<LineMarketingCardItem>
  return {
    icon: pickString(r.icon, fb.icon).trim() || fb.icon,
    hideIcon: pickBoolean(r.hideIcon, fb.hideIcon ?? false),
    title: pickString(r.title, fb.title),
    text: pickString(r.text, fb.text),
    detailSlug: pickString(r.detailSlug, fb.detailSlug ?? '').trim(),
  }
}

function normalizeCardsBlock(raw: Record<string, unknown>): LineMarketingCardsBlock {
  const items = Array.isArray(raw.items)
    ? raw.items.map((it) => normalizeCardItem(it))
    : []
  return {
    id: pickString(raw.id, '').trim() || newCustomPageBlockId(),
    type: 'cards',
    items: items.length > 0 ? items : [defaultCardItem()],
  }
}

function normalizeTextBlock(raw: Record<string, unknown>): LineMarketingTextBlock {
  return {
    id: pickString(raw.id, '').trim() || newCustomPageBlockId(),
    type: 'text',
    title: pickString(raw.title, ''),
    subtitle: pickString(raw.subtitle, ''),
    description: pickString(raw.description, ''),
  }
}

function normalizeSplitBlock(raw: Record<string, unknown>): LineMarketingSplitBlock {
  const imgs = pickStringArray(raw.images)
  const left = clampInt(pickNumber(raw.leftWidthPercent, 50), 10, 90)
  const mode = raw.rightMode === 'slider' || raw.rightMode === 'image' ? raw.rightMode : 'image'
  return {
    id: pickString(raw.id, '').trim() || newCustomPageBlockId(),
    type: 'split',
    leftText: pickString(raw.leftText, ''),
    leftWidthPercent: left,
    rightMode: mode,
    images: imgs.length > 0 ? imgs : [''],
  }
}

function normalizeHeroImageBlock(raw: Record<string, unknown>): LineMarketingHeroImageBlock {
  const h = raw.height === 'small' || raw.height === 'large' ? raw.height : 'medium'
  return {
    id: pickString(raw.id, '').trim() || newCustomPageBlockId(),
    type: 'heroImage',
    imageUrl: pickString(raw.imageUrl, '').trim(),
    height: h,
    title: pickString(raw.title, ''),
    caption: pickString(raw.caption, ''),
    overlayOpacity: clampInt(pickNumber(raw.overlayOpacity, 30), 0, 100),
  }
}

function normalizeGalleryBlock(raw: Record<string, unknown>): LineMarketingGalleryBlock {
  const imgs = pickStringArray(raw.images)
  return {
    id: pickString(raw.id, '').trim() || newCustomPageBlockId(),
    type: 'gallery',
    title: pickString(raw.title, ''),
    images: imgs.length > 0 ? imgs : [''],
    columns: clampInt(pickNumber(raw.columns, 3), 1, 4),
  }
}

function normalizeAccordionItem(raw: unknown): LineMarketingAccordionItem {
  if (!raw || typeof raw !== 'object') {
    return { question: '', answer: '' }
  }
  const r = raw as Partial<LineMarketingAccordionItem>
  return {
    question: pickString(r.question, ''),
    answer: pickString(r.answer, ''),
  }
}

function normalizeAccordionBlock(raw: Record<string, unknown>): LineMarketingAccordionBlock {
  const items = Array.isArray(raw.items)
    ? raw.items.map((it) => normalizeAccordionItem(it))
    : []
  return {
    id: pickString(raw.id, '').trim() || newCustomPageBlockId(),
    type: 'accordion',
    title: pickString(raw.title, ''),
    items: items.length > 0 ? items : [{ question: '', answer: '' }],
  }
}

function normalizeHtmlMarkdownBlock(raw: Record<string, unknown>): LineMarketingHtmlMarkdownBlock {
  const align = raw.align === 'center' ? 'center' : 'left'
  return {
    id: pickString(raw.id, '').trim() || newCustomPageBlockId(),
    type: 'htmlMarkdown',
    title: pickString(raw.title, ''),
    content: pickString(raw.content, ''),
    align,
  }
}

/** Нормализует один блок; неизвестные/невалидные типы превращаются в пустой text-блок. */
export function normalizeCustomPageBlock(raw: unknown): CustomPageBlock {
  if (!raw || typeof raw !== 'object') {
    return defaultBlock('text')
  }
  const r = raw as Record<string, unknown>
  const t = r.type
  if (t === 'cards') return normalizeCardsBlock(r)
  if (t === 'text') return normalizeTextBlock(r)
  if (t === 'split') return normalizeSplitBlock(r)
  if (t === 'heroImage') return normalizeHeroImageBlock(r)
  if (t === 'gallery') return normalizeGalleryBlock(r)
  if (t === 'accordion') return normalizeAccordionBlock(r)
  if (t === 'htmlMarkdown') return normalizeHtmlMarkdownBlock(r)
  // совместимость: legacy-блок без типа — превращаем в text c содержимым description
  return normalizeTextBlock(r)
}

/** Нормализует одну пользовательскую секцию. */
export function normalizeCustomPageSection(raw: unknown): CustomPageSection {
  if (!raw || typeof raw !== 'object') {
    return defaultCustomSection()
  }
  const r = raw as Partial<LineMarketingCustomSection>
  const blocksRaw = Array.isArray(r.blocks) ? r.blocks : []
  return {
    id: pickString(r.id, '').trim() || newCustomPageBlockId(),
    title: pickString(r.title, ''),
    showTitle: pickBoolean(r.showTitle, true),
    blocks: blocksRaw.map((b) => normalizeCustomPageBlock(b)),
  }
}

/**
 * Нормализует массив секций (используется в mergeXxxData). Если значение
 * отсутствует/невалидно — возвращает пустой массив (это поле всегда
 * опциональное на странице).
 */
export function normalizeCustomPageSections(raw: unknown): CustomPageSection[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((s) => normalizeCustomPageSection(s))
}

/** Тип-гард: проверяет, что строка — допустимый тип блока. */
export function isCustomPageBlockType(value: unknown): value is CustomPageBlockType {
  return typeof value === 'string' && (CUSTOM_BLOCK_TYPES as readonly string[]).includes(value)
}

/* Экспортируем под старыми именами для обратной совместимости с line-pages. */
export {
  normalizeCustomPageBlock as normalizeLineMarketingContentBlock,
  normalizeCustomPageSection as normalizeLineMarketingCustomSection,
}

/** Линейный move helper для пользовательских массивов внутри редактора. */
export function moveItem<T>(arr: T[], index: number, delta: number): boolean {
  const j = index + delta
  if (j < 0 || j >= arr.length) {
    return false
  }
  const tmp = arr[index]!
  arr[index] = arr[j]!
  arr[j] = tmp
  return true
}

export type { CustomPageSection, CustomPageBlock, CustomPageBlockType, LineMarketingContentBlock }
