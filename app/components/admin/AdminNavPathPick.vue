<script setup lang="ts">
import AdminSelect from '~/components/admin/AdminSelect.vue'
import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'
import { normalizeInternalNavPath } from '~/utils/contentPageNavPath'

const props = withDefaults(
  defineProps<{
    pathOptions: AdminSelectOption[]
    inputPlaceholder?: string
    label?: string
    compact?: boolean
  }>(),
  {
    inputPlaceholder: '/news или https://…',
    label: 'Путь или URL',
    compact: false,
  },
)

const path = defineModel<string>({ required: true })

const internalValues = computed(() => new Set(props.pathOptions.map((o) => o.value)))

const pickerValue = computed({
  get() {
    const raw = path.value.trim()
    if (!raw || /^https?:\/\//i.test(raw)) {
      return '__custom__'
    }
    const key = normalizeInternalNavPath(raw)
    if (internalValues.value.has(key)) {
      return key
    }
    return '__custom__'
  },
  set(v: string) {
    if (v === '__custom__') {
      return
    }
    path.value = v
  },
})

</script>

<template>
  <div :class="compact ? 'space-y-2' : 'space-y-3'">
    <div v-if="pathOptions.length > 1">
      <label
        class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
        >Раздел сайта</label
      >
      <AdminSelect
        v-model="pickerValue"
        :options="pathOptions"
        placeholder="Выберите раздел или ниже укажите вручную"
        search-placeholder="Поиск по разделам…"
      />
    </div>
    <div>
      <label
        class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
        >{{ label }}</label
      >
      <input
        v-model="path"
        type="text"
        required
        :class="[
          'w-full border border-mts-border bg-white font-body text-sm focus:border-mts-accent focus:outline-none',
          compact ? 'px-3 py-2' : 'px-4 py-3',
        ]"
        :placeholder="inputPlaceholder"
      />
    </div>
  </div>
</template>
