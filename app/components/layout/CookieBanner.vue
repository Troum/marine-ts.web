<template>
  <Transition name="cookie">
    <div
      v-if="!accepted"
      class="fixed inset-x-0 bottom-0 z-50 bg-dark text-white shadow-2xl"
    >
      <div class="mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p class="max-w-5xl text-sm leading-relaxed text-white/80">
          На нашем сайте используются cookie-файлы, в том числе сервисов веб-аналитики. Используя сайт, вы соглашаетесь на обработку персональных данных при помощи cookie-файлов. Подробнее можно узнать в
          <NuxtLink :to="localePath('/privacy')" class="text-primary hover:underline">
            Политике конфиденциальности
          </NuxtLink>.
        </p>
        <button
          type="button"
          class="btn-primary shrink-0 px-6 py-2.5"
          @click="accept"
        >
          <Check class="h-4 w-4" />
          Принять
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'

const localePath = useLocalePath()
const accepted = ref(true)

onMounted(() => {
  accepted.value = localStorage.getItem('cookiesAccepted') === 'true'
})

function accept() {
  accepted.value = true
  localStorage.setItem('cookiesAccepted', 'true')
}
</script>
