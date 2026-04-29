import { mergeAttributes, Node } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import { Fragment } from '@tiptap/pm/model'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import { TextSelection } from '@tiptap/pm/state'

/** Tailwind-классы для сетки (статичные строки под JIT). */
export const MTS_RICH_GRID_GAP: Record<string, string> = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
}

export const MTS_RICH_GRID_COLS: Record<string, string> = {
  '1': 'md:grid-cols-1',
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-3',
  '4': 'md:grid-cols-4',
}

const MTS_RICH_CELL_SPAN: Record<string, string> = {
  '1': '',
  '2': 'md:col-span-2',
  '3': 'md:col-span-3',
  '4': 'md:col-span-4',
  full: 'md:col-span-full',
}

function gridShellClass(colsMd: string, gap: string): string {
  const c = MTS_RICH_GRID_COLS[colsMd] ?? MTS_RICH_GRID_COLS['2']
  const g = MTS_RICH_GRID_GAP[gap] ?? MTS_RICH_GRID_GAP.md
  return `mts-rich-grid grid w-full grid-cols-1 ${c} ${g} items-start`
}

function cellShellClass(span: string): string {
  const s = MTS_RICH_CELL_SPAN[span] ?? ''
  return ['mts-rich-grid-cell min-w-0', s].filter(Boolean).join(' ')
}

/** Удаление ячейки сетки по позиции начала узла (`getPos()` в NodeView). */
export function buildRemoveMtsRichGridCellTransaction(
  state: EditorState,
  cellStartPos: number,
): Transaction | null {
  if (cellStartPos < 0 || cellStartPos > state.doc.content.size) {
    return null
  }
  const inner = cellStartPos + 1
  if (inner > state.doc.content.size) {
    return null
  }
  const $from = state.doc.resolve(inner)
  for (let d = $from.depth; d > 0; d--) {
    const cellNode = $from.node(d)
    if (cellNode.type.name !== 'mtsRichGridCell') {
      continue
    }
    const gridDepth = d - 1
    if (gridDepth < 1) {
      return null
    }
    const gridNode = $from.node(gridDepth)
    if (gridNode.type.name !== 'mtsRichGrid') {
      return null
    }
    const cellPos = $from.before(d)
    const gridPos = $from.before(gridDepth)

    if (gridNode.childCount > 1) {
      return state.tr.delete(cellPos, cellPos + cellNode.nodeSize)
    }
    return state.tr.replaceWith(gridPos, gridPos + gridNode.nodeSize, cellNode.content)
  }
  return null
}

/** Переставить ячейку сетки на одну позицию раньше или позже в порядке следования (видимый порядок в CSS grid). */
export function buildMoveMtsRichGridCellTransaction(
  state: EditorState,
  cellStartPos: number,
  delta: -1 | 1,
): Transaction | null {
  if (delta !== -1 && delta !== 1) {
    return null
  }
  const cellCheck = state.doc.nodeAt(cellStartPos)
  if (!cellCheck || cellCheck.type.name !== 'mtsRichGridCell') {
    return null
  }
  const $cell = state.doc.resolve(cellStartPos + 1)
  let gridDepth = -1
  let cellDepth = -1
  for (let d = $cell.depth; d > 0; d--) {
    if ($cell.node(d).type.name === 'mtsRichGridCell') {
      cellDepth = d
    }
    if ($cell.node(d).type.name === 'mtsRichGrid') {
      gridDepth = d
      break
    }
  }
  if (gridDepth < 0 || cellDepth < 0) {
    return null
  }
  const grid = $cell.node(gridDepth)
  const from = $cell.index(gridDepth)
  const to = from + delta
  if (to < 0 || to >= grid.childCount || from === to) {
    return null
  }

  const gridPos = $cell.before(gridDepth)
  const innerStart = gridPos + 1
  const innerEnd = gridPos + grid.nodeSize - 1

  const children: PMNode[] = []
  for (let i = 0; i < grid.childCount; i++) {
    children.push(grid.child(i))
  }
  const [moved] = children.splice(from, 1)
  children.splice(to, 0, moved!)

  const frag = Fragment.from(children)
  const tr = state.tr.replaceWith(innerStart, innerEnd, frag)

  let posAtCellStart = innerStart
  for (let i = 0; i < to; i++) {
    posAtCellStart += children[i]!.nodeSize
  }
  try {
    const anchor = Math.min(posAtCellStart + 1, tr.doc.content.size - 1)
    const $r = tr.doc.resolve(Math.max(1, anchor))
    return tr.setSelection(TextSelection.near($r))
  } catch {
    return tr
  }
}

