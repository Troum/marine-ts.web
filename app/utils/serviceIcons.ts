import type { Component } from 'vue'
import { resolveLucideIcon } from '~/utils/lucideIconRegistry'
import { getAllLucideAndMarinAdminIconOptions, resolveMarinCustomIcon } from '~/utils/marinCustomIcons'

export function resolveServiceIcon(key: string): Component {
  return resolveMarinCustomIcon(key) ?? resolveLucideIcon(key)
}

export const serviceIconSelectOptions = getAllLucideAndMarinAdminIconOptions()
