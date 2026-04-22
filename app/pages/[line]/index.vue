<script setup lang="ts">
import LineMarketingPageView from '~/components/line-marketing/LineMarketingPageView.vue'
import { isLineMarketingPageSlug } from '~/utils/lineMarketingPages'

definePageMeta({
  validate: (route) => isLineMarketingPageSlug(String(route.params.line ?? '')),
})

const route = useRoute()
const line = computed(() => String(route.params.line ?? ''))
</script>

<template>
  <LineMarketingPageView v-if="isLineMarketingPageSlug(line)" :slug="line" />
</template>
