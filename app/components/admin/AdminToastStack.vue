<script setup lang="ts">
import { CheckCircle } from 'lucide-vue-next'

const { toasts, dismiss } = useAdminToast()
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed bottom-6 right-6 z-[260] flex max-w-[min(100vw-2rem,22rem)] flex-col gap-2 sm:bottom-8 sm:right-8"
      aria-live="polite"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-1 opacity-0"
        move-class="transition duration-200"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex gap-3 border border-emerald-200 bg-white px-4 py-3 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18)]"
          role="status"
        >
          <div class="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-700">
            <CheckCircle class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1 pt-0.5">
            <p class="font-display text-sm font-medium leading-snug text-mts-text">{{ t.title }}</p>
            <p class="mt-0.5 font-body text-xs leading-relaxed text-mts-text-secondary">{{ t.message }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 self-start font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary hover:text-mts-text"
            @click="dismiss(t.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