export const MtsRichGridCell = Node.create({
  name: 'mtsRichGridCell',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      span: {
        default: '1',
        parseHTML: (el) => el.getAttribute('data-cell-span') || '1',
        renderHTML: (attrs) => {
          const span = typeof attrs.span === 'string' ? attrs.span : '1'
          return span !== '1' ? { 'data-cell-span': span } : {}
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-mts-rich-cell]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const span = typeof node.attrs.span === 'string' ? node.attrs.span : '1'
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-mts-rich-cell': '',
        class: cellShellClass(span),
      }),
      0,
    ]
  },

  addNodeView() {
    return ({ node: initialNode, editor, getPos }) => {
      let node = initialNode

      const wrap = document.createElement('div')
      wrap.setAttribute('data-mts-rich-cell', '')
      wrap.className = 'mts-rich-grid-cell-node-view'

      const toolbar = document.createElement('div')
      toolbar.className = 'mts-rich-grid-cell-toolbar'

      const btnEarlier = document.createElement('button')
      btnEarlier.type = 'button'
      btnEarlier.className = 'mts-rich-grid-cell-move mts-rich-grid-cell-move--earlier'
      btnEarlier.title = 'Сдвинуть назад (по порядку в сетке)'
      btnEarlier.setAttribute('aria-label', 'Сдвинуть ячейку назад по порядку в сетке')
      btnEarlier.textContent = '↑'

      const btnLater = document.createElement('button')
      btnLater.type = 'button'
      btnLater.className = 'mts-rich-grid-cell-move mts-rich-grid-cell-move--later'
      btnLater.title = 'Сдвинуть вперёд (по порядку в сетке)'
      btnLater.setAttribute('aria-label', 'Сдвинуть ячейку вперёд по порядку в сетке')
      btnLater.textContent = '↓'

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'mts-rich-grid-cell-remove'
      btn.title = 'Удалить колонку'
      btn.setAttribute('aria-label', 'Удалить колонку')
      btn.textContent = '×'

      toolbar.appendChild(btnEarlier)
      toolbar.appendChild(btnLater)
      toolbar.appendChild(btn)

      const content = document.createElement('div')
      content.className = 'mts-rich-grid-cell-prose min-w-0'

      const applyShellClass = () => {
        const span = typeof node.attrs.span === 'string' ? node.attrs.span : '1'
        wrap.className = `mts-rich-grid-cell-node-view ${cellShellClass(span)}`.trim()
      }
      applyShellClass()

      const syncToolbar = () => {
        btn.hidden = !editor.isEditable
        btnEarlier.hidden = !editor.isEditable
        btnLater.hidden = !editor.isEditable
        if (!editor.isEditable) {
          return
        }
        const pos = getPos()
        if (typeof pos !== 'number') {
          btnEarlier.disabled = true
          btnLater.disabled = true
          return
        }
        const atCell = editor.state.doc.nodeAt(pos)
        if (!atCell || atCell.type.name !== 'mtsRichGridCell') {
          btnEarlier.disabled = true
          btnLater.disabled = true
          return
        }
        const $p = editor.state.doc.resolve(pos + 1)
        let gridDepth = -1
        for (let d = $p.depth; d > 0; d--) {
          if ($p.node(d).type.name === 'mtsRichGrid') {
            gridDepth = d
            break
          }
        }
        if (gridDepth < 0) {
          btnEarlier.disabled = true
          btnLater.disabled = true
          return
        }
        const idx = $p.index(gridDepth)
        const gridNode = $p.node(gridDepth)
        btnEarlier.disabled = idx <= 0
        btnLater.disabled = idx >= gridNode.childCount - 1
      }
      syncToolbar()

      const onMoveClick = (delta: -1 | 1) => (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!editor.isEditable) {
          return
        }
        const pos = getPos()
        if (typeof pos !== 'number') {
          return
        }
        const tr = buildMoveMtsRichGridCellTransaction(editor.state, pos, delta)
        if (tr) {
          editor.view.dispatch(tr)
        }
      }

      btnEarlier.addEventListener('mousedown', (e) => e.preventDefault())
      btnLater.addEventListener('mousedown', (e) => e.preventDefault())
      btnEarlier.addEventListener('click', onMoveClick(-1))
      btnLater.addEventListener('click', onMoveClick(1))

      btn.addEventListener('mousedown', (e) => {
        e.preventDefault()
      })
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!editor.isEditable) {
          return
        }
        const pos = getPos()
        if (typeof pos !== 'number') {
          return
        }
        const tr = buildRemoveMtsRichGridCellTransaction(editor.state, pos)
        if (tr) {
          editor.view.dispatch(tr)
        }
      })

      wrap.appendChild(toolbar)
      wrap.appendChild(content)

      const onEditorUpdate = () => {
        syncToolbar()
      }
      editor.on('update', onEditorUpdate)

      return {
        dom: wrap,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'mtsRichGridCell') {
            return false
          }
          node = updatedNode
          applyShellClass()
          syncToolbar()
          return true
        },
        destroy: () => {
          editor.off('update', onEditorUpdate)
        },
      }
    }
  },
})

