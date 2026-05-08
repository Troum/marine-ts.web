import type { ApplicationFormItem } from '~/types'

/** Фильтры по полям JSON-payload анкеты (админка). */
export interface ApplicationFormPayloadFilterState {
  /** Точное совпадение с одним из значений `positionApplyingFor`. */
  position: string
  /** Одно из значений `desiredVesselTypes`. */
  vesselType: string
  /** Подстрока в `citizenship` (без учёта регистра). */
  citizenship: string
  /** Подстрока в `englishLevel`. */
  englishLevel: string
  /** Подстрока в блоке морской службы: судно, тип, компания, ранг, флаг. */
  seaServiceSearch: string
  /** Только открытая форма / только привязанные к вакансии / все. */
  vacancyScope: 'all' | 'open' | 'with_vacancy'
}

export function defaultApplicationFormPayloadFilters(): ApplicationFormPayloadFilterState {
  return {
    position: '',
    vesselType: '',
    citizenship: '',
    englishLevel: '',
    seaServiceSearch: '',
    vacancyScope: 'all',
  }
}

export function hasActiveApplicationFormPayloadFilters(f: ApplicationFormPayloadFilterState): boolean {
  return (
    !!f.position ||
    !!f.vesselType ||
    f.citizenship.trim().length > 0 ||
    f.englishLevel.trim().length > 0 ||
    f.seaServiceSearch.trim().length > 0 ||
    f.vacancyScope !== 'all'
  )
}

function readStringArray(payload: Record<string, unknown>, key: string): string[] {
  const raw = payload[key]
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((x) => String(x ?? '').trim()).filter(Boolean)
}

function seaServiceRowSearchBlob(row: Record<string, unknown>): string {
  const keys = [
    'vesselName',
    'vessel_name',
    'vesselType',
    'vessel_type',
    'company',
    'rank',
    'flag',
    'grtDwt',
    'grt_dwt',
    'engineKw',
    'engine_kw',
  ]
  return keys
    .map((k) => String(row[k] ?? '').trim())
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function applicationFormMatchesPayloadFilters(
  row: ApplicationFormItem,
  f: ApplicationFormPayloadFilterState,
): boolean {
  const p = row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : {}

  if (f.vacancyScope === 'open' && row.vacancyId != null) {
    return false
  }
  if (f.vacancyScope === 'with_vacancy' && row.vacancyId == null) {
    return false
  }

  if (f.position) {
    const positions = readStringArray(p, 'positionApplyingFor')
    if (!positions.includes(f.position)) {
      return false
    }
  }

  if (f.vesselType) {
    const types = readStringArray(p, 'desiredVesselTypes')
    if (!types.includes(f.vesselType)) {
      return false
    }
  }

  const citQ = f.citizenship.trim().toLowerCase()
  if (citQ) {
    const c = String(p.citizenship ?? '').toLowerCase()
    if (!c.includes(citQ)) {
      return false
    }
  }

  const enQ = f.englishLevel.trim().toLowerCase()
  if (enQ) {
    const e = String(p.englishLevel ?? '').toLowerCase()
    if (!e.includes(enQ)) {
      return false
    }
  }

  const seaQ = f.seaServiceSearch.trim().toLowerCase()
  if (seaQ) {
    const rawRows = p.seaServiceRows
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return false
    }
    const hit = rawRows.some((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return false
      }
      return seaServiceRowSearchBlob(item as Record<string, unknown>).includes(seaQ)
    })
    if (!hit) {
      return false
    }
  }

  return true
}
