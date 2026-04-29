<script setup lang="ts">
/**
 * Необязательный фон hero: URL вручную или загрузка файла (POST /media).
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    label?: string
    hint?: string
    /** Доп. класс для поля URL */
    inputClass?: string
  }>(),
  {
    modelValue: '',
    label: 'Фон hero (изображение)',
    hint: 'Необязательно. Укажите URL или загрузите файл — в поле подставится адрес из хранилища.',
    inputClass:
      'box-border h-11 w-full min-w-0 border border-mts-border bg-mts-bg px-4 font-body text-sm focus:border-mts-accent focus:outline-none',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const api = useMarineApi()
const adminToast = useAdminToast()

const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const urlProxy = computed({
  get: () => props.modelValue ?? '',
  set: (v: string) => {
    const t = v.trim()
    emit('update:modelValue', t)
  },
})

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  uploading.value = true
  try {
    const res = await api.media.upload(file)
    emit('update:modelValue', res.url)
    adminToast.success('Изображение загружено')
  } catch {
    adminToast.show({ title: 'Ошибка', message: 'Не удалось загрузить файл' })
  } finally {
    uploading.value = false
  }
}

function clear() {
  emit('update:modelValue', '')
}

function pickFile() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="space-y-2">
    <label class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{ label }}</label>
    <p v-if="hint" class="font-body text-xs text-mts-text-secondary">{{ hint }}</p>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input v-model="urlProxy" type="text" :class="inputClass" placeholder="https://… или /storage/…" />
      <div class="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          :disabled="uploading"
          class="inline-flex h-11 items-center justify-center whitespace-nowrap border border-transparent bg-mts-accent px-4 font-mono text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-mts-accent-dark disabled:opacity-50"
          @click="pickFile"
        >
          {{ uploading ? 'Загрузка…' : 'Загрузить файл' }}
        </button>
        <button
          v-if="modelValue"
          type="button"
          class="inline-flex h-11 items-center justify-center border border-mts-border bg-mts-bg px-4 text-xs text-mts-text-secondary transition-colors hover:border-mts-accent hover:text-mts-accent"
          @click="clear"
        >
          Очистить
        </button>
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="sr-only"
      tabindex="-1"
      @change="onFileChange"
    />
    <div v-if="modelValue" class="mt-2 overflow-hidden rounded border border-mts-border bg-mts-bg">
      <img :src="modelValue" alt="" class="max-h-40 w-full object-cover object-center" loading="lazy" />
    </div>
  </div>
</template>
