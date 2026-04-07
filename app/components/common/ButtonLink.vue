<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    link: string
    title: string
    /** Совместимость с hero: игнорируется, стиль единый с `btn-primary` */
    asButton?: boolean
    /** Доп. классы на NuxtLink (например hidden lg:inline-flex) */
    extraClass?: string
  }>(),
  { asButton: false, extraClass: '' },
)

const componentClass = 'inline-flex items-center justify-center gap-2 btn-primary group'
</script>

<template>
  <NuxtLink :to="props.link" :class="[componentClass, props.extraClass]">
    <span>{{ title }}</span>
    <ArrowRight class="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
  </NuxtLink>
</template>

<style scoped>

</style>
