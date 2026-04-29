<script setup lang="ts">
/**
 * Старый адрес /services/:slug → 301 на /:slug (канонический URL текстовых страниц услуг).
 */
const route = useRoute()
const localePath = useLocalePath()
const raw = route.params.slug
const slug = Array.isArray(raw) ? (raw[0] ?? '') : (raw as string)

await navigateTo(localePath(`/${slug}`), { replace: true, redirectCode: 301 })
</script>

<template>
  <div />
</template>
