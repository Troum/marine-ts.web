<script setup lang="ts">
import Breadcrumbs, { type BreadcrumbItem } from '~/components/common/Breadcrumbs.vue'
import MtsDecorativeAccentLine from '~/components/common/MtsDecorativeAccentLine.vue'

/** Единый отступ от крошек до следующего блока (заголовок, лид). */
const HERO_CRUMBS_TO_TITLE_GAP = 'mb-12 md:mb-16 lg:mb-[4.5rem]'

withDefaults(
  defineProps<{
    items: BreadcrumbItem[]
    onDarkHero?: boolean
    /** Доп. классы на корневую обёртку (`shrink-0`, анимации и т.д.). */
    wrapperClass?: string
  }>(),
  { onDarkHero: false },
)
</script>

<template>
  <div class="flex min-w-0 items-center gap-3" :class="[HERO_CRUMBS_TO_TITLE_GAP, wrapperClass]">
    <MtsDecorativeAccentLine />
    <Breadcrumbs :items="items" :on-dark-hero="onDarkHero" omit-bottom-margin />
  </div>
</template>
