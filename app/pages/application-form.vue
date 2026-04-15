<script setup lang="ts">
import ApplicationFormWizard from '~/components/vacancy-application/ApplicationFormWizard.vue'

const { t } = useI18n()

useSeoMeta({
  title: t('pages.vacancyForm.seoTitleOpen'),
  robots: 'noindex, nofollow',
})
</script>

<template>
  <ApplicationFormWizard variant="open" />
</template>
