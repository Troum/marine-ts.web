<script setup lang="ts">
import MtsDecorativeAccentLine from '~/components/common/MtsDecorativeAccentLine.vue'

/** Как у `HeroBreadcrumbsRow`: отступ до заголовка. */
const HERO_EYEBROW_TO_TITLE_GAP = 'mb-12 md:mb-16 lg:mb-[4.5rem]'

defineProps<{
  wrapperClass?: string
}>()
</script>

<template>
  <div
    class="flex min-w-0 items-center gap-3"
    :class="[HERO_EYEBROW_TO_TITLE_GAP, wrapperClass]"
  >
    <MtsDecorativeAccentLine />
    <!-- Figma 14:355: 16px / 34 lh, Bold, uppercase, white -->
    <div
      class="mts-figma-hero-eyebrow text-white [&_span]:!text-white"
    >
      <slot />
    </div>
  </div>
</template>
