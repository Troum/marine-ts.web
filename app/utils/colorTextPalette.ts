/**
 * Палитры для color popover (порт TEXT_COLORS / HIGHLIGHT_COLORS из TipTap UI Components).
 * Цвета подобраны под свет/тёмную тему MTS: одинаково контрастны на светлом и тёмном фоне.
 */

export interface ColorOption {
  /** Машинный id (используется как key и для recent). */
  value: string
  /** Подпись для tooltip / aria-label. */
  label: string
}

/**
 * Цвета текста. `value === ''` означает «убрать цвет» (unsetColor).
 */
export const TEXT_COLORS: ColorOption[] = [
  { value: '', label: 'По умолчанию' },
  /* Цвета темы Marin (как фиксированные swatch-значения, без семантических тонов). */
  { value: '#1c1c1e', label: 'Тема: Основной' },
  { value: '#6c757d', label: 'Тема: Вторичный' },
  { value: '#adb5bd', label: 'Тема: Приглушённый' },
  { value: '#ffffff', label: 'Белый' },
  { value: '#f5f5f5', label: 'Почти белый' },
  { value: '#000000', label: 'Чёрный' },
  { value: '#de7879', label: 'Тема: Акцент' },
  { value: '#e89495', label: 'Тема: Акцент светлый' },
  { value: '#b85e5f', label: 'Тема: Акцент тёмный' },
  { value: '#c14042', label: 'Тема: Красный #C14042' },
  { value: '#2ea3ff', label: 'Тема: Маркер' },
  /* Golden Sepia / тёмная публичная тема (см. `mts-theme-scglobal` в main.css). */
  { value: '#c69c6d', label: 'Golden Sepia: Акцент' },
  { value: '#d4b996', label: 'Golden Sepia: Акцент светлый' },
  { value: '#a07d53', label: 'Golden Sepia: Акцент тёмный' },
  { value: '#b88d5a', label: 'Golden Sepia: Медь' },
  /* Тёмно-синие (контраст на светлых карточках, подписи на героях). */
  { value: '#0a1628', label: 'Тема: Navy' },
  { value: '#131f33', label: 'Тема: Navy глубокий' },
  { value: '#1b2940', label: 'Тема: Поверхность' },
  /* Доп. акценты для длинных текстов и ссылок. */
  { value: '#15803d', label: 'Зелёный' },
  { value: '#b45309', label: 'Оранжевый' },
  { value: '#1d4ed8', label: 'Синий' },
  { value: '#7c3aed', label: 'Фиолетовый' },
]

/**
 * Цвета подсветки (фон). `value === ''` — убрать подсветку.
 * Берём пастельные оттенки, читаемые на светлом и не «выжигающие» на тёмном.
 */
export const HIGHLIGHT_COLORS: ColorOption[] = [
  { value: '', label: 'Без подсветки' },
  { value: '#fef3c7', label: 'Жёлтая' },
  { value: '#fee2e2', label: 'Розовая' },
  { value: '#ffedd5', label: 'Оранжевая' },
  { value: '#dcfce7', label: 'Зелёная' },
  { value: '#dbeafe', label: 'Голубая' },
  { value: '#cffafe', label: 'Циан' },
  { value: '#e0f2fe', label: 'Небесная' },
  { value: '#ede9fe', label: 'Сиреневая' },
  { value: '#fce7f3', label: 'Малиновая' },
  { value: '#f3f4f6', label: 'Серая' },
  { value: '#e2e8f0', label: 'Серый холодный' },
  { value: '#ffffff', label: 'Белая' },
  /* Под Golden Sepia / тёплые врезы. */
  { value: '#f5e6d3', label: 'Крем (sepia)' },
  { value: '#ede4d6', label: 'Тёплый песок' },
  { value: '#e8dfd0', label: 'Золотистая подсветка' },
]

/** Поиск опции по hex-значению (или пустой строке) — для tooltips и активного состояния. */
export function getColorByValue(value: string | null | undefined, palette: ColorOption[]): ColorOption | null {
  if (value == null) {
    return null
  }
  const v = value.toLowerCase()
  return palette.find((c) => c.value.toLowerCase() === v) ?? null
}
