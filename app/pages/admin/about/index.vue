<script setup lang="ts">
import { ArrowLeft, Loader2, Plus, Trash2, Upload, ExternalLink } from 'lucide-vue-next'
import AdminCollapsibleSection from '~/components/admin/AdminCollapsibleSection.vue'
import type { AboutPageData, ContentPage, MarineContentLocale } from '~/types'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import {
  ABOUT_SECTION_ADMIN_LABELS,
  ABOUT_SECTION_DEFAULT_ORDER,
  defaultAboutData,
  mergeAboutPageData,
  syncStructuralFields,
} from '~/utils/aboutPageDefaults'
import { incomingCmsValueToHtml } from '~/utils/adminHtmlField'
import { useConfirm } from '~/composables/useConfirmAction'
import { isSectionVisible, moveOrderItem, resolveSectionOrder } from '~/utils/sectionVisibility'

type CardSectionKey = 'sec2History' | 'sec3Technical' | 'sec4Crewing' | 'sec5Mission'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const { confirm } = useConfirm()

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())
const existingId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)

function normalizeRich(s: string) {
  return incomingCmsValueToHtml(s ?? '')
}

function normalizeAboutRichEditorsPayload(d: AboutPageData) {
  d.sec1Hero.title = normalizeRich(d.sec1Hero.title ?? '')
  d.sec1Hero.body = normalizeRich(d.sec1Hero.body ?? '')
  d.sec2History.title = normalizeRich(d.sec2History.title ?? '')
  d.sec2History.body = normalizeRich(d.sec2History.body ?? '')
  d.sec2History.cards.forEach((c) => {
    c.title = normalizeRich(c.title ?? '')
    c.text = normalizeRich(c.text ?? '')
  })
  d.sec3Technical.title = normalizeRich(d.sec3Technical.title ?? '')
  d.sec3Technical.lead = normalizeRich(d.sec3Technical.lead ?? '')
  d.sec3Technical.lead2 = normalizeRich(d.sec3Technical.lead2 ?? '')
  d.sec3Technical.cards.forEach((c) => {
    c.title = normalizeRich(c.title ?? '')
    c.text = normalizeRich(c.text ?? '')
  })
  d.sec4Crewing.title = normalizeRich(d.sec4Crewing.title ?? '')
  d.sec4Crewing.lead = normalizeRich(d.sec4Crewing.lead ?? '')
  d.sec4Crewing.lead2 = normalizeRich(d.sec4Crewing.lead2 ?? '')
  d.sec4Crewing.cards.forEach((c) => {
    c.title = normalizeRich(c.title ?? '')
    c.text = normalizeRich(c.text ?? '')
  })
  d.sec5Mission.title = normalizeRich(d.sec5Mission.title ?? '')
  d.sec5Mission.body = normalizeRich(d.sec5Mission.body ?? '')
  d.sec5Mission.cards.forEach((c) => {
    c.title = normalizeRich(c.title ?? '')
    c.text = normalizeRich(c.text ?? '')
  })
  d.sec6Closing.title = normalizeRich(d.sec6Closing.title ?? '')
  d.sec6Closing.body = normalizeRich(d.sec6Closing.body ?? '')
}

function initialAboutAdminData(): Record<MarineContentLocale, AboutPageData> {
  const ru = defaultAboutData('ru')
  const en = defaultAboutData('en')
  normalizeAboutRichEditorsPayload(ru)
  normalizeAboutRichEditorsPayload(en)
  return { ru, en }
}

const data = ref<Record<MarineContentLocale, AboutPageData>>(initialAboutAdminData())

const d = computed(() => data.value[localeTab.value])

const collapsed = ref<Record<string, boolean>>({
  sec1: false,
  sec2: true,
  sec3: true,
  sec4: true,
  sec5: true,
  sec6: true,
  geography: true,
  certificates: true,
})

const effectiveSectionOrder = computed<string[]>(() => {
  const cur = data.value[localeTab.value]
  return resolveSectionOrder(cur.sectionOrder, ABOUT_SECTION_DEFAULT_ORDER, cur.customSections)
})

function sectionVisible(id: string): boolean {
  return isSectionVisible(data.value[localeTab.value].sectionVisibility, id)
}

function setSectionVisible(id: string, v: boolean) {
  const next: Record<MarineContentLocale, AboutPageData> = { ...data.value }
  for (const loc of MARINE_CONTENT_LOCALES) {
    const cur = next[loc]
    next[loc] = {
      ...cur,
      sectionVisibility: { ...(cur.sectionVisibility ?? {}), [id]: v },
    }
  }
  data.value = next
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
  const nextOrder = moveOrderItem(order, idx, delta)
  const ru = data.value.ru
  const en = data.value.en
  data.value = {
    ru: { ...ru, sectionOrder: [...nextOrder] },
    en: { ...en, sectionOrder: [...nextOrder] },
  }
}

