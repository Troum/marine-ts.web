<script setup lang="ts">
import AdminHtmlTiptapField from './AdminHtmlTiptapField.client.vue'

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    placeholder?: string
    multiline?: boolean
    compact?: boolean
  }>(),
  {
    placeholder: 'Текст…',
    multiline: true,
    compact: true,
  },
)
</script>

<template>
  <AdminHtmlTiptapField
    v-model="model"
    :placeholder="props.placeholder"
    :multiline="props.multiline"
    :compact="props.compact"
  />
</template>
