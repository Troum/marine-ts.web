<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

export interface BreadcrumbItem {
  label: string
  /** У последнего пункта не указывать — это текущая страница */
  to?: string
}

const props = defineProps<{
  items: BreadcrumbItem[]
  /** Текст для тёмного фона (hero с фото и вуалью). */
  onDarkHero?: boolean
}>()

const linkClass = computed(() =>
  props.onDarkHero
    ? 'shrink-0 text-white/80 transition-colors hover:text-primary'
    : 'shrink-0 text-muted transition-colors hover:text-primary',
)
const sepClass = computed(() =>
  props.onDarkHero ? 'h-3.5 w-3.5 shrink-0 text-white/45' : 'h-3.5 w-3.5 shrink-0 text-muted',
)
const currentClass = computed(() =>
  props.onDarkHero ? 'min-w-0 text-white [text-wrap:pretty] line-clamp-2' : 'min-w-0 text-body line-clamp-2',
)
</script>

<template>
  <nav class="mb-6" aria-label="Хлебные крошки">
    <ol
      :class="[
        'flex flex-wrap items-center gap-x-1 gap-y-2',
        onDarkHero
          ? 'font-body text-xs font-semibold uppercase tracking-[0.2em]'
          : 'font-mono text-[10px] uppercase tracking-wide sm:text-xs',
      ]"
    >
      <template v-for="(item, i) in items" :key="i">
        <li v-if="i < items.length - 1" class="flex min-w-0 items-center gap-x-1">
          <NuxtLink :to="item.to!" :class="linkClass">
            {{ item.label }}
          </NuxtLink>
          <ChevronRight :class="sepClass" aria-hidden="true" />
        </li>
        <li v-else :class="currentClass" aria-current="page">
          {{ item.label }}
        </li>
      </template>
    </ol>
  </nav>
</template>
