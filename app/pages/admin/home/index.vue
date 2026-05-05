<script setup lang="ts">
import { ArrowLeft, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next'
import AdminNavPathPick from '~/components/admin/AdminNavPathPick.vue'
import AdminCollapsibleSection from '~/components/admin/AdminCollapsibleSection.vue'
import type { HomePageData, ContentPage, MarineContentLocale } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import AdminThemeTitleEditor from '~/components/admin/AdminThemeTitleEditor.vue'
import { heroOverlaySocialIconOptions } from '~/utils/heroOverlaySocialIcons'
import {
  defaultHomeData,
  mergeHomePageData,
  syncHomeStructuralFields,
} from '~/utils/pageDefaults'
import { getAllLucideAdminIconOptions } from '~/utils/lucideIconRegistry'
import { useConfirm } from '~/composables/useConfirmAction'

const STAT_ICON_OPTIONS = getAllLucideAdminIconOptions()
const OVERLAY_SOCIAL_ICON_OPTIONS = heroOverlaySocialIconOptions.map((o) => ({
  value: o.value,
  label: o.label,
}))

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useMarineApi()
const { pathOptions, loadPathOptions } = useAdminPathOptions()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { confirm } = useConfirm()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

const data = ref<Record<MarineContentLocale, HomePageData>>({
  ru: defaultHomeData('ru'),
  en: defaultHomeData('en'),
})

const d = computed(() => data.value[localeTab.value])

const collapsed = ref<Record<string, boolean>>({
  hero: false,
  directions: true,
})

onMounted(async () => {
  await loadPathOptions()
  try {
    const page = await api.contentPages.getPublicBySlug('home')
    if (page) {
      existingId.value = page.id
      const managed = await api.contentPages.getManageById(page.id)
      for (const loc of MARINE_CONTENT_LOCALES) {
        const body = managed.translations?.[loc]?.body
        if (body) {
          try {
            const parsed = JSON.parse(body)
            if (parsed?.hero) data.value[loc] = mergeHomePageData(loc, parsed)
          } catch { /* keep defaults */ }
        }
      }
    }
  } catch { /* no existing page */ }
  loading.value = false
})

function addStat() {
  for (const loc of MARINE_CONTENT_LOCALES)
    data.value[loc].statsCard.items.push({ icon: 'Ship', value: '', label: '' })
}
async function removeStat(i: number) {
  const ok = await confirm({
    message: 'Удалить этот показатель?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) data.value[loc].statsCard.items.splice(i, 1)
}

function addDirectionRow() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].directions.rows.push({
      title: '',
      description: '',
      cta: loc === 'en' ? 'Open' : 'Подробнее',
      href: '/services',
      hoverTitle: '',
      hoverDescription: '',
      heroImage: '',
      hideInHero: false,
      hideInCardsBlock: false,
    })
  }
}

/**
 * Структурные флаги видимости карточек одинаковы для всех локалей —
 * прокидываем изменение разом во все, чтобы не было перекоса между ru/en.
 */
function setDirectionsShowCardsBlock(v: boolean) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].directions.showCardsBlock = v
  }
}

function setDirectionRowFlag(index: number, flag: 'hideInHero' | 'hideInCardsBlock', v: boolean) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const row = data.value[loc].directions.rows[index]
    if (row) {
      row[flag] = v
    }
  }
}

async function removeDirectionRow(i: number) {
  const ok = await confirm({
    message: 'Удалить эту карточку первого экрана?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].directions.rows.splice(i, 1)
  }
}

function addHeroOverlaySocial() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const row = data.value[loc].heroOverlayRow!
    row.socialLinks.push({ iconKey: 'facebook', href: '' })
  }
}

async function removeHeroOverlaySocial(i: number) {
  const ok = await confirm({
    message: 'Удалить эту иконку соцсети из полосы?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].heroOverlayRow!.socialLinks.splice(i, 1)
  }
}

function moveHeroOverlaySocial(i: number, dir: -1 | 1) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const arr = data.value[loc].heroOverlayRow!.socialLinks
    const j = i + dir
    if (j < 0 || j >= arr.length) {
      continue
    }
    const a = arr[i]!
    const b = arr[j]!
    arr[i] = b
    arr[j] = a
  }
}

function setHeroOverlaySocialField(i: number, field: 'iconKey' | 'href', value: string) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const row = data.value[loc].heroOverlayRow!.socialLinks[i]
    if (row) {
      row[field] = value
    }
  }
}

