import type {
  LocalizedLine,
  MainNavMenuFontSize,
  MainNavMenuFontWeight,
  MainNavMenuJustify,
  MainNavMenuTextCase,
  MainNavMenuVariant,
  NavigationBurgerContacts,
  NavigationMenuItem,
  NavigationMenuSettings,
} from '~/types'
import { parseBilingual } from '~/utils/bilingualField'
import { stripHtmlToPlain } from '~/utils/adminHtmlField'

function normMenuVariant(raw: unknown): MainNavMenuVariant {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  return v === 'horizontal' ? 'horizontal' : 'overlay'
}

function normMenuFontSize(raw: unknown): MainNavMenuFontSize {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (v === 'sm' || v === 'lg' || v === 'xl' || v === '2xl') {
    return v
  }
  return 'base'
}

function normMenuFontWeight(raw: unknown): MainNavMenuFontWeight {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (v === 'light' || v === 'normal' || v === 'semibold' || v === 'bold') {
    return v
  }
  return 'medium'
}

function normMenuTextCase(raw: unknown): MainNavMenuTextCase {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (v === 'lowercase' || v === 'uppercase' || v === 'capitalize') {
    return v
  }
  return 'none'
}

function normMenuJustify(raw: unknown): MainNavMenuJustify {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  return v === 'center' ? 'center' : 'between'
}

function normOptionalCssColor(raw: unknown): string | undefined {
  if (typeof raw !== 'string') {
    return undefined
  }
  const s = raw.trim()
  return s !== '' ? s : undefined
}

function normNavItemRow(row: unknown, allowChildren: boolean): NavigationMenuItem | null {
  if (!row || typeof row !== 'object') {
    return null
  }
  const r = row as Record<string, unknown>
  const pathRaw = r.path
  const path = typeof pathRaw === 'string' ? pathRaw.trim() : '/'
  const label = r.label
  if (!label || typeof label !== 'object') {
    return null
  }
  const l = label as Record<string, unknown>
  const ru = typeof l.ru === 'string' ? l.ru : ''
  const en = typeof l.en === 'string' ? l.en : ''
  const item: NavigationMenuItem = {
    path: path || '/',
    label: { ru, en },
  }
  if (allowChildren && Array.isArray(r.children) && r.children.length > 0) {
    const children: NavigationMenuItem[] = []
    for (const c of r.children) {
      const child = normNavItemRow(c, false)
      if (child) {
        children.push(child)
      }
    }
    if (children.length > 0) {
      item.children = children
    }
  }
  return item
}

function normHorizItems(raw: unknown): NavigationMenuItem[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) {
    return undefined
  }
  const out: NavigationMenuItem[] = []
  for (const row of raw) {
    const item = normNavItemRow(row, true)
    if (item) {
      out.push(item)
    }
  }
  return out.length > 0 ? out : undefined
}

function pickBurgerLocalized(o: Record<string, unknown>, camel: string, snake: string): LocalizedLine | undefined {
  for (const k of [camel, snake]) {
    const v = o[k]
    if (v == null) {
      continue
    }
    const p = parseBilingual(v)
    if (p.ru.trim() || p.en.trim()) {
      return typeof v === 'string' ? v.trim() : p
    }
  }
  return undefined
}

function pickBurgerStr(o: Record<string, unknown>, camel: string, snake: string): string | undefined {
  for (const k of [camel, snake]) {
    const v = o[k]
    if (typeof v === 'string' && v.trim() !== '') {
      return v.trim()
    }
  }
  return undefined
}

function plainBurgerUrl(raw: string): string {
  return stripHtmlToPlain(raw).replace(/\s+/g, ' ').trim()
}

