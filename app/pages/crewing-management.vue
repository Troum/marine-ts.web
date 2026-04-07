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

const directions = [
  {
    icon: UserCheck,
    title: 'Подбор и смена экипажа',
    text: 'Поиск квалифицированных специалистов под требования судна и флага, планирование ротации и смены экипажа в согласованные сроки.',
  },
  {
    icon: FileCheck,
    title: 'Документооборот и соответствие',
    text: 'Оформление контрактов, сертификатов и записей в соответствии с требованиями STCW, кодексами MLC и регистрами судовладельца.',
  },
  {
    icon: ShieldCheck,
    title: 'Контроль квалификации',
    text: 'Проверка дипломов, допусков и медицинских заключений, напоминания о продлении документов и обучении.',
  },
  {
    icon: Globe2,
    title: 'Визы и логистика',
    text: 'Сопровождение при посадке и высадке экипажа: визовая поддержка, билеты, трансферы и взаимодействие с агентами в портах.',
  },
  {
    icon: Ship,
    title: 'Работа с судовладельцем',
    text: 'Единая точка контакта по кадровым вопросам: отчётность, согласование замен, взаимодействие с капитаном и береговым офисом.',
  },
  {
    icon: ClipboardList,
    title: 'Учёт и прозрачность',
    text: 'Структурированные данные по составу экипажа, срокам контрактов и затратам — для прогнозирования и аудита.',
  },
]

const principles = [
  'Соблюдение международных и национальных норм в области труда на море',
  'Конфиденциальность персональных данных моряков и судовладельца',
  'Оперативная коммуникация в нештатных ситуациях и при срочной смене экипажа',
]
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative overflow-hidden py-24 lg:py-32">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="absolute top-0 left-1/3 h-full w-px bg-mts-border" />
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div class="max-w-3xl">
          <Breadcrumbs
            :items="[{ label: 'Главная', to: '/' }, { label: 'Крюинг-менеджмент' }]"
          />
          <div class="mb-4 flex items-center gap-3">
            <div class="h-px w-6 bg-mts-accent" />
            <span class="section-label">Крюинг-менеджмент</span>
          </div>
          <h1 class="font-display mb-6 text-4xl leading-tight text-mts-text lg:text-5xl">
            Кадровые решения и <span class="text-mts-accent">сопровождение экипажа</span> для морского флота
          </h1>
          <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
          <p class="font-body text-lg leading-relaxed text-mts-text-secondary">
            Комплексный крюинг-менеджмент для судовладельцев: от подбора моряков до документооборота и логистики смены
            экипажа. Мы помогаем снизить риски и административную нагрузку, сохраняя фокус на безопасной эксплуатации
            судна.
          </p>
        </div>
      </div>
    </section>

    <section class="relative overflow-hidden bg-white py-24">
      <div class="absolute inset-0 grid-bg opacity-20" />
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <h2 class="font-display mb-4 text-center text-2xl text-mts-text md:text-3xl">Направления работы</h2>
        <p class="mx-auto mb-14 max-w-2xl text-center font-body text-mts-text-secondary">
          Единый подход к кадрам на море: от стратегии комплектования до операционного сопровождения в портах и офисе.
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
              <h2 class="font-display mb-6 text-2xl text-mts-text">Принципы</h2>
              <ul class="space-y-4">
                <li v-for="(line, i) in principles" :key="i" class="flex gap-3 font-body text-mts-text-secondary">
                  <span class="mt-1.5 h-1.5 w-1.5 shrink-0 bg-mts-accent" />
                  {{ line }}
                </li>
              </ul>
            </div>
          </div>
          <div>
            <h2 class="font-display mb-6 text-2xl text-mts-text">Кому подходит сервис</h2>
            <p class="mb-6 font-body leading-relaxed text-mts-text-secondary">
              Судовладельцам и операторам, которым нужен предсказуемый состав экипажа и прозрачные процессы без
              перегрузки внутренних HR- и флотских служб. Формат сотрудничества и перечень услуг согласуем под ваш флот и
              регион плавания.
            </p>
            <p class="mb-8 font-body leading-relaxed text-mts-text-secondary">
              Для уточнения задач и коммерческого предложения оставьте заявку — мы свяжемся и предложим оптимальную
              модель крюинг-менеджмента.
            </p>
            <ButtonLink title="Связаться с нами" link="/contacts" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
