import lucideWordRu from './lucideWordRu.json'
import { LUCIDE_WORD_RU_OVERRIDES } from './lucideWordRuOverrides'

type WordMap = Record<string, string>

const BASE = lucideWordRu as WordMap

function tokenToRu(token: string): string {
  return LUCIDE_WORD_RU_OVERRIDES[token] ?? BASE[token] ?? token
}

/** Русская подпись по имени компонента Lucide (PascalCase). */
export function lucideIconNameToRuLabel(iconPascalName: string): string {
  const parts = iconPascalName.match(/[A-Z][a-z]*|[0-9]+/g)
  if (!parts?.length) {
    return iconPascalName
  }
  return parts.map(tokenToRu).join(' ')
}