function normBurgerContacts(raw: unknown): NavigationBurgerContacts | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }
  const o = raw as Record<string, unknown>
  const out: NavigationBurgerContacts = {}
  const phonesTitle = pickBurgerLocalized(o, 'phonesTitle', 'phones_title')
  if (phonesTitle) {
    out.phonesTitle = phonesTitle
  }
  if (Array.isArray(o.phones)) {
    const phones = o.phones
      .filter((p): p is string => typeof p === 'string' && p.trim() !== '')
      .map(p => p.trim())
    if (phones.length > 0) {
      out.phones = phones
    }
  }
  const emailTitle = pickBurgerLocalized(o, 'emailTitle', 'email_title')
  if (emailTitle) {
    out.emailTitle = emailTitle
  }

  let emails: string[] = []
  if (Array.isArray(o.emails)) {
    emails = o.emails
      .filter((e): e is string => typeof e === 'string' && e.trim() !== '')
      .map(e => e.trim())
  }
  if (emails.length === 0 && typeof o.email === 'string' && o.email.trim() !== '') {
    emails = [o.email.trim()]
  }
  if (emails.length > 0) {
    out.emails = emails
  }

  let socials: NavigationBurgerContacts['socials']
  if (Array.isArray(o.socials)) {
    const list: NonNullable<NavigationBurgerContacts['socials']> = []
    for (const row of o.socials) {
      if (!row || typeof row !== 'object') {
        continue
      }
      const s = row as Record<string, unknown>
      const url = typeof s.url === 'string' ? plainBurgerUrl(s.url) : ''
      if (!url) {
        continue
      }
      const label = typeof s.label === 'string' ? s.label.trim() : ''
      list.push({ url, label: label || url })
    }
    if (list.length > 0) {
      socials = list
    }
  }
  const legUrlRaw = pickBurgerStr(o, 'socialUrl', 'social_url')
  const legUrl = legUrlRaw ? plainBurgerUrl(legUrlRaw) : undefined
  if (!socials && legUrl) {
    const legLabel = pickBurgerStr(o, 'socialLabel', 'social_label') ?? legUrl
    socials = [{ url: legUrl, label: legLabel }]
  }
  if (socials?.length) {
    out.socials = socials
  }

  const oct = pickBurgerLocalized(o, 'officesColumnTitle', 'offices_column_title')
  if (oct) {
    out.officesColumnTitle = oct
  }

  let offices: NavigationBurgerContacts['offices']
  if (Array.isArray(o.offices)) {
    const list: NonNullable<NavigationBurgerContacts['offices']> = []
    for (const row of o.offices) {
      if (!row || typeof row !== 'object') {
        continue
      }
      const x = row as Record<string, unknown>
      const addressPair = parseBilingual(x.address)
      const hasAddress = addressPair.ru.trim() !== '' || addressPair.en.trim() !== ''
      if (!hasAddress) {
        continue
      }
      const titlePair = parseBilingual(x.title)
      const hasTitle = titlePair.ru.trim() !== '' || titlePair.en.trim() !== ''
      const address = typeof x.address === 'string' ? x.address.trim() : addressPair
      const title = typeof x.title === 'string' ? x.title.trim() : titlePair
      list.push(hasTitle ? { title, address } : { address })
    }
    if (list.length > 0) {
      offices = list
    }
  }
  if (!offices) {
    const oa = pickBurgerStr(o, 'officeAddress', 'office_address')
    if (oa) {
      offices = [{ address: oa }]
      if (!out.officesColumnTitle) {
        const ot = pickBurgerLocalized(o, 'officeTitle', 'office_title')
        if (ot) {
          out.officesColumnTitle = ot
        }
      }
    }
  }
  if (offices?.length) {
    out.offices = offices
  }

  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Разбирает ответ GET `/navigation-settings`: Laravel JsonResource даёт `{ data: { main, more } }`,
 * при прямом JSON возможен и корень `{ main, more }`.
 */
export function normalizeNavigationSettingsPayload(json: unknown): NavigationMenuSettings {
  if (!json || typeof json !== 'object') {
    return {
      main: [],
      more: [],
      menuVariant: 'overlay',
      menuFontSize: 'base',
      menuFontWeight: 'medium',
      menuTextCase: 'none',
      menuJustify: 'between',
    }
  }
  const root = json as Record<string, unknown>
  const inner =
    root.data !== undefined && root.data !== null && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root
  const base: NavigationMenuSettings = {
    main: Array.isArray(inner.main) ? inner.main : [],
    more: Array.isArray(inner.more) ? inner.more : [],
    menuVariant: normMenuVariant(inner.menuVariant ?? inner.menu_variant),
    menuFontSize: normMenuFontSize(inner.menuFontSize ?? inner.menu_font_size),
    menuFontWeight: normMenuFontWeight(inner.menuFontWeight ?? inner.menu_font_weight),
    menuTextCase: normMenuTextCase(inner.menuTextCase ?? inner.menu_text_case),
    menuJustify: normMenuJustify(inner.menuJustify ?? inner.menu_justify),
  }
  const hover = normOptionalCssColor(inner.menuItemHoverColor ?? inner.menu_item_hover_color)
  if (hover) {
    base.menuItemHoverColor = hover
  }
  const itemColor = normOptionalCssColor(inner.menuItemColor ?? inner.menu_item_color)
  if (itemColor) {
    base.menuItemColor = itemColor
  }
  const hi = normHorizItems(inner.horizItems ?? inner.horiz_items)
  if (hi) {
    base.horizItems = hi
  }
  const bc = normBurgerContacts(inner.burgerContacts ?? inner.burger_contacts)
  if (bc) {
    base.burgerContacts = bc
  }
  return base
}
