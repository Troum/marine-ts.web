import type { Extensions } from '@tiptap/core'
import { Color } from '@tiptap/extension-color'
import Document from '@tiptap/extension-document'
import HardBreak from '@tiptap/extension-hard-break'
import Highlight from '@tiptap/extension-highlight'
import Paragraph from '@tiptap/extension-paragraph'
import Placeholder from '@tiptap/extension-placeholder'
import Text from '@tiptap/extension-text'
import { TextStyle } from '@tiptap/extension-text-style'
import { UndoRedo } from '@tiptap/extensions'
import { ThemeToneMark } from '~/utils/themeToneTiptap'
import { TiptapTextFontWeight } from '~/utils/tiptapTextFontWeightExtension'

/** Набор расширений для редактора; TFT → HTML на SSR — `serializeThemeTitleTiptapDocToHtml`. */
export function createThemedHtmlTiptapExtensions(options: {
  placeholder: string
  /** Нужен только для редакторов TFT (AdminThemeTitleEditor). */
  withThemeToneMark?: boolean
}): Extensions {
  const withThemeToneMark = options.withThemeToneMark === true
  /*
   * Редактор заголовка TFT: только `themeTone` для цвета и веса.
   * TextStyle + Color + font-weight на textStyle конфликтуют с ThemeToneMark в ProseMirror
   * (дублирующиеся span’ы / приоритет стилей) — палитра «Акцент тёмный» и начертание
   * визуально не применялись, хотя атрибуты марки менялись.
   */
  const richHtmlMarks: Extensions = withThemeToneMark
    ? []
    : [
        TextStyle,
        Color,
        TiptapTextFontWeight,
        Highlight.configure({ multicolor: true }),
      ]

  return [
    Document,
    Paragraph,
    Text,
    HardBreak.extend({
      HTMLAttributes: { class: 'mts-hard-break' },
    }),
    ...(withThemeToneMark ? [ThemeToneMark] : []),
    ...richHtmlMarks,
    Placeholder.configure({
      placeholder: options.placeholder,
    }),
    UndoRedo,
  ]
}
