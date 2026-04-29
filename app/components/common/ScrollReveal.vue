<template>
  <div
    ref="element"
    :class="['reveal', delayClass, className]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    delay?: number
    threshold?: number
    className?: string
  }>(),
  {
    delay: 0,
    threshold: 0.2,
    className: '',
  },
)

const element = ref<HTMLElement | null>(null)

const delayClass = computed(() => {
  if (props.delay === 1) return 'reveal-delay-1'
  if (props.delay === 2) return 'reveal-delay-2'
  if (props.delay === 3) return 'reveal-delay-3'
  if (props.delay === 4) return 'reveal-delay-4'
  if (props.delay === 5) return 'reveal-delay-5'
  return ''
})

onMounted(() => {
  if (!element.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('revealed')
        observer.unobserve(entry.target)
      }
    },
    { threshold: props.threshold },
  )

  observer.observe(element.value)
  onUnmounted(() => observer.disconnect())
})
</script>
