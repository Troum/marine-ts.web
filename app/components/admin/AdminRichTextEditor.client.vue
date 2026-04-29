<script setup lang="ts">
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import YoutubeExtension from '@tiptap/extension-youtube'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { type Editor, EditorContent, useEditor } from '@tiptap/vue-3'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Braces,
  ChevronDown,
  ChevronUp,
  Code,
  Columns2,
  Columns3,
  Eraser,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  ImagePlus,
  Images,
  GalleryVerticalEnd,
  Italic,
  LayoutGrid,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTree,
  Loader2,
  MapPin,
  Minus,
  PlusSquare,
  Quote,
  Redo2,
  FolderOpen,
  Strikethrough,
  Table2,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  Upload,
  X,
  Youtube as YoutubeIcon,
} from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { sanitizeRichContentHtml } from '~/composables/useMarkdownSafeHtml'
import { applyTiptapDarkEditingCanvas } from '~/utils/tiptapAdminDarkCanvas'
import {
  isAllowedRichMapIframeSrc,
  insertImageCarouselInEditor,
  insertImageGalleryInEditor,
  isSafeCarouselImgSrc,
  MTS_RICH_GALLERY_COLUMNS,
  MtsRichGrid,
  MtsRichGridCell,
  MtsRichImageCarousel,
  MtsRichImageGallery,
  MtsRichMapEmbed,
} from '~/utils/tiptapMtsRichLayout'
import {
  attrsForBulletListStyle,
  attrsForOrderedListStyle,
  isSafeListMarkerUrl,
  MtsBulletList,
  MtsOrderedList,
  type BulletListStyleType,
  type OrderedListStyleKey,
} from '~/utils/tiptapMtsListStyle'
import { TiptapTextFontWeight } from '~/utils/tiptapTextFontWeightExtension'
import type { MediaLibraryItem } from '~/types'
import AdminColorTextPopover from './AdminColorTextPopover.client.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    placeholder?: string
    allowImages?: boolean
  }>(),
  { disabled: false, placeholder: 'Текст страницы…', allowImages: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const charCount = ref(0)
/** Счётчик для пересчёта computed от позиции курсора (без смены doc). */
const tiptapUiTick = ref(0)
const linkDialogOpen = ref(false)
const linkHref = ref('')
const linkNewTab = ref(true)
const linkInputRef = ref<HTMLInputElement | null>(null)

const imageDialogOpen = ref(false)
const imageUrl = ref('https://')
const imageInputRef = ref<HTMLInputElement | null>(null)
const imageUploading = ref(false)
const imageFileInputRef = ref<HTMLInputElement | null>(null)
/*
 * Состояние «выбрать из медиатеки» для диалога одиночной картинки.
 * Список загружаем лениво при первом раскрытии панели; клик по плитке
 * сразу подставляет URL в поле и применяет диалог.
 */
const imageMediaPanelOpen = ref(false)
const imageMediaItems = ref<MediaLibraryItem[]>([])
const imageMediaLoading = ref(false)

const api = useMarineApi()
const adminToast = useAdminToast()

const youtubeDialogOpen = ref(false)
const youtubeUrl = ref('https://www.youtube.com/watch?v=')
const youtubeInputRef = ref<HTMLInputElement | null>(null)

const mapDialogOpen = ref(false)
const mapUrl = ref('https://')
const mapTitle = ref('Карта')
const mapInputRef = ref<HTMLInputElement | null>(null)

const carouselDialogOpen = ref(false)
/** Позиция узла, который сейчас редактируем; `null` => вставляем новый. */
const carouselEditingPos = ref<number | null>(null)
const carouselSlides = ref<{ src: string; alt: string }[]>([])
const carouselIntervalMs = ref(6000)
const carouselShowDots = ref(true)
const carouselAriaLabel = ref('Галерея изображений')
const carouselNewUrl = ref('')
const carouselNewUrlInputRef = ref<HTMLInputElement | null>(null)
const carouselUploading = ref(false)
const carouselMediaPanelOpen = ref(false)
const carouselMediaItems = ref<MediaLibraryItem[]>([])
const carouselMediaLoading = ref(false)
const carouselMediaSelectedUrls = ref<string[]>([])

/* ── Галерея (Masonry) — параллельный набор state к карусели ─────────── */
const galleryDialogOpen = ref(false)
const galleryEditingPos = ref<number | null>(null)
const galleryImages = ref<{ src: string; alt: string }[]>([])
const galleryColumns = ref<number>(3)
const galleryAriaLabel = ref('Галерея изображений')
const galleryNewUrl = ref('')
const galleryNewUrlInputRef = ref<HTMLInputElement | null>(null)
const galleryUploading = ref(false)
const galleryMediaPanelOpen = ref(false)
const galleryMediaItems = ref<MediaLibraryItem[]>([])
const galleryMediaLoading = ref(false)
const galleryMediaSelectedUrls = ref<string[]>([])

const editorRootRef = ref<HTMLDivElement | null>(null)

const listStyleOpen = ref(false)
const listStyleAnchorRef = ref<HTMLElement | null>(null)
const listCustomMarkerInput = ref('')

const ORDERED_TYPE_TO_STYLE: Record<string, OrderedListStyleKey> = {
  '1': 'decimal',
  a: 'lower-alpha',
  A: 'upper-alpha',
  i: 'lower-roman',
  I: 'upper-roman',
}

const ORDERED_LIST_STYLE_OPTIONS: { key: OrderedListStyleKey; label: string }[] = [
  { key: 'decimal', label: '1 2 3' },
  { key: 'lower-alpha', label: 'a b' },
  { key: 'upper-alpha', label: 'A B' },
  { key: 'lower-roman', label: 'i ii' },
  { key: 'upper-roman', label: 'I II' },
]

const imageExtensions = props.allowImages
  ? [
      Image.configure({
        HTMLAttributes: {
          class: 'block max-w-full rounded-sm object-contain',
        },
        resize: {
          enabled: true,
          alwaysPreserveAspectRatio: true,
          minWidth: 64,
          minHeight: 48,
        },
      }),
      MtsRichImageCarousel,
      MtsRichImageGallery,
    ]
  : []

const editor = useEditor({
  content: props.modelValue?.trim() ? props.modelValue : '<p></p>',
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      bulletList: false,
      orderedList: false,
      codeBlock: {
        HTMLAttributes: {
          class: 'admin-rich-code-block',
        },
      },
    }),
    MtsBulletList,
    MtsOrderedList,
    Underline,
    TextStyle,
    Color,
    TiptapTextFontWeight,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-mts-accent underline underline-offset-2',
      },
    }),
    TableKit.configure({
      table: { resizable: false },
    }),
    ...imageExtensions,
    MtsRichGridCell,
    MtsRichGrid,
    MtsRichMapEmbed,
    YoutubeExtension.configure({
      controls: true,
      nocookie: true,
      HTMLAttributes: {
        class: 'aspect-video w-full max-w-full rounded-sm border border-mts-border',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'admin-rich-text-prose admin-tiptap-editing-surface max-w-none focus:outline-none',
    },
    transformPastedHTML(html) {
      return sanitizeRichContentHtml(html)
    },
  },
  onUpdate: ({ editor: ed }) => {
    charCount.value = ed.getText().length
    tiptapUiTick.value++
    applyTiptapDarkEditingCanvas(ed)
    emit('update:modelValue', ed.getHTML())
  },
  onSelectionUpdate: () => {
    tiptapUiTick.value++
  },
  onCreate: ({ editor: ed }) => {
    charCount.value = ed.getText().length
    tiptapUiTick.value++
    applyTiptapDarkEditingCanvas(ed)
  },
})

watch(
  () => props.modelValue,
  (v) => {
    const ed = editor.value
    if (!ed) {
      return
    }
    const next = v || '<p></p>'
    if (next === ed.getHTML()) {
      return
    }
    ed.commands.setContent(next, false)
    charCount.value = ed.getText().length
    nextTick(() => applyTiptapDarkEditingCanvas(ed))
  },
)

watch(
  () => props.disabled,
  (d) => {
    editor.value?.setEditable(!d)
  },
  { immediate: true },
)

watch(linkDialogOpen, async (open) => {
  if (open) {
    await nextTick()
    linkInputRef.value?.focus()
    linkInputRef.value?.select()
  }
})

watch(imageDialogOpen, async (open) => {
  if (open) {
    await nextTick()
    imageInputRef.value?.focus()
    imageInputRef.value?.select()
  }
})

watch(youtubeDialogOpen, async (open) => {
  if (open) {
    await nextTick()
    youtubeInputRef.value?.focus()
    youtubeInputRef.value?.select()
  }
})

watch(mapDialogOpen, async (open) => {
  if (open) {
    await nextTick()
    mapInputRef.value?.focus()
    mapInputRef.value?.select()
  }
})

watch(carouselDialogOpen, async (open) => {
  if (typeof window === 'undefined') {
    return
  }
  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    carouselNewUrlInputRef.value?.focus()
  } else {
    document.body.style.overflow = ''
  }
})

watch(galleryDialogOpen, async (open) => {
  if (typeof window === 'undefined') {
    return
  }
  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    galleryNewUrlInputRef.value?.focus()
  } else {
    document.body.style.overflow = ''
  }
})

const inBulletList = computed(() => editor.value?.isActive('bulletList'))
const inOrderedList = computed(() => editor.value?.isActive('orderedList'))

const activeOrderedListStyle = computed((): OrderedListStyleKey => {
  const ed = editor.value
  if (!ed?.isActive('orderedList')) {
    return 'decimal'
  }
  const t = ed.getAttributes('orderedList').type as string | null | undefined
  if (t == null || t === '') {
    return 'decimal'
  }
  return ORDERED_TYPE_TO_STYLE[t] ?? 'decimal'
})

onClickOutside(listStyleAnchorRef, () => {
  listStyleOpen.value = false
})

function toggleListStylePopover() {
  const next = !listStyleOpen.value
  listStyleOpen.value = next
  if (!next || !editor.value) {
    return
  }
  if (editor.value.isActive('bulletList')) {
    const a = editor.value.getAttributes('bulletList') as {
      listStyleType?: BulletListStyleType
      markerIcon?: string | null
    }
    if (a.listStyleType === 'custom' && a.markerIcon) {
      listCustomMarkerInput.value = a.markerIcon
    }
    else {
      listCustomMarkerInput.value = ''
    }
  }
}

function applyBulletListPreset(style: Exclude<BulletListStyleType, 'custom'>) {
  editor.value
    ?.chain()
    .focus()
    .updateAttributes('bulletList', attrsForBulletListStyle({ listStyleType: style, markerIcon: null }))
    .run()
}

function applyBulletListCustom() {
  const raw = listCustomMarkerInput.value.trim()
  if (!raw || !editor.value) {
    return
  }
  if (!props.allowImages && isSafeListMarkerUrl(raw)) {
    adminToast.show({
      title: 'Изображения отключены',
      message: 'В этом редакторе можно использовать только текстовый символ маркера.',
    })
    return
  }
  editor.value
    .chain()
    .focus()
    .updateAttributes('bulletList', attrsForBulletListStyle({ listStyleType: 'custom', markerIcon: raw }))
    .run()
}

function applyOrderedStyle(style: OrderedListStyleKey) {
  editor.value
    ?.chain()
    .focus()
    .updateAttributes('orderedList', attrsForOrderedListStyle(style))
    .run()
}

function btnClass(active: boolean) {
  return [
    'inline-flex h-9 w-9 shrink-0 items-center justify-center border transition-colors',
    active
      ? 'border-mts-accent bg-mts-accent/10 text-mts-accent'
      : 'border-transparent bg-white text-mts-text-secondary hover:border-mts-border hover:text-mts-text',
    props.disabled ? 'pointer-events-none opacity-50' : '',
  ]
}

