<script setup lang="ts">
/**
 * Переключатель локали (RU/EN).
 *
 * Бренд-вариант (`dark`) — для шапки на тёмном фоне: общая рамка primary,
 * активная вкладка залита primary, неактивная — прозрачная с текстом primary.
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
      dark
        ? 'overflow-hidden rounded-sm border-primary bg-transparent'
        : 'border-border',
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
            ? 'bg-primary text-white'
            : 'bg-transparent text-primary hover:bg-primary/10'
          : locale === item.code
            ? 'bg-primary text-white'
            : 'text-muted hover:text-primary',
        index > 0 ? (dark ? 'border-l border-primary' : 'border-l border-border') : '',
      ]"
    >
      {{ item.label }}
    </NuxtLink>
  </div>
</template>
