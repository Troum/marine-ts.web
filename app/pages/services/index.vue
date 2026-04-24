<script setup lang="ts">
import { Check, Loader2 } from 'lucide-vue-next'
import ButtonLink from '~/components/common/ButtonLink.vue'
import type { ServiceItem, ListingPageData, MarineContentLocale } from '~/types'
import { resolveServiceIcon } from '~/utils/serviceIcons'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ListingHeroShell from '~/components/common/ListingHeroShell.vue'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { defaultListingData, listingDefaultOrder, mergeListingPageData } from '~/utils/pageDefaults'
import { isSectionVisible, resolveSectionOrder } from '~/utils/sectionVisibility'

useSiteSeoMeta('services')

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const { data: cmsPage } = await useAsyncData('services-page-cms', async () => {
  try { return await api.contentPages.getPublicBySlug('services-page') } catch { return null }
}, { server: true })

const cms = computed<ListingPageData>(() => {
  const body = cmsPage.value?.body
  if (body) {
    try {
      const p = JSON.parse(body) as unknown
      if (p && typeof p === 'object' && 'hero' in (p as object)) {
        return mergeListingPageData('services-page', loc.value, p)
      }
    } catch {
      /* */
    }
  }
  return defaultListingData('services-page', loc.value)
})

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.services'), to: '/services' }),
)

const { data: services, pending, error } = await useAsyncData(
  () => `marine-services-${locale.value}`,
  () => api.services.getAll(),
  { default: () => [] as ServiceItem[] },
)

const sectionOrderEffective = computed(() =>
  resolveSectionOrder(cms.value.sectionOrder, listingDefaultOrder('services-page'), cms.value.customSections),
)

function sectionShown(id: string): boolean {
  return isSectionVisible(cms.value.sectionVisibility, id)
}
</script>

<template>
  <div class="bg-mts-bg">
    <ListingHeroShell :hero-image="cms.heroImage">
      <div class="max-w-7xl">
        <Breadcrumbs :items="crumbItems" />
        <div class="mb-4 flex items-center gap-3">
          <div class="h-px w-6 bg-mts-accent" />
          <span class="section-label">{{ t('pages.services.heroEyebrow') }}</span>
        </div>
        <h1 class="font-display mb-6 text-3xl leading-tight text-mts-text lg:text-4xl">
          <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
        </h1>
        <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
        <p class="font-body text-lg leading-relaxed text-mts-text-secondary">
          <ThemedContentString :content="cms.hero.lead" />
        </p>
      </div>
    </ListingHeroShell>

    <template v-for="sid in sectionOrderEffective" :key="sid">
      <section
        v-if="sid === 'listing' && sectionShown('listing')"
        class="relative overflow-hidden bg-mts-bg py-20 lg:py-28"
      >
        <div class="relative z-10 mts-content-wrap">
          <div v-if="pending" class="flex justify-center py-24">
            <Loader2 class="w-10 h-10 animate-spin text-mts-accent" />
          </div>
          <p v-else-if="error" class="py-12 text-center font-body text-mts-text-secondary">
            {{ t('pages.services.loadError') }}
          </p>
          <div v-else class="grid grid-cols-1 gap-px bg-mts-border md:grid-cols-3">
            <article
              v-for="service in services"
              :key="service.id"
              class="min-w-0 overflow-hidden bg-mts-bg transition-colors duration-200 hover:bg-mts-surface"
            >
              <div v-if="service.imageUrl" class="aspect-[16/9] w-full overflow-hidden border-b border-mts-border bg-mts-bg">
                <img
                  :src="service.imageUrl"
                  :alt="service.title"
                  class="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div class="p-8">
                <component
                  v-if="!service.imageUrl"
                  :is="resolveServiceIcon(service.iconKey)"
                  class="mb-4 h-8 w-8 text-mts-accent"
                />
                <h3 class="font-display text-lg leading-snug text-mts-text">
                  <NuxtLink
                    v-if="service.contentPage?.slug"
                    :to="localePath(`/services/${service.contentPage.slug}`)"
                    class="hover:text-mts-accent"
                  >
                    <ThemedContentString :content="service.title" />
                  </NuxtLink>
                  <template v-else><ThemedContentString :content="service.title" /></template>
                </h3>
                <p class="mt-3 font-body text-sm leading-relaxed text-mts-text-secondary">
                  <ThemedContentString :content="service.description" />
                </p>
                <ul v-if="service.features?.length" class="mt-4 space-y-2">
                  <li
                    v-for="f in service.features"
                    :key="f"
                    class="flex items-start gap-2 font-mono text-[10px] leading-relaxed text-mts-text-secondary"
                  >
                    <Check class="mt-0.5 h-3 w-3 shrink-0 text-mts-accent" />
                    {{ f }}
                  </li>
                </ul>
                <NuxtLink
                  v-if="service.contentPage?.slug"
                  :to="localePath(`/services/${service.contentPage.slug}`)"
                  class="mts-cta-link-compact mt-6 inline-flex"
                >
                  {{ t('pages.common.readMore') }} →
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        v-else-if="sid === 'cta' && sectionShown('cta')"
        class="relative bg-mts-bg pb-16"
      >
        <div class="mts-content-wrap flex justify-center items-center">
          <ButtonLink :title="cms.cta?.buttonText || t('pages.services.ctaConsult')" link="/contacts" />
        </div>
      </section>

      <CommonCustomPageSectionsRender
        v-else-if="sid.startsWith('custom:') && sectionShown(sid)"
        :sections="(cms.customSections ?? []).filter((s) => `custom:${s.id}` === sid)"
      />
    </template>

    <CommonPageInquiryForm v-if="cms.showInquiryForm" source-page="services" />
  </div>
</template>
