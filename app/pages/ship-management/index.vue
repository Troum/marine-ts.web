<script setup lang="ts">
import LineMarketingPageView from '~/components/line-marketing/LineMarketingPageView.vue'

const SLUG = 'ship-management' as const
</script>

<template>
  <LineMarketingPageView :slug="SLUG" />
</template>
