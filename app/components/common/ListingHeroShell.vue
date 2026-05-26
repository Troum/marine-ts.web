<script setup lang="ts">
/**
 * Hero листингов: фото-блок при наличии изображения, иначе светлый фон.
 */
import AboutSectionContentParallax from '~/components/about/AboutSectionContentParallax.vue'

const props = withDefaults(
  defineProps<{
    heroImage?: string | null
    /** Градиентное затемнение поверх фото (лучше сочетать со светлым текстом в слоте). */
    heroVeil?: boolean
    /** Прозрачность затемнения hero (0..1). Если не задано — используется дефолтный градиент. */
    heroVeilOpacity?: number | null
    /** Высота первого экрана (`mts-hero-min-h`), а не компактный листинг. */
    fullViewport?: boolean
    /**
     * Видимость фонового слоя после mount (fade-in), как CommonParallaxHeroMedia на маркетинговых страницах.
     * Если не указано — активен сразу.
     */
    parallaxMediaActive?: boolean
    /** Лёгкий параллакс для контента поверх hero (линия / услуги v2). */
    heroContentParallax?: boolean
    /** Декоративные вертикальные линии по краям блока — как у маркетингового hero с фото. */
    heroRails?: boolean
  }>(),
  {
    heroVeil: false,
    heroVeilOpacity: null,
    fullViewport: false,
    parallaxMediaActive: true,
    heroContentParallax: false,
    heroRails: false,
  },
)

const mediaActive = computed(() => props.parallaxMediaActive ?? true)
const heroVeilStyle = computed<Record<string, string> | undefined>(() => {
  if (props.heroVeilOpacity == null) {
    return undefined
  }
  const clamped = Math.min(1, Math.max(0, props.heroVeilOpacity))
  return {
    backgroundColor: `rgba(0, 17, 46, ${clamped})`,
    backgroundImage: 'none',
  }
})

const resolvedHeroImage = computed(() => {
  const raw = (props.heroImage ?? '').trim()
  if (!raw) {
    return ''
  }
  return publicAssetUrl(raw)
})
</script>

<template>
  <section
    :class="[
      'relative overflow-hidden',
      resolvedHeroImage
        ? props.fullViewport
          ? 'mts-hero-min-h pb-16 pt-36 lg:pb-20 lg:pt-44'
          : 'min-h-[52vh] pb-16 pt-36 lg:pb-20 lg:pt-44'
        : props.fullViewport
          ? 'mts-hero-min-h bg-white py-28 pt-32 text-body lg:py-36'
          : 'bg-white py-28 pt-32 text-body lg:py-36',
    ]"
  >
    <div
      v-if="resolvedHeroImage && props.heroRails"
      class="pointer-events-none absolute top-0 left-1/4 z-[2] h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent"
      aria-hidden="true"
    />
    <div
      v-if="resolvedHeroImage && props.heroRails"
      class="pointer-events-none absolute top-0 right-1/4 z-[2] h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent"
      aria-hidden="true"
    />

    <div v-if="resolvedHeroImage" class="absolute inset-0">
      <CommonParallaxHeroMedia :image="resolvedHeroImage" :active="mediaActive" />
      <div
        v-if="props.heroVeil"
        :class="[
          'pointer-events-none absolute inset-0 z-[1]',
          props.heroVeilOpacity == null ? 'mts-line-marketing-hero-veil' : '',
        ]"
        :style="heroVeilStyle"
        aria-hidden="true"
      />
    </div>
    <div class="relative z-10 mts-content-wrap">
      <AboutSectionContentParallax
        v-if="props.heroContentParallax && resolvedHeroImage"
        :max-shift="32"
        :factor="0.085"
        class="w-full max-w-none"
      >
        <slot />
      </AboutSectionContentParallax>
      <slot v-else />
    </div>
  </section>
</template>
