<script setup lang="ts">
/**
 * Кнопка переключения темы (dark ↔ light) для публичной части сайта.
 *
 * Визуально нейтральна — двухсимвольный иконочный квадрат с прозрачным
 * фоном, чтобы хорошо лежать в шапке Marin (которая всегда тёмная) и
 * не конкурировать с CTA-кнопкой «Заявка». Иконка меняется в зависимости
 * от текущей темы и подписывается локализованной aria-label.
 */
import { Sun, Moon } from 'lucide-vue-next'

const { t } = useI18n()
const { isDark, toggle } = useMarinTheme()

const ariaLabel = computed(() =>
  isDark.value ? t('themeToggle.switchToLight') : t('themeToggle.switchToDark'),
)
</script>

<template>
  <!--
    Габариты — `h-7 w-7`, чтобы кнопка точно совпадала по высоте с
    переключателем локали (`<LanguageSwitch />`, тоже h-7). Иконка 14px
    выглядит сбалансированно внутри 28×28 контейнера.
    Цвета — через brand-токены `mts-frost`, что делает кнопку
    автоматически инвертирующейся между тёмной и светлой темами.
  -->
  <button
    type="button"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-none border border-mts-frost/25 text-mts-frost transition-colors hover:border-mts-accent hover:text-mts-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent/40"
    @click="toggle"
  >
    <Transition name="mts-theme-icon" mode="out-in">
      <Sun v-if="isDark" key="sun" class="h-3.5 w-3.5" />
      <Moon v-else key="moon" class="h-3.5 w-3.5" />
    </Transition>
  </button>
</template>

<style scoped>
.mts-theme-icon-enter-active,
.mts-theme-icon-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.mts-theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(0.7);
}
.mts-theme-icon-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(0.7);
}
</style>
