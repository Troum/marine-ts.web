/**
 * useMarinTheme
 *
 * Публичный сайт использует только фирменную тёмную палитру (`@theme` в
 * `assets/css/main.css`). На `<html>` выставляется `data-theme="dark"` для
 * единообразия с разметкой; светлого режима нет.
 *
 * Админка — `.admin-shell` со своей светлой палитрой, независимо от этого.
 */
export function useMarinTheme() {
  useHead(() => ({
    htmlAttrs: {
      'data-theme': 'dark',
    },
  }))

  const current = computed(() => 'dark' as const)
  const isDark = computed(() => true)
  const isLight = computed(() => false)

  return { current, isDark, isLight }
}
