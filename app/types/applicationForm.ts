/** Строка таблицы с номером, местом и датами выдачи/окончания (документы, сертификаты). */
export interface CertTableRow {
  number: string
  placeOfIssue: string
  dateOfIssue: string
  dateOfExpire: string
  /** Для дополнительных строк: своё название документа / сертификата. */
  customLabel?: string
}

/** Строка морской службы. */
export interface SeaServiceRow {
  rank: string
  company: string
  flag: string
  vesselName: string
  grtDwt: string
  vesselType: string
  engineKw: string
  signOn: string
  signOff: string
}

/** Строка образования. */
export interface EducationRow {
  schoolName: string
  from: string
  till: string
  degreeType: string
}

/** Полная анкета (структура совместима с шаблоном PDF). */
export interface VacancyApplicationForm {
  vacancySlug: string
  /** Одна или несколько позиций (список из админки и/или название вакансии). */
  positionApplyingFor: string[]

  surnameAndName: string
  dateOfBirth: string
  photoFileName: string | null

  lastName: string
  firstName: string
  fathersName: string
  maritalStatus: string
  placeOfBirth: string
  availableFrom: string
  citizenship: string
  englishLevel: string
  mobilePhone: string
  homePhone: string
  email: string
  messenger: string
  homeAddress: string
  nearestAirport: string

  nokLastName: string
  nokFirstName: string
  nokContactNumber: string
  nokEmail: string
  nokRelationship: string
  nokAddress: string

  travelRows: { label: string; data: CertTableRow }[]
  travelOtherRows: CertTableRow[]

  competencyRows: { label: string; data: CertTableRow }[]
  competencyOtherRows: CertTableRow[]

  otherCertificateRows: { label: string; data: CertTableRow }[]
  otherCertificateExtraRows: CertTableRow[]

  seaServiceRows: SeaServiceRow[]

  educationRows: EducationRow[]

  safetyOverallSize: string
  safetyHeight: string
  safetyShoeSize: string
  safetyWeight: string

  consentRuAccuracy: boolean
  consentRuPd: boolean
  consentEnAccuracy: boolean
  consentEnPd: boolean
  /** Типы судов по желанию кандидата (1–3 значения из списка в админке). */
  desiredVesselTypes: string[]
}

export function emptyCertRow(): CertTableRow {
  return { number: '', placeOfIssue: '', dateOfIssue: '', dateOfExpire: '' }
}

/** Строка в блоке «дополнительные документы» — с полем названия. */
export function emptyCertRowExtra(): CertTableRow {
  return { ...emptyCertRow(), customLabel: '' }
}

export function emptySeaServiceRow(): SeaServiceRow {
  return {
    rank: '',
    company: '',
    flag: '',
    vesselName: '',
    grtDwt: '',
    vesselType: '',
    engineKw: '',
    signOn: '',
    signOff: '',
  }
}

export function emptyEducationRow(): EducationRow {
  return {
    schoolName: '',
    from: '',
    till: '',
    degreeType: '',
  }
}

export const TRAVEL_DOC_LABELS = [
  'Travelling passport',
  'Civil passport',
  'SBK',
  'SID',
  'Schengen visa',
  'US VISA (C1/D)',
] as const

export const COMPETENCY_LABELS = [
  'Certificate of Competency № (CoC)',
  'CoC Certificate of Endorsement №',
  'GMDSS Operator Certificate № (GOC)',
  'GOC Certificate of Endorsement №',
] as const

export const OTHER_CERT_LABELS = [
  'Basic Safety Training & Instruction (Table A-VI/1-1)',
  'Proficiency in Survival craft & Rescue Boats (Table A-VI/2-1)',
  'Advanced Fire Fighting (Table A-VI/3)',
  'Medical First Aid (Table A-VI/4-1)',
  'Medical Care (Table A-VI/4-2)',
  'Security training for seafarers with designated security duties (Table A-VI/6-2)',
  'Security Awareness Training (Table A-VI/ 6-1)',
  'Operational use of automatic radar plotting aids (ARPA)',
  'Radar observation and plotting (RADAR)',
  'ECDIS',
  'HAZMAT',
  'Bridge team and resource management',
  'Vaccination/YF',
  'Medical Health Certificate',
  'ISPS/SSO',
  'Tanker certificates:',
] as const
