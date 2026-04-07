<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

export interface BreadcrumbItem {
  label: string
  /** У последнего пункта не указывать — это текущая страница */
  to?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav class="mb-6" aria-label="Хлебные крошки">
    <ol class="flex flex-wrap items-center gap-x-1 gap-y-2 font-mono text-[10px] uppercase tracking-wide sm:text-xs">
      <template v-for="(item, i) in items" :key="i">
        <li v-if="i < items.length - 1" class="flex min-w-0 items-center gap-x-1">
          <NuxtLink :to="item.to!" class="shrink-0 text-mts-text-secondary transition-colors hover:text-mts-accent">
            {{ item.label }}
          </NuxtLink>
          <ChevronRight class="h-3.5 w-3.5 shrink-0 text-mts-text-muted" aria-hidden="true" />
        </li>
        <li v-else class="min-w-0 text-mts-text line-clamp-2" aria-current="page">
          {{ item.label }}
        </li>
      </template>
    </ol>
  </nav>
</template>