function openLinkDialog() {
  const ed = editor.value
  if (!ed) {
    return
  }
  const attrs = ed.getAttributes('link')
  linkHref.value = (attrs.href as string | undefined)?.trim() || 'https://'
  linkNewTab.value = attrs.target === '_blank'
  linkDialogOpen.value = true
}

function applyLinkDialog() {
  const ed = editor.value
  if (!ed) {
    linkDialogOpen.value = false
    return
  }
  const href = linkHref.value.trim()
  if (!href) {
    ed.chain().focus().extendMarkRange('link').unsetLink().run()
  }
  else {
    ed
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href,
        target: linkNewTab.value ? '_blank' : null,
        rel: linkNewTab.value ? 'noopener noreferrer' : null,
      })
      .run()
  }
  linkDialogOpen.value = false
}

function cancelLinkDialog() {
  linkDialogOpen.value = false
}

function clearFormatting() {
  editor.value?.chain().focus().unsetAllMarks().clearNodes().run()
}

function openImageDialog() {
  if (!editor.value) {
    return
  }
  imageUrl.value = 'https://'
  imageMediaPanelOpen.value = false
  imageDialogOpen.value = true
}

function applyImageDialog() {
  const ed = editor.value
  if (!ed) {
    imageDialogOpen.value = false
    return
  }
  const u = imageUrl.value.trim()
  if (u) {
    ed.chain().focus().setImage({ src: u }).run()
  }
  imageDialogOpen.value = false
  imageMediaPanelOpen.value = false
}

function cancelImageDialog() {
  imageDialogOpen.value = false
  imageMediaPanelOpen.value = false
}

function toggleImageMediaPanel() {
  imageMediaPanelOpen.value = !imageMediaPanelOpen.value
  if (
    imageMediaPanelOpen.value
    && imageMediaItems.value.length === 0
    && !imageMediaLoading.value
  ) {
    void loadImageMediaLibrary()
  }
}

async function loadImageMediaLibrary() {
  imageMediaLoading.value = true
  try {
    imageMediaItems.value = await api.media.listManage()
  } catch {
    adminToast.show({
      title: 'Ошибка',
      message: 'Не удалось получить список изображений из медиатеки',
    })
  } finally {
    imageMediaLoading.value = false
  }
}

/**
 * Один клик по плитке в медиатеке = выбор картинки. Сразу подставляем URL
 * в поле и применяем диалог, чтобы не заставлять пользователя нажимать
 * «Вставить» повторно — это ожидаемое поведение для одиночной картинки.
 */
function pickImageFromMedia(url: string) {
  if (props.disabled || !editor.value) {
    return
  }
  imageUrl.value = url
  applyImageDialog()
}

function pickImageFile() {
  if (props.disabled || !editor.value) {
    return
  }
  imageFileInputRef.value?.click()
}

async function onImageFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  const ed = editor.value
  if (!file || !ed) {
    return
  }
  imageUploading.value = true
  try {
    const res = await api.media.upload(file)
    ed.chain().focus().setImage({ src: res.url }).run()
    if (imageDialogOpen.value) {
      imageDialogOpen.value = false
    }
    adminToast.success('Изображение загружено')
  } catch {
    adminToast.show({ title: 'Ошибка', message: 'Не удалось загрузить файл' })
  } finally {
    imageUploading.value = false
  }
}

function openYoutubeDialog() {
  if (!editor.value) {
    return
  }
  youtubeUrl.value = 'https://www.youtube.com/watch?v='
  youtubeDialogOpen.value = true
}

function applyYoutubeDialog() {
  const ed = editor.value
  if (!ed) {
    youtubeDialogOpen.value = false
    return
  }
  const u = youtubeUrl.value.trim()
  if (u) {
    ed.chain().focus().setYoutubeVideo({ src: u }).run()
  }
  youtubeDialogOpen.value = false
}

function cancelYoutubeDialog() {
  youtubeDialogOpen.value = false
}

function insertRichGrid(colsMd: '2' | '3' | '4') {
  const n = colsMd === '2' ? 2 : colsMd === '3' ? 3 : 4
  editor.value?.chain().focus().insertMtsRichGrid({ colsMd, gap: 'md', cells: n }).run()
}

function appendRichGridCell() {
  editor.value?.chain().focus().appendMtsRichGridCell().run()
}

const canAppendRichGridCell = computed(() => {
  void tiptapUiTick.value
  const ed = editor.value
  if (!ed) {
    return false
  }
  const { $from } = ed.state.selection
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'mtsRichGrid') {
      return true
    }
  }
  return false
})

/** Порядок ячейки в родительской сетке — для «вверх / вниз» по сетке. */
const richGridCellNav = computed(() => {
  void tiptapUiTick.value
  const ed = editor.value
  if (!ed) {
    return { inCell: false, canEarlier: false, canLater: false }
  }
  const { $from } = ed.state.selection
  let cellDepth = -1
  let gridDepth = -1
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'mtsRichGridCell') {
      cellDepth = d
    }
    if ($from.node(d).type.name === 'mtsRichGrid') {
      gridDepth = d
      break
    }
  }
  if (cellDepth < 0 || gridDepth < 0) {
    return { inCell: false, canEarlier: false, canLater: false }
  }
  const idx = $from.index(gridDepth)
  const gridNode = $from.node(gridDepth)
  return {
    inCell: true,
    canEarlier: idx > 0,
    canLater: idx < gridNode.childCount - 1,
  }
})

function setRichCellSpan(span: string) {
  editor.value?.chain().focus().setMtsRichGridCellSpan(span).run()
}

function openMapDialog() {
  if (!editor.value) {
    return
  }
  mapUrl.value = 'https://'
  mapTitle.value = 'Карта'
  mapDialogOpen.value = true
}

function applyMapDialog() {
  const ed = editor.value
  if (!ed) {
    mapDialogOpen.value = false
    return
  }
  const u = mapUrl.value.trim()
  if (u && isAllowedRichMapIframeSrc(u)) {
    ed.chain().focus().setMtsRichMapEmbed(u, mapTitle.value.trim() || 'Карта').run()
  }
  mapDialogOpen.value = false
}

function cancelMapDialog() {
  mapDialogOpen.value = false
}

function resetCarouselDialogState() {
  carouselSlides.value = []
  carouselIntervalMs.value = 6000
  carouselShowDots.value = true
  carouselAriaLabel.value = 'Галерея изображений'
  carouselNewUrl.value = ''
  carouselMediaPanelOpen.value = false
  carouselMediaItems.value = []
  carouselMediaSelectedUrls.value = []
  carouselEditingPos.value = null
}

function openCarouselDialog() {
  if (!editor.value) {
    return
  }
  resetCarouselDialogState()
  carouselDialogOpen.value = true
}

/**
 * Открыть модалку для редактирования уже вставленной карусели —
 * вызывается из CustomEvent('mts-rich-carousel-edit') нашего node-view.
 */
function openCarouselDialogForEdit(
  pos: number,
  attrs: { slides?: unknown; intervalMs?: unknown; showDots?: unknown; ariaLabel?: unknown },
) {
  if (!editor.value) {
    return
  }
  resetCarouselDialogState()
  carouselEditingPos.value = pos
  const rawSlides = Array.isArray(attrs.slides) ? attrs.slides : []
  carouselSlides.value = rawSlides
    .map((s) => {
      if (!s || typeof s !== 'object') {
        return null
      }
      const src = typeof (s as { src?: unknown }).src === 'string' ? ((s as { src: string }).src) : ''
      const alt = typeof (s as { alt?: unknown }).alt === 'string' ? ((s as { alt: string }).alt) : ''
      if (!src || !isSafeCarouselImgSrc(src)) {
        return null
      }
      return { src, alt }
    })
    .filter((x): x is { src: string; alt: string } => x !== null)
  const ivl = Number(attrs.intervalMs)
  carouselIntervalMs.value =
    Number.isFinite(ivl) && ivl >= 2000 && ivl <= 120000 ? ivl : 6000
  carouselShowDots.value = attrs.showDots !== false
  carouselAriaLabel.value =
    typeof attrs.ariaLabel === 'string' && attrs.ariaLabel.trim()
      ? attrs.ariaLabel.trim()
      : 'Галерея изображений'
  carouselDialogOpen.value = true
}

function applyCarouselDialog() {
  const ed = editor.value
  if (!ed) {
    carouselDialogOpen.value = false
    return
  }
  const slides = carouselSlides.value
    .map((s) => ({ src: (s.src ?? '').trim(), alt: (s.alt ?? '').trim() }))
    .filter((s) => s.src && isSafeCarouselImgSrc(s.src))
  if (slides.length === 0) {
    adminToast.show({
      title: 'Ошибка',
      message: 'Добавьте хотя бы одно корректное изображение (https:// или /storage/…).',
    })
    return
  }
  const ivlRaw = Number(carouselIntervalMs.value)
  const intervalMs =
    Number.isFinite(ivlRaw) && ivlRaw >= 2000 && ivlRaw <= 120000 ? ivlRaw : 6000
  const ariaLabel = carouselAriaLabel.value.trim() || 'Галерея изображений'
  const showDots = carouselShowDots.value !== false

  const editingPos = carouselEditingPos.value
  if (editingPos !== null) {
    /*
     * Если узел сместился из-за параллельных правок, посчитаем это «вставкой нового»,
     * чтобы пользователь не потерял изменения.
     */
    const node = ed.state.doc.nodeAt(editingPos)
    if (!node || node.type.name !== 'mtsRichImageCarousel') {
      const ok = insertImageCarouselInEditor(ed, { slides, intervalMs, showDots, ariaLabel })
      if (!ok) {
        adminToast.show({ title: 'Ошибка', message: 'Не удалось сохранить карусель' })
        return
      }
      adminToast.success('Карусель сохранена (как новая, исходный блок не найден)')
    } else {
      const tr = ed.state.tr.setNodeMarkup(editingPos, undefined, {
        slides,
        intervalMs,
        showDots,
        ariaLabel,
      })
      ed.view.dispatch(tr)
      adminToast.success('Карусель обновлена')
    }
  } else {
    const ok = insertImageCarouselInEditor(ed, { slides, intervalMs, showDots, ariaLabel })
    if (!ok) {
      adminToast.show({
        title: 'Ошибка',
        message: 'Нужно хотя бы одно корректное изображение (https:// или /storage/…).',
      })
      return
    }
    adminToast.success('Карусель вставлена')
  }
  carouselDialogOpen.value = false
}

function cancelCarouselDialog() {
  carouselDialogOpen.value = false
}

function carouselSlideExists(src: string) {
  return carouselSlides.value.some((s) => s.src === src)
}

function tryAppendCarouselSlide(rawSrc: string, rawAlt = '', notify = true): boolean {
  const src = rawSrc.trim()
  if (!src) {
    return false
  }
  if (!isSafeCarouselImgSrc(src)) {
    if (notify) {
      adminToast.show({
        title: 'Некорректный URL',
        message: 'Поддерживаются только https:// и относительные пути /storage/…',
      })
    }
    return false
  }
  if (carouselSlideExists(src)) {
    if (notify) {
      adminToast.show({ title: 'Уже добавлено', message: 'Этот URL уже есть в карусели' })
    }
    return false
  }
  carouselSlides.value = [...carouselSlides.value, { src, alt: rawAlt.trim() }]
  return true
}

function setCarouselSlideSrc(idx: number, value: string) {
  if (idx < 0 || idx >= carouselSlides.value.length) {
    return
  }
  const next = [...carouselSlides.value]
  const cur = next[idx]
  if (!cur) {
    return
  }
  next[idx] = { ...cur, src: value }
  carouselSlides.value = next
}

function setCarouselSlideAlt(idx: number, value: string) {
  if (idx < 0 || idx >= carouselSlides.value.length) {
    return
  }
  const next = [...carouselSlides.value]
  const cur = next[idx]
  if (!cur) {
    return
  }
  next[idx] = { ...cur, alt: value }
  carouselSlides.value = next
}

