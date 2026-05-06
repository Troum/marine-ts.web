<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronDown, Plus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import AdminHeroImageField from '~/components/admin/AdminHeroImageField.vue'
import AdminIconSelect from '~/components/admin/AdminIconSelect.vue'
import AdminImageListField from '~/components/admin/AdminImageListField.vue'
import AdminInputNumberStepper from '~/components/admin/AdminInputNumberStepper.vue'
import AdminSelect, { type AdminSelectOption } from '~/components/admin/AdminSelect.vue'
import { useConfirm } from '~/composables/useConfirmAction'
import type { CustomPageBlock, CustomPageBlockType, CustomPageSection, PageBreadcrumbTone } from '~/types'
import { crewingIconSelectOptions } from '~/utils/crewingIcons'
import {
  CUSTOM_BLOCK_TYPES,
  CUSTOM_BLOCK_TYPE_LABELS,
  defaultBlock,
  defaultCardItem,
  defaultCustomSection,
  moveItem,
} from '~/utils/customPageSections'
import { CUSTOM_SECTION_BREADCRUMB_TONE_ADMIN_OPTIONS } from '~/utils/pageBreadcrumbTone'

/**
 * Универсальный редактор пользовательских секций, единый для всех CMS-страниц
 * админки (главная, о компании, листинги, контакты, line-marketing).
 *
 * Контракт:
 *  • `modelValue` — массив секций; редактор поддерживает добавление/удаление/
 *    сортировку секций и блоков всех типов из `CUSTOM_BLOCK_TYPES`.
 *  • Оборачивающий компонент отвечает за заголовок раздела и сохранение
 *    результата на бэкенде.
 *  • Опционально: список опций выбора детальной страницы для блока «cards»
 *    (карточки могут вести на content-page).
 */
const props = withDefaults(
  defineProps<{
    modelValue: CustomPageSection[]
    /** Опции выбора детальной страницы для блока «cards» (если применимо). */
    detailOptions?: AdminSelectOption[]
    /** Доп. описание под заголовком (можно опустить). */
    helperText?: string
    /** На каких страницах нет понятия "детальной страницы" (карточки без ссылки). */
    enableCardDetailLink?: boolean
    /**
     * Детальные content-page: положение секции относительно основного текста (TipTap).
     * На листингах и прочих страницах выключено.
     */
    enableArticlePlacement?: boolean
  }>(),
  {
    detailOptions: () => [],
    helperText: '',
    enableCardDetailLink: false,
    enableArticlePlacement: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: CustomPageSection[]): void
}>()

const sections = computed<CustomPageSection[]>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const { confirm } = useConfirm()

const collapsed = ref<Record<string, boolean>>({})
function toggleCollapsed(id: string) {
  collapsed.value[id] = !collapsed.value[id]
}
function isCollapsed(id: string): boolean {
  return collapsed.value[id] === true
}

const sectionLabel = 'mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary'
const sectionInput =
  'w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none'

const splitRightModeOptions: AdminSelectOption[] = [
  { value: 'image', label: 'Одно изображение' },
  { value: 'slider', label: 'Слайдер (несколько URL)' },
]

const cardsItemsAlignOptions: AdminSelectOption[] = [
  { value: 'left', label: 'Текст слева' },
  { value: 'center', label: 'По центру' },
]

const sectionArticlePlacementOptions: AdminSelectOption[] = [
  { value: 'beforeArticle', label: 'До основного текста статьи (TipTap)' },
  { value: 'afterArticle', label: 'После основного текста статьи' },
]

const htmlAlignOptions: AdminSelectOption[] = [
  { value: 'left', label: 'Слева' },
  { value: 'center', label: 'По центру (контейнер)' },
]

const blockTypeAddOptions: { type: CustomPageBlockType; label: string }[] = CUSTOM_BLOCK_TYPES.map((t) => ({
  type: t,
  label: CUSTOM_BLOCK_TYPE_LABELS[t],
}))

function addSection() {
  const next = [...sections.value, defaultCustomSection()]
  sections.value = next
}

