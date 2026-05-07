<script setup lang="ts">
import HeroBreadcrumbsRow from '~/components/common/HeroBreadcrumbsRow.vue'

useSiteSeoMeta('request')

const { t } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()

const crumbItems = computed(() =>
  breadcrumbs({ label: t('pages.request.crumb'), to: '/request' }),
)
</script>

<template>
  <div class="bg-white pt-16">
    <section class="relative py-16 lg:py-20 overflow-hidden">
      <div class="mts-content-wrap relative z-10">
        <div class="max-w-7xl">
          <HeroBreadcrumbsRow :items="crumbItems" />
          <div class="mts-figma-hero-stack">
            <h1 class="mts-figma-hero-h1 text-body">
              {{ t('pages.request.title') }}<span class="text-primary">{{ t('pages.request.titleAccent') }}</span
              >{{ t('pages.request.titleEnd') }}
            </h1>
            <div class="h-0.5 w-12 shrink-0 self-start bg-primary" aria-hidden="true" />
            <p class="mts-figma-hero-lead text-muted">
              {{ t('pages.request.lead') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <CommonPageInquiryForm source-page="request" hide-intro />
  </div>
</template>
