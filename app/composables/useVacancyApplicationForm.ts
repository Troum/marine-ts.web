import {type CertTableRow, emptyCertRow, type SeaServiceRow, type VacancyApplicationForm} from '~/types/applicationForm'
import {
  COMPETENCY_LABELS,
  emptyCertRowExtra,
  emptyEducationRow,
  emptySeaServiceRow,
  OTHER_CERT_LABELS,
  TRAVEL_DOC_LABELS,
} from '~/types/applicationForm'

function mapLabels(labels: readonly string[]): { label: string; data: CertTableRow }[] {
  return labels.map((label) => ({ label, data: emptyCertRow() }))
}

export function createVacancyApplicationForm(vacancySlug: string, positionTitle: string): VacancyApplicationForm {
  const sea: SeaServiceRow[] = Array.from({ length: 4 }, () => emptySeaServiceRow())

  const title = positionTitle.trim()
  return {
    vacancySlug,
    positionApplyingFor: title ? [title] : [],

    surnameAndName: '',
    dateOfBirth: '',
    photoFileName: null,

    lastName: '',
    firstName: '',
    expectedMonthlySalaryCurrency: 'RUB',
    expectedMonthlySalary: '',
    maritalStatus: '',
    placeOfBirth: '',
    availableFrom: '',
    citizenship: '',
    englishLevel: '',
    mobilePhone: '',
    email: '',
    homeAddress: '',
    nearestAirport: '',

    nokLastName: '',
    nokFirstName: '',
    nokContactNumber: '',
    nokEmail: '',
    nokRelationship: '',
    nokAddress: '',

    travelRows: mapLabels(TRAVEL_DOC_LABELS),
    travelOtherRows: [emptyCertRowExtra()],

    competencyRows: mapLabels(COMPETENCY_LABELS),
    competencyOtherRows: [emptyCertRowExtra()],

    otherCertificateRows: mapLabels(OTHER_CERT_LABELS),
    otherCertificateExtraRows: [emptyCertRowExtra()],

    seaServiceRows: sea,

    educationRows: [emptyEducationRow(), emptyEducationRow()],

    safetyOverallSize: '',
    safetyHeight: '',
    safetyShoeSize: '',
    safetyWeight: '',

    consentRuAccuracy: false,
    consentRuPd: false,
    consentEnAccuracy: false,
    consentEnPd: false,

    desiredVesselTypes: [],
  }
}
