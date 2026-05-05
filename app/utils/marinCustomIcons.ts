import type { Component } from 'vue'
import { defineComponent, h } from 'vue'
import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'
import MarinCustomSvgIcon from '~/components/icons/MarinCustomSvgIcon.vue'
import { getAllLucideAdminIconOptions } from '~/utils/lucideIconRegistry'
import { marinCustomIconSlugs, marinCustomSvgBySlug } from '~/utils/marinCustomIconAssets'

/** Значение в БД / форме: `mts:<slug файла без .svg>`. Не пересекается с именами Lucide. */
export const MARIN_ICON_KEY_PREFIX = 'mts:' as const

let cachedLucidePlusMarin: AdminSelectOption[] | null = null

function wrapMarinIconForAttrs(slug: string): Component {
  return defineComponent({
    name: `MarinIcon_${slug.replace(/\W/g, '_')}`,
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => h(MarinCustomSvgIcon, { slug, ...attrs })
    },
  })
}

/** Парсинг ключа `mts:slug`; возвращает slug только если файл есть. */
export function parseMarinIconSlug(iconKey: string): string | null {
  const trimmed = iconKey.trim()
  if (!trimmed.toLowerCase().startsWith(MARIN_ICON_KEY_PREFIX)) {
    return null
  }
  const slug = trimmed.slice(MARIN_ICON_KEY_PREFIX.length).trim()
  if (!slug || !marinCustomSvgBySlug[slug]) {
    return null
  }
  return slug
}

export function resolveMarinCustomIcon(iconKey: string): Component | null {
  const slug = parseMarinIconSlug(iconKey)
  if (!slug) {
    return null
  }
  return wrapMarinIconForAttrs(slug)
}

export function getMarinCustomAdminIconOptions(): AdminSelectOption[] {
  return marinCustomIconSlugs.map((slug) => ({
    value: `${MARIN_ICON_KEY_PREFIX}${slug}`,
    label: `МТС · ${slug.replace(/-/g, ' ')}`,
    icon: wrapMarinIconForAttrs(slug),
  }))
}

/** Все Lucide + кастомные SVG из assets/icons/marin-custom (для админских селектов). */
export function getAllLucideAndMarinAdminIconOptions(): AdminSelectOption[] {
  if (cachedLucidePlusMarin) {
    return cachedLucidePlusMarin
  }
  cachedLucidePlusMarin = [...getAllLucideAdminIconOptions(), ...getMarinCustomAdminIconOptions()]
  return cachedLucidePlusMarin
}
