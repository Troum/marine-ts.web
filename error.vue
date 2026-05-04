<script setup lang="ts">
import { Home, ArrowLeft, Compass } from 'lucide-vue-next'

const props = defineProps<{ error: { statusCode: number; statusMessage?: string } }>()

const is404 = computed(() => props.error.statusCode === 404)

const { locale } = useI18n()
const localePath = useLocalePath()

useSiteAppearance()

function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo(localePath('/'))
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-mts-bg font-body text-mts-text">
    <!-- Тонкая полоска-акцент сверху -->
    <div class="h-1 w-full bg-mts-accent" />

    <!-- Навигация -->
    <header class="border-b border-mts-border bg-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <NuxtLink :to="localePath('/')" class="block">
          <AppLogo img-class="h-8 w-auto max-w-[180px] object-contain object-left" />
        </NuxtLink>
        <NuxtLink
          :to="localePath('/')"
          class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-mts-text-secondary transition-colors hover:text-mts-accent"
        >
          <Home class="h-4 w-4" />
          На главную
        </NuxtLink>
      </div>
    </header>

    <!-- Основной контент -->
    <main class="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <!-- Большой код ошибки -->
      <div class="relative mb-8 select-none">
        <p
          class="bg-gradient-to-b from-mts-text/10 to-mts-text/5 bg-clip-text font-display text-[10rem] font-bold leading-none tracking-tighter text-transparent sm:text-[14rem] lg:text-[18rem]"
          aria-hidden="true"
        >
          {{ error.statusCode }}
        </p>
        <div class="absolute inset-0 flex items-center justify-center">
          <Compass class="h-16 w-16 text-mts-accent/30 sm:h-20 sm:w-20" aria-hidden="true" />
        </div>
      </div>

      <div class="max-w-md">
        <h1 class="mb-3 font-display text-2xl font-medium text-mts-text sm:text-3xl">
          <template v-if="is404">Страница не найдена</template>
          <template v-else>Что-то пошло не так</template>
        </h1>
        <p class="mb-8 font-body leading-relaxed text-mts-text-secondary">
          <template v-if="is404">
            Запрашиваемая страница не существует или временно недоступна.<br />
            Возможно, адрес изменился или раздел находится на обслуживании.
          </template>
          <template v-else>
            На сервере возникла непредвиденная ошибка. Мы уже работаем над её устранением.
          </template>
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-mts-border bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-mts-text transition-colors hover:border-mts-accent hover:text-mts-accent"
            @click="goBack"
          >
            <ArrowLeft class="h-4 w-4" />
            Вернуться назад
          </button>
          <NuxtLink
            :to="localePath('/')"
            class="inline-flex items-center gap-2 bg-mts-accent px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            <Home class="h-4 w-4" />
            На главную
          </NuxtLink>
        </div>
      </div>
    </main>

    <!-- Нижние ссылки -->
    <footer class="border-t border-mts-border bg-white">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-12">
        <p class="font-mono text-[11px] uppercase tracking-wide text-mts-text-secondary">
          Ошибка&nbsp;{{ error.statusCode }}
          <span v-if="error.statusMessage" class="normal-case"> — {{ error.statusMessage }}</span>
        </p>
        <div class="flex flex-wrap gap-4">
          <NuxtLink
            :to="localePath('/contacts')"
            class="font-mono text-[11px] uppercase tracking-wide text-mts-text-secondary transition-colors hover:text-mts-accent"
          >
            Контакты
          </NuxtLink>
          <NuxtLink
            :to="localePath('/')"
            class="font-mono text-[11px] uppercase tracking-wide text-mts-text-secondary transition-colors hover:text-mts-accent"
          >
            Главная
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
