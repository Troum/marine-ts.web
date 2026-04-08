<script setup lang="ts">
import { ArrowRight, Check, Loader2 } from 'lucide-vue-next'
import ButtonLink from '~/components/common/ButtonLink.vue'
import type { ContentPageSummary, ServiceItem } from '~/types'
import { resolveServiceIcon } from '~/utils/serviceIcons'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'

useSiteSeoMeta('services')

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.services'), to: '/services' }),
)

const api = useMarineApi()

const { data: services, pending, error } = await useAsyncData(
  () => `marine-services-${locale.value}`,
  () => api.services.getAll(),
  {
    default: () => [] as ServiceItem[],
  },
)

const { data: contentLinks, pending: contentLinksPending } = await useAsyncData(
  () => `marine-services-content-pages-${locale.value}`,
  async () => {
    try {
      return await api.contentPages.getPublicList()
    } catch {
      return [] as ContentPageSummary[]
    }
  },
  { default: () => [] as ContentPageSummary[] },
)
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative py-24 lg:py-32 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="absolute top-0 left-1/4 w-px h-full bg-mts-border" />
      <div class="absolute top-0 right-1/4 w-px h-full bg-mts-border" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="crumbItems" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ t('nav.services') }}</span>
          </div>
          <h1 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
            {{ t('pages.services.heroTitle') }}<span class="text-mts-accent">{{ t('pages.services.heroAccent') }}</span
            >{{ t('pages.services.heroEnd') }}
          </h1>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            {{ t('pages.services.heroLead') }}
          </p>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden bg-white">
      <div class="absolute inset-0 grid-bg opacity-20" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="w-10 h-10 text-mts-accent animate-spin" />
        </div>
        <p v-else-if="error" class="text-center font-body text-mts-text-secondary py-12">
          {{ t('pages.services.loadError') }}
        </p>
        <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="service in services"
            :key="service.id"
            class="card-tech p-8 border border-mts-border hover:border-mts-accent/40 transition-colors"
          >
            <component :is="resolveServiceIcon(service.iconKey)" class="w-8 h-8 text-mts-accent mb-4" />
            <h3 class="font-display text-xl text-mts-text mb-3">{{ service.title }}</h3>
            <p class="font-body text-sm text-mts-text-secondary mb-6">{{ service.description }}</p>
            <ul class="space-y-2 mb-6">
              <li
                v-for="f in service.features"
                :key="f"
                class="flex items-center gap-2 font-mono text-[10px] text-mts-text-secondary"
              >
                <Check class="w-3 h-3 text-mts-accent shrink-0" />
                {{ f }}
              </li>
            </ul>
            <NuxtLink
              v-if="service.contentPage?.slug"
              :to="localePath(`/services/${service.contentPage.slug}`)"
              class="inline-flex items-center gap-2 font-mono text-xs uppercase text-mts-accent hover:underline"
            >
              {{ t('pages.common.readMore') }}
              <ArrowRight class="h-4 w-4" />
            </NuxtLink>
          </div>
        </div>
        <div class="flex justify-center items-center mt-16">
          <ButtonLink :title="t('pages.services.ctaConsult')" link="/contacts" />
        </div>

        <div v-if="contentLinksPending" class="flex justify-center mt-20">
          <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
        </div>
        <section v-else-if="contentLinks.length > 0" class="mt-20 pt-16 border-t border-mts-border">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ t('pages.services.materialsLabel') }}</span>
          </div>
          <h2 class="font-display text-2xl text-mts-text mb-6">{{ t('pages.services.moreAbout') }}</h2>
          <ul class="space-y-3">
            <li v-for="p in contentLinks" :key="p.id">
              <NuxtLink
                :to="localePath(`/services/${p.slug}`)"
                class="group flex items-center justify-between gap-4 rounded border border-mts-border bg-mts-bg px-5 py-4 transition-colors hover:border-mts-accent/40"
              >
                <span class="font-body text-mts-text group-hover:text-mts-accent transition-colors">{{ p.title }}</span>
                <ArrowRight class="w-5 h-5 shrink-0 text-mts-accent opacity-70 group-hover:opacity-100" />
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </section>
  </div>
</template>
