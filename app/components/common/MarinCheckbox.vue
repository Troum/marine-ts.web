<script setup lang="ts">
/**
 * Стилизованный чек-бокс для публичной формы (дизайн Tailwind v4).
 *
 * Внутри живёт нативный `<input type="checkbox">` (он скрыт через
 * `sr-only`, чтобы не терять доступность и поддержку ассистивных
 * технологий), а визуальная «коробка» рисуется соседним `<span>`,
 * который реагирует на `peer-checked`, `peer-focus-visible` и
 * `group-hover`. Это даёт единый вид во всех браузерах и на тёмной,
 * и на светлой теме (token-based).
 *
 * Поддерживает два режима:
 *   – одиночный bool (`v-model="agree"`),
 *   – массив значений с `value` (`v-model="form.types" :value="'tanker'"`).
 *
 * Логика хранения значений полностью на стороне Vue: компонент
 * прокидывает `v-model` на нативный `<input>` через `defineModel`.
 */
import { Check } from 'lucide-vue-next'
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Значение чек-бокса при работе с массивом (`v-model` — массив). Игнорируется в режиме bool. */
    value?: string | number | boolean
    /** Текст подписи. Если не передан — используем default-слот. */
    label?: string
    /** Опциональная подсказка под подписью (мелким шрифтом). */
    hint?: string
    /** Подпись поверх любого размера — например для согласий с длинным текстом. */
    align?: 'center' | 'start'
    disabled?: boolean
    required?: boolean
    /** Название поля для атрибута `name` (формы без JS). */
    name?: string
  }>(),
  {
    align: 'center',
    disabled: false,
    required: false,
  },
)

/**
 * Поддерживаем оба сценария — одиночный boolean и массив значений.
 * Vue сам выбирает поведение нативного `<input type="checkbox">` по
 * типу `v-model`, нам остаётся только прокинуть его без изменений.
 */
const model = defineModel<boolean | Array<string | number | boolean>>({ required: true })

const inputId = useId()

const wrapperClass = computed(() => [
  'group inline-flex w-full cursor-pointer select-none gap-3',
  props.align === 'start' ? 'items-start' : 'items-center',
  props.disabled ? 'cursor-not-allowed opacity-60' : '',
])
</script>

<template>
  <label :class="wrapperClass" :for="inputId">
    <input
      :id="inputId"
      v-model="model"
      type="checkbox"
      :value="value"
      :name="name"
      :disabled="disabled"
      :required="required"
      class="peer sr-only"
    />
    <span
      aria-hidden="true"
      :class="[
        'relative flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px]',
        'border bg-mts-surface',
        'border-mts-border',
        'transition-colors duration-150 ease-out',
        'group-hover:border-mts-accent/70',
        'peer-checked:border-mts-accent peer-checked:bg-mts-accent',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-mts-accent/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-mts-bg',
        align === 'start' ? 'mt-0.5' : '',
      ]"
    >
      <!--
        Чекбокс у нас — `peer`, а SVG-«галочка» лежит ВНУТРИ соседнего
        `<span>` (не сиблинг peer-а), поэтому `peer-checked:` к ней не
        достаёт. Используем `group-has-[:checked]:`: ищем у предка с
        классом `group` (label) потомка `:checked` и тогда показываем
        иконку. Это корректный для Tailwind v4 способ, работает и в
        браузерах без нативной поддержки `:has` (Tailwind генерирует
        фолбэк через `:where`).
      -->
      <Check
        class="h-3.5 w-3.5 stroke-[3] text-white opacity-0 transition-opacity duration-150 group-has-[:checked]:opacity-100"
      />
    </span>
    <span class="min-w-0 font-body text-sm leading-snug text-mts-text">
      <slot>{{ label }}</slot>
      <span v-if="hint" class="mt-0.5 block font-body text-xs text-mts-text-secondary">{{ hint }}</span>
    </span>
  </label>
</template>
