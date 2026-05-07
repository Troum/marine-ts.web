/**
 * Отображение payload анкеты в админке (лейблы согласованы с ApplicationFormPdfPresenter в API).
 */

function fieldLabel(key: string): string {
  const map: Record<string, string> = {
    vacancySlug: 'Slug вакансии',
    positionApplyingFor: 'Должность',
    surnameAndName: 'Фамилия и имя (одной строкой)',
    dateOfBirth: 'Дата рождения',
    photoFileName: 'Файл фото',
    lastName: 'Фамилия',
    firstName: 'Имя',
    fathersName: 'Отчество',
    maritalStatus: 'Семейное положение',
    placeOfBirth: 'Место рождения',
    availableFrom: 'Доступен с',
    citizenship: 'Гражданство',
    englishLevel: 'Уровень английского',
    desiredVesselTypes: 'Желаемый тип судна',
    mobilePhone: 'Мобильный телефон',
    homePhone: 'Домашний телефон',
    email: 'Email (из анкеты)',
    messenger: 'Мессенджер',
    homeAddress: 'Адрес',
    nearestAirport: 'Ближайший аэропорт',
    nokLastName: 'Родственник: фамилия',
    nokFirstName: 'Родственник: имя',
    nokContactNumber: 'Родственник: контакт',
    nokEmail: 'Родственник: email',
    nokRelationship: 'Родственник: степень родства',
    nokAddress: 'Родственник: адрес',
    travelRows: 'Документы для поездок',
    travelOtherRows: 'Доп. документы для поездок',
    competencyRows: 'Сертификаты компетенций',
    competencyOtherRows: 'Доп. сертификаты компетенций',
    otherCertificateRows: 'Прочие сертификаты',
    otherCertificateExtraRows: 'Доп. прочие сертификаты',
    seaServiceRows: 'Морская служба',
    educationRows: 'Образование',
    safetyOverallSize: 'Размер одежды (overall)',
    safetyHeight: 'Рост',
    safetyShoeSize: 'Размер обуви',
    safetyWeight: 'Вес',
    consentRuAccuracy: 'Согласие (RU): достоверность',
    consentRuPd: 'Согласие (RU): ПД',
    consentEnAccuracy: 'Согласие (EN): достоверность',
    consentEnPd: 'Согласие (EN): ПД',
    supplementaryFiles: 'Дополнительно загруженные файлы (по ссылке)',
  }
  return map[key] ?? key
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—'
  }
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет'
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return formatArrayValue(value)
  }
  if (typeof value === 'object') {
    return formatAssocOrList(value as Record<string, unknown>)
  }
  return JSON.stringify(value, null, 2)
}

function isListArray(arr: unknown[]): boolean {
  const n = arr.length
  if (n === 0) {
    return true
  }
  for (let i = 0; i < n; i++) {
    if (!(i in arr)) {
      return false
    }
  }
  return true
}

function formatArrayValue(value: unknown[]): string {
  if (value.length === 0) {
    return '—'
  }
  if (isListArray(value)) {
    if (value.every((item) => item !== null && typeof item !== 'object')) {
      return value.map(String).join(', ')
    }
    const blocks: string[] = []
    for (let i = 0; i < value.length; i++) {
      const item = value[i]
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        blocks.push(`— Запись ${i + 1}:\n${formatAssocOrList(item as Record<string, unknown>)}`)
      } else {
        blocks.push(`— ${String(item)}`)
      }
    }
    return blocks.join('\n\n')
  }
  return formatAssocOrList(value as unknown as Record<string, unknown>)
}

function formatAssocOrList(item: Record<string, unknown>): string {
  const lines: string[] = []
  for (const [k, v] of Object.entries(item)) {
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      lines.push(`${fieldLabel(k)}:\n${formatValue(v)}`)
    } else {
      lines.push(`${fieldLabel(k)}: ${formatValue(v)}`)
    }
  }
  return lines.join('\n')
}

export interface PayloadDisplayRow {
  label: string
  value: string
}

export function applicationFormPayloadRows(payload: Record<string, unknown> | null | undefined): PayloadDisplayRow[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const rows: PayloadDisplayRow[] = []
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'supplementaryFiles') {
      continue
    }
    rows.push({ label: fieldLabel(key), value: formatValue(value) })
  }
  return rows
}

export interface SupplementaryFileMeta {
  key: string
  originalName: string
  uploadedAt: string
}

export function supplementaryFilesFromPayload(
  payload: Record<string, unknown> | null | undefined,
): SupplementaryFileMeta[] {
  const raw = payload?.supplementaryFiles
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return []
  }
  const out: SupplementaryFileMeta[] = []
  for (const [key, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      continue
    }
    const e = entry as Record<string, unknown>
    const originalName = typeof e.originalName === 'string' ? e.originalName : key
    const uploadedAt = typeof e.uploadedAt === 'string' ? e.uploadedAt : ''
    out.push({ key, originalName, uploadedAt })
  }
  return out
}
