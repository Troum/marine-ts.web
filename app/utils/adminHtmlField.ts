import type { ThemeFormattedTitle } from '~/types'
import { normalizeThemeFormattedTitle } from '~/utils/themeFormattedTitle'
import { serializeThemeTitleTiptapDocToHtml, themeTitleToTiptapDoc } from '~/utils/themeToneTiptap'

/**
 * Значение из CMS → HTML для TipTap: уже HTML, legacy TFT JSON или plain.
 */
export function incomingCmsValueToHtml(raw: string | null | undefined): string {
  if (raw == null || raw === '') {
    return '<p></p>'
  }
  const trimmed = raw.trimStart()
  if (trimmed.startsWith('<')) {
    return raw
  }
  if (trimmed.startsWith('{')) {
    try {
      const j = JSON.parse(raw) as unknown
      if (j && typeof j === 'object' && Array.isArray((j as { spans?: unknown }).spans)) {
        const tft = normalizeThemeFormattedTitle(j as ThemeFormattedTitle)
        return serializeThemeTitleTiptapDocToHtml(themeTitleToTiptapDoc(tft))
      }
    } catch {
      /* обычная строка, начинающаяся с { */
    }
  }
  return plainTextToEscapedHtmlParagraph(raw)
}

function plainTextToEscapedHtmlParagraph(s: string): string {
  const escaped = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const withBreaks = escaped.replace(/\n/g, '<br>')
  return `<p>${withBreaks}</p>`
}

/** Плоская строка для title кнопок: HTML → текст, TFT JSON → spans, иначе как есть. */
export function stripHtmlToPlain(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

/**
 * HTML из themed TipTap → непустые строки по границам абзацев и переносов `<br>`.
 * Для полей, которые в API хранятся как массив строк (пункты списка, требования).
 */
export function htmlToPlainLinesForBullets(html: string): string[] {
  const normalized = (html ?? '')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
  return stripHtmlToPlain(normalized)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}
