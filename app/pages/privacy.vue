<script setup lang="ts">
import HeroBreadcrumbsRow from '~/components/common/HeroBreadcrumbsRow.vue'
import { contentBodyToSafeHtml } from '~/composables/useMarkdownSafeHtml'

useSiteSeoMeta('privacy')

const { t, locale } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const { data: page } = await useAsyncData(
  () => `privacy-page-${locale.value}`,
  async () => {
    try {
      return await api.contentPages.getPublicBySlug('privacy')
    } catch {
      return null
    }
  },
  { watch: [locale] },
)

const bodyHtml = computed(() => (page.value?.body ? contentBodyToSafeHtml(page.value.body) : ''))

const items = computed(() =>
  breadcrumbs({ label: page.value?.title || t('pages.legal.privacyBreadcrumb'), to: '/privacy' }),
)
</script>

<template>
  <div class="bg-white pt-24 pb-16">
    <div class="mts-content-wrap">
      <div class="max-w-7xl mx-auto">
      <div class="mts-figma-hero-stack">
        <HeroBreadcrumbsRow :items="items" />
        <h1 class="mts-figma-hero-h1 text-body">
          {{ page?.title || t('pages.legal.privacyTitle') }}
        </h1>
        <div v-if="bodyHtml" class="mts-markdown" v-html="bodyHtml" />
        <p v-else class="mts-figma-hero-lead text-muted">
          {{ t('pages.legal.privacyLead') }}
        </p>
      </div>
      </div>
    </div>
  </div>
</template>
