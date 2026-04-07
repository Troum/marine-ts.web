import type { Config } from 'dompurify'
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

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
    'colspan',
    'rowspan',
    'scope',
  ],
}

let richContentHooksRegistered = false

function registerRichContentHtmlHooksOnce() {
  if (richContentHooksRegistered) {
    return
  }
  richContentHooksRegistered = true

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'style') {
      const tag = node.tagName
      if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TH', 'TD'].includes(tag)) {
        const v = data.attrValue.trim()
        if (!/^text-align:\s*(left|center|right|justify)\s*;?\s*$/i.test(v)) {
          data.keepAttr = false
        }
      }
      else {
        data.keepAttr = false
      }
    }
    if (data.attrName === 'src' && node.tagName === 'IFRAME') {
      const u = data.attrValue.trim()
      if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//i.test(u)) {
        data.keepAttr = false
      }
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
 * Тело страницы: старый Markdown или HTML из WYSIWYG — безопасный HTML для v-html.
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
