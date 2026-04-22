<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import type { ThemeFormattedTitle } from '~/types'
import { encodeAdminThemedString } from '~/utils/adminThemedTextCodec'
import { createThemedHtmlTiptapExtensions } from '~/utils/themedHtmlTiptapExtensions'
import { themeTitleFromTiptapDoc, themeTitleToTiptapDoc } from '~/utils/themeToneTiptap'
import AdminThemeTonePopover from './AdminThemeTonePopover.client.vue'

const model = defineModel<ThemeFormattedTitle>({ required: true })

const props = withDefaults(
  defineProps<{
    placeholder?: string
    /** Разрешить перенос строки Enter (как textarea). */
    multiline?: boolean
    /** Короткая подсказка и компактная палитра под полем. */
    compact?: boolean
    /** Доп. классы для оболочки редактора. */
    editorClass?: string
  }>(),
  {
    placeholder: 'Текст…',
    multiline: false,
    compact: false,
    editorClass: '',
  },
)

const syncingFromOutside = ref(false)

const editor = useEditor({
  extensions: createThemedHtmlTiptapExtensions({ placeholder: props.placeholder }),
  content: themeTitleToTiptapDoc(model.value),
  editorProps: {
    attributes: {
      class: [
        'tiptap ProseMirror w-full max-w-none px-4 py-3 font-body text-sm leading-snug text-mts-text focus:outline-none',
        props.multiline ? 'min-h-[6rem]' : 'min-h-[3rem]',
        props.editorClass,
      ]
        .filter(Boolean)
        .join(' '),
    },
    handleKeyDown(_view, event) {
      if (event.key === 'Enter' && !props.multiline) {
        event.preventDefault()
        return true
      }
      if (event.key === 'Enter' && props.multiline && !event.shiftKey) {
        event.preventDefault()
        editor.value?.chain().focus().setHardBreak().run()
        return true
      }
      return false
    },
    handlePaste(view, event) {
      let plain = event.clipboardData?.getData('text/plain')
      if (plain == null) {
        return false
      }
      if (!props.multiline) {
        plain = plain.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim()
      }
      event.preventDefault()
      const { from, to } = view.state.selection
      view.dispatch(view.state.tr.insertText(plain, from, to))
      return true
    },
  },
  onUpdate: ({ editor: ed }) => {
    if (syncingFromOutside.value) {
      return
    }
    model.value = themeTitleFromTiptapDoc(ed.getJSON())
  },
})

/*
 * Синхронизация «снаружи» (загрузка формы): только если каноническая строка CMS
 * расходится с тем, что даёт разбор текущего документа редактора.
 * Сравниваем через encodeAdminThemedString — тот же формат, что в БД (plain или JSON).
 * Нельзя сравнивать JSON.stringify(ed.getJSON()) с нашим doc — TipTap даёт другую
 * форму узлов при том же смысле.
 */
watch(
  () => encodeAdminThemedString(model.value),
  () => {
    const ed = editor.value
    if (!ed || syncingFromOutside.value) {
      return
    }
    const fromEditor = themeTitleFromTiptapDoc(ed.getJSON())
    if (encodeAdminThemedString(fromEditor) === encodeAdminThemedString(model.value)) {
      return
    }
    syncingFromOutside.value = true
    ed.commands.setContent(themeTitleToTiptapDoc(model.value), false)
    syncingFromOutside.value = false
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="space-y-3">
    <p v-if="!compact" class="font-body text-xs text-mts-text-secondary">
      Выделите слова, откройте палитру и выберите тон темы.
    </p>

    <!--
      Однострочный режим (заголовок) — поповер слева от поля, экономит вертикаль.
      Многострочный режим (лид и пр.) — тулбар сверху, поповер над полем.
    -->
    <div
      v-if="!multiline"
      class="flex items-stretch rounded border border-mts-border bg-mts-bg shadow-inner transition-colors focus-within:border-mts-accent focus-within:ring-1 focus-within:ring-mts-accent/30"
    >
      <div class="flex shrink-0 items-center border-r border-mts-border/60 bg-white/60 px-2">
        <AdminThemeTonePopover :editor="editor" />
      </div>
      <EditorContent v-if="editor" :editor="editor" class="admin-theme-tone-tiptap min-w-0 flex-1" />
    </div>

    <div
      v-else
      class="rounded border border-mts-border bg-mts-bg shadow-inner transition-colors focus-within:border-mts-accent focus-within:ring-1 focus-within:ring-mts-accent/30"
    >
      <div class="flex flex-wrap items-center gap-2 border-b border-mts-border/60 bg-white/60 px-2 py-1.5">
        <AdminThemeTonePopover :editor="editor" />
      </div>
      <EditorContent v-if="editor" :editor="editor" class="admin-theme-tone-tiptap" />
    </div>
  </div>
</template>

<style scoped>
.admin-theme-tone-tiptap :deep(.ProseMirror) {
  outline: none;
  white-space: pre-wrap;
}
.admin-theme-tone-tiptap :deep(.ProseMirror p.is-empty::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: rgb(100 116 139);
}
</style>
