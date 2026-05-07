<script setup lang="ts">
import { ArrowLeft, ListTree, Loader2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()

const pending = ref(true)
const saving = ref(false)

const positionLines = ref('')
const vesselLines = ref('')

function normalizeLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function linesToText(lines: string[]): string {
  return lines.join('\n')
}

async function load() {
  pending.value = true
  try {
    const data = await api.applicationForms.getFormListsPublic()
    positionLines.value = linesToText(data.positionOptions ?? [])
    vesselLines.value = linesToText(data.vesselTypeOptions ?? [])
  } catch {
    await showAdminAlert({ message: 'Не удалось загрузить списки', variant: 'error' })
  } finally {
    pending.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const positionOptions = normalizeLines(positionLines.value)
    const vesselTypeOptions = normalizeLines(vesselLines.value)
    await api.applicationForms.updateFormLists({ positionOptions, vesselTypeOptions })
    positionLines.value = linesToText(positionOptions)
    vesselLines.value = linesToText(vesselTypeOptions)
    adminToast.success('Списки сохранены')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить списки', variant: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <header class="sticky top-0 z-50 border-b border-mts-border bg-white">
      <div class="mx-auto max-w-[1000px] px-6 lg:px-12">
        <div class="flex h-16 flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/admin/application-forms"
              class="text-mts-text-secondary transition-colors hover:text-mts-accent"
            >
              <ArrowLeft class="h-5 w-5" />
            </NuxtLink>
            <div class="flex items-center gap-2">
              <ListTree class="h-5 w-5 text-mts-accent" />
              <h1 class="font-display text-xl text-mts-text">Списки открытой анкеты</h1>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1000px] px-6 py-8 lg:px-12">
      <p class="mb-6 font-body text-sm text-mts-text-secondary">
        Варианты для выпадающего списка «должность» и чекбоксов «тип судна» на публичной анкете. Одна строка — один вариант
        (на английском, как в форме).
      </p>

      <div v-if="pending" class="flex justify-center py-24">
        <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
      </div>
      <template v-else>
        <div class="space-y-8 border border-mts-border bg-white p-6">
          <div>
            <label class="mb-2 block font-mono text-[10px] uppercase text-mts-text-secondary">Должности (Position)</label>
            <textarea
              v-model="positionLines"
              rows="14"
              class="w-full border border-mts-border bg-mts-bg px-3 py-2 font-mono text-sm text-mts-text focus:border-mts-accent focus:outline-none"
              placeholder="Chief Engineer&#10;2nd Officer&#10;…"
            />
          </div>
          <div>
            <label class="mb-2 block font-mono text-[10px] uppercase text-mts-text-secondary">Типы судна (Vessel type)</label>
            <textarea
              v-model="vesselLines"
              rows="12"
              class="w-full border border-mts-border bg-mts-bg px-3 py-2 font-mono text-sm text-mts-text focus:border-mts-accent focus:outline-none"
              placeholder="Tanker&#10;Bulker&#10;…"
            />
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="border border-mts-border bg-mts-accent px-4 py-2 font-mono text-xs uppercase text-white hover:opacity-90 disabled:opacity-50"
              :disabled="saving"
              @click="save"
            >
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
