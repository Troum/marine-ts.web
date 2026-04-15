<script setup lang="ts">
/**
 * Hero листингов: опциональный фон + контент в max-w-7xl.
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
        class="absolute inset-0 bg-cover bg-center opacity-[0.5]"
        :style="{ backgroundImage: `url(${heroImage})` }"
        aria-hidden="true"
      />
      <div class="absolute inset-0 bg-linear-to-r from-white/95 via-white/80 to-white/60" aria-hidden="true" />
    </template>
    <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
      <slot />
    </div>
  </section>
</template>
