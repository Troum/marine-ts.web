<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

await navigateTo('/admin/line-pages/crewing-management', { replace: true })
</script>

<template>
  <div class="flex min-h-[40vh] items-center justify-center font-body text-mts-text-secondary">Перенаправление…</div>
</template>
