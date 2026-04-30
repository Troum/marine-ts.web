import {
  ADMIN_PERMISSIONS_KEY,
  ADMIN_ROLES_KEY,
  mirrorAdminPermissionStorages,
  readAdminPermissionsFromStorage,
  readAdminRolesFromStorage,
} from '~/utils/adminPermissionStorage'

/**
 * Права из логина. Храним в реактивном useState + перечитываем из storage,
 * иначе computed не обновляется (sessionStorage не реактивен) и новая вкладка
 * не видит прав (sessionStorage изолирован).
 *
 * Роль `admin`: как Gate::before в API — полный доступ к разделам панели,
 * даже если в массиве permissions нет отдельной строки (старая БД / кэш).
 */
export function useAdminPermissions() {
  const permissions = useState<string[]>('admin-permissions-effective', () => [])
  const roles = useState<string[]>('admin-roles-effective', () => [])

  const sync = () => {
    if (!import.meta.client) {
      return
    }
    mirrorAdminPermissionStorages()
    permissions.value = readAdminPermissionsFromStorage()
    roles.value = readAdminRolesFromStorage()
  }

  if (import.meta.client) {
    onMounted(() => {
      sync()
      const onStorage = (e: StorageEvent) => {
        if (e.key === ADMIN_PERMISSIONS_KEY || e.key === ADMIN_ROLES_KEY) {
          sync()
        }
      }
      const onCustom = () => sync()
      window.addEventListener('storage', onStorage)
      window.addEventListener('mts-admin-permissions-changed', onCustom)
      onUnmounted(() => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('mts-admin-permissions-changed', onCustom)
      })
    })
  }

  const isGlobalAdmin = computed(() => roles.value.includes('admin'))
  const isHrManager = computed(() => !isGlobalAdmin.value && roles.value.includes('hr_manager'))
  const isContentManager = computed(() => !isGlobalAdmin.value && roles.value.includes('content_manager'))

  const allow = (permission: string) => isGlobalAdmin.value || permissions.value.includes(permission)

  const canManageNews = computed(() => allow('manage news') && !isHrManager.value)
  const canManageProjects = computed(() => allow('manage projects') && !isHrManager.value)
  const canManageServices = computed(() => allow('manage services') && !isHrManager.value)
  const canManageSeo = computed(() => allow('manage seo') && !isHrManager.value)
  const canManageVacancies = computed(() => allow('manage vacancies') && !isContentManager.value)
  const canManageFeedback = computed(() => allow('manage feedback') && !isContentManager.value)
  const canManagePageInquiries = computed(() => allow('manage page inquiries') && !isContentManager.value)
  const canManageUsers = computed(() => allow('manage users'))
  const canManageContentPages = computed(() => allow('manage content pages') && !isHrManager.value)
  const canManageGallery = computed(() => allow('manage gallery'))
  const canManageContacts = computed(() => allow('manage contacts'))
  const canManageNavigation = computed(() => allow('manage navigation'))

  return {
    canManageNews,
    canManageProjects,
    canManageServices,
    canManageSeo,
    canManageVacancies,
    canManageFeedback,
    canManagePageInquiries,
    canManageUsers,
    canManageContentPages,
    canManageGallery,
    canManageContacts,
    canManageNavigation,
    syncPermissions: sync,
  }
}