export const MtsRichGrid = Node.create({
  name: 'mtsRichGrid',
  group: 'block',
  content: 'mtsRichGridCell+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      colsMd: {
        default: '2',
        parseHTML: (el) => el.getAttribute('data-cols-md') || '2',
        renderHTML: (attrs) => ({ 'data-cols-md': String(attrs.colsMd ?? '2') }),
      },
      gap: {
        default: 'md',
        parseHTML: (el) => el.getAttribute('data-gap') || 'md',
        renderHTML: (attrs) => ({ 'data-gap': String(attrs.gap ?? 'md') }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-mts-rich-grid]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const colsMd = String(node.attrs.colsMd ?? '2')
    const gap = String(node.attrs.gap ?? 'md')
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-mts-rich-grid': '',
        class: gridShellClass(colsMd, gap),
      }),
      0,
    ]
  },

  addCommands() {
    return {
      insertMtsRichGrid:
        (attrs: { colsMd?: string; gap?: string; cells?: number }) =>
        ({ editor, chain }) => {
          const cols = attrs.colsMd ?? '2'
          const gap = attrs.gap ?? 'md'
          const nCellsRaw = attrs.cells ?? (Number(cols) || 2)
          const nCells = Math.max(1, Math.min(6, nCellsRaw))
          const cells = Array.from({ length: nCells }, () => ({
            type: 'mtsRichGridCell',
            content: [{ type: 'paragraph' }],
          }))
          return chain()
            .focus()
            .insertContent({
              type: 'mtsRichGrid',
              attrs: { colsMd: cols, gap },
              content: cells,
            })
            .run()
        },

      appendMtsRichGridCell:
        () =>
        ({ editor, state, dispatch }) => {
          const { $from } = state.selection
          let gridDepth = -1
          let cellDepth = -1
          for (let d = $from.depth; d > 0; d--) {
            const n = $from.node(d)
            if (n.type.name === 'mtsRichGridCell') {
              cellDepth = d
            }
            if (n.type.name === 'mtsRichGrid') {
              gridDepth = d
              break
            }
          }
          if (gridDepth < 0) {
            return false
          }
          const gridNode = $from.node(gridDepth)
          const gridPos = $from.before(gridDepth)
          const cellType = editor.schema.nodes.mtsRichGridCell
          const paraType = editor.schema.nodes.paragraph
          if (!cellType || !paraType) {
            return false
          }
          const newCell = cellType.create(null, paraType.create())
          let insertPos: number
          if (cellDepth >= 0) {
            const cellNode = $from.node(cellDepth)
            insertPos = $from.before(cellDepth) + cellNode.nodeSize
          } else {
            insertPos = gridPos + 1 + gridNode.content.size
          }
          const tr = state.tr.insert(insertPos, newCell)
          dispatch?.(tr)
          return true
        },

      moveMtsRichGridCellEarlier:
        () =>
        ({ state, dispatch }) => {
          const { $from } = state.selection
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === 'mtsRichGridCell') {
              const cellPos = $from.before(d)
              const tr = buildMoveMtsRichGridCellTransaction(state, cellPos, -1)
              if (!tr) {
                return false
              }
              dispatch?.(tr)
              return true
            }
          }
          return false
        },

      moveMtsRichGridCellLater:
        () =>
        ({ state, dispatch }) => {
          const { $from } = state.selection
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === 'mtsRichGridCell') {
              const cellPos = $from.before(d)
              const tr = buildMoveMtsRichGridCellTransaction(state, cellPos, 1)
              if (!tr) {
                return false
              }
              dispatch?.(tr)
              return true
            }
          }
          return false
        },

      setMtsRichGridCellSpan:
        (span: string) =>
        ({ editor, state, dispatch }) => {
          const allowed = new Set(['1', '2', '3', '4', 'full'])
          if (!allowed.has(span)) {
            return false
          }
          const { $from } = state.selection
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d)
            if (node.type.name !== 'mtsRichGridCell') {
              continue
            }
            const pos = $from.before(d)
            const tr = state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, span })
            dispatch?.(tr)
            return true
          }
          return false
        },

      /** Удалить ячейку под курсором (программно; в UI — «×» на ячейке). */
      removeMtsRichGridCell:
        () =>
        ({ state, dispatch }) => {
          const { $from } = state.selection
          for (let d = $from.depth; d > 0; d--) {
            const cellNode = $from.node(d)
            if (cellNode.type.name !== 'mtsRichGridCell') {
              continue
            }
            const cellPos = $from.before(d)
            const tr = buildRemoveMtsRichGridCellTransaction(state, cellPos)
            if (!tr) {
              return false
            }
            dispatch?.(tr)
            return true
          }
          return false
        },
    }
  },
})

