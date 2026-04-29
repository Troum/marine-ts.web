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
  { value: '#de7879', label: 'Тема: Акцент' },
  { value: '#e89495', label: 'Тема: Акцент светлый' },
  { value: '#b85e5f', label: 'Тема: Акцент тёмный' },
  { value: '#c14042', label: 'Тема: Красный #C14042' },
  { value: '#2ea3ff', label: 'Тема: Маркер' },
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
  { value: '#ede9fe', label: 'Сиреневая' },
  { value: '#fce7f3', label: 'Малиновая' },
  { value: '#f3f4f6', label: 'Серая' },
  { value: '#ffffff', label: 'Белая' },
]

/** Поиск опции по hex-значению (или пустой строке) — для tooltips и активного состояния. */
export function getColorByValue(value: string | null | undefined, palette: ColorOption[]): ColorOption | null {
  if (value == null) {
    return null
  }
  const v = value.toLowerCase()
  return palette.find((c) => c.value.toLowerCase() === v) ?? null
}
