<script setup lang="ts">
import { ArrowLeft, Loader2, Plus } from 'lucide-vue-next'
import AdminCollapsibleSection from '~/components/admin/AdminCollapsibleSection.vue'
import AdminSelect from '~/components/admin/AdminSelect.vue'
import type { ListingPageData, ContentPage, MarineContentLocale, PageBreadcrumbTone } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import AdminThemeTitleEditor from '~/components/admin/AdminThemeTitleEditor.vue'
import {
  LISTING_SECTION_ADMIN_LABELS,
  defaultListingData,
  mergeListingPageData,
  listingBuiltinOrder,
} from '~/utils/pageDefaults'
import { isSectionVisible, moveOrderItem, resolveSectionOrder } from '~/utils/sectionVisibility'
import {
  SERVICES_MARKETING_V2_SECTION_ORDER,
  SERVICES_V2_SECTION_ADMIN_LABELS,
  defaultServicesPageLegacyListingData,
  defaultServicesPageListingData,
  normalizeServicesV2Payload,
} from '~/utils/servicesMarketingPageDefaults'
import { themeTitleTriple } from '~/utils/themeFormattedTitle'
import { HERO_BREADCRUMB_TONE_ADMIN_OPTIONS } from '~/utils/pageBreadcrumbTone'

const SLUG = 'services-page'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const editorRevision = ref(0)

const data = ref<Record<MarineContentLocale, ListingPageData>>({
  ru: defaultListingData(SLUG, 'ru'),
  en: defaultListingData(SLUG, 'en'),
})

const d = computed(() => data.value[localeTab.value])

const isServicesV2 = computed(() => d.value.servicesPageLayout === 'v2')

const collapsed = ref<Record<string, boolean>>({
  hero: false,
  reach: true,
  solutions: true,
  advantages: true,
  guarantees: true,
  preForm: true,
  listing: true,
  cta: true,
})
function toggle(s: string) {
  collapsed.value[s] = !collapsed.value[s]
}

const effectiveSectionOrder = computed<string[]>(() => {
  const cur = data.value[localeTab.value]
  return resolveSectionOrder(cur.sectionOrder, listingBuiltinOrder(SLUG, cur), cur.customSections)
})

function sectionVisible(id: string): boolean {
  return isSectionVisible(data.value[localeTab.value].sectionVisibility, id)
}

function setSectionVisible(id: string, v: boolean) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const cur = data.value[loc].sectionVisibility ?? {}
    data.value[loc].sectionVisibility = { ...cur, [id]: v }
  }
}

function indexInOrder(id: string): number {
  return effectiveSectionOrder.value.indexOf(id)
}

function canMove(id: string, delta: number): boolean {
  const idx = indexInOrder(id)
  if (idx < 0) return false
  const j = idx + delta
  return j >= 0 && j < effectiveSectionOrder.value.length
}

function moveSection(id: string, delta: number) {
  const order = effectiveSectionOrder.value
  const idx = order.indexOf(id)
  if (idx < 0) return
  const next = moveOrderItem(order, idx, delta)
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].sectionOrder = [...next]
  }
}

function sectionTitle(id: string): string {
  const pos = indexInOrder(id) + 2
  const label = isServicesV2.value
    ? (SERVICES_V2_SECTION_ADMIN_LABELS[id as keyof typeof SERVICES_V2_SECTION_ADMIN_LABELS]
      ?? LISTING_SECTION_ADMIN_LABELS[id as keyof typeof LISTING_SECTION_ADMIN_LABELS]
      ?? id)
    : (LISTING_SECTION_ADMIN_LABELS[id as keyof typeof LISTING_SECTION_ADMIN_LABELS] ?? id)
  return `${pos}. ${label}`
}

