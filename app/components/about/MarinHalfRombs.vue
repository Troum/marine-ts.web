<script setup lang="ts">
/**
 * Декоративная пара «полуромбов» из макета Marin (Figma, Group 17).
 *
 * В макете слева за пределы viewport уходят два повёрнутых на −45° квадрата
 * (маленький 150×150 — Rectangle 35/37, большой 668×668 — Rectangle 36/38)
 * с обводкой #DE7879. По вёрстке Figma их **правые вершины** лежат
 * на горизонтальной линии раздела между двумя соседними секциями.
 *
 * Реализация:
 *   • Оба ромба в `half-rombic.svg` центрированы по середине bbox
 *     (центры поворота — y≈363/364 при общей высоте 729). Поэтому,
 *     чтобы правая вершина легла на линию раздела, SVG смещаем вверх
 *     ровно на половину собственной высоты (`-translate-y-1/2`).
 *   • Секция, в которую вставляется компонент, должна быть **без**
 *     `overflow-hidden` (иначе верхняя половина ромба будет обрезана);
 *     в about.vue overflow-hidden оставлен только на обёртке с фотом.
 */
withDefaults(
  defineProps<{
    /** Прозрачность всего SVG. */
    opacity?: number
    /** Сторона расположения. По макету — слева. */
    side?: 'left' | 'right'
  }>(),
  {
    opacity: 0.75,
    side: 'left',
  },
)
</script>

<template>
  <img
    src="/half-rombic.svg"
    alt=""
    aria-hidden="true"
    :class="[
      'pointer-events-none absolute top-0 z-[2] hidden h-full w-auto -translate-y-1/2 select-none mix-blend-screen lg:block',
      side === 'left' ? 'left-0' : 'right-0 -scale-x-100',
    ]"
    :style="{ opacity }"
  />
</template>
