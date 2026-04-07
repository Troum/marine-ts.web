<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

const { dialog, accept, dismiss } = useConfirmAction()

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    dismiss()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && dialog.open) {
    e.preventDefault()
    dismiss()
  }
}

watch(
  () => dialog.open,
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

const isDanger = computed(() => dialog.variant === 'danger')
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
        v-if="dialog.open"
        class="fixed inset-0 z-[240] flex items-center justify-center p-4 sm:p-6"
        role="presentation"
        @click="onBackdropClick"
      >
        <div class="absolute inset-0 bg-mts-text/40 backdrop-blur-[2px]" aria-hidden="true" />

        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          class="relative z-10 w-full max-w-md overflow-hidden border border-mts-border bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)]"
          @click.stop
        >
            <div
              class="flex gap-4 border-b border-mts-border px-6 py-5"
              :class="isDanger ? 'bg-red-50/80' : 'bg-mts-bg/80'"
            >
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border"
                :class="
                  isDanger
                    ? 'border-red-200 bg-white text-red-600'
                    : 'border-mts-border bg-white text-mts-accent'
                "
              >
                <AlertTriangle v-if="isDanger" class="h-5 w-5" aria-hidden="true" />
                <span v-else class="font-mono text-lg font-medium text-mts-accent">?</span>
              </div>
              <div class="min-w-0 flex-1 pt-0.5">
                <h2 id="confirm-dialog-title" class="font-display text-lg leading-snug text-mts-text">
                  {{ dialog.title }}
                </h2>
              </div>
            </div>

            <div id="confirm-dialog-desc" class="px-6 py-5">
              <p class="whitespace-pre-wrap font-body text-sm leading-relaxed text-mts-text-secondary">
                {{ dialog.message }}
              </p>
            </div>

            <div class="flex flex-wrap justify-end gap-2 border-t border-mts-border bg-mts-bg/50 px-6 py-4">
              <button
                type="button"
                class="min-h-[40px] min-w-[100px] border border-mts-border bg-white px-4 py-2 font-mono text-xs uppercase tracking-wide text-mts-text transition-colors hover:border-mts-text hover:bg-white"
                @click="dismiss"
              >
                {{ dialog.cancelLabel }}
              </button>
              <button
                type="button"
                class="min-h-[40px] min-w-[100px] border px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent focus-visible:ring-offset-2"
                :class="
                  isDanger
                    ? 'border-red-600 bg-red-600 hover:bg-red-700'
                    : 'border-mts-accent bg-mts-accent hover:opacity-95'
                "
                @click="accept"
              >
                {{ dialog.confirmLabel }}
              </button>
            </div>
          </div>
      </div>
    </Transition>
  </Teleport>
</template>
