<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify'
import { computed } from 'vue'
import { marinCustomSvgBySlug } from '~/utils/marinCustomIconAssets'

const props = defineProps<{
  slug: string
}>()

const safe = computed(() => {
  const raw = marinCustomSvgBySlug[props.slug]
  if (!raw) {
    return ''
  }
  return DOMPurify.sanitize(raw, { USE_PROFILES: { svg: true } })
})
</script>

<template>
  <span
    class="inline-flex size-[1em] shrink-0 items-center justify-center text-inherit [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-none [&>svg]:max-w-none"
    v-html="safe"
  />
</template>
