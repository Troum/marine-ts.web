<script setup lang="ts">
import ApplicationFormWizard from '~/components/vacancy-application/ApplicationFormWizard.vue'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const api = useMarineApi()
const { t, locale } = useI18n()

const { data: vacancy, pending } = await useAsyncData(
  () => `vacancy-application-form-${locale.value}-${slug.value}`,
  async () => {
    try {
      return await api.vacancies.getBySlug(slug.value)
    } catch {
      return null
    }
  },
  { watch: [slug, locale] },
)

const vacancyMissing = computed(() => !pending.value && !vacancy.value)

usePublicSeoMeta(computed(() => ({
  title: t('pages.vacancyForm.seoTitle'),
  robots: 'noindex, nofollow',
})))
</script>

<template>
  <ApplicationFormWizard
    variant="vacancy"
    :pending="pending"
    :vacancy-missing="vacancyMissing"
    :vacancy-slug="slug"
    :vacancy-title="vacancy?.title ?? ''"
  />
</template>
