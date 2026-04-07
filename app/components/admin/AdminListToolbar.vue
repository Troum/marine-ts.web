<script lang="ts">
import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'

export type AdminSortOption = AdminSelectOption
</script>

<script setup lang="ts">
const orderOptions: AdminSelectOption[] = [
  { value: 'asc', label: 'По возрастанию' },
  { value: 'desc', label: 'По убыванию' },
]

const props = withDefaults(
  defineProps<{
    search: string
    sort: string
    order: 'asc' | 'desc'
    sortOptions: AdminSelectOption[]
    searchPlaceholder?: string
    /**
     * Четвёртый фильтр (AdminSelect): публикация, статус и т.п.
     * Задайте `extraFilterOptions` с опциями — блок появится автоматически.
     */
    extraFilter?: string
    extraFilterLabel?: string
    extraFilterOptions?: AdminSelectOption[]
    extraFilterPlaceholder?: string
    /** Классы обёртки четвёртого фильтра (ширина под длинные подписи). */
    extraFilterClass?: string
  }>(),
  {
    extraFilter: '',
    extraFilterLabel: '',
    extraFilterOptions: undefined,
    extraFilterPlaceholder: 'Все',
    extraFilterClass: 'flex min-w-[200px] flex-col gap-1 sm:max-w-[260px]',
  },
)

const emit = defineEmits<{
  'update:search': [value: string]
  'update:sort': [value: string]
  'update:order': [value: 'asc' | 'desc']
  'update:extraFilter': [value: string]
}>()

const showExtraFilter = computed(
  () => props.extraFilterOptions !== undefined && props.extraFilterOptions.length > 0,
)
</script>

<template>
  <div
    class="mb-6 flex flex-col gap-4 border border-mts-border bg-mts-bg/40 p-4 sm:flex-row sm:flex-wrap sm:items-end"
  >
    <label class="flex min-w-[200px] flex-1 flex-col gap-1">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Поиск</span>
      <div
        class="flex h-12 w-full items-center border border-mts-border bg-mts-bg px-4 transition-colors hover:border-mts-accent/50 focus-within:border-mts-accent focus-within:ring-2 focus-within:ring-mts-accent/30"
      >
        <input
          :value="search"
          type="search"
          autocomplete="off"
          class="min-h-0 w-full min-w-0 border-0 bg-transparent p-0 font-body text-sm text-mts-text outline-none placeholder:text-mts-text-muted"
          :placeholder="searchPlaceholder ?? 'Текст…'"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </label>
    <label class="flex min-w-[180px] flex-col gap-1 sm:max-w-[220px]">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Сортировка</span>
      <AdminSelect
        :model-value="sort"
        :options="sortOptions"
        placeholder="Поле…"
        @update:model-value="emit('update:sort', $event)"
      />
    </label>
    <label class="flex min-w-[200px] flex-col gap-1 sm:max-w-[240px]">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Порядок</span>
      <AdminSelect
        :model-value="order"
        :options="orderOptions"
        placeholder="Порядок…"
        @update:model-value="emit('update:order', $event as 'asc' | 'desc')"
      />
    </label>
    <label v-if="showExtraFilter" :class="extraFilterClass">
      <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{
        extraFilterLabel || 'Фильтр'
      }}</span>
      <AdminSelect
        :model-value="extraFilter"
        :options="extraFilterOptions!"
        :placeholder="extraFilterPlaceholder"
        @update:model-value="emit('update:extraFilter', $event)"
      />
    </label>
    <slot />
  </div>
</template>