async function removeSection(idx: number) {
  const ok = await confirm({
    message: 'Удалить пользовательскую секцию вместе со всем содержимым?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) return
  const next = sections.value.filter((_, i) => i !== idx)
  sections.value = next
}

function moveSection(idx: number, delta: number) {
  const next = [...sections.value]
  if (moveItem(next, idx, delta)) {
    sections.value = next
  }
}

function addBlock(sIdx: number, type: CustomPageBlockType) {
  const next = sections.value.map((s, i) =>
    i === sIdx ? { ...s, blocks: [...s.blocks, defaultBlock(type)] } : s,
  )
  sections.value = next
}

async function removeBlock(sIdx: number, bIdx: number) {
  const ok = await confirm({
    message: 'Удалить этот блок?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) return
  const next = sections.value.map((s, i) =>
    i === sIdx ? { ...s, blocks: s.blocks.filter((_, j) => j !== bIdx) } : s,
  )
  sections.value = next
}

function moveBlock(sIdx: number, bIdx: number, delta: number) {
  const next = sections.value.map((s, i) => (i === sIdx ? { ...s, blocks: [...s.blocks] } : s))
  if (moveItem(next[sIdx]!.blocks, bIdx, delta)) {
    sections.value = next
  }
}

/* ── Block-specific list mutations ── */

function addCardItem(sIdx: number, bIdx: number) {
  const next = sections.value.map((s, i) =>
    i === sIdx
      ? {
          ...s,
          blocks: s.blocks.map((b, j) =>
            j === bIdx && b.type === 'cards' ? { ...b, items: [...b.items, defaultCardItem()] } : b,
          ),
        }
      : s,
  )
  sections.value = next
}

async function removeCardItem(sIdx: number, bIdx: number, ciIdx: number) {
  const ok = await confirm({
    message: 'Удалить эту карточку?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) return
  const next = sections.value.map((s, i) =>
    i === sIdx
      ? {
          ...s,
          blocks: s.blocks.map((b, j) => {
            if (j !== bIdx || b.type !== 'cards') return b
            if (b.items.length <= 1) return b
            return { ...b, items: b.items.filter((_, k) => k !== ciIdx) }
          }),
        }
      : s,
  )
  sections.value = next
}

/**
 * Заменяет массив `images` у конкретного блока (`split`/`gallery`).
 * Используется как обработчик `update:modelValue` от `AdminImageListField` —
 * сам компонент уже умеет добавлять/удалять/переупорядочивать элементы и держит
 * инвариант «минимум один пустой слот», так что отдельные `addImageRow`/`removeImageRow`
 * с подтверждениями больше не нужны.
 */
function setBlockImages(sIdx: number, bIdx: number, images: string[]) {
  const next = sections.value.map((s, i) =>
    i === sIdx
      ? {
          ...s,
          blocks: s.blocks.map((b, j) => {
            if (j !== bIdx) return b
            if (b.type === 'split' || b.type === 'gallery') {
              return { ...b, images: [...images] }
            }
            return b
          }),
        }
      : s,
  )
  sections.value = next
}

function addAccordionItem(sIdx: number, bIdx: number) {
  const next = sections.value.map((s, i) =>
    i === sIdx
      ? {
          ...s,
          blocks: s.blocks.map((b, j) =>
            j === bIdx && b.type === 'accordion'
              ? { ...b, items: [...b.items, { question: '', answer: '' }] }
              : b,
          ),
        }
      : s,
  )
  sections.value = next
}

async function removeAccordionItem(sIdx: number, bIdx: number, aiIdx: number) {
  const ok = await confirm({
    message: 'Удалить пункт аккордеона?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) return
  const next = sections.value.map((s, i) =>
    i === sIdx
      ? {
          ...s,
          blocks: s.blocks.map((b, j) => {
            if (j !== bIdx || b.type !== 'accordion') return b
            if (b.items.length <= 1) return b
            return { ...b, items: b.items.filter((_, k) => k !== aiIdx) }
          }),
        }
      : s,
  )
  sections.value = next
}

function blockTypeLabel(b: CustomPageBlock): string {
  return CUSTOM_BLOCK_TYPE_LABELS[b.type]
}
</script>

<template>
  <section class="relative border border-mts-border bg-white shadow-tech">
    <CommonAccentCorners />
    <div class="border-b border-mts-border p-6">
      <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">
        Пользовательские секции
      </h2>
      <p v-if="helperText" class="mt-2 max-w-7xl font-body text-xs text-mts-text-secondary">
        {{ helperText }}
      </p>
      <p v-else class="mt-2 max-w-7xl font-body text-xs text-mts-text-secondary">
        Добавляйте свои блоки контента — они появятся на сайте после штатных секций и перед формой
        заявки. Внутри секции можно сортировать блоки и менять их типы.
      </p>
      <button
        type="button"
        class="btn-secondary mt-4 inline-flex items-center gap-2"
        @click="addSection"
      >
        <Plus class="h-4 w-4" />
        Добавить секцию
      </button>
    </div>

    <div v-if="sections.length === 0" class="px-6 py-6 font-body text-sm text-mts-text-secondary">
      Нет пользовательских секций. Нажмите «Добавить секцию», чтобы создать первую.
    </div>

    <div v-else class="space-y-6 p-6">
      <section
        v-for="(sec, si) in sections"
        :key="sec.id"
        class="relative border border-mts-border bg-mts-bg/40"
      >
        <div class="flex flex-wrap items-start justify-between gap-2 border-b border-mts-border p-4">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
            @click="toggleCollapsed(sec.id)"
          >
            <h3 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">
              Секция {{ si + 1 }}: {{ sec.title.trim() || 'Без названия' }}
            </h3>
            <ChevronDown
              class="h-4 w-4 shrink-0 text-mts-text-secondary transition-transform"
              :class="{ 'rotate-180': !isCollapsed(sec.id) }"
            />
          </button>
          <div class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="btn-secondary p-1.5 disabled:opacity-40"
              :disabled="si === 0"
              aria-label="Выше"
              @click="moveSection(si, -1)"
            >
              <ArrowUp class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="btn-secondary p-1.5 disabled:opacity-40"
              :disabled="si >= sections.length - 1"
              aria-label="Ниже"
              @click="moveSection(si, 1)"
            >
              <ArrowDown class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="btn-secondary px-2 py-1 text-xs text-red-700"
              @click="removeSection(si)"
            >
              Удалить секцию
            </button>
          </div>
        </div>

        <div v-show="!isCollapsed(sec.id)" class="space-y-6 p-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="md:col-span-2">
              <label :class="sectionLabel">Заголовок секции (на сайте)</label>
              <input
                v-model="sec.title"
                type="text"
                :class="sectionInput"
                placeholder="Например: Дополнительные услуги"
              />
            </div>
            <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text md:col-span-2">
              <input v-model="sec.showTitle" type="checkbox" class="mts-checkbox" />
              Показывать заголовок секции
            </label>
            <div v-if="enableArticlePlacement" class="md:col-span-2">
              <label :class="sectionLabel">Положение на сайте</label>
              <AdminSelect
                :model-value="sec.contentPlacement ?? 'beforeArticle'"
                :options="sectionArticlePlacementOptions"
                @update:model-value="(v) => (sec.contentPlacement = v as 'beforeArticle' | 'afterArticle')"
              />
              <p class="mt-2 font-body text-xs text-mts-text-secondary">
                Секции «После текста» выводятся под содержимым редактора TipTap, перед формой заявки (если включена).
              </p>
            </div>
            <div class="md:col-span-2">
              <label :class="sectionLabel">Хлебные крошки на баннере секции</label>
              <AdminSelect
                :model-value="sec.breadcrumbTone ?? ''"
                :options="CUSTOM_SECTION_BREADCRUMB_TONE_ADMIN_OPTIONS"
                @update:model-value="(v) => (sec.breadcrumbTone = v ? (v as PageBreadcrumbTone) : undefined)"
              />
              <p class="mt-2 font-body text-xs text-mts-text-secondary">
                Над первым блоком «Баннер / изображение» (пункты крошек задаются на странице-родителе).
              </p>
            </div>
          </div>

          <div
            v-for="(block, bi) in sec.blocks"
            :key="block.id"
            class="space-y-4 rounded border border-mts-border bg-white p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                Блок {{ bi + 1 }} · {{ blockTypeLabel(block) }}
              </p>
              <div class="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  class="btn-secondary p-1.5 disabled:opacity-40"
                  :disabled="bi === 0"
                  aria-label="Выше"
                  @click="moveBlock(si, bi, -1)"
                >
                  <ArrowUp class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn-secondary p-1.5 disabled:opacity-40"
                  :disabled="bi >= sec.blocks.length - 1"
                  aria-label="Ниже"
                  @click="moveBlock(si, bi, 1)"
                >
                  <ArrowDown class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn-secondary px-2 py-1 text-xs text-red-700"
                  @click="removeBlock(si, bi)"
                >
                  Удалить блок
                </button>
              </div>
            </div>

            <!-- cards -->
            <template v-if="block.type === 'cards'">
              <div class="grid gap-4 md:grid-cols-2 md:items-end">
                <div>
                  <label :class="sectionLabel">Колонок сетки (широкий экран)</label>
                  <AdminInputNumberStepper v-model="block.columns" :min="1" :max="6" :step="1" />
                </div>
                <div>
                  <label :class="sectionLabel">Выравнивание в карточке</label>
                  <AdminSelect v-model="block.itemsAlign" :options="cardsItemsAlignOptions" />
                </div>
              </div>
              <div
                v-for="(card, ci) in block.items"
                :key="ci"
                class="space-y-3 border border-dashed border-mts-border bg-mts-bg/40 p-3"
              >
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Карточка {{ ci + 1 }}</p>
                  <button
                    v-if="block.items.length > 1"
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs text-red-700"
                    @click="removeCardItem(si, bi, ci)"
                  >
                    Удалить
                  </button>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <label :class="sectionLabel">Иконка</label>
                    <AdminIconSelect
                      :icon="card.icon"
                      :hide-icon="card.hideIcon"
                      :options="crewingIconSelectOptions"
                      @update:icon="(v) => (card.icon = v)"
                      @update:hide-icon="(v) => (card.hideIcon = v)"
                    />
                  </div>
                  <div>
                    <label :class="sectionLabel">Заголовок</label>
                    <AdminThemedTextField v-model="card.title" :multiline="false" />
                  </div>
                </div>
                <div>
                  <label :class="sectionLabel">Текст</label>
                  <AdminThemedTextField v-model="card.text" />
                </div>
                <div v-if="enableCardDetailLink">
                  <label :class="sectionLabel">Страница для «Подробнее» (опционально)</label>
                  <AdminSelect
                    :model-value="card.detailSlug ?? ''"
                    :options="detailOptions"
                    placeholder="Без отдельной страницы"
                    search-placeholder="Название или slug…"
                    @update:model-value="(v) => (card.detailSlug = v)"
                  />
                </div>
              </div>
              <button
                type="button"
                class="btn-secondary inline-flex items-center gap-2 text-sm"
                @click="addCardItem(si, bi)"
              >
                <Plus class="h-4 w-4" />
                Добавить карточку
              </button>
            </template>

            <!-- text -->
            <template v-else-if="block.type === 'text'">
              <div>
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemedTextField v-model="block.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Подзаголовок</label>
                <AdminThemedTextField v-model="block.subtitle" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Описание (Markdown)</label>
                <AdminThemedTextField v-model="block.description" />
              </div>
            </template>

            <!-- split -->
            <template v-else-if="block.type === 'split'">
              <div>
                <label :class="sectionLabel">Текст слева (Markdown)</label>
                <AdminThemedTextField v-model="block.leftText" />
              </div>
              <div class="grid gap-4 md:grid-cols-2 md:items-end">
                <div>
                  <label :class="sectionLabel">Доля ширины левой колонки, %</label>
                  <AdminInputNumberStepper v-model="block.leftWidthPercent" :min="10" :max="90" :step="5" />
                </div>
                <div>
                  <label :class="sectionLabel">Справа</label>
                  <AdminSelect v-model="block.rightMode" :options="splitRightModeOptions" />
                </div>
              </div>
              <AdminImageListField
                :model-value="block.images"
                label="Изображения"
                hint="Один URL — статичная картинка справа. Несколько URL и режим «Слайдер» — будут листаться на сайте."
                dialog-title="Изображения для split-блока"
                @update:model-value="(v) => setBlockImages(si, bi, v)"
              />
            </template>

            <!-- heroImage -->
            <template v-else-if="block.type === 'heroImage'">
              <label class="mb-4 flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
                <input
                  :checked="block.showHero !== false"
                  type="checkbox"
                  class="mts-checkbox"
                  @change="
                    (e) => {
                      block.showHero = (e.target as HTMLInputElement).checked
                    }
                  "
                />
                Показывать баннер на сайте (на всю ширину окна, высота — настройка ниже)
              </label>
              <p
                v-if="block.showHero === false"
                class="mb-4 rounded border border-dashed border-mts-border bg-mts-bg/60 px-3 py-2 font-body text-xs text-mts-text-secondary"
              >
                Баннер скрыт для посетителей; картинка и подписи сохраняются в черновике.
              </p>
              <AdminHeroImageField
                v-model="block.imageUrl"
                label="Изображение баннера"
                hint="Укажите URL (например /images/…) или нажмите «Загрузить файл» — в поле подставится адрес из медиахранилища. Ширина на сайте — 100% окна; высота задаётся полем ниже (vh)."
                :input-class="`${sectionInput} box-border min-h-[2.75rem]`"
              />
              <div>
                <label :class="sectionLabel">Высота баннера, vh</label>
                <AdminInputNumberStepper v-model="block.viewportHeightVh" :min="30" :max="100" :step="5" />
              </div>
              <div>
                <label :class="sectionLabel">Прозрачность затемнения поверх фото, %</label>
                <AdminInputNumberStepper v-model="block.overlayOpacity" :min="0" :max="100" :step="5" />
              </div>
              <div>
                <label :class="sectionLabel">Заголовок поверх (опционально)</label>
                <AdminThemedTextField v-model="block.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Подпись (опционально)</label>
                <AdminThemedTextField v-model="block.caption" />
              </div>
            </template>

            <!-- gallery -->
            <template v-else-if="block.type === 'gallery'">
              <div>
                <label :class="sectionLabel">Заголовок (опционально)</label>
                <AdminThemedTextField v-model="block.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Колонок (1–4)</label>
                <AdminInputNumberStepper v-model="block.columns" :min="1" :max="4" :step="1" />
              </div>
              <AdminImageListField
                :model-value="block.images"
                label="Изображения галереи"
                hint="Порядок и количество соответствуют тому, как карточки лягут в сетке на сайте."
                dialog-title="Изображения галереи"
                @update:model-value="(v) => setBlockImages(si, bi, v)"
              />
            </template>

            <!-- accordion -->
            <template v-else-if="block.type === 'accordion'">
              <div>
                <label :class="sectionLabel">Заголовок (опционально)</label>
                <AdminThemedTextField v-model="block.title" :multiline="false" />
              </div>
              <div
                v-for="(item, ai) in block.items"
                :key="ai"
                class="space-y-2 border border-dashed border-mts-border bg-mts-bg/40 p-3"
              >
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Пункт {{ ai + 1 }}</p>
                  <button
                    v-if="block.items.length > 1"
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs text-red-700"
                    @click="removeAccordionItem(si, bi, ai)"
                  >
                    Удалить
                  </button>
                </div>
                <div>
                  <label :class="sectionLabel">Заголовок (вопрос/тема)</label>
                  <AdminThemedTextField v-model="item.question" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Раскрываемое содержимое (Markdown)</label>
                  <AdminThemedTextField v-model="item.answer" />
                </div>
              </div>
              <button
                type="button"
                class="btn-secondary inline-flex items-center gap-2 text-sm"
                @click="addAccordionItem(si, bi)"
              >
                <Plus class="h-4 w-4" />
                Добавить пункт
              </button>
            </template>

            <!-- htmlMarkdown -->
            <template v-else-if="block.type === 'htmlMarkdown'">
              <div>
                <label :class="sectionLabel">Заголовок (опционально)</label>
                <AdminThemedTextField v-model="block.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Выравнивание</label>
                <AdminSelect v-model="block.align" :options="htmlAlignOptions" />
              </div>
              <div>
                <label :class="sectionLabel">Содержимое (Markdown / ограниченный HTML)</label>
                <AdminThemedTextField v-model="block.content" />
              </div>
            </template>
          </div>

          <div class="flex flex-wrap gap-2 border-t border-mts-border pt-4">
            <button
              v-for="opt in blockTypeAddOptions"
              :key="opt.type"
              type="button"
              class="btn-secondary inline-flex items-center gap-2 text-sm"
              @click="addBlock(si, opt.type)"
            >
              <Plus class="h-4 w-4" />
              {{ opt.label }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
