<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import AdminCollapsibleSection from '~/components/admin/AdminCollapsibleSection.vue'
import type { ListingPageData, ContentPage, MarineContentLocale } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import AdminThemeTitleEditor from '~/components/admin/AdminThemeTitleEditor.vue'
import {
  LISTING_SECTION_ADMIN_LABELS,
  defaultListingData,
  listingDefaultOrder,
  mergeListingPageData,
} from '~/utils/pageDefaults'
import { isSectionVisible, moveOrderItem, resolveSectionOrder } from '~/utils/sectionVisibility'

const SLUG = 'gallery-page'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

const data = ref<Record<MarineContentLocale, ListingPageData>>({
  ru: defaultListingData(SLUG, 'ru'),
  en: defaultListingData(SLUG, 'en'),
})

const d = computed(() => data.value[localeTab.value])

const collapsed = ref<Record<string, boolean>>({ hero: false, listing: true })
function toggle(s: string) { collapsed.value[s] = !collapsed.value[s] }

const effectiveSectionOrder = computed<string[]>(() => {
  const cur = data.value[localeTab.value]
  return resolveSectionOrder(cur.sectionOrder, listingDefaultOrder(SLUG), cur.customSections)
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
  const label = LISTING_SECTION_ADMIN_LABELS[id as keyof typeof LISTING_SECTION_ADMIN_LABELS] ?? id
  return `${pos}. ${label}`
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
  finally { loading.value = false }
})

async function submit() {
  const src = data.value[localeTab.value]
  const inq = src.showInquiryForm
  const hideIntro = src.hideInquiryFormIntro
  const hideCard = src.hideInquiryFormCardHeading
  const heroImg = src.heroImage
  const order = src.sectionOrder
  const visibility = src.sectionVisibility
  const hideFooter = src.hideFooter
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].showInquiryForm = inq
    data.value[loc].hideInquiryFormIntro = hideIntro
    data.value[loc].hideInquiryFormCardHeading = hideCard
    data.value[loc].heroImage = heroImg
    data.value[loc].sectionOrder = order ? [...order] : undefined
    data.value[loc].sectionVisibility = visibility ? { ...visibility } : undefined
    data.value[loc].hideFooter = hideFooter
  }
  saving.value = true
  try {
    const translations = {} as Record<MarineContentLocale, { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }>
    for (const loc of MARINE_CONTENT_LOCALES) {
      translations[loc] = {
        title: loc === 'ru' ? 'Галерея' : 'Gallery',
        excerpt: '', body: JSON.stringify(data.value[loc]),
        seoTitle: '', seoDescription: '', seoKeywords: '',
      }
    }
    if (existingId.value) {
      await api.contentPages.update(existingId.value, { slug: SLUG, isPublished: true, translations })
    } else {
      const created = await api.contentPages.create({ slug: SLUG, isPublished: true, sortOrder: 0, translations })
      existingId.value = (created as ContentPage).id
    }
    adminToast.success('Страница «Галерея» сохранена')
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
            <h1 class="font-display text-xl text-mts-text">Страница «Галерея»</h1>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/gallery" target="_blank" class="font-body text-sm text-mts-text-secondary hover:text-mts-accent transition-colors">Открыть на сайте ↗</NuxtLink>
            <button type="button" :disabled="saving || loading" class="btn-primary px-6 disabled:opacity-50" @click="submit">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24"><Loader2 class="w-8 h-8 text-mts-accent animate-spin" /></div>
      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <!-- 1. HERO — фиксирован первым. -->
        <AdminCollapsibleSection
          title="1. Hero-блок"
          :collapsed="collapsed.hero"
          @update:collapsed="(v) => (collapsed.hero = v)"
        >
          <div class="space-y-4">
            <AdminHeroImageField v-model="d.heroImage" />
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemeTitleEditor v-model="d.hero.titleFormatted" />
            </div>
            <div>
              <label :class="sectionLabel">Лид</label>
              <AdminThemedTextField v-model="d.hero.lead" />
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- Список (фотогалерея). -->
        <AdminCollapsibleSection
          :title="sectionTitle('listing')"
          :collapsed="collapsed.listing"
          :visible="sectionVisible('listing')"
          :can-move-up="canMove('listing', -1)"
          :can-move-down="canMove('listing', 1)"
          hint="Сами фотографии берутся из админки «Галерея». Здесь — управление видимостью и положением блока."
          @update:collapsed="(v) => (collapsed.listing = v)"
          @update:visible="(v) => setSectionVisible('listing', v)"
          @move-up="moveSection('listing', -1)"
          @move-down="moveSection('listing', 1)"
        >
          <p class="font-body text-sm text-mts-text-secondary">
            Чтобы скрыть всю галерею на публичной странице — снимите чекбокс «Показывать» в шапке.
          </p>
        </AdminCollapsibleSection>

        <AdminCustomSectionsEditor
          :model-value="d.customSections ?? []"
          @update:model-value="(v) => (d.customSections = v)"
        />

        <section class="bg-white border border-mts-border shadow-tech relative p-6 space-y-4">
          <label class="flex cursor-pointer items-center gap-3 font-body text-sm text-mts-text">
            <input v-model="d.showInquiryForm" type="checkbox" class="mts-checkbox" />
            Показать форму заявки внизу страницы «Галерея»
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
