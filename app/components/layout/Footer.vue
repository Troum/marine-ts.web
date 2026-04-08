<script setup lang="ts">
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()

const navLinks = [
  { label: 'Главная', href: '/' },
  { label: 'О компании', href: '/about' },
  { label: 'Услуги', href: '/services' },
  { label: 'Крюинг-менеджмент', href: '/crewing-management' },
  { label: 'Проекты', href: '/projects' },
  { label: 'Галерея', href: '/gallery' },
  { label: 'Новости', href: '/news' },
  { label: 'Вакансии', href: '/vacancies' },
  { label: 'Контакты', href: '/contacts' },
]

const serviceLinks = [
  { label: 'Ремонт корпусов', href: '/services' },
  { label: 'Ремонт двигателей', href: '/services' },
  { label: 'Электротехнические работы', href: '/services' },
  { label: 'Трубопроводные системы', href: '/services' },
  { label: 'Доковые работы', href: '/services' },
  { label: 'Инжиниринг', href: '/services' },
]
</script>

<template>
  <footer class="relative bg-mts-dark text-white overflow-hidden">
    <div class="absolute inset-0 opacity-5">
      <div
        class="absolute inset-0"
        style="
          background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 30px 30px;
        "
      />
    </div>

    <div class="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20 relative z-10">
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        <div class="lg:col-span-1">
          <NuxtLink to="/" class="inline-block mb-6 group">
            <AppLogo img-class="h-9 w-auto max-w-[min(100%,260px)] object-contain object-left opacity-95 group-hover:opacity-100 transition-opacity" />
          </NuxtLink>
          <p class="font-body text-xs text-white/50 leading-relaxed">
            Профессиональный судоремонт и техническое обслуживание судов по всему миру с 2010 года.
          </p>
        </div>

        <div>
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white/30 mb-6">Навигация</h4>
          <ul class="space-y-2">
            <li v-for="link in navLinks" :key="link.href">
              <NuxtLink :to="link.href" class="font-body text-xs text-white/60 hover:text-mts-accent transition-colors">
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white/30 mb-6">Услуги</h4>
          <ul class="space-y-2">
            <li v-for="service in serviceLinks" :key="service.label">
              <NuxtLink
                :to="service.href"
                class="font-body text-xs text-white/60 hover:text-mts-accent transition-colors"
              >
                {{ service.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-mono text-[10px] font-medium tracking-[0.15em] uppercase text-white/30 mb-6">Контакты</h4>
          <ul class="space-y-3">
            <li>
              <a
                href="tel:84012355290"
                class="flex items-center gap-3 text-white/60 hover:text-mts-accent transition-colors"
              >
                <div class="w-7 h-7 bg-white/10 flex items-center justify-center">
                  <Phone class="w-3.5 h-3.5" />
                </div>
                <span class="font-body text-xs">8 (4012) 35-52-90</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:info@marin-ts.com"
                class="flex items-center gap-3 text-white/60 hover:text-mts-accent transition-colors"
              >
                <div class="w-7 h-7 bg-white/10 flex items-center justify-center">
                  <Mail class="w-3.5 h-3.5" />
                </div>
                <span class="font-body text-xs">info@marin-ts.com</span>
              </a>
            </li>
            <li class="flex items-start gap-3 text-white/60">
              <div class="w-7 h-7 bg-white/10 flex items-center justify-center flex-shrink-0">
                <MapPin class="w-3.5 h-3.5" />
              </div>
              <span class="font-body text-xs">г. Калининград, Россия</span>
            </li>
            <li>
              <a
                href="https://vk.com/marine_ts"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 text-white/60 hover:text-mts-accent transition-colors"
              >
                <div class="w-7 h-7 bg-white/10 flex items-center justify-center">
                  <ExternalLink class="w-3.5 h-3.5" />
                </div>
                <span class="font-body text-xs">vk.com/marine_ts</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-16 pt-8 border-t border-white/10">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="font-mono text-[10px] text-white/30">
            © {{ currentYear }} MARINE TECHNICAL SOLUTIONS. ВСЕ ПРАВА ЗАЩИЩЕНЫ.
          </p>
          <div class="flex items-center gap-6">
            <NuxtLink
              to="/privacy"
              class="font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ
            </NuxtLink>
            <NuxtLink
              to="/terms"
              class="font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              УСЛОВИЯ ИСПОЛЬЗОВАНИЯ
            </NuxtLink>
            <NuxtLink to="/admin" class="font-mono text-[10px] text-white/30 hover:text-mts-accent transition-colors">
              ADMIN
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
