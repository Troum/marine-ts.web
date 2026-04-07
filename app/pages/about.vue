<script setup lang="ts">
import { MapPin, Users, Award, Clock, Check, ArrowRight } from 'lucide-vue-next'
import ButtonLink from "~/components/common/ButtonLink.vue";
import Breadcrumbs from "~/components/common/Breadcrumbs.vue";
import ImageFadeCarousel from "~/components/common/ImageFadeCarousel.vue";
import { aboutCarouselSlides } from "~/utils/aboutCarouselSlides";

useSiteSeoMeta('about')

const advantages = [
  { icon: MapPin, text: 'Собственная инженерная база в Калининграде' },
  { icon: Users, text: 'Мобильные бригады для работы в любом порту' },
  { icon: Award, text: "Сертификация Lloyd's Register, Bureau Veritas, РМРС" },
  { icon: Clock, text: 'Работаем 24/7 в режиме экстренного реагирования' },
]

const certificates = [
  { name: 'ISO 9001:2015', desc: 'Система менеджмента качества' },
  { name: 'ISO 14001:2015', desc: 'Система экологического менеджмента' },
  { name: 'ISO 45001:2018', desc: 'Система менеджмента безопасности' },
]
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative py-24 lg:py-32 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="absolute top-0 left-1/3 w-px h-full bg-mts-border" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'О компании' }]" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">О компании</span>
          </div>
          <h1 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
            Marine Technical Solutions — <span class="text-mts-accent">надёжный партнёр</span> в судоремонте
          </h1>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            Компания основана в 2010 году в Калининграде. Сегодня мы имеем представительства в Объединённых Арабских
            Эмиратах и работаем с судовладельцами из 10+ стран мира.
          </p>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="grid lg:grid-cols-2 gap-16 items-start">
          <div class="relative">
            <div class="absolute -top-2 -left-2 z-20 w-6 h-6 border-t-2 border-l-2 border-mts-accent pointer-events-none" />
            <div class="absolute -bottom-2 -right-2 z-20 w-6 h-6 border-b-2 border-r-2 border-mts-accent pointer-events-none" />
            <ImageFadeCarousel :slides="aboutCarouselSlides" aria-label="Инженерная база: фотогалерея" />
            <div class="absolute -bottom-4 -right-4 z-30 bg-white border border-mts-border shadow-tech p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-mts-accent flex items-center justify-center">
                  <Check class="w-5 h-5 text-white" />
                </div>
                <div>
                  <p class="font-mono text-2xl font-medium text-mts-text">100%</p>
                  <p class="font-mono text-[9px] uppercase tracking-wide text-mts-text-secondary">Соответствие стандартам</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 class="font-display text-2xl text-mts-text mb-6">Наша миссия</h2>
            <p class="font-body text-mts-text-secondary leading-relaxed mb-6">
              Обеспечивать судовладельцам надёжный и оперативный ремонт в любой точке мира, снижая простои и повышая
              безопасность эксплуатации флота.
            </p>
            <ul class="space-y-4 mb-8">
              <li v-for="a in advantages" :key="a.text" class="flex items-start gap-3">
                <component :is="a.icon" class="w-5 h-5 text-mts-accent flex-shrink-0 mt-0.5" />
                <span class="font-body text-mts-text-secondary">{{ a.text }}</span>
              </li>
            </ul>
            <ButtonLink title="Связаться с нами" link="/contacts" />
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-24 bg-white overflow-hidden">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <h2 class="font-display text-2xl text-mts-text mb-8 text-center">Сертификаты</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="c in certificates" :key="c.name" class="card-tech p-6 text-center">
            <p class="font-mono text-sm text-mts-accent mb-2">{{ c.name }}</p>
            <p class="font-body text-sm text-mts-text-secondary">{{ c.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
