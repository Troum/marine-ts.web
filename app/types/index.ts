export interface SeoFields {
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

/** Локали динамического контента (совпадают с config marine.locales в API). */
export type MarineContentLocale = 'ru' | 'en'

/** Оттенки сегмента заголовка — только токены темы Marin (`main.css`, `@theme`). */
export type ThemeTitleTone =
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'accent'
  | 'accentLight'
  | 'accentDark'
  | 'marker'

export interface ThemeTitleSpan {
  text: string
  tone: ThemeTitleTone
}

/**
 * Заголовок из сегментов с цветом из палитры темы (вместо трёх полей «начало / акцент / окончание»).
 * В JSON хранится как объект; старые поля title/titleAccent/titleEnd при чтении мигрируют в spans.
 */
export interface ThemeFormattedTitle {
  spans: ThemeTitleSpan[]
}

export interface NewsTranslationPayload {
  title: string
  excerpt: string
  content: string
  category: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export interface VacancyTranslationPayload {
  title: string
  excerpt: string
  content: string
  requirements: string[]
  location: string
  employmentType: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export interface ServiceTranslationPayload {
  title: string
  description: string
  features: string[]
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export interface ProjectTranslationPayload {
  title: string
  typeLabel: string
  location: string
  description: string
  stats: Record<string, string>
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export interface ContentPageTranslationPayload {
  title: string
  excerpt: string
  body: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export interface SiteSeoTranslationPayload {
  label: string
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
  /** В ответах manage API — полный набор переводов. */
  translations?: Partial<Record<MarineContentLocale, SiteSeoTranslationPayload>>
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
  translations?: Partial<Record<MarineContentLocale, NewsTranslationPayload>>
}

/** Связанная текстовая страница раздела «Сервисы» (полиморфная привязка в API). */
export interface LinkedContentPageRef {
  id: number
  slug: string
  title: string
}

export interface GalleryItem {
  id: number
  src: string
  alt: string
  sortOrder: number
  translations?: Partial<Record<MarineContentLocale, { alt: string }>>
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
  translations?: Partial<Record<MarineContentLocale, ProjectTranslationPayload>>
}

export interface Stats {
  news_count: number
  projects_count: number
  featured_news: number
  services_count: number
  vacancies_count: number
  application_forms_count: number
}

/** Сводка просмотров публичного сайта (таблица page_views). */
export interface PageViewsSummary {
  totalViews: number
  todayViews: number
  last7Days: number
  last30Days: number
  topPaths: { path: string; views: number }[]
  dailyLast14Days: { date: string; views: number }[]
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
  translations?: Partial<Record<MarineContentLocale, VacancyTranslationPayload>>
}

export type ApplicationFormStatus = 'pending' | 'accepted' | 'rejected' | 'documents_requested'

export interface ApplicationFormItem {
  id: number
  /** null — открытая анкета без вакансии */
  vacancyId: number | null
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
  /** Публичный URL изображения для карточки (загрузка в админке). */
  imageUrl?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  contentPage?: LinkedContentPageRef | null
  translations?: Partial<Record<MarineContentLocale, ServiceTranslationPayload>>
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
  /** Показать форму заявки внизу страницы (контентные страницы сервисов/проектов). */
  showInquiryForm?: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  /** Краткое имя типа карточки, если страница привязана к сервису или проекту. */
  contentableType?: ContentPageContentableType | null
  contentableId?: number | null
  /** Заголовок связанной карточки (если загружена связь в manage API). */
  contentableTitle?: string | null
  created_at?: string | null
  updated_at?: string | null
  translations?: Partial<Record<MarineContentLocale, ContentPageTranslationPayload>>
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
  /** Когда на это сообщение отправили ответ с сайта админки (email). */
  repliedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

/**
 * Машинно-читаемые id типов судна, выбранных в форме «Оставьте заявку».
 * Полный список и человекочитаемые подписи — в `PageInquiryForm.vue`
 * (константа `VESSEL_TYPES`) и в Laravel-валидации
 * (`StorePageInquiryRequest::ALLOWED_VESSEL_TYPES`).
 */
export type PageInquiryVesselType =
  | 'dry_cargo'
  | 'tanker'
  | 'container'
  | 'tug'
  | 'service'
  | 'other'

/**
 * Машинно-читаемые id запрашиваемых услуг. Синхронизирован с
 * `PageInquiryForm.vue` и `StorePageInquiryRequest::ALLOWED_REQUIRED_SERVICES`.
 */
export type PageInquiryServiceId =
  | 'technical'
  | 'crewing'
  | 'audit'
  | 'commercial'
  | 'insurance'
  | 'other'

/** Заявка с формы «подключённой» страницы (судовой менеджмент и др.). */
export interface PageInquiry {
  id: number
  name: string
  company: string | null
  position: string | null
  phone: string | null
  email: string
  vesselTypes: PageInquiryVesselType[]
  vesselsCount: number | null
  vesselFlag: string | null
  mainPorts: string | null
  requiredServices: PageInquiryServiceId[]
  message: string | null
  sourcePage: string
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

export type ContactQuickIconKey = 'phone' | 'mail' | 'map-pin' | 'clock'

/** Публичные контакты (страница «Контакты»), из API `/contact-settings`. */
export interface SiteContactSettings {
  quick: {
    iconKey: ContactQuickIconKey
    label: string
    value: string
    href: string | null
  }[]
  offices: {
    city: string
    country: string
    address: string
    phone: string
    email: string
  }[]
}

/** Пункт меню в шапке сайта (`/navigation-settings`). */
export interface NavigationMenuItem {
  path: string
  label: Record<MarineContentLocale, string>
  /** Вложенные ссылки (выпадающее подменю). У родителя `path` может быть `#`, если сам пункт не ведёт на страницу. */
  children?: NavigationMenuItem[]
}

export interface NavigationMenuSettings {
  main: NavigationMenuItem[]
  more: NavigationMenuItem[]
}

/** Пункт ссылки в подвале (без подменю). */
export interface FooterNavLink {
  path: string
  label: Record<MarineContentLocale, string>
}

export interface FooterNavColumn {
  title: Record<MarineContentLocale, string>
  links: FooterNavLink[]
}

/** Три колонки ссылок + нижняя юридическая полоса (`/footer-navigation-settings`). */
export interface FooterMenuSettings {
  columns: FooterNavColumn[]
  legal: FooterNavLink[]
}

/* ── About page structured data (CMS JSON in body) ── */

export interface AboutHero {
  /** HTML из TipTap (цвета, подсветка, тона темы через marks). */
  title: string
  subtitle: string
  lead: string
  lead2: string
}

export interface AboutServiceCard {
  icon: string
  title: string
  text: string
}

export interface AboutEcosystem {
  title: string
  lead: string
  services: AboutServiceCard[]
}

export interface AboutPrinciple {
  icon: string
  text: string
}

export interface AboutMission {
  title: string
  lead: string
  principles: AboutPrinciple[]
}

export interface AboutWhy {
  title: string
  text: string
  ctaText: string
}

export interface AboutGeoLocation {
  /** Долгота, -180..180 (Mapbox: lng). */
  lng: number
  /** Широта, -90..90 (Mapbox: lat). */
  lat: number
  /** Где разместить подпись относительно маркера: справа (true) или слева. */
  labelOnRight: boolean
  name: string
}

export interface AboutGeography {
  label: string
  title: string
  lead: string
  locations: AboutGeoLocation[]
}

export interface AboutCertItem {
  name: string
  desc: string
  fileUrl: string
}

export interface AboutCertificates {
  title: string
  items: AboutCertItem[]
}

export interface AboutPageData {
  hero: AboutHero
  ecosystem: AboutEcosystem
  mission: AboutMission
  why: AboutWhy
  geography: AboutGeography
  certificates: AboutCertificates
  showInquiryForm?: boolean
  /** Опциональный фон первого экрана (URL или путь после загрузки). */
  heroImage?: string
  /** Фон секции «О компании» (два абзаца под тем же заголовком, что и hero). */
  introImage?: string
  /** Фон секции «Экосистема сервисов». */
  ecosystemImage?: string
  /** Фон секции «Миссия» (Figma — отдельный кадр). */
  missionImage?: string
  /**
   * Фон секции «Компания в цифрах» (Figma: Rectangle 51).
   * Поверх изображения накладывается диагональный градиент из макета.
   * Секция «Почему выбирают MTS?» собственного изображения не имеет —
   * у неё сплошной фон #0B1F2A.
   */
  statsImage?: string
  /** Пользовательские секции (вставляются после штатных, перед формой заявки). */
  customSections?: LineMarketingCustomSection[]
  /** Порядок секций (включая `custom:<uuid>`). Если не задан — берётся дефолт. */
  sectionOrder?: string[]
  /** Карта видимости секций по id; отсутствие ключа считается «показывать». */
  sectionVisibility?: Record<string, boolean>
}

/* ── Home page structured data (CMS JSON in body) ── */

export interface HomeHero {
  label: string
  titleFormatted: ThemeFormattedTitle
  lead: string
  /** Клиент: заявка */
  ctaClient: string
  ctaClientHref: string
  /** Моряк: анкета */
  ctaSeafarer: string
  ctaSeafarerHref: string
  /** @deprecated совместимость со старым JSON главной */
  ctaConsult?: string
  /** @deprecated */
  ctaServices?: string
  badgeIso: string
  badgeIacs: string
  badgeYears: string
  scroll: string
}

/** Акцентный блок воронки на главной (судовой менеджмент / крюинг / сервисы). */
export interface HomeFunnelSpotlight {
  label: string
  titleFormatted: ThemeFormattedTitle
  text: string
  cta: string
  href: string
}

/** Средняя карточка: две ссылки (вакансии + анкета). */
export interface HomeFunnelCrewingSpotlight extends HomeFunnelSpotlight {
  secondaryCta: string
  secondaryHref: string
}

export interface HomeDirectionRow {
  title: string
  description: string
  cta: string
  href: string
}

export interface HomeDirectionsSection {
  label: string
  headingFormatted: ThemeFormattedTitle
  rows: HomeDirectionRow[]
}

/** Коротко «доверие»: маркеры под «О компании». */
export interface HomeTrustStrip {
  label: string
  titleFormatted: ThemeFormattedTitle
  bullets: string[]
}

export interface HomeStat {
  icon: string
  value: string
  label: string
}

export interface HomeStatsCard {
  label: string
  items: HomeStat[]
}

export interface HomeAboutPreview {
  label: string
  titleFormatted: ThemeFormattedTitle
  text: string
  more: string
}

export interface HomeServicesSection {
  label: string
  headingFormatted: ThemeFormattedTitle
  all: string
  more: string
  /** ID карточек сервисов из каталога (порядок = порядок на главной). Пусто — блок «Сервисы» не показывается. */
  featuredServiceIds: number[]
}

export interface HomeProcessStep {
  title: string
  text: string
}

export interface HomeProcessSection {
  label: string
  headingFormatted: ThemeFormattedTitle
  steps: HomeProcessStep[]
}

export interface HomeCTA {
  label: string
  titleFormatted: ThemeFormattedTitle
  text: string
  button: string
}

export interface HomePageData {
  hero: HomeHero
  /** Опциональный фон первого экрана (URL); если пусто — без фонового фото. */
  heroImage?: string
  statsCard: HomeStatsCard
  /** Показывать карточку «В цифрах» внутри Hero. */
  showStatsCard?: boolean
  funnelShip: HomeFunnelSpotlight
  funnelCrewing: HomeFunnelCrewingSpotlight
  funnelTechnical: HomeFunnelSpotlight
  directions: HomeDirectionsSection
  about: HomeAboutPreview
  trust: HomeTrustStrip
  services: HomeServicesSection
  /** Скрыть блок «процесс» (устаревший сценарий ремонта). */
  showProcess?: boolean
  process: HomeProcessSection
  cta: HomeCTA
  /** Показать блок формы заявки внизу главной. */
  showInquiryForm?: boolean
  /** Пользовательские секции (вставляются после штатных, перед формой заявки). */
  customSections?: LineMarketingCustomSection[]
  /** Порядок секций (включая `custom:<uuid>`); hero фиксирован первым и не входит. */
  sectionOrder?: string[]
  /** Карта видимости секций по id; отсутствие ключа = показывать. */
  sectionVisibility?: Record<string, boolean>
}

/* ── Listing page structured data (Services, Projects, Gallery, News hero+CTA) ── */

export interface ListingHero {
  titleFormatted: ThemeFormattedTitle
  lead: string
}

export interface ListingCTA {
  title: string
  buttonText: string
}

export interface ListingPageData {
  hero: ListingHero
  cta?: ListingCTA
  showInquiryForm?: boolean
  /** Опциональный фон hero (листинги сервисов, проектов, галереи, новостей, вакансий). */
  heroImage?: string
  /** Пользовательские секции (вставляются после штатных, перед формой заявки). */
  customSections?: LineMarketingCustomSection[]
  /** Порядок секций (включая `custom:<uuid>`); hero фиксирован первым и не входит. */
  sectionOrder?: string[]
  /** Карта видимости секций по id; отсутствие ключа = показывать. */
  sectionVisibility?: Record<string, boolean>
}

export interface ProjectsPageData extends ListingPageData {}

/** Листинг `/vacancies`: тот же JSON, что у проектов (hero + фон + CTA + форма заявки). */
export type VacanciesPageData = ProjectsPageData

/* ── Contacts page structured data (CMS JSON in body) ── */

export interface ContactsPageData {
  hero: { titleFormatted: ThemeFormattedTitle; lead: string }
  infoTitle: string
  formTitle: string
  formLead: string
  officesTitle: string
  showInquiryForm?: boolean
  /** Опциональный фон hero. */
  heroImage?: string
  /** Пользовательские секции (вставляются после штатных, перед формой заявки). */
  customSections?: LineMarketingCustomSection[]
  /** Порядок секций (включая `custom:<uuid>`); hero фиксирован первым и не входит. */
  sectionOrder?: string[]
  /** Карта видимости секций по id; отсутствие ключа = показывать. */
  sectionVisibility?: Record<string, boolean>
}

/** Кнопка в hero маркетинговых страниц линий (крюинг / судовой менеджмент), не более двух. */
export interface LineMarketingHeroButton {
  label: string
  /** Внутренний путь (`/contacts`), якорь (`#page-inquiry`) или полный URL. */
  href: string
}

/** Структурированный JSON страницы «Крюинг-менеджмент» (CMS, body в content_pages). */
export interface CrewingDirectionItem {
  icon: string
  /** Если true — иконка не показывается (поле иконки в админке остаётся для быстрого снятия галочки). */
  hideIcon?: boolean
  title: string
  text: string
  /**
   * Slug контентной страницы (`content_pages.slug`), вложенный URL: `/{linePageSlug}/{detailSlug}`.
   * Пусто — карточка без отдельной страницы.
   */
  detailSlug?: string
}

/** Карточка в пользовательском блоке «cards». */
export interface LineMarketingCardItem {
  icon: string
  hideIcon?: boolean
  title: string
  text: string
  detailSlug?: string
}

export interface LineMarketingCardsBlock {
  id: string
  type: 'cards'
  items: LineMarketingCardItem[]
}

export interface LineMarketingTextBlock {
  id: string
  type: 'text'
  title: string
  subtitle: string
  description: string
}

export interface LineMarketingSplitBlock {
  id: string
  type: 'split'
  /** Текст левой колонки (Markdown). */
  leftText: string
  /** Доля ширины левой колонки (остаток — правая); вместе с gap задаёт раскладку flex/grid. */
  leftWidthPercent: number
  rightMode: 'image' | 'slider'
  /** URL изображений (одно или несколько для слайдера). */
  images: string[]
}

/** Большое баннерное изображение (полная ширина) с опциональным заголовком/подписью поверх. */
export interface LineMarketingHeroImageBlock {
  id: string
  type: 'heroImage'
  /** URL картинки (обязательное поле — иначе блок не показывается). */
  imageUrl: string
  /** Высота баннера: small ~ 280px / medium ~ 420px / large ~ 560px. */
  height: 'small' | 'medium' | 'large'
  /** Опциональный заголовок над картинкой (визуально — поверх затемнения). */
  title: string
  /** Опциональная подпись/подзаголовок. */
  caption: string
  /** Прозрачность тёмного оверлея 0–100 (нужно если поверх есть текст и фон светлый). */
  overlayOpacity: number
}

/** Сетка изображений (3 колонки на десктопе, плитка). */
export interface LineMarketingGalleryBlock {
  id: string
  type: 'gallery'
  title: string
  /** URL изображений в порядке отображения. */
  images: string[]
  /** Колонок на десктопе (1–4). */
  columns: number
}

export interface LineMarketingAccordionItem {
  /** Заголовок раскрывающейся строки (всегда виден). */
  question: string
  /** Содержимое (Markdown). */
  answer: string
}

/** Аккордеон (FAQ-подобный список). */
export interface LineMarketingAccordionBlock {
  id: string
  type: 'accordion'
  title: string
  items: LineMarketingAccordionItem[]
}

/** Произвольный Markdown/HTML контент. */
export interface LineMarketingHtmlMarkdownBlock {
  id: string
  type: 'htmlMarkdown'
  /** Заголовок над контентом (опционально). */
  title: string
  /** Текст блока — поддерживается Markdown; HTML экранируется тем же sanitizer'ом, что и body. */
  content: string
  /** Выравнивание контейнера: left/center (по умолчанию left). */
  align: 'left' | 'center'
}

export type LineMarketingContentBlock =
  | LineMarketingCardsBlock
  | LineMarketingTextBlock
  | LineMarketingSplitBlock
  | LineMarketingHeroImageBlock
  | LineMarketingGalleryBlock
  | LineMarketingAccordionBlock
  | LineMarketingHtmlMarkdownBlock

/** Тип блока в пользовательской секции (для UI выбора и normalizers). */
export type LineMarketingContentBlockType = LineMarketingContentBlock['type']

/** Пользовательская секция после hero (набор блоков контента). */
export interface LineMarketingCustomSection {
  id: string
  title: string
  /** Показывать заголовок секции над блоками. */
  showTitle: boolean
  blocks: LineMarketingContentBlock[]
}

/** Алиасы для общего использования на любых CMS-страницах (главная, о компании, листинги, контакты, line-pages). */
export type CustomPageSection = LineMarketingCustomSection
export type CustomPageBlock = LineMarketingContentBlock
export type CustomPageBlockType = LineMarketingContentBlockType

/** Один пункт чек-листа (заголовок строки + пояснение). */
export interface CrewingChecklistPoint {
  title: string
  text: string
}

/** Группа пунктов с общим подзаголовком (I, II, …). */
export interface CrewingChecklistSection {
  heading: string
  points: CrewingChecklistPoint[]
}

/** Блок «полный чек-лист» (критерии отбора экипажа), всегда развёрнут на сайте. */
export interface CrewingChecklistBlock {
  /** Заголовок секции (видимый H2 на странице). */
  sectionTitle: string
  /** Вводный абзац над списком (показывается только если есть хотя бы один пункт) */
  intro: string
  sections: CrewingChecklistSection[]
}

/** Встроенные секции маркетинговой страницы линии (после hero). */
export type LineMarketingSectionId = 'directions' | 'checklist' | 'principles' | 'audience'

export interface CrewingPageData {
  hero: {
    label: string
    titleFormatted: ThemeFormattedTitle
    lead: string
  }
  /** До двух кнопок под лидом в hero. */
  heroButtons: LineMarketingHeroButton[]
  /** Порядок секций после hero (hero не входит); могут быть пользовательские `custom:<uuid>`. */
  sectionOrder: string[]
  /** Видимость секций после hero (встроенные и пользовательские ключи). */
  sectionVisibility: Record<string, boolean>
  /** Пользовательские секции; id совпадает с суффиксом в `sectionOrder` (`custom:<id>`). */
  customSections: LineMarketingCustomSection[]
  directionsSection: {
    title: string
    lead: string
  }
  directions: CrewingDirectionItem[]
  principles: {
    title: string
    items: string[]
  }
  audience: {
    title: string
    paragraph1: string
    paragraph2: string
    ctaLabel: string
    /** Внутренний путь, например /contacts */
    ctaHref: string
  }
  checklist: CrewingChecklistBlock
  showInquiryForm?: boolean
  /** Фон hero (URL); если пусто — только градиенты/фон страницы без фото. */
  heroBackgroundImage?: string
}
