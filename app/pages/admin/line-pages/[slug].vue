<script setup lang="ts">
import { ArrowLeft, Loader2, ChevronDown, Plus, Trash2 } from 'lucide-vue-next'
import type { ContentPage, CrewingPageData, MarineContentLocale } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import { defaultLinePageData, mergeLinePageData } from '~/utils/pageDefaults'
import AdminSelect from '~/components/admin/AdminSelect.vue'
import { crewingIconSelectOptions } from '~/utils/crewingIcons'
import {
  isLineMarketingPageSlug,
  LINE_MARKETING_PAGE_ADMIN_LABELS,
  LINE_MARKETING_PAGE_CONTENT_TITLES,
} from '~/utils/lineMarketingPages'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const rawSlug = computed(() => (Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug) ?? '')

const slug = computed(() => {
  const s = rawSlug.value
  return isLineMarketingPageSlug(s) ? s : null
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { canManageContentPages } = useAdminPermissions()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

const data = ref<Record<MarineContentLocale, CrewingPageData> | null>(null)

const d = computed(() => {
  if (!data.value || !slug.value) {
    return null
  }
  return data.value[localeTab.value]
})

const collapsed = ref<Record<string, boolean>>({
  hero: false,
  directions: false,
  checklist: true,
  principles: true,
  audience: true,
})

function toggle(s: string) {
  collapsed.value[s] = !collapsed.value[s]
}

function addPrinciple() {
  if (!d.value) {
    return
  }
  d.value.principles.items.push('')
}

function removePrinciple(i: number) {
  if (!d.value || d.value.principles.items.length <= 1) {
    return
  }
  d.value.principles.items.splice(i, 1)
}

function addChecklistSection() {
  if (!d.value) {
    return
  }
  d.value.checklist.sections.push({ heading: '', points: [{ title: '', text: '' }] })
}

function removeChecklistSection(si: number) {
  if (!d.value) {
    return
  }
  d.value.checklist.sections.splice(si, 1)
}

function addChecklistPoint(si: number) {
  if (!d.value) {
    return
  }
  d.value.checklist.sections[si].points.push({ title: '', text: '' })
}

function removeChecklistPoint(si: number, pi: number) {
  if (!d.value) {
    return
  }
  d.value.checklist.sections[si].points.splice(pi, 1)
}

onMounted(async () => {
  if (!canManageContentPages.value) {
    await navigateTo('/admin')
    return
  }
  if (!slug.value) {
    await navigateTo('/admin')
    return
  }
  const s = slug.value
  const initial: Record<MarineContentLocale, CrewingPageData> = {
    ru: defaultLinePageData(s, 'ru'),
    en: defaultLinePageData(s, 'en'),
  }
  data.value = initial
  try {
    const page = await api.contentPages.getPublicBySlug(s)
    if (page) {
      existingId.value = page.id
      const managed = await api.contentPages.getManageById(page.id)
      for (const loc of MARINE_CONTENT_LOCALES) {
        const body = managed.translations?.[loc]?.body
        if (body) {
          try {
            const parsed = JSON.parse(body) as unknown
            if (data.value) {
              data.value[loc] = mergeLinePageData(loc, parsed, s)
            }
          } catch {
            /* keep defaults */
          }
        }
      }
    }
  } catch {
    /* no page yet */
  } finally {
    loading.value = false
  }
})

async function submit() {
  const s = slug.value
  if (!s || !data.value) {
    return
  }
  const inq = data.value[localeTab.value].showInquiryForm
  const heroBg = data.value[localeTab.value].heroBackgroundImage
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].showInquiryForm = inq
    data.value[loc].heroBackgroundImage = heroBg
  }
  saving.value = true
  try {
    const translations = {} as Record<
      MarineContentLocale,
      { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }
    >
    for (const loc of MARINE_CONTENT_LOCALES) {
      const titles = LINE_MARKETING_PAGE_CONTENT_TITLES[s]
      translations[loc] = {
        title: titles[loc],
        excerpt: '',
        body: JSON.stringify(data.value[loc]),
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
      }
    }
    if (existingId.value) {
      await api.contentPages.update(existingId.value, {
        slug: s,
        isPublished: true,
        showInquiryForm: inq,
        translations,
      })
    } else {
      const created = await api.contentPages.create({
        slug: s,
        isPublished: true,
        sortOrder: 0,
        showInquiryForm: inq,
        translations,
      })
      existingId.value = (created as ContentPage).id
    }
    adminToast.success(`Страница «${LINE_MARKETING_PAGE_ADMIN_LABELS[s]}» сохранена`)
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally {
    saving.value = false
  }
}

const sectionLabel = 'mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary'
const sectionInput =
  'w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none'

const adminPageTitle = computed(() => (slug.value ? LINE_MARKETING_PAGE_ADMIN_LABELS[slug.value] : ''))
const localePath = useLocalePath()
const previewPath = computed(() => (slug.value ? localePath(`/${slug.value}`) : localePath('/')))
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-12">
        <div class="flex flex-1 items-center gap-4">
          <NuxtLink to="/admin" class="text-mts-text-secondary transition-colors hover:text-mts-accent">
            <ArrowLeft class="h-5 w-5" />
          </NuxtLink>
          <h1 class="font-display text-xl text-mts-text">Страница «{{ adminPageTitle }}»</h1>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink
            v-if="slug"
            :to="previewPath"
            target="_blank"
            class="font-body text-sm text-mts-text-secondary transition-colors hover:text-mts-accent"
            >Открыть на сайте ↗</NuxtLink
          >
          <button type="button" :disabled="saving || loading || !slug" class="btn-primary px-6 disabled:opacity-50" @click="submit">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8 lg:px-12">
      <div v-if="loading || !d" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <!-- Hero -->
        <section class="relative border border-mts-border bg-white shadow-tech">
          <CommonAccentCorners />
          <button type="button" class="flex w-full items-center justify-between p-6" @click="toggle('hero')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">1. Hero</h2>
            <ChevronDown class="h-4 w-4 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': !collapsed.hero }" />
          </button>
          <div v-show="!collapsed.hero" class="space-y-4 border-t border-mts-border px-6 pb-6 pt-4">
            <div>
              <label :class="sectionLabel">Подпись над заголовком (как в макете)</label>
              <input v-model="d.hero.label" type="text" :class="sectionInput" />
            </div>
            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <label :class="sectionLabel">Заголовок (начало)</label>
                <input v-model="d.hero.title" type="text" :class="sectionInput" />
              </div>
              <div>
                <label :class="sectionLabel">Акцент (цветной)</label>
                <input v-model="d.hero.titleAccent" type="text" :class="sectionInput" />
              </div>
              <div>
                <label :class="sectionLabel">Окончание</label>
                <input v-model="d.hero.titleEnd" type="text" :class="sectionInput" />
              </div>
            </div>
            <div>
              <label :class="sectionLabel">Лид</label>
              <textarea v-model="d.hero.lead" rows="4" :class="sectionInput" />
            </div>
            <AdminHeroImageField v-model="d.heroBackgroundImage" label="Фон hero (по умолчанию из макета страницы)" />
          </div>
        </section>

        <!-- Directions -->
        <section class="relative border border-mts-border bg-white shadow-tech">
          <CommonAccentCorners />
          <button type="button" class="flex w-full items-center justify-between p-6" @click="toggle('directions')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">2. Направления работы</h2>
            <ChevronDown
              class="h-4 w-4 text-mts-text-secondary transition-transform"
              :class="{ 'rotate-180': !collapsed.directions }"
            />
          </button>
          <div v-show="!collapsed.directions" class="space-y-6 border-t border-mts-border px-6 pb-6 pt-4">
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <input v-model="d.directionsSection.title" type="text" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Лид под заголовком</label>
              <textarea v-model="d.directionsSection.lead" rows="3" :class="sectionInput" />
            </div>
            <div
              v-for="(row, i) in d.directions"
              :key="i"
              class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
            >
              <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Карточка {{ i + 1 }}</p>
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label :class="sectionLabel">Иконка</label>
                  <AdminSelect v-model="row.icon" :options="crewingIconSelectOptions" />
                </div>
                <div>
                  <label :class="sectionLabel">Заголовок</label>
                  <input v-model="row.title" type="text" :class="sectionInput" />
                </div>
              </div>
              <div>
                <label :class="sectionLabel">Текст</label>
                <textarea v-model="row.text" rows="3" :class="sectionInput" />
              </div>
            </div>
          </div>
        </section>

        <!-- Checklist -->
        <section class="relative border border-mts-border bg-white shadow-tech">
          <CommonAccentCorners />
          <button type="button" class="flex w-full items-center justify-between p-6" @click="toggle('checklist')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">3. Чек-лист</h2>
            <ChevronDown
              class="h-4 w-4 text-mts-text-secondary transition-transform"
              :class="{ 'rotate-180': !collapsed.checklist }"
            />
          </button>
          <div v-show="!collapsed.checklist" class="space-y-4 border-t border-mts-border px-6 pb-6 pt-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label :class="sectionLabel">Текст кнопки (свёрнуто)</label>
                <input v-model="d.checklist.toggleShow" type="text" :class="sectionInput" />
              </div>
              <div>
                <label :class="sectionLabel">Текст кнопки (развёрнуто)</label>
                <input v-model="d.checklist.toggleHide" type="text" :class="sectionInput" />
              </div>
            </div>
            <div>
              <label :class="sectionLabel">Вводный абзац (показывается в раскрытом блоке, если есть пункты)</label>
              <textarea v-model="d.checklist.intro" rows="3" :class="sectionInput" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">
              На сайте блок целиком скрыт, если нет ни одного пункта с непустым заголовком или текстом.
            </p>
            <div
              v-for="(sec, si) in d.checklist.sections"
              :key="si"
              class="space-y-4 border border-mts-border bg-mts-bg/50 p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Секция {{ si + 1 }}</p>
                <button
                  type="button"
                  class="btn-secondary shrink-0 px-2 py-1 text-xs text-red-700"
                  @click="removeChecklistSection(si)"
                >
                  Удалить секцию
                </button>
              </div>
              <div>
                <label :class="sectionLabel">Подзаголовок секции (I, II, …)</label>
                <input v-model="sec.heading" type="text" :class="sectionInput" />
              </div>
              <div
                v-for="(pt, pi) in sec.points"
                :key="pi"
                class="space-y-2 border border-dashed border-mts-border bg-white p-3"
              >
                <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Пункт {{ pi + 1 }}</p>
                <div>
                  <label :class="sectionLabel">Заголовок пункта</label>
                  <input v-model="pt.title" type="text" :class="sectionInput" />
                </div>
                <div>
                  <label :class="sectionLabel">Текст</label>
                  <textarea v-model="pt.text" rows="2" :class="sectionInput" />
                </div>
                <button
                  type="button"
                  class="btn-secondary inline-flex items-center gap-1 text-xs text-red-700"
                  @click="removeChecklistPoint(si, pi)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  Удалить пункт
                </button>
              </div>
              <button type="button" class="btn-secondary inline-flex items-center gap-2 text-sm" @click="addChecklistPoint(si)">
                <Plus class="h-4 w-4" />
                Добавить пункт в секцию
              </button>
            </div>
            <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addChecklistSection">
              <Plus class="h-4 w-4" />
              Добавить секцию
            </button>
          </div>
        </section>

        <!-- Principles -->
        <section class="relative border border-mts-border bg-white shadow-tech">
          <CommonAccentCorners />
          <button type="button" class="flex w-full items-center justify-between p-6" @click="toggle('principles')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">4. Принципы</h2>
            <ChevronDown
              class="h-4 w-4 text-mts-text-secondary transition-transform"
              :class="{ 'rotate-180': !collapsed.principles }"
            />
          </button>
          <div v-show="!collapsed.principles" class="space-y-4 border-t border-mts-border px-6 pb-6 pt-4">
            <div>
              <label :class="sectionLabel">Заголовок блока</label>
              <input v-model="d.principles.title" type="text" :class="sectionInput" />
            </div>
            <div v-for="(line, pi) in d.principles.items" :key="pi" class="flex gap-2">
              <textarea v-model="d.principles.items[pi]" rows="2" :class="[sectionInput, 'flex-1']" />
              <button
                v-if="d.principles.items.length > 1"
                type="button"
                class="btn-secondary shrink-0 px-3 text-red-700"
                aria-label="Удалить"
                @click="removePrinciple(pi)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
            <button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addPrinciple">
              <Plus class="h-4 w-4" />
              Добавить пункт
            </button>
          </div>
        </section>

        <!-- Audience -->
        <section class="relative border border-mts-border bg-white shadow-tech">
          <CommonAccentCorners />
          <button type="button" class="flex w-full items-center justify-between p-6" @click="toggle('audience')">
            <h2 class="font-mono text-xs uppercase tracking-widest text-mts-text-secondary">5. Кому подходит + CTA</h2>
            <ChevronDown
              class="h-4 w-4 text-mts-text-secondary transition-transform"
              :class="{ 'rotate-180': !collapsed.audience }"
            />
          </button>
          <div v-show="!collapsed.audience" class="space-y-4 border-t border-mts-border px-6 pb-6 pt-4">
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <input v-model="d.audience.title" type="text" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 1</label>
              <textarea v-model="d.audience.paragraph1" rows="4" :class="sectionInput" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 2</label>
              <textarea v-model="d.audience.paragraph2" rows="4" :class="sectionInput" />
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label :class="sectionLabel">Текст кнопки</label>
                <input v-model="d.audience.ctaLabel" type="text" :class="sectionInput" />
              </div>
              <div>
                <label :class="sectionLabel">Ссылка кнопки (путь, напр. /contacts)</label>
                <input v-model="d.audience.ctaHref" type="text" :class="sectionInput" />
              </div>
            </div>
          </div>
        </section>

        <section class="relative border border-mts-border bg-white p-6 shadow-tech">
          <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.showInquiryForm" type="checkbox" class="mts-checkbox" />
            Показать форму заявки внизу страницы
          </label>
        </section>

        <div class="flex justify-end">
          <button type="button" :disabled="saving" class="btn-primary px-8 disabled:opacity-50" @click="submit">
            {{ saving ? 'Сохранение…' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
