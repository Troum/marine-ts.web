<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronDown, Check, Search } from 'lucide-vue-next'

export interface AdminSelectOption {
  value: string
  /** Подпись в списке; если не задана — показывается только иконка (если есть). */
  label?: string
  /** Если задано, слева от подписи показывается превью (Lucide и т.п.). */
  icon?: Component
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: AdminSelectOption[]
    id?: string
    disabled?: boolean
    placeholder?: string
    /**
     * Внешний вид триггера.
     * `default` — карточка как в админке (рамка со всех сторон).
     * `underline` — только нижняя линия, как у `.form-input` на публичных формах.
     */
    variant?: 'default' | 'underline'
    /**
     * Поле поиска в выпадающем списке.
     * По умолчанию включается, если опций больше 12 (удобно для длинных списков иконок).
     */
    searchable?: boolean
    searchPlaceholder?: string
    /**
     * Показывать иконку «галочка» у выбранного пункта в списке.
     */
    showOptionCheck?: boolean
    /**
     * Только для `variant="underline"`: не рисовать нижнюю линию у кнопки-триггера
     * (общую линию задаёт родитель, например composit-поле ввода).
     */
    underlineBareTrigger?: boolean
    /** Ширина корня + триггера: во всю ячейку или по содержимому (короткие метки). */
    selectWidth?: 'block' | 'fit-content'
    /** Панель списка: на всю ширину триггера или узкая (`w-max`). */
    dropdownListLayout?: 'full' | 'hug'
    /** Между блоком метки и шевроном: `sm` = 4px (`gap-1`). */
    triggerGap?: 'md' | 'sm'
  }>(),
  {
    placeholder: 'Выберите…',
    disabled: false,
    searchPlaceholder: 'Search by label or code…',
    variant: 'default',
    showOptionCheck: true,
    underlineBareTrigger: false,
    selectWidth: 'block',
    dropdownListLayout: 'full',
    triggerGap: 'md',
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

/** Строка для поиска: подпись, техническое имя и вариант с пробелами между словами PascalCase. */
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

const showSearch = computed(() => {
  if (props.searchable === false) {
    return false
  }
  if (props.searchable === true) {
    return true
  }
  return props.options.length > 12
})

const selectedOption = computed(() => props.options.find((o) => o.value === props.modelValue))

const filteredOptions = computed(() => {
  if (!showSearch.value) {
    return props.options
  }
  const raw = searchQuery.value.trim().toLowerCase()
  if (!raw) {
    return props.options
  }
  const tokens = raw.split(/\s+/).filter(Boolean)
  return props.options.filter((o) => {
    const hay = optionSearchHaystack(o)
    return tokens.every((t) => hay.includes(t))
  })
})

const selectedLabel = computed(() => {
  const raw = selectedOption.value?.label
  if (raw !== undefined && raw !== '') {
    return raw
  }
  return ''
})

const showSelectedText = computed(() => Boolean(selectedLabel.value))

const triggerTitle = computed(() => {
  if (!props.modelValue) {
    return undefined
  }
  const t = selectedOption.value?.label
  if (t !== undefined && t !== '') {
    return `${t} (${props.modelValue})`
  }
  return props.modelValue
})

const selectedIcon = computed(() => selectedOption.value?.icon)

const selectedTextClass = computed(() => {
  if (props.variant === 'underline') {
    return props.modelValue ? 'text-body' : 'text-muted'
  }
  return props.modelValue ? 'text-mts-text' : 'text-mts-text-muted'
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

function toggle() {
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

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
  searchQuery.value = ''
}

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
  <div
    ref="root"
    :class="[
      selectWidth === 'fit-content' ? 'relative inline-block w-max max-w-none' : 'relative min-w-0',
    ]"
  >
    <button
      :id="id"
      type="button"
      :disabled="disabled"
      :title="triggerTitle"
      :class="[
        'flex shrink-0 items-center justify-between',
        selectWidth === 'fit-content' ? 'w-max' : 'w-full',
        triggerGap === 'sm' ? 'gap-1' : 'gap-2',
        variant === 'underline' &&
          underlineBareTrigger &&
          'border-0 bg-transparent px-0 py-3 text-left font-body text-sm transition-colors focus:outline-none disabled:opacity-50',
        variant === 'underline' &&
          !underlineBareTrigger && [
            'border-0 border-b bg-transparent px-0 py-3 text-left font-body text-sm transition-colors focus:border-primary focus:outline-none disabled:opacity-50',
            open ? 'border-primary' : 'border-[#cccccc] hover:border-primary/60',
          ],
        variant === 'default' &&
          'h-12 border border-mts-border bg-mts-bg px-4 py-0 text-left font-body text-sm text-mts-text transition-colors hover:border-mts-accent/50 focus:outline-none focus:ring-2 focus:ring-mts-accent/30 focus:border-mts-accent disabled:opacity-50',
      ]"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="modelValue ? triggerTitle : placeholder"
      @click.stop="toggle"
    >
      <span class="flex min-w-0 items-center gap-2">
        <component
          :is="selectedIcon"
          v-if="selectedIcon"
          class="h-5 w-5 shrink-0 text-mts-accent"
          aria-hidden="true"
        />
        <span v-if="showSelectedText" :class="selectedTextClass">{{ selectedLabel }}</span>
        <span v-else-if="!modelValue" :class="placeholderMutedClass">{{ placeholder }}</span>
      </span>
      <ChevronDown class="pointer-events-none" :class="chevronClass" aria-hidden="true" />
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
        :class="[
          'absolute left-0 top-full z-50 mt-1 flex max-h-72 flex-col overflow-hidden border border-mts-border bg-white shadow-tech-lg',
          dropdownListLayout === 'hug' ? 'min-w-max w-max' : 'right-0',
        ]"
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
        <ul role="listbox" class="max-h-60 flex-1 overflow-y-auto py-1">
          <li
            v-if="filteredOptions.length === 0"
            :class="[
              dropdownListLayout === 'hug'
                ? 'px-2 py-6 text-center font-body text-sm text-mts-text-secondary'
                : 'px-4 py-6 text-center font-body text-sm text-mts-text-secondary',
            ]"
          >
            Ничего не найдено
          </li>
          <li
            v-for="opt in filteredOptions"
            :key="opt.value"
            role="option"
            :aria-selected="opt.value === modelValue"
            :title="
              opt.label && opt.label !== '' ? `${opt.label} (${opt.value})` : opt.value
            "
            :class="[
              'flex cursor-pointer items-center gap-2 py-2.5 font-body text-sm text-mts-text hover:bg-mts-bg',
              dropdownListLayout === 'hug' ? 'px-2' : 'px-4',
              dropdownListLayout === 'hug' && !showOptionCheck ? 'justify-center' : 'justify-between',
            ]"
            @click="select(opt.value)"
          >
            <span
              :class="
                dropdownListLayout === 'hug' && !showOptionCheck
                  ? 'flex min-w-0 items-center gap-2'
                  : 'flex min-w-0 flex-1 items-center gap-2'
              "
            >
              <component
                :is="opt.icon"
                v-if="opt.icon"
                class="h-4 w-4 shrink-0 text-mts-accent"
                aria-hidden="true"
              />
              <span v-if="opt.label != null && opt.label !== ''" class="min-w-0">{{ opt.label }}</span>
            </span>
            <Check v-if="showOptionCheck && opt.value === modelValue" class="h-4 w-4 shrink-0 text-mts-accent" />
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
