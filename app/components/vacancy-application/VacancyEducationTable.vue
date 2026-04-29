<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import type { EducationRow } from '~/types/applicationForm'
import { emptyEducationRow } from '~/types/applicationForm'

const rows = defineModel<EducationRow[]>('rows', { required: true })

const { t } = useI18n()

const minRows = 1
const maxRows = 12

const fieldClass =
  'w-full border border-border bg-white px-3 py-2 text-sm text-body placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-mts-accent/25'

function addRow() {
  if (rows.value.length >= maxRows) {
    return
  }
  rows.value.push(emptyEducationRow())
}

function removeRow(index: number) {
  if (rows.value.length <= minRows) {
    return
  }
  rows.value.splice(index, 1)
}
</script>

<template>
  <section class="card-tech overflow-hidden">
    <header class="border-b border-border bg-gradient-to-r from-white to-white px-5 py-4">
      <h3 class="font-display text-lg text-body">{{ t('pages.eduTable.title') }}</h3>
      <p class="mt-1 text-sm text-muted">{{ t('pages.eduTable.lead') }}</p>
    </header>

    <div class="divide-y divide-mts-border">
      <div v-for="(row, i) in rows" :key="'edu-' + i" class="px-5 py-5">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span class="font-mono text-[10px] uppercase tracking-wide text-muted">{{
            t('pages.eduTable.institution', { n: i + 1 })
          }}</span>
          <button
            v-if="rows.length > minRows"
            type="button"
            class="inline-flex items-center gap-1 rounded border border-transparent px-2 py-1 font-mono text-[10px] uppercase text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
            @click="removeRow(i)"
          >
            <Trash2 class="h-3.5 w-3.5" />
            {{ t('pages.eduTable.remove') }}
          </button>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="md:col-span-2">
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Name of school</label>
            <input v-model="row.schoolName" type="text" :class="fieldClass" autocomplete="off" />
          </div>
          <div>
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">From</label>
            <input v-model="row.from" type="text" :class="fieldClass" autocomplete="off" />
          </div>
          <div>
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Till</label>
            <input v-model="row.till" type="text" :class="fieldClass" autocomplete="off" />
          </div>
          <div class="md:col-span-2">
            <label class="mb-1 block font-mono text-[10px] uppercase tracking-wide text-muted">Type of degree</label>
            <input v-model="row.degreeType" type="text" :class="fieldClass" autocomplete="off" />
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-border px-5 py-4">
      <button
        type="button"
        :disabled="rows.length >= maxRows"
        class="inline-flex w-full items-center justify-center gap-2 border border-border border-dashed bg-white/30 px-4 py-3 font-mono text-xs uppercase tracking-wide text-primary transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        @click="addRow"
      >
        <Plus class="h-4 w-4" />
        {{ t('pages.eduTable.add') }}
      </button>
    </div>
  </section>
</template>