function addHeroOverlayNavLink() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const row = data.value[loc].heroOverlayRow!
    row.links.push({ path: '/contacts', label: { ru: '', en: '' } })
  }
}

async function removeHeroOverlayNavLink(i: number) {
  const ok = await confirm({
    message: 'Удалить эту ссылку из полосы?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].heroOverlayRow!.links.splice(i, 1)
  }
}

function moveHeroOverlayNavLink(i: number, dir: -1 | 1) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const arr = data.value[loc].heroOverlayRow!.links
    const j = i + dir
    if (j < 0 || j >= arr.length) {
      continue
    }
    const a = arr[i]!
    const b = arr[j]!
    arr[i] = b
    arr[j] = a
  }
}

function setHeroOverlayNavPath(i: number, path: string) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const link = data.value[loc].heroOverlayRow!.links[i]
    if (link) {
      link.path = path
    }
  }
}

function moveDirectionRow(index: number, dir: -1 | 1) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const rows = data.value[loc].directions.rows
    const j = index + dir
    if (j < 0 || j >= rows.length) {
      continue
    }
    const t = rows[index]!
    rows[index] = rows[j]!
    rows[j] = t
  }
}

async function submit() {
  syncHomeStructuralFields(data.value, localeTab.value)
  saving.value = true
  try {
    const translations = {} as Record<MarineContentLocale, { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }>
    for (const loc of MARINE_CONTENT_LOCALES) {
      translations[loc] = {
        title: loc === 'ru' ? 'Главная' : 'Home',
        excerpt: '', body: JSON.stringify(data.value[loc]),
        seoTitle: '', seoDescription: '', seoKeywords: '',
      }
    }
    if (existingId.value) {
      await api.contentPages.update(existingId.value, { slug: 'home', isPublished: true, translations })
    } else {
      const created = await api.contentPages.create({ slug: 'home', isPublished: true, sortOrder: 0, translations })
      existingId.value = (created as ContentPage).id
    }
    adminToast.success('Главная страница сохранена')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally { saving.value = false }
}

const sectionLabel = 'block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2'
const sectionInput = 'w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent'
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary hover:text-mts-accent transition-colors"><ArrowLeft class="w-5 h-5" /></NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Главная страница</h1>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/" target="_blank" class="font-body text-sm text-mts-text-secondary hover:text-mts-accent transition-colors">Открыть на сайте ↗</NuxtLink>
            <button type="button" :disabled="saving || loading" class="btn-primary px-6 disabled:opacity-50" @click="submit">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24"><Loader2 class="w-8 h-8 text-mts-accent animate-spin" /></div>

      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <!-- 1. HERO — фиксирована, не скрывается, не переносится. -->
        <AdminCollapsibleSection
          title="1. Hero-блок"
          :collapsed="collapsed.hero"
          @update:collapsed="(v) => (collapsed.hero = v)"
        >
          <div class="space-y-4">
            <AdminHeroImageField
              v-model="d.heroImage"
              label="Фон первого экрана (изображение / постер к видео)"
              hint="Необязательно. Статичный фон, если видео нет; иначе кадр до загрузки и постер для видео."
            />
            <AdminHeroImageField
              v-model="d.heroVideo"
              media-mode="video"
              label="Видео первого экрана (необязательно)"
              hint="MP4, WebM или MOV через загрузку или URL. Рекомендуется короткий ролик без звука; на сайте воспроизводится в цикле без звука. При prefers-reduced-motion показывается только картинка выше."
            />
            <div>
              <label :class="sectionLabel">Метка (label)</label>
              <AdminThemedTextField v-model="d.hero.label" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemeTitleEditor v-model="d.hero.titleFormatted" />
            </div>
            <div><label :class="sectionLabel">Описание (lead)</label><AdminThemedTextField v-model="d.hero.lead" /></div>
            <div class="grid md:grid-cols-2 gap-4">
              <div><label :class="sectionLabel">CTA клиент (заявка)</label><AdminThemedTextField v-model="d.hero.ctaClient" :multiline="false" /></div>
              <div><label :class="sectionLabel">CTA моряк (анкета)</label><AdminThemedTextField v-model="d.hero.ctaSeafarer" :multiline="false" /></div>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label :class="sectionLabel">Ссылка CTA клиента</label>
                <input v-model="d.hero.ctaClientHref" type="text" :class="sectionInput" placeholder="/contacts" />
              </div>
              <div>
                <label :class="sectionLabel">Ссылка CTA моряка</label>
                <input v-model="d.hero.ctaSeafarerHref" type="text" :class="sectionInput" placeholder="/vacancies" />
              </div>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="d.hero.hideCtaClient" type="checkbox" class="mts-checkbox" />
                <span class="font-body text-sm text-mts-text">Скрыть кнопку «Оставить заявку»</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="d.hero.hideCtaSeafarer" type="checkbox" class="mts-checkbox" />
                <span class="font-body text-sm text-mts-text">Скрыть кнопку «Заполнить анкету»</span>
              </label>
            </div>

            <div class="mt-6 border border-mts-border bg-mts-bg/40 p-5 space-y-4">
              <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">
                Нижняя полоса поверх hero (соцсети и ссылки)
              </h3>
              <p class="font-body text-xs leading-relaxed text-mts-text-secondary">
                Как на референсе: тонкая полоса внизу первого экрана поверх фона. Ссылки на соцсети и разделы задаются одинаково для обеих локалей (URL / путь);
                подписи текстовых ссылок — отдельно для RU и EN на соответствующей вкладке языка.
              </p>
              <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
                <input v-model="d.heroOverlayRow!.enabled" type="checkbox" class="mts-checkbox" />
                Показывать полосу на главной
              </label>
              <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
                <input v-model="d.heroOverlayRow!.showLanguageSwitch" type="checkbox" class="mts-checkbox" />
                Показывать переключатель языка в этой полосе
              </label>

              <div>
                <p :class="sectionLabel">Иконки и ссылки на соцсети</p>
                <div class="space-y-3">
                  <div
                    v-for="(soc, si) in d.heroOverlayRow!.socialLinks"
                    :key="`ov-soc-${si}`"
                    class="flex flex-wrap items-end gap-3 border border-mts-border p-3 bg-mts-bg/50"
                  >
                    <div class="min-w-[10rem] flex-1">
                      <label class="mb-1 block font-mono text-[9px] uppercase text-mts-text-secondary">Иконка</label>
                      <AdminSelect
                        :model-value="soc.iconKey"
                        :options="OVERLAY_SOCIAL_ICON_OPTIONS"
                        @update:model-value="(v) => setHeroOverlaySocialField(si, 'iconKey', String(v))"
                      />
                    </div>
                    <div class="min-w-[12rem] flex-[2]">
                      <label class="mb-1 block font-mono text-[9px] uppercase text-mts-text-secondary">URL</label>
                      <input
                        :value="soc.href"
                        type="text"
                        :class="sectionInput"
                        placeholder="https://…"
                        @input="setHeroOverlaySocialField(si, 'href', ($event.target as HTMLInputElement).value)"
                      />
                    </div>
                    <div class="flex gap-1">
                      <button
                        type="button"
                        class="p-2 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                        :disabled="si === 0"
                        aria-label="Выше"
                        @click="moveHeroOverlaySocial(si, -1)"
                      >
                        <ChevronUp class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="p-2 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                        :disabled="si === d.heroOverlayRow!.socialLinks.length - 1"
                        aria-label="Ниже"
                        @click="moveHeroOverlaySocial(si, 1)"
                      >
                        <ChevronDown class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="p-2 text-red-500/80 hover:text-red-600"
                        aria-label="Удалить"
                        @click="removeHeroOverlaySocial(si)"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  class="mt-3 flex items-center gap-2 font-mono text-xs uppercase text-mts-accent hover:underline"
                  @click="addHeroOverlaySocial"
                >
                  <Plus class="w-4 h-4" />
                  Добавить соцсеть
                </button>
              </div>

              <div>
                <p :class="sectionLabel">Текстовые ссылки</p>
                <div class="space-y-4">
                  <div
                    v-for="(lnk, li) in d.heroOverlayRow!.links"
                    :key="`ov-lnk-${li}`"
                    class="border border-mts-border p-4 bg-mts-bg/50 space-y-3"
                  >
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="font-mono text-[10px] uppercase text-mts-text-secondary">Ссылка {{ li + 1 }}</span>
                      <div class="flex gap-1">
                        <button
                          type="button"
                          class="p-1.5 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                          :disabled="li === 0"
                          aria-label="Выше"
                          @click="moveHeroOverlayNavLink(li, -1)"
                        >
                          <ChevronUp class="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          class="p-1.5 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                          :disabled="li === d.heroOverlayRow!.links.length - 1"
                          aria-label="Ниже"
                          @click="moveHeroOverlayNavLink(li, 1)"
                        >
                          <ChevronDown class="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          class="p-1.5 text-red-500/80 hover:text-red-600"
                          aria-label="Удалить"
                          @click="removeHeroOverlayNavLink(li)"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <AdminNavPathPick
                      :model-value="lnk.path"
                      :path-options="pathOptions"
                      input-placeholder="/contacts или https://…"
                      @update:model-value="(p) => setHeroOverlayNavPath(li, p)"
                    />
                    <div class="grid gap-3 md:grid-cols-2">
                      <div>
                        <label :class="sectionLabel">Подпись (RU)</label>
                        <AdminThemedTextField v-model="lnk.label.ru" :multiline="false" />
                      </div>
                      <div>
                        <label :class="sectionLabel">Подпись (EN)</label>
                        <AdminThemedTextField v-model="lnk.label.en" :multiline="false" />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  class="mt-3 flex items-center gap-2 font-mono text-xs uppercase text-mts-accent hover:underline"
                  @click="addHeroOverlayNavLink"
                >
                  <Plus class="w-4 h-4" />
                  Добавить ссылку
                </button>
              </div>
            </div>

            <div class="mt-4 border border-mts-border bg-mts-bg/40 p-4 space-y-4">
              <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">Карточка «В цифрах» (внутри hero)</h3>
              <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
                <input v-model="d.showStatsCard" type="checkbox" class="mts-checkbox" />
                Показывать карточку в Hero
              </label>
              <div><label :class="sectionLabel">Заголовок карточки</label><AdminThemedTextField v-model="d.statsCard.label" :multiline="false" /></div>
              <div class="space-y-3">
                <div v-for="(item, i) in d.statsCard.items" :key="i" class="border border-mts-border p-4 bg-mts-bg/50">
                  <div class="flex items-center justify-between mb-3">
                    <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Показатель {{ i + 1 }}</span>
                    <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeStat(i)"><Trash2 class="w-4 h-4" /></button>
                  </div>
                  <div class="grid md:grid-cols-3 gap-3">
                    <div><label :class="sectionLabel">Иконка</label><AdminSelect v-model="item.icon" :options="STAT_ICON_OPTIONS" /></div>
                    <div><label :class="sectionLabel">Значение</label><AdminThemedTextField v-model="item.value" :multiline="false" /></div>
                    <div><label :class="sectionLabel">Подпись</label><AdminThemedTextField v-model="item.label" :multiline="false" /></div>
                  </div>
                </div>
                <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addStat"><Plus class="w-4 h-4" /> Добавить показатель</button>
              </div>
            </div>
          </div>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          title="Карточки внизу первого экрана"
          :collapsed="collapsed.directions"
          @update:collapsed="(v) => (collapsed.directions = v)"
        >
          <div class="space-y-5">
            <p class="font-body text-sm text-mts-text-secondary">
              Эти карточки находятся поверх hero внизу первого экрана. На сайте они берутся из блока
              <span class="font-mono text-mts-text">directions.rows</span>.
            </p>

            <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
              <input
                type="checkbox"
                class="mts-checkbox"
                :checked="(d.directions.showCardsBlock ?? true) === true"
                @change="(e) => setDirectionsShowCardsBlock(((e.target as HTMLInputElement).checked))"
              />
              Показывать секцию «Чем мы занимаемся» под первым экраном
            </label>

            <div>
              <label :class="sectionLabel">Метка секции ниже на странице</label>
              <AdminThemedTextField v-model="d.directions.label" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Заголовок секции ниже на странице</label>
              <AdminThemeTitleEditor v-model="d.directions.headingFormatted" />
            </div>

            <div class="space-y-4">
              <div
                v-for="(row, i) in d.directions.rows"
                :key="`direction-${i}`"
                class="border border-mts-border bg-mts-bg/40 p-5"
              >
                <div class="mb-4 flex items-center justify-between gap-3">
                  <h3 class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">
                    Карточка {{ i + 1 }}
                  </h3>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="p-1.5 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                      :disabled="i === 0"
                      aria-label="Выше"
                      @click="moveDirectionRow(i, -1)"
                    >
                      <ChevronUp class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-mts-text-secondary hover:text-mts-accent disabled:opacity-30"
                      :disabled="i === d.directions.rows.length - 1"
                      aria-label="Ниже"
                      @click="moveDirectionRow(i, 1)"
                    >
                      <ChevronDown class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-red-500/80 hover:text-red-600"
                      aria-label="Удалить"
                      @click="removeDirectionRow(i)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <label :class="sectionLabel">Название</label>
                    <AdminThemedTextField v-model="row.title" :multiline="false" />
                  </div>
                  <div>
                    <label :class="sectionLabel">CTA</label>
                    <AdminThemedTextField v-model="row.cta" :multiline="false" />
                  </div>
                </div>
                <div class="mt-4">
                  <label :class="sectionLabel">Описание</label>
                  <AdminThemedTextField v-model="row.description" />
                </div>
                <div class="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label :class="sectionLabel">Заголовок в Hero при наведении</label>
                    <AdminThemedTextField
                      v-model="row.hoverTitle"
                      :multiline="false"
                      placeholder="Если пусто, используется название карточки"
                    />
                  </div>
                  <div>
                    <label :class="sectionLabel">Описание в Hero при наведении</label>
                    <AdminThemedTextField
                      v-model="row.hoverDescription"
                      placeholder="Если пусто, используется описание карточки"
                    />
                  </div>
                </div>
                <div class="mt-4">
                  <AdminHeroImageField
                    v-model="row.heroImage"
                    label="Фон Hero при выборе карточки"
                    hint="Если не задано, останется общий фон первого экрана."
                  />
                </div>
                <div class="mt-4">
                  <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Ссылка</p>
                  <AdminNavPathPick v-model="row.href" :path-options="pathOptions" input-placeholder="/services" />
                </div>

                <div class="mt-4 space-y-2 border-t border-mts-border pt-4">
                  <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                    Где показывать эту карточку
                  </p>
                  <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
                    <input
                      type="checkbox"
                      class="mts-checkbox"
                      :checked="row.hideInHero !== true"
                      @change="(e) => setDirectionRowFlag(i, 'hideInHero', !((e.target as HTMLInputElement).checked))"
                    />
                    Показывать в hero-полосе под первым экраном
                  </label>
                  <label class="flex cursor-pointer items-center gap-2 font-body text-sm text-mts-text">
                    <input
                      type="checkbox"
                      class="mts-checkbox"
                      :checked="row.hideInCardsBlock !== true"
                      @change="(e) => setDirectionRowFlag(i, 'hideInCardsBlock', !((e.target as HTMLInputElement).checked))"
                    />
                    Показывать в секции «Чем мы занимаемся» (с описанием и CTA)
                  </label>
                </div>
              </div>

              <button
                type="button"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
                @click="addDirectionRow"
              >
                <Plus class="w-4 h-4" />
                Добавить карточку
              </button>
            </div>
          </div>
        </AdminCollapsibleSection>

        <AdminCustomSectionsEditor
          :model-value="d.customSections ?? []"
          @update:model-value="(v) => (d.customSections = v)"
        />

        <section class="bg-white border border-mts-border shadow-tech relative p-6 space-y-4">
          <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.showInquiryForm" type="checkbox" class="mts-checkbox" />
            Показать форму заявки внизу главной страницы
          </label>
          <label
            v-if="d.showInquiryForm"
            class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text"
          >
            <input v-model="d.hideInquiryFormIntro" type="checkbox" class="mts-checkbox" />
            Скрыть блок над карточкой («Заявка», заголовок и лид)
          </label>
          <label
            v-if="d.showInquiryForm"
            class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text"
          >
            <input v-model="d.hideInquiryFormCardHeading" type="checkbox" class="mts-checkbox" />
            Скрыть заголовок и подписи внутри белой карточки (над полями формы)
          </label>
          <AdminPageInquiryConfigEditor v-if="d.showInquiryForm" v-model="d.inquiryForm" />
          <div class="border-t border-mts-border pt-4">
            <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
              <input v-model="d.hideFooter" type="checkbox" class="mts-checkbox" />
              Скрыть подвал на этой странице
            </label>
          </div>
        </section>

        <div class="flex justify-end">
          <button type="button" :disabled="saving" class="btn-primary px-8 disabled:opacity-50" @click="submit">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
        </div>
      </div>
    </main>
  </div>
</template>
