<script setup lang="ts">
import { ChevronDown, Check, Search } from 'lucide-vue-next'
import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    options: AdminSelectOption[]
    id?: string
    disabled?: boolean
    placeholder?: string
    variant?: 'default' | 'underline'
    searchable?: boolean
    searchPlaceholder?: string
    /** Максимум выбранных значений (undefined — без лимита). */
    maxSelections?: number | null
  }>(),
  {
    placeholder: 'Выберите…',
    disabled: false,
    searchPlaceholder: 'Search by label or code…',
    variant: 'default',
    maxSelections: null,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

function optionSearchHaystack(o: AdminSelectOption): string {
  const label = (o.label ?? '').toLowerCase()
  const value = (o.value ?? '').toLowerCase()
  const spacedPascal = value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return `${label} ${value} ${spacedPascal}`.trim()
}

const open = ref(false)
useExclusiveDropdown(open)
const root = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')

const selectableOptions = computed(() => props.options.filter((o) => o.value !== ''))

const showSearch = computed(() => {
  if (props.searchable === false) {
    return false
  }
  if (props.searchable === true) {
    return true
  }
  return selectableOptions.value.length > 12
})

const filteredOptions = computed(() => {
  const base = selectableOptions.value
  if (!showSearch.value) {
    return base
  }
  const raw = searchQuery.value.trim().toLowerCase()
  if (!raw) {
    return base
  }
  const tokens = raw.split(/\s+/).filter(Boolean)
  return base.filter((o) => {
    const hay = optionSearchHaystack(o)
    return tokens.every((t) => hay.includes(t))
  })
})

function labelForValue(value: string): string {
  const o = props.options.find((x) => x.value === value)
  const raw = o?.label
  if (raw !== undefined && raw !== '') {
    return raw
  }
  return value
}

const summaryText = computed(() => {
  const vals = props.modelValue.filter((v) => v !== '')
  if (vals.length === 0) {
    return ''
  }
  return vals.map((v) => labelForValue(v)).join(', ')
})

const showSummary = computed(() => summaryText.value.length > 0)

const triggerTitle = computed(() => (showSummary.value ? summaryText.value : undefined))

const triggerClass = computed(() => {
  if (props.variant === 'underline') {
    const border =
      open.value === true ? 'border-primary' : 'border-[#cccccc] hover:border-primary/60'
    return [
      'flex w-full shrink-0 items-center justify-between gap-2 border-0 border-b bg-transparent px-0 py-3 text-left font-body text-sm transition-colors focus:border-primary focus:outline-none disabled:opacity-50',
      border,
    ].join(' ')
  }
  return 'flex min-h-12 w-full shrink-0 items-center justify-between gap-2 border border-mts-border bg-mts-bg px-4 py-0 text-left font-body text-sm text-mts-text transition-colors hover:border-mts-accent/50 focus:outline-none focus:ring-2 focus:ring-mts-accent/30 focus:border-mts-accent disabled:opacity-50'
})

const selectedTextClass = computed(() => {
  if (props.variant === 'underline') {
    return showSummary.value ? 'text-body' : 'text-muted'
  }
  return showSummary.value ? 'text-mts-text' : 'text-mts-text-muted'
})

const placeholderMutedClass = computed(() =>
  props.variant === 'underline' ? 'text-muted' : 'text-mts-text-muted',
)

const chevronClass = computed(() => {
  const base = 'h-4 w-4 shrink-0 transition-transform'
  const color =
    props.variant === 'underline' ? 'text-muted' : 'text-mts-text-secondary'
  return [base, color, open.value === true ? 'rotate-180' : ''].filter(Boolean).join(' ')
})

function isSelected(value: string): boolean {
  return props.modelValue.includes(value)
}

function atMaxNewSelections(value: string): boolean {
  if (isSelected(value)) {
    return false
  }
  if (props.maxSelections == null) {
    return false
  }
  return props.modelValue.length >= props.maxSelections
}

function toggle(value: string) {
  if (props.disabled || value === '') {
    return
  }
  const cur = [...props.modelValue]
  const i = cur.indexOf(value)
  if (i >= 0) {
    cur.splice(i, 1)
    emit('update:modelValue', cur)
    return
  }
  if (atMaxNewSelections(value)) {
    return
  }
  cur.push(value)
  emit('update:modelValue', cur)
}

function toggleOpen() {
  if (props.disabled) {
    return
  }
  open.value = !open.value
}

watch(open, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
    if (showSearch.value) {
      nextTick(() => searchInputRef.value?.focus())
    }
  }
})

function onDocClick(e: MouseEvent) {
  const el = root.value
  if (!el || !open.value) {
    return
  }
  if (!el.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

function onSearchKeydown(e: KeyboardEvent) {
  e.stopPropagation()
  if (e.key === 'Escape') {
    open.value = false
  }
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      :id="id"
      type="button"
      :disabled="disabled"
      :title="triggerTitle"
      :class="triggerClass"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="showSummary ? triggerTitle : placeholder"
      @click.stop="toggleOpen"
    >
      <span class="min-w-0 flex-1 truncate text-left" :class="selectedTextClass">
        <span v-if="showSummary">{{ summaryText }}</span>
        <span v-else :class="placeholderMutedClass">{{ placeholder }}</span>
      </span>
      <ChevronDown class="pointer-events-none shrink-0" :class="chevronClass" aria-hidden="true" />
    </button>
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-show="open"
        class="absolute left-0 right-0 top-full z-50 mt-1 flex max-h-72 flex-col overflow-hidden border border-mts-border bg-white shadow-tech-lg"
        @click.stop
      >
        <div
          v-if="showSearch"
          class="shrink-0 border-b border-mts-border bg-white px-2 py-2"
          @click.stop
        >
          <label class="relative flex items-center gap-2">
            <Search class="pointer-events-none absolute left-3 h-4 w-4 text-mts-text-secondary" aria-hidden="true" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="search"
              :placeholder="searchPlaceholder"
              autocomplete="off"
              class="w-full border border-mts-border bg-mts-bg py-2 pl-9 pr-3 font-body text-sm text-mts-text placeholder:text-mts-text-secondary focus:border-mts-accent focus:outline-none"
              @keydown="onSearchKeydown"
            />
          </label>
        </div>
        <ul role="listbox" aria-multiselectable="true" class="max-h-60 flex-1 overflow-y-auto py-1">
          <li
            v-if="filteredOptions.length === 0"
            class="px-4 py-6 text-center font-body text-sm text-mts-text-secondary"
          >
            Ничего не найдено
          </li>
          <li
            v-for="opt in filteredOptions"
            :key="opt.value"
            role="option"
            :aria-selected="isSelected(opt.value)"
            :title="opt.label && opt.label !== '' ? `${opt.label} (${opt.value})` : opt.value"
            :class="[
              'flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 font-body text-sm text-mts-text hover:bg-mts-bg',
              atMaxNewSelections(opt.value) ? 'cursor-not-allowed opacity-45 hover:bg-transparent' : '',
            ]"
            @click="toggle(opt.value)"
          >
            <span class="flex min-w-0 flex-1 items-center gap-2">
              <component
                :is="opt.icon"
                v-if="opt.icon"
                class="h-4 w-4 shrink-0 text-mts-accent"
                aria-hidden="true"
              />
              <span v-if="opt.label != null && opt.label !== ''" class="min-w-0">{{ opt.label }}</span>
            </span>
            <Check v-if="isSelected(opt.value)" class="h-4 w-4 shrink-0 text-mts-accent" />
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
