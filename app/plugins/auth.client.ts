export default defineNuxtPlugin(() => {
  const { syncFromStorage } = useAuth()
  syncFromStorage()
})
