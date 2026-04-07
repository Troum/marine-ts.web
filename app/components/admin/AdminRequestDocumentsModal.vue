<script setup lang="ts">
import type { DocumentRequestCatalogEntry } from '~/types'
import { Loader2, X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  entries: DocumentRequestCatalogEntry[]
  submitting: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [keys: string[]]
}>()

const selected = ref<Record<string, boolean>>({})

watch(
  () => props.open,
  (v) => {
    if (v) {
      selected.value = {}
    }
  },
)

const grouped = computed(() => {
  const map = new Map<string, DocumentRequestCatalogEntry[]>()
  for (const e of props.entries) {
    const g = e.group || 'Прочее'
    if (!map.has(g)) {
      map.set(g, [])
    }
    map.get(g)!.push(e)
  }
  return [...map.entries()]
})

function toggle(key: string, checked: boolean) {
  selected.value = { ...selected.value, [key]: checked }
}

const selectedKeys = computed(() =>
  Object.entries(selected.value)
    .filter(([, v]) => v)
    .map(([k]) => k),
)

function onConfirm() {
  if (selectedKeys.value.length === 0) {
    return
  }
  emit('confirm', selectedKeys.value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-docs-title"
      @click.self="emit('close')"
    >
      <div class="max-h-[90vh] w-full max-w-2xl overflow-hidden border border-mts-border bg-white shadow-lg">
        <div class="flex items-center justify-between border-b border-mts-border px-4 py-3">
          <h2 id="request-docs-title" class="font-display text-lg text-mts-text">
            Запросить документы
          </h2>
          <button
            type="button"
            class="rounded p-1 text-mts-text-secondary hover:bg-mts-bg hover:text-mts-text"
            aria-label="Закрыть"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="max-h-[calc(90vh-8rem)] overflow-y-auto px-4 py-3">
          <p class="mb-4 font-body text-sm text-mts-text-secondary">
            Отметьте документы, которые нужно дозагрузить. Кандидату на email будет отправлена временная ссылка.
          </p>
          <div v-if="entries.length === 0" class="flex items-center gap-2 py-8 text-mts-text-secondary">
            <Loader2 class="h-5 w-5 animate-spin" />
            Загрузка списка…
          </div>
          <div v-else class="space-y-6">
            <div v-for="[group, items] in grouped" :key="group">
              <p class="mb-2 font-mono text-[10px] uppercase tracking-wide text-mts-accent">
                {{ group }}
              </p>
              <ul class="space-y-1">
                <li v-for="item in items" :key="item.key">
                  <label
                    class="flex cursor-pointer items-start gap-2 rounded border border-transparent px-2 py-1 hover:border-mts-border hover:bg-mts-bg"
                  >
                    <input
                      type="checkbox"
                      class="mts-checkbox mt-0.5"
                      :checked="!!selected[item.key]"
                      @change="toggle(item.key, ($event.target as HTMLInputElement).checked)"
                    />
                    <span class="font-body text-sm text-mts-text">{{ item.label }}</span>
                  </label>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap justify-end gap-2 border-t border-mts-border px-4 py-3">
          <button
            type="button"
            class="border border-mts-border bg-white px-4 py-2 font-mono text-xs uppercase text-mts-text hover:bg-mts-bg"
            :disabled="submitting"
            @click="emit('close')"
          >
            Отмена
          </button>
          <button
            type="button"
            class="border border-amber-600 bg-amber-600 px-4 py-2 font-mono text-xs uppercase text-white hover:bg-amber-700 disabled:opacity-50"
            :disabled="submitting || selectedKeys.length === 0"
            @click="onConfirm"
          >
            <span v-if="submitting" class="inline-flex items-center gap-2">
              <Loader2 class="h-4 w-4 animate-spin" />
              Отправка…
            </span>
            <span v-else>Отправить ссылку</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
