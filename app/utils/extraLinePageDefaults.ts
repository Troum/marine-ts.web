import type { CrewingPageData, MarineContentLocale } from '~/types'
import { LINE_MARKETING_SECTION_DEFAULT_ORDER } from '~/utils/lineMarketingPages'
import { themeTitleTriple } from '~/utils/themeFormattedTitle'

const emptyChecklist = {
  sectionTitle: '',
  intro: '',
  sections: [] as CrewingPageData['checklist']['sections'],
}

/** Пустой шаблон классической маркетинговой страницы линии (для merge legacy JSON без подмешивания демо v2). */
export function emptyLineMarketingLegacyPageData(_locale: MarineContentLocale): CrewingPageData {
  const blank = themeTitleTriple('', '', '')
  return {
    hero: {
      label: '',
      titleFormatted: blank,
      lead: '',
    },
    heroButtons: [],
    sectionOrder: [...LINE_MARKETING_SECTION_DEFAULT_ORDER],
    sectionVisibility: {
      directions: true,
      checklist: true,
      principles: true,
      audience: true,
    },
    customSections: [],
    directionsSection: { title: '', lead: '' },
    directions: [],
    principles: { title: '', items: [] },
    audience: {
      title: '',
      paragraph1: '',
      paragraph2: '',
      ctaLabel: '',
      ctaHref: '/contacts',
    },
    checklist: { ...emptyChecklist },
    showInquiryForm: false,
    hideInquiryFormIntro: false,
    hideInquiryFormCardHeading: false,
    heroBackgroundImage: '',
    sectionBackgroundImages: {},
  }
}
