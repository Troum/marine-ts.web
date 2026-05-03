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

/** Допустимые значения `font-weight` для сегмента заголовка (наследование = поле не задано). */
export type ThemeTitleFontWeight = 400 | 500 | 600 | 700 | 800

export interface ThemeTitleSpan {
  text: string
  tone: ThemeTitleTone
  /** Если не задано — наследуется от стиля заголовка (обычно bold у `font-display`). */
  fontWeight?: ThemeTitleFontWeight
}

/**
 * Заголовок из сегментов с цветом из палитры темы (вместо трёх полей «начало / акцент / окончание»).
 * В JSON хранится как объект; прежние поля title/titleAccent/titleEnd при чтении мигрируют в spans.
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

/** Связанная текстовая страница раздела «Судоремонт» (полиморфная привязка в API). */
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

/** Файл в `storage/app/public/media` (список для админки). */
export interface MediaLibraryItem {
  url: string
  filename: string
  size: number
  modified_at: string
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
  /** На бэке выставляется в true, если в payload есть путь к загруженному фото. */
  hasPhoto?: boolean
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
  /**
   * Показывать заголовок страницы (h1) в блоке статьи под hero/блоками.
   * Заголовок по-прежнему нужен для SEO, крошек и вкладки; при false видимый h1 скрыт.
   */
  showPublicTitle?: boolean
  /** Скрыть подвал сайта на этой странице. */
  hideFooter?: boolean
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

export type ContactQuickIconKey = 'phone' | 'mail' | 'map-pin' | 'clock' | 'link' | 'linkedin' | 'vk' | 'max'

/** Публичные контакты (страница «Контакты»), из API `/contact-settings`. */
export interface SiteContactSettings {
  quick: {
    iconKey: ContactQuickIconKey
    label: string
    value: string
    href: string | null
    showInFooter?: boolean
  }[]
  departments: {
    title: string
    phone: string
    email: string
    showInFooter?: boolean
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

/** Режим главного меню: полноэкранный оверлей (бургер) или горизонтальная строка на десктопе. */
export type MainNavMenuVariant = 'overlay' | 'horizontal'

/** Размер шрифта пунктов горизонтального меню (Tailwind `text-*`). */
export type MainNavMenuFontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl'

/** Начертание пунктов горизонтального меню. */
export type MainNavMenuFontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold'

/** Регистр подписей в горизонтальном меню (Tailwind text-*). */
export type MainNavMenuTextCase = 'none' | 'lowercase' | 'uppercase' | 'capitalize'

/** Распределение пунктов горизонтальной строки. */
export type MainNavMenuJustify = 'center' | 'between'

export interface NavigationMenuSettings {
  main: NavigationMenuItem[]
  more: NavigationMenuItem[]
  menuVariant?: MainNavMenuVariant
  menuFontSize?: MainNavMenuFontSize
  menuFontWeight?: MainNavMenuFontWeight
  /** Регистр текста пунктов (горизонтальное меню). */
  menuTextCase?: MainNavMenuTextCase
  /** Выравнивание пунктов по главной оси (`justify-*`). */
  menuJustify?: MainNavMenuJustify
  /**
   * Цвет пунктов горизонтального и полноэкранного меню (CSS-значение, напр. `#1a1a1a`).
   * Если не задан — используется стандартная цветовая схема темы.
   */
  menuItemColor?: string
  /**
   * Цвет пунктов меню при наведении курсора.
   * Если не задан — используется `--color-primary` темы.
   */
  menuItemHoverColor?: string
  /**
   * Пункты горизонтального меню (десктоп). Если не задан или пуст — используется `main`.
   */
  horizItems?: NavigationMenuItem[]
  /**
   * Контактный блок в нижней части бургер-оверлея.
   * Если не задан — используются значения по умолчанию из кода.
   */
  burgerContacts?: NavigationBurgerContacts
}

/** Публичная тема: `default` — Marin; `scglobal` — Golden Sepia (имя в админке). */
export type SitePublicThemeId = 'default' | 'scglobal'

export interface SiteAppearanceSettings {
  theme: SitePublicThemeId
}

/** Контактная информация в нижней части бургер-меню. */
export interface NavigationBurgerSocial {
  url: string
  label: string
}

/** Блок офиса в колонке контактов бургер-меню. */
export interface NavigationBurgerOffice {
  /** Подзаголовок (напр. город или страна). */
  title?: string
  /** Адрес; допускаются переносы строк. */
  address: string
}

export interface NavigationBurgerContacts {
  /** Заголовок колонки телефонов (по умолчанию «Телефоны»). */
  phonesTitle?: string
  /** Список номеров телефонов в виде отображаемого текста (href генерируется автоматически). */
  phones?: string[]
  /** Заголовок средней колонки (email и соцсети). */
  emailTitle?: string
  /** Несколько адресов электронной почты. */
  emails?: string[]
  /** Несколько ссылок на соцсети. */
  socials?: NavigationBurgerSocial[]
  /** Общий заголовок колонки офисов. */
  officesColumnTitle?: string
  /** Несколько офисов (подзаголовок + адрес). */
  offices?: NavigationBurgerOffice[]
  /** @deprecated см. `emails` */
  email?: string
  /** @deprecated см. `socials` */
  socialUrl?: string
  socialLabel?: string
  /** @deprecated см. `officesColumnTitle` + `offices` */
  officeTitle?: string
  officeAddress?: string
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
  /** Полностью скрыть подвал на всём сайте. */
  hideFooterGlobally?: boolean
  /**
   * Скрыть подвал на страницах с этими путями (как в браузере без `/en`: `/`, `/about`, `/services/...`).
   * Префикс локали при проверке отбрасывается.
   */
  hideFooterPaths?: string[]
}

/* ── About page structured data (CMS JSON in body) ── */

/**
 * @deprecated Структура v1 (hero/ecosystem/mission/why). Оставлена для миграции JSON.
 */
export interface AboutHero {
  /** HTML из TipTap (цвета, подсветка, тона темы через marks). */
  title: string
  subtitle: string
  lead: string
  lead2: string
}

/** @deprecated v1 */
export interface AboutServiceCard {
  icon: string
  title: string
  text: string
}

/** @deprecated v1 */
export interface AboutEcosystem {
  title: string
  lead: string
  services: AboutServiceCard[]
}

/** @deprecated v1 */
export interface AboutPrinciple {
  icon: string
  text: string
}

/** @deprecated v1 */
export interface AboutMission {
  title: string
  lead: string
  principles: AboutPrinciple[]
}

/** @deprecated v1 */
export interface AboutWhy {
  title: string
  text: string
  ctaText: string
}

/** Карточка с заголовком и текстом (HTML из TipTap). */
export interface AboutRichCard {
  title: string
  text: string
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
  /** 2 = шесть основных секций (Hero → закрытие). */
  aboutVersion?: 2
  /** Секция 1. Hero / первый экран. */
  sec1Hero: { title: string; body: string }
  /** Секция 2. История и география. */
  sec2History: { title: string; body: string; cards: AboutRichCard[] }
  /** Секция 3. Технический менеджмент. */
  sec3Technical: { title: string; lead: string; lead2: string; cards: AboutRichCard[] }
  /** Секция 4. Крюинг. */
  sec4Crewing: { title: string; lead: string; lead2: string; cards: AboutRichCard[] }
  /** Секция 5. Миссия. */
  sec5Mission: { title: string; body: string; cards: AboutRichCard[] }
  /** Секция 6. CTA / закрытие. */
  sec6Closing: { title: string; body: string }
  geography: AboutGeography
  certificates: AboutCertificates
  showInquiryForm?: boolean
  hideInquiryFormIntro?: boolean
  hideInquiryFormCardHeading?: boolean
  /** Скрыть подвал сайта на этой странице. */
  hideFooter?: boolean
  /** Фон первого экрана (Hero). */
  heroImage?: string
  /** Фон секции «История и география». */
  historyImage?: string
  /** Фон секции «Технический менеджмент». */
  technicalImage?: string
  /** Фон секции «Крюинг». */
  crewingImage?: string
  /** Фон секции «Миссия». */
  missionImage?: string
  /** Пользовательские секции (вставляются после штатных, перед формой заявки). */
  customSections?: LineMarketingCustomSection[]
  /**
   * Порядок доп. блоков после шести основных секций: `geography`, `certificates`, `custom:*`.
   */
  sectionOrder?: string[]
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
  /** Скрыть кнопку клиента (заявка) в hero. */
  hideCtaClient?: boolean
  /** Моряк: анкета */
  ctaSeafarer: string
  ctaSeafarerHref: string
  /** Скрыть кнопку моряка (анкета) в hero. */
  hideCtaSeafarer?: boolean
  /** @deprecated совместимость со старым JSON главной */
  ctaConsult?: string
  /** @deprecated */
  ctaServices?: string
  /** @deprecated не используется в новом дизайне */
  badgeIso?: string
  /** @deprecated не используется в новом дизайне */
  badgeIacs?: string
  /** @deprecated не используется в новом дизайне */
  badgeYears?: string
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
  hoverTitle?: string
  hoverDescription?: string
  heroImage?: string
  /**
   * Скрыть карточку из hero-полосы внизу первого экрана (навигационные ссылки).
   * По умолчанию false — показывается. Карточка при этом всё ещё может
   * отображаться в нижней секции «Чем мы занимаемся», если не выключена там.
   */
  hideInHero?: boolean
  /**
   * Скрыть карточку из секции «Чем мы занимаемся» (грид с описанием и CTA).
   * По умолчанию false — показывается.
   */
  hideInCardsBlock?: boolean
}

export interface HomeDirectionsSection {
  label: string
  headingFormatted: ThemeFormattedTitle
  rows: HomeDirectionRow[]
  /**
   * Показывать ли всю нижнюю секцию «Чем мы занимаемся» (с описаниями и CTA).
   * По умолчанию true — секция отображается. Hero-полоса под первым экраном
   * управляется отдельно через `hideInHero` на каждой строке.
   */
  showCardsBlock?: boolean
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
  /** Основной заголовок блока «О нас» (rich HTML/TFT-HTML). */
  title?: string
  titleFormatted: ThemeFormattedTitle
  /** Короткий подзаголовок под H2 (аналог структуры «О компании»). */
  subtitle: string
  /** Первый абзац блока «О нас». */
  lead: string
  /** Второй абзац блока «О нас». */
  lead2: string
  more: string
  /** @deprecated legacy поле старого блока «О нас». */
  text?: string
}

export interface HomeServicesSection {
  label: string
  headingFormatted: ThemeFormattedTitle
  all: string
  more: string
  /** ID карточек сервисов из каталога (порядок = порядок на главной). Пусто — блок «Судоремонт» не показывается. */
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

/** Иконка соцсети в нижней полосе поверх hero на главной. */
export interface HomeHeroOverlaySocialLink {
  iconKey: string
  href: string
}

/** Текстовая ссылка в полосе поверх hero. */
export interface HomeHeroOverlayNavLink {
  path: string
  label: Record<MarineContentLocale, string>
}

/**
 * Нижняя «overlay»-полоса на первом экране главной (соцсети, ссылки, опционально языки).
 */
export interface HomeHeroOverlayRow {
  enabled: boolean
  socialLinks: HomeHeroOverlaySocialLink[]
  links: HomeHeroOverlayNavLink[]
  /** Показывать переключатель RU/EN в этой полосе. */
  showLanguageSwitch?: boolean
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
  hideInquiryFormIntro?: boolean
  hideInquiryFormCardHeading?: boolean
  /** Пользовательские секции (вставляются после штатных, перед формой заявки). */
  customSections?: LineMarketingCustomSection[]
  /** Порядок секций (включая `custom:<uuid>`); hero фиксирован первым и не входит. */
  sectionOrder?: string[]
  /** Карта видимости секций по id; отсутствие ключа = показывать. */
  sectionVisibility?: Record<string, boolean>
  /** Полоса поверх hero внизу первого экрана: соцсети и ссылки. */
  heroOverlayRow?: HomeHeroOverlayRow
  /** Скрыть подвал сайта на этой странице. */
  hideFooter?: boolean
}

/* ── Listing page structured data (Ship Repair, Projects, Gallery, News hero+CTA) ── */

/** CMS v2 листинга «Судоремонт» (маркетинговые секции + каталог карточек). */
export interface ServicesMarketingPageContent {
  sec1Hero: { title: string; lead: string; body: string }
  sec2Reach: { title: string; paragraph1: string; paragraph2: string }
  sec3Solutions: { title: string; body: string; cards: AboutRichCard[] }
  sec4Advantages: { title: string; cards: AboutRichCard[] }
  sec5Guarantees: { title: string; paragraph1: string; paragraph2: string }
  /** Микрокопия перед формой заявки. */
  sec6PreForm: { title: string; body: string }
}

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
  /** Скрыть блок над карточкой («Заявка», заголовок, лид из i18n) — см. `hideIntro` в PageInquiryForm. */
  hideInquiryFormIntro?: boolean
  /** Скрыть заголовок внутри карточки формы заявки (листинги с формой). */
  hideInquiryFormCardHeading?: boolean
  /** Кнопки под лидом в hero (листинг судоремонта v2). */
  heroButtons?: LineMarketingHeroButton[]
  /** `v2` — контент из `servicesV2`; `legacy` — классический hero + сетка + кнопка CTA. */
  servicesPageLayout?: 'legacy' | 'v2'
  servicesV2?: ServicesMarketingPageContent
  /** Опциональный фон hero (листинги сервисов, проектов, галереи, новостей, вакансий). */
  heroImage?: string
  /** Пользовательские секции (вставляются после штатных, перед формой заявки). */
  customSections?: LineMarketingCustomSection[]
  /** Порядок секций (включая `custom:<uuid>`); hero фиксирован первым и не входит. */
  sectionOrder?: string[]
  /** Карта видимости секций по id; отсутствие ключа = показывать. */
  sectionVisibility?: Record<string, boolean>
  /** Скрыть подвал сайта на этой странице. */
  hideFooter?: boolean
  /**
   * Стиль хлебных крошек в hero.
   * `auto` — светлый текст для маркетингового hero v2 с затемнением.
   */
  heroBreadcrumbTone?: PageBreadcrumbTone
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
  hideInquiryFormIntro?: boolean
  hideInquiryFormCardHeading?: boolean
  /** Опциональный фон hero. */
  heroImage?: string
  /** Пользовательские секции (вставляются после штатных, перед формой заявки). */
  customSections?: LineMarketingCustomSection[]
  /** Порядок секций (включая `custom:<uuid>`); hero фиксирован первым и не входит. */
  sectionOrder?: string[]
  /** Карта видимости секций по id; отсутствие ключа = показывать. */
  sectionVisibility?: Record<string, boolean>
  /** Скрыть подвал сайта на этой странице. */
  hideFooter?: boolean
}

/** Кнопка в hero маркетинговых страниц линий (крюинг / судовой менеджмент), не более двух. */
export interface LineMarketingHeroButton {
  label: string
  /** Внутренний путь (`/contacts`), якорь (`#page-inquiry`) или полный URL. */
  href: string
}

/** Контент страницы «Судовой менеджмент / технический менеджмент» (структура v2). */
export interface ShipManagementPageContent {
  sec1Hero: { title: string; lead: string; body: string }
  sec2Approach: { title: string; body: string; cardsHeading: string; cards: AboutRichCard[] }
  sec3Services: { title: string; body: string; cards: AboutRichCard[] }
  sec4Advantages: { title: string; cards: AboutRichCard[] }
  /** Финальный акцент — два абзаца (TipTap). */
  sec5Closing: { title: string; paragraph1: string; paragraph2: string }
}

/** Контент страницы «Крюинг-менеджмент» (структура v2, по секциям как «О компании»). */
export interface CrewingManagementPageContent {
  sec1Hero: { title: string; lead: string; body: string }
  sec2Approach: { title: string; body: string; cardsHeading: string; cards: AboutRichCard[] }
  sec3Services: { title: string; body: string; cards: AboutRichCard[] }
  sec4Advantages: { title: string; cards: AboutRichCard[] }
  /** Секция «Доверие» — два абзаца (как финальный блок судового менеджмента). */
  sec5Trust: { title: string; paragraph1: string; paragraph2: string }
  sec6Cta: { title: string; body: string }
}

/** Карточка направления в классической вёрстке страницы «Крюинг-менеджмент». */
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
  /**
   * Ссылка «Подробнее»: полный внутренний путь (`/about`, `/projects/x`) либо короткий slug
   * на маркетинговых линиях (`/{line}/{slug}`). Пусто — без ссылки.
   */
  detailSlug?: string
}

export interface LineMarketingCardsBlock {
  id: string
  type: 'cards'
  /** Колонок сетки на широких экранах (1–6). По умолчанию 3. */
  columns?: number
  /** Выравнивание текста и иконки в карточке. По умолчанию left. */
  itemsAlign?: 'left' | 'center'
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
  /**
   * Показывать баннер на публичном сайте.
   * Если false — блок скрыт (настройки и URL сохраняются в CMS).
   */
  showHero?: boolean
  /** URL картинки (обязательное поле — иначе блок не показывается). */
  imageUrl: string
  /**
   * Устаревшие пресеты высоты; на сайте баннер фиксирован **50vh** на всю ширину окна.
   * Поле остаётся в типе для обратной совместимости с уже сохранёнными страницами.
   */
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

/** Палитра хлебных крошек на тёмном или светлом фоне (hero, баннер в секции). */
export type PageBreadcrumbTone = 'auto' | 'on-dark' | 'on-light'

/** Пользовательская секция после hero (набор блоков контента). */
export interface LineMarketingCustomSection {
  id: string
  title: string
  /** Показывать заголовок секции над блоками. */
  showTitle: boolean
  /**
   * Только для детальных content-page (TipTap): где показывать секцию относительно основного текста статьи.
   * По умолчанию `beforeArticle` — как раньше (hero и блоки над статьёй).
   */
  contentPlacement?: 'beforeArticle' | 'afterArticle'
  /**
   * Если задано — над первым блоком «Баннер / изображение» в секции показываются крошки
   * с выбранной палитрой (остальные типы блоков не затрагиваются).
   */
  breadcrumbTone?: PageBreadcrumbTone
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
export type LineMarketingSectionId =
  | 'directions'
  | 'checklist'
  | 'principles'
  | 'audience'
  | 'approach'
  | 'services'
  | 'advantages'
  | 'trust'
  | 'cta'

