<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { isRichTextEmpty, normalizeBodyForEditor } from '~/composables/useMarkdownSafeHtml'
import type { ContentPageContentableType, MarineContentLocale, SeoFields } from '~/types'
import AdminPlusLink from '~/components/admin/AdminPlusLink.vue'
import SeoAdminFields from '~/components/admin/SeoAdminFields.vue'
import { mergeContentPageTranslations } from '~/utils/adminTranslationForms'
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
  slug: '',
  isPublished: true,
  sortOrder: 0,
  showInquiryForm: false,
  translations: mergeContentPageTranslations(),
})

/** Привязка к карточке сервиса или проекта (полиморфная связь в API). */
const linkKind = ref<string>('none')
const linkId = ref<number | null>(null)

const linkKindOptions = [
  { value: 'none', label: 'Без привязки' },
  { value: 'service', label: 'Карточка сервиса' },
  { value: 'project', label: 'Карточка проекта' },
]

watch(linkKind, (k) => {
  if (k === 'none') {
    linkId.value = null
  } else if (linkId.value == null) {
    linkId.value = 1
  }
})

const sortOrderModel = computed({
  get: () => form.value.sortOrder ?? 0,
  set: (v: number) => {
    form.value.sortOrder = v
  },
})

const linkIdStepper = computed({
  get: () => linkId.value ?? 1,
  set: (v: number) => {
    linkId.value = v
  },
})

const publicSlugPreview = computed(() => form.value.slug?.trim() || '…')

const publicPathHint = computed(() => {
  if (linkKind.value === 'project') {
    return `/projects/${publicSlugPreview.value}`
  }
  if (linkKind.value === 'service') {
    return `/services/${publicSlugPreview.value}`
  }
  return `/services/${publicSlugPreview.value} или /projects/${publicSlugPreview.value} (после привязки к карточке)`
})

const loading = ref(!isNew.value)
const saving = ref(false)

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

function normalizeAllBodies() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    form.value.translations[loc].body = normalizeBodyForEditor(form.value.translations[loc].body)
  }
}

onMounted(async () => {
  if (isNew.value) {
    const ct = route.query.contentableType
    const cid = route.query.contentableId
    if ((ct === 'service' || ct === 'project') && cid != null && cid !== '') {
      linkKind.value = ct
      const n = Number(cid)
      if (Number.isFinite(n) && n > 0) {
        linkId.value = n
      }
    }
    loading.value = false
    return
  }
  try {
    const item = await api.contentPages.getManageById(Number(idParam.value))
    form.value = {
      slug: item.slug,
      isPublished: item.isPublished,
      sortOrder: item.sortOrder ?? 0,
      showInquiryForm: item.showInquiryForm ?? false,
      translations: mergeContentPageTranslations(item.translations),
    }
    normalizeAllBodies()
    if (item.contentableType && item.contentableId != null) {
      linkKind.value = item.contentableType
      linkId.value = item.contentableId
    } else {
      linkKind.value = 'none'
      linkId.value = null
    }
  } catch {
    await navigateTo('/admin/content-pages')
  } finally {
    loading.value = false
  }
})

function validate(): boolean {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const t = form.value.translations[loc]
    if (!t.title?.trim()) {
      return false
    }
    if (isRichTextEmpty(t.body ?? '')) {
      return false
    }
  }
  return true
}

