import { onMounted, ref } from 'vue'

/**
 * Недавно использованные цвета для color popover.
 * Аналог useRecentColors из @tiptap/cli (React UI Components), портирован на Vue.
 *
 * Хранение — в localStorage, отдельный ключ на «вид» цветов (например, text/highlight).
 * Лимит — 8 элементов по умолчанию (как в TipTap UI). Дубликаты подтягиваются вверх.
 */
export function useRecentColors(scope: string, limit = 8) {
  const storageKey = `mts:recent-colors:${scope}`
  const recentColors = ref<string[]>([])
  const isInitialized = ref(false)

  function read(): string[] {
    if (typeof window === 'undefined') {
      return []
    }
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        return []
      }
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) {
        return []
      }
      return parsed.filter((v): v is string => typeof v === 'string').slice(0, limit)
    } catch {
      return []
    }
  }

  function write(values: string[]) {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(values.slice(0, limit)))
    } catch {
      /* quota exceeded и пр. — молча игнорируем */
    }
  }

  function addRecentColor(value: string | null | undefined) {
    if (!value) {
      return
    }
    const normalized = String(value).trim()
    if (!normalized) {
      return
    }
    /* поднимаем к началу, без дубликатов, обрезаем до limit */
    const next = [normalized, ...recentColors.value.filter((c) => c !== normalized)].slice(0, limit)
    recentColors.value = next
    write(next)
  }

  function clearRecentColors() {
    recentColors.value = []
    write([])
  }

  onMounted(() => {
    recentColors.value = read()
    isInitialized.value = true
  })

  return { recentColors, addRecentColor, clearRecentColors, isInitialized }
}
