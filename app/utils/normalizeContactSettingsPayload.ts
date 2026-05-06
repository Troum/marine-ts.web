import type { ContactQuickIconKey, ContactSocialLink, LocalizedLine, SiteContactSettings } from '~/types'
import { parseBilingual } from '~/utils/bilingualField'
import { contactSettingsDefaults } from '~/utils/contactSettingsDefaults'

function normLocalized(raw: unknown, fallback: LocalizedLine): LocalizedLine {
  const fb = parseBilingual(fallback)
  return parseBilingual(raw, fb.ru, fb.en)
}

function serializeLocalized(value: LocalizedLine): string | { ru: string; en: string } {
  if (typeof value === 'string') {
    return value
  }
  return { ru: value.ru ?? '', en: value.en ?? '' }
}

function unwrapContactSettingsPayload(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return null
  }
  let cur: unknown = json
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) {
      return null
    }
    const o = cur as Record<string, unknown>
    if (Array.isArray(o.quick) || Array.isArray(o.offices) || Array.isArray(o.departments) || Array.isArray(o.socials)) {
      return o
    }
    const next = o.data
    if (next && typeof next === 'object' && !Array.isArray(next)) {
      cur = next
      continue
    }
    return null
  }
  return null
}

function normalizeIconKey(raw: unknown, fallback: ContactQuickIconKey): ContactQuickIconKey {
  if (typeof raw !== 'string') {
    return fallback
  }
  const key = raw.trim().toLowerCase().replace(/_/g, '-')
  if (key === 'phone') return 'phone'
  if (key === 'mail' || key === 'email') return 'mail'
  if (key === 'map-pin' || key === 'mappin' || key === 'address') return 'map-pin'
  if (key === 'clock' || key === 'time') return 'clock'
  if (key === 'link' || key === 'external-link') return 'link'
  if (key === 'linkedin' || key === 'linked-in') return 'linkedin'
  if (key === 'vk' || key === 'vkontakte') return 'vk'
  if (key === 'max') return 'max'
  return fallback
}

function asString(raw: unknown, fallback = ''): string {
  return typeof raw === 'string' ? raw : fallback
}

function asTrimmedNullable(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null
  }
  const v = raw.trim()
  return v ? v : null
}

function asBool(raw: unknown, fallback: boolean): boolean {
  return typeof raw === 'boolean' ? raw : fallback
}

export function normalizeContactSettingsPayload(json: unknown): SiteContactSettings {
  const def = contactSettingsDefaults
  const defaultQuick = def.quick[0] ?? { iconKey: 'phone' as const, label: '', value: '', href: null, showInFooter: true }
  const defaultDepartment = def.departments[0] ?? { title: '', phone: '', email: '', showInFooter: false }
  const defaultOffice = def.offices[0] ?? { city: '', country: '', address: '', phone: '', email: '' }
  const inner = unwrapContactSettingsPayload(json)
  if (!inner) {
    return structuredClone(def)
  }

  const quickRaw = Array.isArray(inner.quick) ? inner.quick : []
  const quick = quickRaw
    .flatMap((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return []
      }
      const row = raw as Record<string, unknown>
      const fallback = def.quick[index] ?? defaultQuick
      return [{
        iconKey: normalizeIconKey(row.iconKey ?? row.icon_key ?? row.icon, fallback.iconKey),
        label: normLocalized(row.label, fallback.label),
        value: normLocalized(row.value, fallback.value),
        href: asTrimmedNullable(row.href ?? row.link),
        showInFooter: asBool(row.showInFooter ?? row.show_in_footer, fallback.showInFooter ?? true),
      }]
    })

  const departmentsRaw = Array.isArray(inner.departments) ? inner.departments : []
  const departments = departmentsRaw
    .flatMap((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return []
      }
      const row = raw as Record<string, unknown>
      const fallback = def.departments[index] ?? defaultDepartment
      return [{
        title: normLocalized(row.title, fallback.title),
        phone: normLocalized(row.phone, fallback.phone),
        email: asString(row.email, fallback.email),
        showInFooter: asBool(row.showInFooter ?? row.show_in_footer, fallback.showInFooter ?? false),
      }]
    })

  const officesRaw = Array.isArray(inner.offices) ? inner.offices : []
  const offices = officesRaw
    .flatMap((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return []
      }
      const row = raw as Record<string, unknown>
      const fallback = def.offices[index] ?? defaultOffice
      return [{
        city: normLocalized(row.city, fallback.city),
        country: normLocalized(row.country, fallback.country),
        address: normLocalized(row.address, fallback.address),
        phone: asString(row.phone, fallback.phone),
        email: asString(row.email, fallback.email),
      }]
    })

  const socialsRaw = Array.isArray(inner.socials) ? inner.socials : []
  const socials: ContactSocialLink[] = socialsRaw.flatMap((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
    const row = raw as Record<string, unknown>
    const iconKey = typeof row.iconKey === 'string' ? row.iconKey.trim() : ''
    const url = typeof row.url === 'string' ? row.url.trim() : ''
    if (!iconKey || !url) return []
    return [{ iconKey, url }]
  })

  return {
    socials,
    quick: quick.length ? quick : structuredClone(def.quick),
    departments: departments.length ? departments : structuredClone(def.departments),
    offices: offices.length ? offices : structuredClone(def.offices),
  }
}

export function serializeContactSettingsPayload(body: SiteContactSettings): Record<string, unknown> {
  return {
    socials: (body.socials ?? []).map((s) => ({
      iconKey: s.iconKey,
      url: s.url.trim(),
    })),
    quick: body.quick.map((row) => {
      const iconKey = normalizeIconKey(row.iconKey, 'phone')
      return {
        iconKey,
        icon_key: iconKey,
        icon: iconKey,
        label: serializeLocalized(row.label),
        value: serializeLocalized(row.value),
        href: row.href?.trim() ? row.href.trim() : null,
        showInFooter: row.showInFooter === true,
        show_in_footer: row.showInFooter === true,
      }
    }),
    departments: body.departments.map((department) => ({
      title: serializeLocalized(department.title),
      phone: serializeLocalized(department.phone),
      email: String(department.email ?? ''),
      showInFooter: department.showInFooter === true,
      show_in_footer: department.showInFooter === true,
    })),
    offices: body.offices.map((office) => ({
      city: serializeLocalized(office.city),
      country: serializeLocalized(office.country),
      address: serializeLocalized(office.address),
      phone: String(office.phone ?? ''),
      email: String(office.email ?? ''),
    })),
  }
}
