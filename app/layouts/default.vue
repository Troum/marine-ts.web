<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: '',
  },
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white text-body">
    <LayoutNavigation />
    <main class="flex-grow">
      <slot />
    </main>
    <LayoutFooter />
    <LayoutCookieBanner />
    <CommonScrollToTop />
  </div>
</template>
