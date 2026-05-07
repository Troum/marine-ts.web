<script setup lang="ts">
import { Calendar, User, Loader2, MoveRight } from 'lucide-vue-next'
import type { NewsItem, ListingPageData, MarineContentLocale } from '~/types'
import HeroBreadcrumbsRow from '~/components/common/HeroBreadcrumbsRow.vue'
import ListingHeroShell from '~/components/common/ListingHeroShell.vue'
import { newsCategoryLabel } from '~/utils/contentLabels'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { defaultListingData, listingDefaultOrder, mergeListingPageData } from '~/utils/pageDefaults'
import { isSectionVisible, resolveSectionOrder } from '~/utils/sectionVisibility'
import { resolveHeroBreadcrumbOnDark } from '~/utils/pageBreadcrumbTone'

useSiteSeoMeta('news')

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const { data: cmsPage } = await useAsyncData('news-page-cms', async () => {
  try { return await api.contentPages.getPublicBySlug('news-page') } catch { return null }
}, { server: true })

const cms = computed<ListingPageData>(() => {
  const body = cmsPage.value?.body
  if (body) {
    try {
      const p = JSON.parse(body) as unknown
      if (p && typeof p === 'object' && 'hero' in (p as object)) {
        return mergeListingPageData('news-page', loc.value, p)
      }
    } catch {
      /* */
    }
  }
  return defaultListingData('news-page', loc.value)
})

const { setHidden: setFooterHidden } = usePageFooterHidden()
watchEffect(() => { setFooterHidden(cms.value?.hideFooter ?? false) })

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.news'), to: '/news' }),
)

const hasHeroPhoto = computed(() => Boolean(cms.value.heroImage?.trim()))
const heroBreadcrumbsOnDark = computed(() =>
  resolveHeroBreadcrumbOnDark(cms.value.heroBreadcrumbTone, hasHeroPhoto.value),
)

const news = ref<NewsItem[]>([])
const pending = ref(true)
const error = ref('')

async function load() {
  pending.value = true
  error.value = ''
  try {
    news.value = await api.news.getAll()
  } catch {
    error.value = t('pages.news.loadError')
  } finally {
    pending.value = false
  }
}

onMounted(load)

const featuredNews = computed(() => news.value.find((n) => n.featured) || news.value[0] || null)
const regularNews = computed(() => news.value.filter((n) => n.id !== featuredNews.value?.id))

function categoryLabel(cat: string | undefined) {
  return newsCategoryLabel(cat, t)
}

const sectionOrderEffective = computed(() =>
  resolveSectionOrder(cms.value.sectionOrder, listingDefaultOrder('news-page'), cms.value.customSections),
)

function sectionShown(id: string): boolean {
  return isSectionVisible(cms.value.sectionVisibility, id)
}
</script>

