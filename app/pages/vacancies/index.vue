<script setup lang="ts">
import { MapPin, Briefcase, Loader2 } from 'lucide-vue-next'
import type { VacancyItem } from '~/types'

useSiteSeoMeta('vacancies')

const api = useMarineApi()
const vacancies = ref<VacancyItem[]>([])
const pending = ref(true)
const error = ref('')

async function load() {
  pending.value = true
  error.value = ''
  try {
    vacancies.value = await api.vacancies.getAll()
  } catch {
    error.value = 'Не удалось загрузить вакансии'
  } finally {
    pending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative overflow-hidden py-24 lg:py-32">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div class="max-w-3xl">
          <Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Вакансии' }]" />
          <div class="mb-4 flex items-center gap-3">
            <div class="h-px w-6 bg-mts-accent" />
            <span class="section-label">Карьера</span>
          </div>
          <h1 class="font-display text-4xl leading-tight text-mts-text lg:text-5xl">
            Открытые <span class="text-mts-accent">вакансии</span>
          </h1>
          <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
          <p class="font-body text-lg leading-relaxed text-mts-text-secondary">
            Присоединяйтесь к команде Marine Technical Solutions. Мы предлагаем работу в судоремонте и сервисе морского
            флота.
          </p>
        </div>
      </div>
    </section>

    <div v-if="pending" class="flex justify-center py-24">
      <Loader2 class="h-8 w-8 animate-spin text-mts-accent" />
    </div>
    <div v-else-if="error" class="py-24 text-center">
      <p class="mb-4 font-body text-mts-text-secondary">{{ error }}</p>
      <button type="button" class="btn-primary" @click="load">Попробовать снова</button>
    </div>
    <section v-else class="relative overflow-hidden pb-24">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div v-if="vacancies.length === 0" class="py-16 text-center font-body text-mts-text-secondary">
          Сейчас нет открытых позиций. Загляните позже или отправьте резюме на
          <a href="mailto:info@marin-ts.com" class="text-mts-accent hover:underline">info@marin-ts.com</a>.
        </div>
        <div v-else class="grid gap-6 md:grid-cols-2">
          <article
            v-for="v in vacancies"
            :key="v.id"
            class="card-tech border border-mts-border p-8 transition-colors hover:border-mts-accent/30"
          >
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <Briefcase class="h-4 w-4 text-mts-accent" />
              <span v-if="v.employmentType" class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                {{ v.employmentType }}
              </span>
            </div>
            <h2 class="font-display text-xl text-mts-text">
              <NuxtLink :to="`/vacancies/${v.slug}`" class="hover:text-mts-accent transition-colors">
                {{ v.title }}
              </NuxtLink>
            </h2>
            <p class="mt-3 line-clamp-3 font-body text-sm text-mts-text-secondary">{{ v.excerpt }}</p>
            <div v-if="v.location" class="mt-4 flex items-center gap-2 font-body text-xs text-mts-text-secondary">
              <MapPin class="h-3.5 w-3.5 shrink-0" />
              {{ v.location }}
            </div>
            <NuxtLink
              :to="`/vacancies/${v.slug}`"
              class="mt-6 inline-block font-mono text-[10px] uppercase tracking-wide text-mts-accent hover:underline"
            >
              Подробнее
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
