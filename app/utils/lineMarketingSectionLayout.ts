import type { LineMarketingSectionId } from '~/types'

export type LineMarketingLayoutChunk =
  | { kind: 'directions' }
  | { kind: 'checklist' }
  | { kind: 'pair'; left: 'principles' | 'audience'; right: 'principles' | 'audience' }
  | { kind: 'single'; id: 'principles' | 'audience' }
  | { kind: 'custom'; customId: string }

const isVis = (visibility: Record<string, boolean> | undefined, k: string): boolean => visibility?.[k] !== false

/**
 * Строит порядок отображения секций после hero.
 * Встроенные «Принципы» + «Кому подходит» подряд — одна сетка из двух колонок.
 * Ключи `custom:<uuid>` — пользовательские секции.
 */
export function buildLineMarketingLayoutChunks(
  sectionOrder: string[] | undefined,
  visibility: Record<string, boolean> | undefined,
  defaultBuiltinOrder: LineMarketingSectionId[],
): LineMarketingLayoutChunk[] {
  const order = sectionOrder?.length ? [...sectionOrder] : [...defaultBuiltinOrder]
  const ordered = order.filter((k) => isVis(visibility, k))
  const seen = new Set<string>()
  const orderedUnique = ordered.filter((k) => (seen.has(k) ? false : (seen.add(k), true)))

  const chunks: LineMarketingLayoutChunk[] = []
  let i = 0
  while (i < orderedUnique.length) {
    const k = orderedUnique[i]
    const n = orderedUnique[i + 1]

    if (k.startsWith('custom:')) {
      chunks.push({ kind: 'custom', customId: k.slice(7) })
      i += 1
      continue
    }

    if (
      (k === 'principles' && n === 'audience') ||
      (k === 'audience' && n === 'principles')
    ) {
      chunks.push({ kind: 'pair', left: k, right: n })
      i += 2
      continue
    }
    if (k === 'directions') {
      chunks.push({ kind: 'directions' })
      i += 1
      continue
    }
    if (k === 'checklist') {
      chunks.push({ kind: 'checklist' })
      i += 1
      continue
    }
    if (k === 'principles' || k === 'audience') {
      chunks.push({ kind: 'single', id: k })
      i += 1
      continue
    }
    i += 1
  }
  return chunks
}
