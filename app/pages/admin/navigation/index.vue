<script setup lang="ts">
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-vue-next'
import AdminNavPathPick from '~/components/admin/AdminNavPathPick.vue'
import type {
  LocalizedLine,
  MainNavMenuFontSize,
  MainNavMenuFontWeight,
  MainNavMenuJustify,
  MainNavMenuTextCase,
  MainNavMenuVariant,
  NavigationBurgerOffice,
  NavigationBurgerSocial,
  NavigationMenuItem,
  NavigationMenuSettings,
} from '~/types'
import { emptyNavigationSettings } from '~/utils/emptyNavigationSettings'
import { parseBilingual, serializeBilingual } from '~/utils/bilingualField'
import { stripHtmlToPlain } from '~/utils/adminHtmlField'
import { useConfirm } from '~/composables/useConfirmAction'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { canManageNavigation } = useAdminPermissions()
const { pathOptions, loadPathOptions } = useAdminPathOptions()
const { confirm } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const form = ref<NavigationMenuSettings>(emptyNavigationSettings())

function defaultMenuItems(): NavigationMenuItem[] {
  return [
    { path: '/', label: { ru: 'Главная', en: 'Home' } },
    { path: '/about', label: { ru: 'О компании', en: 'About' } },
    { path: '/services', label: { ru: 'Судоремонт', en: 'Ship Repair' } },
    { path: '/projects', label: { ru: 'Проекты', en: 'Projects' } },
    { path: '/ship-management', label: { ru: 'Судовой менеджмент', en: 'Ship management' } },
    { path: '/crewing-management', label: { ru: 'Крюинг-менеджмент', en: 'Crewing management' } },
    { path: '/lnk', label: { ru: 'ЛНК', en: 'LNK' } },
    { path: '/vacancies', label: { ru: 'Вакансии', en: 'Vacancies' } },
    { path: '/contacts', label: { ru: 'Контакты', en: 'Contacts' } },
  ]
}

function emptyItem(): NavigationMenuItem {
  return { path: '/', label: { ru: '', en: '' } }
}

function serializeNavItem(row: NavigationMenuItem): NavigationMenuItem {
  const base: NavigationMenuItem = {
    path: row.path.trim() || '/',
    label: {
      ru: row.label.ru.trim(),
      en: row.label.en.trim(),
    },
  }
  if (row.children?.length) {
    return { ...base, children: row.children.map(serializeNavItem) }
  }
  return base
}

/** Строки из TipTap/HTML для API: не отбрасывать осмысленный контент из‑за `|| undefined`. */
function burgerContactPayloadString(s: string | undefined): string | undefined {
  if (s == null) {
    return undefined
  }
  const t = typeof s === 'string' ? s.trim() : String(s).trim()
  return t !== '' ? t : undefined
}

function burgerContactPayloadUrl(s: string | undefined): string | undefined {
  if (s == null) {
    return undefined
  }
  const t = stripHtmlToPlain(String(s)).replace(/\s+/g, ' ').trim()
  return t !== '' ? t : undefined
}

function burgerContactPayloadLocalized(v: LocalizedLine | undefined): LocalizedLine | undefined {
  if (v == null) {
    return undefined
  }
  const p = parseBilingual(v)
  const s = serializeBilingual(p.ru, p.en)
  if (typeof s === 'string') {
    return burgerContactPayloadString(s) !== undefined ? s : undefined
  }
  if (!s.ru.trim() && !s.en.trim()) {
    return undefined
  }
  return s
}