export const MtsRichMapEmbed = Node.create({
  name: 'mtsRichMapEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => el.querySelector('iframe')?.getAttribute('src') ?? null,
        renderHTML: () => ({}),
      },
      title: {
        default: 'Карта',
        parseHTML: (el) => el.getAttribute('data-map-title') ?? 'Карта',
        renderHTML: (attrs) =>
          (attrs.title as string)?.trim() ? { 'data-map-title': String(attrs.title) } : {},
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-mts-rich-map]',
        getAttrs: (el: HTMLElement) => {
          const iframe = el.querySelector('iframe')
          const src = iframe?.getAttribute('src')?.trim() ?? null
          const title = el.getAttribute('data-map-title')?.trim() || 'Карта'
          return src ? { src, title } : false
        },
      },
    ]
  },

  renderHTML({ node }) {
    const src = node.attrs.src as string | null
    if (!src?.trim()) {
      return ['div', { 'data-mts-rich-map': '', class: 'mts-rich-map mts-rich-map--empty' }]
    }
    const title = (node.attrs.title as string) || 'Карта'
    return [
      'div',
      {
        'data-mts-rich-map': '',
        class: 'mts-rich-map my-6 w-full overflow-hidden rounded-sm border border-mts-border',
      },
      [
        'iframe',
        {
          src: src.trim(),
          title,
          class: 'mts-rich-map-frame h-[min(420px,70vh)] w-full border-0',
          loading: 'lazy',
          referrerpolicy: 'no-referrer-when-downgrade',
          allowfullscreen: 'true',
        },
      ],
    ]
  },

  addCommands() {
    return {
      setMtsRichMapEmbed:
        (src: string, title?: string) =>
        ({ commands }) => {
          const s = src.trim()
          if (!s) {
            return false
          }
          return commands.insertContent({
            type: this.name,
            attrs: { src: s, title: title?.trim() || 'Карта' },
          })
        },
    }
  },
})

