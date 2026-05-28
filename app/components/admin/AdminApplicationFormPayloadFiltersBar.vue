<script setup lang="ts">
import AdminSelect from '~/components/admin/AdminSelect.vue'
import type { ApplicationFormPayloadFilterState } from '~/utils/applicationFormAdminPayloadFilters'

const props = withDefaults(
  defineProps<{
    positionOptions: string[]
    vesselTypeOptions: string[]
    showVacancyScope?: boolean
  }>(),
  { showVacancyScope: true },
)

const filters = defineModel<ApplicationFormPayloadFilterState>({ required: true })

const vacancyScopeOptions = [
  { value: 'all', label: 'Все заявки' },
  { value: 'open', label: 'Только открытая анкета' },
  { value: 'with_vacancy', label: 'Только по вакансии' },
]

const positionOpts = computed(() => [
  { value: '', label: 'Любая должность' },
  ...props.positionOptions.map((p) => ({ value: p, label: p })),
])

const vesselOpts = computed(() => [
  { value: '', label: 'Любой тип судна' },
  ...props.vesselTypeOptions.map((p) => ({ value: p, label: p })),
])

const fieldWrap =
  'flex h-12 w-full items-center border border-mts-border bg-mts-bg px-4 transition-colors hover:border-mts-accent/50 focus-within:border-mts-accent focus-within:ring-2 focus-within:ring-mts-accent/30'
const inputClass =
  'min-h-0 w-full min-w-0 border-0 bg-transparent p-0 font-body text-sm text-mts-text outline-none placeholder:text-mts-text-muted'
</script>

<template>
  <div
    class="col-span-full flex w-full flex-col gap-4 border-t border-mts-border border-dashed pt-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
  >
    <label v-if="showVacancyScope" class="flex min-w-[180px] flex-col gap-1 sm:max-w-[260px]">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Источник</span>
      <AdminSelect
        v-model="filters.vacancyScope"
        :options="vacancyScopeOptions"
        placeholder="Все…"
      />
    </label>
    <label class="flex min-w-[180px] flex-col gap-1 sm:max-w-[280px]">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Желаемая должность</span>
      <AdminSelect v-model="filters.position" :options="positionOpts" placeholder="Любая…" />
    </label>
    <label class="flex min-w-[180px] flex-col gap-1 sm:max-w-[280px]">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Тип судна</span>
      <AdminSelect v-model="filters.vesselType" :options="vesselOpts" placeholder="Любой…" />
    </label>
    <label class="flex min-w-[160px] flex-col gap-1">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Гражданство</span>
      <div :class="fieldWrap">
        <input v-model="filters.citizenship" type="search" autocomplete="off" :class="inputClass" placeholder="Подстрока…" />
      </div>
    </label>
    <label class="flex min-w-[160px] flex-col gap-1">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Английский</span>
      <div :class="fieldWrap">
        <input v-model="filters.englishLevel" type="search" autocomplete="off" :class="inputClass" placeholder="Подстрока…" />
      </div>
    </label>
    <label class="flex min-w-[200px] flex-col gap-1 xl:col-span-2">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Морская служба</span>
      <div :class="fieldWrap">
        <input
          v-model="filters.seaServiceSearch"
          type="search"
          autocomplete="off"
          :class="inputClass"
          placeholder="Судно, компания, ранг, флаг…"
        />
      </div>
    </label>
  </div>
</template>