function normalizeForEditor(settings: NavigationMenuSettings): NavigationMenuSettings {
  const style: Pick<
    NavigationMenuSettings,
    'menuVariant' | 'menuFontSize' | 'menuFontWeight' | 'menuTextCase' | 'menuJustify' | 'menuItemColor' | 'menuItemHoverColor'
  > = {
    menuVariant: settings.menuVariant ?? 'overlay',
    menuFontSize: settings.menuFontSize ?? 'base',
    menuFontWeight: settings.menuFontWeight ?? 'medium',
    menuTextCase: settings.menuTextCase ?? 'none',
    menuJustify: settings.menuJustify ?? 'between',
    menuItemHoverColor: settings.menuItemHoverColor ?? '',
  }
  const mergedMainMore = [...settings.main, ...settings.more].map(serializeNavItem)
  const main = mergedMainMore.length ? mergedMainMore : settings.main.map(serializeNavItem)
  const horizItems = settings.horizItems?.length ? settings.horizItems.map(serializeNavItem) : undefined
  const bcRaw = settings.burgerContacts ?? {}
  const bcRec = bcRaw as Record<string, unknown>
  function burgerEditorLocalized(camel: string, snake: string): { ru: string; en: string } {
    for (const k of [camel, snake]) {
      const v = bcRec[k]
      if (v == null) {
        continue
      }
      const p = parseBilingual(v)
      if (p.ru.trim() || p.en.trim()) {
        return p
      }
    }
    return { ru: '', en: '' }
  }

  /** Значения из API: camelCase или snake_case (после DTO на бэке). */
  function burgerEditorStr(camel: string, snake: string): string {
    for (const k of [camel, snake]) {
      const v = bcRec[k]
      if (typeof v === 'string' && v.trim() !== '') {
        return v.trim()
      }
    }
    return ''
  }

  /** Снимок после API — уже camelCase и с массивами */
  const bc = { ...bcRaw } as NavigationMenuSettings['burgerContacts']
  const emails =
    bc?.emails?.length ? [...bc.emails] : bc?.email?.trim() ? [bc.email.trim()] : ['']
  const socials: NavigationBurgerSocial[] =
    bc?.socials?.length
      ? bc.socials.map(s => ({ url: s.url ?? '', label: s.label ?? '' }))
      : bc?.socialUrl?.trim()
        ? [{ url: bc.socialUrl.trim(), label: (bc.socialLabel ?? bc.socialUrl).trim() }]
        : [{ url: '', label: '' }]
  const offices: NavigationBurgerOffice[] =
    bc?.offices?.length
      ? bc.offices.map(o => ({
          title: parseBilingual(o.title),
          address: parseBilingual(o.address),
        }))
      : bc?.officeAddress?.trim()
        ? [{ title: { ru: '', en: '' }, address: parseBilingual(bc.officeAddress.trim()) }]
        : [{ title: { ru: '', en: '' }, address: { ru: '', en: '' } }]
  const officesColumnTitlePair = burgerEditorLocalized('officesColumnTitle', 'offices_column_title')
  const burgerContacts = {
    phonesTitle: burgerEditorLocalized('phonesTitle', 'phones_title') ?? { ru: '', en: '' },
    phones: bc?.phones?.length ? [...bc.phones] : ['', ''],
    emailTitle: burgerEditorLocalized('emailTitle', 'email_title') ?? { ru: '', en: '' },
    emails,
    socials,
    officesColumnTitle:
      officesColumnTitlePair.ru.trim() || officesColumnTitlePair.en.trim()
        ? officesColumnTitlePair
        : (!bc?.offices?.length && burgerEditorStr('officeAddress', 'office_address') !== ''
            ? burgerEditorLocalized('officeTitle', 'office_title') ?? { ru: '', en: '' }
            : { ru: '', en: '' }),
    offices,
  }
  return {
    ...style,
    main: main.length ? main : defaultMenuItems(),
    more: [],
    horizItems,
    burgerContacts,
  }
}

const menuVariantOptions: { value: MainNavMenuVariant; label: string }[] = [
  { value: 'overlay', label: 'Полноэкранное меню (бургер)' },
  { value: 'horizontal', label: 'Горизонтальная строка на экранах от lg' },
]

const menuFontSizeOptions: { value: MainNavMenuFontSize; label: string }[] = [
  { value: 'sm', label: 'Мелкий (sm)' },
  { value: 'base', label: 'Обычный (base)' },
  { value: 'lg', label: 'Крупный (lg)' },
  { value: 'xl', label: 'Очень крупный (xl)' },
  { value: '2xl', label: 'Максимум (2xl)' },
]

const menuFontWeightOptions: { value: MainNavMenuFontWeight; label: string }[] = [
  { value: 'light', label: 'Тонкий (Light)' },
  { value: 'normal', label: 'Обычный (Normal)' },
  { value: 'medium', label: 'Средний (Medium)' },
  { value: 'semibold', label: 'Полужирный (Semibold)' },
  { value: 'bold', label: 'Жирный (Bold)' },
]

