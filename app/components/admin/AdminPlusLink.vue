<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    to: string | RouteLocationRaw
    /** Акцентная кнопка (красная) или обводка (белая). */
    variant?: 'primary' | 'outline'
  }>(),
  { variant: 'primary' },
)
</script>

<template>
  <NuxtLink
    :to="to"
    :class="[
      'inline-flex shrink-0 items-center gap-1.5 font-mono uppercase tracking-wide transition-colors',
      'px-3 py-1.5 text-[10px] leading-tight',
      variant === 'primary'
        ? 'bg-mts-accent text-white hover:bg-mts-accent-dark'
        : 'border border-mts-border bg-white text-mts-text hover:border-mts-accent hover:text-mts-accent',
    ]"
  >
    <Plus class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    <span><slot /></span>
  </NuxtLink>
</template>
