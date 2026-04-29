import type { ThemeFormattedTitle } from '~/types'
import { stripHtmlToPlain } from '~/utils/adminHtmlField'
import { emptyThemeTitle, normalizeThemeFormattedTitle } from '~/utils/themeFormattedTitle'

/** Распознаёт JSON сохранённого тематического текста (после палитры). */
export function decodeAdminThemedString(raw: string | null | undefined): ThemeFormattedTitle {
  if (raw == null || raw === '') {
    return emptyThemeTitle()
  }
  const trimmed = raw.trimStart()
  if (trimmed.startsWith('{')) {
    try {
      const j = JSON.parse(raw) as unknown
      if (j && typeof j === 'object' && Array.isArray((j as { spans?: unknown }).spans)) {
        return normalizeThemeFormattedTitle(j)
      }
    } catch {
      /* обычная строка, начинающаяся с { */
    }
  }
  return { spans: [{ text: raw, tone: 'text' }] }
}

/**
 * Однотонный текст без акцентов храним как plain string;
 * при любых оттенках темы — JSON `ThemeFormattedTitle`.
 */
export function encodeAdminThemedString(t: ThemeFormattedTitle): string {
  const n = normalizeThemeFormattedTitle(t)
  const only = n.spans.length === 1 ? n.spans[0] : null
  /*
   * Плоская строка только для «простой» строки основного тона без явного веса.
   * Иначе начертание терялось при сохранении (раньше схлопывалось в plain).
   */
  if (only && only.tone === 'text' && only.fontWeight == null) {
    return only.text ?? ''
  }
  return JSON.stringify(n)
}

/** Для атрибутов (title кнопки и т.д.): плоская строка без разметки. */
export function flattenEncodedOrPlain(raw: string | null | undefined): string {
  if (raw == null || raw === '') {
    return ''
  }
  const t = raw.trimStart()
  if (t.startsWith('<')) {
    return stripHtmlToPlain(raw).replace(/\s+/g, ' ').trim()
  }
  const decoded = decodeAdminThemedString(raw)
  return decoded.spans.map((s) => s.text).join('')
}

/**
 * Одна плоская строка для document title, meta description, og:title — без HTML,
 * в том числе если разметка оказалась внутри TFT после `flattenEncodedOrPlain`.
 */
export function plainMetaString(raw: string | null | undefined): string {
  let s = flattenEncodedOrPlain(raw)
  if (!s) {
    return ''
  }
  if (s.includes('<')) {
    s = stripHtmlToPlain(s)
  }
  return s.replace(/\s+/g, ' ').trim()
}
