import type {
  AboutHero,
  ContactsPageData,
  CrewingPageData,
  HomeAboutPreview,
  HomeCTA,
  HomeDirectionsSection,
  HomeFunnelCrewingSpotlight,
  HomeFunnelSpotlight,
  HomeHero,
  HomeProcessSection,
  HomeServicesSection,
  HomeTrustStrip,
  ListingHero,
  ThemeFormattedTitle,
  ThemeTitleFontWeight,
  ThemeTitleSpan,
  ThemeTitleTone,
} from '~/types'
import { incomingCmsValueToHtml, stripHtmlToPlain } from '~/utils/adminHtmlField'
import { TIPTAP_FONT_WEIGHT_VALUES } from '~/utils/tiptapFontWeightConstants'
import { serializeThemeTitleTiptapDocToHtml, themeTitleToTiptapDoc } from '~/utils/themeToneTiptap'

/** Локальный helper: строка → plain без тегов и whitespace по краям. */
function stripHtmlToPlainTrim(raw: string): string {
  return stripHtmlToPlain(raw).trim()
}

const TONES: ThemeTitleTone[] = [
  'text',
  'textSecondary',
  'textMuted',
  'accent',
  'accentLight',
  'accentDark',
  'marker',
]

export function isThemeTitleTone(x: unknown): x is ThemeTitleTone {
  return typeof x === 'string' && (TONES as string[]).includes(x)
}

export function isThemeTitleFontWeight(x: unknown): x is ThemeTitleFontWeight {
  return typeof x === 'number' && (TIPTAP_FONT_WEIGHT_VALUES as number[]).includes(x)
}

/** Подписи веса в палитре админки. */
export const THEME_TITLE_FONT_WEIGHT_LABELS: Record<ThemeTitleFontWeight, string> = {
  400: 'Обычный (400)',
  500: 'Средний (500)',
  600: 'Полужирный (600)',
  700: 'Жирный (700)',
  800: 'Экстра-жирный (800)',
}

/** Tailwind-классы для сегмента (только токены темы). */
export const THEME_TITLE_TONE_CLASSES: Record<ThemeTitleTone, string> = {
  text: 'text-mts-text',
  textSecondary: 'text-mts-text-secondary',
  textMuted: 'text-mts-text-muted',
  accent: 'text-mts-accent',
  accentLight: 'text-mts-accent-light',
  accentDark: 'text-mts-accent-dark',
  marker: 'text-mts-marker',
}

/** Подписи для палитры в админке. */
export const THEME_TITLE_TONE_LABELS: Record<ThemeTitleTone, string> = {
  text: 'Основной',
  textSecondary: 'Вторичный',
  textMuted: 'Приглушённый',
  accent: 'Акцент',
  accentLight: 'Акцент светлый',
  accentDark: 'Акцент тёмный',
  marker: 'Маркер',
}

/** Фон для квадрата-превью в палитре админки (токены темы). */
export const THEME_TITLE_TONE_SWATCH_BG: Record<ThemeTitleTone, string> = {
  text: 'bg-mts-text',
  textSecondary: 'bg-mts-text-secondary',
  textMuted: 'bg-mts-text-muted',
  accent: 'bg-mts-accent',
  accentLight: 'bg-mts-accent-light',
  accentDark: 'bg-mts-accent-dark',
  marker: 'bg-mts-marker',
}

/**
 * Цвета превью TipTap в админке на светлом фоне `.admin-shell` (main.css).
 * Отдельно от публичного сайта: там токены темы и тёмный фон; здесь нужен
 * контраст с белым/серым фоном карточек, иначе «основной» тон (#e6edf2) не виден.
 */
export const THEME_TITLE_TONE_ADMIN_PREVIEW_HEX: Record<ThemeTitleTone, string> = {
  text: '#1c1c1e',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  accent: '#de7879',
  accentLight: '#e89495',
  accentDark: '#b85e5f',
  marker: '#2ea3ff',
}

/** Inline `color` в DOM TipTap (только админ-превью на светлом фоне). */
export function themeToneInlineStyle(tone: ThemeTitleTone): string {
  return `color: ${THEME_TITLE_TONE_ADMIN_PREVIEW_HEX[tone]};`
}

export function emptyThemeTitle(): ThemeFormattedTitle {
  return { spans: [{ text: '', tone: 'text' }] }
}

