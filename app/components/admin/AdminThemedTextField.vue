<script setup lang="ts">
import AdminThemedTextFieldClient from './AdminThemedTextField.client.vue'

const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    placeholder?: string
    multiline?: boolean
    compact?: boolean
  }>(),
  {
    multiline: true,
    compact: true,
  },
)
</script>

<template>
  <ClientOnly>
    <AdminThemedTextFieldClient v-model="model" :placeholder="placeholder" :multiline="multiline" :compact="compact" />
    <template #fallback>
      <div
        class="min-h-[3rem] rounded border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm text-mts-text-secondary"
      >
        Загрузка редактора…
      </div>
    </template>
  </ClientOnly>
</template>
