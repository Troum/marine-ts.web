<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { isRichTextEmpty, normalizeBodyForEditor } from '~/composables/useMarkdownSafeHtml'
import type {
  ContentPage,
  ContentPageContentableType,
  CustomPageSection,
  MarineContentLocale,
  SeoFields,
} from '~/types'
import {
  buildContentPageBodyForSave,
  contentPageSectionsAreRenderable,
  parseContentPageBody,
} from '~/utils/contentPageBody'
import {
  customPageSectionsHaveEditorContent,
  normalizeCustomPageSections,
} from '~/utils/customPageSections'
import AdminPlusLink from '~/components/admin/AdminPlusLink.vue'
import SeoAdminFields from '~/components/admin/SeoAdminFields.vue'
import { mergeContentPageTranslations } from '~/utils/adminTranslationForms'
import { plainMetaString } from '~/utils/adminThemedTextCodec'
import { contentPageSlugToPublicPath } from '~/utils/contentPageNavPath'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'

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
  showPublicTitle: true,
  hideFooter: false,
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

/** Hero и прочие блоки (как на листингах / «О компании») — сериализуются в `body` вместе с HTML статьи. */
const customSectionsByLocale = ref<Record<MarineContentLocale, CustomPageSection[]>>({
  ru: [],
  en: [],
})

const contentPagesCatalog = ref<ContentPage[]>([])

function collectCardDetailTargetsFromSections(sections: CustomPageSection[]): string[] {
  const out: string[] = []
  for (const sec of sections) {
    for (const b of sec.blocks) {
      if (b.type === 'cards') {
        for (const it of b.items) {
          const v = it.detailSlug?.trim()
          if (v) {
            out.push(v)
          }
        }
      }
    }
  }
  return out
}

const cardDetailLinkOptions = computed<AdminSelectOption[]>(() => {
  const opts: AdminSelectOption[] = [{ value: '', label: 'Без отдельной страницы' }]
  const seen = new Set<string>([''])
  const pages = contentPagesCatalog.value
  const sorted = [...pages].sort((a, b) =>
    (plainMetaString(a.title) || a.slug).localeCompare(plainMetaString(b.title) || b.slug, 'ru'),
  )
  for (const p of sorted) {
    const path = contentPageSlugToPublicPath(p.slug, p.contentableType)
    if (seen.has(path)) {
      continue
    }
    seen.add(path)
    const title = plainMetaString(p.title) || p.slug
    opts.push({ value: path, label: `${title} — ${path}` })
  }
  const fromEditor = new Set<string>([
    ...collectCardDetailTargetsFromSections(customSectionsByLocale.value.ru),
    ...collectCardDetailTargetsFromSections(customSectionsByLocale.value.en),
  ])
  for (const v of fromEditor) {
    if (!seen.has(v)) {
      seen.add(v)
      opts.push({ value: v, label: `${v} — нет в списке, проверьте путь` })
    }
  }
  return opts
})

async function loadContentPagesCatalogForCards() {
  try {
    const { data } = await api.contentPages.getManageAll({
      sort: 'title',
      order: 'asc',
      per_page: 500,
      published: '1',
    })
    contentPagesCatalog.value = data
  } catch {
    contentPagesCatalog.value = []
  }
}

const publicSlugPreview = computed(() => form.value.slug?.trim() || '…')

const publicPathHint = computed(() => {
  if (linkKind.value === 'project') {
    return `/projects/${publicSlugPreview.value}`
  }
  if (linkKind.value === 'service') {
    return `/${publicSlugPreview.value}`
  }
  return `/${publicSlugPreview.value}` + ' (или /projects/… для страницы проекта после привязки)'
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
      seoImage: t.seoImage,
    }
  },
  set(v: SeoFields) {
    const t = form.value.translations[localeTab.value]
    t.seoTitle = v.seoTitle
    t.seoDescription = v.seoDescription
    t.seoKeywords = v.seoKeywords
    t.seoImage = v.seoImage
  },
})

/**
 * Вторичная локаль часто хранит только HTML статьи без JSON `{ customSections, articleHtml }`.
 * Тогда при сохранении `buildContentPageBodyForSave([], …)` перестаёт сериализовать блоки для en
 * — на сайте в этой локали пропадают hero, split/карусель и т.д. Копируем структуру с основной
 * локали; тексты в блоках при необходимости правьте на вкладке перевода.
 */
