/**
 * Публичные URL файлов из CMS/API.
 * Абсолютные ссылки на api.marin-ts.com/storage/… отдаём с основного домена
 * (nginx proxy /storage → api), чтобы избежать ERR_TOO_MANY_REDIRECTS в браузере.
 */
export function publicAssetUrl(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim()
  if (!s) {
    return ''
  }
  if (s.startsWith('/storage/')) {
    return s
  }
  try {
    const u = new URL(s)
    if (u.hostname === 'api.marin-ts.com' && u.pathname.startsWith('/storage/')) {
      return `${u.pathname}${u.search}${u.hash}`
    }
  } catch {
    /* относительный путь или не-URL */
  }
  return s
}
