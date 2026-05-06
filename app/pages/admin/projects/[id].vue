<script setup lang="ts">
import { ArrowLeft, Loader2, Plus, Minus, Ship, Cog, Zap } from 'lucide-vue-next'
import type { MarineContentLocale, Project, SeoFields } from '~/types'
import SeoAdminFields from '~/components/admin/SeoAdminFields.vue'
import { mergeProjectTranslations } from '~/utils/adminTranslationForms'
import { MARINE_CONTENT_LOCALES, defaultMarineLocale } from '~/utils/marineLocales'
import { useConfirm } from '~/composables/useConfirmAction'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const api = useMarineApi()
const { confirm } = useConfirm()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const idParam = computed(() => route.params.id as string)
const isNew = computed(() => idParam.value === 'new')

const types = [
  { id: 'hull' as const, label: 'Ремонт корпуса', icon: Ship },
  { id: 'engine' as const, label: 'Ремонт двигателя', icon: Cog },
  { id: 'electrical' as const, label: 'Электрика', icon: Zap },
]

const typeLabelsByLocale: Record<Project['type'], Record<MarineContentLocale, string>> = {
  hull: { ru: 'Ремонт корпуса', en: 'Hull repair' },
  engine: { ru: 'Ремонт двигателя', en: 'Engine repair' },
  electrical: { ru: 'Электрика', en: 'Electrical systems' },
}

const typeOptions = types.map((t) => ({ value: t.id, label: t.label, icon: t.icon }))

const localeTab = ref<MarineContentLocale>(defaultMarineLocale())

const form = ref({
  type: 'hull' as Project['type'],
  date: new Date().getFullYear().toString(),
  translations: mergeProjectTranslations(),
})

const statKey = ref('')
const statValue = ref('')
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

const statsForTab = computed(() => form.value.translations[localeTab.value].stats)

function applyTypeLabelsForAllLocales(typeId: Project['type']) {
  for (const loc of MARINE_CONTENT_LOCALES) {
    form.value.translations[loc].typeLabel = typeLabelsByLocale[typeId][loc]
  }
}

function onTypeChange(typeId: string) {
  const id = typeId as Project['type']
  form.value.type = id
  applyTypeLabelsForAllLocales(id)
}

function addStat() {
  if (!statKey.value || !statValue.value) {
    return
  }
  const t = form.value.translations[localeTab.value]
  t.stats = { ...t.stats, [statKey.value]: statValue.value }
  statKey.value = ''
  statValue.value = ''
}

async function removeStat(key: string) {
  const ok = await confirm({
    message: 'Удалить этот показатель из карточки проекта?',
    confirmLabel: 'Удалить',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  const t = form.value.translations[localeTab.value]
  const next = { ...t.stats }
  delete next[key]
  t.stats = next
}

onMounted(async () => {
  if (isNew.value) {
    applyTypeLabelsForAllLocales('hull')
    loading.value = false
    return
  }
  try {
    const p = await api.projects.getById(Number(idParam.value))
    form.value = {
      type: p.type,
      date: p.date,
      translations: mergeProjectTranslations(p.translations),
    }
  } catch {
    await navigateTo('/admin/projects')
  } finally {
    loading.value = false
  }
})

function validate(): boolean {
  for (const loc of MARINE_CONTENT_LOCALES) {
    const t = form.value.translations[loc]
    if (!t.title?.trim() || !t.location?.trim() || !t.description?.trim()) {
      return false
    }
  }
  return true
}

async function submit() {
  if (!validate()) {
    await showAdminAlert({
      message: 'Заполните название, локацию и описание на русском и английском.',
      variant: 'error',
    })
    return
  }
  saving.value = true
  try {
    const payload = {
      type: form.value.type,
      date: form.value.date,
      translations: form.value.translations,
    }
    if (isNew.value) {
      await api.projects.create(payload)
    } else {
      await api.projects.update(Number(idParam.value), payload)
    }
    adminToast.success(isNew.value ? 'Проект добавлен' : 'Проект сохранён')
    await navigateTo('/admin/projects')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить проект', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div class="flex items-center h-16">
          <NuxtLink to="/admin/projects" class="text-mts-text-secondary hover:text-mts-accent mr-4">
            <ArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <h1 class="font-display text-xl text-mts-text">
            {{ isNew ? 'Новый проект' : 'Редактирование проекта' }}
          </h1>
        </div>
      </div>
    </header>

    <main class="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <form v-else class="bg-white border border-mts-border p-8 space-y-8 shadow-tech relative" @submit.prevent="submit">
        <CommonAccentCorners />

        <section class="space-y-6">
          <h2 class="font-mono text-[10px] uppercase tracking-widest text-mts-text-secondary">Общие поля</h2>
          <div>
            <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Тип</label>
            <AdminSelect
              :model-value="form.type"
              :options="typeOptions"
              @update:model-value="onTypeChange($event)"
            />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Год *</label>
            <AdminThemedTextField v-model="form.date" :multiline="false" />
          </div>
        </section>

        <section class="space-y-6 border-t border-mts-border pt-8">
          <AdminLocaleTabs v-model="localeTab" label="Тексты и SEO" />
          <div>
            <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Название *</label>
            <AdminThemedTextField v-model="form.translations[localeTab].title" :multiline="false" />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Подпись типа</label>
            <AdminThemedTextField v-model="form.translations[localeTab].typeLabel" :multiline="false" />
            <p class="mt-1 font-body text-xs text-mts-text-secondary">
              Подставляется при смене типа; можно отредактировать отдельно для каждого языка.
            </p>
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Локация *</label>
            <AdminThemedTextField v-model="form.translations[localeTab].location" :multiline="false" />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Описание *</label>
            <AdminThemedTextField v-model="form.translations[localeTab].description" />
          </div>

          <div>
            <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Показатели (язык: {{ localeTab.toUpperCase() }})</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span
                v-for="(val, key) in statsForTab"
                :key="String(key)"
                class="inline-flex items-center gap-1 px-2 py-1 bg-mts-bg border text-xs font-mono"
              >
                {{ key }}: {{ val }}
                <button type="button" class="text-mts-accent" @click="removeStat(String(key))">
                  <Minus class="w-3 h-3" />
                </button>
              </span>
            </div>
            <div class="flex gap-2">
              <input v-model="statKey" placeholder="Ключ" type="text" class="flex-1 bg-mts-bg border border-mts-border px-3 py-2 text-sm" />
              <input v-model="statValue" placeholder="Значение" type="text" class="flex-1 bg-mts-bg border border-mts-border px-3 py-2 text-sm" />
              <button type="button" class="btn-secondary px-3" @click="addStat">
                <Plus class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="rounded-md border border-mts-border/80 bg-mts-bg/40 p-4">
            <p class="mb-3 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">SEO</p>
            <SeoAdminFields v-model="seoForTab" />
          </div>
        </section>

        <div class="flex gap-4 pt-4">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          <NuxtLink to="/admin/projects" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
