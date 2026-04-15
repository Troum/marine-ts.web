import type { LucideIcon } from 'lucide-vue-next'
import { getAllLucideAdminIconOptions, resolveLucideIcon } from '~/utils/lucideIconRegistry'

export const crewingIconSelectOptions = getAllLucideAdminIconOptions()

export function resolveCrewingIcon(key: string): LucideIcon {
  return resolveLucideIcon(key)
}
