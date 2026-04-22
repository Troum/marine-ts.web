import { Mark, mergeAttributes, type JSONContent } from '@tiptap/core'
import type { ThemeFormattedTitle, ThemeTitleSpan, ThemeTitleTone } from '~/types'
import { THEME_TITLE_TONE_CLASSES, emptyThemeTitle, isThemeTitleTone } from '~/utils/themeFormattedTitle'

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
    const cssVarByTone: Record<ThemeTitleTone, string> = {
      text: 'var(--color-mts-text)',
      textSecondary: 'var(--color-mts-text-secondary)',
      textMuted: 'var(--color-mts-text-muted)',
      accent: 'var(--color-mts-accent)',
      accentLight: 'var(--color-mts-accent-light)',
      accentDark: 'var(--color-mts-accent-dark)',
      marker: 'var(--color-mts-marker)',
    }
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-mts-tone': tone,
        class: cls,
        style: `color: ${cssVarByTone[tone]}; -webkit-text-fill-color: ${cssVarByTone[tone]};`,
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
