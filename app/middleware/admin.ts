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
})
