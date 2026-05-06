<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

const { active } = useFullscreenPageLoader()
const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <Transition name="mts-fullscreen-loader">
      <div
        v-show="active"
        class="fixed inset-0 z-[100000] flex flex-col items-center justify-center gap-4 bg-mts-navy-deep/88 backdrop-blur-sm pointer-events-auto"
        role="status"
        aria-live="polite"
        :aria-busy="active"
      >
        <Loader2 class="h-10 w-10 shrink-0 animate-spin text-primary" aria-hidden="true" />
        <span class="font-mono text-xs uppercase tracking-[0.2em] text-mts-frost/85">
          {{ t('pages.common.loading') }}
        </span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mts-fullscreen-loader-enter-active,
.mts-fullscreen-loader-leave-active {
  transition: opacity 0.2s ease;
}
.mts-fullscreen-loader-enter-from,
.mts-fullscreen-loader-leave-to {
  opacity: 0;
}
</style>
