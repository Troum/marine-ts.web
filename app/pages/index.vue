<script setup lang="ts">
import { ArrowRight, ChevronDown, Ship, MapPin, Users, Calendar } from 'lucide-vue-next'
import ButtonLink from "~/components/common/ButtonLink.vue";
import ImageFadeCarousel from "~/components/common/ImageFadeCarousel.vue";
import { aboutCarouselSlides } from "~/utils/aboutCarouselSlides";

useSiteSeoMeta('home')

const isVisible = ref(false)

onMounted(() => {
  isVisible.value = true
})

function scrollToAbout() {
  document.querySelector('#about-section')?.scrollIntoView({ behavior: 'smooth' })
}

const stats = [
  { value: '150+', label: 'Судов отремонтировано', icon: Ship },
  { value: '15', label: 'Портов присутствия', icon: MapPin },
  { value: '50+', label: 'Сертифицированных инженеров', icon: Users },
  { value: '14', label: 'Лет на рынке', icon: Calendar },
]

const services = [
  {
    title: 'Ремонт корпусов',
    description: 'Ультразвуковая дефектоскопия, сварка корпусных конструкций',
    image: '/images/services/hull.jpg',
  },
  {
    title: 'Ремонт двигателей',
    description: 'Капитальный ремонт главных и вспомогательных двигателей',
    image: '/images/services/general.jpg',
  },
  {
    title: 'Электротехнические работы',
    description: 'Ремонт генераторов, электродвигателей, трансформаторов',
    image: '/images/services/electro.jpg',
  },
]

const processSteps = [
  {
    title: 'Заявка и оценка',
    text: 'Принимаем обращение, согласуем объём работ и сроки выезда специалистов.',
    badge: '/images/steps/1.svg',
  },
  {
    title: 'Диагностика и ремонт',
    text: 'Проводим обследование, выполняем ремонт по классу и стандартам IACS.',
    badge: '/images/steps/2.svg',
  },
  {
    title: 'Сдача и гарантия',
    text: 'Оформляем документацию, передаём объект и сопровождаем по гарантии.',
    badge: '/images/steps/3.svg',
  },
]
</script>

