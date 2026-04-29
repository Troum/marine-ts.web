import { Extension } from '@tiptap/core'
import { TIPTAP_FONT_WEIGHT_VALUES } from '~/utils/tiptapFontWeightConstants'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textFontWeight: {
      setTextFontWeight: (fontWeight: string | null) => ReturnType
      unsetTextFontWeight: () => ReturnType
    }
  }
}

// @ts-ignore — расширяем атрибуты textStyle из пакета
declare module '@tiptap/extension-text-style' {
  interface TextStyleAttributes {
    fontWeight?: string | null
  }
}

function parseFontWeightFromStyle(styleAttr: string | null): string | null {
  if (!styleAttr) {
    return null
  }
  const decls = styleAttr
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  for (let i = decls.length - 1; i >= 0; i -= 1) {
    const parts = decls[i]!.split(':')
    if (parts.length >= 2) {
      const prop = parts[0]!.trim().toLowerCase()
      const valRaw = parts.slice(1).join(':').trim()
      if (prop === 'font-weight') {
        return normalizeStoredFontWeight(valRaw)
      }
    }
  }
  return null
}

export function normalizeStoredFontWeight(val: string | null | undefined): string | null {
  if (val == null || val === '') {
    return null
  }
  const v = val.trim().toLowerCase()
  if (v === 'normal') {
    return '400'
  }
  if (v === 'bold' || v === 'bolder') {
    return '700'
  }
  const n = Number(v)
  if (TIPTAP_FONT_WEIGHT_VALUES.includes(n as (typeof TIPTAP_FONT_WEIGHT_VALUES)[number])) {
    return String(n)
  }
  return null
}

/**
 * `font-weight` на марке `textStyle` (рядом с Color); для AdminColorTextPopover / rich HTML.
 */
export const TiptapTextFontWeight = Extension.create({
  name: 'textFontWeight',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: (element) => {
              const fromStyle = parseFontWeightFromStyle(element.getAttribute('style'))
              if (fromStyle) {
                return fromStyle
              }
              const fromData = element.getAttribute('data-mts-font-weight')
              if (fromData) {
                const norm = normalizeStoredFontWeight(fromData)
                if (norm) {
                  return norm
                }
              }
              return normalizeStoredFontWeight(element.style?.fontWeight)
            },
            renderHTML: (attributes) => {
              if (!attributes.fontWeight) {
                return {}
              }
              return {
                style: `font-weight: ${attributes.fontWeight}`,
                'data-mts-font-weight': String(attributes.fontWeight),
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setTextFontWeight:
        (fontWeight: string | null) =>
        ({ chain }) => {
          if (fontWeight == null || fontWeight === '') {
            return chain().setMark('textStyle', { fontWeight: null }).removeEmptyTextStyle().run()
          }
          return chain().setMark('textStyle', { fontWeight }).run()
        },
      unsetTextFontWeight:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontWeight: null }).removeEmptyTextStyle().run()
        },
    }
  },
})
