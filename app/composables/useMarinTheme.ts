/**
 * useMarinTheme
 *
 * Единая точка управления цветовой темой публичной части сайта.
 *
 * Контракт:
 *  • Поддерживаются два режима: 'dark' (фирменный navy, по-умолчанию) и 'light'
 *    (комплиментарная светлая тема, описанная в `assets/css/main.css`).
 *  • Выбор пользователя кэшируется в cookie `marin-theme` на год — так SSR
 *    рендерит ту же тему, что и клиент, без «вспышки» при гидратации.
 *  • Если cookie не задана, используется 'dark' (бренд-тема).
 *  • Активная тема прокидывается в `<html data-theme="…">` через `useHead`,
 *    что переключает CSS-переменные `--color-mts-*` глобально.
 *
 * ВАЖНО: переключение темы НЕ влияет на `.admin-shell` — у админки своя
 * принудительно-светлая палитра, которая перебивает темы публичной части.
 */
export type MarinTheme = 'light' | 'dark'

const THEMES: readonly MarinTheme[] = ['dark', 'light'] as const

function isMarinTheme(value: unknown): value is MarinTheme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

export function useMarinTheme() {
  const cookie = useCookie<MarinTheme>('marin-theme', {
    default: () => 'dark',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  const current = useState<MarinTheme>('marin:theme', () =>
    isMarinTheme(cookie.value) ? cookie.value : 'dark',
  )

  watch(current, (next) => {
    cookie.value = next
  })

  // Прокидываем активную тему на корневой <html>, чтобы CSS-переменные
  // переопределились через :root[data-theme='light'].
  useHead(() => ({
    htmlAttrs: {
      'data-theme': current.value,
    },
  }))

  function set(theme: MarinTheme) {
    if (!isMarinTheme(theme)) return
    current.value = theme
  }

  function toggle() {
    set(current.value === 'dark' ? 'light' : 'dark')
  }

  const isDark = computed(() => current.value === 'dark')
  const isLight = computed(() => current.value === 'light')

  return { current, isDark, isLight, set, toggle }
}