const menuTextCaseOptions: { value: MainNavMenuTextCase; label: string }[] = [
  { value: 'none', label: 'Как в тексте' },
  { value: 'lowercase', label: 'Строчные (lowercase)' },
  { value: 'uppercase', label: 'Прописные (UPPERCASE)' },
  { value: 'capitalize', label: 'С заглавной (Capitalize)' },
]

const menuJustifyOptions: { value: MainNavMenuJustify; label: string }[] = [
  { value: 'center', label: 'По центру' },
  { value: 'between', label: 'Space between' },
]

onMounted(async () => {
  if (!canManageNavigation.value) {
    await navigateTo('/admin')
    return
  }
  try {
    await loadPathOptions()
    form.value = normalizeForEditor(await api.navigationSettings.get())
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить меню', variant: 'error' })
    form.value = { ...emptyNavigationSettings(), main: defaultMenuItems(), more: [] }
  } finally {
    loading.value = false
  }
})

/** horizItems независим, если задан (не undefined) */
const useIndependentHorizItems = computed({
  get: () => Array.isArray(form.value.horizItems),
  set: (val: boolean) => {
    if (val) {
      form.value.horizItems = form.value.main.map(serializeNavItem)
    } else {
      form.value.horizItems = undefined
    }
  },
})

function addItem() {
  form.value.main.push(emptyItem())
}

