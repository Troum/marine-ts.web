import type {
  AdminPanelUser,
  AdminRoleOption,
  ContentPage,
  ContentPageContentableType,
  ApplicationFormItem,
  ApplicationFormStatus,
  DocumentRequestCatalogEntry,
  DocumentUploadSession,
  PaginatedApplicationForms,
  FeedbackMessage,
  GalleryItem,
  NewsItem,
  ContentPageSummary,
  Project,
  ServiceItem,
  SiteSeoPage,
  PageViewsSummary,
  Stats,
  VacancyApplicationForm,
  VacancyItem,
} from '~/types'

import { buildListQuery } from '~/composables/useAdminListQuery'

export function useMarineApi() {
  const config = useRuntimeConfig()
  const resolveApiBase = (): string => {
    if (import.meta.server) {
      const server = (config.apiBaseServer as string) || ''
      if (server) return server
    }
    return config.public.apiBase as string
  }
  const { token, setToken } = useAuth()

  const authHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    const t = import.meta.client ? localStorage.getItem('mts_admin_token') : null
    if (t) {
      headers.Authorization = `Bearer ${t}`
    }
    return headers
  }

  async function fetchPublic<T>(path: string): Promise<T> {
    return await $fetch<T>(`${resolveApiBase()}${path}`, {
      headers: { Accept: 'application/json' },
    })
  }

  async function fetchPublicPost<T>(path: string, body: unknown): Promise<T> {
    return await $fetch<T>(`${resolveApiBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    })
  }

  async function fetchPublicFormData<T>(path: string, formData: FormData): Promise<T> {
    return await $fetch<T>(`${resolveApiBase()}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData as unknown as BodyInit,
    })
  }

  async function fetchAuth<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
    if (import.meta.client) {
      const t = localStorage.getItem('mts_admin_token')
      if (t) {
        token.value = t
      }
    }
    try {
      return await $fetch<T>(`${resolveApiBase()}${path}`, {
        method: opts.method ?? 'GET',
        headers: authHeaders(),
        body: opts.body,
      })
    } catch (e: unknown) {
      const err = e as { statusCode?: number; status?: number }
      if (err?.statusCode === 401 || err?.status === 401) {
        setToken(null)
      if (import.meta.client) {
        sessionStorage.removeItem('mts_admin_permissions')
        sessionStorage.removeItem('mts_admin_user_id')
        await navigateTo('/admin/login')
      }
      }
      throw e
    }
  }

  /** POST multipart/form-data с Bearer (без Content-Type — задаёт браузер). */
  async function fetchAuthFormData<T>(path: string, formData: FormData): Promise<T> {
    if (import.meta.client) {
      const t = localStorage.getItem('mts_admin_token')
      if (t) {
        token.value = t
      }
    }
    const headers: Record<string, string> = { Accept: 'application/json' }
    const t = import.meta.client ? localStorage.getItem('mts_admin_token') : null
    if (t) {
      headers.Authorization = `Bearer ${t}`
    }
    try {
      return await $fetch<T>(`${resolveApiBase()}${path}`, {
        method: 'POST',
        headers,
        body: formData as unknown as BodyInit,
      })
    } catch (e: unknown) {
      const err = e as { statusCode?: number; status?: number }
      if (err?.statusCode === 401 || err?.status === 401) {
        setToken(null)
        if (import.meta.client) {
          sessionStorage.removeItem('mts_admin_permissions')
          sessionStorage.removeItem('mts_admin_user_id')
          await navigateTo('/admin/login')
        }
      }
      throw e
    }
  }

  return {
    async login(username: string, password: string) {
      const data = await $fetch<{
        token: string
        user: {
          id: number
          username: string
          role: string | null
          roles?: string[]
          permissions?: string[]
        }
      }>(`${resolveApiBase()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: { username, password },
      })
      setToken(data.token)
      if (import.meta.client) {
        sessionStorage.setItem('mts_admin_permissions', JSON.stringify(data.user.permissions ?? []))
        sessionStorage.setItem('mts_admin_user_id', String(data.user.id))
      }
      return data
    },
    logout() {
      setToken(null)
      if (import.meta.client) {
        sessionStorage.removeItem('mts_admin_permissions')
        sessionStorage.removeItem('mts_admin_user_id')
      }
    },
    users: {
      getManageAll: async (params?: {
        search?: string
        sort?: string
        order?: 'asc' | 'desc'
        per_page?: number
        page?: number
      }) => {
        const q = buildListQuery({
          per_page: params?.per_page ?? 100,
          page: params?.page ?? 1,
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
        })
        const res = await fetchAuth<{ data: AdminPanelUser[]; meta?: { total: number } }>(`/users/manage?${q}`)
        return res.data
      },
      getRolesCatalog: async () => {
        const res = await fetchAuth<{ data: AdminRoleOption[] }>('/users/manage/roles')
        return res.data
      },
      getById: async (id: number) => {
        const res = await fetchAuth<{ data: AdminPanelUser }>(`/users/manage/${id}`)
        return res.data
      },
      create: async (body: {
        name: string
        username: string
        email: string
        password: string
        roles?: string[]
      }) => {
        const res = await fetchAuth<{ data: AdminPanelUser }>('/users', { method: 'POST', body })
        return res.data
      },
      update: async (
        id: number,
        body: Partial<{
          name: string
          username: string
          email: string
          password: string
          roles: string[]
        }>,
      ) => {
        const res = await fetchAuth<{ data: AdminPanelUser }>(`/users/${id}`, { method: 'PUT', body })
        return res.data
      },
      delete: (id: number) => fetchAuth<unknown>(`/users/${id}`, { method: 'DELETE' }),
    },
    news: {
      getAll: async (params?: {
        search?: string
        sort?: string
        order?: 'asc' | 'desc'
        per_page?: number
        page?: number
      }) => {
        const q = buildListQuery({
          per_page: params?.per_page ?? 500,
          page: params?.page ?? 1,
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
        })
        const res = await fetchPublic<{ data: NewsItem[] }>(`/news?${q}`)
        return res.data
      },
      getBySlug: async (slug: string) => {
        const enc = encodeURIComponent(slug)
        const res = await fetchPublic<{ data: NewsItem }>(`/news/${enc}`)
        return res.data
      },
      getById: async (id: number) => {
        const res = await fetchAuth<{ data: NewsItem }>(`/news/manage/${id}`)
        return res.data
      },
      create: async (body: Omit<NewsItem, 'id'>) => {
        const res = await fetchAuth<{ data: NewsItem }>('/news', { method: 'POST', body })
        return res.data
      },
      update: async (id: number, body: Partial<NewsItem>) => {
        const res = await fetchAuth<{ data: NewsItem }>(`/news/${id}`, { method: 'PUT', body })
        return res.data
      },
      delete: (id: number) => fetchAuth<unknown>(`/news/${id}`, { method: 'DELETE' }),
    },
    projects: {
      getAll: async (params?: {
        search?: string
        sort?: string
        order?: 'asc' | 'desc'
        per_page?: number
        page?: number
      }) => {
        const q = buildListQuery({
          per_page: params?.per_page ?? 500,
          page: params?.page ?? 1,
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
        })
        const res = await fetchPublic<{ data: Project[] }>(`/projects?${q}`)
        return res.data
      },
      getById: async (id: number) => {
        const res = await fetchPublic<{ data: Project }>(`/projects/${id}`)
        return res.data
      },
      create: async (body: Omit<Project, 'id'>) => {
        const res = await fetchAuth<{ data: Project }>('/projects', { method: 'POST', body })
        return res.data
      },
      update: async (id: number, body: Partial<Project>) => {
        const res = await fetchAuth<{ data: Project }>(`/projects/${id}`, { method: 'PUT', body })
        return res.data
      },
      delete: (id: number) =>
        fetchAuth<unknown>(`/projects/${id}`, { method: 'DELETE' }),
    },
    services: {
      getAll: async (params?: {
        search?: string
        sort?: string
        order?: 'asc' | 'desc'
        per_page?: number
        page?: number
      }) => {
        const q = buildListQuery({
          per_page: params?.per_page ?? 500,
          page: params?.page ?? 1,
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
        })
        const res = await fetchPublic<{ data: ServiceItem[] }>(`/services?${q}`)
        return res.data
      },
      getById: async (id: number) => {
        const res = await fetchPublic<{ data: ServiceItem }>(`/services/${id}`)
        return res.data
      },
      create: async (
        body: Omit<ServiceItem, 'id'> & { features: string[] },
      ) => {
        const res = await fetchAuth<{ data: ServiceItem }>('/services', {
          method: 'POST',
          body,
        })
        return res.data
      },
      update: async (id: number, body: Partial<ServiceItem>) => {
        const res = await fetchAuth<{ data: ServiceItem }>(`/services/${id}`, {
          method: 'PUT',
          body,
        })
        return res.data
      },
      delete: (id: number) =>
        fetchAuth<unknown>(`/services/${id}`, { method: 'DELETE' }),
    },
    vacancies: {
      getAll: async () => {
        const res = await fetchPublic<{ data: VacancyItem[] }>('/vacancies?per_page=500')
        return res.data
      },
      getBySlug: async (slug: string) => {
        const enc = encodeURIComponent(slug)
        const res = await fetchPublic<{ data: VacancyItem }>(`/vacancies/${enc}`)
        return res.data
      },
      getManageAll: async (params?: {
        search?: string
        sort?: string
        order?: 'asc' | 'desc'
        published?: '0' | '1'
        per_page?: number
        page?: number
      }) => {
        const q = buildListQuery({
          per_page: params?.per_page ?? 500,
          page: params?.page ?? 1,
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
          published: params?.published,
        })
        const res = await fetchAuth<{ data: VacancyItem[] }>(`/vacancies/manage?${q}`)
        return res.data
      },
      getById: async (id: number) => {
        const res = await fetchAuth<{ data: VacancyItem }>(`/vacancies/manage/${id}`)
        return res.data
      },
      create: async (body: Omit<VacancyItem, 'id'>) => {
        const res = await fetchAuth<{ data: VacancyItem }>('/vacancies', { method: 'POST', body })
        return res.data
      },
      update: async (id: number, body: Partial<VacancyItem>) => {
        const res = await fetchAuth<{ data: VacancyItem }>(`/vacancies/${id}`, { method: 'PUT', body })
        return res.data
      },
      delete: (id: number) => fetchAuth<unknown>(`/vacancies/${id}`, { method: 'DELETE' }),
    },
    seoPages: {
      getAll: async (params?: { search?: string; sort?: string; order?: 'asc' | 'desc' }) => {
        const q = buildListQuery({
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
        })
        const path = q ? `/seo/pages?${q}` : '/seo/pages'
        const res = await fetchPublic<{ data: SiteSeoPage[] }>(path)
        return res.data
      },
      getBySlug: async (slug: string) => {
        const res = await fetchPublic<{ data: SiteSeoPage }>(`/seo/pages/${slug}`)
        return res.data
      },
      update: async (slug: string, body: Partial<Pick<SiteSeoPage, 'seoTitle' | 'seoDescription' | 'seoKeywords'>>) => {
        const res = await fetchAuth<{ data: SiteSeoPage }>(`/seo/pages/${slug}`, {
          method: 'PUT',
          body,
        })
        return res.data
      },
    },
    contentPages: {
      getPublicList: async () => {
        const res = await fetchPublic<{ data: ContentPageSummary[] }>('/content-pages')
        return res.data
      },
      getPublicBySlug: async (slug: string) => {
        const enc = encodeURIComponent(slug)
        const res = await fetchPublic<{ data: ContentPage }>(`/content-pages/${enc}`)
        return res.data
      },
      getManageAll: async (params?: {
        search?: string
        sort?: string
        order?: 'asc' | 'desc'
        published?: '0' | '1'
        per_page?: number
        page?: number
      }) => {
        const q = buildListQuery({
          per_page: params?.per_page ?? 500,
          page: params?.page ?? 1,
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
          published: params?.published,
        })
        const res = await fetchAuth<{
          data: ContentPage[]
          meta?: { current_page: number; last_page: number; per_page: number; total: number }
        }>(`/content-pages/manage?${q}`)
        return { data: res.data, meta: res.meta }
      },
      getManageById: async (id: number) => {
        const res = await fetchAuth<{ data: ContentPage }>(`/content-pages/manage/${id}`)
        return res.data
      },
      create: async (
        body: {
          slug: string
          title: string
          body: string
          excerpt?: string | null
          isPublished?: boolean
          sortOrder?: number
          seoTitle?: string | null
          seoDescription?: string | null
          seoKeywords?: string | null
          contentableType?: ContentPageContentableType
          contentableId?: number
        },
      ) => {
        const res = await fetchAuth<{ data: ContentPage }>('/content-pages', { method: 'POST', body })
        return res.data
      },
      update: async (
        id: number,
        body: Partial<ContentPage> & {
          contentableType?: ContentPageContentableType | null
          contentableId?: number | null
        },
      ) => {
        const res = await fetchAuth<{ data: ContentPage }>(`/content-pages/${id}`, { method: 'PUT', body })
        return res.data
      },
      delete: (id: number) => fetchAuth<unknown>(`/content-pages/${id}`, { method: 'DELETE' }),
    },
    gallery: {
      getAll: async () => {
        const res = await fetchPublic<{ data: GalleryItem[] }>('/gallery')
        return res.data
      },
      create: async (formData: FormData) => {
        const res = await fetchAuthFormData<{ data: GalleryItem }>('/gallery', formData)
        return res.data
      },
      update: async (id: number, body: { alt?: string; sortOrder?: number }) => {
        const res = await fetchAuth<{ data: GalleryItem }>(`/gallery/${id}`, {
          method: 'PUT',
          body,
        })
        return res.data
      },
      replaceImage: async (id: number, formData: FormData) => {
        const res = await fetchAuthFormData<{ data: GalleryItem }>(`/gallery/${id}/image`, formData)
        return res.data
      },
      delete: (id: number) => fetchAuth<unknown>(`/gallery/${id}`, { method: 'DELETE' }),
    },
    stats: {
      getAll: () => fetchPublic<Stats>('/stats'),
    },
    analytics: {
      getSummary: () => fetchAuth<PageViewsSummary>('/analytics/manage/summary'),
    },
    applicationForms: {
      submit: async (slug: string, body: VacancyApplicationForm) => {
        const enc = encodeURIComponent(slug)
        await fetchPublicPost<unknown>(`/vacancies/${enc}/application-forms`, body)
      },
      getManageAll: async (
        page = 1,
        perPage = 50,
        params?: {
          search?: string
          sort?: string
          order?: 'asc' | 'desc'
          status?: string
        },
      ) => {
        const q = buildListQuery({
          per_page: perPage,
          page,
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
          status: params?.status,
        })
        const res = await fetchAuth<PaginatedApplicationForms>(`/application-forms/manage?${q}`)
        return { data: res.data, meta: res.meta }
      },
      getByVacancy: async (
        vacancyId: number,
        params?: {
          search?: string
          sort?: string
          order?: 'asc' | 'desc'
          status?: string
          per_page?: number
          page?: number
        },
      ) => {
        const q = buildListQuery({
          per_page: params?.per_page ?? 500,
          page: params?.page ?? 1,
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
          status: params?.status,
        })
        const res = await fetchAuth<{ data: ApplicationFormItem[] }>(
          `/vacancies/manage/${vacancyId}/application-forms?${q}`,
        )
        return res.data
      },
      updateStatus: async (id: number, status: ApplicationFormStatus) => {
        const res = await fetchAuth<{ data: ApplicationFormItem }>(`/application-forms/${id}`, {
          method: 'PATCH',
          body: { status },
        })
        return res.data
      },
      getDocumentRequestCatalog: async () => {
        const res = await fetchAuth<{ data: DocumentRequestCatalogEntry[] }>(
          '/application-forms/document-request-catalog',
        )
        return res.data
      },
      requestDocuments: async (id: number, documentKeys: string[]) => {
        const res = await fetchAuth<{ data: ApplicationFormItem }>(`/application-forms/${id}/request-documents`, {
          method: 'POST',
          body: { document_keys: documentKeys },
        })
        return res.data
      },
      getDocumentUploadSession: async (token: string) => {
        const res = await fetchPublic<{ data: DocumentUploadSession }>(
          `/application-forms/document-upload/${encodeURIComponent(token)}`,
        )
        return res.data
      },
      uploadSupplementaryDocuments: async (token: string, formData: FormData) => {
        return await fetchPublicFormData<{ data: { uploadedKeys: string[]; uploaded: Record<string, { originalName: string; uploadedAt: string }> } }>(
          `/application-forms/document-upload/${encodeURIComponent(token)}`,
          formData,
        )
      },
      getById: async (id: number) => {
        const res = await fetchAuth<{ data: ApplicationFormItem }>(`/application-forms/${id}`)
        return res.data
      },
      /** Скачать файл из payload.supplementaryFiles (Bearer). */
      downloadApplicationSupplementaryFile: async (
        applicationFormId: number,
        documentKey: string,
        fallbackFilename: string,
      ) => {
        const base = config.public.apiBase as string
        if (!import.meta.client) {
          return
        }
        const t = localStorage.getItem('mts_admin_token')
        const url = `${base}/application-forms/${applicationFormId}/supplementary-files/${encodeURIComponent(documentKey)}`
        const res = await fetch(url, {
          headers: {
            Accept: '*/*',
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
        })
        if (!res.ok) {
          let msg = 'Не удалось скачать файл'
          try {
            const j = (await res.json()) as { message?: string }
            if (j.message) {
              msg = j.message
            }
          } catch {
            /* ignore */
          }
          throw new Error(msg)
        }
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = fallbackFilename
        a.rel = 'noopener'
        a.click()
        URL.revokeObjectURL(a.href)
      },
      /** PDF анкеты (Spatie Laravel PDF, тот же шаблон, что в письме crewing). */
      downloadApplicationFormPdf: async (applicationFormId: number) => {
        const base = config.public.apiBase as string
        if (!import.meta.client) {
          return
        }
        const t = localStorage.getItem('mts_admin_token')
        const url = `${base}/application-forms/${applicationFormId}/pdf`
        const res = await fetch(url, {
          headers: {
            Accept: 'application/pdf',
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
        })
        if (!res.ok) {
          let msg = 'Не удалось сформировать PDF'
          try {
            const j = (await res.json()) as { message?: string }
            if (j.message) {
              msg = j.message
            }
          } catch {
            /* ignore */
          }
          throw new Error(msg)
        }
        const dispo = res.headers.get('Content-Disposition')
        let filename = `anketa-${applicationFormId}.pdf`
        if (dispo) {
          const m = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(dispo)
          const raw = m?.[1] ?? m?.[2]
          if (raw) {
            try {
              filename = decodeURIComponent(raw.replace(/\+/g, ' '))
            } catch {
              filename = raw
            }
          }
        }
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        a.rel = 'noopener'
        a.click()
        URL.revokeObjectURL(a.href)
      },
    },
    feedback: {
      submit: async (body: { name: string; email: string; phone?: string | null; message: string }) => {
        await fetchPublicPost<unknown>('/feedback', body)
      },
      getManageAll: async (params?: {
        search?: string
        sort?: string
        order?: 'asc' | 'desc'
        read?: '0' | '1'
        per_page?: number
        page?: number
      }) => {
        const q = buildListQuery({
          per_page: params?.per_page ?? 500,
          page: params?.page ?? 1,
          search: params?.search,
          sort: params?.sort,
          order: params?.order,
          read: params?.read,
        })
        const res = await fetchAuth<{ data: FeedbackMessage[] }>(`/feedback/manage?${q}`)
        return res.data
      },
      getById: async (id: number) => {
        const res = await fetchAuth<{ data: FeedbackMessage }>(`/feedback/manage/${id}`)
        return res.data
      },
      reply: async (id: number, body: string, attachments: File[]) => {
        const fd = new FormData()
        fd.append('body', body)
        for (const file of attachments) {
          fd.append('attachments[]', file)
        }
        const res = await fetchAuthFormData<{ data: FeedbackMessage }>(`/feedback/manage/${id}/reply`, fd)
        return res.data
      },
      delete: (id: number) => fetchAuth<unknown>(`/feedback/${id}`, { method: 'DELETE' }),
    },
  }
}
