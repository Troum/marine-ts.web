<script setup lang="ts">
import { ArrowLeft, Loader2, Trash2, Images, Save } from 'lucide-vue-next'
import type { GalleryItem, MarineContentLocale } from '~/types'
import AdminInputNumberStepper from '~/components/admin/AdminInputNumberStepper.vue'
import { galleryAltTranslations } from '~/utils/adminTranslationForms'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { canManageGallery } = useAdminPermissions()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())

const items = ref<GalleryItem[]>([])
const draft = ref<
  Record<
    number,
    {
      sortOrder: number
      translations: Record<MarineContentLocale, { alt: string }>
    }
  >
>({})
const pending = ref(true)
const savingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const replacingId = ref<number | null>(null)
const adding = ref(false)

const newFile = ref<File | null>(null)
const newAlts = ref(galleryAltTranslations(undefined, ''))
const newFileInput = ref<HTMLInputElement | null>(null)

function syncDraftsFromItems() {
  const next: typeof draft.value = { ...draft.value }
  for (const it of items.value) {
    next[it.id] = {
      sortOrder: it.sortOrder,
      translations: galleryAltTranslations(it.translations, it.alt),
    }
  }
  draft.value = next
}

async function load() {
  pending.value = true
  try {
    items.value = await api.gallery.getManageAll()
    syncDraftsFromItems()
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить галерею', variant: 'error' })
  } finally {
    pending.value = false
  }
}

onMounted(load)

