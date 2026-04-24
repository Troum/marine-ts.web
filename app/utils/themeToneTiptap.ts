import { Mark, mergeAttributes, type JSONContent } from '@tiptap/core'
import type { ThemeFormattedTitle, ThemeTitleSpan, ThemeTitleTone } from '~/types'
import { THEME_TITLE_TONE_CLASSES, emptyThemeTitle, isThemeTitleTone } from '~/utils/themeFormattedTitle'

/** CSS-переменные тона — общие для ThemeToneMark и SSR-сериализации в HTML. */
export const THEME_TONE_CSS_VARS: Record<ThemeTitleTone, string> = {
  text: 'var(--color-mts-text)',
  textSecondary: 'var(--color-mts-text-secondary)',
  textMuted: 'var(--color-mts-text-muted)',
  accent: 'var(--color-mts-accent)',
  accentLight: 'var(--color-mts-accent-light)',
  accentDark: 'var(--color-mts-accent-dark)',
  marker: 'var(--color-mts-marker)',
}

/** Inline-mark цвета темы Marin (только допустимые тона). */
export const ThemeToneMark = Mark.create({
  name: 'themeTone',
  inclusive: true,
  addAttributes() {
    return {
      tone: {
        default: 'text',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-mts-tone') || 'text',
        renderHTML: (attrs: Record<string, unknown>) => {
          const t = attrs.tone
          return typeof t === 'string' ? { 'data-mts-tone': t } : {}
        },
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-mts-tone]',
        getAttrs: (el: HTMLElement) => ({
          tone: el.getAttribute('data-mts-tone') || 'text',
        }),
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    const raw = HTMLAttributes.tone
    const tone: ThemeTitleTone = isThemeTitleTone(raw) ? raw : 'text'
    const cls = THEME_TITLE_TONE_CLASSES[tone] ?? 'text-mts-text'
    /*
     * Inline style с CSS-переменной темы — единственный способ гарантированно
     * перебить наследование цвета от `.admin-shell` и заодно обойти
     * непредсказуемую генерацию динамических Tailwind-классов в редакторе.
     * На публичном сайте --color-mts-* подставляется тёмной/светлой темой —
     * цвет всегда корректный.
     */
    const v = THEME_TONE_CSS_VARS[tone]
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-mts-tone': tone,
        class: cls,
        style: `color: ${v}; -webkit-text-fill-color: ${v};`,
      }),
      0,
    ]
  },
})

/** Одна строка текста в ProseMirror: переносы строк как `hardBreak`, тона — marks. */
export function themeTitleToTiptapDoc(title: ThemeFormattedTitle): JSONContent {
  const spans = title.spans?.length ? title.spans : emptyThemeTitle().spans
  const content: JSONContent[] = []
  for (const s of spans) {
    const tone: ThemeTitleTone = isThemeTitleTone(s.tone) ? s.tone : 'text'
    const text = s.text ?? ''
    const parts = text.split('\n')
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] ?? ''
      /* ProseMirror: RangeError «Empty text nodes are not allowed» — нельзя text: ''. */
      if (part.length > 0) {
        content.push({
          type: 'text',
          text: part,
          marks: [{ type: 'themeTone', attrs: { tone } }],
        })
      }
      if (i < parts.length - 1) {
        content.push({ type: 'hardBreak' })
      }
    }
  }
  /*
   * Пустой абзац без текстовых узлов — допустим; пустой text-узел — нет.
   * Раньше сюда попадал { text: '', tone } из emptyThemeTitle() → ломало setContent.
   */
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: content.length > 0 ? content : [] }],
  }
}

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Документ из `themeTitleToTiptapDoc` → HTML без TipTap `generateHTML`
 * (на SSR нет `window`; разметка совпадает с ThemeToneMark + Paragraph + HardBreak).
 */
export function serializeThemeTitleTiptapDocToHtml(doc: JSONContent): string {
  const first = doc.content?.[0]
  if (!first || first.type !== 'paragraph') {
    return '<p></p>'
  }
  const chunks: string[] = []
  for (const node of first.content ?? []) {
    if (node.type === 'hardBreak') {
      chunks.push('<br class="mts-hard-break">')
      continue
    }
    if (node.type === 'text' && node.text != null && node.text !== '') {
      const marks = node.marks ?? []
      const themeM = marks.find((m) => m.type === 'themeTone')
      const toneRaw = themeM?.attrs?.tone
      const tone: ThemeTitleTone = isThemeTitleTone(toneRaw) ? toneRaw : 'text'
      const cls = THEME_TITLE_TONE_CLASSES[tone]
      const v = THEME_TONE_CSS_VARS[tone]
      const style = `color: ${v}; -webkit-text-fill-color: ${v};`
      chunks.push(
        `<span data-mts-tone="${tone}" class="${cls}" style="${style}">${escapeHtmlText(node.text)}</span>`,
      )
    }
  }
  return `<p>${chunks.join('')}</p>`
}

export function themeTitleFromTiptapDoc(doc: JSONContent | null | undefined): ThemeFormattedTitle {
  const fallback = emptyThemeTitle()
  if (!doc?.content?.length) {
    return fallback
  }
  const first = doc.content[0]
  if (first.type !== 'paragraph') {
    return fallback
  }
  const pContent = first.content
  if (!pContent?.length) {
    return { spans: [{ text: '', tone: 'text' }] }
  }
  const spans: ThemeTitleSpan[] = []
  for (const node of pContent) {
    if (node.type === 'hardBreak') {
      const last = spans[spans.length - 1]
      if (last) {
        last.text += '\n'
      } else {
        spans.push({ text: '\n', tone: 'text' })
      }
      continue
    }
    if (node.type !== 'text') {
      continue
    }
    const text = node.text ?? ''
    if (text.length === 0) {
      continue
    }
    const mark = node.marks?.find((m) => m.type === 'themeTone')
    const raw = mark?.attrs?.tone
    const tone: ThemeTitleTone = isThemeTitleTone(raw) ? raw : 'text'
    const last = spans[spans.length - 1]
    if (last && last.tone === tone) {
      last.text += text
    } else {
      spans.push({ text, tone })
    }
  }
  if (!spans.length) {
    return fallback
  }
  return { spans }
}
