import type { PageInquiryFormConfig, PageInquiryServiceId, PageInquiryVesselType } from '~/types'

export const DEFAULT_PAGE_INQUIRY_VESSEL_TYPES: readonly PageInquiryVesselType[] = [
  'dry_cargo',
  'tanker',
  'container',
  'tug',
  'service',
  'other',
]

export const DEFAULT_PAGE_INQUIRY_REQUIRED_SERVICES: readonly PageInquiryServiceId[] = [
  'technical',
  'crewing',
  'audit',
  'commercial',
  'insurance',
  'other',
]

function normalizeStringList(
  value: unknown,
  fallback: readonly string[],
): string[] {
  if (!Array.isArray(value)) {
    return [...fallback]
  }
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of value) {
    if (typeof row !== 'string') {
      continue
    }
    const trimmed = row.trim()
    if (!trimmed || seen.has(trimmed)) {
      continue
    }
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out.length > 0 ? out : [...fallback]
}

function normalizeLabelsMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {}
  }
  const raw = value as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const [key, val] of Object.entries(raw)) {
    const id = key.trim()
    if (!id || typeof val !== 'string') {
      continue
    }
    const label = val.trim()
    if (!label) {
      continue
    }
    out[id] = label
  }
  return out
}

export function normalizePageInquiryFormConfig(
  raw: unknown,
): PageInquiryFormConfig {
  const cfg = raw && typeof raw === 'object' ? (raw as PageInquiryFormConfig) : {}
  const vesselTypes = normalizeStringList(cfg.vesselTypes, DEFAULT_PAGE_INQUIRY_VESSEL_TYPES)
  const requiredServices = normalizeStringList(
    cfg.requiredServices,
    DEFAULT_PAGE_INQUIRY_REQUIRED_SERVICES,
  )
  const rawVesselLabels = normalizeLabelsMap(cfg.vesselTypeLabels)
  const rawServiceLabels = normalizeLabelsMap(cfg.requiredServiceLabels)
  const vesselTypeLabels: Record<string, string> = {}
  const requiredServiceLabels: Record<string, string> = {}

  for (const id of vesselTypes) {
    if (rawVesselLabels[id]) {
      vesselTypeLabels[id] = rawVesselLabels[id]
    }
  }
  for (const id of requiredServices) {
    if (rawServiceLabels[id]) {
      requiredServiceLabels[id] = rawServiceLabels[id]
    }
  }

  return {
    vesselTypes,
    requiredServices,
    vesselTypeLabels,
    requiredServiceLabels,
  }
}
