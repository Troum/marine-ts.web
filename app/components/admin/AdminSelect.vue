<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'

export interface AdminSelectOption {
  value: string
  label: string
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
  }>(),
  { placeholder: 'Выберите…', disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const selectedOption = computed(() => props.options.find((o) => o.value === props.modelValue))

const selectedLabel = computed(() => selectedOption.value?.label ?? props.placeholder)

const selectedIcon = computed(() => selectedOption.value?.icon)

function toggle() {
  if (props.disabled) {
    return
  }
  open.value = !open.value
}

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
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
</script>

<template>
  <div ref="root" class="relative">
    <button
      :id="id"
      type="button"
      :disabled="disabled"
      class="flex h-12 w-full shrink-0 items-center justify-between gap-2 border border-mts-border bg-mts-bg px-4 py-0 text-left font-body text-sm text-mts-text transition-colors hover:border-mts-accent/50 focus:outline-none focus:ring-2 focus:ring-mts-accent/30 focus:border-mts-accent disabled:opacity-50"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click.stop="toggle"
    >
      <span class="flex min-w-0 items-center gap-2">
        <component
          :is="selectedIcon"
          v-if="selectedIcon"
          class="h-5 w-5 shrink-0 text-mts-accent"
          aria-hidden="true"
        />
        <span :class="modelValue ? 'text-mts-text' : 'text-mts-text-muted'">{{ selectedLabel }}</span>
      </span>
      <ChevronDown class="h-4 w-4 shrink-0 text-mts-text-secondary transition-transform" :class="{ 'rotate-180': open }" />
    </button>
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <ul
        v-show="open"
        role="listbox"
        class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto border border-mts-border bg-white py-1 shadow-tech-lg"
        @click.stop
      >
        <li
          v-for="opt in options"
          :key="opt.value"
          role="option"
          :aria-selected="opt.value === modelValue"
          class="flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 font-body text-sm text-mts-text hover:bg-mts-bg"
          @click="select(opt.value)"
        >
          <span class="flex min-w-0 flex-1 items-center gap-2">
            <component
              :is="opt.icon"
              v-if="opt.icon"
              class="h-4 w-4 shrink-0 text-mts-accent"
              aria-hidden="true"
            />
            <span class="min-w-0">{{ opt.label }}</span>
          </span>
          <Check v-if="opt.value === modelValue" class="h-4 w-4 shrink-0 text-mts-accent" />
        </li>
      </ul>
    </Transition>
  </div>
</template>