/** URL картинки для карусели в сетке (https/http или относительный /…). */
export function isSafeCarouselImgSrc(raw: string): boolean {
  const u = raw.trim()
  if (!u) {
    return false
  }
  /** Протокол-относительный URL (`//cdn/…`) — как абсолютный. */
  if (u.startsWith('//')) {
    try {
      const p = new URL(`https:${u}`)
      return p.protocol === 'https:'
    } catch {
      return false
    }
  }
  if (u.startsWith('/')) {
    const q = u.indexOf('?')
    const pathOnly = q === -1 ? u : u.slice(0, q)
    if (!/^\/[\w/.%-]+$/i.test(pathOnly)) {
      return false
    }
    if (q === -1) {
      return true
    }
    const qs = u.slice(q + 1)
    if (/[\s<>"']/.test(qs)) {
      return false
    }
    return true
  }
  try {
    const p = new URL(u)
    return p.protocol === 'http:' || p.protocol === 'https:'
  } catch {
    return false
  }
}

export const MtsRichImageCarousel = Node.create({
  name: 'mtsRichImageCarousel',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      /**
       * Внимание: атрибут уровня узла `parseHTML` ниже **перетирает** результат
       * node-level `parseHTML().getAttrs`. Поэтому каждый аргумент здесь должен
       * сам корректно вытаскивать значение из DOM, иначе после повторного
       * открытия документа TipTap занулит атрибуты и при сохранении удалит из
       * HTML слайды/настройки.
       */
      slides: {
        default: [],
        parseHTML: (el) => {
          if (typeof el === 'string' || !(el instanceof HTMLElement)) {
            return []
          }
          const slides: { src: string; alt: string }[] = []
          for (const img of el.querySelectorAll('img')) {
            const src = img.getAttribute('src')?.trim() ?? ''
            const alt = img.getAttribute('alt')?.trim() ?? ''
            if (src && isSafeCarouselImgSrc(src)) {
              slides.push({ src, alt })
            }
          }
          return slides
        },
        renderHTML: () => ({}),
      },
      intervalMs: {
        default: 6000,
        parseHTML: (el) => {
          if (typeof el === 'string' || !(el instanceof HTMLElement)) {
            return 6000
          }
          const raw = el.getAttribute('data-interval-ms')
          const v = raw != null && raw !== '' ? Number(raw) : 6000
          return Number.isFinite(v) && v >= 2000 && v <= 120000 ? v : 6000
        },
        renderHTML: () => ({}),
      },
      showDots: {
        default: true,
        parseHTML: (el) => {
          if (typeof el === 'string' || !(el instanceof HTMLElement)) {
            return true
          }
          return el.getAttribute('data-show-dots') !== 'false'
        },
        renderHTML: () => ({}),
      },
      ariaLabel: {
        default: 'Галерея изображений',
        parseHTML: (el) => {
          if (typeof el === 'string' || !(el instanceof HTMLElement)) {
            return 'Галерея изображений'
          }
          return el.getAttribute('data-carousel-label')?.trim() || 'Галерея изображений'
        },
        renderHTML: () => ({}),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-mts-rich-carousel]',
        getAttrs: (el) => {
          if (typeof el === 'string' || !(el instanceof HTMLElement)) {
            return false
          }
          const slides: { src: string; alt: string }[] = []
          for (const img of el.querySelectorAll('img')) {
            const src = img.getAttribute('src')?.trim() ?? ''
            const alt = img.getAttribute('alt')?.trim() ?? ''
            if (src && isSafeCarouselImgSrc(src)) {
              slides.push({ src, alt })
            }
          }
          /** Не возвращаем false при 0 слайдов: иначе блок пропадает из документа TipTap и в админке «дыра». */
          const intervalRaw = el.getAttribute('data-interval-ms')
          const intervalMs = intervalRaw != null && intervalRaw !== '' ? Number(intervalRaw) : 6000
          const showDots = el.getAttribute('data-show-dots') !== 'false'
          const ariaLabel =
            el.getAttribute('data-carousel-label')?.trim() || 'Галерея изображений'
          return {
            slides,
            intervalMs:
              Number.isFinite(intervalMs) && intervalMs >= 2000 && intervalMs <= 120000
                ? intervalMs
                : 6000,
            showDots,
            ariaLabel,
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    const slides = (node.attrs.slides as { src: string; alt: string }[]) ?? []
    const safeSlides = slides.filter((s) => s.src && isSafeCarouselImgSrc(s.src))
    let intervalMs = Number(node.attrs.intervalMs)
    if (!Number.isFinite(intervalMs) || intervalMs < 2000 || intervalMs > 120000) {
      intervalMs = 6000
    }
    const showDots = node.attrs.showDots !== false
    const ariaLabel =
      typeof node.attrs.ariaLabel === 'string' && node.attrs.ariaLabel.trim()
        ? node.attrs.ariaLabel.trim()
        : 'Галерея изображений'

    const attrs: Record<string, string> = {
      'data-mts-rich-carousel': '',
      class: 'mts-rich-carousel my-4 w-full max-w-full',
      'data-interval-ms': String(intervalMs),
      'data-carousel-label': ariaLabel,
    }
    if (!showDots) {
      attrs['data-show-dots'] = 'false'
    }

    if (safeSlides.length === 0) {
      return ['div', { ...attrs, class: `${attrs.class} mts-rich-carousel--empty` }]
    }

    const children = safeSlides.map(
      (s) =>
        [
          'img',
          {
            src: s.src,
            alt: s.alt || '',
            'data-carousel-slide': '',
            loading: 'lazy',
            decoding: 'async',
            class: 'block max-h-96 w-full object-contain',
          },
        ] as const,
    )
    return ['div', attrs, ...children]
  },

  /**
   * NodeView в редакторе: вместо «портянки» из настоящих <img> показываем
   * компактную сетку миниатюр с тулбаром «✎ управление / × удалить».
   * Сама модалка живёт в `AdminRichTextEditor.client.vue` — node-view общается
   * с ней через bubbled CustomEvent на DOM редактора.
   */
  addNodeView() {
    return ({ node: initialNode, editor, getPos }) => {
      let node = initialNode

      const wrap = document.createElement('div')
      wrap.className = 'mts-rich-carousel-nodeview'
      wrap.setAttribute('data-mts-rich-carousel-nodeview', '')

      const toolbar = document.createElement('div')
      toolbar.className = 'mts-rich-carousel-nodeview__toolbar'

      const titleEl = document.createElement('span')
      titleEl.className = 'mts-rich-carousel-nodeview__title'

      const btnEdit = document.createElement('button')
      btnEdit.type = 'button'
      btnEdit.className = 'mts-rich-carousel-nodeview__btn'
      btnEdit.title = 'Управление каруселью изображений'
      btnEdit.setAttribute('aria-label', 'Управление каруселью изображений')
      btnEdit.textContent = '✎'

      const btnDelete = document.createElement('button')
      btnDelete.type = 'button'
      btnDelete.className =
        'mts-rich-carousel-nodeview__btn mts-rich-carousel-nodeview__btn--danger'
      btnDelete.title = 'Удалить карусель'
      btnDelete.setAttribute('aria-label', 'Удалить карусель')
      btnDelete.textContent = '×'
      const delLabel = document.createElement('span')
      delLabel.className = 'sr-only'
      delLabel.textContent = 'Удалить карусель'
      btnDelete.appendChild(delLabel)

      toolbar.appendChild(titleEl)
      toolbar.appendChild(btnEdit)
      toolbar.appendChild(btnDelete)

      const grid = document.createElement('div')
      grid.className = 'mts-rich-carousel-nodeview__grid'

      const renderPreview = () => {
        const slides = (node.attrs.slides as { src: string; alt: string }[]) ?? []
        const safe = slides.filter((s) => s && s.src && isSafeCarouselImgSrc(s.src))
        titleEl.textContent = safe.length
          ? `Карусель изображений · ${safe.length} шт.`
          : 'Карусель изображений · пусто'

        grid.textContent = ''
        if (safe.length === 0) {
          const empty = document.createElement('div')
          empty.className = 'mts-rich-carousel-nodeview__empty'
          empty.textContent = 'Нет изображений. Нажмите «✎», чтобы добавить.'
          grid.appendChild(empty)
          return
        }

        const limit = Math.min(safe.length, 12)
        for (let i = 0; i < limit; i++) {
          const s = safe[i]!
          const cell = document.createElement('figure')
          cell.className = 'mts-rich-carousel-nodeview__cell'
          const img = document.createElement('img')
          img.src = s.src
          img.alt = s.alt || ''
          img.loading = 'lazy'
          img.decoding = 'async'
          cell.appendChild(img)
          const idx = document.createElement('span')
          idx.className = 'mts-rich-carousel-nodeview__idx'
          idx.textContent = String(i + 1)
          cell.appendChild(idx)
          grid.appendChild(cell)
        }
        if (safe.length > limit) {
          const more = document.createElement('div')
          more.className = 'mts-rich-carousel-nodeview__more'
          more.textContent = `+${safe.length - limit}`
          grid.appendChild(more)
        }
      }
      renderPreview()

      const syncEditable = () => {
        const editable = editor.isEditable
        btnEdit.hidden = !editable
        btnDelete.hidden = !editable
      }
      syncEditable()

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault()
      }

      btnEdit.addEventListener('mousedown', onMouseDown)
      btnEdit.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!editor.isEditable) {
          return
        }
        const pos = getPos()
        if (typeof pos !== 'number') {
          return
        }
        const at = editor.state.doc.nodeAt(pos)
        if (!at || at.type.name !== 'mtsRichImageCarousel') {
          return
        }
        wrap.dispatchEvent(
          new CustomEvent('mts-rich-carousel-edit', {
            bubbles: true,
            detail: { pos, attrs: { ...at.attrs } },
          }),
        )
      })

      btnDelete.addEventListener('mousedown', onMouseDown)
      btnDelete.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!editor.isEditable) {
          return
        }
        const pos = getPos()
        if (typeof pos !== 'number') {
          return
        }
        const at = editor.state.doc.nodeAt(pos)
        if (!at || at.type.name !== 'mtsRichImageCarousel') {
          return
        }
        const tr = editor.state.tr.delete(pos, pos + at.nodeSize)
        editor.view.dispatch(tr)
      })

      wrap.appendChild(toolbar)
      wrap.appendChild(grid)

      return {
        dom: wrap,
        update: (updated) => {
          if (updated.type.name !== 'mtsRichImageCarousel') {
            return false
          }
          node = updated
          renderPreview()
          syncEditable()
          return true
        },
      }
    }
  },
})