/** Нумерация после шести основных секций на сайте (7, 8…). */
function sectionTitle(id: string): string {
  const idx = indexInOrder(id)
  const pos = 7 + Math.max(0, idx)
  const label = ABOUT_SECTION_ADMIN_LABELS[id as keyof typeof ABOUT_SECTION_ADMIN_LABELS] ?? id
  return `${pos}. ${label}`
}

onMounted(async () => {
  try {
    const page = await api.contentPages.getPublicBySlug('about')
    if (page) {
      existingId.value = page.id
      const managed = await api.contentPages.getManageById(page.id)
      for (const loc of MARINE_CONTENT_LOCALES) {
        const body = managed.translations?.[loc]?.body
        if (body) {
          try {
            const parsed = JSON.parse(body)
            if (parsed && typeof parsed === 'object' && ('sec1Hero' in parsed || 'hero' in parsed)) {
              data.value[loc] = mergeAboutPageData(loc, parsed)
              normalizeAboutRichEditorsPayload(data.value[loc])
            }
          } catch {
            /* not JSON, keep defaults */
          }
        }
      }
    }
  } catch {
    // No existing page — use defaults
  } finally {
    loading.value = false
  }
})

function addRichCard(section: CardSectionKey) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc][section].cards.push({ title: '', text: '' })
  }
}

async function removeRichCard(section: CardSectionKey, i: number) {
  const ok = await confirm({
    message: 'Удалить эту карточку?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) return
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc][section].cards.splice(i, 1)
  }
}

function addLocation() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].geography.locations.push({ lng: 0, lat: 0, labelOnRight: true, name: '' })
  }
}

async function removeLocation(i: number) {
  const ok = await confirm({
    message: 'Удалить эту точку на карте?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) return
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].geography.locations.splice(i, 1)
  }
}

function addCertificate() {
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].certificates.items.push({ name: '', desc: '', fileUrl: '' })
  }
}

async function removeCertificate(i: number) {
  const ok = await confirm({
    message: 'Удалить этот сертификат из списка?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) return
  for (const loc of MARINE_CONTENT_LOCALES) {
    data.value[loc].certificates.items.splice(i, 1)
  }
}

const uploadingIdx = ref<number | null>(null)

async function uploadCertFile(idx: number) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.jpg,.jpeg,.png,.webp'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    uploadingIdx.value = idx
    try {
      const res = await api.media.upload(file)
      for (const loc of MARINE_CONTENT_LOCALES) {
        if (data.value[loc].certificates.items[idx]) {
          data.value[loc].certificates.items[idx].fileUrl = res.url
        }
      }
      adminToast.success('Файл загружен')
    } catch {
      await showAdminAlert({ message: 'Не удалось загрузить файл', variant: 'error' })
    } finally {
      uploadingIdx.value = null
    }
  }
  input.click()
}

