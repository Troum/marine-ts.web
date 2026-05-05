<script setup lang="ts">
/**
 * Необязательный фон hero: URL вручную или загрузка файла (POST /media).
 */
import { Loader2, Images, X } from 'lucide-vue-next'
import type { MediaLibraryItem } from '~/types'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    label?: string
    hint?: string
    /** Доп. класс для поля URL */
    inputClass?: string
    /** `image` — только картинки; `video` — загрузка и медиатека фильтруются под видео (mp4, webm, mov). */
    mediaMode?: 'image' | 'video'
  }>(),
  {
    modelValue: '',
    label: 'Фон hero (изображение)',
    hint: 'Необязательно. Укажите URL или загрузите файл — в поле подставится адрес из хранилища.',
    inputClass:
      'box-border h-11 w-full min-w-0 border border-mts-border bg-mts-bg px-4 font-body text-sm focus:border-mts-accent focus:outline-none',
    mediaMode: 'image',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const api = useMarineApi()
const adminToast = useAdminToast()

const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const mediaOpen = ref(false)
const mediaLoading = ref(false)
const mediaItems = ref<MediaLibraryItem[]>([])
const mediaLoaded = ref(false)

const VIDEO_EXT = /\.(mp4|webm|mov)$/i

const pickerMediaItems = computed(() =>
  props.mediaMode === 'video'
    ? mediaItems.value.filter((item) => VIDEO_EXT.test(item.filename || item.url))
    : mediaItems.value.filter((item) => /\.(avif|jpe?g|png|webp|gif|svg)$/i.test(item.filename || item.url)),
)

const urlProxy = computed({
  get: () => props.modelValue ?? '',
  set: (v: string) => {
    const t = v.trim()
    emit('update:modelValue', t)
  },
})

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  uploading.value = true
  try {
    const res = await api.media.upload(file)
    emit('update:modelValue', res.url)
    adminToast.success(props.mediaMode === 'video' ? 'Видео загружено' : 'Изображение загружено')
  } catch {
    adminToast.show({ title: 'Ошибка', message: 'Не удалось загрузить файл' })
  } finally {
    uploading.value = false
  }
}

function clear() {
  emit('update:modelValue', '')
}

function pickFile() {
  fileInput.value?.click()
}

async function loadMediaLibrary(force = false) {
  if (mediaLoaded.value && !force) {
    return
  }
  mediaLoading.value = true
  try {
    const list = await api.media.listManage()
    mediaItems.value = [...list].sort((a, b) =>
      (new Date(b.modified_at).getTime() || 0) - (new Date(a.modified_at).getTime() || 0),
    )
    mediaLoaded.value = true
  } catch {
    adminToast.show({ title: 'Ошибка', message: 'Не удалось загрузить медиатеку' })
  } finally {
    mediaLoading.value = false
  }
}

async function openMediaLibrary() {
  mediaOpen.value = true
  await loadMediaLibrary()
}

function closeMediaLibrary() {
  mediaOpen.value = false
}

function selectFromLibrary(url: string) {
  emit('update:modelValue', url)
  adminToast.success(props.mediaMode === 'video' ? 'Видео выбрано из медиатеки' : 'Изображение выбрано из медиатеки')
  closeMediaLibrary()
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    closeMediaLibrary()
  }
}

