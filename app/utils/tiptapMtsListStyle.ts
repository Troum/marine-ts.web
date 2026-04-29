import { mergeAttributes } from '@tiptap/core'
import { BulletList } from '@tiptap/extension-bullet-list'
import { OrderedList } from '@tiptap/extension-ordered-list'

export type BulletListStyleType = 'disc' | 'circle' | 'square' | 'none' | 'custom'

/** Безопасный URL или относительный путь для list-style-image. */
export function isSafeListMarkerUrl(raw: string): boolean {
  const u = raw.trim()
  if (!u) {
    return false
  }
  if (u.startsWith('/')) {
    return /^\/[\w/.%-]+$/i.test(u)
  }
  try {
    const p = new URL(u)
    return p.protocol === 'http:' || p.protocol === 'https:'
  } catch {
    return false
  }
}

function parseUlAttrs(el: HTMLElement): { listStyleType: BulletListStyleType; markerIcon: string | null } {
  let listStyleType: BulletListStyleType =
    (el.getAttribute('data-list-style') as BulletListStyleType) || 'disc'
  let markerIcon: string | null =
    el.getAttribute('data-marker-icon')?.trim()
    || el.getAttribute('data-marker-url')?.trim()
    || null

  const style = el.getAttribute('style') || ''
  const mImg = /list-style-image:\s*url\(\s*["']?([^)"']+)["']?\s*\)/i.exec(style)
  if (mImg) {
    listStyleType = 'custom'
    markerIcon = mImg[1]!.trim()
    return { listStyleType, markerIcon }
  }
  const mType = /list-style-type:\s*['"]([^'"]+)['"]/i.exec(style)
  if (mType) {
    const inner = mType[1]!.trim()
    if (inner === 'circle' || inner === 'square' || inner === 'none') {
      listStyleType = inner
      markerIcon = null
    }
    else {
      listStyleType = 'custom'
      markerIcon = inner
    }
    return { listStyleType, markerIcon }
  }

  if (!el.getAttribute('data-list-style') && !markerIcon) {
    listStyleType = 'disc'
    markerIcon = null
  }

  return { listStyleType, markerIcon }
}

export const MtsBulletList = BulletList.extend({
  addAttributes() {
    return {
      listStyleType: {
        default: 'disc',
        renderHTML: () => ({}),
        parseHTML: () => null,
      },
      markerIcon: {
        default: null,
        renderHTML: () => ({}),
        parseHTML: () => null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'ul',
        priority: 100,
        getAttrs: (el) => {
          if (typeof el === 'string' || !(el instanceof Element)) {
            return false
          }
          return parseUlAttrs(el as HTMLElement)
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const listStyleType = (node.attrs.listStyleType || 'disc') as BulletListStyleType
    const markerIcon = (node.attrs.markerIcon as string | null) ?? null

    const attrs: Record<string, string> = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)

    delete (attrs as { listStyleType?: unknown }).listStyleType
    delete (attrs as { markerIcon?: unknown }).markerIcon

    if (listStyleType !== 'disc') {
      attrs['data-list-style'] = listStyleType
    }

    if (listStyleType === 'custom' && markerIcon) {
      if (isSafeListMarkerUrl(markerIcon)) {
        const u = markerIcon.trim().replace(/\\/g, '/')
        const q = u.replace(/"/g, '%22')
        attrs['data-list-style'] = 'custom'
        attrs['data-marker-url'] = u
        attrs.style = `list-style-type:none;list-style-image:url("${q}")`
      }
      else {
        attrs['data-list-style'] = 'custom'
        attrs['data-marker-icon'] = markerIcon
        const safe = markerIcon.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
        attrs.style = `list-style-type:'${safe}'`
      }
    }
    return ['ul', attrs, 0]
  },
})

/** Ключи — значения для UI; значения — атрибут type у <ol>. */
export const ORDERED_LIST_STYLE_TO_ATTR = {
  decimal: '1',
  'lower-alpha': 'a',
  'upper-alpha': 'A',
  'lower-roman': 'i',
  'upper-roman': 'I',
} as const

export type OrderedListStyleKey = keyof typeof ORDERED_LIST_STYLE_TO_ATTR

/** Атрибуты узла bulletList для `editor.chain().updateAttributes('bulletList', …)`. */
export function attrsForBulletListStyle(opts: {
  listStyleType: BulletListStyleType
  markerIcon?: string | null
}): { listStyleType: BulletListStyleType; markerIcon: string | null } {
  return {
    listStyleType: opts.listStyleType,
    markerIcon:
      opts.listStyleType === 'custom' && opts.markerIcon?.trim()
        ? opts.markerIcon.trim()
        : null,
  }
}

/** Атрибуты узла orderedList для `updateAttributes('orderedList', …)` (поле `type` у ol). */
export function attrsForOrderedListStyle(style: OrderedListStyleKey): { type: string | null } {
  const typeAttr = style === 'decimal' ? null : (ORDERED_LIST_STYLE_TO_ATTR[style] ?? null)
  return { type: typeAttr }
}

export const MtsOrderedList = OrderedList.extend({})
