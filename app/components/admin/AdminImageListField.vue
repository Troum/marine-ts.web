<script setup lang="ts">
import { ArrowDown, ArrowUp, ImagePlus, LayoutGrid, Loader2, Trash2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useConfirm } from '~/composables/useConfirmAction'

/**
 * Универсальный редактор списка картинок (URL-строки) для блоков `split` / `gallery`
 * и любых других мест, где раньше выводился вертикальный «портрет» из `<input>` + превью.
 *
 * Контракт:
 * - `modelValue` — массив URL (любые относительные `/storage/…` или абсолютные http(s)).
 * - Компонент сам поддерживает «инвариант минимум одного слота»: при удалении последнего
 *   элемента остаётся одна пустая строка (как раньше у inline-редактора в `AdminCustomSectionsEditor`).
 * - Загрузка файлов идёт через `useMarineApi().media.upload` (тот же эндпоинт, что и hero image).
 *
 * Внешний вид:
 * - Компактный режим — горизонтальная сетка превью с реордером/удалением и быстрым «добавить».
 * - Кнопка «Открыть управление» → модалка с расширенным редактором (URL-инпуты + upload).
 */
const props = withDefaults(
  defineProps<{
    modelValue: string[]
    /** Минимальное число «слотов»; защита от полного исчезновения формы добавления. */
    minItems?: number
    /** Подпись над компактным редактором. */
    label?: string
    /** Подсказка под подписью (опционально). */
    hint?: string
    /** Accept для загрузки файлов (по умолчанию JPEG/PNG/WebP). */
    accept?: string
    /** Подпись модалки (по умолчанию повторяет `label`). */
    dialogTitle?: string
  }>(),
  {
    minItems: 1,
    label: 'Изображения',
    hint: '',
    accept: 'image/jpeg,image/png,image/webp',
    dialogTitle: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const api = useMarineApi()
const adminToast = useAdminToast()
const { confirm } = useConfirm()

const items = computed<string[]>(() => props.modelValue ?? [])
const filledItems = computed(() => items.value.filter((u) => u && u.trim() !== ''))
const dialogOpen = ref(false)
const inlineUrl = ref('')
const dialogUrl = ref('')
const uploading = ref(false)
const dialogUploading = ref(false)
const inlineFileInput = ref<HTMLInputElement | null>(null)
const dialogFileInput = ref<HTMLInputElement | null>(null)

const dialogHeading = computed(() => props.dialogTitle?.trim() || props.label)

function commit(next: string[]) {
  if (next.length === 0 && props.minItems > 0) {
    next = Array.from({ length: props.minItems }, () => '')
  }
  emit('update:modelValue', next)
}

function setUrlAt(idx: number, value: string) {
  const next = [...items.value]
  next[idx] = value
  commit(next)
}

function appendUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }
  /*
   * Если есть пустые слоты (например, дефолтный единственный пустой URL),
   * сначала заполняем их — иначе пользователь увидит «лишнюю» пустую плитку.
   */
  const idx = items.value.findIndex((u) => !u.trim())
  if (idx !== -1) {
    setUrlAt(idx, trimmed)
  } else {
    commit([...items.value, trimmed])
  }
  return true
}

function moveImage(from: number, delta: -1 | 1) {
  const to = from + delta
  if (to < 0 || to >= items.value.length) {
    return
  }
  const next = [...items.value]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) {
    return
  }
  next.splice(to, 0, moved)
  commit(next)
}

async function removeAt(idx: number, ask = true) {
  const url = items.value[idx]?.trim()
  if (ask && url) {
    const ok = await confirm({
      message: 'Удалить это изображение из списка?',
      confirmLabel: 'Удалить',
      variant: 'danger',
    })
    if (!ok) {
      return
    }
  }
  const next = items.value.filter((_, i) => i !== idx)
  commit(next)
}

async function uploadFile(file: File, fromDialog: boolean) {
  if (fromDialog) {
    dialogUploading.value = true
  } else {
    uploading.value = true
  }
  try {
    const res = await api.media.upload(file)
    appendUrl(res.url)
    adminToast.success('Изображение загружено')
  } catch {
    adminToast.show({ title: 'Ошибка', message: 'Не удалось загрузить файл' })
  } finally {
    if (fromDialog) {
      dialogUploading.value = false
    } else {
      uploading.value = false
    }
  }
}

async function onInlineFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  await uploadFile(file, false)
}

async function onDialogFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  await uploadFile(file, true)
}

function submitInlineUrl() {
  if (appendUrl(inlineUrl.value)) {
    inlineUrl.value = ''
  }
}

function submitDialogUrl() {
  if (appendUrl(dialogUrl.value)) {
    dialogUrl.value = ''
  }
}

function openDialog() {
  dialogOpen.value = true
}