function moveCarouselSlide(from: number, delta: -1 | 1) {
  const to = from + delta
  if (
    from < 0 ||
    from >= carouselSlides.value.length ||
    to < 0 ||
    to >= carouselSlides.value.length ||
    from === to
  ) {
    return
  }
  const next = [...carouselSlides.value]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) {
    return
  }
  next.splice(to, 0, moved)
  carouselSlides.value = next
}

function removeCarouselSlide(idx: number) {
  if (idx < 0 || idx >= carouselSlides.value.length) {
    return
  }
  carouselSlides.value = carouselSlides.value.filter((_, i) => i !== idx)
}

function submitCarouselNewUrl() {
  if (tryAppendCarouselSlide(carouselNewUrl.value)) {
    carouselNewUrl.value = ''
  }
}

function toggleCarouselMediaPanel() {
  if (props.disabled || carouselUploading.value) {
    return
  }
  carouselMediaPanelOpen.value = !carouselMediaPanelOpen.value
  if (
    carouselMediaPanelOpen.value &&
    carouselMediaItems.value.length === 0 &&
    !carouselMediaLoading.value
  ) {
    void loadCarouselMediaLibrary()
  }
}

async function loadCarouselMediaLibrary() {
  carouselMediaLoading.value = true
  try {
    carouselMediaItems.value = await api.media.listManage()
  } catch {
    adminToast.show({
      title: 'Ошибка',
      message: 'Не удалось загрузить список файлов из медиатеки',
    })
  } finally {
    carouselMediaLoading.value = false
  }
}

function toggleCarouselMediaPick(url: string) {
  const cur = carouselMediaSelectedUrls.value
  const i = cur.indexOf(url)
  carouselMediaSelectedUrls.value =
    i === -1 ? [...cur, url] : cur.filter((u) => u !== url)
}

function isCarouselMediaPicked(url: string) {
  return carouselMediaSelectedUrls.value.includes(url)
}

function altFromFilename(filename: string | undefined | null): string {
  return (filename ?? '').replace(/\.[^.]+$/i, '').replace(/[-_]+/g, ' ').trim() || ''
}

function appendCarouselMediaPicked() {
  const urls = [...carouselMediaSelectedUrls.value]
  if (!urls.length) {
    return
  }
  let added = 0
  for (const url of urls) {
    const it = carouselMediaItems.value.find((x) => x.url === url)
    if (tryAppendCarouselSlide(url, altFromFilename(it?.filename), false)) {
      added++
    }
  }
  carouselMediaSelectedUrls.value = []
  if (added > 0) {
    adminToast.success(`Добавлено из медиатеки: ${added}`)
  } else {
    adminToast.show({
      title: 'Уже добавлено',
      message: 'Все выбранные ссылки уже есть в карусели или не прошли проверку URL.',
    })
  }
}

function formatMediaUploadError(e: unknown): string {
  if (e instanceof Error && e.message && e.message !== 'FetchError') {
    return e.message
  }
  if (e && typeof e === 'object' && 'data' in e) {
    const d = (e as { data?: unknown }).data
    if (d && typeof d === 'object') {
      if ('message' in d && typeof (d as { message: unknown }).message === 'string') {
        return (d as { message: string }).message
      }
      const errors = (d as { errors?: Record<string, string[]> }).errors
      if (errors && typeof errors === 'object') {
        const first = Object.values(errors).find((a) => Array.isArray(a) && a.length)?.[0]
        if (first) {
          return first
        }
      }
    }
  }
  return 'Не удалось загрузить файлы'
}

async function onCarouselFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  /** `FileList` живой: после `input.value = ''` тот же список может стать пустым. */
  const files = input.files ? Array.from(input.files) : []
  input.value = ''
  if (!files.length) {
    return
  }
  carouselUploading.value = true
  let added = 0
  const failures: string[] = []
  try {
    for (const file of files) {
      try {
        const res = await api.media.upload(file)
        const u = res.url?.trim()
        if (!u) {
          failures.push(`${file.name}: сервер не вернул URL`)
          continue
        }
        const altBase = file.name.replace(/\.[^.]+$/i, '').replace(/[-_]+/g, ' ').trim()
        if (tryAppendCarouselSlide(u, altBase, false)) {
          added++
        }
      }
      catch (err: unknown) {
        failures.push(`${file.name}: ${formatMediaUploadError(err)}`)
      }
    }
    if (added === 0 && failures.length === 0) {
      adminToast.show({
        title: 'Уже добавлено',
        message: 'Загруженные файлы уже есть в карусели — дубликаты не добавляются.',
      })
      return
    }
    if (added === 0) {
      const msg =
        failures.length === 1
          ? (failures[0] ?? 'Сервер не вернул URL для загруженных файлов')
          : failures.join('\n') || 'Сервер не вернул URL для загруженных файлов'
      adminToast.show({ title: 'Ошибка', message: msg })
      return
    }
    adminToast.success(`Добавлено изображений: ${added}`)
    if (failures.length) {
      adminToast.show({
        title: 'Часть файлов не загружена',
        message: failures.join('\n'),
      })
    }
  }
  catch (e: unknown) {
    adminToast.show({ title: 'Ошибка', message: formatMediaUploadError(e) })
  }
  finally {
    carouselUploading.value = false
  }
}

function insertTable() {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

function isTextAlignActive(align: 'left' | 'center' | 'right' | 'justify') {
  return editor.value?.isActive({ textAlign: align }) ?? false
}

function onCarouselNodeViewEdit(e: Event) {
  if (!props.allowImages) {
    return
  }
  const detail = (e as CustomEvent<{ pos?: number; attrs?: Record<string, unknown> }>).detail
  if (!detail || typeof detail.pos !== 'number' || !detail.attrs) {
    return
  }
  openCarouselDialogForEdit(detail.pos, detail.attrs)
}

const canEditCarouselFromToolbar = computed(() => {
  void tiptapUiTick.value
  const ed = editor.value
  if (!ed) {
    return false
  }
  return ed.isActive('mtsRichImageCarousel')
})

function openCarouselFromToolbar() {
  const ed = editor.value
  if (!ed) {
    return
  }
  if (!ed.isActive('mtsRichImageCarousel')) {
    openCarouselDialog()
    return
  }
  const { from } = ed.state.selection
  let pos: number | null = null
  let nodeAttrs: Record<string, unknown> | null = null
  ed.state.doc.nodesBetween(Math.max(0, from - 1), Math.min(ed.state.doc.content.size, from + 1), (n, p) => {
    if (nodeAttrs) {
      return false
    }
    if (n.type.name === 'mtsRichImageCarousel') {
      pos = p
      nodeAttrs = { ...n.attrs }
      return false
    }
    return true
  })
  if (pos !== null && nodeAttrs) {
    openCarouselDialogForEdit(pos, nodeAttrs)
    return
  }
  openCarouselDialog()
}

/* ── Galleries (Masonry): полностью параллельный набор функций ─────── */

function resetGalleryDialogState() {
  galleryImages.value = []
  galleryColumns.value = 3
  galleryAriaLabel.value = 'Галерея изображений'
  galleryNewUrl.value = ''
  galleryMediaPanelOpen.value = false
  galleryMediaItems.value = []
  galleryMediaSelectedUrls.value = []
  galleryEditingPos.value = null
}

function openGalleryDialog() {
  if (!editor.value) {
    return
  }
  resetGalleryDialogState()
  galleryDialogOpen.value = true
}

function openGalleryDialogForEdit(
  pos: number,
  attrs: { images?: unknown; columns?: unknown; ariaLabel?: unknown },
) {
  if (!editor.value) {
    return
  }
  resetGalleryDialogState()
  galleryEditingPos.value = pos
  const rawImages = Array.isArray(attrs.images) ? attrs.images : []
  galleryImages.value = rawImages
    .map((s) => {
      if (!s || typeof s !== 'object') {
        return null
      }
      const src = typeof (s as { src?: unknown }).src === 'string' ? ((s as { src: string }).src) : ''
      const alt = typeof (s as { alt?: unknown }).alt === 'string' ? ((s as { alt: string }).alt) : ''
      if (!src || !isSafeCarouselImgSrc(src)) {
        return null
      }
      return { src, alt }
    })
    .filter((x): x is { src: string; alt: string } => x !== null)
  const colsRaw = Number(attrs.columns)
  const found = (MTS_RICH_GALLERY_COLUMNS as readonly number[]).find((c) => c === Math.round(colsRaw))
  galleryColumns.value = found ?? 3
  galleryAriaLabel.value =
    typeof attrs.ariaLabel === 'string' && attrs.ariaLabel.trim()
      ? attrs.ariaLabel.trim()
      : 'Галерея изображений'
  galleryDialogOpen.value = true
}

function applyGalleryDialog() {
  const ed = editor.value
  if (!ed) {
    galleryDialogOpen.value = false
    return
  }
  const images = galleryImages.value
    .map((s) => ({ src: (s.src ?? '').trim(), alt: (s.alt ?? '').trim() }))
    .filter((s) => s.src && isSafeCarouselImgSrc(s.src))
  if (images.length === 0) {
    adminToast.show({
      title: 'Ошибка',
      message: 'Добавьте хотя бы одно корректное изображение (https:// или /storage/…).',
    })
    return
  }
  const ariaLabel = galleryAriaLabel.value.trim() || 'Галерея изображений'
  const columns = galleryColumns.value

  const editingPos = galleryEditingPos.value
  if (editingPos !== null) {
    const node = ed.state.doc.nodeAt(editingPos)
    if (!node || node.type.name !== 'mtsRichImageGallery') {
      const ok = insertImageGalleryInEditor(ed, { images, columns, ariaLabel })
      if (!ok) {
        adminToast.show({ title: 'Ошибка', message: 'Не удалось сохранить галерею' })
        return
      }
      adminToast.success('Галерея сохранена (как новая, исходный блок не найден)')
    } else {
      const tr = ed.state.tr.setNodeMarkup(editingPos, undefined, {
        images,
        columns,
        ariaLabel,
      })
      ed.view.dispatch(tr)
      adminToast.success('Галерея обновлена')
    }
  } else {
    const ok = insertImageGalleryInEditor(ed, { images, columns, ariaLabel })
    if (!ok) {
      adminToast.show({
        title: 'Ошибка',
        message: 'Нужно хотя бы одно корректное изображение (https:// или /storage/…).',
      })
      return
    }
    adminToast.success('Галерея вставлена')
  }
  galleryDialogOpen.value = false
}

function cancelGalleryDialog() {
  galleryDialogOpen.value = false
}

function galleryImageExists(src: string) {
  return galleryImages.value.some((s) => s.src === src)
}

function tryAppendGalleryImage(rawSrc: string, rawAlt = '', notify = true): boolean {
  const src = rawSrc.trim()
  if (!src) {
    return false
  }
  if (!isSafeCarouselImgSrc(src)) {
    if (notify) {
      adminToast.show({
        title: 'Некорректный URL',
        message: 'Поддерживаются только https:// и относительные пути /storage/…',
      })
    }
    return false
  }
  if (galleryImageExists(src)) {
    if (notify) {
      adminToast.show({ title: 'Уже добавлено', message: 'Этот URL уже есть в галерее' })
    }
    return false
  }
  galleryImages.value = [...galleryImages.value, { src, alt: rawAlt.trim() }]
  return true
}

function setGalleryImageSrc(idx: number, value: string) {
  if (idx < 0 || idx >= galleryImages.value.length) {
    return
  }
  const next = [...galleryImages.value]
  const cur = next[idx]
  if (!cur) {
    return
  }
  next[idx] = { ...cur, src: value }
  galleryImages.value = next
}

function setGalleryImageAlt(idx: number, value: string) {
  if (idx < 0 || idx >= galleryImages.value.length) {
    return
  }
  const next = [...galleryImages.value]
  const cur = next[idx]
  if (!cur) {
    return
  }
  next[idx] = { ...cur, alt: value }
  galleryImages.value = next
}

function moveGalleryImage(from: number, delta: -1 | 1) {
  const to = from + delta
  if (
    from < 0 ||
    from >= galleryImages.value.length ||
    to < 0 ||
    to >= galleryImages.value.length ||
    from === to
  ) {
    return
  }
  const next = [...galleryImages.value]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) {
    return
  }
  next.splice(to, 0, moved)
  galleryImages.value = next
}