async function saveRow(id: number) {
  const dr = draft.value[id]
  if (!dr) {
    return
  }
  savingId.value = id
  try {
    const updated = await api.gallery.update(id, {
      sortOrder: dr.sortOrder,
      translations: dr.translations,
    })
    const idx = items.value.findIndex((x) => x.id === id)
    if (idx !== -1) {
      items.value[idx] = updated
    }
    draft.value = {
      ...draft.value,
      [id]: {
        sortOrder: updated.sortOrder,
        translations: galleryAltTranslations(updated.translations, updated.alt),
      },
    }
    adminToast.success('Сохранено')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally {
    savingId.value = null
  }
}

async function remove(id: number) {
  const ok = await confirm({
    title: 'Удаление фото',
    message: 'Удалить это изображение из галереи? Файл на сервере будет удалён (кроме встроенных путей сайта).',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  deletingId.value = id
  try {
    await api.gallery.delete(id)
    adminToast.success('Удалено')
    items.value = items.value.filter((x) => x.id !== id)
    const rest = { ...draft.value }
    delete rest[id]
    draft.value = rest
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить', variant: 'error' })
  } finally {
    deletingId.value = null
  }
}

function onPickReplace(id: number, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  void replaceImage(id, file)
}

async function replaceImage(id: number, file: File) {
  replacingId.value = id
  try {
    const fd = new FormData()
    fd.append('image', file)
    const updated = await api.gallery.replaceImage(id, fd)
    const idx = items.value.findIndex((x) => x.id === id)
    if (idx !== -1) {
      items.value[idx] = updated
    }
    draft.value = {
      ...draft.value,
      [id]: {
        sortOrder: updated.sortOrder,
        translations: galleryAltTranslations(updated.translations, updated.alt),
      },
    }
    adminToast.success('Файл заменён')
  } catch {
    await showAdminAlert({ message: 'Не удалось заменить файл', variant: 'error' })
  } finally {
    replacingId.value = null
  }
}

function onNewFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  newFile.value = file ?? null
}

async function addImage() {
  if (!newFile.value) {
    await showAdminAlert({ message: 'Выберите файл изображения', variant: 'error' })
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    if (!newAlts.value[loc].alt?.trim()) {
      await showAdminAlert({
        message: 'Укажите подпись (alt) на русском и английском.',
        variant: 'error',
      })
      return
    }
  }
  adding.value = true
  try {
    const fd = new FormData()
    fd.append('image', newFile.value)
    for (const loc of MARINE_CONTENT_LOCALES) {
      fd.append(`translations[${loc}][alt]`, newAlts.value[loc].alt.trim())
    }
    const created = await api.gallery.create(fd)
    items.value = [...items.value, created].sort((a, b) => a.sortOrder - b.sortOrder)
    draft.value = {
      ...draft.value,
      [created.id]: {
        sortOrder: created.sortOrder,
        translations: galleryAltTranslations(created.translations, created.alt),
      },
    }
    newFile.value = null
    newAlts.value = galleryAltTranslations(undefined, '')
    if (newFileInput.value) {
      newFileInput.value.value = ''
    }
    adminToast.success('Изображение добавлено')
  } catch {
    await showAdminAlert({ message: 'Не удалось добавить изображение', variant: 'error' })
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div class="flex h-16 flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
              <ArrowLeft class="h-5 w-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Галерея сайта</h1>
          </div>
          <NuxtLink
            to="/gallery"
            target="_blank"
            class="font-mono text-[11px] uppercase text-mts-text-secondary hover:text-mts-accent"
          >
            Открыть на сайте
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <p v-if="!canManageGallery" class="font-body text-mts-text-secondary">
        Недостаточно прав для управления галереей (нужно право «manage gallery»). Обратитесь к администратору.
      </p>

      <template v-else>
        <section class="mb-10 border border-mts-border bg-white p-6">
          <h2 class="font-display text-lg text-mts-text mb-4">Добавить фото</h2>
          <p class="font-body text-sm text-mts-text-secondary mb-4">
            Форматы изображений, до 20 МБ. Порядок по умолчанию — в конец списка; его можно изменить ниже.
          </p>
          <AdminLocaleTabs v-model="localeTab" label="Подпись для языка" class="mb-6" />
          <div class="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div class="min-w-0 flex-1 lg:max-w-xs">
              <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">
                Файл
              </label>
              <input
                ref="newFileInput"
                type="file"
                accept="image/*"
                class="block w-full font-body text-sm text-mts-text file:mr-3 file:border file:border-mts-border file:bg-mts-bg file:px-3 file:py-2 file:font-mono file:text-[11px] file:uppercase"
                @change="onNewFile"
              />
            </div>
            <div class="min-w-0 flex-[2] lg:max-w-lg">
              <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">
                Подпись (alt) — {{ localeTab.toUpperCase() }}
              </label>
              <input
                v-model="newAlts[localeTab].alt"
                type="text"
                maxlength="500"
                class="w-full border border-mts-border bg-mts-bg px-3 py-2 font-body text-sm text-mts-text"
                placeholder="Краткое описание для доступности"
              />
              <p class="mt-1 font-body text-xs text-mts-text-secondary">
                Переключите язык выше и заполните оба варианта перед загрузкой.
              </p>
            </div>
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center border border-mts-border bg-mts-accent px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white transition-colors hover:bg-mts-accent-dark disabled:opacity-50"
              :disabled="adding"
              @click="addImage"
            >
              {{ adding ? 'Загрузка…' : 'Загрузить' }}
            </button>
          </div>
        </section>

        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
        </div>

        <div v-else-if="items.length === 0" class="border border-dashed border-mts-border bg-white p-12 text-center">
          <Images class="mx-auto mb-4 h-10 w-10 text-mts-text-secondary opacity-40" />
          <p class="font-body text-mts-text-secondary">Пока нет изображений. Добавьте файлы выше.</p>
        </div>

        <div v-else class="space-y-6">
          <AdminLocaleTabs v-model="localeTab" label="Редактирование подписей" />
          <ul class="space-y-8">
            <li
              v-for="item in items"
              :key="item.id"
              class="border border-mts-border bg-white p-6 grid gap-6 lg:grid-cols-[200px_1fr_auto] lg:items-start"
            >
              <div class="relative aspect-4/3 w-full max-w-50 overflow-hidden border border-mts-border bg-mts-bg">
                <img :src="item.src" :alt="item.alt" class="h-full w-full object-cover" />
                <div
                  v-if="replacingId === item.id"
                  class="absolute inset-0 flex items-center justify-center bg-mts-text/40"
                >
                  <Loader2 class="h-8 w-8 animate-spin text-white" />
                </div>
              </div>

              <div class="min-w-0 space-y-4">
                <div>
                  <label
                    :for="`gal-alt-${item.id}`"
                    class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >
                    Подпись (alt) — {{ localeTab.toUpperCase() }}
                  </label>
                  <input
                    :id="`gal-alt-${item.id}`"
                    v-model="draft[item.id].translations[localeTab].alt"
                    type="text"
                    maxlength="500"
                    class="w-full border border-mts-border bg-mts-bg px-3 py-2 font-body text-sm text-mts-text"
                  />
                </div>
                <div class="flex flex-wrap items-end gap-4">
                  <div>
                    <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                      Порядок
                    </label>
                    <AdminInputNumberStepper v-model="draft[item.id].sortOrder" :min="0" :max="999999" />
                  </div>
                  <label
                    class="inline-flex cursor-pointer items-center gap-2 border border-mts-border bg-mts-bg px-3 py-2 font-mono text-[10px] uppercase text-mts-text-secondary hover:border-mts-accent hover:text-mts-accent"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      class="sr-only"
                      :disabled="replacingId === item.id"
                      @change="onPickReplace(item.id, $event)"
                    />
                    Заменить файл
                  </label>
                </div>
              </div>

              <div class="flex flex-col gap-2 lg:items-end">
                <button
                  type="button"
                  class="border border-mts-border px-4 py-2 font-mono text-[11px] uppercase text-mts-text hover:border-mts-accent hover:text-mts-accent disabled:opacity-50"
                  :disabled="savingId === item.id"
                  @click="saveRow(item.id)"
                >
                  <Save class="h-4 w-4" />
                  {{ savingId === item.id ? 'Сохранение…' : 'Сохранить' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 border border-mts-border px-4 py-2 font-mono text-[11px] uppercase text-red-700 hover:bg-red-50 disabled:opacity-50"
                  :disabled="deletingId === item.id"
                  @click="remove(item.id)"
                >
                  <Trash2 class="h-4 w-4" />
                  {{ deletingId === item.id ? '…' : 'Удалить' }}
                </button>
              </div>
            </li>
          </ul>
        </div>
      </template>
    </main>
  </div>
</template>