<template>
  <div class="bg-mts-bg">
    <section class="relative min-h-screen flex items-center overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-50" />
      <div class="absolute top-0 left-1/4 w-px h-full bg-linear-to-b from-transparent via-mts-border to-transparent" />
      <div class="absolute top-0 right-1/4 w-px h-full bg-linear-to-b from-transparent via-mts-border to-transparent" />

      <div class="absolute inset-0">
        <div
          :class="[
            'absolute inset-0 bg-cover bg-center transition-all duration-1000',
            isVisible ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          ]"
          style="background-image: url(/hero-bg.jpg)"
        />
        <div class="absolute inset-0 bg-linear-to-r from-mts-bg via-mts-bg/95 to-mts-bg/80" />
        <div class="absolute inset-0 bg-linear-to-t from-mts-bg via-transparent to-mts-bg/60" />
      </div>

      <div class="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-20">
        <div class="grid lg:grid-cols-5 gap-12 items-start">
          <div class="lg:col-span-3 max-w-2xl">
            <div
              :class="[
                'flex items-center gap-3 mb-6 transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <div class="w-8 h-px bg-mts-accent" />
              <span class="section-label">Судоремонтные услуги</span>
            </div>

            <h1
              :class="[
                'font-display text-4xl sm:text-5xl lg:text-6xl text-mts-text leading-[1.1] mb-6 transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              Техническое обслуживание
              <br />
              <span class="text-mts-accent">судов</span> по всему миру
            </h1>

            <p
              :class="[
                'font-body text-base text-mts-text-secondary max-w-lg mb-8 leading-relaxed transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              Сертифицированный ремонт корпусов, двигателей и электрооборудования. Работаем в 15+ портах мира. Гарантия
              качества и соблюдение сроков.
            </p>

            <div
              :class="[
                'flex flex-wrap gap-4 mb-10 transform transition-all duration-600 items-center',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <ButtonLink title="Получить консультацию" link="/contacts" :asButton="true"/>
              <NuxtLink to="/services" class="btn-secondary">Наши услуги</NuxtLink>
            </div>

            <div
              :class="[
                'flex items-center gap-8 transform transition-all duration-600',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              ]"
            >
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">ISO</span>
                  <span class="font-mono text-[10px] text-mts-text-secondary ml-1">9001:2015</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">IACS</span>
                  <span class="font-mono text-[10px] text-mts-text-secondary ml-1">Member</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-mts-accent" />
                <div>
                  <span class="font-mono text-sm font-medium text-mts-text">14+</span>
                  <span class="font-mono text-[10px] text-mts-text-secondary ml-1">Years exp.</span>
                </div>
              </div>
            </div>
          </div>

          <div
            :class="[
              'lg:col-span-2 transform transition-all duration-700',
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
            ]"
          >
            <div class="card-tech corner-accent p-6">
              <div class="flex items-center gap-2 mb-6">
                <div class="w-2 h-2 bg-mts-accent animate-pulse" />
                <span class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  Статистика 2024
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div v-for="stat in stats" :key="stat.label" class="p-4 bg-mts-bg border border-mts-border">
                  <component :is="stat.icon" class="w-5 h-5 text-mts-accent mb-2" />
                  <p class="font-mono text-2xl font-medium text-mts-accent mb-1">{{ stat.value }}</p>
                  <p class="font-mono text-[9px] uppercase tracking-wide text-mts-text-secondary">{{ stat.label }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          :class="[
            'absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-mts-text-secondary hover:text-mts-accent transition-all duration-300 transform',
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          ]"
          @click="scrollToAbout"
        >
          <span class="font-mono text-[10px] uppercase tracking-wide">Листайте</span>
          <ChevronDown class="block w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>

    <section id="about-section" class="relative py-24 lg:py-32 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="absolute top-0 left-1/3 w-px h-full bg-mts-border" />

      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-mts-accent" />
              <span class="section-label">О компании</span>
            </div>
            <h2 class="font-display text-3xl lg:text-4xl text-mts-text leading-tight mb-6">
              Marine Technical Solutions —
              <span class="text-mts-accent">надёжный партнёр</span> в судоремонте
            </h2>
            <div class="w-12 h-0.5 bg-mts-accent mb-6" />
            <p class="font-body text-mts-text-secondary leading-relaxed mb-6">
              Мы предоставляем полный спектр услуг по техническому обслуживанию и ремонту морских судов. Наши
              сертифицированные специалисты работают в соответствии с международными стандартами ISO.
            </p>
            <ButtonLink title="Подробнее о компании" link="/about" />
          </div>
          <div class="relative">
            <div class="absolute -top-2 -left-2 z-20 w-6 h-6 border-t-2 border-l-2 border-mts-accent pointer-events-none" />
            <div class="absolute -bottom-2 -right-2 z-20 w-6 h-6 border-b-2 border-r-2 border-mts-accent pointer-events-none" />
            <ImageFadeCarousel :slides="aboutCarouselSlides" />
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-24 lg:py-32 overflow-hidden bg-white">
      <div class="absolute inset-0 grid-bg opacity-20" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="flex items-start justify-between mb-12">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-px bg-mts-accent" />
              <span class="section-label">Услуги</span>
            </div>
            <h2 class="font-display text-3xl lg:text-4xl text-mts-text">
              Полный спектр <span class="text-mts-accent">судоремонтных</span> услуг
            </h2>
          </div>
          <ButtonLink title="Все услуги" link="/services" extra-class="hidden lg:inline-flex" />
        </div>

        <div class="grid md:grid-cols-3 gap-px bg-mts-border">
          <div
            v-for="service in services"
            :key="service.title"
            class="bg-white overflow-hidden hover:bg-mts-bg transition-colors group"
          >
            <div class="aspect-[16/10] overflow-hidden border-b border-mts-border">
              <img
                :src="service.image"
                :alt="service.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="p-8">
              <h3 class="font-display text-lg text-mts-text mb-3 group-hover:text-mts-accent transition-colors">
                {{ service.title }}
              </h3>
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                {{ service.description }}
              </p>
              <NuxtLink
                to="/services"
                class="font-mono text-[10px] uppercase tracking-wide text-mts-accent opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Подробнее →
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="mt-8 lg:hidden">
          <ButtonLink title="Все услуги" link="/services" extra-class="w-full justify-center" />
        </div>
      </div>
    </section>

    <section class="relative py-20 lg:py-28 overflow-hidden border-t border-mts-border bg-white">
      <div class="absolute inset-0 grid-bg opacity-15" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">Процесс</span>
            <div class="w-6 h-px bg-mts-accent" />
          </div>
          <h2 class="font-display text-3xl lg:text-4xl text-mts-text">
            Три шага к <span class="text-mts-accent">надёжному ремонту</span>
          </h2>
        </div>
        <div class="grid md:grid-cols-3 gap-10 lg:gap-12">
          <div
            v-for="step in processSteps"
            :key="step.title"
            class="flex flex-col items-center text-center max-w-sm mx-auto md:max-w-none"
          >
            <div class="mb-4 flex justify-center">
              <img :src="step.badge" alt="" class="h-16 w-16 shrink-0" width="100" height="100" />
            </div>
            <h3 class="font-display text-lg text-mts-text mb-2">{{ step.title }}</h3>
            <p class="font-body text-sm text-mts-text-secondary leading-relaxed">{{ step.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden bg-mts-bg">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="absolute top-0 left-1/3 w-px h-full bg-mts-border" />
      <div class="absolute top-0 right-1/3 w-px h-full bg-mts-border" />

      <div class="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 text-center">
        <div class="flex items-center justify-center gap-3 mb-4">
          <div class="w-6 h-px bg-mts-accent" />
          <span class="section-label">Свяжитесь с нами</span>
          <div class="w-6 h-px bg-mts-accent" />
        </div>
        <h2 class="font-display text-3xl lg:text-4xl text-mts-text mb-6">
          Нужен <span class="text-mts-accent">срочный ремонт?</span>
        </h2>
        <p class="font-body text-mts-text-secondary mb-8 max-w-xl mx-auto">
          Свяжитесь с нашим техническим отделом. Мы ответим в течение 2 часов и подготовим коммерческое предложение.
        </p>
        <div class="flex justify-center items-center">
          <ButtonLink title="Получить консультацию" link="/contacts"/>
        </div>
      </div>
    </section>
  </div>
</template>
