<script setup lang="ts">
import LineMarketingPageView from '~/components/line-marketing/LineMarketingPageView.vue'

const SLUG = 'engineering' as const
</script>

<template>
  <LineMarketingPageView :slug="SLUG" />
</template>
