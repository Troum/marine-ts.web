<script setup lang="ts">
import HeroBreadcrumbsRow from '~/components/common/HeroBreadcrumbsRow.vue'

useSiteSeoMeta('terms')

const { t } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()

const items = computed(() =>
  breadcrumbs({ label: t('pages.legal.termsBreadcrumb'), to: '/terms' }),
)
</script>

<template>
  <div class="bg-white pt-24 pb-16">
    <div class="mts-content-wrap">
      <div class="max-w-7xl mx-auto">
      <div class="mts-figma-hero-stack">
        <HeroBreadcrumbsRow :items="items" />
        <h1 class="mts-figma-hero-h1 text-body">{{ t('pages.legal.termsTitle') }}</h1>
        <p class="mts-figma-hero-lead text-muted">
          {{ t('pages.legal.termsLead') }}
        </p>
      </div>
      </div>
    </div>
  </div>
</template>
