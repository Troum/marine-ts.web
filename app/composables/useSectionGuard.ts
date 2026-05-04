import type { SiteSectionKey } from '~/types'

/**
 * Если раздел скрыт в настройках внешнего вида — выбрасывает ошибку 404.
 * Вызывать синхронно в верхней части `<script setup>` публичной страницы.
 */
export function useSectionGuard(key: SiteSectionKey) {
  const { isSectionHidden } = useSiteAppearance()
  if (isSectionHidden(key)) {
    throw createError({ statusCode: 404, fatal: true })
  }
}
