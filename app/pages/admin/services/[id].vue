<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { MarineContentLocale, SeoFields } from '~/types'
import SeoAdminFields from '~/components/admin/SeoAdminFields.vue'
import { serviceIconSelectOptions } from '~/utils/serviceIcons'
import { mergeServiceTranslations } from '~/utils/adminTranslationForms'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const idParam = computed(() => route.params.id as string)
const isNew = computed(() => idParam.value === 'new')

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())

const form = ref({
  iconKey: 'ship',
  sortOrder: 0,
  translations: mergeServiceTranslations(),
})

const featuresText = ref<Record<MarineContentLocale, string>>(
  Object.fromEntries(MARINE_CONTENT_LOCALES.map((loc) => [loc, ''])) as Record<
    MarineContentLocale,
    string
  >,
)

const loading = ref(!isNew.value)
const saving = ref(false)

const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const existingImageUrl = ref<string | null>(null)
const removeImage = ref(false)

watch(imageFile, (f) => {
  if (imagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imagePreview.value = f ? URL.createObjectURL(f) : null
})

onUnmounted(() => {
  if (imagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
})

function onPickImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  imageFile.value = file ?? null
  if (file) {
    removeImage.value = false
  }
}

function clearImagePick() {
  imageFile.value = null
}

const seoForTab = computed<SeoFields>({
  get() {
    const t = form.value.translations[localeTab.value]
    return {
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      seoKeywords: t.seoKeywords,
    }
  },
  set(v: SeoFields) {
    const t = form.value.translations[localeTab.value]
    t.seoTitle = v.seoTitle
    t.seoDescription = v.seoDescription
    t.seoKeywords = v.seoKeywords
  },
})

function syncFeaturesTextFromForm() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    featuresText.value[loc] = (form.value.translations[loc].features ?? []).join('\n')
  }
}

function applyFeaturesTextToTranslations() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    form.value.translations[loc].features = featuresText.value[loc]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  }
}

onMounted(async () => {
  if (isNew.value) {
    loading.value = false
    return
  }
  try {
    const item = await api.services.getById(Number(idParam.value))
    form.value = {
      iconKey: item.iconKey,
      sortOrder: item.sortOrder,
      translations: mergeServiceTranslations(item.translations),
    }
    existingImageUrl.value = item.imageUrl ?? null
    removeImage.value = false
    syncFeaturesTextFromForm()
  } catch {
    await navigateTo('/admin/services')
  } finally {
    loading.value = false
  }
})

function validate(): boolean {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const t = form.value.translations[loc]
    if (!t.title?.trim() || !t.description?.trim()) {
      return false
    }
    const lines = featuresText.value[loc]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      return false
    }
  }
  return true
}

async function submit() {
  applyFeaturesTextToTranslations()
  if (!validate()) {
    await showAdminAlert({
      message: 'Заполните название, описание и хотя бы один пункт списка на обоих языках.',
      variant: 'error',
    })
    return
  }
  saving.value = true
  try {
    const iconKey = form.value.iconKey
    const sortOrder = Number(form.value.sortOrder) || 0
    const translations = form.value.translations

    if (imageFile.value) {
      const fd = new FormData()
      fd.append('iconKey', iconKey)
      fd.append('sortOrder', String(sortOrder))
      fd.append('translations', JSON.stringify(translations))
      fd.append('image', imageFile.value)
      if (isNew.value) {
        await api.services.create(fd)
      } else {
        await api.services.update(Number(idParam.value), fd)
      }
    } else {
      const payload: {
        iconKey: string
        sortOrder: number
        translations: typeof translations
        removeImage?: boolean
      } = { iconKey, sortOrder, translations }
      if (!isNew.value && removeImage.value) {
        payload.removeImage = true
      }
      if (isNew.value) {
        await api.services.create(payload)
      } else {
        await api.services.update(Number(idParam.value), payload)
      }
    }
    adminToast.success(isNew.value ? 'Карточка создана' : 'Карточка сохранена')
    await navigateTo('/admin/services')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить карточку', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-4xl mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin/services" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">
              {{ isNew ? 'Новая карточка сервиса' : 'Редактирование карточки' }}
            </h1>
          </div>
        </div>
      </div>
    </header>

    <AdminServicesSectionNav active="cards" />

    <main class="max-w-4xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <form v-else class="bg-white border border-mts-border shadow-tech p-8 relative" @submit.prevent="submit">
        <CommonAccentCorners />

        <div class="space-y-8">
          <section class="space-y-6">
            <h2 class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">Общие поля</h2>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
                  >Иконка *</label
                >
                <AdminSelect v-model="form.iconKey" :options="serviceIconSelectOptions" />
              </div>
              <div>
                <label
                  for="service-sort-order"
                  class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Порядок сортировки</label
                >
                <AdminInputNumberStepper
                  id="service-sort-order"
                  v-model="form.sortOrder"
                  variant="full"
                  decrement-label="Уменьшить порядок сортировки"
                  increment-label="Увеличить порядок сортировки"
                />
              </div>
            </div>
            <div class="md:col-span-2 space-y-3">
              <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Изображение для карточки</label
              >
              <p class="font-body text-xs text-mts-text-secondary">
                Используется в каталоге и на главной (если карточка выбрана в блоке). Форматы: JPG, PNG, WebP, до 20 МБ.
              </p>
              <div v-if="(imagePreview || existingImageUrl) && !removeImage" class="relative max-w-md overflow-hidden border border-mts-border bg-mts-bg">
                <img
                  :src="(imagePreview || existingImageUrl) ?? ''"
                  alt=""
                  class="h-44 w-full object-cover"
                />
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <label
                  class="cursor-pointer rounded border border-mts-border bg-mts-bg px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-mts-text hover:border-mts-accent"
                >
                  Выбрать файл
                  <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onPickImage" />
                </label>
                <button
                  v-if="imageFile"
                  type="button"
                  class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary hover:text-mts-accent"
                  @click="clearImagePick"
                >
                  Отменить выбор
                </button>
                <label
                  v-if="!isNew && existingImageUrl && !imageFile"
                  class="flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >
                  <input v-model="removeImage" type="checkbox" class="rounded border-mts-border" />
                  Удалить текущее изображение
                </label>
              </div>
            </div>
          </section>

          <section class="space-y-6 border-t border-mts-border pt-8">
            <AdminLocaleTabs v-model="localeTab" label="Тексты и SEO" />
            <div class="space-y-6">
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
                  >Название *</label
                >
                <AdminThemedTextField v-model="form.translations[localeTab].title" :multiline="false" />
              </div>
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
                  >Описание *</label
                >
                <AdminThemedTextField v-model="form.translations[localeTab].description" />
              </div>
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
                  >Пункты списка (каждый с новой строки) *</label
                >
                <textarea
                  v-model="featuresText[localeTab]"
                  rows="8"
                  placeholder="Пункт 1&#10;Пункт 2"
                  class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent font-mono text-xs"
                />
              </div>
              <div class="rounded-md border border-mts-border/80 bg-mts-bg/40 p-4">
                <p class="mb-3 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">SEO</p>
                <SeoAdminFields v-model="seoForTab" />
              </div>
            </div>
          </section>
        </div>

        <div class="pt-8">
          <button
            type="submit"
            :disabled="saving"
            class="px-8 py-3 bg-mts-accent text-white font-mono text-xs uppercase hover:bg-mts-accent-dark disabled:opacity-50"
          >
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
