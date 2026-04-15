<script setup lang="ts">
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'

useSiteSeoMeta('request')

const { t } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()

const crumbItems = computed(() =>
  breadcrumbs({ label: t('pages.request.crumb'), to: '/request' }),
)
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative py-16 lg:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="crumbItems" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ t('pages.request.heroEyebrow') }}</span>
          </div>
          <h1 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
            {{ t('pages.request.title') }}<span class="text-mts-accent">{{ t('pages.request.titleAccent') }}</span
            >{{ t('pages.request.titleEnd') }}
          </h1>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            {{ t('pages.request.lead') }}
          </p>
        </div>
      </div>
    </section>

    <CommonPageInquiryForm source-page="request" hide-intro />
  </div>
</template>
