<script setup lang="ts">
import {
  ClipboardList,
  FileCheck,
  Globe2,
  ShieldCheck,
  Ship,
  UserCheck,
} from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ButtonLink from '~/components/common/ButtonLink.vue'

useSiteSeoMeta('crewing-management')

const { t } = useI18n()
const { breadcrumbs } = usePageBreadcrumbs()

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.crewing'), to: '/crewing-management' }),
)

const directions = computed(() => [
  {
    icon: UserCheck,
    title: t('pages.crewing.d1t'),
    text: t('pages.crewing.d1x'),
  },
  {
    icon: FileCheck,
    title: t('pages.crewing.d2t'),
    text: t('pages.crewing.d2x'),
  },
  {
    icon: ShieldCheck,
    title: t('pages.crewing.d3t'),
    text: t('pages.crewing.d3x'),
  },
  {
    icon: Globe2,
    title: t('pages.crewing.d4t'),
    text: t('pages.crewing.d4x'),
  },
  {
    icon: Ship,
    title: t('pages.crewing.d5t'),
    text: t('pages.crewing.d5x'),
  },
  {
    icon: ClipboardList,
    title: t('pages.crewing.d6t'),
    text: t('pages.crewing.d6x'),
  },
])

const principles = computed(() => [t('pages.crewing.p1'), t('pages.crewing.p2'), t('pages.crewing.p3')])
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative overflow-hidden py-24 lg:py-32">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="absolute top-0 left-1/3 h-full w-px bg-mts-border" />
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div class="max-w-3xl">
          <Breadcrumbs :items="crumbItems" />
          <div class="mb-4 flex items-center gap-3">
            <div class="h-px w-6 bg-mts-accent" />
            <span class="section-label">{{ t('nav.crewing') }}</span>
          </div>
          <h1 class="font-display mb-6 text-4xl leading-tight text-mts-text lg:text-5xl">
            {{ t('pages.crewing.heroTitle') }}<span class="text-mts-accent">{{ t('pages.crewing.heroAccent') }}</span
            >{{ t('pages.crewing.heroEnd') }}
          </h1>
          <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
          <p class="font-body text-lg leading-relaxed text-mts-text-secondary">
            {{ t('pages.crewing.heroLead') }}
          </p>
        </div>
      </div>
    </section>

    <section class="relative overflow-hidden bg-white py-24">
      <div class="absolute inset-0 grid-bg opacity-20" />
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <h2 class="font-display mb-4 text-center text-2xl text-mts-text md:text-3xl">{{ t('pages.crewing.directionsTitle') }}</h2>
        <p class="mx-auto mb-14 max-w-2xl text-center font-body text-mts-text-secondary">
          {{ t('pages.crewing.directionsLead') }}
        </p>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="item in directions"
            :key="item.title"
            class="card-tech border border-mts-border p-8 transition-colors hover:border-mts-accent/40"
          >
            <component :is="item.icon" class="mb-4 h-8 w-8 text-mts-accent" />
            <h3 class="font-display mb-3 text-xl text-mts-text">{{ item.title }}</h3>
            <p class="font-body text-sm leading-relaxed text-mts-text-secondary">{{ item.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="relative overflow-hidden py-24">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div class="grid items-start gap-16 lg:grid-cols-2">
          <div class="relative">
            <div class="absolute -left-2 -top-2 h-6 w-6 border-l-2 border-t-2 border-mts-accent" />
            <div class="absolute -bottom-2 -right-2 h-6 w-6 border-b-2 border-r-2 border-mts-accent" />
            <div class="border border-mts-border bg-mts-bg p-8 shadow-tech">
              <h2 class="font-display mb-6 text-2xl text-mts-text">{{ t('pages.crewing.principlesTitle') }}</h2>
              <ul class="space-y-4">
                <li v-for="(line, i) in principles" :key="i" class="flex gap-3 font-body text-mts-text-secondary">
                  <span class="mt-1.5 h-1.5 w-1.5 shrink-0 bg-mts-accent" />
                  {{ line }}
                </li>
              </ul>
            </div>
          </div>
          <div>
            <h2 class="font-display mb-6 text-2xl text-mts-text">{{ t('pages.crewing.audienceTitle') }}</h2>
            <p class="mb-6 font-body leading-relaxed text-mts-text-secondary">
              {{ t('pages.crewing.audience1') }}
            </p>
            <p class="mb-8 font-body leading-relaxed text-mts-text-secondary">
              {{ t('pages.crewing.audience2') }}
            </p>
            <ButtonLink :title="t('pages.crewing.ctaContact')" link="/contacts" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
