<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

const localePath = useLocalePath()

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

const resolvedTo = computed(() => {
  const u = props.link
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('//') || u.startsWith('mailto:') || u.startsWith('tel:')) {
    return u
  }
  return localePath(u)
})

const componentClass = 'inline-flex items-center justify-center gap-2 btn-primary group'
</script>

<template>
  <NuxtLink :to="resolvedTo" :class="[componentClass, props.extraClass]">
    <span>{{ title }}</span>
    <ArrowRight class="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
  </NuxtLink>
</template>

<style scoped>

</style>