async function removeItem(i: number) {
  const ok = await confirm({
    message: 'Удалить этот пункт бургер-меню?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.main.splice(i, 1)
}

function moveItem(i: number, dir: -1 | 1) {
  const arr = form.value.main
  const j = i + dir
  if (j < 0 || j >= arr.length) {
    return
  }
  const a = arr[i]!
  const b = arr[j]!
  arr[i] = b
  arr[j] = a
}

async function restoreDefaultMenu() {
  const ok = await confirm({
    message: 'Заменить текущий список пунктами из нового дизайна?',
    confirmLabel: 'Заменить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.main = defaultMenuItems()
  form.value.more = []
}

function addHorizItem() {
  if (!Array.isArray(form.value.horizItems)) {
    form.value.horizItems = []
  }
  form.value.horizItems.push(emptyItem())
}

async function removeHorizItem(i: number) {
  const ok = await confirm({
    message: 'Удалить этот пункт горизонтального меню?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  form.value.horizItems!.splice(i, 1)
}

function moveHorizItem(i: number, dir: -1 | 1) {
  const arr = form.value.horizItems
  if (!arr) {
    return
  }
  const j = i + dir
  if (j < 0 || j >= arr.length) {
    return
  }
  const a = arr[i]!
  const b = arr[j]!
  arr[i] = b
  arr[j] = a
}

function addPhone() {
  form.value.burgerContacts ??= {}
  form.value.burgerContacts.phonesTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.emailTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.officesColumnTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.phones ??= []
  form.value.burgerContacts.phones.push('')
}

function removePhone(i: number) {
  form.value.burgerContacts?.phones?.splice(i, 1)
}

function addEmail() {
  form.value.burgerContacts ??= {}
  form.value.burgerContacts.phonesTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.emailTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.officesColumnTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.emails ??= []
  form.value.burgerContacts.emails.push('')
}

function removeEmail(i: number) {
  form.value.burgerContacts?.emails?.splice(i, 1)
}

function addSocial() {
  form.value.burgerContacts ??= {}
  form.value.burgerContacts.phonesTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.emailTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.officesColumnTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.socials ??= []
  form.value.burgerContacts.socials.push({ url: '', label: '' })
}

function removeSocial(i: number) {
  form.value.burgerContacts?.socials?.splice(i, 1)
}

function addOffice() {
  form.value.burgerContacts ??= {}
  form.value.burgerContacts.phonesTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.emailTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.officesColumnTitle ??= { ru: '', en: '' }
  form.value.burgerContacts.offices ??= []
  form.value.burgerContacts.offices.push({ title: { ru: '', en: '' }, address: { ru: '', en: '' } })
}

function removeOffice(i: number) {
  form.value.burgerContacts?.offices?.splice(i, 1)
}

async function submit() {
  saving.value = true
  try {
    const payload: NavigationMenuSettings = {
      main: form.value.main.map(serializeNavItem),
      more: [],
      menuVariant: form.value.menuVariant ?? 'overlay',
      menuFontSize: form.value.menuFontSize ?? 'base',
      menuFontWeight: form.value.menuFontWeight ?? 'medium',
      menuTextCase: form.value.menuTextCase ?? 'none',
      menuJustify: form.value.menuJustify ?? 'between',
      menuItemHoverColor: form.value.menuItemHoverColor || undefined,
      horizItems: form.value.horizItems?.length ? form.value.horizItems.map(serializeNavItem) : undefined,
      burgerContacts: (() => {
        const bc = form.value.burgerContacts
        if (!bc) return undefined
        return {
          phonesTitle: burgerContactPayloadLocalized(bc.phonesTitle),
          phones: bc.phones?.filter(p => p.trim()) ?? undefined,
          emailTitle: burgerContactPayloadLocalized(bc.emailTitle),
          emails: bc.emails?.map(e => e.trim()).filter(Boolean) ?? undefined,
          socials: bc.socials
            ?.flatMap((s) => {
              const url = burgerContactPayloadUrl(s.url)
              if (!url) {
                return []
              }
              return [{
                url,
                label: s.label.trim() || url,
              }]
            }) ?? undefined,
          officesColumnTitle: burgerContactPayloadLocalized(bc.officesColumnTitle),
          offices: bc.offices
            ?.map(o => ({
              title: burgerContactPayloadLocalized(o.title),
              address: burgerContactPayloadLocalized(o.address),
            }))
            .filter(o => o.address !== undefined) ?? undefined,
        }
      })(),
    }
    await api.navigationSettings.update(payload)
    form.value = normalizeForEditor(await api.navigationSettings.get())
    adminToast.success('Меню сохранено')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto flex h-16 max-w-[1600px] items-center px-6 lg:px-12">
        <NuxtLink to="/admin" class="mr-4 text-mts-text-secondary hover:text-mts-accent">
          <ArrowLeft class="h-5 w-5" />
        </NuxtLink>
        <h1 class="font-display text-xl text-mts-text">Fullscreen-меню</h1>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-12">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>

      <form v-else class="relative border border-mts-border bg-white p-8 shadow-tech" @submit.prevent="submit">
        <CommonAccentCorners />

        <div class="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <p class="font-body text-sm leading-relaxed text-mts-text-secondary">
              Бургер-меню и горизонтальное меню (шапка, от <span class="font-mono">lg</span>) показываются одновременно.
              По умолчанию горизонтальное меню использует те же пункты, что и бургер. Можно настроить их независимо.
            </p>
            <p class="mt-3 font-body text-sm leading-relaxed text-mts-text-secondary">
              Список «Раздел сайта» строится из файлов <span class="font-mono">app/pages</span> и опубликованных
              контентных страниц API. Можно ввести путь вручную: внутренний
              (<span class="font-mono">/services</span>) или полный URL (<span class="font-mono">https://…</span>).
            </p>
          </div>

          <div class="border border-mts-border bg-mts-bg p-4">
            <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Бургер (предпросмотр)</p>
            <div class="mt-3 rounded bg-mts-navy p-4">
              <div
                v-for="(row, i) in form.main.slice(0, 5)"
                :key="`preview-${i}`"
                class="flex items-center justify-between border-b border-white/10 py-2 last:border-b-0"
              >
                <span class="text-sm font-bold text-white/75">{{ row.label.ru || 'Без подписи' }}</span>
                <span class="text-white/20">→</span>
              </div>
              <p v-if="form.main.length > 5" class="mt-3 text-xs text-white/40">+ ещё {{ form.main.length - 5 }}</p>
            </div>
          </div>
        </div>

        <div class="mb-8 grid grid-cols-1 gap-6 border border-mts-border bg-mts-bg/40 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div>
            <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
              Вид меню
            </label>
            <AdminSelect
              v-model="form.menuVariant"
              :options="menuVariantOptions"
              :searchable="false"
              placeholder="Вид меню"
            />
          </div>
          <div>
            <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
              Размер пунктов (горизонтальная строка)
            </label>
            <AdminSelect
              v-model="form.menuFontSize"
              :options="menuFontSizeOptions"
              :searchable="false"
              placeholder="Размер"
            />
          </div>
          <div>
            <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
              Начертание
            </label>
            <AdminSelect
              v-model="form.menuFontWeight"
              :options="menuFontWeightOptions"
              :searchable="false"
              placeholder="Начертание"
            />
          </div>
          <div>
            <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
              Регистр текста
            </label>
            <AdminSelect
              v-model="form.menuTextCase"
              :options="menuTextCaseOptions"
              :searchable="false"
              placeholder="Регистр"
            />
          </div>
          <div>
            <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
              Распределение пунктов
            </label>
            <AdminSelect
              v-model="form.menuJustify"
              :options="menuJustifyOptions"
              :searchable="false"
              placeholder="Выравнивание flex"
            />
          </div>
          <p
            class="font-body text-xs leading-relaxed text-mts-text-secondary sm:col-span-2 lg:col-span-3 xl:col-span-5"
          >
            Настройки размера, начертания, регистра и
            <span class="font-mono">justify-content</span> действуют на горизонтальную строку в шапке (от
            <span class="font-mono">lg</span>); на меньших экранах остаётся бургер.
          </p>
        </div>

        <div class="mb-8 border border-mts-border bg-mts-bg/40 p-6">
          <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
            Цвет пунктов меню при наведении
          </label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              class="h-9 w-16 cursor-pointer rounded border border-mts-border bg-white p-0.5"
              :value="form.menuItemHoverColor || '#000000'"
              @input="form.menuItemHoverColor = ($event.target as HTMLInputElement).value"
            />
            <span class="font-mono text-sm text-mts-text-secondary">{{ form.menuItemHoverColor || 'по умолчанию (акцентный)' }}</span>
            <button
              v-if="form.menuItemHoverColor"
              type="button"
              class="btn-secondary px-2 py-1 text-xs"
              @click="form.menuItemHoverColor = ''"
            >
              Сбросить
            </button>
          </div>
          <p class="mt-1.5 font-body text-xs text-mts-text-secondary">
            По умолчанию — акцентный красный цвет темы.
          </p>
        </div>

        <!-- Бургер-меню: пункты -->
        <div class="mb-2">
          <p class="font-mono text-[11px] uppercase tracking-wide text-mts-text-secondary">Пункты бургер-меню</p>
        </div>
        <div class="mb-10 space-y-4">
          <div
            v-for="(row, i) in form.main"
            :key="`menu-item-${i}`"
            class="grid gap-4 border border-mts-border bg-mts-bg/50 p-4 sm:grid-cols-2"
          >
            <div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
              <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                Пункт {{ i + 1 }}
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                  :disabled="i === 0"
                  aria-label="Выше"
                  @click="moveItem(i, -1)"
                >
                  <ChevronUp class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                  :disabled="i === form.main.length - 1"
                  aria-label="Ниже"
                  @click="moveItem(i, 1)"
                >
                  <ChevronDown class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-2 border-red-200 text-red-700 hover:border-red-400"
                  @click="removeItem(i)"
                >
                  <Trash2 class="h-4 w-4" />
                  Удалить
                </button>
              </div>
            </div>

            <div class="sm:col-span-2">
              <AdminNavPathPick v-model="row.path" :path-options="pathOptions" input-placeholder="/services или https://…" />
            </div>

            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                Подпись (RU)
              </label>
              <AdminThemedTextField v-model="row.label.ru" :multiline="false" />
            </div>

            <div>
              <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                Подпись (EN)
              </label>
              <AdminThemedTextField v-model="row.label.en" :multiline="false" />
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addItem">
              <Plus class="h-4 w-4" />
              Добавить пункт
            </button>
            <button type="button" class="btn-secondary" @click="restoreDefaultMenu">
              Восстановить пункты нового дизайна
            </button>
          </div>
        </div>

        <!-- Горизонтальное меню: пункты -->
        <div class="mb-6 border border-mts-border bg-mts-bg/40 p-6">
          <div class="mb-4 flex items-center justify-between gap-4">
            <p class="font-mono text-[11px] uppercase tracking-wide text-mts-text-secondary">Пункты горизонтального меню</p>
            <label class="flex cursor-pointer items-center gap-2 select-none">
              <input
                v-model="useIndependentHorizItems"
                type="checkbox"
                class="h-4 w-4 accent-mts-accent"
              />
              <span class="font-body text-sm text-mts-text">Независимые пункты (отличаются от бургера)</span>
            </label>
          </div>

          <div v-if="!useIndependentHorizItems" class="rounded border border-dashed border-mts-border bg-white/60 px-4 py-3">
            <p class="font-body text-sm text-mts-text-secondary">
              Горизонтальное меню использует те же пункты, что и бургер-меню. Включите «Независимые пункты», чтобы задать отдельный список.
            </p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(row, i) in form.horizItems"
              :key="`horiz-item-${i}`"
              class="grid gap-4 border border-mts-border bg-white/60 p-4 sm:grid-cols-2"
            >
              <div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
                <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Пункт {{ i + 1 }}
                </p>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                    :disabled="i === 0"
                    aria-label="Выше"
                    @click="moveHorizItem(i, -1)"
                  >
                    <ChevronUp class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn-secondary inline-flex items-center gap-1 px-2 py-1.5"
                    :disabled="i === (form.horizItems?.length ?? 0) - 1"
                    aria-label="Ниже"
                    @click="moveHorizItem(i, 1)"
                  >
                    <ChevronDown class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="btn-secondary inline-flex items-center gap-2 border-red-200 text-red-700 hover:border-red-400"
                    @click="removeHorizItem(i)"
                  >
                    <Trash2 class="h-4 w-4" />
                    Удалить
                  </button>
                </div>
              </div>

              <div class="sm:col-span-2">
                <AdminNavPathPick v-model="row.path" :path-options="pathOptions" input-placeholder="/services или https://…" />
              </div>

              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Подпись (RU)
                </label>
                <AdminThemedTextField v-model="row.label.ru" :multiline="false" />
              </div>

              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Подпись (EN)
                </label>
                <AdminThemedTextField v-model="row.label.en" :multiline="false" />
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addHorizItem">
                <Plus class="h-4 w-4" />
                Добавить пункт
              </button>
            </div>
          </div>
        </div>

        <!-- Контактный блок бургер-меню -->
        <div class="mb-6 border border-mts-border bg-mts-bg/40 p-6">
          <p class="mb-6 font-mono text-[11px] uppercase tracking-wide text-mts-text-secondary">
            Контакты в бургер-меню
          </p>

          <!-- Телефоны -->
          <div class="mb-6">
            <div class="mb-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Заголовок колонки (RU)
                </label>
                <AdminThemedTextField
                  v-model="form.burgerContacts!.phonesTitle!.ru"
                  :multiline="false"
                  placeholder="Связь"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Заголовок колонки (EN)
                </label>
                <AdminThemedTextField
                  v-model="form.burgerContacts!.phonesTitle!.en"
                  :multiline="false"
                  placeholder="Contact"
                />
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="(_, i) in form.burgerContacts!.phones"
                :key="`phone-${i}`"
                class="flex items-center gap-3"
              >
                <label class="w-40 shrink-0 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Телефон {{ i + 1 }}
                </label>
                <AdminThemedTextField
                  v-model="form.burgerContacts!.phones![i]"
                  :multiline="false"
                  class="flex-1"
                  placeholder="+7 (911) 475-70-25"
                />
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-1 border-red-200 px-2 py-1.5 text-red-700 hover:border-red-400"
                  aria-label="Удалить"
                  @click="removePhone(i)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
            <button type="button" class="btn-secondary mt-3 inline-flex items-center gap-2" @click="addPhone">
              <Plus class="h-4 w-4" />
              Добавить телефон
            </button>
            <p class="mt-1.5 font-body text-xs text-mts-text-secondary">
              href генерируется автоматически (убираются все нецифровые символы, кроме «+»).
            </p>
          </div>

          <!-- Email и соцсети -->
          <div class="mb-6 grid gap-4 border-t border-mts-border pt-6 sm:grid-cols-2">
            <div class="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Заголовок колонки (RU)
                </label>
                <AdminThemedTextField
                  v-model="form.burgerContacts!.emailTitle!.ru"
                  :multiline="false"
                  placeholder="Мы в сети"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Заголовок колонки (EN)
                </label>
                <AdminThemedTextField
                  v-model="form.burgerContacts!.emailTitle!.en"
                  :multiline="false"
                  placeholder="Online"
                />
              </div>
            </div>

            <div class="sm:col-span-2">
              <p class="mb-2 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Email</p>
              <div class="space-y-2">
                <div
                  v-for="(_, i) in form.burgerContacts!.emails"
                  :key="`email-${i}`"
                  class="flex items-center gap-3"
                >
                  <label class="w-28 shrink-0 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                    {{ i + 1 }}
                  </label>
                  <AdminThemedTextField
                    v-model="form.burgerContacts!.emails![i]"
                    :multiline="false"
                    class="flex-1"
                    placeholder="info@example.com"
                  />
                  <button
                    type="button"
                    class="btn-secondary inline-flex items-center gap-1 border-red-200 px-2 py-1.5 text-red-700 hover:border-red-400"
                    aria-label="Удалить"
                    @click="removeEmail(i)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button type="button" class="btn-secondary mt-3 inline-flex items-center gap-2" @click="addEmail">
                <Plus class="h-4 w-4" />
                Добавить email
              </button>
            </div>

            <div class="sm:col-span-2 border-t border-mts-border pt-4">
              <p class="mb-2 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Соцсети</p>
              <div class="space-y-4">
                <div
                  v-for="(soc, i) in form.burgerContacts!.socials"
                  :key="`social-${i}`"
                  class="grid gap-3 rounded border border-mts-border bg-white/40 p-3 sm:grid-cols-2"
                >
                  <div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
                    <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Ссылка {{ i + 1 }}</span>
                    <button
                      type="button"
                      class="btn-secondary inline-flex items-center gap-1 border-red-200 px-2 py-1 text-red-700 hover:border-red-400"
                      @click="removeSocial(i)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Удалить
                    </button>
                  </div>
                  <div>
                    <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                      URL
                    </label>
                    <input
                      v-model="soc.url"
                      type="url"
                      class="w-full border border-mts-border bg-white px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                      placeholder="https://…"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                      Подпись
                    </label>
                    <AdminThemedTextField v-model="soc.label" :multiline="false" placeholder="vk.com/…" />
                  </div>
                </div>
              </div>
              <button type="button" class="btn-secondary mt-3 inline-flex items-center gap-2" @click="addSocial">
                <Plus class="h-4 w-4" />
                Добавить соцсеть
              </button>
            </div>
          </div>

          <!-- Офисы -->
          <div class="grid gap-4 border-t border-mts-border pt-6 sm:grid-cols-2">
            <div class="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Общий заголовок колонки офисов (RU)
                </label>
                <AdminThemedTextField
                  v-model="form.burgerContacts!.officesColumnTitle!.ru"
                  :multiline="false"
                  placeholder="Офисы"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Общий заголовок колонки офисов (EN)
                </label>
                <AdminThemedTextField
                  v-model="form.burgerContacts!.officesColumnTitle!.en"
                  :multiline="false"
                  placeholder="Offices"
                />
              </div>
            </div>
            <div class="sm:col-span-2">
              <p class="mb-2 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Офисы</p>
              <div class="space-y-4">
                <div
                  v-for="(of, i) in form.burgerContacts!.offices"
                  :key="`office-${i}`"
                  class="rounded border border-mts-border bg-white/40 p-3"
                >
                  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Офис {{ i + 1 }}</span>
                    <button
                      type="button"
                      class="btn-secondary inline-flex items-center gap-1 border-red-200 px-2 py-1 text-red-700 hover:border-red-400"
                      @click="removeOffice(i)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Удалить
                    </button>
                  </div>
                  <div class="mb-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                        Подзаголовок RU (необязательно)
                      </label>
                      <AdminThemedTextField
                        v-model="of.title!.ru"
                        :multiline="false"
                        placeholder="Например: Калининград"
                      />
                    </div>
                    <div>
                      <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                        Подзаголовок EN (необязательно)
                      </label>
                      <AdminThemedTextField
                        v-model="of.title!.en"
                        :multiline="false"
                        placeholder="For example: Kaliningrad"
                      />
                    </div>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                        Адрес RU
                      </label>
                      <AdminThemedTextField
                        v-model="of.address.ru"
                        :multiline="true"
                        placeholder="Улица, город…"
                      />
                    </div>
                    <div>
                      <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                        Адрес EN
                      </label>
                      <AdminThemedTextField
                        v-model="of.address.en"
                        :multiline="true"
                        placeholder="Street, city…"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" class="btn-secondary mt-3 inline-flex items-center gap-2" @click="addOffice">
                <Plus class="h-4 w-4" />
                Добавить офис
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-4">
          <button type="submit" :disabled="saving" class="btn-primary">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
          <NuxtLink to="/admin" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
