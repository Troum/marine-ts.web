import type { Component } from 'vue'
import { icons } from 'lucide-vue-next'
import type { LucideIcon } from 'lucide-vue-next'
import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'
import { lucideIconNameToRuLabel } from '~/utils/lucideIconRuLabels'

type IconsMap = typeof icons

/** PascalCase из snake_case (clipboard_check → ClipboardCheck, ship → Ship). */
function legacyKeyToPascal(key: string): string {
  if (key.includes('_')) {
    return key
      .split('_')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join('')
  }
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
}

/**
 * Разрешение ключа иконки: имя компонента Lucide (PascalCase) или legacy snake_case (например услуги: ship, clipboard_check).
 */
export function resolveLucideIcon(key: string): LucideIcon {
  if (key in icons) {
    return icons[key as keyof IconsMap] as LucideIcon
  }
  const pascal = legacyKeyToPascal(key)
  if (pascal in icons) {
    return icons[pascal as keyof IconsMap] as LucideIcon
  }
  return icons.Ship as LucideIcon
}

let cachedOptions: AdminSelectOption[] | null = null

/** Все иконки из lucide-vue-next для AdminSelect (по алфавиту). */
export function getAllLucideAdminIconOptions(): AdminSelectOption[] {
  if (cachedOptions) {
    return cachedOptions
  }
  cachedOptions = Object.keys(icons)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      value: name,
      label: lucideIconNameToRuLabel(name),
      icon: icons[name as keyof IconsMap] as Component,
    }))
  return cachedOptions
}
