export interface SeoFields {
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export interface SiteSeoPage {
  slug: string
  label: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
}

export interface NewsItem {
  id: number
  slug: string
  title: string
  excerpt: string
  content?: string
  date: string
  author: string
  category: string
  featured?: boolean
  image?: string
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
}

/** Связанная текстовая страница раздела «Услуги» (полиморфная привязка в API). */
export interface LinkedContentPageRef {
  id: number
  slug: string
  title: string
}

export interface Project {
  id: number
  title: string
  type: 'hull' | 'engine' | 'electrical'
  typeLabel: string
  location: string
  date: string
  description: string
  stats: Record<string, string>
  image?: string
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  contentPage?: LinkedContentPageRef | null
}

export interface Stats {
  news_count: number
  projects_count: number
  featured_news: number
  services_count: number
  vacancies_count: number
  application_forms_count: number
}

export interface VacancyItem {
  id: number
  slug: string
  title: string
  excerpt: string
  content?: string | null
  requirements: string[]
  location?: string | null
  employmentType?: string | null
  sortOrder: number
  isPublished: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  /** Подсчёт анкет (только в ответах manage API). */
  applicationFormsCount?: number
}

export type ApplicationFormStatus = 'pending' | 'accepted' | 'rejected' | 'documents_requested'

export interface ApplicationFormItem {
  id: number
  vacancyId: number
  /** Заполняется в списке «все анкеты» при загрузке связи vacancy. */
  vacancyTitle?: string | null
  vacancySlug?: string | null
  fullName: string
  email: string
  phone: string | null
  status: ApplicationFormStatus
  payload: Record<string, unknown>
  requestedDocumentKeys?: string[]
  documentUploadExpiresAt?: string | null
  createdAt: string | null
  updatedAt: string | null
}

/** Каталог типов документов для запроса у кандидата (совпадает с API). */
export interface DocumentRequestCatalogEntry {
  key: string
  label: string
  group: string
}

export interface DocumentUploadSession {
  fullName: string
  expiresAt: string | null
  requestedDocuments: { key: string; label: string }[]
  uploaded: Record<string, { originalName: string; uploadedAt: string }>
}

export interface PaginatedApplicationForms {
  data: ApplicationFormItem[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ServiceItem {
  id: number
  title: string
  description: string
  features: string[]
  iconKey: string
  sortOrder: number
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  contentPage?: LinkedContentPageRef | null
}

/** Публичный список контентных страниц (без тела Markdown). */
export interface ContentPageSummary {
  id: number
  slug: string
  title: string
  excerpt: string | null
  sortOrder: number
}

/** Контентная страница раздела (тело — Markdown). */
export type ContentPageContentableType = 'service' | 'project'

export interface ContentPage extends ContentPageSummary {
  body: string
  isPublished: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  /** Краткое имя типа карточки, если страница привязана к услуге или проекту. */
  contentableType?: ContentPageContentableType | null
  contentableId?: number | null
  /** Заголовок связанной карточки (если загружена связь в manage API). */
  contentableTitle?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type {
  CertTableRow,
  EducationRow,
  SeaServiceRow,
  VacancyApplicationForm,
} from './applicationForm'

export {
  COMPETENCY_LABELS,
  emptyCertRow,
  emptyCertRowExtra,
  emptyEducationRow,
  emptySeaServiceRow,
  OTHER_CERT_LABELS,
  TRAVEL_DOC_LABELS,
} from './applicationForm'

export interface FeedbackMessage {
  id: number
  name: string
  email: string
  phone: string | null
  message: string
  ip: string | null
  readAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

/** Учётная запись панели управления (ответ API manage users). */
export interface AdminPanelUser {
  id: number
  name: string
  username: string
  email: string
  roles: string[]
  permissions?: string[]
  created_at?: string | null
  updated_at?: string | null
}

export interface AdminRoleOption {
  name: string
  label: string
}
