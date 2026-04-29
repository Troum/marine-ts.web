import type { CustomPageSection } from '~/types'
import {
  customPageSectionsHaveEditorContent,
  customPageSectionsHaveVisibleBlocks,
  normalizeCustomPageSections,
} from '~/utils/customPageSections'

/** Разбивка пользовательских секций детальной content-page: до / после основного текста (TipTap). */
export function partitionContentPageSectionsForArticle(
  sections: CustomPageSection[] | null | undefined,
): { beforeArticle: CustomPageSection[]; afterArticle: CustomPageSection[] } {
  const list = sections ?? []
  const beforeArticle: CustomPageSection[] = []
  const afterArticle: CustomPageSection[] = []
  for (const s of list) {
    if (s.contentPlacement === 'afterArticle') {
      afterArticle.push(s)
    } else {
      beforeArticle.push(s)
    }
  }
  return { beforeArticle, afterArticle }
}

/** Хранилище тела детальной content-page: опциональные блоки + основной HTML статьи. */
export interface ContentPageBodyPayload {
  customSections?: CustomPageSection[]
  articleHtml?: string
}

/**
 * Разбор поля `body` перевода content-page: либо legacy HTML/Markdown целиком,
 * либо JSON `{ customSections, articleHtml }` после включения hero в админке.
 */
export function parseContentPageBody(raw: string | null | undefined): {
  customSections: CustomPageSection[] | null
  articleHtml: string
} {
  const fallbackArticle = '<p></p>'
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) {
    return { customSections: null, articleHtml: fallbackArticle }
  }
  if (trimmed.startsWith('{')) {
    try {
      const j = JSON.parse(trimmed) as ContentPageBodyPayload
      if (j && typeof j === 'object') {
        const sectionsRaw = j.customSections
        const article =
          typeof j.articleHtml === 'string' && j.articleHtml.trim() !== ''
            ? j.articleHtml
            : fallbackArticle
        if (Array.isArray(sectionsRaw)) {
          return {
            customSections: normalizeCustomPageSections(sectionsRaw),
            articleHtml: article,
          }
        }
        if (typeof j.articleHtml === 'string') {
          return { customSections: null, articleHtml: j.articleHtml || fallbackArticle }
        }
      }
    } catch {
      /* не JSON — обрабатываем как текст страницы */
    }
  }
  return { customSections: null, articleHtml: raw || fallbackArticle }
}

/** Обратно в поле `body`: без JSON, если пользовательских секций нет. */
export function buildContentPageBodyForSave(
  sections: CustomPageSection[],
  articleHtml: string,
): string {
  if (!customPageSectionsHaveEditorContent(sections)) {
    return articleHtml
  }
  const payload: ContentPageBodyPayload = {
    customSections: sections,
    articleHtml: articleHtml?.trim() ? articleHtml : '<p></p>',
  }
  return JSON.stringify(payload)
}

/** Крошки над баннером (первая hero-картинка в секции с заданным тоном). */
export function contentPageUsesHeroBreadcrumbs(sections: CustomPageSection[] | null | undefined): boolean {
  if (!sections?.length) {
    return false
  }
  for (const s of sections) {
    if (!s.breadcrumbTone) {
      continue
    }
    const hasHero = s.blocks.some(
      (b) => b.type === 'heroImage' && b.showHero !== false && b.imageUrl.trim() !== '',
    )
    if (hasHero) {
      return true
    }
  }
  return false
}

export function contentPageSectionsAreRenderable(sections: CustomPageSection[] | null | undefined): boolean {
  if (!sections?.length) {
    return false
  }
  return customPageSectionsHaveVisibleBlocks(sections)
}
