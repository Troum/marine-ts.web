import type { AdminSelectOption } from '~/components/admin/AdminSelect.vue'
import type { ContentPage } from '~/types'
import { plainMetaString } from '~/utils/adminThemedTextCodec'
import { contentPageSlugToPublicPath } from '~/utils/contentPageNavPath'
import { adminSelectOptionsFromPages } from '~/utils/navRoutesFromPages'

const STATIC_EXTRA_NAV: AdminSelectOption[] = [
  { value: '#', label: 'Заголовок группы без страницы — #' },
]

/**
 * Опции для выбора внутреннего пути (страницы из `pages/`, контентные URL, #).
 * Используется в настройках меню и в формах главной с ссылками на разделы.
 */
export function useAdminPathOptions() {
  const api = useMarineApi()

  const pathOptions = ref<AdminSelectOption[]>([
    ...adminSelectOptionsFromPages(),
    ...STATIC_EXTRA_NAV,
    { value: '__custom__', label: 'Другой путь или внешний URL…' },
  ])

  async function loadPathOptions() {
    const fromPages = adminSelectOptionsFromPages()
    try {
      const { data } = await api.contentPages.getManageAll({
        published: '1',
        per_page: 500,
        page: 1,
        sort: 'sort_order',
        order: 'asc',
      })
      const fromApi: AdminSelectOption[] = data.map((p: ContentPage) => {
        const path = contentPageSlugToPublicPath(p.slug, p.contentableType)
        const title = plainMetaString(p.title) || p.slug
        return { value: path, label: `${title} — ${path}` }
      })
      const map = new Map<string, AdminSelectOption>()
      for (const o of fromPages) {
        map.set(o.value, o)
      }
      for (const o of fromApi) {
        map.set(o.value, o)
      }
      for (const o of STATIC_EXTRA_NAV) {
        map.set(o.value, o)
      }
      const merged = [...map.values()].sort((a, b) => {
        if (a.value === '/') {
          return -1
        }
        if (b.value === '/') {
          return 1
        }
        return a.value.localeCompare(b.value, undefined, { sensitivity: 'base' })
      })
      pathOptions.value = [
        ...merged,
        { value: '__custom__', label: 'Другой путь или внешний URL…' },
      ]
    } catch {
      pathOptions.value = [
        ...fromPages,
        ...STATIC_EXTRA_NAV,
        { value: '__custom__', label: 'Другой путь или внешний URL…' },
      ]
    }
  }

  return { pathOptions, loadPathOptions }
}