/** Миграция `ThemeFormattedTitle` → HTML (поля, перешедшие на `AdminThemedTextField`). */
export function themeFormattedTitleToHtml(parsed: unknown): string {
  const tft = normalizeThemeFormattedTitle(parsed as ThemeFormattedTitle)
  return serializeThemeTitleTiptapDocToHtml(themeTitleToTiptapDoc(tft))
}

/** Три сегмента: текст — акцент — текст (как бывшие три поля). */
export function themeTitleTriple(before: string, accent: string, after: string): ThemeFormattedTitle {
  return {
    spans: [
      { text: before, tone: 'text' },
      { text: accent, tone: 'accent' },
      { text: after, tone: 'text' },
    ],
  }
}

/** Два сегмента: текст — акцент. */
export function themeTitlePair(a: string, b: string, toneA: ThemeTitleTone = 'text', toneB: ThemeTitleTone = 'accent'): ThemeFormattedTitle {
  return {
    spans: [
      { text: a, tone: toneA },
      { text: b, tone: toneB },
    ],
  }
}

export function normalizeThemeFormattedTitle(raw: unknown): ThemeFormattedTitle {
  if (!raw || typeof raw !== 'object') {
    return emptyThemeTitle()
  }
  const r = raw as Partial<ThemeFormattedTitle>
  if (!Array.isArray(r.spans)) {
    return emptyThemeTitle()
  }
  const spans: ThemeTitleSpan[] = r.spans.map((s) => {
    if (!s || typeof s !== 'object') {
      return { text: '', tone: 'text' }
    }
    const t = (s as Partial<ThemeTitleSpan>).tone
    const tone = isThemeTitleTone(t) ? t : 'text'
    const rawW = (s as Partial<ThemeTitleSpan>).fontWeight
    let fontWeight: ThemeTitleFontWeight | undefined
    if (typeof rawW === 'number' && isThemeTitleFontWeight(rawW)) {
      fontWeight = rawW
    } else if (typeof rawW === 'string') {
      const n = Number(rawW)
      if (isThemeTitleFontWeight(n)) {
        fontWeight = n
      }
    }
    return {
      text: typeof (s as Partial<ThemeTitleSpan>).text === 'string' ? (s as ThemeTitleSpan).text : '',
      tone,
      ...(fontWeight != null ? { fontWeight } : {}),
    }
  })
  return { spans: spans.length > 0 ? spans : emptyThemeTitle().spans }
}

export function mergeThemeFormattedTitle(parsed: unknown, base: ThemeFormattedTitle): ThemeFormattedTitle {
  return normalizeThemeFormattedTitle(parsed ?? base)
}

export function migrateLegacyTripleToTheme(
  title?: string,
  titleAccent?: string,
  titleEnd?: string,
): ThemeFormattedTitle {
  return themeTitleTriple(title ?? '', titleAccent ?? '', titleEnd ?? '')
}

export function migrateLegacyPairToTheme(title?: string, titleAccent?: string): ThemeFormattedTitle {
  return themeTitlePair(title ?? '', titleAccent ?? '')
}

/** Главная: первая строка отдельно, затем перенос, затем акцент + хвост (как бывшие titleLine1 / accent / suffix). */
export function migrateHomeHeroLegacy(titleLine1: string, titleAccent: string, titleSuffix: string): ThemeFormattedTitle {
  return {
    spans: [
      { text: `${titleLine1}\n`, tone: 'text' },
      { text: titleAccent, tone: 'accent' },
      { text: titleSuffix, tone: 'text' },
    ],
  }
}

/** Hero линейных маркетинговых страниц и листингов. */
export function mergeListingHero(raw: unknown, base: ListingHero): ListingHero {
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const h = raw as Record<string, unknown>
  if (h.titleFormatted !== undefined) {
    return {
      titleFormatted: mergeThemeFormattedTitle(h.titleFormatted, base.titleFormatted),
      lead: typeof h.lead === 'string' ? h.lead : base.lead,
    }
  }
  return {
    titleFormatted: migrateLegacyTripleToTheme(
      typeof h.title === 'string' ? h.title : '',
      typeof h.titleAccent === 'string' ? h.titleAccent : '',
      typeof h.titleEnd === 'string' ? h.titleEnd : '',
    ),
    lead: typeof h.lead === 'string' ? h.lead : base.lead,
  }
}