function syncSecondaryLocalesCustomSectionsFromPrimary() {
  const primary = defaultMarineLocale()
  const primarySections = customSectionsByLocale.value[primary]
  if (!customPageSectionsHaveEditorContent(primarySections)) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    if (loc === primary) {
      continue
    }
    if (customPageSectionsHaveEditorContent(customSectionsByLocale.value[loc])) {
      continue
    }
    try {
      const cloned = JSON.parse(JSON.stringify(primarySections)) as unknown
      customSectionsByLocale.value[loc] = normalizeCustomPageSections(cloned)
    } catch {
      /* оставляем пусто */
    }
  }
}

function applyParsedBodiesToForm() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const parsed = parseContentPageBody(form.value.translations[loc].body)
    customSectionsByLocale.value[loc] = parsed.customSections ?? []
    form.value.translations[loc].body = normalizeBodyForEditor(parsed.articleHtml)
  }
  syncSecondaryLocalesCustomSectionsFromPrimary()
}

/** Заголовок/лид в форме хранятся как TFT или HTML — для валидации нужен плоский текст. */
function translationPlainTitle(t: { title: string }): string {
  return plainMetaString(t.title).trim()
}

function translationPlainExcerpt(t: { excerpt: string }): string {
  return plainMetaString(t.excerpt).trim()
}

/**
 * Перед сохранением: вторичные локали без авторского текста (title/excerpt/body/seo) получают
 * свежую копию `customSections` с primary. Иначе автокопия с onMount «устаревает» после правок ru.
 */
function syncEmptySecondaryLocalesSectionsFromPrimary() {
  const primary = defaultMarineLocale()
  const primarySections = customSectionsByLocale.value[primary]
  for (const loc of MARINE_CONTENT_LOCALES) {
    if (loc === primary) {
      continue
    }
    if (!localeIsEffectivelyEmpty(loc)) {
      continue
    }
    try {
      const cloned = JSON.parse(JSON.stringify(primarySections)) as unknown
      customSectionsByLocale.value[loc] = normalizeCustomPageSections(cloned)
    } catch {
      /* оставляем как есть */
    }
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
    await loadContentPagesCatalogForCards()
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
      showPublicTitle: item.showPublicTitle !== false,
      hideFooter: item.hideFooter ?? false,
      translations: mergeContentPageTranslations(item.translations),
    }
    applyParsedBodiesToForm()
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
    await loadContentPagesCatalogForCards()
    loading.value = false
  }
})

/**
 * Локаль не заполнялась — можно сохранять только ru (или только primary).
 *
 * Блоки (`customSections`) в проверке умышленно не учитываем: вторичные локали при загрузке/сохранении
 * получают автокопию блоков с primary через `syncSecondaryLocalesCustomSectionsFromPrimary`. Если
 * пользователь редактирует ru (например, привязывает страницу к карточке в секции), автокопия в en
 * до повторной синхронизации становится «устаревшей», и проверка по структурному совпадению ложно
 * считала en заполненной — валидация требовала en-заголовок без причины.
 */
function localeIsEffectivelyEmpty(loc: MarineContentLocale): boolean {
  const t = form.value.translations[loc]
  if (translationPlainTitle(t)) {
    return false
  }
  if (translationPlainExcerpt(t)) {
    return false
  }
  if (!isRichTextEmpty(t.body ?? '')) {
    return false
  }
  if (t.seoTitle?.trim() || t.seoDescription?.trim() || t.seoKeywords?.trim() || t.seoImage?.trim()) {
    return false
  }
  return true
}

/** Заголовок + хотя бы статья или публично видимые блоки. */
function localeContentComplete(loc: MarineContentLocale): boolean {
  const t = form.value.translations[loc]
  if (!translationPlainTitle(t)) {
    return false
  }
  const hasBlocks = contentPageSectionsAreRenderable(customSectionsByLocale.value[loc])
  const hasArticle = !isRichTextEmpty(t.body ?? '')
  if (!hasBlocks && !hasArticle) {
    return false
  }
  return true
}

function validate(): { ok: true } | { ok: false; reason: 'primary' | 'secondary'; locale: MarineContentLocale } {
  const primary = defaultMarineLocale()
  if (!localeContentComplete(primary)) {
    return { ok: false, reason: 'primary', locale: primary }
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    if (loc === primary) {
      continue
    }
    if (localeIsEffectivelyEmpty(loc)) {
      continue
    }
    if (!localeContentComplete(loc)) {
      return { ok: false, reason: 'secondary', locale: loc }
    }
  }
  return { ok: true }
}

