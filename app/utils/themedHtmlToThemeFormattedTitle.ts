import { Editor } from '@tiptap/core'
import type { JSONContent } from '@tiptap/core'
import type { ThemeFormattedTitle, ThemeTitleFontWeight, ThemeTitleSpan, ThemeTitleTone } from '~/types'
import { createThemedHtmlTiptapExtensions } from '~/utils/themedHtmlTiptapExtensions'
import {
  emptyThemeTitle,
  isThemeTitleTone,
  normalizeThemeFormattedTitle,
  THEME_TITLE_TONE_ADMIN_PREVIEW_HEX,
} from '~/utils/themeFormattedTitle'
import {
  serializeThemeTitleTiptapDocToHtml,
  themeTitleFromTiptapDoc,
  themeTitleToTiptapDoc,
} from '~/utils/themeToneTiptap'
import { TIPTAP_FONT_WEIGHT_VALUES } from '~/utils/tiptapFontWeightConstants'

const TONE_KEYS = Object.keys(THEME_TITLE_TONE_ADMIN_PREVIEW_HEX) as ThemeTitleTone[]

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseColorToRgb(raw: string): [number, number, number] | null {
  const s = raw.trim().toLowerCase()
  if (!s) {
    return null
  }
  if (s.startsWith('#')) {
    let h = s.slice(1)
    if (!/^[\da-f]+$/i.test(h)) {
      return null
    }
    if (h.length === 3) {
      h = h
        .split('')
        .map((c) => c + c)
        .join('')
    }
    if (h.length === 8) {
      h = h.slice(0, 6)
    }
    if (h.length !== 6) {
      return null
    }
    const n = Number.parseInt(h, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const rgbM = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/)
  if (rgbM) {
    let r = Number(rgbM[1])
    let g = Number(rgbM[2])
    let b = Number(rgbM[3])
    if (r <= 1 && g <= 1 && b <= 1 && (r > 0 || g > 0 || b > 0)) {
      r *= 255
      g *= 255
      b *= 255
    }
    if ([r, g, b].some((v) => !Number.isFinite(v))) {
      return null
    }
    return [Math.round(r), Math.round(g), Math.round(b)]
  }
  return null
}

function nearestToneFromRgb(rgb: [number, number, number]): ThemeTitleTone {
  let best: ThemeTitleTone = 'text'
  let bestD = Number.POSITIVE_INFINITY
  for (const tone of TONE_KEYS) {
    const hx = THEME_TITLE_TONE_ADMIN_PREVIEW_HEX[tone]
    const tr = parseColorToRgb(hx)
    if (!tr) {
      continue
    }
    const d = (rgb[0] - tr[0]) ** 2 + (rgb[1] - tr[1]) ** 2 + (rgb[2] - tr[2]) ** 2
    if (d < bestD) {
      bestD = d
      best = tone
    }
  }
  return best
}

function colorStringToTone(raw: string | null | undefined): ThemeTitleTone {
  if (raw == null || raw === '') {
    return 'text'
  }
  const rgb = parseColorToRgb(raw)
  if (!rgb) {
    return 'text'
  }
  return nearestToneFromRgb(rgb)
}

function fontWeightFromTextStyle(attrs: Record<string, unknown> | undefined): ThemeTitleFontWeight | undefined {
  if (!attrs) {
    return undefined
  }
  const fw = attrs.fontWeight
  if (fw == null || fw === '') {
    return undefined
  }
  const n = typeof fw === 'string' ? Number(fw) : typeof fw === 'number' ? fw : NaN
  if (!Number.isFinite(n)) {
    return undefined
  }
  if (TIPTAP_FONT_WEIGHT_VALUES.includes(n as ThemeTitleFontWeight)) {
    return n as ThemeTitleFontWeight
  }
  return undefined
}

function appendNewlineToLastSpan(spans: ThemeTitleSpan[]) {
  const last = spans[spans.length - 1]
  if (last) {
    last.text += '\n'
  } else {
    spans.push({ text: '\n', tone: 'text' })
  }
}

function pushText(spans: ThemeTitleSpan[], text: string, tone: ThemeTitleTone, fw: ThemeTitleFontWeight | undefined) {
  if (text.length === 0) {
    return
  }
  const last = spans[spans.length - 1]
  const sameW = last?.fontWeight === fw || (last?.fontWeight == null && fw == null)
  if (last && last.tone === tone && sameW) {
    last.text += text
  } else {
    const span: ThemeTitleSpan = { text, tone }
    if (fw != null) {
      span.fontWeight = fw
    }
    spans.push(span)
  }
}

function extractToneAndWeightFromMarks(
  marks: JSONContent['marks'] | undefined,
): { tone: ThemeTitleTone; fw: ThemeTitleFontWeight | undefined } {
  const arr = marks ?? []
  const themeM = arr.find((m) => m.type === 'themeTone')
  if (themeM?.attrs?.tone && isThemeTitleTone(themeM.attrs.tone)) {
    const tone = themeM.attrs.tone
    const fwRaw = themeM.attrs.fontWeight
    const n =
      fwRaw != null && fwRaw !== ''
        ? typeof fwRaw === 'number'
          ? fwRaw
          : Number(fwRaw)
        : NaN
    const fw =
      Number.isFinite(n) && TIPTAP_FONT_WEIGHT_VALUES.includes(n as ThemeTitleFontWeight)
        ? (n as ThemeTitleFontWeight)
        : undefined
    return { tone, fw }
  }
  const textStyle = arr.find((m) => m.type === 'textStyle')?.attrs as Record<string, unknown> | undefined
  const highlight = arr.find((m) => m.type === 'highlight')
  let tone: ThemeTitleTone
  if (textStyle?.color && typeof textStyle.color === 'string') {
    tone = colorStringToTone(textStyle.color)
  } else if (highlight?.attrs && typeof (highlight.attrs as { color?: string }).color === 'string') {
    tone = colorStringToTone((highlight.attrs as { color: string }).color)
  } else if (highlight) {
    tone = 'marker'
  } else {
    tone = 'text'
  }
  return { tone, fw: fontWeightFromTextStyle(textStyle) }
}

function walkParagraphContent(p: JSONContent, spans: ThemeTitleSpan[]) {
  for (const node of p.content ?? []) {
    if (node.type === 'hardBreak') {
      appendNewlineToLastSpan(spans)
      continue
    }
    if (node.type !== 'text' || node.text == null || node.text === '') {
      continue
    }
    const { tone, fw } = extractToneAndWeightFromMarks(node.marks)
    pushText(spans, node.text, tone, fw)
  }
}

function richDocJsonToThemeTitle(doc: JSONContent): ThemeFormattedTitle {
  const spans: ThemeTitleSpan[] = []
  const blocks = doc.content ?? []
  let firstPara = true
  for (const block of blocks) {
    if (block.type !== 'paragraph') {
      continue
    }
    if (!firstPara) {
      const last = spans[spans.length - 1]
      if (last) {
        last.text += '\n\n'
      } else {
        spans.push({ text: '\n\n', tone: 'text' })
      }
    }
    firstPara = false
    walkParagraphContent(block, spans)
  }
  if (!spans.length) {
    return emptyThemeTitle()
  }
  return normalizeThemeFormattedTitle({ spans })
}

/**
 * TFT → HTML с inline `color` / `font-weight`, как у «Лида» (`AdminThemedTextField` без themeTone).
 * На сайте по-прежнему сериализуется в тона темы после сохранения.
 */
export function themeFormattedTitleToLeadStyleHtml(t: ThemeFormattedTitle): string {
  const n = normalizeThemeFormattedTitle(t)
  if (!n.spans.length) {
    return '<p></p>'
  }
  const parts: string[] = []
  for (const span of n.spans) {
    const tone: ThemeTitleTone = isThemeTitleTone(span.tone) ? span.tone : 'text'
    const hex = THEME_TITLE_TONE_ADMIN_PREVIEW_HEX[tone]
    const fw =
      span.fontWeight != null && TIPTAP_FONT_WEIGHT_VALUES.includes(span.fontWeight)
        ? ` font-weight: ${span.fontWeight};`
        : ''
    const pieces = (span.text ?? '').split('\n')
    for (let i = 0; i < pieces.length; i++) {
      const part = pieces[i] ?? ''
      if (part.length > 0) {
        parts.push(`<span style="color: ${hex};${fw}">${escapeHtmlText(part)}</span>`)
      }
      if (i < pieces.length - 1) {
        parts.push('<br>')
      }
    }
  }
  return `<p>${parts.join('')}</p>`
}

/**
 * HTML из поля как у «Лида» (цвет, подсветка, вес) → TFT: произвольные цвета сопоставляются ближайшему тону темы.
 */
export function richAdminHtmlToThemeFormattedTitle(html: string): ThemeFormattedTitle {
  const content = html?.trim() ? html : '<p></p>'
  const ed = new Editor({
    editable: false,
    injectCSS: false,
    extensions: createThemedHtmlTiptapExtensions({ placeholder: '', withThemeToneMark: false }),
    content,
  })
  try {
    return richDocJsonToThemeTitle(ed.getJSON())
  } finally {
    ed.destroy()
  }
}

/** TFT → HTML в том же виде, что отдаёт themed TipTap (themeTone). */
export function themeFormattedTitleToThemedHtml(t: ThemeFormattedTitle): string {
  return serializeThemeTitleTiptapDocToHtml(themeTitleToTiptapDoc(t))
}

/**
 * HTML из `AdminHtmlTiptapField` с palette themeTone → TFT.
 */
export function themedHtmlToThemeFormattedTitle(html: string): ThemeFormattedTitle {
  const ed = new Editor({
    editable: false,
    injectCSS: false,
    extensions: createThemedHtmlTiptapExtensions({ placeholder: '', withThemeToneMark: true }),
    content: html || '<p></p>',
  })
  try {
    return themeTitleFromTiptapDoc(ed.getJSON())
  } finally {
    ed.destroy()
  }
}
