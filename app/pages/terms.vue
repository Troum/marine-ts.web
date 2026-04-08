<script setup lang="ts">
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'

useSiteSeoMeta('terms')

const { t } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()

const items = computed(() =>
  breadcrumbs({ label: t('pages.legal.termsTitle'), to: '/terms' }),
)
</script>

<template>
  <div class="bg-mts-bg pt-24 pb-16 px-6">
    <div class="max-w-3xl mx-auto">
      <Breadcrumbs :items="items" />
      <h1 class="font-display text-3xl text-mts-text mb-6">{{ t('pages.legal.termsTitle') }}</h1>
      <p class="font-body text-mts-text-secondary leading-relaxed">
        {{ t('pages.legal.termsLead') }}
      </p>
    </div>
  </div>
</template>
