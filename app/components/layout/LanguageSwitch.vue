<script setup lang="ts">
/**
 * Переключатель локали (RU/EN).
 *
 * Бренд-вариант (`dark`) — для шапки/футера на `bg-mts-navy` (токены
 * `mts-frost` / `mts-slate-muted`).
 */
withDefaults(
  defineProps<{
    /** Бренд-вариант — для шапки/футера на тёмной поверхности (`mts-navy`). */
    dark?: boolean
  }>(),
  { dark: false },
)

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const available = computed(() =>
  (locales.value as { code: string }[]).map((l) => ({
    code: l.code,
    label: l.code === 'ru' ? 'RU' : 'EN',
  })),
)
</script>

<template>
  <!-- Высота `h-7` — вровень с соседними контролами в шапке. -->
  <div
    :class="[
      'inline-flex h-7 items-stretch gap-0 font-mono text-[10px] font-medium uppercase tracking-wide border',
      dark ? 'border-mts-frost/25' : 'border-mts-border',
    ]"
    role="navigation"
    :aria-label="$t('lang.switch')"
  >
    <NuxtLink
      v-for="(item, index) in available"
      :key="item.code"
      :to="switchLocalePath(item.code)"
      :class="[
        'inline-flex items-center px-2 transition-colors',
        dark
          ? locale === item.code
            ? 'bg-mts-accent text-white'
            : 'text-mts-slate-muted hover:text-mts-frost'
          : locale === item.code
            ? 'bg-mts-accent text-white'
            : 'text-mts-text-secondary hover:text-mts-accent',
        index > 0 ? (dark ? 'border-l border-mts-frost/25' : 'border-l border-mts-border') : '',
      ]"
    >
      {{ item.label }}
    </NuxtLink>
  </div>
</template>
