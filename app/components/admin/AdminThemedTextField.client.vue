<script setup lang="ts">
import AdminHtmlTiptapField from './AdminHtmlTiptapField.client.vue'

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    placeholder?: string
    multiline?: boolean
    compact?: boolean
    useThemeTonePopover?: boolean
  }>(),
  {
    placeholder: 'Текст…',
    multiline: true,
    compact: true,
    useThemeTonePopover: false,
  },
)
</script>

<template>
  <AdminHtmlTiptapField
    v-model="model"
    :placeholder="props.placeholder"
    :multiline="props.multiline"
    :compact="props.compact"
    :use-theme-tone-popover="props.useThemeTonePopover"
  />
</template>