export function mergeCrewingHero(raw: unknown, base: CrewingPageData['hero']): CrewingPageData['hero'] {
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const h = raw as Record<string, unknown>
  if (h.titleFormatted !== undefined) {
    return {
      label: typeof h.label === 'string' ? h.label : base.label,
      titleFormatted: mergeThemeFormattedTitle(h.titleFormatted, base.titleFormatted),
      lead: typeof h.lead === 'string' ? h.lead : base.lead,
    }
  }
  return {
    label: typeof h.label === 'string' ? h.label : base.label,
    titleFormatted: migrateLegacyTripleToTheme(
      typeof h.title === 'string' ? h.title : '',
      typeof h.titleAccent === 'string' ? h.titleAccent : '',
      typeof h.titleEnd === 'string' ? h.titleEnd : '',
    ),
    lead: typeof h.lead === 'string' ? h.lead : base.lead,
  }
}

export function mergeContactsHero(
  raw: unknown,
  base: ContactsPageData['hero'],
): ContactsPageData['hero'] {
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const h = raw as Record<string, unknown>
  if (h.titleFormatted !== undefined) {
    return {
      titleFormatted: mergeThemeFormattedTitle(h.titleFormatted, base.titleFormatted),
      lead: typeof h.lead === 'string' ? h.lead : base.lead,
    }
  }
  return {
    titleFormatted: migrateLegacyPairToTheme(
      typeof h.title === 'string' ? h.title : '',
      typeof h.titleAccent === 'string' ? h.titleAccent : '',
    ),
    lead: typeof h.lead === 'string' ? h.lead : base.lead,
  }
}

function isLegacyAboutHeroTriple(h: Record<string, unknown>): boolean {
  return 'titleAccent' in h || 'titleEnd' in h
}

export function mergeAboutHero(raw: unknown, base: AboutHero): AboutHero {
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const h = raw as Record<string, unknown>

  let title: string
  if (typeof h.title === 'string' && h.title.trim() !== '') {
    title = incomingCmsValueToHtml(h.title)
  } else if (h.titleFormatted !== undefined) {
    title = themeFormattedTitleToHtml(h.titleFormatted)
  } else if (isLegacyAboutHeroTriple(h)) {
    title = themeFormattedTitleToHtml(
      migrateLegacyTripleToTheme(
        typeof h.title === 'string' ? h.title : '',
        typeof h.titleAccent === 'string' ? h.titleAccent : '',
        typeof h.titleEnd === 'string' ? h.titleEnd : '',
      ),
    )
  } else {
    title = base.title
  }

  return {
    title,
    subtitle: typeof h.subtitle === 'string' ? h.subtitle : base.subtitle,
    lead: typeof h.lead === 'string' ? h.lead : base.lead,
    lead2: typeof h.lead2 === 'string' ? h.lead2 : base.lead2,
  }
}

function mergeFunnelSpotlightInner(
  raw: Partial<HomeFunnelSpotlight> | undefined,
  base: HomeFunnelSpotlight,
): HomeFunnelSpotlight {
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const h = raw as Record<string, unknown>
  const titleFormatted =
    h.titleFormatted !== undefined
      ? mergeThemeFormattedTitle(h.titleFormatted, base.titleFormatted)
      : migrateLegacyTripleToTheme(
          typeof h.title === 'string' ? h.title : '',
          typeof h.titleAccent === 'string' ? h.titleAccent : '',
          typeof h.titleEnd === 'string' ? h.titleEnd : '',
        )
  return {
    label: typeof h.label === 'string' ? h.label : base.label,
    titleFormatted,
    text: typeof h.text === 'string' ? h.text : base.text,
    cta: typeof h.cta === 'string' ? h.cta : base.cta,
    href: typeof h.href === 'string' ? h.href : base.href,
  }
}

