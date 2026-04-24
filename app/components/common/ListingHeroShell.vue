<script setup lang="ts">
/**
 * Hero листингов: опциональный фон + контент в `.mts-content-wrap`.
 * Без фона — отступ сверху под фикс. шапку (pt-16), как у старых страниц.
 */
defineProps<{
  heroImage?: string | null
}>()
</script>

<template>
  <section
    :class="[
      'relative overflow-hidden',
      heroImage ? 'pb-16 pt-40 lg:pb-20 lg:pt-48' : 'py-24 pt-16 lg:py-32',
    ]"
  >
    <template v-if="heroImage">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-[0.55]"
        :style="{ backgroundImage: `url(${heroImage})` }"
        aria-hidden="true"
      />
      <div class="absolute inset-0 bg-linear-to-r from-mts-bg/95 via-mts-bg/85 to-mts-bg/55" aria-hidden="true" />
      <div class="absolute inset-0 bg-linear-to-t from-mts-bg via-transparent to-mts-bg/35" aria-hidden="true" />
    </template>
    <div class="relative z-10 mts-content-wrap">
      <slot />
    </div>
  </section>
</template>