async function submit() {
  syncEmptySecondaryLocalesSectionsFromPrimary()
  const validation = validate()
  if (!validation.ok) {
    const secondaryHint =
      validation.reason === 'secondary'
        ? ` Допишите версию «${validation.locale === 'en' ? 'English' : validation.locale}» (заголовок и текст страницы или блоки), либо очистите для этой локали все поля и SEO.`
        : ''
    await showAdminAlert({
      message:
        'Для русской версии укажите заголовок (осмысленный текст, не только оформление) и хотя бы одно из: текст страницы в редакторе или видимые блоки в «Hero и блоки» (секция с контентом/bаннер с изображением).' +
        secondaryHint +
        ' Английскую можно не трогать — если автоматически подставились блоки с ru, сохранение не требует en-заголовка.',
      variant: 'error',
    })
    return
  }
  saving.value = true
  try {
    const translations = {} as typeof form.value.translations
    for (const loc of MARINE_CONTENT_LOCALES) {
      const t = form.value.translations[loc]
      translations[loc] = {
        ...t,
        body: buildContentPageBodyForSave(customSectionsByLocale.value[loc], t.body),
      }
    }
    const base = {
      slug: form.value.slug?.trim() ?? '',
      isPublished: form.value.isPublished ?? true,
      sortOrder: Number(form.value.sortOrder ?? 0),
      showInquiryForm: form.value.showInquiryForm ?? false,
      showPublicTitle: form.value.showPublicTitle !== false,
      hideFooter: form.value.hideFooter ?? false,
      translations,
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
      <div class="max-w-[1600px] mx-auto px-6 lg:px-12">
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

    <main class="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
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
                Одна текстовая страница может быть привязана к одной карточке сервиса или одному проекту: на сайте карточка получит ссылку на эту страницу. Привязка не обязательна — выберите
                <span class="font-medium text-mts-text">«Без привязки»</span>
                , если страницу нужно создать отдельно; связать с карточкой можно позже при редактировании. Чтобы форма открывалась сразу без предзаполнения, нажимайте
                «Страница» в шапке списка, а не «+ страница» в строке карточки. Id смотрите в списке
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
            <label class="flex cursor-pointer select-none items-center gap-2.5 font-body text-sm text-mts-text">
              <input v-model="form.showPublicTitle" type="checkbox" class="mts-checkbox" />
              <span
                >Показывать заголовок (h1) в тексте страницы под баннером. Выключите, если заголовок уже в hero —
                поле «Заголовок» остаётся для крошек, вкладки и SEO.</span
              >
            </label>
            <label class="flex cursor-pointer select-none items-center gap-2.5 font-body text-sm text-mts-text">
              <input v-model="form.hideFooter" type="checkbox" class="mts-checkbox" />
              <span>Скрыть подвал на этой странице</span>
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
              <div class="rounded border border-mts-border-light bg-mts-bg/50 p-4">
                <p class="mb-2 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Hero и блоки</p>
                <p class="mb-4 font-body text-xs text-mts-text-secondary">
                  Добавьте секцию и блок «Баннер / изображение» для hero как на детальных страницах услуг: фон, подпись,
                  затемнение. В секции можно задать тон крошек над баннером. Если нужен только баннер без подписи над ним —
                  отключите «Показывать заголовок секции» в этой секции. Если блоков нет, страница ведёт себя как раньше
                  (только заголовок и текст ниже).                   В блоке «Карточки» можно выбрать внутреннюю страницу — на сайте появится
                  кнопка «Подробнее». Если для EN не задан свой JSON блоков, при открытии страница подставит
                  структуру из русской версии (включая URL картинок в split/галерее), чтобы при сохранении не терялись
                  блоки для английской локали.
                </p>
                <AdminCustomSectionsEditor
                  :model-value="customSectionsByLocale[localeTab]"
                  enable-article-placement
                  enable-card-detail-link
                  :detail-options="cardDetailLinkOptions"
                  @update:model-value="(v) => (customSectionsByLocale[localeTab] = v)"
                />
              </div>
              <div>
                <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
                  >Текст страницы</label
                >
                <p class="mb-2 font-body text-xs text-mts-text-secondary">
                  Визуальный редактор; на сайте сохраняется HTML. Достаточно заполнить либо этот блок, либо «Hero и
                  блоки» выше. Markdown-страницы при открытии преобразуются для редактирования. В панели редактора —
                  секция «Сетка»: колонки Tailwind (на md+), произвольный текст, картинки и карты в ячейках.
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
