const TOKEN_KEY = 'mts_admin_token'

export function useAuth() {
  const token = useState<string | null>('admin_token', () => null)

  const syncFromStorage = () => {
    if (import.meta.client) {
      token.value = localStorage.getItem(TOKEN_KEY)
    }
  }

  const setToken = (value: string | null) => {
    token.value = value
    if (import.meta.client) {
      if (value) {
        localStorage.setItem(TOKEN_KEY, value)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    }
  }

  const logout = () => {
    setToken(null)
  }

  const isAuthenticated = computed(() => !!token.value)

  return {
    token,
    syncFromStorage,
    setToken,
    logout,
    isAuthenticated,
  }
}
