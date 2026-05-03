<script setup lang="ts">
useSiteAppearance()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-transparent text-body">
    <LayoutNavigation />
    <main class="flex-grow">
      <slot />
    </main>
    <LayoutFooter />
    <LayoutCookieBanner />
    <CommonScrollToTop />
  </div>
</template>
