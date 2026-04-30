import {
  mirrorAdminPermissionStorages,
  readAdminPermissionsFromStorage,
  readAdminRolesFromStorage,
} from '~/utils/adminPermissionStorage'

const ADMIN_ROUTE_PERMISSIONS: Array<{ prefix: string; permissions: string[] }> = [
  { prefix: '/admin/users', permissions: ['manage users'] },
  { prefix: '/admin/content-pages', permissions: ['manage content pages'] },
  { prefix: '/admin/home', permissions: ['manage content pages'] },
  { prefix: '/admin/about', permissions: ['manage content pages'] },
  { prefix: '/admin/services-page', permissions: ['manage content pages'] },
  { prefix: '/admin/projects-page', permissions: ['manage content pages'] },
  { prefix: '/admin/gallery-page', permissions: ['manage content pages'] },
  { prefix: '/admin/news-page', permissions: ['manage content pages'] },
  { prefix: '/admin/vacancies-page', permissions: ['manage content pages', 'manage vacancies'] },
  { prefix: '/admin/contacts-page', permissions: ['manage content pages'] },
  { prefix: '/admin/line-pages', permissions: ['manage content pages'] },
  { prefix: '/admin/crewing-management', permissions: ['manage content pages'] },
  { prefix: '/admin/services', permissions: ['manage services'] },
  { prefix: '/admin/projects', permissions: ['manage projects'] },
  { prefix: '/admin/news', permissions: ['manage news'] },
  { prefix: '/admin/gallery', permissions: ['manage gallery'] },
  { prefix: '/admin/seo', permissions: ['manage seo'] },
  { prefix: '/admin/vacancies', permissions: ['manage vacancies'] },
  { prefix: '/admin/feedback', permissions: ['manage feedback'] },
  { prefix: '/admin/inquiries', permissions: ['manage page inquiries'] },
  { prefix: '/admin/contacts', permissions: ['manage contacts'] },
  { prefix: '/admin/navigation', permissions: ['manage navigation'] },
  { prefix: '/admin/footer-navigation', permissions: ['manage navigation'] },
]

function requiredPermissionsForPath(path: string): string[] {
  const matched = ADMIN_ROUTE_PERMISSIONS.find((row) => path === row.prefix || path.startsWith(`${row.prefix}/`))

  return matched?.permissions ?? []
}

function permissionDeniedForRole(permission: string, roles: string[]): boolean {
  if (roles.includes('admin')) {
    return false
  }
  if (roles.includes('hr_manager') && ['manage news', 'manage projects', 'manage services', 'manage seo', 'manage content pages'].includes(permission)) {
    return true
  }
  if (roles.includes('content_manager') && ['manage vacancies', 'manage feedback', 'manage page inquiries'].includes(permission)) {
    return true
  }

  return false
}

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/admin/login') {
    return
  }
  if (!import.meta.client) {
    return
  }
  if (!localStorage.getItem('mts_admin_token')) {
    return navigateTo('/admin/login')
  }
  mirrorAdminPermissionStorages()
  const required = requiredPermissionsForPath(to.path)
  if (required.length === 0) {
    return
  }

  const roles = readAdminRolesFromStorage()
  if (roles.includes('admin')) {
    return
  }

  const permissions = readAdminPermissionsFromStorage()
  if (required.some((permission) => permissionDeniedForRole(permission, roles) || !permissions.includes(permission))) {
    return navigateTo('/admin')
  }
})
