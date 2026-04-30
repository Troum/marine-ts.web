import type { ContactQuickIconKey, SiteContactSettings } from '~/types'
import { contactSettingsDefaults } from '~/utils/contactSettingsDefaults'

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
    if (Array.isArray(o.quick) || Array.isArray(o.offices)) {
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

export function normalizeContactSettingsPayload(json: unknown): SiteContactSettings {
  const def = contactSettingsDefaults
  const inner = unwrapContactSettingsPayload(json)
  if (!inner) {
    return structuredClone(def)
  }

  const quickRaw = Array.isArray(inner.quick) ? inner.quick : []
  const quick = quickRaw
    .map((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null
      }
      const row = raw as Record<string, unknown>
      const fallback = def.quick[index] ?? def.quick[0]
      return {
        iconKey: normalizeIconKey(row.iconKey ?? row.icon_key ?? row.icon, fallback.iconKey),
        label: asString(row.label, fallback.label),
        value: asString(row.value, fallback.value),
        href: asTrimmedNullable(row.href ?? row.link),
      }
    })
    .filter((row): row is SiteContactSettings['quick'][number] => row !== null)

  const officesRaw = Array.isArray(inner.offices) ? inner.offices : []
  const offices = officesRaw
    .map((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null
      }
      const row = raw as Record<string, unknown>
      const fallback = def.offices[index] ?? def.offices[0]
      return {
        city: asString(row.city, fallback.city),
        country: asString(row.country, fallback.country),
        address: asString(row.address, fallback.address),
        phone: asString(row.phone, fallback.phone),
        email: asString(row.email, fallback.email),
      }
    })
    .filter((row): row is SiteContactSettings['offices'][number] => row !== null)

  return {
    quick: quick.length ? quick : structuredClone(def.quick),
    offices: offices.length ? offices : structuredClone(def.offices),
  }
}

export function serializeContactSettingsPayload(body: SiteContactSettings): Record<string, unknown> {
  return {
    quick: body.quick.map((row) => {
      const iconKey = normalizeIconKey(row.iconKey, 'phone')
      return {
        iconKey,
        icon_key: iconKey,
        icon: iconKey,
        label: String(row.label ?? ''),
        value: String(row.value ?? ''),
        href: row.href?.trim() ? row.href.trim() : null,
      }
    }),
    offices: body.offices.map((office) => ({
      city: String(office.city ?? ''),
      country: String(office.country ?? ''),
      address: String(office.address ?? ''),
      phone: String(office.phone ?? ''),
      email: String(office.email ?? ''),
    })),
  }
}