function removeGalleryImage(idx: number) {
  if (idx < 0 || idx >= galleryImages.value.length) {
    return
  }
  galleryImages.value = galleryImages.value.filter((_, i) => i !== idx)
}

function submitGalleryNewUrl() {
  if (tryAppendGalleryImage(galleryNewUrl.value)) {
    galleryNewUrl.value = ''
  }
}

function toggleGalleryMediaPanel() {
  if (props.disabled || galleryUploading.value) {
    return
  }
  galleryMediaPanelOpen.value = !galleryMediaPanelOpen.value
  if (
    galleryMediaPanelOpen.value &&
    galleryMediaItems.value.length === 0 &&
    !galleryMediaLoading.value
  ) {
    void loadGalleryMediaLibrary()
  }
}

async function loadGalleryMediaLibrary() {
  galleryMediaLoading.value = true
  try {
    galleryMediaItems.value = await api.media.listManage()
  } catch {
    adminToast.show({
      title: 'Ошибка',
      message: 'Не удалось загрузить список файлов из медиатеки',
    })
  } finally {
    galleryMediaLoading.value = false
  }
}

function toggleGalleryMediaPick(url: string) {
  const cur = galleryMediaSelectedUrls.value
  const i = cur.indexOf(url)
  galleryMediaSelectedUrls.value = i === -1 ? [...cur, url] : cur.filter((u) => u !== url)
}

function isGalleryMediaPicked(url: string) {
  return galleryMediaSelectedUrls.value.includes(url)
}

function appendGalleryMediaPicked() {
  const urls = [...galleryMediaSelectedUrls.value]
  if (!urls.length) {
    return
  }
  let added = 0
  for (const url of urls) {
    const it = galleryMediaItems.value.find((x) => x.url === url)
    if (tryAppendGalleryImage(url, altFromFilename(it?.filename), false)) {
      added++
    }
  }
  galleryMediaSelectedUrls.value = []
  if (added > 0) {
    adminToast.success(`Добавлено из медиатеки: ${added}`)
  } else {
    adminToast.show({
      title: 'Уже добавлено',
      message: 'Все выбранные ссылки уже есть в галерее или не прошли проверку URL.',
    })
  }
}

async function onGalleryFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  input.value = ''
  if (!files.length) {
    return
  }
  galleryUploading.value = true
  let added = 0
  const failures: string[] = []
  try {
    for (const file of files) {
      try {
        const res = await api.media.upload(file)
        const u = res.url?.trim()
        if (!u) {
          failures.push(`${file.name}: сервер не вернул URL`)
          continue
        }
        const altBase = file.name.replace(/\.[^.]+$/i, '').replace(/[-_]+/g, ' ').trim()
        if (tryAppendGalleryImage(u, altBase, false)) {
          added++
        }
      }
      catch (err: unknown) {
        failures.push(`${file.name}: ${formatMediaUploadError(err)}`)
      }
    }
    if (added === 0 && failures.length === 0) {
      adminToast.show({
        title: 'Уже добавлено',
        message: 'Загруженные файлы уже есть в галерее — дубликаты не добавляются.',
      })
      return
    }
    if (added === 0) {
      const msg =
        failures.length === 1
          ? (failures[0] ?? 'Сервер не вернул URL для загруженных файлов')
          : failures.join('\n') || 'Сервер не вернул URL для загруженных файлов'
      adminToast.show({ title: 'Ошибка', message: msg })
      return
    }
    adminToast.success(`Добавлено изображений: ${added}`)
    if (failures.length) {
      adminToast.show({
        title: 'Часть файлов не загружена',
        message: failures.join('\n'),
      })
    }
  }
  catch (e: unknown) {
    adminToast.show({ title: 'Ошибка', message: formatMediaUploadError(e) })
  }
  finally {
    galleryUploading.value = false
  }
}

function onGalleryNodeViewEdit(e: Event) {
  if (!props.allowImages) {
    return
  }
  const detail = (e as CustomEvent<{ pos?: number; attrs?: Record<string, unknown> }>).detail
  if (!detail || typeof detail.pos !== 'number' || !detail.attrs) {
    return
  }
  openGalleryDialogForEdit(detail.pos, detail.attrs)
}

const canEditGalleryFromToolbar = computed(() => {
  void tiptapUiTick.value
  const ed = editor.value
  if (!ed) {
    return false
  }
  return ed.isActive('mtsRichImageGallery')
})

function openGalleryFromToolbar() {
  const ed = editor.value
  if (!ed) {
    return
  }
  if (!ed.isActive('mtsRichImageGallery')) {
    openGalleryDialog()
    return
  }
  const { from } = ed.state.selection
  let pos: number | null = null
  let nodeAttrs: Record<string, unknown> | null = null
  ed.state.doc.nodesBetween(
    Math.max(0, from - 1),
    Math.min(ed.state.doc.content.size, from + 1),
    (n, p) => {
      if (nodeAttrs) {
        return false
      }
      if (n.type.name === 'mtsRichImageGallery') {
        pos = p
        nodeAttrs = { ...n.attrs }
        return false
      }
      return true
    },
  )
  if (pos !== null && nodeAttrs) {
    openGalleryDialogForEdit(pos, nodeAttrs)
    return
  }
  openGalleryDialog()
}

onMounted(() => {
  if (props.allowImages) {
    editorRootRef.value?.addEventListener(
      'mts-rich-carousel-edit',
      onCarouselNodeViewEdit as EventListener,
    )
    editorRootRef.value?.addEventListener(
      'mts-rich-gallery-edit',
      onGalleryNodeViewEdit as EventListener,
    )
  }
})

