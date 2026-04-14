<script setup lang="ts">
import { MapPin, Calendar, ArrowRight, Ship, Loader2 } from 'lucide-vue-next'
import type { Project, ProjectsPageData, MarineContentLocale } from '~/types'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import { projectTypeLabel } from '~/utils/contentLabels'
import { defaultListingData } from '~/utils/pageDefaults'

useSiteSeoMeta('projects')

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const { data: cmsPage } = await useAsyncData('projects-page-cms', async () => {
  try { return await api.contentPages.getPublicBySlug('projects-page') } catch { return null }
}, { server: true })

const cms = computed<ProjectsPageData>(() => {
  const body = cmsPage.value?.body
  if (body) { try { const p = JSON.parse(body); if (p?.hero) return p } catch { /* */ } }
  return defaultListingData('projects-page', loc.value) as ProjectsPageData
})

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.projects'), to: '/projects' }),
)

const filter = ref('all')
const projects = ref<Project[]>([])
const pending = ref(true)
const error = ref('')

const filterButtons = computed(() => {
  const byType = new Map<Project['type'], string>()
  for (const p of projects.value) {
    if (!byType.has(p.type)) {
      byType.set(p.type, projectTypeLabel(p.type, t))
    }
  }
  const loc = locale.value === 'en' ? 'en' : 'ru'
  const categories = [...byType.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], loc))
    .map(([id, label]) => ({ id, label }))
  return [{ id: 'all', label: t('pages.projects.filterAll') }, ...categories]
})

function typeLabelFor(p: Project) {
  return projectTypeLabel(p.type, t)
}

async function load() {
  pending.value = true
  error.value = ''
  try {
    projects.value = await api.projects.getAll()
  } catch {
    error.value = t('pages.projects.loadError')
  } finally {
    pending.value = false
  }
}

onMounted(load)

watch(projects, (list) => {
  if (filter.value === 'all') {
    return
  }
  if (!list.some((p) => p.type === filter.value)) {
    filter.value = 'all'
  }
})

const filteredProjects = computed(() => {
  if (filter.value === 'all') {
    return projects.value
  }
  return projects.value.filter((p) => p.type === filter.value)
})
</script>

<template>
  <div class="bg-mts-bg">
    <section class="relative pt-40 lg:pt-48 pb-16 lg:pb-20 overflow-hidden">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-[0.5]"
        :style="`background-image: url(${cms.heroImage || '/about-workshop.jpg'})`"
        aria-hidden="true"
      />
      <div class="absolute inset-0 bg-linear-to-r from-white/95 via-white/80 to-white/60" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="crumbItems" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ t('nav.projects') }}</span>
          </div>
          <h1 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
            {{ cms.hero.title }}<span class="text-mts-accent">{{ cms.hero.titleAccent }}</span
            >{{ cms.hero.titleEnd }}
          </h1>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            {{ cms.hero.lead }}
          </p>
        </div>
      </div>
    </section>

    <section class="relative py-6">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="f in filterButtons"
            :key="f.id"
            type="button"
            :class="[
              'px-4 py-2 font-mono text-[11px] uppercase tracking-wide transition-all',
              filter === f.id ? 'bg-mts-accent text-white' : 'bg-mts-bg text-mts-text-secondary hover:text-mts-accent border border-mts-border',
            ]"
            @click="filter = f.id"
          >
            {{ f.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
        </div>
        <div v-else-if="error" class="text-center py-12">
          <p class="font-body text-mts-text-secondary mb-4">{{ error }}</p>
          <button type="button" class="btn-primary" @click="load">{{ t('pages.common.tryAgain') }}</button>
        </div>
        <div v-else-if="filteredProjects.length === 0" class="text-center py-12">
          <p class="font-body text-mts-text-secondary">{{ t('pages.projects.emptyCategory') }}</p>
        </div>
        <div v-else class="grid md:grid-cols-2 gap-6">
          <article
            v-for="p in filteredProjects"
            :key="p.id"
            class="card-tech p-8 border border-mts-border hover:border-mts-accent/30"
          >
            <div class="flex items-center gap-2 mb-4">
              <Ship class="w-4 h-4 text-mts-accent" />
              <span class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">{{ typeLabelFor(p) }}</span>
            </div>
            <h2 class="font-display text-xl text-mts-text mb-3">{{ p.title }}</h2>
            <div class="flex flex-wrap gap-4 text-mts-text-secondary text-sm mb-4">
              <span class="flex items-center gap-1">
                <MapPin class="w-4 h-4" />
                {{ p.location }}
              </span>
              <span class="flex items-center gap-1">
                <Calendar class="w-4 h-4" />
                {{ p.date }}
              </span>
            </div>
            <p class="font-body text-sm text-mts-text-secondary mb-4">{{ p.description }}</p>
            <div class="flex flex-wrap gap-3">
              <span
                v-for="(val, key) in p.stats"
                :key="key"
                class="font-mono text-[9px] uppercase tracking-wide bg-mts-bg px-2 py-1 border border-mts-border"
              >
                {{ key }}{{ t('pages.projects.statsSep') }}{{ val }}
              </span>
            </div>
            <NuxtLink
              v-if="p.contentPage?.slug"
              :to="localePath(`/projects/${p.contentPage.slug}`)"
              class="mt-6 btn-primary px-4 py-2 text-[11px]"
            >
              {{ t('pages.common.readMore') }}
              <ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <section class="relative py-16 bg-white border-t border-mts-border">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h2 class="font-display text-2xl text-mts-text mb-4">{{ cms.cta?.title || t('pages.projects.ctaTitle') }}</h2>
        <NuxtLink :to="localePath('/contacts')" class="btn-primary group">
          {{ cms.cta?.buttonText || t('pages.projects.ctaButton') }}
          <ArrowRight class="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </NuxtLink>
      </div>
    </section>

    <CommonPageInquiryForm v-if="cms.showInquiryForm" source-page="projects" />
  </div>
</template>
