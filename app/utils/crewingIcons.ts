import type { Component } from 'vue'
import { resolveLucideIcon } from '~/utils/lucideIconRegistry'
import { getAllLucideAndMarinAdminIconOptions, resolveMarinCustomIcon } from '~/utils/marinCustomIcons'

export const crewingIconSelectOptions = getAllLucideAndMarinAdminIconOptions()

export function resolveCrewingIcon(key: string): Component {
  return resolveMarinCustomIcon(key) ?? resolveLucideIcon(key)
}
