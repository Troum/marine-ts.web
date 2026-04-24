import type { LineMarketingCustomSection } from '~/types'

/**
 * Утилиты для работы с порядком/видимостью секций админ-форм.
 *
 * Каждая страница (главная, about, листинги) хранит:
 *  - `sectionOrder?: string[]` — порядок ID секций (без hero, который всегда первый).
 *    Может содержать ключи вида `custom:<uuid>` для пользовательских секций.
 *  - `sectionVisibility?: Record<string, boolean>` — карта показа/скрытия;
 *    отсутствие ключа трактуется как «показывать».
 *
 * Эти хелперы помогают админ-формам и публичным страницам единообразно
 * читать/изменять структуру.
 */

/** Возвращает порядок с учётом дефолтов и обрезкой неизвестных встроенных ключей. */
export function resolveSectionOrder(
  current: string[] | undefined,
  defaultOrder: readonly string[],
  customSections: LineMarketingCustomSection[] | undefined,
): string[] {
  const knownBuiltins = new Set(defaultOrder)
  const customKeys = new Set((customSections ?? []).map((s) => `custom:${s.id}`))
  const seen = new Set<string>()
  const result: string[] = []
  // 1) сначала всё, что уже было в сохранённом порядке
  for (const k of current ?? []) {
    if (seen.has(k)) continue
    if (knownBuiltins.has(k) || k.startsWith('custom:')) {
      // skip custom keys whose section больше нет
      if (k.startsWith('custom:') && !customKeys.has(k)) continue
      result.push(k)
      seen.add(k)
    }
  }
  // 2) добор недостающих встроенных секций
  for (const k of defaultOrder) {
    if (!seen.has(k)) {
      result.push(k)
      seen.add(k)
    }
  }
  // 3) добор недостающих кастомных
  for (const k of customKeys) {
    if (!seen.has(k)) {
      result.push(k)
      seen.add(k)
    }
  }
  return result
}

/** true если секция должна показываться (отсутствие ключа = показывать). */
export function isSectionVisible(
  visibility: Record<string, boolean> | undefined,
  id: string,
): boolean {
  return visibility?.[id] !== false
}

/** Меняет местами секции по индексам в массиве порядка. Возвращает новый массив. */
export function moveOrderItem(order: string[], index: number, delta: number): string[] {
  const j = index + delta
  if (j < 0 || j >= order.length) return order
  const next = [...order]
  const t = next[index]!
  next[index] = next[j]!
  next[j] = t
  return next
}

/** Возвращает только видимые секции в правильном порядке. */
export function visibleOrderedSections(
  current: string[] | undefined,
  defaultOrder: readonly string[],
  customSections: LineMarketingCustomSection[] | undefined,
  visibility: Record<string, boolean> | undefined,
): string[] {
  return resolveSectionOrder(current, defaultOrder, customSections).filter((k) =>
    isSectionVisible(visibility, k),
  )
}
