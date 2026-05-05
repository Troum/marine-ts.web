<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import type { CertTableRow } from '~/types/applicationForm'
import { emptyCertRowExtra } from '~/types/applicationForm'

defineProps<{
  title: string
  rows: { label: string; data: CertTableRow }[]
  extraHint?: string
}>()

const extraRows = defineModel<CertTableRow[]>('extraRows', { required: true })

const { t } = useI18n()

const minExtra = 1

const fieldClass =
  'w-full border border-border bg-mts-bg/40 px-3 py-2 text-sm text-body placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-mts-accent/25'

function addExtra() {
  extraRows.value.push(emptyCertRowExtra())
}

function removeExtra(index: number) {
  if (extraRows.value.length <= minExtra) {
    return
  }
  extraRows.value.splice(index, 1)
}
</script>

<template>
  <section class="card-tech overflow-hidden">
    <header class="border-b border-border bg-mts-navy/25 px-5 py-4">
      <h3 class="font-display text-lg leading-snug text-body">
        {{ title }}
      </h3>
    </header>

    <div class="divide-y divide-mts-border">
      <div v-for="(row, i) in rows" :key="'fixed-' + i" class="px-5 py-5">
        <p class="mb-3 font-medium text-body">
          {{ row.label }}
        </p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Number</label>
            <input v-model="row.data.number" type="text" :class="fieldClass" autocomplete="off" />
          </div>
          <div>
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Place of issue</label>
            <input v-model="row.data.placeOfIssue" type="text" :class="fieldClass" autocomplete="off" />
          </div>
          <div>
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Date of issue</label>
            <input v-model="row.data.dateOfIssue" type="text" :class="fieldClass" autocomplete="off" />
          </div>
          <div>
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Date of expire</label>
            <input v-model="row.data.dateOfExpire" type="text" :class="fieldClass" autocomplete="off" />
          </div>
        </div>
      </div>

      <div v-if="extraHint || extraRows.length" class="px-5 py-5">
        <p v-if="extraHint" class="mb-4 text-sm leading-relaxed text-muted">
          {{ extraHint }}
        </p>

        <div class="space-y-4">
          <div
            v-for="(ex, j) in extraRows"
            :key="'extra-' + j"
            class="rounded-xl border border-dashed border-border bg-mts-bg/30 p-4 shadow-sm"
          >
            <div class="mb-3 flex flex-wrap items-start justify-between gap-2">
              <span class="font-mono text-[10px] uppercase tracking-wide text-muted">
                {{ t('pages.certTable.extraRow', { n: j + 1 }) }}
              </span>
              <button
                v-if="extraRows.length > minExtra"
                type="button"
                class="inline-flex items-center gap-1 rounded border border-transparent px-2 py-1 font-mono text-[10px] uppercase text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
                @click="removeExtra(j)"
              >
                <Trash2 class="h-3.5 w-3.5" />
                {{ t('pages.certTable.remove') }}
              </button>
            </div>
            <div class="mb-3">
              <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">
                {{ t('pages.certTable.docNameOpt') }}
              </label>
              <input
                v-model="ex.customLabel"
                type="text"
                :class="fieldClass"
                :placeholder="t('pages.certTable.placeholderDoc')"
                autocomplete="off"
              />
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Number</label>
                <input v-model="ex.number" type="text" :class="fieldClass" autocomplete="off" />
              </div>
              <div>
                <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Place of issue</label>
                <input v-model="ex.placeOfIssue" type="text" :class="fieldClass" autocomplete="off" />
              </div>
              <div>
                <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Date of issue</label>
                <input v-model="ex.dateOfIssue" type="text" :class="fieldClass" autocomplete="off" />
              </div>
              <div>
                <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Date of expire</label>
                <input v-model="ex.dateOfExpire" type="text" :class="fieldClass" autocomplete="off" />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="mt-4 inline-flex w-full items-center justify-center gap-2 border border-border border-dashed bg-bg-light px-4 py-3 font-mono text-xs uppercase tracking-wide text-primary transition-colors hover:border-primary hover:bg-primary/5 sm:w-auto"
          @click="addExtra"
        >
          <Plus class="h-4 w-4" />
          {{ t('pages.certTable.addRow') }}
        </button>
      </div>
    </div>
  </section>
</template>