onBeforeUnmount(() => {
  editorRootRef.value?.removeEventListener(
    'mts-rich-carousel-edit',
    onCarouselNodeViewEdit as EventListener,
  )
  editorRootRef.value?.removeEventListener(
    'mts-rich-gallery-edit',
    onGalleryNodeViewEdit as EventListener,
  )
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <div
    ref="editorRootRef"
    class="admin-rich-text overflow-hidden border border-mts-border bg-mts-bg"
    :class="disabled ? 'opacity-70' : ''"
  >
    <div
      v-if="editor"
      class="flex flex-wrap gap-1 border-b border-mts-border bg-white px-2 py-2"
      role="toolbar"
      aria-label="Форматирование"
    >
      <button type="button" :class="btnClass(editor.isActive('bold'))" title="Жирный" @click="editor.chain().focus().toggleBold().run()">
        <Bold class="h-4 w-4" />
      </button>
      <button type="button" :class="btnClass(editor.isActive('italic'))" title="Курсив" @click="editor.chain().focus().toggleItalic().run()">
        <Italic class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(editor.isActive('underline'))"
        title="Подчёркивание"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <UnderlineIcon class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(editor.isActive('strike'))"
        title="Зачёркнутый"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <Strikethrough class="h-4 w-4" />
      </button>
      <AdminColorTextPopover :editor="(editor as Editor | null | undefined) ?? null" />
      <span class="mx-1 w-px self-stretch bg-mts-border" />
      <button
        type="button"
        :class="btnClass(isTextAlignActive('left'))"
        title="По левому краю"
        @click="editor.chain().focus().setTextAlign('left').run()"
      >
        <AlignLeft class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(isTextAlignActive('center'))"
        title="По центру"
        @click="editor.chain().focus().setTextAlign('center').run()"
      >
        <AlignCenter class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(isTextAlignActive('right'))"
        title="По правому краю"
        @click="editor.chain().focus().setTextAlign('right').run()"
      >
        <AlignRight class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(isTextAlignActive('justify'))"
        title="По ширине"
        @click="editor.chain().focus().setTextAlign('justify').run()"
      >
        <AlignJustify class="h-4 w-4" />
      </button>
      <span class="mx-1 w-px self-stretch bg-mts-border" />
      <button
        type="button"
        :class="btnClass(editor.isActive('heading', { level: 2 }))"
        title="Заголовок 2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <Heading2 class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(editor.isActive('heading', { level: 3 }))"
        title="Заголовок 3"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <Heading3 class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(editor.isActive('heading', { level: 4 }))"
        title="Заголовок 4"
        @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
      >
        <Heading4 class="h-4 w-4" />
      </button>
      <span class="mx-1 w-px self-stretch bg-mts-border" />
      <span ref="listStyleAnchorRef" class="relative inline-flex items-center">
        <button
          type="button"
          :class="btnClass(editor.isActive('bulletList'))"
          title="Маркированный список"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <List class="h-4 w-4" />
        </button>
        <button
          type="button"
          :class="btnClass(editor.isActive('orderedList'))"
          title="Нумерованный список"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <ListOrdered class="h-4 w-4" />
        </button>
        <button
          type="button"
          :class="btnClass(listStyleOpen)"
          :disabled="disabled"
          title="Стиль списка: маркер или нумерация"
          @click="toggleListStylePopover"
        >
          <ListTree class="h-4 w-4" />
        </button>
        <div
          v-show="listStyleOpen"
          class="absolute left-0 top-full z-50 mt-1 w-[17.5rem] rounded-md border border-mts-border bg-white p-3 shadow-lg dark:border-white/15 dark:bg-mts-bg"
          @click.stop
        >
          <template v-if="inBulletList">
            <p class="mb-2 text-xs font-medium text-mts-text-secondary">Маркеры</p>
            <div class="mb-3 flex flex-wrap gap-1">
              <button
                type="button"
                class="rounded border px-2 py-1 text-xs transition-colors hover:border-mts-accent hover:text-mts-accent"
                title="Кружок (disc)"
                @click="applyBulletListPreset('disc')"
              >
                Disc
              </button>
              <button
                type="button"
                class="rounded border px-2 py-1 text-xs transition-colors hover:border-mts-accent hover:text-mts-accent"
                title="Пустой круг"
                @click="applyBulletListPreset('circle')"
              >
                ○
              </button>
              <button
                type="button"
                class="rounded border px-2 py-1 text-xs transition-colors hover:border-mts-accent hover:text-mts-accent"
                title="Квадрат"
                @click="applyBulletListPreset('square')"
              >
                ■
              </button>
              <button
                type="button"
                class="rounded border px-2 py-1 text-xs transition-colors hover:border-mts-accent hover:text-mts-accent"
                title="Без маркера"
                @click="applyBulletListPreset('none')"
              >
                Нет
              </button>
            </div>
            <label class="mb-1 block text-xs text-mts-text-secondary">
              {{ props.allowImages ? 'Свой символ или URL картинки (https…)' : 'Свой символ маркера' }}
            </label>
            <div class="flex gap-2">
              <input
                v-model="listCustomMarkerInput"
                type="text"
                class="min-w-0 flex-1 rounded border border-mts-border bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
                :placeholder="props.allowImages ? '⭐ или https://…' : '⭐'"
                @keydown.enter.prevent="applyBulletListCustom"
              >
              <button
                type="button"
                class="shrink-0 rounded bg-mts-accent px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90"
                @click="applyBulletListCustom"
              >
                Ок
              </button>
            </div>
          </template>
          <template v-else-if="inOrderedList">
            <p class="mb-2 text-xs font-medium text-mts-text-secondary">Нумерация</p>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="opt in ORDERED_LIST_STYLE_OPTIONS"
                :key="opt.key"
                type="button"
                class="rounded border px-2 py-1 text-xs transition-colors hover:border-mts-accent hover:text-mts-accent"
                :class="
                  activeOrderedListStyle === opt.key ? 'border-mts-accent bg-mts-accent/10 text-mts-accent' : ''
                "
                @click="applyOrderedStyle(opt.key)"
              >
                {{ opt.label }}
              </button>
            </div>
          </template>
          <p v-else class="text-xs text-mts-text-muted">Поставьте курсор в список</p>
        </div>
      </span>
      <button
        type="button"
        :class="btnClass(editor.isActive('blockquote'))"
        title="Цитата"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <Quote class="h-4 w-4" />
      </button>
      <button type="button" title="Горизонтальная линия" :class="btnClass(false)" @click="editor.chain().focus().setHorizontalRule().run()">
        <Minus class="h-4 w-4" />
      </button>
      <span class="mx-1 w-px self-stretch bg-mts-border" />
      <button
        type="button"
        :class="btnClass(editor.isActive('code'))"
        title="Код в строке"
        @click="editor.chain().focus().toggleCode().run()"
      >
        <Code class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(editor.isActive('codeBlock'))"
        title="Блок кода"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        <Braces class="h-4 w-4" />
      </button>
      <span class="mx-1 w-px self-stretch bg-mts-border" />
      <button type="button" :class="btnClass(false)" title="Таблица 3×3" @click="insertTable">
        <Table2 class="h-4 w-4" />
      </button>
      <span class="mx-1 w-px self-stretch bg-mts-border" />
      <span class="mr-1 self-center font-mono text-[9px] uppercase tracking-wide text-mts-text-muted">Сетка</span>
      <button
        type="button"
        :class="btnClass(false)"
        title="Сетка: 2 колонки на md+ (на мобильных — одна колонка)"
        @click="insertRichGrid('2')"
      >
        <Columns2 class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(false)"
        title="Сетка: 3 колонки на md+"
        @click="insertRichGrid('3')"
      >
        <Columns3 class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(false)"
        title="Сетка: 4 колонки на md+"
        @click="insertRichGrid('4')"
      >
        <LayoutGrid class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(false)"
        :disabled="!canAppendRichGridCell || disabled"
        title="Добавить ячейку после текущей (курсор в ячейке) или в конец сетки. Удалить ячейку: наведите на неё и нажмите ×"
        @click="appendRichGridCell"
      >
        <PlusSquare class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(false)"
        :disabled="!richGridCellNav.inCell || !richGridCellNav.canEarlier || disabled"
        title="Ячейка: сдвинуть назад по порядку в сетке (↑)"
        @click="editor.chain().focus().moveMtsRichGridCellEarlier().run()"
      >
        <ChevronUp class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(false)"
        :disabled="!richGridCellNav.inCell || !richGridCellNav.canLater || disabled"
        title="Ячейка: сдвинуть вперёд по порядку в сетке (↓)"
        @click="editor.chain().focus().moveMtsRichGridCellLater().run()"
      >
        <ChevronDown class="h-4 w-4" />
      </button>
      <button
        type="button"
        :class="btnClass(false)"
        :disabled="!editor.isActive('mtsRichGridCell') || disabled"
        title="Ячейка: ширина 1 колонки"
        @click="setRichCellSpan('1')"
      >
        <span class="font-mono text-[10px] font-semibold">1</span>
      </button>
      <button
        type="button"
        :class="btnClass(false)"
        :disabled="!editor.isActive('mtsRichGridCell') || disabled"
        title="Ячейка: на 2 колонки (md+)"
        @click="setRichCellSpan('2')"
      >
        <span class="font-mono text-[10px] font-semibold">2×</span>
      </button>
      <button
        type="button"
        :class="btnClass(false)"
        :disabled="!editor.isActive('mtsRichGridCell') || disabled"
        title="Ячейка на всю ширину строки (md+)"
        @click="setRichCellSpan('full')"
      >
        <span class="font-mono text-[9px] font-semibold">FULL</span>
      </button>
      <button type="button" :class="btnClass(false)" title="Карта (iframe: Google / OSM / Mapbox)" @click="openMapDialog">
        <MapPin class="h-4 w-4" />
      </button>
      <button
        v-if="props.allowImages"
        type="button"
        :class="btnClass(canEditCarouselFromToolbar)"
        :disabled="disabled"
        :title="canEditCarouselFromToolbar
          ? 'Управление выбранной каруселью изображений'
          : 'Карусель изображений (как на «О компании») — миниатюрный блок с подборкой картинок'"
        @click="openCarouselFromToolbar"
      >
        <Images class="h-4 w-4" />
      </button>
      <button
        v-if="props.allowImages"
        type="button"
        :class="btnClass(canEditGalleryFromToolbar)"
        :disabled="disabled"
        :title="canEditGalleryFromToolbar
          ? 'Управление выбранной галереей (Masonry)'
          : 'Галерея (Masonry) — изображения в каменной кладке, как Pinterest'"
        @click="openGalleryFromToolbar"
      >
        <GalleryVerticalEnd class="h-4 w-4" />
      </button>
      <span v-if="props.allowImages" class="mx-1 w-px self-stretch bg-mts-border" />
      <button v-if="props.allowImages" type="button" :class="btnClass(false)" title="Изображение (URL / файл). После вставки — выделите и тяните угол для размера" @click="openImageDialog">
        <ImageIcon class="h-4 w-4" />
      </button>
      <button
        v-if="props.allowImages"
        type="button"
        :class="btnClass(false)"
        :disabled="disabled || imageUploading"
        title="Загрузить изображение с диска"
        @click="pickImageFile"
      >
        <Upload class="h-4 w-4" />
      </button>
      <button type="button" :class="btnClass(false)" title="Видео YouTube" @click="openYoutubeDialog">
        <YoutubeIcon class="h-4 w-4" />
      </button>
      <span class="mx-1 w-px self-stretch bg-mts-border" />
      <button type="button" :class="btnClass(editor.isActive('link'))" title="Ссылка" @click="openLinkDialog">
        <LinkIcon class="h-4 w-4" />
      </button>
      <button type="button" :class="btnClass(false)" title="Снять форматирование" @click="clearFormatting">
        <Eraser class="h-4 w-4" />
      </button>
      <span class="mx-1 w-px self-stretch bg-mts-border" />
      <button type="button" :class="btnClass(false)" title="Отменить" @click="editor.chain().focus().undo().run()">
        <Undo2 class="h-4 w-4" />
      </button>
      <button type="button" :class="btnClass(false)" title="Вернуть" @click="editor.chain().focus().redo().run()">
        <Redo2 class="h-4 w-4" />
      </button>
    </div>
    <EditorContent v-if="editor" :editor="editor" class="admin-rich-text__editor px-1" />
    <p v-if="editor" class="border-t border-mts-border bg-white px-3 py-1.5 text-right font-mono text-[10px] text-mts-text-muted">
      {{ charCount }} символов
    </p>

    <Teleport to="body">
      <div
        v-if="linkDialogOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-rich-link-title"
        @click.self="cancelLinkDialog"
      >
        <div class="w-full max-w-md rounded-lg border border-mts-border bg-mts-bg p-4 shadow-lg" @click.stop>
          <h2 id="admin-rich-link-title" class="mb-3 font-display text-base font-semibold text-mts-text">
            Ссылка
          </h2>
          <label class="block text-xs font-medium text-mts-text-secondary">Адрес</label>
          <input
            ref="linkInputRef"
            v-model="linkHref"
            type="url"
            class="mt-1 w-full rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text outline-none focus:border-mts-accent"
            placeholder="https://"
            @keydown.enter.prevent="applyLinkDialog"
          >
          <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-mts-text">
            <input v-model="linkNewTab" type="checkbox" class="rounded border-mts-border">
            Открывать в новой вкладке
          </label>
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded border border-mts-border bg-white px-3 py-1.5 text-sm text-mts-text hover:bg-mts-bg"
              @click="cancelLinkDialog"
            >
              Отмена
            </button>
            <button
              type="button"
              class="rounded bg-mts-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
              @click="applyLinkDialog"
            >
              Применить
            </button>
          </div>
          <p class="mt-2 text-[11px] text-mts-text-muted">
            Чтобы убрать ссылку, очистите поле адреса и нажмите «Применить».
          </p>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="props.allowImages && imageDialogOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-rich-image-title"
        @click.self="cancelImageDialog"
      >
        <div class="w-full max-w-xl rounded-lg border border-mts-border bg-mts-bg p-4 shadow-lg" @click.stop>
          <h2 id="admin-rich-image-title" class="mb-3 font-display text-base font-semibold text-mts-text">
            Изображение
          </h2>
          <label class="block text-xs font-medium text-mts-text-secondary">URL изображения</label>
          <input
            ref="imageInputRef"
            v-model="imageUrl"
            type="url"
            class="mt-1 w-full rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text outline-none focus:border-mts-accent"
            placeholder="https://"
            @keydown.enter.prevent="applyImageDialog"
          >
          <p class="mt-2 text-[11px] text-mts-text-muted">
            Или загрузите файл (JPEG, PNG, WebP) — в документ подставится адрес из хранилища.
          </p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              class="rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:opacity-50"
              :disabled="imageUploading"
              @click="pickImageFile"
            >
              {{ imageUploading ? 'Загрузка…' : 'Загрузить файл' }}
            </button>
            <button
              type="button"
              class="rounded border px-3 py-2 text-sm transition-colors disabled:opacity-50"
              :class="
                imageMediaPanelOpen
                  ? 'border-mts-accent bg-mts-accent/5 text-mts-accent'
                  : 'border-mts-border bg-white text-mts-text hover:border-mts-accent hover:text-mts-accent'
              "
              :disabled="imageUploading"
              @click="toggleImageMediaPanel"
            >
              Выбрать из медиатеки
            </button>
          </div>

          <div
            v-if="imageMediaPanelOpen"
            class="mt-3 rounded border border-mts-border bg-mts-bg/40 p-3"
          >
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
                Медиатека · каталог /media на сервере
              </span>
              <button
                type="button"
                class="text-xs font-medium text-mts-accent hover:underline disabled:pointer-events-none disabled:opacity-50"
                :disabled="imageMediaLoading || disabled"
                @click="loadImageMediaLibrary"
              >
                Обновить
              </button>
            </div>
            <p v-if="imageMediaLoading" class="py-6 text-center text-xs text-mts-text-secondary">
              Загрузка списка…
            </p>
            <p
              v-else-if="!imageMediaItems.length"
              class="py-4 text-center text-xs text-mts-text-secondary"
            >
              Нет изображений в каталоге. Загрузите файлы через «Загрузить файл» или положите их в
              <code class="font-mono">storage/app/public/media</code> и нажмите «Обновить».
            </p>
            <div
              v-else
              class="max-h-64 overflow-y-auto rounded border border-mts-border bg-white p-2"
            >
              <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
                <button
                  v-for="it in imageMediaItems"
                  :key="it.url"
                  type="button"
                  class="relative aspect-square overflow-hidden rounded border-2 bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent"
                  :class="
                    imageUrl === it.url
                      ? 'border-mts-accent ring-2 ring-mts-accent/30'
                      : 'border-mts-border hover:border-mts-accent/60'
                  "
                  :title="it.filename"
                  :disabled="disabled || imageUploading"
                  @click="pickImageFromMedia(it.url)"
                >
                  <img
                    :src="it.url"
                    alt=""
                    class="h-full w-full object-cover"
                    loading="lazy"
                  >
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded border border-mts-border bg-white px-3 py-1.5 text-sm text-mts-text hover:bg-mts-bg"
              @click="cancelImageDialog"
            >
              Отмена
            </button>
            <button
              type="button"
              class="rounded bg-mts-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
              @click="applyImageDialog"
            >
              Вставить
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="youtubeDialogOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-rich-youtube-title"
        @click.self="cancelYoutubeDialog"
      >
        <div class="w-full max-w-md rounded-lg border border-mts-border bg-mts-bg p-4 shadow-lg" @click.stop>
          <h2 id="admin-rich-youtube-title" class="mb-3 font-display text-base font-semibold text-mts-text">
            Видео YouTube
          </h2>
          <label class="block text-xs font-medium text-mts-text-secondary">Ссылка на ролик</label>
          <input
            ref="youtubeInputRef"
            v-model="youtubeUrl"
            type="url"
            class="mt-1 w-full rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text outline-none focus:border-mts-accent"
            placeholder="https://www.youtube.com/watch?v=…"
            @keydown.enter.prevent="applyYoutubeDialog"
          >
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded border border-mts-border bg-white px-3 py-1.5 text-sm text-mts-text hover:bg-mts-bg"
              @click="cancelYoutubeDialog"
            >
              Отмена
            </button>
            <button
              type="button"
              class="rounded bg-mts-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
              @click="applyYoutubeDialog"
            >
              Вставить
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="mapDialogOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-rich-map-title"
        @click.self="cancelMapDialog"
      >
        <div class="w-full max-w-md rounded-lg border border-mts-border bg-mts-bg p-4 shadow-lg" @click.stop>
          <h2 id="admin-rich-map-title" class="mb-3 font-display text-base font-semibold text-mts-text">
            Карта (iframe)
          </h2>
          <p class="mb-3 font-body text-xs text-mts-text-secondary">
            Вставьте <strong>src</strong> из кода встраивания (Google Maps, Mapbox, OpenStreetMap, Яндекс). Допускаются
            только https-ссылки с доверенных хостов.
          </p>
          <label class="block text-xs font-medium text-mts-text-secondary">URL iframe (src)</label>
          <input
            ref="mapInputRef"
            v-model="mapUrl"
            type="url"
            class="mt-1 w-full rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text outline-none focus:border-mts-accent"
            placeholder="https://www.google.com/maps/embed?…"
            @keydown.enter.prevent="applyMapDialog"
          >
          <label class="mt-3 block text-xs font-medium text-mts-text-secondary">Подпись (title)</label>
          <input
            v-model="mapTitle"
            type="text"
            class="mt-1 w-full rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text outline-none focus:border-mts-accent"
            placeholder="Карта"
          >
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded border border-mts-border bg-white px-3 py-1.5 text-sm text-mts-text hover:bg-mts-bg"
              @click="cancelMapDialog"
            >
              Отмена
            </button>
            <button
              type="button"
              class="rounded bg-mts-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
              @click="applyMapDialog"
            >
              Вставить
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="props.allowImages && carouselDialogOpen"
        class="fixed inset-0 z-[245] flex items-stretch justify-center p-4 sm:items-center sm:p-6"
        role="presentation"
        @click.self="cancelCarouselDialog"
      >
        <div class="absolute inset-0 bg-black/55" aria-hidden="true" />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-rich-carousel-title"
          class="relative z-10 flex max-h-[min(94vh,1100px)] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-mts-border bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
          @click.stop
        >
          <header class="flex items-start justify-between gap-3 border-b border-mts-border bg-mts-bg/40 px-6 py-4">
            <div class="min-w-0">
              <h2 id="admin-rich-carousel-title" class="font-display text-lg text-mts-text">
                {{ carouselEditingPos === null ? 'Новая карусель изображений' : 'Карусель изображений' }}
              </h2>
              <p class="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
                {{ carouselSlides.length }} слайд<span v-if="carouselSlides.length % 10 === 1 && carouselSlides.length % 100 !== 11"></span><span v-else-if="[2,3,4].includes(carouselSlides.length % 10) && ![12,13,14].includes(carouselSlides.length % 100)">а</span><span v-else>ов</span>
                · на сайте превратится в плавную галерею
              </p>
            </div>
            <button
              type="button"
              aria-label="Закрыть"
              class="inline-flex h-9 w-9 items-center justify-center text-mts-text-secondary transition-colors hover:text-mts-accent"
              @click="cancelCarouselDialog"
            >
              <X class="h-5 w-5" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto px-6 py-5">
            <p class="mb-3 font-body text-xs text-mts-text-secondary">
              Добавьте слайды через <strong>URL</strong> (https или путь вида <code class="font-mono">/storage/…</code>),
              <strong>загрузите файлы с диска</strong> или выберите из <strong>медиатеки</strong>. Меняйте порядок стрелками и удаляйте лишние.
              На сайте блок отрисуется как <code class="font-mono">ImageFadeCarousel</code>.
            </p>

            <div
              v-if="carouselSlides.length === 0"
              class="mb-5 flex items-center justify-center rounded border border-dashed border-mts-border bg-mts-bg/50 px-3 py-10 font-body text-sm text-mts-text-secondary"
            >
              Список пуст. Добавьте слайды ниже — через URL, диск или медиатеку.
            </div>
            <div
              v-else
              class="mb-5 grid gap-3"
              style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))"
            >
              <div
                v-for="(slide, idx) in carouselSlides"
                :key="`carousel-slide-${idx}`"
                class="flex flex-col border border-mts-border bg-white"
              >
                <div class="relative aspect-[4/3] overflow-hidden bg-mts-bg">
                  <img
                    v-if="slide.src && isSafeCarouselImgSrc(slide.src)"
                    :src="slide.src"
                    :alt="slide.alt || ''"
                    class="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  >
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-red-500"
                  >
                    Неверный URL
                  </div>
                  <span
                    class="absolute left-2 top-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-sm bg-black/60 px-1.5 font-mono text-[11px] font-semibold text-white"
                  >
                    {{ idx + 1 }}
                  </span>
                </div>
                <div class="space-y-2 border-t border-mts-border p-3">
                  <input
                    :value="slide.src"
                    type="text"
                    placeholder="https://… или /storage/…"
                    class="w-full border border-mts-border bg-mts-bg px-2 py-1.5 font-mono text-[11px] text-mts-text focus:border-mts-accent focus:outline-none"
                    @input="(e) => setCarouselSlideSrc(idx, (e.target as HTMLInputElement).value)"
                  >
                  <input
                    :value="slide.alt"
                    type="text"
                    placeholder="alt (для доступности)"
                    class="w-full border border-mts-border bg-mts-bg px-2 py-1.5 font-body text-xs text-mts-text focus:border-mts-accent focus:outline-none"
                    @input="(e) => setCarouselSlideAlt(idx, (e.target as HTMLInputElement).value)"
                  >
                  <div class="flex items-center justify-between gap-1">
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        title="Сдвинуть выше"
                        aria-label="Сдвинуть выше"
                        class="inline-flex h-7 w-7 items-center justify-center border border-mts-border bg-white text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="idx === 0"
                        @click="moveCarouselSlide(idx, -1)"
                      >
                        <ArrowUp class="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Сдвинуть ниже"
                        aria-label="Сдвинуть ниже"
                        class="inline-flex h-7 w-7 items-center justify-center border border-mts-border bg-white text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="idx === carouselSlides.length - 1"
                        @click="moveCarouselSlide(idx, 1)"
                      >
                        <ArrowDown class="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      class="inline-flex h-7 items-center gap-1 border border-mts-border bg-white px-2 font-mono text-[10px] uppercase tracking-wide text-red-700 transition-colors hover:border-red-500 hover:text-red-700"
                      @click="removeCarouselSlide(idx)"
                    >
                      <Trash2 class="h-3 w-3" />
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-2 flex flex-wrap items-center gap-3">
              <h3 class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
                Параметры карусели
              </h3>
              <span class="text-mts-text-muted">·</span>
              <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
                <input v-model="carouselShowDots" type="checkbox" class="mts-checkbox">
                <span>Точки и стрелки</span>
              </label>
              <label class="flex items-center gap-2 font-body text-sm text-mts-text">
                <span class="text-mts-text-secondary">Интервал, мс</span>
                <input
                  v-model.number="carouselIntervalMs"
                  type="number"
                  min="2000"
                  max="120000"
                  step="500"
                  class="w-24 border border-mts-border bg-white px-2 py-1 text-sm outline-none focus:border-mts-accent"
                >
              </label>
            </div>
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
              Подпись для screen reader (aria-label)
            </label>
            <input
              v-model="carouselAriaLabel"
              type="text"
              class="w-full border border-mts-border bg-white px-3 py-2 text-sm text-mts-text outline-none focus:border-mts-accent"
              placeholder="Галерея изображений"
            >

            <div
              v-if="carouselMediaPanelOpen"
              class="mt-4 rounded border border-mts-border bg-mts-bg/40 p-3"
            >
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
                  Медиатека · каталог /media на сервере
                </span>
                <button
                  type="button"
                  class="text-xs font-medium text-mts-accent hover:underline disabled:pointer-events-none disabled:opacity-50"
                  :disabled="carouselMediaLoading || disabled"
                  @click="loadCarouselMediaLibrary"
                >
                  Обновить
                </button>
              </div>
              <p v-if="carouselMediaLoading" class="py-6 text-center text-xs text-mts-text-secondary">
                Загрузка списка…
              </p>
              <p
                v-else-if="!carouselMediaItems.length"
                class="py-4 text-center text-xs text-mts-text-secondary"
              >
                Нет изображений в каталоге. Загрузите файлы через «С диска» или положите их в
                <code class="font-mono">storage/app/public/media</code> и нажмите «Обновить».
              </p>
              <div
                v-else
                class="max-h-72 overflow-y-auto rounded border border-mts-border bg-white p-2"
              >
                <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  <button
                    v-for="it in carouselMediaItems"
                    :key="it.url"
                    type="button"
                    class="relative aspect-square overflow-hidden rounded border-2 bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent"
                    :class="
                      isCarouselMediaPicked(it.url)
                        ? 'border-mts-accent ring-2 ring-mts-accent/30'
                        : 'border-mts-border hover:border-mts-accent/60'
                    "
                    :title="it.filename"
                    :disabled="disabled || carouselUploading"
                    @click="toggleCarouselMediaPick(it.url)"
                  >
                    <img
                      :src="it.url"
                      alt=""
                      class="h-full w-full object-cover"
                      loading="lazy"
                    >
                  </button>
                </div>
              </div>
              <div v-if="carouselMediaItems.length" class="mt-2 flex justify-end">
                <button
                  type="button"
                  class="rounded bg-mts-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                  :disabled="!carouselMediaSelectedUrls.length || disabled || carouselUploading"
                  @click="appendCarouselMediaPicked"
                >
                  Добавить выбранные ({{ carouselMediaSelectedUrls.length }})
                </button>
              </div>
            </div>
          </div>

          <footer class="border-t border-mts-border bg-mts-bg/50 px-6 py-4">
            <div class="flex flex-wrap items-stretch gap-2">
              <input
                ref="carouselNewUrlInputRef"
                v-model="carouselNewUrl"
                type="text"
                placeholder="https://… или /storage/…"
                class="min-w-[14rem] flex-1 border border-mts-border bg-white px-3 py-2 font-body text-sm focus:border-mts-accent focus:outline-none"
                @keydown.enter.prevent="submitCarouselNewUrl"
              >
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border border-mts-border bg-white px-3 font-mono text-[11px] uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:opacity-40"
                :disabled="!carouselNewUrl.trim()"
                @click="submitCarouselNewUrl"
              >
                <ImagePlus class="h-3.5 w-3.5" />
                Добавить URL
              </button>
              <label
                class="inline-flex cursor-pointer items-center gap-1.5 border border-transparent bg-mts-accent px-3 font-mono text-[11px] uppercase tracking-wide text-white transition-colors hover:bg-mts-accent-dark"
                :class="
                  disabled || carouselUploading
                    ? 'pointer-events-none cursor-not-allowed opacity-50'
                    : ''
                "
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="sr-only"
                  tabindex="-1"
                  multiple
                  :disabled="disabled || carouselUploading"
                  @change="onCarouselFileChange"
                >
                <Loader2 v-if="carouselUploading" class="h-3.5 w-3.5 animate-spin" />
                <Upload v-else class="h-3.5 w-3.5" />
                <span>{{ carouselUploading ? 'Загрузка…' : 'С диска' }}</span>
              </label>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border border-mts-border bg-white px-3 font-mono text-[11px] uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:opacity-40"
                :class="carouselMediaPanelOpen ? 'border-mts-accent text-mts-accent' : ''"
                :disabled="disabled || carouselUploading"
                @click="toggleCarouselMediaPanel"
              >
                <FolderOpen class="h-3.5 w-3.5" />
                Медиатека
              </button>
              <div class="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  class="border border-mts-border bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-mts-text transition-colors hover:bg-mts-bg"
                  @click="cancelCarouselDialog"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  class="border border-transparent bg-mts-text px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white transition-colors hover:bg-mts-text-secondary disabled:opacity-50"
                  :disabled="carouselSlides.length === 0"
                  @click="applyCarouselDialog"
                >
                  {{ carouselEditingPos === null ? 'Вставить' : 'Сохранить' }}
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="props.allowImages && galleryDialogOpen"
        class="fixed inset-0 z-[245] flex items-stretch justify-center p-4 sm:items-center sm:p-6"
        role="presentation"
        @click.self="cancelGalleryDialog"
      >
        <div class="absolute inset-0 bg-black/55" aria-hidden="true" />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-rich-gallery-title"
          class="relative z-10 flex max-h-[min(94vh,1100px)] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-mts-border bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
          @click.stop
        >
          <header class="flex items-start justify-between gap-3 border-b border-mts-border bg-mts-bg/40 px-6 py-4">
            <div class="min-w-0">
              <h2 id="admin-rich-gallery-title" class="font-display text-lg text-mts-text">
                {{ galleryEditingPos === null ? 'Новая галерея (Masonry)' : 'Галерея (Masonry)' }}
              </h2>
              <p class="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
                {{ galleryImages.length }} изображени<span v-if="galleryImages.length % 10 === 1 && galleryImages.length % 100 !== 11">е</span><span v-else-if="[2,3,4].includes(galleryImages.length % 10) && ![12,13,14].includes(galleryImages.length % 100)">я</span><span v-else>й</span>
                · на сайте — каменная кладка с разной высотой
              </p>
            </div>
            <button
              type="button"
              aria-label="Закрыть"
              class="inline-flex h-9 w-9 items-center justify-center text-mts-text-secondary transition-colors hover:text-mts-accent"
              @click="cancelGalleryDialog"
            >
              <X class="h-5 w-5" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto px-6 py-5">
            <p class="mb-3 font-body text-xs text-mts-text-secondary">
              Добавьте изображения через <strong>URL</strong>, <strong>загрузите файлы с диска</strong>
              или выберите из <strong>медиатеки</strong>. На сайте блок отрисуется как
              <code class="font-mono">MasonryImageGallery</code> с лайтбоксом по клику.
            </p>

            <div
              v-if="galleryImages.length === 0"
              class="mb-5 flex items-center justify-center rounded border border-dashed border-mts-border bg-mts-bg/50 px-3 py-10 font-body text-sm text-mts-text-secondary"
            >
              Список пуст. Добавьте изображения ниже — через URL, диск или медиатеку.
            </div>
            <div
              v-else
              class="mb-5 grid gap-3"
              style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))"
            >
              <div
                v-for="(image, idx) in galleryImages"
                :key="`gallery-image-${idx}`"
                class="flex flex-col border border-mts-border bg-white"
              >
                <div class="relative aspect-[4/3] overflow-hidden bg-mts-bg">
                  <img
                    v-if="image.src && isSafeCarouselImgSrc(image.src)"
                    :src="image.src"
                    :alt="image.alt || ''"
                    class="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  >
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-red-500"
                  >
                    Неверный URL
                  </div>
                  <span
                    class="absolute left-2 top-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-sm bg-black/60 px-1.5 font-mono text-[11px] font-semibold text-white"
                  >
                    {{ idx + 1 }}
                  </span>
                </div>
                <div class="space-y-2 border-t border-mts-border p-3">
                  <input
                    :value="image.src"
                    type="text"
                    placeholder="https://… или /storage/…"
                    class="w-full border border-mts-border bg-mts-bg px-2 py-1.5 font-mono text-[11px] text-mts-text focus:border-mts-accent focus:outline-none"
                    @input="(e) => setGalleryImageSrc(idx, (e.target as HTMLInputElement).value)"
                  >
                  <input
                    :value="image.alt"
                    type="text"
                    placeholder="alt (для доступности)"
                    class="w-full border border-mts-border bg-mts-bg px-2 py-1.5 font-body text-xs text-mts-text focus:border-mts-accent focus:outline-none"
                    @input="(e) => setGalleryImageAlt(idx, (e.target as HTMLInputElement).value)"
                  >
                  <div class="flex items-center justify-between gap-1">
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        title="Сдвинуть выше"
                        aria-label="Сдвинуть выше"
                        class="inline-flex h-7 w-7 items-center justify-center border border-mts-border bg-white text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="idx === 0"
                        @click="moveGalleryImage(idx, -1)"
                      >
                        <ArrowUp class="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Сдвинуть ниже"
                        aria-label="Сдвинуть ниже"
                        class="inline-flex h-7 w-7 items-center justify-center border border-mts-border bg-white text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="idx === galleryImages.length - 1"
                        @click="moveGalleryImage(idx, 1)"
                      >
                        <ArrowDown class="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      class="inline-flex h-7 items-center gap-1 border border-mts-border bg-white px-2 font-mono text-[10px] uppercase tracking-wide text-red-700 transition-colors hover:border-red-500 hover:text-red-700"
                      @click="removeGalleryImage(idx)"
                    >
                      <Trash2 class="h-3 w-3" />
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-2 flex flex-wrap items-center gap-3">
              <h3 class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
                Параметры галереи
              </h3>
              <span class="text-mts-text-muted">·</span>
              <label class="flex items-center gap-2 font-body text-sm text-mts-text">
                <span class="text-mts-text-secondary">Колонок (md+)</span>
                <select
                  v-model.number="galleryColumns"
                  class="border border-mts-border bg-white px-2 py-1 text-sm outline-none focus:border-mts-accent"
                >
                  <option v-for="c in MTS_RICH_GALLERY_COLUMNS" :key="c" :value="c">{{ c }}</option>
                </select>
              </label>
              <span class="text-xs text-mts-text-muted">
                На мобильном всегда 2 колонки
              </span>
            </div>
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
              Подпись для screen reader (aria-label)
            </label>
            <input
              v-model="galleryAriaLabel"
              type="text"
              class="w-full border border-mts-border bg-white px-3 py-2 text-sm text-mts-text outline-none focus:border-mts-accent"
              placeholder="Галерея изображений"
            >

            <div
              v-if="galleryMediaPanelOpen"
              class="mt-4 rounded border border-mts-border bg-mts-bg/40 p-3"
            >
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
                  Медиатека · каталог /media на сервере
                </span>
                <button
                  type="button"
                  class="text-xs font-medium text-mts-accent hover:underline disabled:pointer-events-none disabled:opacity-50"
                  :disabled="galleryMediaLoading || disabled"
                  @click="loadGalleryMediaLibrary"
                >
                  Обновить
                </button>
              </div>
              <p v-if="galleryMediaLoading" class="py-6 text-center text-xs text-mts-text-secondary">
                Загрузка списка…
              </p>
              <p
                v-else-if="!galleryMediaItems.length"
                class="py-4 text-center text-xs text-mts-text-secondary"
              >
                Нет изображений в каталоге. Загрузите файлы через «С диска» или положите их в
                <code class="font-mono">storage/app/public/media</code> и нажмите «Обновить».
              </p>
              <div
                v-else
                class="max-h-72 overflow-y-auto rounded border border-mts-border bg-white p-2"
              >
                <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  <button
                    v-for="it in galleryMediaItems"
                    :key="it.url"
                    type="button"
                    class="relative aspect-square overflow-hidden rounded border-2 bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent"
                    :class="
                      isGalleryMediaPicked(it.url)
                        ? 'border-mts-accent ring-2 ring-mts-accent/30'
                        : 'border-mts-border hover:border-mts-accent/60'
                    "
                    :title="it.filename"
                    :disabled="disabled || galleryUploading"
                    @click="toggleGalleryMediaPick(it.url)"
                  >
                    <img
                      :src="it.url"
                      alt=""
                      class="h-full w-full object-cover"
                      loading="lazy"
                    >
                  </button>
                </div>
              </div>
              <div v-if="galleryMediaItems.length" class="mt-2 flex justify-end">
                <button
                  type="button"
                  class="rounded bg-mts-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                  :disabled="!galleryMediaSelectedUrls.length || disabled || galleryUploading"
                  @click="appendGalleryMediaPicked"
                >
                  Добавить выбранные ({{ galleryMediaSelectedUrls.length }})
                </button>
              </div>
            </div>
          </div>

          <footer class="border-t border-mts-border bg-mts-bg/50 px-6 py-4">
            <div class="flex flex-wrap items-stretch gap-2">
              <input
                ref="galleryNewUrlInputRef"
                v-model="galleryNewUrl"
                type="text"
                placeholder="https://… или /storage/…"
                class="min-w-[14rem] flex-1 border border-mts-border bg-white px-3 py-2 font-body text-sm focus:border-mts-accent focus:outline-none"
                @keydown.enter.prevent="submitGalleryNewUrl"
              >
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border border-mts-border bg-white px-3 font-mono text-[11px] uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:opacity-40"
                :disabled="!galleryNewUrl.trim()"
                @click="submitGalleryNewUrl"
              >
                <ImagePlus class="h-3.5 w-3.5" />
                Добавить URL
              </button>
              <label
                class="inline-flex cursor-pointer items-center gap-1.5 border border-transparent bg-mts-accent px-3 font-mono text-[11px] uppercase tracking-wide text-white transition-colors hover:bg-mts-accent-dark"
                :class="
                  disabled || galleryUploading
                    ? 'pointer-events-none cursor-not-allowed opacity-50'
                    : ''
                "
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="sr-only"
                  tabindex="-1"
                  multiple
                  :disabled="disabled || galleryUploading"
                  @change="onGalleryFileChange"
                >
                <Loader2 v-if="galleryUploading" class="h-3.5 w-3.5 animate-spin" />
                <Upload v-else class="h-3.5 w-3.5" />
                <span>{{ galleryUploading ? 'Загрузка…' : 'С диска' }}</span>
              </label>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border border-mts-border bg-white px-3 font-mono text-[11px] uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:opacity-40"
                :class="galleryMediaPanelOpen ? 'border-mts-accent text-mts-accent' : ''"
                :disabled="disabled || galleryUploading"
                @click="toggleGalleryMediaPanel"
              >
                <FolderOpen class="h-3.5 w-3.5" />
                Медиатека
              </button>
              <div class="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  class="border border-mts-border bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-mts-text transition-colors hover:bg-mts-bg"
                  @click="cancelGalleryDialog"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  class="border border-transparent bg-mts-text px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white transition-colors hover:bg-mts-text-secondary disabled:opacity-50"
                  :disabled="galleryImages.length === 0"
                  @click="applyGalleryDialog"
                >
                  {{ galleryEditingPos === null ? 'Вставить' : 'Сохранить' }}
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Teleport>

    <input
      v-if="props.allowImages"
      ref="imageFileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="sr-only"
      tabindex="-1"
      @change="onImageFileChange"
    >
  </div>
