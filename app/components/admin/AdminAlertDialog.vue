<script setup lang="ts">
import { AlertCircle, Info } from 'lucide-vue-next'

const { state, dismiss } = useAdminAlert()

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    dismiss()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.open) {
    e.preventDefault()
    dismiss()
  }
}

watch(
  () => state.open,
  (open) => {
    if (import.meta.client) {
      if (open) {
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKeydown)
      } else {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', onKeydown)
      }
    }
  },
)

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', onKeydown)
  }
})

const isError = computed(() => state.variant === 'error')
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="state.open"
        class="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6"
        role="presentation"
        @click="onBackdropClick"
      >
        <div class="absolute inset-0 bg-mts-text/40 backdrop-blur-[2px]" aria-hidden="true" />

        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="admin-alert-title"
          aria-describedby="admin-alert-desc"
          class="relative z-10 w-full max-w-md overflow-hidden border border-mts-border bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
          @click.stop
        >
          <div
            class="flex gap-4 border-b border-mts-border px-6 py-5"
            :class="isError ? 'bg-red-50/80' : 'bg-mts-bg/80'"
          >
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border"
              :class="
                isError
                  ? 'border-red-200 bg-white text-red-600'
                  : 'border-mts-border bg-white text-mts-accent'
              "
            >
              <AlertCircle v-if="isError" class="h-5 w-5" aria-hidden="true" />
              <Info v-else class="h-5 w-5" aria-hidden="true" />
            </div>
            <div class="min-w-0 flex-1 pt-0.5">
              <h2 id="admin-alert-title" class="font-display text-lg leading-snug text-mts-text">
                {{ state.title }}
              </h2>
            </div>
          </div>

          <div id="admin-alert-desc" class="px-6 py-5">
            <p class="whitespace-pre-wrap font-body text-sm leading-relaxed text-mts-text-secondary">
              {{ state.message }}
            </p>
          </div>

          <div class="flex justify-end border-t border-mts-border bg-mts-bg/50 px-6 py-4">
            <button
              type="button"
              class="min-h-[40px] min-w-[120px] border border-mts-accent bg-mts-accent px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors hover:bg-mts-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent focus-visible:ring-offset-2"
              @click="dismiss"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
