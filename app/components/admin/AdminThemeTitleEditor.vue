<script setup lang="ts">
import type { ThemeFormattedTitle } from '~/types'
import AdminThemeTitleEditorClient from './AdminThemeTitleEditor.client.vue'

const model = defineModel<ThemeFormattedTitle>({ required: true })

defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <ClientOnly>
    <AdminThemeTitleEditorClient v-model="model" :placeholder="placeholder" />
    <template #fallback>
      <div
        class="rounded border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm text-mts-text-secondary"
      >
        Загрузка редактора заголовка…
      </div>
    </template>
  </ClientOnly>
</template>