async function submit() {
  if (!validate()) {
    await showAdminAlert({
      message: 'Укажите заголовок и текст страницы на русском и английском.',
      variant: 'error',
    })
    return
  }
  saving.value = true
  try {
    const base = {
      slug: form.value.slug?.trim() ?? '',
      isPublished: form.value.isPublished ?? true,
      sortOrder: Number(form.value.sortOrder ?? 0),
      showInquiryForm: form.value.showInquiryForm ?? false,
      translations: form.value.translations,
    }

    if (isNew.value) {
      if (linkKind.value !== 'none') {
        if (linkId.value == null || linkId.value < 1) {
          await showAdminAlert({ message: 'Укажите числовой id карточки для привязки', variant: 'error' })
          saving.value = false
          return
        }
        await api.contentPages.create({
          ...base,
          contentableType: linkKind.value as ContentPageContentableType,
          contentableId: linkId.value,
        })
      } else {
        await api.contentPages.create(base)
      }
    } else {
      if (linkKind.value !== 'none' && (linkId.value == null || linkId.value < 1)) {
        await showAdminAlert({ message: 'Укажите числовой id карточки для привязки', variant: 'error' })
        saving.value = false
        return
      }
      if (linkKind.value === 'none') {
        await api.contentPages.update(Number(idParam.value), {
          ...base,
          contentableType: null,
          contentableId: null,
        })
      } else {
        await api.contentPages.update(Number(idParam.value), {
          ...base,
          contentableType: linkKind.value as ContentPageContentableType,
          contentableId: linkId.value!,
        })
      }
    }
    adminToast.success(isNew.value ? 'Страница создана' : 'Страница сохранена')
    await navigateTo('/admin/content-pages')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить страницу', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex flex-wrap items-center justify-between gap-3 h-auto min-h-16 py-2">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin/content-pages" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">
              {{ isNew ? 'Новая страница' : 'Редактирование страницы' }}
            </h1>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <AdminPlusLink to="/admin/services/new" variant="outline">Карточка</AdminPlusLink>
            <AdminPlusLink to="/admin/content-pages/new">Страница</AdminPlusLink>
          </div>
        </div>
      </div>
    </header>

    <AdminServicesSectionNav active="pages" />

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <form
        v-else
        id="content-page-form"
        class="bg-white border border-mts-border shadow-tech p-8 relative"
        @submit.prevent="submit"
      >
        <CommonAccentCorners />

        <div class="space-y-8">
          <section class="space-y-6">
            <h2 class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">Общие поля</h2>
            <div>
              <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Slug (URL) *</label>
              <input
                v-model="form.slug"
                required
                type="text"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="например, hull-repair"
                class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-mono text-sm focus:outline-none focus:border-mts-accent"
              />
              <p class="mt-1 font-body text-xs text-mts-text-secondary">
                Латиница, цифры и дефисы. Публичный адрес: <span class="font-mono">{{ publicPathHint }}</span>
              </p>
            </div>
            <div class="rounded border border-mts-border bg-mts-bg/50 p-4">
              <p class="mb-3 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Связь с карточкой каталога</p>
              <p class="mb-4 font-body text-xs text-mts-text-secondary">
                Одна текстовая страница может быть привязана к одной карточке сервиса или одному проекту: на сайте карточка получит ссылку на эту страницу. Id смотрите в списке
                <NuxtLink to="/admin/services" class="text-mts-accent hover:underline">сервисов</NuxtLink>
                или
                <NuxtLink to="/admin/projects" class="text-mts-accent hover:underline">проектов</NuxtLink>.
              </p>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Тип карточки</label>
                  <AdminSelect v-model="linkKind" :options="linkKindOptions" />
                </div>
                <div v-if="linkKind !== 'none'" class="space-y-2">
                  <label
                    for="content-page-link-id"
                    class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                    >Id карточки</label
                  >
                  <AdminInputNumberStepper
                    id="content-page-link-id"
                    v-model="linkIdStepper"
                    variant="full"
                    :min="1"
                    decrement-label="Уменьшить id карточки"
                    increment-label="Увеличить id карточки"
                  />
                </div>
              </div>
            </div>
            <div class="grid gap-4 md:grid-cols-[minmax(0,12rem)_1fr] md:items-center md:gap-x-8">
              <div class="space-y-2">
                <label
                  for="content-page-sort-order"
                  class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Порядок сортировки</label
                >
                <AdminInputNumberStepper
                  id="content-page-sort-order"
                  v-model="sortOrderModel"
                  variant="full"
                  :min="0"
                  decrement-label="Уменьшить порядок сортировки"
                  increment-label="Увеличить порядок сортировки"
                />
              </div>
              <label
                class="flex cursor-pointer select-none items-center gap-2.5 font-body text-sm text-mts-text md:justify-start"
              >
                <input v-model="form.isPublished" type="checkbox" class="mts-checkbox" />
                <span>Опубликовано на сайте</span>
              </label>
            </div>
            <label class="flex cursor-pointer select-none items-center gap-2.5 font-body text-sm text-mts-text">
              <input v-model="form.showInquiryForm" type="checkbox" class="mts-checkbox" />
              <span>Показать форму заявки внизу этой страницы на сайте</span>
            </label>
          </section>

          <section class="space-y-6 border-t border-mts-border pt-8">
            <AdminLocaleTabs v-model="localeTab" label="Контент и SEO" />
            <div class="space-y-6">
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Заголовок *</label>
                <AdminThemedTextField v-model="form.translations[localeTab].title" :multiline="false" />
              </div>
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Краткое описание</label>
                <AdminThemedTextField v-model="form.translations[localeTab].excerpt" />
              </div>
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
                  >Текст страницы *</label
                >
                <p class="mb-2 font-body text-xs text-mts-text-secondary">
                  Визуальный редактор; на сайте сохраняется HTML. Старые страницы в Markdown при открытии преобразуются для
                  редактирования.
                </p>
                <AdminRichTextEditor
                  :model-value="form.translations[localeTab].body"
                  :disabled="saving"
                  @update:model-value="form.translations[localeTab].body = $event"
                />
              </div>
              <div class="rounded-md border border-mts-border/80 bg-mts-bg/40 p-4">
                <p class="mb-3 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">SEO</p>
                <SeoAdminFields v-model="seoForTab" />
              </div>
            </div>
          </section>
        </div>

        <div class="mt-12 flex flex-wrap items-center justify-end gap-3">
          <button type="submit" :disabled="saving" class="btn-primary px-8 disabled:opacity-50">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
