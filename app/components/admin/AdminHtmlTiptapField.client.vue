<script setup lang="ts">
import {type Editor, EditorContent, useEditor} from '@tiptap/vue-3'
import { incomingCmsValueToHtml } from '~/utils/adminHtmlField'
import { createThemedHtmlTiptapExtensions } from '~/utils/themedHtmlTiptapExtensions'
import AdminColorTextPopover from './AdminColorTextPopover.client.vue'

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    placeholder?: string
    multiline?: boolean
    compact?: boolean
    editorClass?: string
  }>(),
  {
    placeholder: 'Текст…',
    multiline: true,
    compact: true,
    editorClass: '',
  },
)

const syncingFromOutside = ref(false)
const suppressEmitToParent = ref(false)

const initialHtml = incomingCmsValueToHtml(model.value)

const editor = useEditor({
  extensions: createThemedHtmlTiptapExtensions({ placeholder: props.placeholder }),
  content: initialHtml,
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
    const html = ed.getHTML()
    if (html === model.value) {
      return
    }
    suppressEmitToParent.value = true
    model.value = html
    nextTick(() => {
      suppressEmitToParent.value = false
    })
  },
})

watch(
  () => model.value,
  (ext) => {
    if (suppressEmitToParent.value) {
      return
    }
    const ed = editor.value
    if (!ed || syncingFromOutside.value) {
      return
    }
    const incoming = incomingCmsValueToHtml(ext ?? '')
    if (incoming === ed.getHTML()) {
      return
    }
    syncingFromOutside.value = true
    ed.commands.setContent(incoming)
    syncingFromOutside.value = false
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="space-y-3">
    <p v-if="!compact" class="font-body text-xs text-mts-text-secondary">
      Выделите слова, откройте палитру в тулбаре и выберите цвет текста или подсветку.
    </p>

    <div
      class="rounded border border-mts-border bg-mts-bg shadow-inner transition-colors focus-within:border-mts-accent focus-within:ring-1 focus-within:ring-mts-accent/30"
    >
      <div class="flex flex-wrap items-center gap-2 border-b border-mts-border/60 bg-white/60 px-2 py-1.5">
        <AdminColorTextPopover :editor="editor as Editor | null" />
      </div>
      <EditorContent v-if="editor" :editor="editor" class="admin-html-tiptap-field" />
    </div>
  </div>
</template>

<style scoped>
</style>
