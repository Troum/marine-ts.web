<script setup lang="ts">
import FullscreenPageLoader from "~/components/common/FullscreenPageLoader.vue";

const i18nHead = useLocaleHead({
  addSeoAttributes: true,
})

useHead(() => ({
  htmlAttrs: {
    ...i18nHead.value.htmlAttrs,
  },
  link: i18nHead.value.link,
  meta: i18nHead.value.meta,
}))
</script>

<template>
  <NuxtLoadingIndicator color="#c84b4b" :height="3" />
  <FullscreenPageLoader />
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