let savedBodyOverflow: string | null = null
watch(mediaOpen, (open) => {
  if (typeof window === 'undefined') {
    return
  }
  if (open) {
    savedBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else if (savedBodyOverflow !== null) {
    document.body.style.overflow = savedBodyOverflow
    savedBodyOverflow = null
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && savedBodyOverflow !== null) {
    document.body.style.overflow = savedBodyOverflow
    savedBodyOverflow = null
  }
})
</script>

<template>
  <div class="space-y-2">
    <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{ label }}</label>
    <p v-if="hint" class="font-body text-xs text-mts-text-secondary">{{ hint }}</p>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input v-model="urlProxy" type="text" :class="inputClass" placeholder="https://… или /storage/…" />
      <div class="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          :disabled="uploading"
          class="inline-flex h-11 items-center justify-center whitespace-nowrap border border-transparent bg-mts-accent px-4 font-mono text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-mts-accent-dark disabled:opacity-50"
          @click="pickFile"
        >
          {{ uploading ? 'Загрузка…' : 'Загрузить файл' }}
        </button>
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-1.5 border border-mts-border bg-white px-4 font-mono text-[10px] font-bold uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent"
          @click="openMediaLibrary"
        >
          <Images class="h-3.5 w-3.5" />
          Выбрать из медиатеки
        </button>
        <button
          v-if="modelValue"
          type="button"
          class="inline-flex h-11 items-center justify-center border border-mts-border bg-mts-bg px-4 text-xs text-mts-text-secondary transition-colors hover:border-mts-accent hover:text-mts-accent"
          @click="clear"
        >
          Очистить
        </button>
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      :accept="mediaMode === 'video' ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov' : 'image/jpeg,image/png,image/webp'"
      class="sr-only"
      tabindex="-1"
      @change="onFileChange"
    />
    <div v-if="modelValue" class="mt-2 overflow-hidden rounded border border-mts-border bg-mts-bg">
      <video
        v-if="mediaMode === 'video' || VIDEO_EXT.test(modelValue)"
        :src="modelValue"
        muted
        playsinline
        controls
        class="max-h-48 w-full object-contain object-center bg-black"
      />
      <img v-else :src="modelValue" alt="" class="max-h-40 w-full object-cover object-center" loading="lazy" />
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mediaOpen"
          class="fixed inset-0 z-[245] flex items-stretch justify-center p-4 sm:items-center sm:p-6"
          role="presentation"
          @click="onBackdropClick"
        >
          <div class="absolute inset-0 bg-black/55" aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            class="relative z-10 flex max-h-[min(92vh,1000px)] w-full max-w-6xl flex-col overflow-hidden border border-mts-border bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
          >
            <header class="flex items-start justify-between gap-3 border-b border-mts-border px-6 py-4">
              <div class="min-w-0">
                <h2 class="font-display text-lg text-mts-text">Медиатека</h2>
                <p class="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
                  {{ pickerMediaItems.length }} файлов
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex h-9 items-center justify-center border border-mts-border bg-white px-3 font-mono text-[10px] uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:opacity-50"
                  :disabled="mediaLoading"
                  @click="loadMediaLibrary(true)"
                >
                  {{ mediaLoading ? 'Загрузка…' : 'Обновить' }}
                </button>
                <button
                  type="button"
                  aria-label="Закрыть"
                  class="inline-flex h-9 w-9 items-center justify-center text-mts-text-secondary transition-colors hover:text-mts-accent"
                  @click="closeMediaLibrary"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>
            </header>

            <div class="flex-1 overflow-y-auto px-6 py-5">
              <div v-if="mediaLoading" class="flex items-center justify-center py-16 text-mts-text-secondary">
                <Loader2 class="h-5 w-5 animate-spin" />
              </div>
              <div
                v-else-if="pickerMediaItems.length === 0"
                class="flex items-center justify-center rounded border border-dashed border-mts-border bg-mts-bg/40 px-3 py-12 font-body text-sm text-mts-text-secondary"
              >
                В медиатеке пока нет {{ mediaMode === 'video' ? 'видео' : 'изображений' }}.
              </div>
              <div
                v-else
                class="grid gap-3"
                style="grid-template-columns: repeat(auto-fill, minmax(190px, 1fr))"
              >
                <button
                  v-for="item in pickerMediaItems"
                  :key="item.url"
                  type="button"
                  class="group overflow-hidden border border-mts-border bg-white text-left transition-colors hover:border-mts-accent"
                  @click="selectFromLibrary(item.url)"
                >
                  <div class="aspect-[4/3] overflow-hidden bg-mts-bg">
                    <video
                      v-if="VIDEO_EXT.test(item.filename || item.url)"
                      :src="item.url"
                      muted
                      playsinline
                      class="h-full w-full object-cover"
                    />
                    <img
                      v-else
                      :src="item.url"
                      alt=""
                      class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div class="border-t border-mts-border p-2">
                    <p class="truncate font-body text-xs text-mts-text" :title="item.filename">{{ item.filename }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
