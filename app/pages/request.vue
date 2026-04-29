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
  <div class="bg-white pt-16">
    <section class="relative py-16 lg:py-20 overflow-hidden">
      <div class="mts-content-wrap relative z-10">
        <div class="max-w-7xl">
          <Breadcrumbs :items="crumbItems" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-primary" />
            <span class="section-label">{{ t('pages.request.heroEyebrow') }}</span>
          </div>
          <h1 class="font-display text-3xl lg:text-4xl text-body leading-tight mb-6">
            {{ t('pages.request.title') }}<span class="text-primary">{{ t('pages.request.titleAccent') }}</span
            >{{ t('pages.request.titleEnd') }}
          </h1>
          <div class="w-12 h-0.5 bg-primary mb-6" />
          <p class="font-body text-lg text-muted leading-relaxed">
            {{ t('pages.request.lead') }}
          </p>
        </div>
      </div>
    </section>

    <CommonPageInquiryForm source-page="request" hide-intro />
  </div>
</template>
