<script setup lang="ts">
/**
 * Переключатель локали (RU/EN).
 *
 * Бренд-вариант (`dark`) предполагается внутри шапки/футера на
 * `bg-mts-navy`. Так как `mts-navy/frost/slate-muted` теперь реагируют
 * на data-theme, бренд-вариант использует именно эти токены вместо
 * захардкоженного `white`, и автоматически переключается между темами.
 */
withDefaults(
  defineProps<{
    /** Бренд-вариант — для шапки/футера на тёмной (или светло-инвертированной) поверхности. */
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
  <!--
    Высота переключателя задана через `h-7`, чтобы совпадала с
    `<CommonMarinThemeToggle />`. Любое изменение высоты — синхронить
    в обоих местах одновременно, иначе они «съедут» в шапке.
  -->
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
