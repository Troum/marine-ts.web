<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Пусто — слой не рендерится. */
  imageUrl?: string | null
}>()

const url = computed(() => props.imageUrl?.trim() ?? '')

const show = computed(() => url.value.length > 0)

function layerStyle(u: string): { backgroundImage: string } {
  return { backgroundImage: `url(${JSON.stringify(u)})` }
}
</script>

<template>
  <div
    v-if="show"
    class="pointer-events-none absolute inset-0 z-0"
    aria-hidden="true"
  >
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      :style="layerStyle(url)"
    />
    <div class="absolute inset-0 bg-black/45" />
  </div>
</template>
