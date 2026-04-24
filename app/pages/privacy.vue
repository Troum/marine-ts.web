<script setup lang="ts">
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'

useSiteSeoMeta('privacy')

const { t } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()

const items = computed(() =>
  breadcrumbs({ label: t('pages.legal.privacyBreadcrumb'), to: '/privacy' }),
)
</script>

<template>
  <div class="bg-mts-bg pt-24 pb-16">
    <div class="mts-content-wrap">
      <div class="max-w-7xl mx-auto">
      <Breadcrumbs :items="items" />
      <h1 class="font-display text-2xl text-mts-text mb-6">{{ t('pages.legal.privacyTitle') }}</h1>
      <p class="font-body text-mts-text-secondary leading-relaxed">
        {{ t('pages.legal.privacyLead') }}
      </p>
      </div>
    </div>
  </div>
</template>
