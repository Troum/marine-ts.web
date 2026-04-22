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
  { value: '#0f172a', label: 'Чёрный' },
  { value: '#475569', label: 'Серый' },
  { value: '#dc2626', label: 'Красный' },
  { value: '#ea580c', label: 'Оранжевый' },
  { value: '#ca8a04', label: 'Жёлтый' },
  { value: '#16a34a', label: 'Зелёный' },
  { value: '#0ea5e9', label: 'Голубой' },
  { value: '#2563eb', label: 'Синий' },
  { value: '#9333ea', label: 'Фиолетовый' },
  { value: '#db2777', label: 'Розовый' },
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
]

/** Поиск опции по hex-значению (или пустой строке) — для tooltips и активного состояния. */
export function getColorByValue(value: string | null | undefined, palette: ColorOption[]): ColorOption | null {
  if (value == null) {
    return null
  }
  const v = value.toLowerCase()
  return palette.find((c) => c.value.toLowerCase() === v) ?? null
}
