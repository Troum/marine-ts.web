<script setup lang="ts">
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import YoutubeExtension from '@tiptap/extension-youtube'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Code,
  Eraser,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
  Youtube as YoutubeIcon,
} from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import { sanitizeRichContentHtml } from '~/composables/useMarkdownSafeHtml'

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
const linkDialogOpen = ref(false)
const linkHref = ref('')
const linkNewTab = ref(true)
const linkInputRef = ref<HTMLInputElement | null>(null)

const imageDialogOpen = ref(false)
const imageUrl = ref('https://')
const imageInputRef = ref<HTMLInputElement | null>(null)

const youtubeDialogOpen = ref(false)
const youtubeUrl = ref('https://www.youtube.com/watch?v=')
const youtubeInputRef = ref<HTMLInputElement | null>(null)

const editor = useEditor({
  content: props.modelValue?.trim() ? props.modelValue : '<p></p>',
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      codeBlock: {
        HTMLAttributes: {
          class: 'admin-rich-code-block',
        },
      },
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Highlight.configure({
      multicolor: false,
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
        class: 'mx-auto max-h-[480px] max-w-full rounded-sm border border-mts-border object-contain',
      },
    }),
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
      class: 'admin-rich-text-prose max-w-none focus:outline-none',
    },
    transformPastedHTML(html) {
      return sanitizeRichContentHtml(html)
    },
  },
  onUpdate: ({ editor: ed }) => {
    charCount.value = ed.getText().length
    emit('update:modelValue', ed.getHTML())
  },
  onCreate: ({ editor: ed }) => {
    charCount.value = ed.getText().length
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
      </button>
      <button
        type="button"
        :class="btnClass(editor.isActive('highlight'))"
        title="Подсветка"
        @click="editor.chain().focus().toggleHighlight().run()"
      >
        <Highlighter class="h-4 w-4" />
      </button>
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
      <button type="button" :class="btnClass(false)" title="Изображение по URL" @click="openImageDialog">
        <ImageIcon class="h-4 w-4" />
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
  </div>
</template>

<style scoped>
.admin-rich-text__editor :deep(.ProseMirror) {
  min-height: 280px;
  padding: 0.75rem 0.875rem 1rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-mts-text);
  outline: none;
}

.admin-rich-text__editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: var(--color-mts-text-muted);
}

.admin-rich-text__editor :deep(.ProseMirror h2) {
  font-family: var(--font-display);
  font-size: 1.35rem;
  margin: 0.75rem 0 0.5rem;
}

.admin-rich-text__editor :deep(.ProseMirror h3) {
  font-family: var(--font-display);
  font-size: 1.15rem;
  margin: 0.65rem 0 0.4rem;
}

.admin-rich-text__editor :deep(.ProseMirror h4) {
  font-family: var(--font-display);
  font-size: 1.05rem;
  margin: 0.55rem 0 0.35rem;
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

.admin-rich-text__editor :deep(.ProseMirror hr) {
  margin: 1rem 0;
  border: 0;
  border-top: 1px solid var(--color-mts-border);
}

.admin-rich-text__editor :deep(.ProseMirror mark) {
  padding: 0.05em 0.15em;
  border-radius: 2px;
  background-color: color-mix(in srgb, var(--color-mts-accent) 28%, transparent);
}

.admin-rich-text__editor :deep(.ProseMirror code) {
  padding: 0.1em 0.35em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: ui-monospace, monospace;
  background: color-mix(in srgb, var(--color-mts-text) 8%, transparent);
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
  background: color-mix(in srgb, var(--color-mts-text) 5%, var(--color-mts-bg));
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

.admin-rich-text__editor :deep(.ProseMirror th) {
  font-weight: 600;
  text-align: left;
  background: color-mix(in srgb, var(--color-mts-text) 4%, var(--color-mts-bg));
}

.admin-rich-text__editor :deep(.ProseMirror .selectedCell::after) {
  z-index: 2;
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: color-mix(in srgb, var(--color-mts-accent) 12%, transparent);
  content: '';
}

.admin-rich-text__editor :deep(.ProseMirror [data-youtube-video]) {
  margin: 0.75rem 0;
}

.admin-rich-text__editor :deep(.ProseMirror [data-youtube-video] iframe) {
  display: block;
  max-width: 100%;
  border: 0;
}
</style>
