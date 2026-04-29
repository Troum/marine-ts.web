<script setup lang="ts">
/**
 * MarinReveal — обёртка для плавного появления контента секции при скролле.
 *
 * Поведение:
 *   • До попадания в viewport: opacity 0, сдвиг на 24px вниз.
 *   • При пересечении IntersectionObserver (≥ 15% видно) — fade + slide-up
 *     длительностью ~700ms с easing `cubic-bezier(0.22, 1, 0.36, 1)`.
 *   • Эффект срабатывает один раз: после показа observer отписывается,
 *     повторный скролл не сбрасывает анимацию (важно для длинных страниц).
 *   • Уважает `prefers-reduced-motion: reduce` — пользователям с включённой
 *     системной настройкой контент сразу появляется в финальном состоянии,
 *     без анимаций.
 *
 * Зачем нужно:
 *   На странице «О компании» 7+ полноэкранных секций с разными фотофонами.
 *   Без анимации скачок между ними ощущается резко. Реveal-эффект делает
 *   повествование плавным и помогает взгляду «считывать» секции по очереди.
 *
 * Использование:
 *   <MarinReveal>
 *     <h2>...</h2>
 *     <p>...</p>
 *   </MarinReveal>
 *
 *   Поддерживает `delay-ms` пропом — для каскадного появления соседних
 *   блоков внутри одной секции (заголовок → лид → карточки).
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    /**
     * Задержка перед стартом анимации в миллисекундах. Нужна, когда внутри
     * секции есть несколько reveal-блоков, и хочется каскадное появление
     * (например, заголовок без задержки, параграф +120ms, карточки +240ms).
     */
    delayMs?: number
    /**
     * Доля элемента, при которой срабатывает observer. По умолчанию 0.15 —
     * этого достаточно, чтобы анимация запустилась, как только верх блока
     * показался из-за фолда, но до того как пользователь начал читать.
     */
    threshold?: number
    /**
     * Дополнительные классы на корневом элементе (например `md:col-span-*`
     * и `h-full` для ячеек CSS grid).
     */
    contentClass?: string
  }>(),
  {
    delayMs: 0,
    threshold: 0.15,
    contentClass: undefined,
  },
)

const root = ref<HTMLElement | null>(null)
const visible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  /**
   * SSR-safe: onMounted не выполняется на сервере, window/IntersectionObserver
   * доступны только здесь. Дополнительный guard на отсутствие API
   * (браузеры без поддержки API) — мгновенный показ без анимации.
   */
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    visible.value = true
    return
  }

  if (!root.value) {
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          /**
           * Задержка через setTimeout, а не CSS transition-delay — чтобы
           * `transform/opacity` стартовали именно из начальных значений,
           * а не «телепортировались» в конец после долгой задержки.
           */
          if (props.delayMs > 0) {
            window.setTimeout(() => {
              visible.value = true
            }, props.delayMs)
          } else {
            visible.value = true
          }
          observer?.disconnect()
          observer = null
          break
        }
      }
    },
    {
      threshold: props.threshold,
      /**
       * rootMargin со сдвигом вверх (-10%) — ждём, пока блок реально
       * появится в нижней части viewport, а не сработает у самого края.
       */
      rootMargin: '0px 0px -10% 0px',
    },
  )

  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div
    ref="root"
    :class="['marin-reveal', { 'marin-reveal--visible': visible }, contentClass]"
  >
    <slot />
  </div>
</template>

<style scoped>
.marin-reveal {
  opacity: 0;
  transform: translate3d(0, 24px, 0);
  /**
   * Easing «expo-out» — даёт ощущение лёгкого замедления в конце,
   * без перелёта/баунса. Длительность 700ms — баланс между «успеть
   * заметить» и «не тормозить чтение».
   */
  transition:
    opacity 700ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.marin-reveal--visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

/**
 * Дополнительный safety-net поверх JS-проверки: если пользователь
 * включил reduce-motion уже после загрузки страницы (например, через
 * системные настройки), CSS гарантирует мгновенный финал без транзишена.
 */
@media (prefers-reduced-motion: reduce) {
  .marin-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
