import { Editor } from '@tiptap/core'
import type { ThemeFormattedTitle } from '~/types'
import { createThemedHtmlTiptapExtensions } from '~/utils/themedHtmlTiptapExtensions'
import {
  serializeThemeTitleTiptapDocToHtml,
  themeTitleFromTiptapDoc,
  themeTitleToTiptapDoc,
} from '~/utils/themeToneTiptap'

/** TFT → HTML в том же виде, что отдаёт themed TipTap (для `AdminThemedTextField`). */
export function themeFormattedTitleToThemedHtml(t: ThemeFormattedTitle): string {
  return serializeThemeTitleTiptapDocToHtml(themeTitleToTiptapDoc(t))
}

/**
 * HTML из `AdminHtmlTiptapField` → TFT (только themeTone + текст; цвет/подсветка схлопываются в тон `text`).
 */
export function themedHtmlToThemeFormattedTitle(html: string): ThemeFormattedTitle {
  const ed = new Editor({
    editable: false,
    injectCSS: false,
    extensions: createThemedHtmlTiptapExtensions({ placeholder: '' }),
    content: html || '<p></p>',
  })
  try {
    return themeTitleFromTiptapDoc(ed.getJSON())
  } finally {
    ed.destroy()
  }
}
