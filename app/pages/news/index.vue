<script setup lang="ts">
import { Calendar, User, Loader2 } from 'lucide-vue-next'
import type { NewsItem } from '~/types'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import { newsCategoryLabel } from '~/utils/contentLabels'

useSiteSeoMeta('news')

const { t } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()

const crumbItems = computed(() =>
  breadcrumbs({ label: t('nav.news'), to: '/news' }),
)

const api = useMarineApi()
const news = ref<NewsItem[]>([])
const pending = ref(true)
const error = ref('')

async function load() {
  pending.value = true
  error.value = ''
  try {
    news.value = await api.news.getAll()
  } catch {
    error.value = t('pages.news.loadError')
  } finally {
    pending.value = false
  }
}

onMounted(load)

const featuredNews = computed(() => news.value.find((n) => n.featured) || news.value[0] || null)
const regularNews = computed(() => news.value.filter((n) => n.id !== featuredNews.value?.id))

function categoryLabel(cat: string | undefined) {
  return newsCategoryLabel(cat, t)
}
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative py-24 lg:py-32 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="crumbItems" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">{{ t('nav.news') }}</span>
          </div>
          <h1 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
            {{ t('pages.news.heroTitle') }}<span class="text-mts-accent">{{ t('pages.news.heroAccent') }}</span
            >{{ t('pages.news.heroEnd') }}
          </h1>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            {{ t('pages.news.heroLead') }}
          </p>
        </div>
      </div>
    </section>

    <div v-if="pending" class="flex justify-center py-24">
      <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
    </div>
    <div v-else-if="error" class="text-center py-24">
      <p class="font-body text-mts-text-secondary mb-4">{{ error }}</p>
      <button type="button" class="btn-primary" @click="load">{{ t('pages.common.tryAgain') }}</button>
    </div>
    <template v-else>
      <section v-if="featuredNews" class="relative py-16 overflow-hidden bg-white">
        <div class="absolute inset-0 grid-bg opacity-20" />
        <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div class="bg-mts-bg border border-mts-border p-8 lg:p-12">
            <div class="flex items-center gap-3 mb-6">
              <span class="font-mono text-[10px] uppercase tracking-wide text-mts-accent bg-mts-accent/10 px-3 py-1">
                {{ categoryLabel(featuredNews.category) }}
              </span>
              <span
                v-if="featuredNews.featured"
                class="font-mono text-[10px] uppercase tracking-wide text-white bg-mts-accent px-3 py-1"
              >
                {{ t('pages.common.featured') }}
              </span>
            </div>
            <h2 class="font-display text-2xl lg:text-3xl text-mts-text mb-4">{{ featuredNews.title }}</h2>
            <p class="font-body text-mts-text-secondary mb-6 max-w-2xl">{{ featuredNews.excerpt }}</p>
            <NuxtLink :to="localePath(`/news/${featuredNews.slug}`)" class="btn-primary mb-6 inline-flex">
              {{ t('pages.common.readFull') }}
            </NuxtLink>
            <div class="flex items-center gap-6 text-mts-text-secondary">
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                <span class="font-body text-sm">{{ featuredNews.date }}</span>
              </div>
              <div class="flex items-center gap-2">
                <User class="w-4 h-4" />
                <span class="font-body text-sm">{{ featuredNews.author }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="relative py-24 overflow-hidden">
        <div class="absolute inset-0 grid-bg opacity-30" />
        <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div class="grid md:grid-cols-2 gap-6">
            <article
              v-for="item in regularNews"
              :key="item.id"
              class="card-tech p-8 border border-mts-border hover:border-mts-accent/30"
            >
              <span class="font-mono text-[10px] uppercase tracking-wide text-mts-accent mb-3 inline-block">
                {{ categoryLabel(item.category) }}
              </span>
              <h3 class="font-display text-lg text-mts-text mb-3">
                <NuxtLink :to="localePath(`/news/${item.slug}`)" class="hover:text-mts-accent transition-colors">
                  {{ item.title }}
                </NuxtLink>
              </h3>
              <p class="font-body text-sm text-mts-text-secondary mb-4 line-clamp-3">{{ item.excerpt }}</p>
              <div class="flex justify-between items-center">
                <NuxtLink
                  :to="localePath(`/news/${item.slug}`)"
                  class="font-mono text-[10px] uppercase tracking-wide text-mts-accent hover:underline"
                >
                  {{ t('pages.common.readMore') }}
                </NuxtLink>
                <div class="flex items-center gap-4 text-xs text-mts-text-secondary">
                  <span class="flex items-center gap-1">
                    <Calendar class="w-3.5 h-3.5" />
                    {{ item.date }}
                  </span>
                  <span class="flex items-center gap-1">
                    <User class="w-3.5 h-3.5" />
                    {{ item.author }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
