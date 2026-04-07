<script setup lang="ts">
import { Lock, User, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

const username = ref('')
const password = ref('')
const error = ref('')
const api = useMarineApi()

async function handleSubmit() {
  error.value = ''
  try {
    await api.login(username.value, password.value)
    await navigateTo('/admin')
  } catch {
    error.value = 'Неверное имя пользователя или пароль'
  }
}
</script>

<template>
  <div class="min-h-screen bg-mts-bg flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="flex flex-col items-center gap-3 mb-8">
        <AppLogo img-class="h-11 w-auto max-w-[min(100%,280px)] object-contain" />
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-mts-text-secondary">Admin panel</p>
      </div>

      <div class="bg-white border border-mts-border shadow-tech p-8 relative">
        <div class="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-mts-accent" />
        <div class="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-mts-accent" />

        <h1 class="font-display text-2xl text-mts-text mb-2">Вход в систему</h1>
        <p class="font-body text-sm text-mts-text-secondary mb-6">Введите учётные данные для доступа к панели управления</p>

        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
          {{ error }}
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">
              Имя пользователя
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mts-text-muted" />
              <input
                v-model="username"
                type="text"
                required
                class="w-full bg-mts-bg border border-mts-border pl-10 pr-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent transition-colors"
                placeholder="admin"
              />
            </div>
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2">Пароль</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mts-text-muted" />
              <input
                v-model="password"
                type="password"
                required
                class="w-full bg-mts-bg border border-mts-border pl-10 pr-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" class="w-full btn-primary justify-center group mt-6">
            Войти
            <ArrowRight class="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </div>

      <div class="text-center mt-6">
        <NuxtLink to="/" class="font-body text-sm text-mts-text-secondary hover:text-mts-accent transition-colors">
          ← Вернуться на сайт
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