/** Вставить карусель (например из кнопки в админ-редакторе). */
export function insertImageCarouselInEditor(
  editor: Editor,
  opts: {
    slides: { src: string; alt: string }[]
    intervalMs?: number
    showDots?: boolean
    ariaLabel?: string
  },
): boolean {
  const slides = opts.slides.filter((s) => s.src.trim() && isSafeCarouselImgSrc(s.src))
  if (slides.length === 0) {
    return false
  }
  let intervalMs = Number(opts.intervalMs)
  if (!Number.isFinite(intervalMs) || intervalMs < 2000 || intervalMs > 120000) {
    intervalMs = 6000
  }
  return editor
    .chain()
    .focus()
    .insertContent({
      type: 'mtsRichImageCarousel',
      attrs: {
        slides,
        intervalMs,
        showDots: opts.showDots !== false,
        ariaLabel: opts.ariaLabel?.trim() || 'Галерея изображений',
      },
    })
    .run()
}

export function isAllowedRichMapIframeSrc(raw: string): boolean {
  const u = raw.trim()
  if (!/^https:\/\//i.test(u)) {
    return false
  }
  try {
    const host = new URL(u).hostname.replace(/^www\./, '').toLowerCase()
    const path = new URL(u).pathname
    if (host.endsWith('google.com') && path.startsWith('/maps/embed')) {
      return true
    }
    if (host === 'maps.google.com' && path.includes('/maps')) {
      return true
    }
    if (host.endsWith('openstreetmap.org') && path.includes('/export/embed')) {
      return true
    }
    if (host.endsWith('mapbox.com') && path.includes('/styles')) {
      return true
    }
    if (host.endsWith('yandex.ru') && path.includes('/map-widget')) {
      return true
    }
    if (host.endsWith('yandex.com') && path.includes('/map-widget')) {
      return true
    }
  } catch {
    return false
  }
  return false
}

/** Вставить карту из URL встраивания (iframe src), если курсор внутри ячейки сетки или в документе. */
export function insertMapInEditor(editor: Editor, src: string, title?: string): boolean {
  const s = src.trim()
  if (!isAllowedRichMapIframeSrc(s)) {
    return false
  }
  return editor.chain().focus().setMtsRichMapEmbed(s, title).run()
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertMtsRichGrid: (opts?: { colsMd?: string; gap?: string; cells?: number }) => ReturnType
    appendMtsRichGridCell: () => ReturnType
    moveMtsRichGridCellEarlier: () => ReturnType
    moveMtsRichGridCellLater: () => ReturnType
    removeMtsRichGridCell: () => ReturnType
    setMtsRichGridCellSpan: (span: string) => ReturnType
    setMtsRichMapEmbed: (src: string, title?: string) => ReturnType
  }
}
