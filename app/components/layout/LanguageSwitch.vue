<script setup lang="ts">
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
  <div
    class="inline-flex items-center gap-0 font-mono text-[10px] font-medium uppercase tracking-wide border border-mts-border"
    role="navigation"
    :aria-label="$t('lang.switch')"
  >
    <NuxtLink
      v-for="(item, index) in available"
      :key="item.code"
      :to="switchLocalePath(item.code)"
      :class="[
        'px-2 py-1 transition-colors',
        locale === item.code ? 'bg-mts-accent text-white' : 'text-mts-text-secondary hover:text-mts-accent',
        index > 0 ? 'border-l border-mts-border' : '',
      ]"
    >
      {{ item.label }}
    </NuxtLink>
  </div>
</template>