</template>

<style scoped>
.admin-rich-text__editor :deep(.ProseMirror) {
  min-height: 280px;
  padding: 0.75rem 0.875rem 1rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.6;
  outline: none;
  border-radius: 0 0 2px 2px;
}

.admin-rich-text__editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.admin-rich-text__editor :deep(.ProseMirror h2) {
  font-family: var(--font-display);
  font-size: 1.35rem;
  margin: 0.75rem 0 0.5rem;
  color: inherit;
}

.admin-rich-text__editor :deep(.ProseMirror h3) {
  font-family: var(--font-display);
  font-size: 1.15rem;
  margin: 0.65rem 0 0.4rem;
  color: inherit;
}

.admin-rich-text__editor :deep(.ProseMirror h4) {
  font-family: var(--font-display);
  font-size: 1.05rem;
  margin: 0.55rem 0 0.35rem;
  color: inherit;
}

.admin-rich-text__editor :deep(.ProseMirror p) {
  margin: 0.4rem 0;
}

/* Preflight сбрасывает list-style — явно показываем маркеры */
.admin-rich-text__editor :deep(.ProseMirror ul),
.admin-rich-text__editor :deep(.ProseMirror ol) {
  margin: 0.4rem 0;
  padding-left: 1.5rem;
  list-style-position: outside;
}
.admin-rich-text__editor :deep(.ProseMirror ul) {
  list-style-type: disc;
}
.admin-rich-text__editor :deep(.ProseMirror ul[data-list-style='circle']) {
  list-style-type: circle;
}
.admin-rich-text__editor :deep(.ProseMirror ul[data-list-style='square']) {
  list-style-type: square;
}
.admin-rich-text__editor :deep(.ProseMirror ul[data-list-style='none']) {
  list-style-type: none;
}
.admin-rich-text__editor :deep(.ProseMirror ol[type='a']) {
  list-style-type: lower-alpha;
}
.admin-rich-text__editor :deep(.ProseMirror ol[type='A']) {
  list-style-type: upper-alpha;
}
.admin-rich-text__editor :deep(.ProseMirror ol[type='i']) {
  list-style-type: lower-roman;
}
.admin-rich-text__editor :deep(.ProseMirror ol[type='I']) {
  list-style-type: upper-roman;
}
.admin-rich-text__editor :deep(.ProseMirror ol) {
  list-style-type: decimal;
}
.admin-rich-text__editor :deep(.ProseMirror li) {
  display: list-item;
}
.admin-rich-text__editor :deep(.ProseMirror li p) {
  margin: 0.15rem 0;
}
.admin-rich-text__editor :deep(.ProseMirror li > ul),
.admin-rich-text__editor :deep(.ProseMirror li > ol) {
  margin: 0.2rem 0;
}

