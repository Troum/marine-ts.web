<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: [
    'admin',
    defineNuxtRouteMiddleware(() => navigateTo('/admin/application-forms', { replace: true })),
  ],
})
</script>

<template>
  <div />
</template>
