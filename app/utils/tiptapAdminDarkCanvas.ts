import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/** Класс на `ProseMirror`: тёмный холст только когда в документе есть очень светлый цвет текста. */
export const TIPTAP_ADMIN_DARK_CANVAS_CLASS = 'admin-tiptap-editing-surface--dark-canvas'

function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/**
 * true — цвет текста достаточно светлый, чтобы на белом холсте админки его плохо видно;
 * тогда включается тёмный фон редактора (только в админке, не в сохранённом HTML).
 */
export function colorStringIsVeryLight(raw: string): boolean {
  const s = raw.trim().toLowerCase()
  if (!s) {
    return false
  }
  if (s === 'white' || s === '#fff' || s === '#ffffff') {
    return true
  }

  if (s.startsWith('#')) {
    let h = s.slice(1)
    if (!/^[\da-f]+$/i.test(h)) {
      return false
    }
    if (h.length === 3) {
      h = h.split('').map((ch) => ch + ch).join('')
    }
    if (h.length === 8) {
      const a = Number.parseInt(h.slice(6, 8), 16)
      if (a < 200) {
        return false
      }
      h = h.slice(0, 6)
    }
    if (h.length !== 6) {
      return false
    }
    const n = Number.parseInt(h, 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return relativeLuminance(r / 255, g / 255, b / 255) > 0.85
  }

  const rgbM = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/i)
  if (rgbM) {
    let r = Number(rgbM[1])
    let g = Number(rgbM[2])
    let b = Number(rgbM[3])
    const aRaw = rgbM[4]
    if (aRaw != null && aRaw !== '1' && aRaw !== '100%') {
      const alpha = aRaw.endsWith('%') ? Number(aRaw.slice(0, -1)) / 100 : Number(aRaw)
      if (Number.isFinite(alpha) && alpha < 0.35) {
        return false
      }
    }
    if ([r, g, b].some((v) => Number.isNaN(v))) {
      return false
    }
    if (r <= 1 && g <= 1 && b <= 1 && (r > 0 || g > 0 || b > 0)) {
      r *= 255
      g *= 255
      b *= 255
    }
    return relativeLuminance(r / 255, g / 255, b / 255) > 0.85
  }

  return false
}

export function tiptapDocHasVeryLightTextColor(doc: ProseMirrorNode): boolean {
  let found = false
  doc.descendants((node) => {
    if (found || !node.isText) {
      return
    }
    for (const mark of node.marks) {
      if (mark.type.name !== 'textStyle') {
        continue
      }
      const c = mark.attrs.color
      if (typeof c === 'string' && colorStringIsVeryLight(c)) {
        found = true
        return
      }
    }
  })
  return found
}

export function applyTiptapDarkEditingCanvas(editor: Editor | null | undefined): void {
  if (!editor?.view || editor.isDestroyed) {
    return
  }
  const dom = editor.view.dom as HTMLElement
  const need = tiptapDocHasVeryLightTextColor(editor.state.doc)
  dom.classList.toggle(TIPTAP_ADMIN_DARK_CANVAS_CLASS, need)
}
