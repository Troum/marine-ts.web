<script setup lang="ts">
/** Фиксируем `data-theme="dark"` на `<html>` (см. useMarinTheme). */
useMarinTheme()

const fullViewportMainSections = useFullViewportMainSections()
</script>

<template>
  <!--
    Навигация прозрачная и наложена поверх контента (`fixed top-0`).
    На части разделов секции на всю высоту viewport — см. `mts-main--full-viewport-sections` в main.css.
  -->
  <div class="min-h-screen bg-mts-bg text-mts-text flex flex-col">
    <LayoutNavigation />
    <main class="flex-grow" :class="{ 'mts-main--full-viewport-sections': fullViewportMainSections }">
      <slot />
    </main>
    <CommonSectionScrollRail />
    <LayoutFooter />
    <CommonScrollToTop />
  </div>
</template>
