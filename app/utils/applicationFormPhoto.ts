/**
 * Совпадает с `photo` → `max:5120` в Laravel (File rule: килобайты).
 */
export const APPLICATION_FORM_PHOTO_MAX_KB = 5120

export const APPLICATION_FORM_PHOTO_MAX_BYTES = APPLICATION_FORM_PHOTO_MAX_KB * 1024

export const APPLICATION_FORM_PHOTO_ACCEPT_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export function isApplicationFormPhotoMime(type: string): boolean {
  return (APPLICATION_FORM_PHOTO_ACCEPT_MIME as readonly string[]).includes(type)
}