function setPageLayout(mode: 'legacy' | 'v2') {
  const shared = {
    showInquiryForm: data.value.ru.showInquiryForm,
    heroImage: data.value.ru.heroImage,
    hideInquiryFormCardHeading: data.value.ru.hideInquiryFormCardHeading,
    hideInquiryFormIntro: data.value.ru.hideInquiryFormIntro,
  }
  if (mode === 'v2') {
    for (const loc of MARINE_CONTENT_LOCALES) {
      const cur = data.value[loc]
      const fresh = defaultServicesPageListingData(loc)
      data.value[loc] = {
        ...fresh,
        showInquiryForm: shared.showInquiryForm,
        hideInquiryFormCardHeading: shared.hideInquiryFormCardHeading,
        hideInquiryFormIntro: shared.hideInquiryFormIntro,
        heroImage: shared.heroImage,
        customSections: JSON.parse(JSON.stringify(cur.customSections ?? [])),
      }
    }
  }
  else {
    for (const loc of MARINE_CONTENT_LOCALES) {
      const cur = data.value[loc]
      data.value[loc] = {
        ...defaultServicesPageLegacyListingData(loc),
        hero: { ...cur.hero },
        cta: cur.cta ? { ...cur.cta } : { title: '', buttonText: '' },
        showInquiryForm: cur.showInquiryForm,
        hideInquiryFormCardHeading: cur.hideInquiryFormCardHeading,
        hideInquiryFormIntro: cur.hideInquiryFormIntro,
        heroImage: cur.heroImage,
        customSections: JSON.parse(JSON.stringify(cur.customSections ?? [])),
      }
    }
  }
  editorRevision.value += 1
}

function ensureHeroButtonsArray() {
  const cur = data.value[localeTab.value]
  if (!Array.isArray(cur.heroButtons)) {
    cur.heroButtons = []
  }
  if (cur.heroButtons.length > 2) {
    cur.heroButtons.splice(2)
  }
}

function addHeroButton() {
  ensureHeroButtonsArray()
  const cur = data.value[localeTab.value]
  if (cur.heroButtons!.length >= 2) return
  cur.heroButtons!.push({ label: '', href: '' })
}

function removeHeroButton(i: number) {
  ensureHeroButtonsArray()
  data.value[localeTab.value].heroButtons!.splice(i, 1)
}

function addSolutionCard() {
  const v = data.value[localeTab.value].servicesV2
  if (!v || v.sec3Solutions.cards.length >= 4) return
  v.sec3Solutions.cards.push({ title: '', text: '' })
}

function removeSolutionCard(i: number) {
  const v = data.value[localeTab.value].servicesV2
  if (!v || v.sec3Solutions.cards.length <= 1) return
  v.sec3Solutions.cards.splice(i, 1)
}

function addAdvantageCard() {
  const v = data.value[localeTab.value].servicesV2
  if (!v || v.sec4Advantages.cards.length >= 4) return
  v.sec4Advantages.cards.push({ title: '', text: '' })
}

function removeAdvantageCard(i: number) {
  const v = data.value[localeTab.value].servicesV2
  if (!v || v.sec4Advantages.cards.length <= 1) return
  v.sec4Advantages.cards.splice(i, 1)
}

onMounted(async () => {
  try {
    const page = await api.contentPages.getPublicBySlug(SLUG)
    if (page) {
      existingId.value = page.id
      const managed = await api.contentPages.getManageById(page.id)
      for (const loc of MARINE_CONTENT_LOCALES) {
        const body = managed.translations?.[loc]?.body
        if (body) {
          try {
            const parsed = JSON.parse(body)
            if (parsed?.hero) data.value[loc] = mergeListingPageData(SLUG, loc, parsed)
          } catch { /* keep defaults */ }
        }
      }
    }
  } catch { /* no existing page */ }
  finally {
    editorRevision.value += 1
    loading.value = false
  }
})

