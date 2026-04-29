import type { Config } from 'dompurify'
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'
import type { ThemeTitleFontWeight } from '~/types'
import { isAllowedRichMapIframeSrc } from '~/utils/tiptapMtsRichLayout'
import { isSafeListMarkerUrl } from '~/utils/tiptapMtsListStyle'
import { TIPTAP_FONT_WEIGHT_VALUES } from '~/utils/tiptapFontWeightConstants'
import { normalizeStoredFontWeight } from '~/utils/tiptapTextFontWeightExtension'

marked.setOptions({ gfm: true, breaks: true })

/** Конфиг DOMPurify для HTML из TipTap (таблицы, iframe YouTube, выравнивание, подсветка). */
export const RICH_CONTENT_HTML_CONFIG: Config = {
  ADD_TAGS: ['iframe'],
  ADD_ATTR: [
    'target',
    'rel',
    'allow',
    'allowfullscreen',
    'frameborder',
    'referrerpolicy',
    'data-youtube-video',
    'data-mts-rich-grid',
    'data-mts-rich-cell',
    'data-cols-md',
    'data-gap',
    'data-cell-span',
    'data-mts-rich-map',
    'data-map-title',
    'data-mts-rich-carousel',
    'data-carousel-slide',
    'data-interval-ms',
    'data-show-dots',
    'data-carousel-label',
    'data-mts-rich-gallery',
    'data-gallery-item',
    'data-gallery-cols',
    'data-gallery-label',
    'data-list-style',
    'data-marker-icon',
    'data-marker-url',
    'title',
    'loading',
    'width',
    'height',
    'colspan',
    'rowspan',
    'scope',
  ],
}

let richContentHooksRegistered = false

/**
 * Разрешённые inline-стили для `<ul>` из TipTap: кастомный маркер (строка) или list-style-image (url).
 */
function isSafeTipTapUlStyle(styleValue: string): boolean {
  const raw = styleValue.trim()
  if (!raw) {
    return false
  }
  if (
    /^list-style-type:\s*'([^'\\]|\\.)*'\s*;?$/i.test(raw)
    || /^list-style-type:\s*"([^"\\]|\\.)*"\s*;?$/i.test(raw)
  ) {
    return true
  }
  const lower = raw.toLowerCase()
  if (!lower.includes('list-style-image')) {
    return false
  }
  if (!/^list-style-type:\s*none/i.test(lower)) {
    return false
  }
  const m = /list-style-image:\s*url\(\s*["']?([^)"']+)["']?\s*\)/i.exec(raw)
  if (!m) {
    return false
  }
  return isSafeListMarkerUrl(m[1]!.trim())
}

/** Значения цвета из TipTap (`Color` / `Highlight`), без `url()` и выражений. */
const SAFE_INLINE_COLOR_VALUE =
  /^(?:#[0-9a-f]{3,8}|rgb\(\s*[\d\s%,.]+\)|rgba\(\s*[\d\s%,.]+\)|hsl\(\s*[\d\s%,.°]+\)|hsla\(\s*[\d\s%,.]+\)|currentcolor|inherit|transparent)$/i

function isSafeInlineColorValue(raw: string): boolean {
  return SAFE_INLINE_COLOR_VALUE.test(raw.trim())
}

/** Только `var(--token)` из темы (TipTap ThemeTone / CSS variables), без произвольных выражений. */
const SAFE_THEME_VAR_COLOR = /^var\(\s*--[-a-zA-Z0-9]+\s*\)$/i

function isSafeSpanColorValue(raw: string): boolean {
  const t = raw.trim()
  return isSafeInlineColorValue(t) || SAFE_THEME_VAR_COLOR.test(t)
}

function isSafeSpanFontWeightValue(raw: string): boolean {
  const norm = normalizeStoredFontWeight(raw.trim())
  if (norm == null) {
    return false
  }
  const n = Number(norm)
  return TIPTAP_FONT_WEIGHT_VALUES.includes(n as ThemeTitleFontWeight)
}

/**
 * Разрешить `style` на `span` (`color`, `-webkit-text-fill-color`, `font-weight`)
 * и `mark` (`background-color`, `color`).
 *
 * Раньше на `span` разрешался только `color`. Любой `font-weight` из палитры админки
 * делал объявление «небезопасным» и **выкидывал весь атрибут `style`** — на сайте
 * пропадали и цвет, и начертание.
 */
function richTextColorStyleAllowed(tagName: string, styleValue: string): boolean {
  const tag = tagName.toUpperCase()
  const parts = styleValue
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return false
  }

  if (tag === 'SPAN') {
    for (const part of parts) {
      const m = /^([\w-]+)\s*:\s*(.+)$/i.exec(part)
      if (!m) {
        return false
      }
      const prop = m[1].toLowerCase()
      const val = m[2].trim()
      if (prop === 'color' || prop === '-webkit-text-fill-color') {
        if (!isSafeSpanColorValue(val)) {
          return false
        }
        continue
      }
      if (prop === 'font-weight') {
        if (!isSafeSpanFontWeightValue(val)) {
          return false
        }
        continue
      }
      return false
    }
    return true
  }

  if (tag === 'MARK') {
    for (const part of parts) {
      const m = /^([\w-]+)\s*:\s*(.+)$/i.exec(part)
      if (!m) {
        return false
      }
      const prop = m[1].toLowerCase()
      if (prop !== 'background-color' && prop !== 'color') {
        return false
      }
      if (!isSafeInlineColorValue(m[2])) {
        return false
      }
    }
    return true
  }

  return false
}