.admin-rich-text__editor :deep(.ProseMirror blockquote) {
  margin: 0.5rem 0;
  padding-left: 0.75rem;
  border-left: 2px solid var(--color-mts-accent);
  color: var(--color-mts-text-secondary);
}

.admin-rich-text__editor :deep(.ProseMirror.admin-tiptap-editing-surface--dark-canvas blockquote) {
  color: rgb(198 206 220);
}

.admin-rich-text__editor :deep(.ProseMirror hr) {
  margin: 1rem 0;
  border: 0;
  border-top: 1px solid var(--color-mts-border);
}

.admin-rich-text__editor :deep(.ProseMirror.admin-tiptap-editing-surface--dark-canvas hr) {
  border-top-color: rgb(255 255 255 / 0.15);
}

.admin-rich-text__editor :deep(.ProseMirror mark) {
  padding: 0.05em 0.15em;
  border-radius: 2px;
  background-color: color-mix(in srgb, var(--color-mts-accent) 45%, transparent);
}

.admin-rich-text__editor :deep(.ProseMirror code) {
  padding: 0.1em 0.35em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: ui-monospace, monospace;
  background: rgb(0 0 0 / 0.06);
}

.admin-rich-text__editor :deep(.ProseMirror.admin-tiptap-editing-surface--dark-canvas code) {
  background: rgb(255 255 255 / 0.1);
}

