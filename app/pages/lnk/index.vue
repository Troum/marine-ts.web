<script setup lang="ts">
import LineMarketingPageView from '~/components/line-marketing/LineMarketingPageView.vue'

const SLUG = 'lnk' as const
</script>

<template>
  <LineMarketingPageView :slug="SLUG" />
</template>