/** Публичная вёрстка: размер как в админке (width/height), адаптивно в колонке. */
function injectTipTapImgLayoutStyle(el: HTMLImageElement): void {
  if (el.getAttribute('style')?.trim()) {
    return
  }
  const w = el.getAttribute('width')
  const h = el.getAttribute('height')
  if (w && /^\d+$/.test(w) && h && /^\d+$/.test(h)) {
    el.setAttribute(
      'style',
      `aspect-ratio:${w}/${h};max-width:100%;width:min(100%,${w}px);height:auto;margin-inline:0`,
    )
    return
  }
  if (w && /^\d+$/.test(w)) {
    el.setAttribute('style', `max-width:100%;width:min(100%,${w}px);height:auto;margin-inline:0`)
  }
}

function registerRichContentHtmlHooksOnce() {
  if (richContentHooksRegistered) {
    return
  }
  richContentHooksRegistered = true

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!node || node.nodeType !== 1 || node.nodeName !== 'IMG') {
      return
    }
    injectTipTapImgLayoutStyle(node as HTMLImageElement)
  })

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (node.tagName === 'IMG' && data.attrName === 'class') {
      const cleaned = data.attrValue
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(
          (c) => c.length > 0 && c !== 'border' && c !== 'border-mts-border' && c !== 'mx-auto',
        )
        .join(' ')
      data.attrValue = cleaned
    }
    if (data.attrName === 'style') {
      const tag = node.tagName
      if (tag === 'UL') {
        if (isSafeTipTapUlStyle(data.attrValue)) {
          return
        }
        data.keepAttr = false
        return
      }
      if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TH', 'TD'].includes(tag)) {
        const v = data.attrValue.trim()
        if (!/^text-align:\s*(left|center|right|justify)\s*;?\s*$/i.test(v)) {
          data.keepAttr = false
        }
      }
      else if (tag === 'SPAN' || tag === 'MARK') {
        if (!richTextColorStyleAllowed(tag, data.attrValue)) {
          data.keepAttr = false
        }
      }
      else {
        data.keepAttr = false
      }
    }
    if (data.attrName === 'src' && node.tagName === 'IFRAME') {
      const u = data.attrValue.trim()
      const youtube = /^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//i.test(u)
      if (youtube || isAllowedRichMapIframeSrc(u)) {
        return
      }
      data.keepAttr = false
    }
  })
}

/** Санитизация сохранённого HTML страницы (TipTap). */
export function sanitizeRichContentHtml(html: string): string {
  registerRichContentHtmlHooksOnce()
  return DOMPurify.sanitize(html, RICH_CONTENT_HTML_CONFIG)
}

/** Рендер Markdown в безопасный HTML (SSR и клиент). */
export function markdownToSafeHtml(markdown: string): string {
  registerRichContentHtmlHooksOnce()
  const raw = marked.parse(markdown, { async: false }) as string
  return DOMPurify.sanitize(raw)
}

/** Контент из TipTap / сохранённый как HTML. */
export function looksLikeHtmlFragment(s: string): boolean {
  const t = s.trim()
  if (t.length < 4) {
    return false
  }
  if (!t.startsWith('<')) {
    return false
  }
  return /<\/[a-z][a-z0-9]*>/i.test(t)
}

/**
 * Тело страницы: Markdown или HTML из WYSIWYG — безопасный HTML для v-html.
 */
export function contentBodyToSafeHtml(body: string): string {
  if (looksLikeHtmlFragment(body)) {
    return sanitizeRichContentHtml(body)
  }
  return markdownToSafeHtml(body)
}

/** Пустой редактор TipTap даёт `<p></p>` или `<p><br></p>`. */
export function isRichTextEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length === 0
}

/** Подготовка значения для редактора: Markdown из API → HTML. */
export function normalizeBodyForEditor(raw: string | undefined | null): string {
  if (!raw?.trim()) {
    return '<p></p>'
  }
  if (looksLikeHtmlFragment(raw)) {
    return raw
  }
  return markdownToSafeHtml(raw)
}
