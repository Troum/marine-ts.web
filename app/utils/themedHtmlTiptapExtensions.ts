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

/** Один и тот же набор расширений для редактора и для `generateHTML` (миграция TFT → HTML). */
export function createThemedHtmlTiptapExtensions(options: { placeholder: string }): Extensions {
  return [
    Document,
    Paragraph,
    Text,
    HardBreak.extend({
      HTMLAttributes: { class: 'mts-hard-break' },
    }),
    ThemeToneMark,
    /*
     * Цвет текста: TextStyle создаёт <span style="color: …">, Color навешивает атрибут.
     * Без TextStyle Color не работает (это требование пакета).
     */
    TextStyle,
    Color,
    /*
     * Подсветка фона (multicolor: каждый кусок может иметь свой background-color).
     * Рендерится в <mark style="background-color: …">.
     */
    Highlight.configure({ multicolor: true }),
    Placeholder.configure({
      placeholder: options.placeholder,
    }),
    UndoRedo,
  ]
}
