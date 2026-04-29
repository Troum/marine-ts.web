<script setup lang="ts">
import { CircleSlash } from 'lucide-vue-next'
import { computed } from 'vue'
import AdminSelect, { type AdminSelectOption } from './AdminSelect.vue'

/**
 * Селект иконки с опцией «Без иконки» прямо в списке.
 * Заменяет связку <AdminSelect /> + <input type="checkbox" v-model="hideIcon" />.
 *
 * Выбор «Без иконки» взводит флаг `hideIcon` и не трогает `icon` (значение
 * сохраняется на случай, если пользователь снимет «Без иконки» обратно).
 */
const props = defineProps<{
  icon: string
  hideIcon?: boolean
  options: AdminSelectOption[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:icon': [value: string]
  'update:hideIcon': [value: boolean]
}>()

const NONE_VALUE = '__no-icon__'

const optionsWithNone = computed<AdminSelectOption[]>(() => [
  { value: NONE_VALUE, label: 'Без иконки', icon: CircleSlash },
  ...props.options,
])

const selectedValue = computed(() => (props.hideIcon ? NONE_VALUE : props.icon))

function onSelect(value: string) {
  if (value === NONE_VALUE) {
    emit('update:hideIcon', true)
    return
  }
  if (props.hideIcon) {
    emit('update:hideIcon', false)
  }
  emit('update:icon', value)
}
</script>

<template>
  <AdminSelect
    :model-value="selectedValue"
    :options="optionsWithNone"
    :placeholder="placeholder"
    searchable
    search-placeholder="Поиск: русская подпись или имя Lucide (напр. Bookmark, user check)…"
    @update:model-value="onSelect"
  />
</template>