  hero: {
    label: string
    titleFormatted: ThemeFormattedTitle
    lead: string
  }
  /** `v2` — контент из `shipV2`; иначе — классическая вёрстка. */
  shipPageLayout?: 'legacy' | 'v2'
  /** Секции v2 для ship-management при `shipPageLayout === 'v2'`. */
  shipV2?: ShipManagementPageContent
  /** `v2` — контент из `crewingV2`; `legacy` или отсутствие ключа — классическая вёрстка. */
  crewingPageLayout?: 'legacy' | 'v2'
  /** Секции v2 (только для crewing-management при `crewingPageLayout === 'v2'`). */
  crewingV2?: CrewingManagementPageContent
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
  /** Скрыть блок над карточкой («Заявка», заголовок, лид из i18n). */
  hideInquiryFormIntro?: boolean
  /**
   * Скрыть заголовок/лид внутри карточки формы заявки (дублирует блок секции над формой).
   * Внешний блок «Оставьте заявку» — `hideInquiryFormIntro`.
   */
  hideInquiryFormCardHeading?: boolean
  /** Фон hero (URL); если пусто — только градиенты/фон страницы без фото. */
  heroBackgroundImage?: string
  /**
   * Стиль хлебных крошек в hero.
   * `auto` — светлый текст при v2 и непустом фоне hero.
   */
  heroBreadcrumbTone?: PageBreadcrumbTone
  /** Скрыть подвал сайта на этой странице. */
  hideFooter?: boolean
}
