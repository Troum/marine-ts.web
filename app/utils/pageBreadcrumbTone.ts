import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'
import type { PageBreadcrumbTone } from '~/types'

export function resolveHeroBreadcrumbOnDark(
  tone: PageBreadcrumbTone | undefined,
  autoWhen: boolean,
): boolean {
  const t = tone ?? 'auto'
  if (t === 'on-dark') {
    return true
  }
  if (t === 'on-light') {
    return false
  }
  return autoWhen
}

/** Для крошек поверх блока «Баннер» в пользовательской секции. */
export function resolveHeroImageBreadcrumbOnDark(
  tone: PageBreadcrumbTone,
  overlayOpacity: number,
): boolean {
  if (tone === 'on-dark') {
    return true
  }
  if (tone === 'on-light') {
    return false
  }
  return overlayOpacity >= 20
}

export function parseStoredPageBreadcrumbTone(v: unknown): PageBreadcrumbTone | undefined {
  if (v === 'auto' || v === 'on-dark' || v === 'on-light') {
    return v
  }
  return undefined
}

export const HERO_BREADCRUMB_TONE_ADMIN_OPTIONS: AdminSelectOption[] = [
  { value: 'auto', label: 'Авто (по фону hero)' },
  { value: 'on-dark', label: 'Светлый текст (тёмный фон)' },
  { value: 'on-light', label: 'Тёмный текст (светлый фон)' },
]

export const CUSTOM_SECTION_BREADCRUMB_TONE_ADMIN_OPTIONS: AdminSelectOption[] = [
  { value: '', label: 'Не показывать на баннере' },
  { value: 'auto', label: 'Авто (по затемнению баннера)' },
  { value: 'on-dark', label: 'Светлый текст' },
  { value: 'on-light', label: 'Тёмный текст' },
]