async function submit() {
  syncStructuralFields(data.value, localeTab.value)

  saving.value = true
  try {
    const translations = {} as Record<
      MarineContentLocale,
      { title: string; excerpt: string; body: string; seoTitle: string; seoDescription: string; seoKeywords: string }
    >
    for (const loc of MARINE_CONTENT_LOCALES) {
      translations[loc] = {
        title: loc === 'ru' ? 'О компании' : 'About us',
        excerpt: '',
        body: JSON.stringify({ ...data.value[loc], aboutVersion: 2 }),
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
      }
    }

    if (existingId.value) {
      await api.contentPages.update(existingId.value, {
        slug: 'about',
        isPublished: true,
        translations,
      })
    } else {
      const created = await api.contentPages.create({
        slug: 'about',
        isPublished: true,
        sortOrder: 0,
        translations,
      })
      existingId.value = (created as ContentPage).id
    }
    adminToast.success('Раздел «О компании» сохранён')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить', variant: 'error' })
  } finally {
    saving.value = false
  }
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
            <NuxtLink to="/admin" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">Раздел «О компании»</h1>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/about" target="_blank" class="font-body text-sm text-mts-text-secondary hover:text-mts-accent transition-colors">
              Открыть на сайте ↗
            </NuxtLink>
            <button type="button" :disabled="saving || loading" class="btn-primary px-6 disabled:opacity-50" @click="submit">
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>

      <div v-else class="space-y-6">
        <AdminLocaleTabs v-model="localeTab" label="Язык контента" />

        <!-- 1. Hero -->
        <AdminCollapsibleSection
          title="1. Hero / Первый экран"
          :collapsed="collapsed.sec1"
          @update:collapsed="(v) => (collapsed.sec1 = v)"
        >
          <div class="space-y-4">
            <AdminHeroImageField v-model="d.heroImage" />
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.sec1Hero.title" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац</label>
              <AdminRichTextEditor
                :model-value="d.sec1Hero.body"
                :disabled="saving"
                placeholder="Основной текст первого экрана…"
                @update:model-value="d.sec1Hero.body = $event"
              />
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- 2. История и география -->
        <AdminCollapsibleSection
          title="2. История и география"
          :collapsed="collapsed.sec2"
          :visible="sectionVisible('sec2History')"
          @update:collapsed="(v) => (collapsed.sec2 = v)"
          @update:visible="(v) => setSectionVisible('sec2History', v)"
        >
          <div class="space-y-4">
            <AdminHeroImageField
              v-model="d.historyImage"
              label="Фон секции"
              hint="Если пусто — светлый фон без фотографии."
            />
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.sec2History.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац</label>
              <AdminRichTextEditor
                :model-value="d.sec2History.body"
                :disabled="saving"
                placeholder="Вводный текст секции…"
                @update:model-value="d.sec2History.body = $event"
              />
            </div>
            <div class="space-y-4">
              <div
                v-for="(c, i) in d.sec2History.cards"
                :key="`h-${i}`"
                class="border border-mts-border p-4 bg-mts-bg/50 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Карточка {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeRichCard('sec2History', i)">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label :class="sectionLabel">Заголовок карточки</label>
                  <AdminThemedTextField v-model="c.title" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Текст</label>
                  <AdminRichTextEditor
                    :model-value="c.text"
                    :disabled="saving"
                    placeholder="Текст карточки…"
                    @update:model-value="c.text = $event"
                  />
                </div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addRichCard('sec2History')">
                <Plus class="w-4 h-4" /> Добавить карточку
              </button>
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- 3. Технический менеджмент -->
        <AdminCollapsibleSection
          title="3. Технический менеджмент"
          :collapsed="collapsed.sec3"
          :visible="sectionVisible('sec3Technical')"
          @update:collapsed="(v) => (collapsed.sec3 = v)"
          @update:visible="(v) => setSectionVisible('sec3Technical', v)"
        >
          <div class="space-y-4">
            <AdminHeroImageField v-model="d.technicalImage" label="Фон секции" />
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.sec3Technical.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 1</label>
              <AdminRichTextEditor
                :model-value="d.sec3Technical.lead"
                :disabled="saving"
                placeholder="Абзац 1…"
                @update:model-value="d.sec3Technical.lead = $event"
              />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 2</label>
              <AdminRichTextEditor
                :model-value="d.sec3Technical.lead2"
                :disabled="saving"
                placeholder="Абзац 2…"
                @update:model-value="d.sec3Technical.lead2 = $event"
              />
            </div>
            <div class="space-y-4">
              <div
                v-for="(c, i) in d.sec3Technical.cards"
                :key="`t-${i}`"
                class="border border-mts-border p-4 bg-mts-bg/50 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Преимущество {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeRichCard('sec3Technical', i)">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label :class="sectionLabel">Заголовок</label>
                  <AdminThemedTextField v-model="c.title" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Текст</label>
                  <AdminRichTextEditor
                    :model-value="c.text"
                    :disabled="saving"
                    @update:model-value="c.text = $event"
                  />
                </div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addRichCard('sec3Technical')">
                <Plus class="w-4 h-4" /> Добавить карточку
              </button>
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- 4. Крюинг -->
        <AdminCollapsibleSection
          title="4. Крюинг"
          :collapsed="collapsed.sec4"
          :visible="sectionVisible('sec4Crewing')"
          @update:collapsed="(v) => (collapsed.sec4 = v)"
          @update:visible="(v) => setSectionVisible('sec4Crewing', v)"
        >
          <div class="space-y-4">
            <AdminHeroImageField
              v-model="d.crewingImage"
              label="Фон секции (необязательно)"
              hint="Без изображения — светлый фон, как у других секций."
            />
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.sec4Crewing.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 1</label>
              <AdminRichTextEditor
                :model-value="d.sec4Crewing.lead"
                :disabled="saving"
                @update:model-value="d.sec4Crewing.lead = $event"
              />
            </div>
            <div>
              <label :class="sectionLabel">Абзац 2</label>
              <AdminRichTextEditor
                :model-value="d.sec4Crewing.lead2"
                :disabled="saving"
                @update:model-value="d.sec4Crewing.lead2 = $event"
              />
            </div>
            <div class="space-y-4">
              <div
                v-for="(c, i) in d.sec4Crewing.cards"
                :key="`cr-${i}`"
                class="border border-mts-border p-4 bg-mts-bg/50 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Карточка {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeRichCard('sec4Crewing', i)">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label :class="sectionLabel">Заголовок</label>
                  <AdminThemedTextField v-model="c.title" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Текст</label>
                  <AdminRichTextEditor
                    :model-value="c.text"
                    :disabled="saving"
                    @update:model-value="c.text = $event"
                  />
                </div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addRichCard('sec4Crewing')">
                <Plus class="w-4 h-4" /> Добавить карточку
              </button>
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- 5. Миссия -->
        <AdminCollapsibleSection
          title="5. Миссия"
          :collapsed="collapsed.sec5"
          :visible="sectionVisible('sec5Mission')"
          @update:collapsed="(v) => (collapsed.sec5 = v)"
          @update:visible="(v) => setSectionVisible('sec5Mission', v)"
        >
          <div class="space-y-4">
            <AdminHeroImageField v-model="d.missionImage" label="Фон секции" />
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.sec5Mission.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац</label>
              <AdminRichTextEditor
                :model-value="d.sec5Mission.body"
                :disabled="saving"
                @update:model-value="d.sec5Mission.body = $event"
              />
            </div>
            <div class="space-y-4">
              <div
                v-for="(c, i) in d.sec5Mission.cards"
                :key="`m-${i}`"
                class="border border-mts-border p-4 bg-mts-bg/50 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Принцип {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeRichCard('sec5Mission', i)">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label :class="sectionLabel">Заголовок</label>
                  <AdminThemedTextField v-model="c.title" :multiline="false" />
                </div>
                <div>
                  <label :class="sectionLabel">Текст</label>
                  <AdminRichTextEditor
                    :model-value="c.text"
                    :disabled="saving"
                    @update:model-value="c.text = $event"
                  />
                </div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addRichCard('sec5Mission')">
                <Plus class="w-4 h-4" /> Добавить принцип
              </button>
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- 6. CTA / Закрытие -->
        <AdminCollapsibleSection
          title="6. CTA / Закрытие"
          :collapsed="collapsed.sec6"
          :visible="sectionVisible('sec6Closing')"
          @update:collapsed="(v) => (collapsed.sec6 = v)"
          @update:visible="(v) => setSectionVisible('sec6Closing', v)"
        >
          <div class="space-y-4">
            <p class="font-body text-xs text-mts-text-secondary">
              Фон секции на сайте — светлый, без отдельного поля изображения.
            </p>
            <div>
              <label :class="sectionLabel">Заголовок</label>
              <AdminThemedTextField v-model="d.sec6Closing.title" :multiline="false" />
            </div>
            <div>
              <label :class="sectionLabel">Абзац</label>
              <AdminRichTextEditor
                :model-value="d.sec6Closing.body"
                :disabled="saving"
                @update:model-value="d.sec6Closing.body = $event"
              />
            </div>
          </div>
        </AdminCollapsibleSection>

        <!-- География -->
        <AdminCollapsibleSection
          :title="sectionTitle('geography')"
          :collapsed="collapsed.geography"
          :visible="sectionVisible('geography')"
          :can-move-up="canMove('geography', -1)"
          :can-move-down="canMove('geography', 1)"
          @update:collapsed="(v) => (collapsed.geography = v)"
          @update:visible="(v) => setSectionVisible('geography', v)"
          @move-up="moveSection('geography', -1)"
          @move-down="moveSection('geography', 1)"
        >
          <div class="space-y-4">
            <div class="grid md:grid-cols-3 gap-4">
              <div>
                <label :class="sectionLabel">Метка</label>
                <AdminThemedTextField v-model="d.geography.label" :multiline="false" />
              </div>
              <div class="md:col-span-2">
                <label :class="sectionLabel">Заголовок</label>
                <AdminThemedTextField v-model="d.geography.title" :multiline="true" />
                <p class="mt-1 font-body text-xs text-mts-text-secondary">
                  Перенос строки (Enter) отображается на сайте в заголовке секции.
                </p>
              </div>
            </div>
            <div>
              <label :class="sectionLabel">Описание</label>
              <AdminThemedTextField v-model="d.geography.lead" />
            </div>
            <p class="font-body text-xs text-mts-text-secondary">
              Долгота (lng, -180…180) и широта (lat, -90…90) — координаты порта для Mapbox. Шаг 0.0001°.
            </p>
            <div class="overflow-x-auto border border-mts-border">
              <table class="w-full min-w-[640px] text-left text-sm">
                <thead class="bg-mts-bg font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  <tr>
                    <th class="px-3 py-2">Название</th>
                    <th class="px-3 py-2 w-44">Долгота (lng)</th>
                    <th class="px-3 py-2 w-44">Широта (lat)</th>
                    <th class="px-3 py-2 w-28">Подпись справа</th>
                    <th class="px-3 py-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(locRow, i) in d.geography.locations" :key="i" class="border-t border-mts-border align-middle">
                    <td class="px-3 py-2">
                      <input v-model="locRow.name" class="w-full bg-transparent border-b border-mts-border px-1 py-1 font-body text-sm focus:outline-none focus:border-mts-accent" />
                    </td>
                    <td class="px-3 py-2 w-44">
                      <AdminInputNumberStepper
                        v-model="locRow.lng"
                        variant="full"
                        :min="-180"
                        :max="180"
                        :step="0.0001"
                        decrement-label="Уменьшить долготу"
                        increment-label="Увеличить долготу"
                      />
                    </td>
                    <td class="px-3 py-2 w-44">
                      <AdminInputNumberStepper
                        v-model="locRow.lat"
                        variant="full"
                        :min="-90"
                        :max="90"
                        :step="0.0001"
                        decrement-label="Уменьшить широту"
                        increment-label="Увеличить широту"
                      />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <input v-model="locRow.labelOnRight" type="checkbox" class="mts-checkbox" />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeLocation(i)">
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addLocation">
              <Plus class="w-4 h-4" /> Добавить локацию
            </button>
          </div>
        </AdminCollapsibleSection>

        <!-- Сертификаты -->
        <AdminCollapsibleSection
          :title="sectionTitle('certificates')"
          :collapsed="collapsed.certificates"
          :visible="sectionVisible('certificates')"
          :can-move-up="canMove('certificates', -1)"
          :can-move-down="canMove('certificates', 1)"
          @update:collapsed="(v) => (collapsed.certificates = v)"
          @update:visible="(v) => setSectionVisible('certificates', v)"
          @move-up="moveSection('certificates', -1)"
          @move-down="moveSection('certificates', 1)"
        >
          <div class="space-y-4">
            <div>
              <label :class="sectionLabel">Заголовок секции</label>
              <AdminThemedTextField v-model="d.certificates.title" :multiline="false" />
            </div>
            <div class="space-y-3">
              <div v-for="(cert, i) in d.certificates.items" :key="i" class="border border-mts-border p-4 bg-mts-bg/50 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Сертификат {{ i + 1 }}</span>
                  <button type="button" class="text-mts-text-secondary hover:text-red-500 transition-colors" @click="removeCertificate(i)">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div class="grid md:grid-cols-2 gap-3">
                  <div>
                    <label :class="sectionLabel">Название</label>
                    <AdminThemedTextField v-model="cert.name" :multiline="false" />
                  </div>
                  <div>
                    <label :class="sectionLabel">Описание</label>
                    <AdminThemedTextField v-model="cert.desc" :multiline="false" />
                  </div>
                </div>
                <div>
                  <label :class="sectionLabel">Файл сертификата</label>
                  <div class="flex items-center gap-3">
                    <input v-model="cert.fileUrl" placeholder="URL файла" :class="[sectionInput, 'flex-1']" />
                    <button
                      type="button"
                      :disabled="uploadingIdx === i"
                      class="flex items-center gap-2 shrink-0 border border-mts-border px-4 py-3 font-mono text-xs uppercase text-mts-text-secondary hover:text-mts-accent hover:border-mts-accent transition-colors disabled:opacity-50"
                      @click="uploadCertFile(i)"
                    >
                      <Loader2 v-if="uploadingIdx === i" class="w-4 h-4 animate-spin" />
                      <Upload v-else class="w-4 h-4" />
                      Загрузить
                    </button>
                    <a
                      v-if="cert.fileUrl"
                      :href="cert.fileUrl"
                      target="_blank"
                      class="flex items-center shrink-0 text-mts-accent hover:underline"
                      title="Открыть файл"
                    >
                      <ExternalLink class="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
              <button type="button" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline" @click="addCertificate">
                <Plus class="w-4 h-4" /> Добавить сертификат
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
            Показать форму заявки внизу страницы «О компании»
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
