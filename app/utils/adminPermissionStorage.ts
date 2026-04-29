/** Ключи синхронны с useMarineApi (логин / 401). */
export const ADMIN_PERMISSIONS_KEY = 'mts_admin_permissions'
export const ADMIN_ROLES_KEY = 'mts_admin_roles'
export const ADMIN_USER_ID_KEY = 'mts_admin_user_id'

/** Однократно подтягиваем копию в второе хранилище (прежние сессии только в session). */
export function mirrorAdminPermissionStorages(): void {
  if (typeof sessionStorage === 'undefined' || typeof localStorage === 'undefined') {
    return
  }
  try {
    const s = sessionStorage.getItem(ADMIN_PERMISSIONS_KEY)
    const l = localStorage.getItem(ADMIN_PERMISSIONS_KEY)
    if (s && !l) {
      localStorage.setItem(ADMIN_PERMISSIONS_KEY, s)
    }
    if (l && !s) {
      sessionStorage.setItem(ADMIN_PERMISSIONS_KEY, l)
    }
    const sid = sessionStorage.getItem(ADMIN_USER_ID_KEY)
    const lid = localStorage.getItem(ADMIN_USER_ID_KEY)
    if (sid && !lid) {
      localStorage.setItem(ADMIN_USER_ID_KEY, sid)
    }
    if (lid && !sid) {
      sessionStorage.setItem(ADMIN_USER_ID_KEY, lid)
    }
    const sr = sessionStorage.getItem(ADMIN_ROLES_KEY)
    const lr = localStorage.getItem(ADMIN_ROLES_KEY)
    if (sr && !lr) {
      localStorage.setItem(ADMIN_ROLES_KEY, sr)
    }
    if (lr && !sr) {
      sessionStorage.setItem(ADMIN_ROLES_KEY, lr)
    }
  } catch {
    /* ignore */
  }
}

/**
 * Права: session (вкладка логина) + localStorage (общий для всех вкладок).
 * Сначала session — актуальнее при смене прав в этой же вкладке.
 */
export function readAdminPermissionsFromStorage(): string[] {
  if (typeof sessionStorage === 'undefined' || typeof localStorage === 'undefined') {
    return []
  }
  try {
    const fromSession = sessionStorage.getItem(ADMIN_PERMISSIONS_KEY)
    if (fromSession) {
      const p = JSON.parse(fromSession) as unknown
      return Array.isArray(p) ? p : []
    }
    const fromLocal = localStorage.getItem(ADMIN_PERMISSIONS_KEY)
    if (fromLocal) {
      const p = JSON.parse(fromLocal) as unknown
      return Array.isArray(p) ? p : []
    }
  } catch {
    /* ignore */
  }
  return []
}

export function readAdminRolesFromStorage(): string[] {
  if (typeof sessionStorage === 'undefined' || typeof localStorage === 'undefined') {
    return []
  }
  try {
    const fromSession = sessionStorage.getItem(ADMIN_ROLES_KEY)
    if (fromSession) {
      const r = JSON.parse(fromSession) as unknown
      return Array.isArray(r) ? r.map(String) : []
    }
    const fromLocal = localStorage.getItem(ADMIN_ROLES_KEY)
    if (fromLocal) {
      const r = JSON.parse(fromLocal) as unknown
      return Array.isArray(r) ? r.map(String) : []
    }
  } catch {
    /* ignore */
  }
  return []
}

export function writeAdminPermissionsToBothStorages(permissions: string[]): void {
  if (typeof sessionStorage === 'undefined' || typeof localStorage === 'undefined') {
    return
  }
  const raw = JSON.stringify(permissions)
  sessionStorage.setItem(ADMIN_PERMISSIONS_KEY, raw)
  localStorage.setItem(ADMIN_PERMISSIONS_KEY, raw)
  if (import.meta.client && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mts-admin-permissions-changed'))
  }
}

export function writeAdminRolesToBothStorages(roles: string[]): void {
  if (typeof sessionStorage === 'undefined' || typeof localStorage === 'undefined') {
    return
  }
  const raw = JSON.stringify(roles)
  sessionStorage.setItem(ADMIN_ROLES_KEY, raw)
  localStorage.setItem(ADMIN_ROLES_KEY, raw)
  if (import.meta.client && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mts-admin-permissions-changed'))
  }
}

export function clearAdminPermissionStorages(): void {
  if (typeof sessionStorage === 'undefined' || typeof localStorage === 'undefined') {
    return
  }
  sessionStorage.removeItem(ADMIN_PERMISSIONS_KEY)
  sessionStorage.removeItem(ADMIN_ROLES_KEY)
  sessionStorage.removeItem(ADMIN_USER_ID_KEY)
  localStorage.removeItem(ADMIN_PERMISSIONS_KEY)
  localStorage.removeItem(ADMIN_ROLES_KEY)
  localStorage.removeItem(ADMIN_USER_ID_KEY)
  if (import.meta.client && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mts-admin-permissions-changed'))
  }
}
