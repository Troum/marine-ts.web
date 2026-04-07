<script setup lang="ts">
import { MapPin, Calendar, ArrowRight, Ship, Loader2 } from 'lucide-vue-next'
import type { Project } from '~/types'
import Breadcrumbs from "~/components/common/Breadcrumbs.vue";

useSiteSeoMeta('projects')

const api = useMarineApi()
const filter = ref('all')
const projects = ref<Project[]>([])
const pending = ref(true)
const error = ref('')

const filters = [
  { id: 'all', label: 'Все проекты' },
  { id: 'hull', label: 'Ремонт корпусов' },
  { id: 'engine', label: 'Ремонт двигателей' },
  { id: 'electrical', label: 'Электрика' },
]

async function load() {
  pending.value = true
  error.value = ''
  try {
    projects.value = await api.projects.getAll()
  } catch {
    error.value = 'Не удалось загрузить проекты'
  } finally {
    pending.value = false
  }
}

onMounted(load)

const filteredProjects = computed(() => {
  if (filter.value === 'all') {
    return projects.value
  }
  return projects.value.filter((p) => p.type === filter.value)
})
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative py-24 lg:py-32 overflow-hidden">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-[0.22]"
        style="background-image: url(/images/ship-teaser.jpg)"
        aria-hidden="true"
      />
      <div class="absolute inset-0 bg-linear-to-r from-white via-white/95 to-white/85" />
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Проекты' }]" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">Проекты</span>
          </div>
          <h1 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
            Наши <span class="text-mts-accent">выполненные</span> проекты
          </h1>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            Портфолио выполненных работ по ремонту и техническому обслуживанию морских судов в портах по всему миру.
          </p>
        </div>
      </div>
    </section>

    <section class="relative py-8 border-b border-mts-border bg-white">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="f in filters"
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
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div v-if="pending" class="flex justify-center py-24">
          <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
        </div>
        <div v-else-if="error" class="text-center py-12">
          <p class="font-body text-mts-text-secondary mb-4">{{ error }}</p>
          <button type="button" class="btn-primary" @click="load">Попробовать снова</button>
        </div>
        <div v-else-if="filteredProjects.length === 0" class="text-center py-12">
          <p class="font-body text-mts-text-secondary">Проектов в этой категории пока нет</p>
        </div>
        <div v-else class="grid md:grid-cols-2 gap-6">
          <article
            v-for="p in filteredProjects"
            :key="p.id"
            class="card-tech p-8 border border-mts-border hover:border-mts-accent/30"
          >
            <div class="flex items-center gap-2 mb-4">
              <Ship class="w-4 h-4 text-mts-accent" />
              <span class="font-mono text-[10px] uppercase tracking-wide text-mts-accent">{{ p.typeLabel }}</span>
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
                {{ key }}: {{ val }}
              </span>
            </div>
            <NuxtLink
              v-if="p.contentPage?.slug"
              :to="`/projects/${p.contentPage.slug}`"
              class="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase text-mts-accent hover:underline"
            >
              Подробнее
              <ArrowRight class="h-4 w-4" />
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <section class="relative py-16 bg-white border-t border-mts-border">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h2 class="font-display text-2xl text-mts-text mb-4">Нужен расчёт по вашему судну?</h2>
        <NuxtLink to="/contacts" class="btn-primary group">
          Оставить заявку
          <ArrowRight class="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
