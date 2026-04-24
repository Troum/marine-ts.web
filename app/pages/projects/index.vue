<script setup lang="ts">
import { MapPin, Calendar, ArrowRight, Ship, Loader2 } from 'lucide-vue-next'
import type { Project, ProjectsPageData, MarineContentLocale } from '~/types'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ListingHeroShell from '~/components/common/ListingHeroShell.vue'
import { projectTypeLabel } from '~/utils/contentLabels'
import ThemeFormattedTitle from '~/components/common/ThemeFormattedTitle.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import { defaultListingData, listingDefaultOrder, mergeListingPageData } from '~/utils/pageDefaults'
import { isSectionVisible, resolveSectionOrder } from '~/utils/sectionVisibility'

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
  if (body) {
    try {
      const p = JSON.parse(body) as unknown
      if (p && typeof p === 'object' && 'hero' in (p as object)) {
        return mergeListingPageData('projects-page', loc.value, p) as ProjectsPageData
      }
    } catch {
      /* */
    }
  }
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

const sectionOrderEffective = computed(() =>
  resolveSectionOrder(cms.value.sectionOrder, listingDefaultOrder('projects-page'), cms.value.customSections),
)

function sectionShown(id: string): boolean {
  return isSectionVisible(cms.value.sectionVisibility, id)
}
</script>

<template>
  <div class="bg-mts-bg">
    <ListingHeroShell :hero-image="cms.heroImage">
      <div class="max-w-7xl">
        <Breadcrumbs :items="crumbItems" />
        <div class="mb-4 flex items-center gap-3">
          <div class="h-px w-6 bg-mts-accent" />
          <span class="section-label">{{ t('pages.projects.heroEyebrow') }}</span>
        </div>
        <h1 class="font-display mb-6 text-3xl leading-tight text-mts-text lg:text-4xl">
          <ThemeFormattedTitle :title="cms.hero.titleFormatted" />
        </h1>
        <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
        <p class="font-body text-lg leading-relaxed text-mts-text-secondary">
          <ThemedContentString :content="cms.hero.lead" />
        </p>
      </div>
    </ListingHeroShell>

    <template v-for="sid in sectionOrderEffective" :key="sid">
      <template v-if="sid === 'listing' && sectionShown('listing')">
        <section class="relative py-6">
          <div class="mts-content-wrap">
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

        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
        </div>
        <div v-else-if="error" class="py-24 text-center">
          <p class="mb-4 font-body text-mts-text-secondary">{{ error }}</p>
          <button type="button" class="btn-primary" @click="load">{{ t('pages.common.tryAgain') }}</button>
        </div>
        <section v-else class="relative bg-mts-bg pb-24 pt-8 lg:pt-12">
          <div class="relative z-10 mts-content-wrap">
            <div v-if="filteredProjects.length === 0" class="py-16 text-center font-body text-mts-text-secondary">
              {{ t('pages.projects.emptyCategory') }}
            </div>
            <div v-else class="grid grid-cols-1 gap-px bg-mts-border md:grid-cols-2">
              <article v-for="p in filteredProjects" :key="p.id" class="min-w-0 bg-mts-bg p-8">
                <div class="mb-3 flex flex-wrap items-center gap-2">
                  <Ship class="h-4 w-4 shrink-0 text-mts-accent" aria-hidden="true" />
                  <span class="section-label text-[10px]">{{ typeLabelFor(p) }}</span>
                </div>
                <h2 class="font-display text-lg leading-snug text-mts-text">
                  <NuxtLink
                    v-if="p.contentPage?.slug"
                    :to="localePath(`/projects/${p.contentPage.slug}`)"
                    class="text-mts-text"
                  >
                    <ThemedContentString :content="p.title" />
                  </NuxtLink>
                  <template v-else>
                    <ThemedContentString :content="p.title" />
                  </template>
                </h2>
                <p class="mt-3 line-clamp-3 font-body text-sm leading-relaxed text-mts-text-secondary">
                  <ThemedContentString :content="p.description" />
                </p>
                <div
                  v-if="p.location || p.date"
                  class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-body text-xs text-mts-text-secondary"
                >
                  <span v-if="p.location" class="flex items-center gap-2">
                    <MapPin class="h-3.5 w-3.5 shrink-0 text-mts-accent/80" aria-hidden="true" />
                    <ThemedContentString :content="p.location" />
                  </span>
                  <span v-if="p.date" class="flex items-center gap-2">
                    <Calendar class="h-3.5 w-3.5 shrink-0 text-mts-accent/80" aria-hidden="true" />
                    {{ p.date }}
                  </span>
                </div>
                <NuxtLink
                  v-if="p.contentPage?.slug"
                  :to="localePath(`/projects/${p.contentPage.slug}`)"
                  class="mts-cta-link-compact mt-6 inline-flex"
                >
                  {{ t('pages.common.readMore') }} →
                </NuxtLink>
              </article>
            </div>
          </div>
        </section>
      </template>

      <section
        v-else-if="sid === 'cta' && sectionShown('cta')"
        class="relative py-16 bg-mts-surface border-t border-mts-border"
      >
        <div class="max-w-7xl mx-auto px-6 text-center">
          <h2 class="font-display text-xl text-mts-text mb-4">
            <ThemedContentString :content="cms.cta?.title || t('pages.projects.ctaTitle')" />
          </h2>
          <NuxtLink :to="localePath('/request')" class="btn-primary group">
            <ThemedContentString :content="cms.cta?.buttonText || t('pages.projects.ctaButton')" />
            <ArrowRight class="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </NuxtLink>
        </div>
      </section>

      <CommonCustomPageSectionsRender
        v-else-if="sid.startsWith('custom:') && sectionShown(sid)"
        :sections="(cms.customSections ?? []).filter((s) => `custom:${s.id}` === sid)"
      />
    </template>

    <CommonPageInquiryForm v-if="cms.showInquiryForm" source-page="projects" />
  </div>
</template>