async function submit() {
  if (import.meta.client && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  await nextTick()
  const src = data.value[localeTab.value]
  const inq = src.showInquiryForm
  const heroImg = src.heroImage
  const hideCard = src.hideInquiryFormCardHeading
  const hideIntro = src.hideInquiryFormIntro
  const order = src.sectionOrder
  const visibility = src.sectionVisibility
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].showInquiryForm = inq
    data.value[loc].heroImage = heroImg
    data.value[loc].hideInquiryFormCardHeading = hideCard
    data.value[loc].hideInquiryFormIntro = hideIntro
    data.value[loc].sectionOrder = order ? [...order] : undefined
    data.value[loc].sectionVisibility = visibility ? { ...visibility } : undefined
  }
  saving.value = true
  try {
    const translations = {} as Record<MarineContentLocale, { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }>
    for (const loc of MARINE_CONTENT_LOCALES) {
      const page = data.value[loc]
      normalizeServicesV2Payload(page)
      if (page.servicesPageLayout === 'v2' && page.servicesV2) {
        page.hero.lead = page.servicesV2.sec1Hero.lead
        page.hero.titleFormatted = themeTitleTriple(page.servicesV2.sec1Hero.title, '', '')
      }
      translations[loc] = {
        title: loc === 'ru' ? 'Судоремонт' : 'Ship Repair',
        excerpt: '', body: JSON.stringify(page),
        seoTitle: '', seoDescription: '', seoKeywords: '',
      }
    }
    if (existingId.value) {
      await api.contentPages.update(existingId.value, { slug: SLUG, isPublished: true, translations })
    }
    else {
      const created = await api.contentPages.create({ slug: SLUG, isPublished: true, sortOrder: 0, translations })
      existingId.value = (created as ContentPage).id
    }
    adminToast.success('Страница «Судоремонт» сохранена')
  }
  catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  }
  finally { saving.value = false }
}

