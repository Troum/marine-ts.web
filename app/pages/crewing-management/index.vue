<script setup lang="ts">
useSectionGuard('crewing_management')
import LineMarketingPageView from '~/components/line-marketing/LineMarketingPageView.vue'

/** Отдельный файл маршрута — свой экземпляр при каждом заходе (анимации, SEO). */
const SLUG = 'crewing-management' as const

const { locale } = useI18n()
const viewKey = computed(() => `${SLUG}:${locale.value}`)
</script>

<template>
  <LineMarketingPageView :key="viewKey" :slug="SLUG" />
</template>
