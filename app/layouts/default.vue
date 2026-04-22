<script setup lang="ts">
/**
 * Регистрируем тему как можно раньше, чтобы Nuxt отрисовал
 * <html data-theme="…"> уже на SSR — иначе при гидратации возможна
 * «вспышка» противоположной палитры.
 */
useMarinTheme()
</script>

<template>
  <!--
    Навигация имеет `fixed top-0` и высоту 4rem (`h-16` в Navigation.vue).
    Чтобы контент страниц не подлезал под шапку, даём <main> верхний
    отступ той же высоты (`pt-16`). Если когда-нибудь высота шапки
    поменяется — поправить и здесь.
  -->
  <div class="min-h-screen bg-mts-bg text-mts-text flex flex-col">
    <LayoutNavigation />
    <main class="flex-grow pt-16">
      <slot />
    </main>
    <LayoutFooter />
    <CommonScrollToTop />
  </div>
</template>
