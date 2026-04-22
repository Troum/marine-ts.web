<script setup lang="ts">
import type { ThemeFormattedTitle } from '~/types'
import AdminThemeToneTiptapCore from './AdminThemeToneTiptapCore.client.vue'

const model = defineModel<ThemeFormattedTitle>({ required: true })

defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <AdminThemeToneTiptapCore
    v-model="model"
    :placeholder="placeholder ?? 'Заголовок…'"
    :multiline="false"
    :compact="false"
  />
</template>
