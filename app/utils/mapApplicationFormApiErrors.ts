import { getFetchErrorStatus } from '~/utils/laravelPublicApiError'

type TranslateFn = (key: string, values?: Record<string, unknown>) => string

function validationErrors(e: unknown): Record<string, string[]> | null {
  const data = (e as { data?: { errors?: Record<string, string[]> } })?.data
  const errors = data?.errors
  if (!errors || typeof errors !== 'object') {
    return null
  }
  return errors
}

function mapPhotoServerMessage(raw: string, t: TranslateFn, photoMaxMb: number): string {
  const r = raw.toLowerCase()
  if (
    r.includes('kilobyte')
    || r.includes('5120')
    || r.includes('килобайт')
    || r.includes(' кб')
    || (r.includes('greater than') && r.includes('file'))
    || (r.includes('больше') && (r.includes('размер') || r.includes('кб')))
  ) {
    return t('pages.vacancyForm.errPhotoTooLarge', { mb: photoMaxMb })
  }
  if (r.includes('must be an image') || r.includes('должно быть изображение') || r.includes('изображен')) {
    return t('pages.vacancyForm.errPhotoMustBeImage')
  }
  if (
    r.includes('jpg')
    || r.includes('jpeg')
    || r.includes('png')
    || r.includes('webp')
    || r.includes('mimes')
    || r.includes('тип файла')
    || r.includes('формат')
  ) {
    return t('pages.vacancyForm.errPhotoType')
  }
  return t('pages.vacancyForm.errPhotoGeneric')
}

function mapServerFieldMessage(field: string, raw: string, t: TranslateFn, photoMaxMb: number): string {
  if (field === 'photo') {
    return mapPhotoServerMessage(raw, t, photoMaxMb)
  }
  if (field === 'payload') {
    return t('pages.vacancyForm.errPayloadInvalid')
  }
  const base = field.replace(/\.\d+$/, '').replace(/\.\*$/, '')
  if (base === 'email') {
    return t('pages.vacancyForm.errEmailInvalid')
  }
  if (base === 'mobilephone' || base === 'mobile_phone') {
    return t('pages.vacancyForm.errPhoneInvalid')
  }
  return t('pages.vacancyForm.errServerField')
}

/**
 * Сообщения для блока ошибки в стиле сайта (i18n), без сырого текста Laravel.
 */
export function applicationFormSubmitErrorMessages(
  e: unknown,
  t: TranslateFn,
  photoMaxMb: number,
): string[] {
  const status = getFetchErrorStatus(e)
  if (status === 413) {
    return [t('pages.vacancyForm.errRequestBodyTooLarge', { mb: photoMaxMb })]
  }

  const errors = validationErrors(e)
  if (errors) {
    const out: string[] = []
    for (const [field, msgs] of Object.entries(errors)) {
      if (!Array.isArray(msgs)) {
        continue
      }
      for (const raw of msgs) {
        if (typeof raw !== 'string' || raw.trim() === '') {
          continue
        }
        out.push(mapServerFieldMessage(field, raw, t, photoMaxMb))
      }
    }
    const deduped = [...new Set(out)]
    if (deduped.length > 0) {
      return deduped
    }
  }

  return [t('pages.vacancyForm.submitErr')]
}
