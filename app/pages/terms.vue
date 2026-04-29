<script setup lang="ts">
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'

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
      <Breadcrumbs :items="items" />
      <h1 class="font-display text-2xl text-body mb-6">{{ t('pages.legal.termsTitle') }}</h1>
      <p class="font-body text-muted leading-relaxed">
        {{ t('pages.legal.termsLead') }}
      </p>
      </div>
    </div>
  </div>
</template>