<template>
  <div class="bg-white">
    <ListingHeroShell :hero-image="cms.heroImage" :hero-veil="hasHeroPhoto">
      <div class="max-w-7xl">
        <HeroBreadcrumbsRow
          :items="crumbItems"
          :on-dark-hero="heroBreadcrumbsOnDark"
        />
        <div class="mts-figma-hero-stack">
          <h1
            :class="[
              'mts-figma-hero-h1 max-w-[1055px]',
              hasHeroPhoto
                ? 'mts-hero-themed-copy text-white drop-shadow-md'
                : 'text-body',
            ]"
          >
            <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
          </h1>
          <p
            :class="[
              'mts-figma-hero-lead max-w-[895px]',
              hasHeroPhoto
                ? 'mts-hero-themed-copy text-white/95 drop-shadow'
                : 'text-muted',
            ]"
          >
            <ThemedContentString :content="cms.hero.lead" />
          </p>
        </div>
      </div>
    </ListingHeroShell>

    <template v-for="sid in sectionOrderEffective" :key="sid">
      <template v-if="sid === 'listing' && sectionShown('listing')">
        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="w-8 h-8 text-primary animate-spin" />
        </div>
        <div v-else-if="error" class="text-center py-24">
          <p class="font-body text-muted mb-4">{{ error }}</p>
          <button type="button" class="btn-primary" @click="load">{{ t('pages.common.tryAgain') }}</button>
        </div>
        <template v-else>
          <section v-if="featuredNews" class="relative py-16 overflow-hidden bg-bg-light">
            <div class="mts-content-wrap relative z-10">
              <div class="service-card corner-accent p-8 lg:p-12">
                <div class="flex items-center gap-3 mb-6">
                  <span class="font-mono text-xs uppercase tracking-wide text-primary bg-primary/10 px-3 py-1">
                    {{ categoryLabel(featuredNews.category) }}
                  </span>
                  <span
                    v-if="featuredNews.featured"
                    class="font-mono text-xs uppercase tracking-wide text-white bg-primary px-3 py-1"
                  >
                    {{ t('pages.common.featured') }}
                  </span>
                </div>
                <h2 class="mts-figma-section-h2 text-body mb-4">
                  <ThemedContentString :content="featuredNews.title" />
                </h2>
                <p class="font-body text-muted mb-6 max-w-7xl">
                  <ThemedContentString :content="featuredNews.excerpt" />
                </p>
                <NuxtLink :to="localePath(`/news/${featuredNews.slug}`)" class="btn-primary mb-6 inline-flex">
                  {{ t('pages.common.readFull') }}
                  <MoveRight />
                </NuxtLink>
                <div class="flex items-center gap-6 text-muted">
                  <div class="flex items-center gap-2">
                    <Calendar class="w-4 h-4" />
                    <span class="font-body text-sm">{{ featuredNews.date }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <User class="w-4 h-4" />
                    <span class="font-body text-sm"><ThemedContentString :content="featuredNews.author" /></span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="relative py-24 overflow-hidden">
            <div class="mts-content-wrap relative z-10">
              <div class="grid md:grid-cols-2 gap-6">
                <article
                  v-for="item in regularNews"
                  :key="item.id"
                  class="service-card corner-accent p-8"
                >
                  <span class="font-mono text-xs uppercase tracking-wide text-primary mb-3 inline-block">
                    {{ categoryLabel(item.category) }}
                  </span>
                  <h3 class="mts-figma-card-title text-body mb-3">
                    <NuxtLink :to="localePath(`/news/${item.slug}`)" class="hover:text-primary transition-colors">
                      <ThemedContentString :content="item.title" />
                    </NuxtLink>
                  </h3>
                  <p class="font-body text-sm text-muted mb-4 line-clamp-3">
                    <ThemedContentString :content="item.excerpt" />
                  </p>
                  <div class="flex justify-between items-center">
                    <NuxtLink
                      :to="localePath(`/news/${item.slug}`)"
                      class="btn-primary px-4 py-2 text-[11px]"
                    >
                      {{ t('pages.common.readMore') }}
                      <MoveRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </NuxtLink>
                    <div class="flex items-center gap-4 text-xs text-muted">
                      <span class="flex items-center gap-1">
                        <Calendar class="w-3.5 h-3.5" />
                        {{ item.date }}
                      </span>
                      <span class="flex items-center gap-1">
                        <User class="w-3.5 h-3.5" />
                        <ThemedContentString :content="item.author" />
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </template>
      </template>

      <CommonCustomPageSectionsRender
        v-else-if="sid.startsWith('custom:') && sectionShown(sid)"
        :sections="(cms.customSections ?? []).filter((s) => `custom:${s.id}` === sid)"
        :page-crumb-items="crumbItems"
      />
    </template>

    <CommonPageInquiryForm
      v-if="cms.showInquiryForm"
      source-page="news"
      :hide-intro="cms.hideInquiryFormIntro === true"
      :hide-form-card-heading="cms.hideInquiryFormCardHeading === true"
      :config="cms.inquiryForm"
    />
  </div>
</template>
