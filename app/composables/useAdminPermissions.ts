/**
 * Права из ответа логина (sessionStorage), без лишних запросов к API.
 */
export function useAdminPermissions() {
  const canManageUsers = computed(() => {
    if (!import.meta.client) {
      return false
    }
    try {
      const raw = sessionStorage.getItem('mts_admin_permissions')
      if (!raw) {
        return false
      }
      const perms = JSON.parse(raw) as string[]
      return Array.isArray(perms) && perms.includes('manage users')
    } catch {
      return false
    }
  })

  const canManageContentPages = computed(() => {
    if (!import.meta.client) {
      return false
    }
    try {
      const raw = sessionStorage.getItem('mts_admin_permissions')
      if (!raw) {
        return false
      }
      const perms = JSON.parse(raw) as string[]
      return Array.isArray(perms) && perms.includes('manage content pages')
    } catch {
      return false
    }
  })

  const canManageGallery = computed(() => {
    if (!import.meta.client) {
      return false
    }
    try {
      const raw = sessionStorage.getItem('mts_admin_permissions')
      if (!raw) {
        return false
      }
      const perms = JSON.parse(raw) as string[]
      return Array.isArray(perms) && perms.includes('manage gallery')
    } catch {
      return false
    }
  })

  const canManageContacts = computed(() => {
    if (!import.meta.client) {
      return false
    }
    try {
      const raw = sessionStorage.getItem('mts_admin_permissions')
      if (!raw) {
        return false
      }
      const perms = JSON.parse(raw) as string[]
      return Array.isArray(perms) && perms.includes('manage contacts')
    } catch {
      return false
    }
  })

  return { canManageUsers, canManageContentPages, canManageGallery, canManageContacts }
}
