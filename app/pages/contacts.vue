<script setup lang="ts">
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'

useSiteSeoMeta('contacts')

const api = useMarineApi()

const form = ref({
  name: '',
  email: '',
  phone: '',
  message: '',
})

const sending = ref(false)
const formError = ref<string | null>(null)
const formSuccess = ref(false)

async function submitFeedback() {
  formError.value = null
  formSuccess.value = false
  sending.value = true
  try {
    await api.feedback.submit({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim() || null,
      message: form.value.message.trim(),
    })
    formSuccess.value = true
    form.value = { name: '', email: '', phone: '', message: '' }
  } catch {
    formError.value = 'Не удалось отправить сообщение. Попробуйте позже или свяжитесь с нами по телефону или email.'
  } finally {
    sending.value = false
  }
}

const contacts = [
  { icon: Phone, label: 'Телефон', value: '8 (4012) 35-52-90', href: 'tel:84012355290' },
  { icon: Mail, label: 'Email', value: 'info@marin-ts.com', href: 'mailto:info@marin-ts.com' },
  { icon: MapPin, label: 'Адрес', value: 'г. Калининград, Россия', href: null as string | null },
  { icon: Clock, label: 'Режим работы', value: 'Пн-Пт: 9:00 - 18:00', href: null as string | null },
]

const offices = [
  {
    city: 'Калининград',
    country: 'Россия',
    address: 'ул. Портовая, 15, офис 302',
    phone: '8 (4012) 35-52-90',
    email: 'info@marin-ts.com',
  },
  {
    city: 'Дубай',
    country: 'ОАЭ',
    address: 'Dubai Maritime City, Building 45',
    phone: '+971 4 123 4567',
    email: 'dubai@marin-ts.com',
  },
  {
    city: 'Роттердам',
    country: 'Нидерланды',
    address: 'Wilhelminakade 123, 3072 AP',
    phone: '+31 10 123 4567',
    email: 'rotterdam@marin-ts.com',
  },
]
</script>

<template>
  <div class="bg-mts-bg pt-16">
    <section class="relative py-24 lg:py-32 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="max-w-3xl">
          <Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Контакты' }]" />
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-px bg-mts-accent" />
            <span class="section-label">Контакты</span>
          </div>
          <h1 class="font-display text-4xl lg:text-5xl text-mts-text leading-tight mb-6">
            Свяжитесь <span class="text-mts-accent">с нами</span>
          </h1>
          <div class="w-12 h-0.5 bg-mts-accent mb-6" />
          <p class="font-body text-lg text-mts-text-secondary leading-relaxed">
            Свяжитесь с нашим техническим отделом. Мы ответим в течение 2 часов и подготовим коммерческое предложение под
            ваши задачи.
          </p>
        </div>
      </div>
    </section>

    <section class="relative py-24 overflow-hidden">
      <div class="absolute inset-0 grid-bg opacity-30" />
      <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div class="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 class="font-display text-2xl text-mts-text mb-8">Контактная информация</h2>
            <div class="space-y-4 mb-12">
              <component
                :is="item.href ? 'a' : 'div'"
                v-for="item in contacts"
                :key="item.label"
                :href="item.href || undefined"
                class="flex items-center gap-4 p-4 bg-white border border-mts-border hover:border-mts-accent/30 transition-all"
                :class="item.href ? '' : 'cursor-default'"
              >
                <div class="w-10 h-10 bg-mts-bg border border-mts-border flex items-center justify-center">
                  <component :is="item.icon" class="w-4 h-4 text-mts-accent" />
                </div>
                <div>
                  <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">{{ item.label }}</p>
                  <p class="font-body text-sm text-mts-text">{{ item.value }}</p>
                </div>
              </component>
            </div>
          </div>
          <div class="card-tech border border-mts-border p-8">
            <h3 class="font-display mb-4 flex items-center gap-2 text-lg text-mts-text">
              <Send class="h-5 w-5 text-mts-accent" />
              Обратная связь
            </h3>
            <p class="mb-6 font-body text-sm text-mts-text-secondary">
              Заполните форму — мы ответим на email в течение рабочего дня. Для срочных вопросов звоните по телефону.
            </p>
            <form class="space-y-4" @submit.prevent="submitFeedback">
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Имя *</label
                >
                <input
                  v-model="form.name"
                  required
                  type="text"
                  autocomplete="name"
                  class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Email *</label
                >
                <input
                  v-model="form.email"
                  required
                  type="email"
                  autocomplete="email"
                  class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Телефон</label
                >
                <input
                  v-model="form.phone"
                  type="tel"
                  autocomplete="tel"
                  class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                  >Сообщение *</label
                >
                <textarea
                  v-model="form.message"
                  required
                  rows="5"
                  class="w-full border border-mts-border bg-mts-bg px-4 py-3 font-body text-sm focus:border-mts-accent focus:outline-none"
                  placeholder="Опишите задачу или вопрос"
                />
              </div>
              <p v-if="formError" class="font-body text-sm text-red-600">{{ formError }}</p>
              <p v-if="formSuccess" class="font-body text-sm text-green-700">
                Сообщение отправлено. Спасибо за обращение.
              </p>
              <button
                type="submit"
                :disabled="sending"
                class="btn-primary inline-flex w-full justify-center sm:w-auto sm:min-w-[200px]"
              >
                <Loader2 v-if="sending" class="h-4 w-4 animate-spin" />
                <span v-if="sending">Отправка…</span>
                <span v-else>Отправить</span>
              </button>
            </form>
          </div>
        </div>

        <div class="mt-16">
          <h2 class="font-display text-2xl text-mts-text mb-8">Офисы</h2>
          <div class="grid md:grid-cols-3 gap-6">
            <div v-for="o in offices" :key="o.city" class="card-tech p-6 border border-mts-border">
              <p class="font-mono text-xs text-mts-accent mb-1">{{ o.country }}</p>
              <h3 class="font-display text-lg text-mts-text mb-2">{{ o.city }}</h3>
              <p class="font-body text-sm text-mts-text-secondary mb-4">{{ o.address }}</p>
              <p class="font-body text-sm">{{ o.phone }}</p>
              <p class="font-mono text-xs text-mts-accent mt-2">{{ o.email }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
