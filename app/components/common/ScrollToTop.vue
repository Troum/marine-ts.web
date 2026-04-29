<script setup lang="ts">
import { ChevronUp } from 'lucide-vue-next'

const visible = ref(false)

onMounted(() => {
  const onScroll = () => {
    visible.value = window.scrollY > 300
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
})

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <button
      v-show="visible"
      type="button"
      class="fixed bottom-6 right-6 z-40 flex items-center justify-center w-10 h-10 bg-primary text-white shadow-tech-lg hover:bg-primary-dark transition-colors"
      aria-label="Наверх"
      @click="scrollToTop"
    >
      <ChevronUp class="w-5 h-5" />
    </button>
  </Transition>
</template>
