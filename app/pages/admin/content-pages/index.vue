<script setup lang="ts">
import { Copy, Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { ContentPage, ContentPageTranslationPayload, MarineContentLocale } from '~/types'
import AdminPlusLink from "~/components/admin/AdminPlusLink.vue";
import {
  decodeAdminThemedString,
  encodeAdminThemedString,
  flattenEncodedOrPlain,
  plainMetaString,
} from '~/utils/adminThemedTextCodec'
import { triState01 } from '~/utils/adminFilters'
import { MARINE_CONTENT_LOCALES } from '~/utils/marineLocales'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { confirm } = useConfirmAction()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const pages = ref<ContentPage[]>([])
const pending = ref(true)

const search = ref('')
const sort = ref('sort_order')
const order = ref<'asc' | 'desc'>('asc')
const published = ref<'' | '1' | '0'>('')

const publishedOptions = [
  { value: '', label: 'Все' },
  { value: '1', label: 'Опубликовано' },
  { value: '0', label: 'Черновик' },
]

const sortOptions = [
  { value: 'id', label: 'ID' },
  { value: 'slug', label: 'Slug' },
  { value: 'title', label: 'Заголовок' },
  { value: 'sort_order', label: 'Порядок' },
  { value: 'created_at', label: 'Создано' },
  { value: 'updated_at', label: 'Обновлено' },
]

let searchDebounce: ReturnType<typeof setTimeout> | null = null

async function fetchPages() {
  pending.value = true
  try {
    const { data } = await api.contentPages.getManageAll({
      search: search.value.trim() || undefined,
      sort: sort.value,
      order: order.value,
      published: published.value === '' ? undefined : published.value,
    })
    pages.value = data
  } finally {
    pending.value = false
  }
}

function onSearchInput(v: string) {
  search.value = v
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
  searchDebounce = setTimeout(() => {
    fetchPages()
  }, 320)
}

onMounted(fetchPages)

watch([sort, order, published], () => {
  fetchPages()
})

async function handleDelete(id: number) {
  const ok = await confirm({
    title: 'Удаление страницы',
    message: 'Вы уверены, что хотите удалить эту страницу? Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    await api.contentPages.delete(id)
    adminToast.success('Страница удалена')
    pages.value = pages.value.filter((p) => p.id !== id)
  } catch {
    await showAdminAlert({ message: 'Не удалось удалить страницу', variant: 'error' })
  }
}

const duplicatingId = ref<number | null>(null)

/**
 * Подбирает уникальный slug для копии: пробует `${slug}-copy`,
 * затем `-copy-2`, `-copy-3` и т.д. Сравниваем с тем, что есть в текущем
 * списке — этого достаточно, чтобы избежать коллизий в большинстве случаев;
 * если slug всё же занят страницей вне фильтра — API вернёт ошибку
 * валидации и мы покажем тост.
 */
function nextCopySlug(originalSlug: string, existingSlugs: Set<string>): string {
  const base = `${originalSlug}-copy`
  if (!existingSlugs.has(base)) {
    return base
  }
  let i = 2
  while (existingSlugs.has(`${base}-${i}`)) {
    i += 1
  }
  return `${base}-${i}`
}

const COPY_SUFFIX_BY_LOCALE: Record<MarineContentLocale, string> = {
  ru: ' (копия)',
  en: ' (copy)',
}

/**
 * Заголовок content-page в БД хранится в одном из трёх форматов (поле редактируется TipTap-ом
 * `AdminThemedTextField` и сохраняется в виде HTML; legacy данные — plain string или JSON
 * `ThemeFormattedTitle` после старой палитры тонов). Простая конкатенация ` (копия)` ломает
 * HTML («(копия)» оказывается ВНЕ последнего `</p>` — TipTap при загрузке либо теряет хвост,
 * либо запихивает его в новый абзац) и портит JSON палитры. Здесь определяем формат и
 * аккуратно вставляем суффикс ВНУТРЬ последнего блока, сохраняя обёртку.
 */
function appendCopySuffixToTitle(rawTitle: string | null | undefined, suffix: string): string {
  if (rawTitle == null || rawTitle === '') {
    return suffix.trimStart()
  }
  const trimmed = rawTitle.trimStart()
  if (trimmed.startsWith('<')) {
    /*
     * Регэксп подцепляет последний закрывающий тег (например, `</p>`) и хвостовые пробелы
     * — суффикс встаёт между текстом и `</p>`, в одном абзаце с заголовком. Если структура
     * нестандартная и тег не найден — мягко добавляем суффикс в конец без поломки HTML.
     */
    const m = rawTitle.match(/^([\s\S]*?)(<\/[a-zA-Z][^>]*>)\s*$/)
    if (m && m[1] != null && m[2] != null) {
      return `${m[1]}${suffix}${m[2]}`
    }
    return `${rawTitle}${suffix}`
  }
  if (trimmed.startsWith('{')) {
    const decoded = decodeAdminThemedString(rawTitle)
    const spans = decoded.spans.length > 0 ? decoded.spans : [{ text: '', tone: 'text' as const }]
    const lastIdx = spans.length - 1
    const lastSpan = spans[lastIdx]!
    spans[lastIdx] = { ...lastSpan, text: `${lastSpan.text ?? ''}${suffix}` }
    return encodeAdminThemedString({ spans })
  }
  return `${rawTitle}${suffix}`
}

async function handleDuplicate(row: ContentPage) {
  if (duplicatingId.value !== null) {
    return
  }
  const ok = await confirm({
    title: 'Скопировать страницу',
    message:
      'Будет создан черновик копии этой страницы со всем содержимым. Slug и заголовки получат пометку «копия» — это можно поправить в редакторе.',
    confirmLabel: 'Скопировать',
  })
  if (!ok) {
    return
  }
  duplicatingId.value = row.id
  try {
    const source = await api.contentPages.getManageById(row.id)
    const existingSlugs = new Set(pages.value.map((p) => p.slug))
    const newSlug = nextCopySlug(source.slug, existingSlugs)
    /*
     * Перевод для каждой локали:
     *   - если в исходнике перевод локали ПУСТОЙ (нет осмысленного заголовка) — оставляем
     *     ВСЕ поля пустыми. Иначе в редакторе валидатор будет считать локаль «частично
     *     заполненной» (только из-за подставленного «(copy)») и при сохранении упадёт с
     *     требованием дописать заголовок и тело для en — пользователь не сможет сохранить
     *     копию даже без правок. Пустую локаль редактор синхронизирует автоматически
     *     через `syncEmptySecondaryLocalesSectionsFromPrimary`.
     *   - если заголовок есть — дописываем суффикс «(копия)»/«(copy)» внутри его обёртки
     *     (HTML, JSON ThemeFormattedTitle или plain), чтобы не ломать структуру.
     */
    const translations: Record<MarineContentLocale, ContentPageTranslationPayload> = {} as Record<
      MarineContentLocale,
      ContentPageTranslationPayload
    >
    for (const loc of MARINE_CONTENT_LOCALES) {
      const t = source.translations?.[loc]
      const sourceTitle = t?.title ?? ''
      const sourceTitleHasText = plainMetaString(sourceTitle).length > 0
      if (!sourceTitleHasText) {
        translations[loc] = {
          title: '',
          excerpt: '',
          body: '',
          seoTitle: '',
          seoDescription: '',
          seoKeywords: '',
        }
        continue
      }
      translations[loc] = {
        title: appendCopySuffixToTitle(sourceTitle, COPY_SUFFIX_BY_LOCALE[loc]),
        excerpt: t?.excerpt ?? '',
        body: t?.body ?? '',
        seoTitle: t?.seoTitle ?? '',
        seoDescription: t?.seoDescription ?? '',
        seoKeywords: t?.seoKeywords ?? '',
      }
    }
    await api.contentPages.create({
      slug: newSlug,
      // Копию создаём как черновик — иначе на сайте сразу появится дубль страницы.
      isPublished: false,
      sortOrder: source.sortOrder ?? 0,
      showInquiryForm: source.showInquiryForm,
      showPublicTitle: source.showPublicTitle,
      // Привязку к карточке (service/project) специально НЕ копируем: двойная
      // привязка двух страниц к одной карточке внесёт путаницу. Пользователь
      // может перепривязать копию вручную при необходимости.
      translations,
    })
    adminToast.success('Создана копия страницы (черновик)')
    await fetchPages()
  } catch {
    await showAdminAlert({ message: 'Не удалось скопировать страницу', variant: 'error' })
  } finally {
    duplicatingId.value = null
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div class="flex flex-wrap items-center justify-between gap-3 h-auto min-h-16 py-2">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Текстовые страницы</h1>
          </div>
          <AdminPlusLink to="/admin/content-pages/new">Добавить страницу</AdminPlusLink>
        </div>
      </div>
    </header>

    <main class="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
      <AdminListToolbar
        :search="search"
        :sort="sort"
        :order="order"
        :sort-options="sortOptions"
        search-placeholder="Заголовок, slug…"
        :extra-filter="published"
        extra-filter-label="Публикация"
        :extra-filter-options="publishedOptions"
        @update:search="onSearchInput"
        @update:sort="sort = $event"
        @update:order="order = $event"
        @update:extra-filter="published = triState01($event)"
      />

      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <div v-else class="bg-white border border-mts-border overflow-x-auto">
        <table class="w-full min-w-[720px]">
          <thead class="bg-mts-bg border-b border-mts-border">
            <tr>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Заголовок</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Slug</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Порядок</th>
              <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Статус</th>
              <th class="text-right p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pages" :key="row.id" class="border-b border-mts-border last:border-0">
              <td class="p-4">
                <p class="font-body text-sm text-mts-text">{{ flattenEncodedOrPlain(row.title) }}</p>
              </td>
              <td class="p-4">
                <span class="font-mono text-xs text-mts-text-secondary">{{ row.slug }}</span>
              </td>
              <td class="p-4">
                <span class="font-body text-sm text-mts-text-secondary">{{ row.sortOrder }}</span>
              </td>
              <td class="p-4">
                <span
                  :class="
                    row.isPublished
                      ? 'inline-block px-2 py-0.5 bg-green-100 text-green-800 font-mono text-[9px] uppercase'
                      : 'inline-block px-2 py-0.5 bg-mts-bg text-mts-text-secondary font-mono text-[9px] uppercase'
                  "
                >
                  {{ row.isPublished ? 'Опубликовано' : 'Черновик' }}
                </span>
              </td>
              <td class="p-4 text-right">
                <NuxtLink
                  :to="`/admin/content-pages/${row.id}`"
                  class="p-2 text-mts-text-secondary hover:text-mts-accent transition-colors inline-flex"
                  title="Редактировать"
                  aria-label="Редактировать"
                >
                  <Edit class="w-4 h-4" />
                </NuxtLink>
                <button
                  type="button"
                  class="p-2 text-mts-text-secondary hover:text-mts-accent transition-colors inline-flex disabled:opacity-40"
                  :disabled="duplicatingId !== null"
                  title="Скопировать страницу"
                  aria-label="Скопировать страницу"
                  @click="handleDuplicate(row)"
                >
                  <Loader2
                    v-if="duplicatingId === row.id"
                    class="w-4 h-4 animate-spin"
                  />
                  <Copy v-else class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  class="p-2 text-mts-text-secondary hover:text-red-600 transition-colors inline-flex"
                  title="Удалить"
                  aria-label="Удалить"
                  @click="handleDelete(row.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="pages.length === 0" class="p-8 text-center font-body text-sm text-mts-text-secondary">Страниц пока нет.</p>
      </div>
    </main>
  </div>
</template>
