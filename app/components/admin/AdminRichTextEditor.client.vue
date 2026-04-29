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
  Images,
  Italic,
  LayoutGrid,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTree,
  MapPin,
  Minus,
  PlusSquare,
  Quote,
  Redo2,
  FolderOpen,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
  Upload,
  Youtube as YoutubeIcon,
} from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { sanitizeRichContentHtml } from '~/composables/useMarkdownSafeHtml'
import { applyTiptapDarkEditingCanvas } from '~/utils/tiptapAdminDarkCanvas'
import {
  isAllowedRichMapIframeSrc,
  insertImageCarouselInEditor,
  MtsRichGrid,
  MtsRichGridCell,
  MtsRichImageCarousel,
  MtsRichMapEmbed,
} from '~/utils/tiptapMtsRichLayout'
import {
  attrsForBulletListStyle,
  attrsForOrderedListStyle,
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
  }>(),
  { disabled: false, placeholder: 'Текст страницы…' },
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
const carouselUrlsText = ref('https://')
const carouselAltsText = ref('')
const carouselIntervalMs = ref(6000)
const carouselShowDots = ref(true)
const carouselAriaLabel = ref('Галерея изображений')
const carouselUrlsInputRef = ref<HTMLTextAreaElement | null>(null)
const carouselUploading = ref(false)
const carouselMediaPanelOpen = ref(false)
const carouselMediaItems = ref<MediaLibraryItem[]>([])
const carouselMediaLoading = ref(false)
const carouselMediaSelectedUrls = ref<string[]>([])

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
    MtsRichGridCell,
    MtsRichGrid,
    MtsRichImageCarousel,
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
  if (open) {
    await nextTick()
    carouselUrlsInputRef.value?.focus()
    carouselUrlsInputRef.value?.select()
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
}