.admin-rich-text__editor :deep(.admin-rich-code-block) {
  margin: 0.65rem 0;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid var(--color-mts-border);
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  background: var(--color-mts-bg);
  color: var(--color-mts-text);
}

.admin-rich-text__editor :deep(.ProseMirror.admin-tiptap-editing-surface--dark-canvas .admin-rich-code-block) {
  border-color: rgb(255 255 255 / 0.12);
  background: rgb(0 0 0 / 0.22);
  color: rgb(226 232 240);
}

.admin-rich-text__editor :deep(.admin-rich-code-block code) {
  padding: 0;
  background: transparent;
  font-size: inherit;
}

.admin-rich-text__editor :deep(.ProseMirror table) {
  width: 100%;
  margin: 0.65rem 0;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.admin-rich-text__editor :deep(.ProseMirror th),
.admin-rich-text__editor :deep(.ProseMirror td) {
  min-width: 2.5rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--color-mts-border);
  vertical-align: top;
}

.admin-rich-text__editor :deep(.ProseMirror.admin-tiptap-editing-surface--dark-canvas th),
.admin-rich-text__editor :deep(.ProseMirror.admin-tiptap-editing-surface--dark-canvas td) {
  border-color: rgb(255 255 255 / 0.12);
}

.admin-rich-text__editor :deep(.ProseMirror th) {
  font-weight: 600;
  text-align: left;
  background: var(--color-mts-border-light);
}

.admin-rich-text__editor :deep(.ProseMirror.admin-tiptap-editing-surface--dark-canvas th) {
  background: rgb(255 255 255 / 0.06);
}

.admin-rich-text__editor :deep(.ProseMirror .selectedCell::after) {
  z-index: 2;
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: color-mix(in srgb, var(--color-mts-accent) 22%, transparent);
  content: '';
}

.admin-rich-text__editor :deep(.ProseMirror [data-youtube-video]) {
  margin: 0.75rem 0;
}

.admin-rich-text__editor :deep(.ProseMirror [data-resize-container][data-node='image']) {
  max-width: 100%;
  justify-content: center;
}

.admin-rich-text__editor :deep(.ProseMirror [data-resize-wrapper]) {
  max-width: 100%;
}

.admin-rich-text__editor :deep(.ProseMirror [data-resize-handle]) {
  z-index: 3;
  width: 11px;
  height: 11px;
  box-sizing: border-box;
  border: 2px solid white;
  border-radius: 2px;
  background: var(--color-mts-accent, #c14042);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-mts-text, #1a1a1a) 25%, transparent);
}

.admin-rich-text__editor :deep(.ProseMirror [data-resize-handle='top-left']) {
  transform: translate(-50%, -50%);
}

.admin-rich-text__editor :deep(.ProseMirror [data-resize-handle='top-right']) {
  transform: translate(50%, -50%);
}

.admin-rich-text__editor :deep(.ProseMirror [data-resize-handle='bottom-left']) {
  transform: translate(-50%, 50%);
}

.admin-rich-text__editor :deep(.ProseMirror [data-resize-handle='bottom-right']) {
  transform: translate(50%, 50%);
}

.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell [data-resize-container][data-node='image']) {
  max-width: 100%;
}

.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid) {
  margin: 0.65rem 0;
  padding: 0.35rem;
  border-radius: 8px;
  outline: 1px dashed rgb(180 188 200);
  align-items: start;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-node-view) {
  position: relative;
  min-height: 2.25rem;
  padding: 0.35rem;
  padding-right: 2.25rem;
  border-radius: 6px;
  outline: 1px dashed rgb(210 216 226);
  align-items: start;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-toolbar) {
  position: absolute;
  right: 3px;
  top: 3px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-move),
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-remove) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  padding: 0;
  margin: 0;
  border-radius: 4px;
  border: 1px solid rgb(200 206 216);
  background: rgb(255 255 255);
  color: rgb(80 86 98);
  font-size: 1.125rem;
  line-height: 1;
  font-weight: 600;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.12s ease,
    background-color 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-move) {
  font-size: 0.6875rem;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-node-view:hover .mts-rich-grid-cell-toolbar .mts-rich-grid-cell-move),
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-node-view:focus-within .mts-rich-grid-cell-toolbar .mts-rich-grid-cell-move),
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-node-view:hover .mts-rich-grid-cell-remove),
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-node-view:focus-within .mts-rich-grid-cell-remove) {
  opacity: 1;
}
@media (hover: none) {
  .admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-toolbar .mts-rich-grid-cell-move),
  .admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-remove) {
    opacity: 0.7;
  }
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-move:hover:not(:disabled)) {
  background: rgb(239 246 255);
  border-color: rgb(147 197 253);
  color: rgb(29 78 216);
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-move:disabled) {
  opacity: 0.22;
  cursor: not-allowed;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-grid-cell-remove:hover) {
  background: rgb(254 226 226);
  border-color: rgb(252 165 165);
  color: rgb(185 28 28);
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-map) {
  margin: 0.5rem 0;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel) {
  margin: 0.5rem 0;
  border-radius: 6px;
  outline: 1px dashed rgb(200 206 216);
  padding: 0.25rem;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel img) {
  max-height: 11rem;
  width: 100%;
  object-fit: cover;
}

/* Превью карусели в редакторе TipTap (NodeView). */
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview) {
  position: relative;
  margin: 0.65rem 0;
  border-radius: 8px;
  border: 1px solid rgb(210 216 226);
  background: linear-gradient(180deg, rgb(248 250 252) 0%, rgb(241 245 249) 100%);
  padding: 0.5rem 0.6rem 0.65rem;
}
.admin-rich-text__editor :deep(.ProseMirror.admin-tiptap-editing-surface--dark-canvas .mts-rich-carousel-nodeview) {
  background: linear-gradient(180deg, rgb(31 36 46) 0%, rgb(22 27 36) 100%);
  border-color: rgb(255 255 255 / 0.12);
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__toolbar) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__title) {
  flex: 1 1 auto;
  font-family: var(--font-display);
  font-size: 0.78rem;
  letter-spacing: 0.01em;
  color: rgb(60 67 80);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.admin-rich-text__editor :deep(.ProseMirror.admin-tiptap-editing-surface--dark-canvas .mts-rich-carousel-nodeview__title) {
  color: rgb(214 220 232);
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border-radius: 4px;
  border: 1px solid rgb(200 206 216);
  background: rgb(255 255 255);
  color: rgb(80 86 98);
  font-size: 0.95rem;
  line-height: 1;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__btn:hover) {
  background: rgb(239 246 255);
  border-color: rgb(147 197 253);
  color: rgb(29 78 216);
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__btn--danger:hover) {
  background: rgb(254 226 226);
  border-color: rgb(252 165 165);
  color: rgb(185 28 28);
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__grid) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 0.35rem;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__cell) {
  position: relative;
  margin: 0;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid rgb(214 220 232);
  background: rgb(248 250 252);
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__cell img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__idx) {
  position: absolute;
  left: 4px;
  top: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.05rem;
  height: 1.05rem;
  padding: 0 0.25rem;
  border-radius: 3px;
  background: rgb(0 0 0 / 0.55);
  color: rgb(255 255 255);
  font-family: ui-monospace, monospace;
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1;
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__more) {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
  border-radius: 4px;
  border: 1px dashed rgb(200 206 216);
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(80 86 98);
  background: rgb(255 255 255);
}
.admin-rich-text__editor :deep(.ProseMirror .mts-rich-carousel-nodeview__empty) {
  grid-column: 1 / -1;
  padding: 0.85rem;
  text-align: center;
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: rgb(110 119 132);
  border: 1px dashed rgb(200 206 216);
  border-radius: 6px;
  background: rgb(255 255 255 / 0.6);
}

.admin-rich-text__editor :deep(.ProseMirror [data-youtube-video] iframe) {
  display: block;
  max-width: 100%;
  border: 0;
}
</style>
