<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Tailwind classes for the image (height drives layout). */
    imgClass?: string
  }>(),
  {
    imgClass: 'h-10 w-auto max-w-[min(100%,280px)] object-contain object-left',
  },
)
</script>

<template>
  <img
    src="/logo-red.svg"
    alt="Marine Technical Solutions"
    width="247"
    height="101"
    loading="eager"
    decoding="async"
    :class="imgClass"
  />
</template>