export function mergeHomeHero(parsed: Partial<HomeHero> | undefined, base: HomeHero): HomeHero {
  if (!parsed || typeof parsed !== 'object') {
    return base
  }
  const h = parsed as Record<string, unknown>
  const titleFormatted =
    h.titleFormatted !== undefined
      ? mergeThemeFormattedTitle(h.titleFormatted, base.titleFormatted)
      : migrateHomeHeroLegacy(
          typeof h.titleLine1 === 'string' ? h.titleLine1 : '',
          typeof h.titleAccent === 'string' ? h.titleAccent : '',
          typeof h.titleSuffix === 'string' ? h.titleSuffix : '',
        )
  return {
    label: typeof h.label === 'string' ? h.label : base.label,
    titleFormatted,
    lead: typeof h.lead === 'string' ? h.lead : base.lead,
    ctaClient: typeof h.ctaClient === 'string' ? h.ctaClient : (h.ctaConsult as string) ?? base.ctaClient,
    /* href — URL: ранее ввод шёл через AdminThemedTextField и мог содержать HTML.
       Срезаем теги к плейн-строке перед отдачей в форму. */
    ctaClientHref: typeof h.ctaClientHref === 'string' ? stripHtmlToPlainTrim(h.ctaClientHref) : '/request',
    hideCtaClient: typeof h.hideCtaClient === 'boolean' ? h.hideCtaClient : (base.hideCtaClient ?? false),
    ctaSeafarer: typeof h.ctaSeafarer === 'string' ? h.ctaSeafarer : (h.ctaServices as string) ?? base.ctaSeafarer,
    ctaSeafarerHref:
      typeof h.ctaSeafarerHref === 'string' ? stripHtmlToPlainTrim(h.ctaSeafarerHref) : '/application-form',
    hideCtaSeafarer: typeof h.hideCtaSeafarer === 'boolean' ? h.hideCtaSeafarer : (base.hideCtaSeafarer ?? false),
    scroll: typeof h.scroll === 'string' ? h.scroll : base.scroll,
  }
}

export function mergeFunnelShip(
  parsed: Partial<HomeFunnelSpotlight> | undefined,
  base: HomeFunnelSpotlight,
): HomeFunnelSpotlight {
  return mergeFunnelSpotlightInner(parsed, base)
}

export function mergeFunnelCrewing(
  parsed: Partial<HomeFunnelCrewingSpotlight> | undefined,
  base: HomeFunnelCrewingSpotlight,
): HomeFunnelCrewingSpotlight {
  const inner = mergeFunnelSpotlightInner(parsed, base)
  if (!parsed || typeof parsed !== 'object') {
    return base
  }
  const h = parsed as Record<string, unknown>
  return {
    ...inner,
    secondaryCta: typeof h.secondaryCta === 'string' ? h.secondaryCta : base.secondaryCta,
    secondaryHref: typeof h.secondaryHref === 'string' ? h.secondaryHref : base.secondaryHref,
  }
}

export function mergeFunnelTechnical(
  parsed: Partial<HomeFunnelSpotlight> | undefined,
  base: HomeFunnelSpotlight,
): HomeFunnelSpotlight {
  return mergeFunnelSpotlightInner(parsed, base)
}

export function mergeHomeDirectionsSection(
  parsed: Partial<HomeDirectionsSection> | undefined,
  base: HomeDirectionsSection,
): HomeDirectionsSection {
  if (!parsed || typeof parsed !== 'object') {
    return base
  }
  const h = parsed as Record<string, unknown>
  const headingFormatted =
    h.headingFormatted !== undefined
      ? mergeThemeFormattedTitle(h.headingFormatted, base.headingFormatted)
      : migrateLegacyTripleToTheme(
          typeof h.heading === 'string' ? h.heading : '',
          typeof h.headingAccent === 'string' ? h.headingAccent : '',
          typeof h.headingEnd === 'string' ? h.headingEnd : '',
        )
  return {
    label: typeof h.label === 'string' ? h.label : base.label,
    headingFormatted,
    rows:
      parsed.rows && parsed.rows.length > 0
        ? parsed.rows.map((row, i) => ({
            ...base.rows[i],
            ...row,
            hoverTitle: typeof row.hoverTitle === 'string' ? row.hoverTitle : '',
            hoverDescription: typeof row.hoverDescription === 'string' ? row.hoverDescription : '',
            heroImage: typeof row.heroImage === 'string' ? row.heroImage : '',
            hideInHero: row.hideInHero === true,
            hideInCardsBlock: row.hideInCardsBlock === true,
          }))
        : base.rows,
    showCardsBlock: typeof h.showCardsBlock === 'boolean' ? (h.showCardsBlock as boolean) : base.showCardsBlock !== false,
  }
}

export function mergeHomeTrustStrip(
  parsed: Partial<HomeTrustStrip> | undefined,
  base: HomeTrustStrip,
): HomeTrustStrip {
  if (!parsed || typeof parsed !== 'object') {
    return base
  }
  const h = parsed as Record<string, unknown>
  const titleFormatted =
    h.titleFormatted !== undefined
      ? mergeThemeFormattedTitle(h.titleFormatted, base.titleFormatted)
      : migrateLegacyPairToTheme(
          typeof h.title === 'string' ? h.title : '',
          typeof h.titleAccent === 'string' ? h.titleAccent : '',
        )
  return {
    label: typeof h.label === 'string' ? h.label : base.label,
    titleFormatted,
    bullets: parsed.bullets?.length ? parsed.bullets : base.bullets,
  }
}