const sectionLabel = 'block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2'
const sectionInput = 'w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent'
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-mts-text-secondary hover:text-mts-accent transition-colors"><ArrowLeft class="w-5 h-5" /></NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Страница «Судоремонт»</h1>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/services" target="_blank" class="font-body text-sm text-mts-text-secondary hover:text-mts-accent transition-colors">Открыть на сайте ↗</NuxtLink>
            <button type="button" :disabled="saving || loading" class="btn-primary px-6 disabled:opacity-50" @click="submit">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24"><Loader2 class="w-8 h-8 text-mts-accent animate-spin" /></div>
      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <section class="bg-white border border-mts-border shadow-tech relative p-6 space-y-3">
          <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Макет листинга</p>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="btn-secondary px-4 py-2 text-sm"
              :class="isServicesV2 ? 'ring-2 ring-mts-accent' : ''"
              @click="setPageLayout('v2')"
            >
              Маркетинг v2 (судоремонт)
            </button>
            <button
              type="button"
              class="btn-secondary px-4 py-2 text-sm"
              :class="!isServicesV2 ? 'ring-2 ring-mts-accent' : ''"
              @click="setPageLayout('legacy')"
            >
              Классический
            </button>
          </div>
          <p class="font-body text-xs text-mts-text-secondary">
            v2 — секции охват, решения, преимущества, гарантии, микрокопия перед формой и каталог услуг. Классический — только hero, список и отдельная кнопка CTA.
          </p>
        </section>

        <!-- 1. HERO -->
        <AdminCollapsibleSection
          title="1. Hero-блок"
          :collapsed="collapsed.hero"
          @update:collapsed="(v) => (collapsed.hero = v)"
        >
          <div class="space-y-4">
            <AdminHeroImageField v-model="d.heroImage" />

            <div v-if="isServicesV2">
              <label :class="sectionLabel">Цвет хлебных крошек в hero</label>
              <AdminSelect
                :model-value="d.heroBreadcrumbTone ?? 'auto'"
                :options="HERO_BREADCRUMB_TONE_ADMIN_OPTIONS"
                @update:model-value="(v) => (d.heroBreadcrumbTone = v as PageBreadcrumbTone)"
              />
              <p class="mt-2 font-body text-xs text-mts-text-secondary">
                «Авто» — светлый текст на затемнённом фоне маркетингового hero.
              </p>
            </div>

            <template v-if="isServicesV2 && d.servicesV2">
              <div>
                <label :class="sectionLabel">Заголовок (H1)</label>
                <AdminThemedTextField
                  :key="`svc-hero-title-${localeTab}-${editorRevision}`"
                  v-model="d.servicesV2.sec1Hero.title"
                  :multiline="false"
                />
              </div>
              <div>
                <label :class="sectionLabel">Лид</label>
                <AdminThemedTextField
                  :key="`svc-hero-lead-${localeTab}-${editorRevision}`"
                  v-model="d.servicesV2.sec1Hero.lead"
                />
              </div>
              <div>
                <label :class="sectionLabel">Основной абзац</label>
                <AdminRichTextEditor v-model="d.servicesV2.sec1Hero.body" />
              </div>
            </template>
            <template v-else>
              <div>
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemeTitleEditor
                  :key="`services-hero-title-${localeTab}-${editorRevision}`"
                  v-model="d.hero.titleFormatted"
                />
              </div>
              <div>
                <label :class="sectionLabel">Лид</label>
                <AdminThemedTextField
                  :key="`services-hero-lead-${localeTab}-${editorRevision}`"
                  v-model="d.hero.lead"
                />
              </div>
            </template>

            <div v-if="isServicesV2" class="space-y-4 border-t border-mts-border pt-4">
              <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Кнопки в hero (до 2)</p>
              <p class="font-body text-xs text-mts-text-secondary">
                Форма внизу: <code class="font-mono text-[11px]">#page-inquiry</code>; внутренние пути —
                <code class="font-mono text-[11px]">/contacts</code> и т.д.
              </p>
              <div
                v-for="(row, hi) in (d.heroButtons ?? [])"
                :key="hi"
                class="space-y-2 rounded border border-mts-border bg-mts-bg/50 p-3"
              >
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Кнопка {{ hi + 1 }}</p>
                  <button
                    type="button"
                    class="btn-secondary shrink-0 px-2 py-1 text-xs text-red-700"
                    @click="removeHeroButton(hi)"
                  >
                    Удалить
                  </button>
                </div>
                <div>
                  <label :class="sectionLabel">Подпись</label>
                  <AdminThemedTextField v-model="row.label" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Ссылка</label>
                  <input v-model="row.href" type="text" :class="sectionInput" placeholder="#page-inquiry">
                </div>
              </div>
              <button
                v-if="(d.heroButtons ?? []).length < 2"
                type="button"
                class="btn-secondary inline-flex items-center gap-2"
                @click="addHeroButton"
              >
                <Plus class="h-4 w-4" />
                Добавить кнопку
              </button>
            </div>
          </div>
        </AdminCollapsibleSection>

        <template v-if="isServicesV2 && d.servicesV2">
          <AdminCollapsibleSection
            :title="sectionTitle('reach')"
            :collapsed="collapsed.reach"
            :visible="sectionVisible('reach')"
            :can-move-up="canMove('reach', -1)"
            :can-move-down="canMove('reach', 1)"
            @update:collapsed="(v) => (collapsed.reach = v)"
            @update:visible="(v) => setSectionVisible('reach', v)"
            @move-up="moveSection('reach', -1)"
            @move-down="moveSection('reach', 1)"
          >
            <div class="space-y-4">
              <div>
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemedTextField v-model="d.servicesV2.sec2Reach.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Абзац 1</label>
                <AdminRichTextEditor v-model="d.servicesV2.sec2Reach.paragraph1" />
              </div>
              <div>
                <label :class="sectionLabel">Абзац 2</label>
                <AdminRichTextEditor v-model="d.servicesV2.sec2Reach.paragraph2" />
              </div>
            </div>
          </AdminCollapsibleSection>

          <AdminCollapsibleSection
            :title="sectionTitle('solutions')"
            :collapsed="collapsed.solutions"
            :visible="sectionVisible('solutions')"
            :can-move-up="canMove('solutions', -1)"
            :can-move-down="canMove('solutions', 1)"
            @update:collapsed="(v) => (collapsed.solutions = v)"
            @update:visible="(v) => setSectionVisible('solutions', v)"
            @move-up="moveSection('solutions', -1)"
            @move-down="moveSection('solutions', 1)"
          >
            <div class="space-y-4">
              <div>
                <label :class="sectionLabel">Заголовок секции</label>
                <AdminThemedTextField v-model="d.servicesV2.sec3Solutions.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Вводный текст</label>
                <AdminRichTextEditor v-model="d.servicesV2.sec3Solutions.body" />
              </div>
              <p class="font-body text-xs text-mts-text-secondary">Карточки — до 4 шт.</p>
              <div
                v-for="(card, ci) in d.servicesV2.sec3Solutions.cards"
                :key="`sol-${ci}`"
                class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Карточка {{ ci + 1 }}</p>
                  <button
                    v-if="d.servicesV2.sec3Solutions.cards.length > 1"
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs text-red-700"
                    @click="removeSolutionCard(ci)"
                  >
                    Удалить
                  </button>
                </div>
                <div>
                  <label :class="sectionLabel">Название</label>
                  <AdminThemedTextField v-model="card.title" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Текст</label>
                  <AdminRichTextEditor v-model="card.text" />
                </div>
              </div>
              <button
                v-if="d.servicesV2.sec3Solutions.cards.length < 4"
                type="button"
                class="btn-secondary inline-flex items-center gap-2"
                @click="addSolutionCard"
              >
                <Plus class="h-4 w-4" />
                Добавить карточку
              </button>
            </div>
          </AdminCollapsibleSection>

          <AdminCollapsibleSection
            :title="sectionTitle('advantages')"
            :collapsed="collapsed.advantages"
            :visible="sectionVisible('advantages')"
            :can-move-up="canMove('advantages', -1)"
            :can-move-down="canMove('advantages', 1)"
            @update:collapsed="(v) => (collapsed.advantages = v)"
            @update:visible="(v) => setSectionVisible('advantages', v)"
            @move-up="moveSection('advantages', -1)"
            @move-down="moveSection('advantages', 1)"
          >
            <div class="space-y-4">
              <div>
                <label :class="sectionLabel">Заголовок секции</label>
                <AdminThemedTextField v-model="d.servicesV2.sec4Advantages.title" :multiline="false" />
              </div>
              <p class="font-body text-xs text-mts-text-secondary">Преимущества — до 4 карточек, без вводного абзаца.</p>
              <div
                v-for="(card, ci) in d.servicesV2.sec4Advantages.cards"
                :key="`adv-${ci}`"
                class="space-y-3 border border-mts-border bg-mts-bg/50 p-4"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="font-mono text-[10px] uppercase text-mts-text-secondary">Карточка {{ ci + 1 }}</p>
                  <button
                    v-if="d.servicesV2.sec4Advantages.cards.length > 1"
                    type="button"
                    class="btn-secondary px-2 py-1 text-xs text-red-700"
                    @click="removeAdvantageCard(ci)"
                  >
                    Удалить
                  </button>
                </div>
                <div>
                  <label :class="sectionLabel">Название</label>
                  <AdminThemedTextField v-model="card.title" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Текст</label>
                  <AdminRichTextEditor v-model="card.text" />
                </div>
              </div>
              <button
                v-if="d.servicesV2.sec4Advantages.cards.length < 4"
                type="button"
                class="btn-secondary inline-flex items-center gap-2"
                @click="addAdvantageCard"
              >
                <Plus class="h-4 w-4" />
                Добавить карточку
              </button>
            </div>
          </AdminCollapsibleSection>

          <AdminCollapsibleSection
            :title="sectionTitle('guarantees')"
            :collapsed="collapsed.guarantees"
            :visible="sectionVisible('guarantees')"
            :can-move-up="canMove('guarantees', -1)"
            :can-move-down="canMove('guarantees', 1)"
            @update:collapsed="(v) => (collapsed.guarantees = v)"
            @update:visible="(v) => setSectionVisible('guarantees', v)"
            @move-up="moveSection('guarantees', -1)"
            @move-down="moveSection('guarantees', 1)"
          >
            <div class="space-y-4">
              <div>
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemedTextField v-model="d.servicesV2.sec5Guarantees.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Абзац 1</label>
                <AdminRichTextEditor v-model="d.servicesV2.sec5Guarantees.paragraph1" />
              </div>
              <div>
                <label :class="sectionLabel">Абзац 2</label>
                <AdminRichTextEditor v-model="d.servicesV2.sec5Guarantees.paragraph2" />
              </div>
            </div>
          </AdminCollapsibleSection>

          <AdminCollapsibleSection
            :title="sectionTitle('preForm')"
            :collapsed="collapsed.preForm"
            :visible="sectionVisible('preForm')"
            :can-move-up="canMove('preForm', -1)"
            :can-move-down="canMove('preForm', 1)"
            @update:collapsed="(v) => (collapsed.preForm = v)"
            @update:visible="(v) => setSectionVisible('preForm', v)"
            @move-up="moveSection('preForm', -1)"
            @move-down="moveSection('preForm', 1)"
          >
            <div class="space-y-4">
              <div>
                <label :class="sectionLabel">Заголовок перед формой</label>
                <AdminThemedTextField v-model="d.servicesV2.sec6PreForm.title" :multiline="false" />
              </div>
              <div>
                <label :class="sectionLabel">Текст</label>
                <AdminRichTextEditor v-model="d.servicesV2.sec6PreForm.body" />
              </div>
            </div>
          </AdminCollapsibleSection>
        </template>

        <AdminCollapsibleSection
          :title="sectionTitle('listing')"
          :collapsed="collapsed.listing"
          :visible="sectionVisible('listing')"
          :can-move-up="canMove('listing', -1)"
          :can-move-down="canMove('listing', 1)"
          hint="Карточки сервисов редактируются в разделе «Судоремонт»."
          @update:collapsed="(v) => (collapsed.listing = v)"
          @update:visible="(v) => setSectionVisible('listing', v)"
          @move-up="moveSection('listing', -1)"
          @move-down="moveSection('listing', 1)"
        >
          <p class="font-body text-sm text-mts-text-secondary">
            Чтобы скрыть блок со списком сервисов на публичной странице — снимите «Показывать» в шапке секции (в макете v2).
          </p>
        </AdminCollapsibleSection>

        <AdminCollapsibleSection
          v-if="!isServicesV2"
          :title="sectionTitle('cta')"
          :collapsed="collapsed.cta"
          :visible="sectionVisible('cta')"
          :can-move-up="canMove('cta', -1)"
          :can-move-down="canMove('cta', 1)"
          @update:collapsed="(v) => (collapsed.cta = v)"
          @update:visible="(v) => setSectionVisible('cta', v)"
          @move-up="moveSection('cta', -1)"
          @move-down="moveSection('cta', 1)"
        >
          <div>
            <label :class="sectionLabel">Текст кнопки (ctaConsult)</label>
            <input v-model="d.cta!.buttonText" :class="sectionInput">
          </div>
        </AdminCollapsibleSection>

        <AdminCustomSectionsEditor
          :model-value="d.customSections ?? []"
          @update:model-value="(v) => (d.customSections = v)"
        />

        <section class="bg-white border border-mts-border shadow-tech relative p-6 space-y-3">
          <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.showInquiryForm" type="checkbox" class="mts-checkbox">
            Показать форму заявки внизу страницы «Судоремонт»
          </label>
          <label
            v-if="d.showInquiryForm"
            class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text"
          >
            <input v-model="d.hideInquiryFormIntro" type="checkbox" class="mts-checkbox">
            Скрыть блок над карточкой («Заявка», заголовок и лид)
          </label>
          <label v-if="d.showInquiryForm" class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.hideInquiryFormCardHeading" type="checkbox" class="mts-checkbox">
            Скрыть шапку внутри белой карточки формы
          </label>
        </section>

        <div class="flex justify-end">
          <button type="button" :disabled="saving" class="btn-primary px-8 disabled:opacity-50" @click="submit">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
        </div>
      </div>
    </main>
  </div>
</template>