function cancelImageDialog() {
  imageDialogOpen.value = false
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

function openCarouselDialog() {
  if (!editor.value) {
    return
  }
  carouselUrlsText.value = ''
  carouselAltsText.value = ''
  carouselIntervalMs.value = 6000
  carouselShowDots.value = true
  carouselAriaLabel.value = 'Галерея изображений'
  carouselMediaPanelOpen.value = false
  carouselMediaItems.value = []
  carouselMediaSelectedUrls.value = []
  carouselDialogOpen.value = true
}

function applyCarouselDialog() {
  const ed = editor.value
  if (!ed) {
    carouselDialogOpen.value = false
    return
  }
  const urls = carouselUrlsText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const alts = carouselAltsText.value.split('\n').map((s) => s.trim())
  const slides = urls.map((src, i) => ({ src, alt: alts[i] ?? '' }))
  const ok = insertImageCarouselInEditor(ed, {
    slides,
    intervalMs: Number(carouselIntervalMs.value) || 6000,
    showDots: carouselShowDots.value,
    ariaLabel: carouselAriaLabel.value.trim() || 'Галерея изображений',
  })
  if (!ok) {
    adminToast.show({
      title: 'Ошибка',
      message: 'Нужен хотя бы один корректный URL картинки (https:// или относительный путь /…).',
    })
    return
  }
  adminToast.success('Карусель вставлена')
  carouselDialogOpen.value = false
}

function cancelCarouselDialog() {
  carouselDialogOpen.value = false
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

function appendCarouselMediaPicked() {
  const urls = [...carouselMediaSelectedUrls.value]
  if (!urls.length) {
    return
  }
  const appendedAlts = urls.map((u) => {
    const it = carouselMediaItems.value.find((x) => x.url === u)
    const fn = it?.filename ?? ''
    return fn.replace(/\.[^.]+$/i, '').replace(/[-_]+/g, ' ').trim() || ''
  })
  const cur = carouselUrlsText.value.replace(/\s+$/, '')
  carouselUrlsText.value = cur ? `${cur}\n${urls.join('\n')}` : urls.join('\n')
  const curAlts = carouselAltsText.value.replace(/\s+$/, '')
  carouselAltsText.value = curAlts ? `${curAlts}\n${appendedAlts.join('\n')}` : appendedAlts.join('\n')
  carouselMediaSelectedUrls.value = []
  adminToast.success(`Добавлено из медиатеки: ${urls.length}`)
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
  const appendedUrls: string[] = []
  const appendedAlts: string[] = []
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
        appendedUrls.push(u)
        const base = file.name.replace(/\.[^.]+$/i, '').replace(/[-_]+/g, ' ').trim()
        appendedAlts.push(base || '')
      }
      catch (err: unknown) {
        failures.push(`${file.name}: ${formatMediaUploadError(err)}`)
      }
    }
    if (appendedUrls.length === 0) {
      const msg =
        failures.length === 1
          ? (failures[0] ?? 'Сервер не вернул URL для загруженных файлов')
          : failures.join('\n') || 'Сервер не вернул URL для загруженных файлов'
      adminToast.show({ title: 'Ошибка', message: msg })
      return
    }
    const cur = carouselUrlsText.value.replace(/\s+$/, '')
    carouselUrlsText.value = cur ? `${cur}\n${appendedUrls.join('\n')}` : appendedUrls.join('\n')
    const curAlts = carouselAltsText.value.replace(/\s+$/, '')
    carouselAltsText.value = curAlts ? `${curAlts}\n${appendedAlts.join('\n')}` : appendedAlts.join('\n')
    adminToast.success(`Добавлено изображений: ${appendedUrls.length}`)
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
</script>

<template>
  <div
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
            <label class="mb-1 block text-xs text-mts-text-secondary">Свой символ или URL картинки (https…)</label>
            <div class="flex gap-2">
              <input
                v-model="listCustomMarkerInput"
                type="text"
                class="min-w-0 flex-1 rounded border border-mts-border bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
                placeholder="⭐ или https://…"
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
        type="button"
        :class="btnClass(false)"
        :disabled="disabled"
        title="Карусель изображений (как на «О компании») — курсор в колонке сетки или в тексте"
        @click="openCarouselDialog"
      >
        <Images class="h-4 w-4" />
      </button>
      <span class="mx-1 w-px self-stretch bg-mts-border" />
      <button type="button" :class="btnClass(false)" title="Изображение (URL / файл). После вставки — выделите и тяните угол для размера" @click="openImageDialog">
        <ImageIcon class="h-4 w-4" />
      </button>
      <button
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
        v-if="imageDialogOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-rich-image-title"
        @click.self="cancelImageDialog"
      >
        <div class="w-full max-w-md rounded-lg border border-mts-border bg-mts-bg p-4 shadow-lg" @click.stop>
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
          <button
            type="button"
            class="mt-2 w-full rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:opacity-50"
            :disabled="imageUploading"
            @click="pickImageFile"
          >
            {{ imageUploading ? 'Загрузка…' : 'Загрузить файл' }}
          </button>
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
        v-if="carouselDialogOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-rich-carousel-title"
        @click.self="cancelCarouselDialog"
      >
        <div class="w-full max-w-2xl rounded-lg border border-mts-border bg-mts-bg p-4 shadow-lg" @click.stop>
          <h2 id="admin-rich-carousel-title" class="mb-3 font-display text-base font-semibold text-mts-text">
            Карусель изображений
          </h2>
          <p class="mb-3 font-body text-xs text-mts-text-secondary">
            Вставьте <strong>по одному URL на строку</strong> (https или путь вида <code class="font-mono">/storage/…</code>),
            <strong>загрузите с диска</strong> или выберите из <strong>медиатеки</strong> (файлы в
            <code class="font-mono">storage/app/public/media</code>) — ссылки появятся в списке ниже. На сайте блок заменится на
            <code class="font-mono">ImageFadeCarousel</code> с плавной сменой кадров. Удобно в ячейке сетки TipTap.
          </p>
          <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-medium text-mts-text-secondary" id="admin-rich-carousel-urls-label">URL изображений</span>
            <div class="flex flex-wrap items-center gap-2">
              <label
                class="inline-flex cursor-pointer items-center gap-1.5 rounded border border-mts-border bg-white px-2.5 py-1 text-xs font-medium text-mts-text hover:border-mts-accent hover:text-mts-accent"
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
                <Upload class="h-3.5 w-3.5 shrink-0" />
                <span>{{ carouselUploading ? 'Загрузка…' : 'С диска' }}</span>
              </label>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded border border-mts-border bg-white px-2.5 py-1 text-xs font-medium text-mts-text hover:border-mts-accent hover:text-mts-accent disabled:pointer-events-none disabled:opacity-50"
                :class="carouselMediaPanelOpen ? 'border-mts-accent text-mts-accent' : ''"
                :disabled="disabled || carouselUploading"
                @click="toggleCarouselMediaPanel"
              >
                <FolderOpen class="h-3.5 w-3.5 shrink-0" />
                Медиатека
              </button>
            </div>
          </div>
          <div
            v-if="carouselMediaPanelOpen"
            class="mb-3 rounded border border-mts-border bg-white/60 p-3 dark:bg-white/5"
          >
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-medium text-mts-text-secondary">Каталог media на сервере</span>
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
              Нет изображений в каталоге (или каталог пуст). Загрузите файлы через «С диска» или положите их в
              <code class="font-mono">media</code> и нажмите «Обновить».
            </p>
            <div
              v-else
              class="max-h-52 overflow-y-auto rounded border border-mts-border bg-mts-bg p-2"
            >
              <div class="grid grid-cols-4 gap-2 sm:grid-cols-5">
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
          <textarea
            id="admin-rich-carousel-urls"
            aria-labelledby="admin-rich-carousel-urls-label"
            ref="carouselUrlsInputRef"
            v-model="carouselUrlsText"
            rows="5"
            class="mt-1 w-full rounded border border-mts-border bg-white px-3 py-2 font-mono text-xs text-mts-text outline-none focus:border-mts-accent"
            placeholder="https://example.com/a.jpg&#10;https://example.com/b.jpg"
          ></textarea>
          <label class="mt-3 block text-xs font-medium text-mts-text-secondary"
            >Подписи Alt (необязательно, по строке на картинку)</label
          >
          <textarea
            v-model="carouselAltsText"
            rows="3"
            class="mt-1 w-full rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text outline-none focus:border-mts-accent"
            placeholder="Фото 1&#10;Фото 2"
          ></textarea>
          <label class="mt-3 block text-xs font-medium text-mts-text-secondary">Подпись для screen reader (aria-label)</label>
          <input
            v-model="carouselAriaLabel"
            type="text"
            class="mt-1 w-full rounded border border-mts-border bg-white px-3 py-2 text-sm text-mts-text outline-none focus:border-mts-accent"
          >
          <div class="mt-3 flex flex-wrap items-center gap-4">
            <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
              <input v-model="carouselShowDots" type="checkbox" class="mts-checkbox" />
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
                class="w-24 rounded border border-mts-border bg-white px-2 py-1 text-sm outline-none focus:border-mts-accent"
              >
            </label>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded border border-mts-border bg-white px-3 py-1.5 text-sm text-mts-text hover:bg-mts-bg"
              @click="cancelCarouselDialog"
            >
              Отмена
            </button>
            <button
              type="button"
              class="rounded bg-mts-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
              @click="applyCarouselDialog"
            >
              Вставить
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <input
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

.admin-rich-text__editor :deep(.ProseMirror [data-youtube-video] iframe) {
  display: block;
  max-width: 100%;
  border: 0;
}
</style>