export function mergeHomeAboutPreview(
  parsed: Partial<HomeAboutPreview> | undefined,
  base: HomeAboutPreview,
): HomeAboutPreview {
  if (!parsed || typeof parsed !== 'object') {
    return base
  }
  const h = parsed as Record<string, unknown>
  const titleFormatted =
    h.titleFormatted !== undefined
      ? mergeThemeFormattedTitle(h.titleFormatted, base.titleFormatted)
      : migrateLegacyTripleToTheme(
          typeof h.title === 'string' ? h.title : '',
          typeof h.titleAccent === 'string' ? h.titleAccent : '',
          typeof h.titleEnd === 'string' ? h.titleEnd : '',
        )
  const title =
    typeof h.title === 'string' && h.title.trim() !== ''
      ? incomingCmsValueToHtml(h.title)
      : themeFormattedTitleToHtml(titleFormatted)

  return {
    label: typeof h.label === 'string' ? h.label : base.label,
    title,
    titleFormatted,
    subtitle: typeof h.subtitle === 'string' ? h.subtitle : base.subtitle,
    lead: typeof h.lead === 'string' ? h.lead : (typeof h.text === 'string' ? h.text : base.lead),
    lead2: typeof h.lead2 === 'string' ? h.lead2 : base.lead2,
    more: typeof h.more === 'string' ? h.more : base.more,
  }
}

export function mergeHomeServicesSection(
  parsed: Partial<HomeServicesSection> | undefined,
  base: HomeServicesSection,
): HomeServicesSection {
  if (!parsed || typeof parsed !== 'object') {
    return base
  }
  const h = parsed as Record<string, unknown>
  const headingFormatted =
    h.headingFormatted !== undefined
      ? mergeThemeFormattedTitle(h.headingFormatted, base.headingFormatted)
      : migrateLegacyTripleToTheme(
          typeof h.heading === 'string' ? h.heading : '',
          typeof h.headingAccent === 'string' ? h.headingAccent : '',
          typeof h.headingEnd === 'string' ? h.headingEnd : '',
        )
  return {
    label: typeof h.label === 'string' ? h.label : base.label,
    headingFormatted,
    all: typeof h.all === 'string' ? h.all : base.all,
    more: typeof h.more === 'string' ? h.more : base.more,
    featuredServiceIds: Array.isArray(parsed.featuredServiceIds)
      ? [...parsed.featuredServiceIds]
      : base.featuredServiceIds,
  }
}

export function mergeHomeProcessSection(
  parsed: Partial<HomeProcessSection> | undefined,
  base: HomeProcessSection,
): HomeProcessSection {
  if (!parsed || typeof parsed !== 'object') {
    return base
  }
  const h = parsed as Record<string, unknown>
  const headingFormatted =
    h.headingFormatted !== undefined
      ? mergeThemeFormattedTitle(h.headingFormatted, base.headingFormatted)
      : migrateLegacyPairToTheme(
          typeof h.heading === 'string' ? h.heading : '',
          typeof h.headingAccent === 'string' ? h.headingAccent : '',
        )
  return {
    label: typeof h.label === 'string' ? h.label : base.label,
    headingFormatted,
    steps: parsed.steps?.length ? parsed.steps : base.steps,
  }
}

export function mergeHomeCTA(parsed: Partial<HomeCTA> | undefined, base: HomeCTA): HomeCTA {
  if (!parsed || typeof parsed !== 'object') {
    return base
  }
  const h = parsed as Record<string, unknown>
  const titleFormatted =
    h.titleFormatted !== undefined
      ? mergeThemeFormattedTitle(h.titleFormatted, base.titleFormatted)
      : migrateLegacyPairToTheme(
          typeof h.title === 'string' ? h.title : '',
          typeof h.titleAccent === 'string' ? h.titleAccent : '',
        )
  return {
    label: typeof h.label === 'string' ? h.label : base.label,
    titleFormatted,
    text: typeof h.text === 'string' ? h.text : base.text,
    button: typeof h.button === 'string' ? h.button : base.button,
  }
}
