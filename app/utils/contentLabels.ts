import type { Project } from '~/types'

/** Значения категории в админке (ru) и возможные варианты в en-переводах. */
const NEWS_CATEGORY_TO_KEY: Record<string, 'company' | 'projects' | 'technology' | 'certification' | 'events' | 'training'> = {
  Компания: 'company',
  Проекты: 'projects',
  Технологии: 'technology',
  Сертификация: 'certification',
  Мероприятия: 'events',
  Обучение: 'training',
  Company: 'company',
  Projects: 'projects',
  Technology: 'technology',
  Certification: 'certification',
  Events: 'events',
  Training: 'training',
}

/**
 * Подпись категории новости для текущей локали UI (данные в API могут быть с fallback на ru).
 */
export function newsCategoryLabel(category: string | undefined, t: (key: string) => string): string {
  if (!category?.trim()) {
    return ''
  }
  const key = NEWS_CATEGORY_TO_KEY[category.trim()]
  if (key) {
    return t(`pages.news.categories.${key}`)
  }
  return category
}

/** Подпись типа проекта по машинному полю `type` (не из API typeLabel — там возможен fallback на ru). */
export function projectTypeLabel(type: Project['type'], t: (key: string) => string): string {
  return t(`pages.projects.types.${type}`)
}
