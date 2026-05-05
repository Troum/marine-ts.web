import type { AboutRichCard } from '~/types'

/** Значение опции «Авто» в AdminIconSelect для карточек AboutRichCard. */
export const ABOUT_RICH_CARD_ICON_AUTO = '__about-rich-icon-auto__' as const

export function normalizeAboutRichCards(incoming: unknown, fallback: AboutRichCard[]): AboutRichCard[] {
  if (!Array.isArray(incoming)) {
    return fallback.map((c) => ({ ...c }))
  }
  if (incoming.length === 0) {
    return []
  }
  return incoming.map((item, i) => {
    const fb = fallback[i]
    const it = item as { title?: unknown; text?: unknown; icon?: unknown; hideIcon?: unknown }
    const card: AboutRichCard = {
      title: typeof it?.title === 'string' ? it.title : (fb?.title ?? ''),
      text: typeof it?.text === 'string' ? it.text : (fb?.text ?? ''),
    }
    if (typeof it?.icon === 'string') {
      const t = it.icon.trim()
      if (t) {
        card.icon = t
      }
    } else if (fb?.icon?.trim()) {
      card.icon = fb.icon.trim()
    }
    if (typeof it?.hideIcon === 'boolean') {
      card.hideIcon = it.hideIcon
    } else if (fb?.hideIcon !== undefined) {
      card.hideIcon = fb.hideIcon
    }
    return card
  })
}
