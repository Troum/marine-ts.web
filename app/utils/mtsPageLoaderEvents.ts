/** Управление полноэкранным лоадером из `app.html` через CustomEvent. */

export const MTS_PAGE_LOADER_SHOW = 'mts:page-loader:show'
export const MTS_PAGE_LOADER_HIDE = 'mts:page-loader:hide'

export type MtsPageLoaderShowDetail = {
  /** Текст метки. Если не передать — подставляется из `data-label-*` по текущему lang. */
  label?: string
}

export type MtsPageLoaderHideDetail = {
  /** Скрыть немедленно, без задержки. */
  immediate?: boolean
  /** Задержка fade-out в мс (по умолчанию 320). */
  delay?: number
}

export function dispatchMtsPageLoaderShow(detail?: MtsPageLoaderShowDetail) {
  if (!import.meta.client) return
  window.dispatchEvent(new CustomEvent(MTS_PAGE_LOADER_SHOW, { detail: detail ?? {} }))
}

export function dispatchMtsPageLoaderHide(detail?: MtsPageLoaderHideDetail) {
  if (!import.meta.client) return
  window.dispatchEvent(new CustomEvent(MTS_PAGE_LOADER_HIDE, { detail: detail ?? {} }))
}