function closeDialog() {
  dialogOpen.value = false
  dialogUrl.value = ''
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    closeDialog()
  }
}

/* Блокировать прокрутку фона на время модалки, как делают другие админ-модалки. */
let savedBodyOverflow: string | null = null
watch(dialogOpen, (open) => {
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

defineExpose({ openDialog })
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="min-w-0">
        <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
          {{ label }}
          <span class="ml-1 normal-case tracking-normal text-mts-text-muted">
            ({{ filledItems.length }} шт.)
          </span>
        </label>
        <p v-if="hint" class="mt-1 font-body text-xs text-mts-text-secondary">{{ hint }}</p>
      </div>
      <button
        type="button"
        class="inline-flex h-9 items-center gap-1.5 border border-mts-border bg-white px-3 font-mono text-[11px] uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent"
        @click="openDialog"
      >
        <LayoutGrid class="h-3.5 w-3.5" />
        Открыть управление
      </button>
    </div>

    <div
      v-if="filledItems.length > 0"
      class="grid gap-2 rounded border border-mts-border bg-mts-bg/40 p-2"
      style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))"
    >
      <template v-for="(url, idx) in items" :key="`thumb-${idx}`">
        <div
          v-if="url && url.trim()"
          class="group relative aspect-[4/3] overflow-hidden border border-mts-border bg-white"
        >
          <img
            :src="url.trim()"
            alt=""
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <span
            class="absolute left-1 top-1 z-10 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-sm bg-black/60 px-1 font-mono text-[10px] font-semibold text-white"
          >
            {{ idx + 1 }}
          </span>
          <div
            class="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-1 bg-black/55 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
          >
            <div class="flex items-center gap-0.5">
              <button
                type="button"
                title="Сдвинуть выше"
                aria-label="Сдвинуть выше"
                class="inline-flex h-6 w-6 items-center justify-center rounded-sm text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="idx === 0"
                @click="moveImage(idx, -1)"
              >
                <ArrowUp class="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Сдвинуть ниже"
                aria-label="Сдвинуть ниже"
                class="inline-flex h-6 w-6 items-center justify-center rounded-sm text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="idx === items.length - 1"
                @click="moveImage(idx, 1)"
              >
                <ArrowDown class="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              title="Удалить"
              aria-label="Удалить"
              class="inline-flex h-6 w-6 items-center justify-center rounded-sm text-white transition-colors hover:bg-red-500/80"
              @click="removeAt(idx)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </template>
    </div>
    <div
      v-else
      class="flex items-center justify-center rounded border border-dashed border-mts-border bg-mts-bg/40 px-3 py-6 font-body text-xs text-mts-text-secondary"
    >
      Пока нет изображений. Добавьте URL или загрузите файл ниже.
    </div>

    <div class="flex flex-wrap items-stretch gap-2">
      <input
        v-model="inlineUrl"
        type="text"
        placeholder="https://… или /storage/…"
        class="min-w-[12rem] flex-1 border border-mts-border bg-mts-bg px-3 py-2 font-body text-sm focus:border-mts-accent focus:outline-none"
        @keydown.enter.prevent="submitInlineUrl"
      />
      <button
        type="button"
        class="inline-flex items-center gap-1.5 border border-mts-border bg-white px-3 font-mono text-[11px] uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent"
        :disabled="!inlineUrl.trim()"
        @click="submitInlineUrl"
      >
        <ImagePlus class="h-3.5 w-3.5" />
        Добавить URL
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 border border-transparent bg-mts-accent px-3 font-mono text-[11px] uppercase tracking-wide text-white transition-colors hover:bg-mts-accent-dark disabled:opacity-50"
        :disabled="uploading"
        @click="inlineFileInput?.click()"
      >
        <Loader2 v-if="uploading" class="h-3.5 w-3.5 animate-spin" />
        <ImagePlus v-else class="h-3.5 w-3.5" />
        {{ uploading ? 'Загрузка…' : 'Загрузить файл' }}
      </button>
      <input
        ref="inlineFileInput"
        type="file"
        :accept="accept"
        class="sr-only"
        tabindex="-1"
        @change="onInlineFileChange"
      />
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
          v-if="dialogOpen"
          class="fixed inset-0 z-[245] flex items-stretch justify-center p-4 sm:items-center sm:p-6"
          role="presentation"
          @click="onBackdropClick"
        >
          <div class="absolute inset-0 bg-black/55" aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-image-list-title"
            class="relative z-10 flex max-h-[min(92vh,1000px)] w-full max-w-5xl flex-col overflow-hidden border border-mts-border bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
          >
            <header class="flex items-start justify-between gap-3 border-b border-mts-border px-6 py-4">
              <div class="min-w-0">
                <h2 id="admin-image-list-title" class="font-display text-lg text-mts-text">
                  {{ dialogHeading }}
                </h2>
                <p class="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">
                  {{ filledItems.length }} изображений
                </p>
              </div>
              <button
                type="button"
                aria-label="Закрыть"
                class="inline-flex h-9 w-9 items-center justify-center text-mts-text-secondary transition-colors hover:text-mts-accent"
                @click="closeDialog"
              >
                <X class="h-5 w-5" />
              </button>
            </header>

            <div class="flex-1 overflow-y-auto px-6 py-5">
              <div
                v-if="items.length === 0"
                class="flex items-center justify-center rounded border border-dashed border-mts-border bg-mts-bg/40 px-3 py-12 font-body text-sm text-mts-text-secondary"
              >
                Список пуст. Добавьте изображения ниже.
              </div>
              <div
                v-else
                class="grid gap-4"
                style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))"
              >
                <div
                  v-for="(_url, idx) in items"
                  :key="`tile-${idx}`"
                  class="flex flex-col border border-mts-border bg-white"
                >
                  <div class="relative aspect-[4/3] overflow-hidden bg-mts-bg">
                    <img
                      v-if="items[idx]?.trim()"
                      :src="items[idx]?.trim()"
                      alt=""
                      class="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-mts-text-muted"
                    >
                      Нет URL
                    </div>
                    <span
                      class="absolute left-2 top-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-sm bg-black/60 px-1.5 font-mono text-[11px] font-semibold text-white"
                    >
                      {{ idx + 1 }}
                    </span>
                  </div>
                  <div class="space-y-2 border-t border-mts-border p-3">
                    <input
                      :value="items[idx]"
                      type="text"
                      placeholder="https://… или /storage/…"
                      class="w-full border border-mts-border bg-mts-bg px-2 py-1.5 font-body text-xs focus:border-mts-accent focus:outline-none"
                      @input="(e) => setUrlAt(idx, (e.target as HTMLInputElement).value)"
                    />
                    <div class="flex items-center justify-between gap-1">
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          title="Сдвинуть выше"
                          aria-label="Сдвинуть выше"
                          class="inline-flex h-7 w-7 items-center justify-center border border-mts-border bg-white text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:cursor-not-allowed disabled:opacity-40"
                          :disabled="idx === 0"
                          @click="moveImage(idx, -1)"
                        >
                          <ArrowUp class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Сдвинуть ниже"
                          aria-label="Сдвинуть ниже"
                          class="inline-flex h-7 w-7 items-center justify-center border border-mts-border bg-white text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:cursor-not-allowed disabled:opacity-40"
                          :disabled="idx === items.length - 1"
                          @click="moveImage(idx, 1)"
                        >
                          <ArrowDown class="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        class="inline-flex h-7 items-center gap-1 border border-mts-border bg-white px-2 font-mono text-[10px] uppercase tracking-wide text-red-700 transition-colors hover:border-red-500 hover:text-red-700"
                        @click="removeAt(idx)"
                      >
                        <Trash2 class="h-3 w-3" />
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer class="border-t border-mts-border bg-mts-bg/50 px-6 py-4">
              <div class="flex flex-wrap items-stretch gap-2">
                <input
                  v-model="dialogUrl"
                  type="text"
                  placeholder="https://… или /storage/…"
                  class="min-w-[14rem] flex-1 border border-mts-border bg-white px-3 py-2 font-body text-sm focus:border-mts-accent focus:outline-none"
                  @keydown.enter.prevent="submitDialogUrl"
                />
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 border border-mts-border bg-white px-3 font-mono text-[11px] uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent disabled:opacity-40"
                  :disabled="!dialogUrl.trim()"
                  @click="submitDialogUrl"
                >
                  <ImagePlus class="h-3.5 w-3.5" />
                  Добавить URL
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 border border-transparent bg-mts-accent px-3 font-mono text-[11px] uppercase tracking-wide text-white transition-colors hover:bg-mts-accent-dark disabled:opacity-50"
                  :disabled="dialogUploading"
                  @click="dialogFileInput?.click()"
                >
                  <Loader2 v-if="dialogUploading" class="h-3.5 w-3.5 animate-spin" />
                  <ImagePlus v-else class="h-3.5 w-3.5" />
                  {{ dialogUploading ? 'Загрузка…' : 'Загрузить файл' }}
                </button>
                <input
                  ref="dialogFileInput"
                  type="file"
                  :accept="accept"
                  class="sr-only"
                  tabindex="-1"
                  @change="onDialogFileChange"
                />
                <button
                  type="button"
                  class="ml-auto inline-flex items-center gap-1.5 border border-transparent bg-mts-text px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-white transition-colors hover:bg-mts-text-secondary"
                  @click="closeDialog"
                >
                  Готово
                </button>
              </div>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
