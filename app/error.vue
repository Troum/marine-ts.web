<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; statusMessage?: string } }>()

const is404 = computed(() => props.error.statusCode === 404)

// Устанавливает класс темы на <body> (mts-theme-scglobal или пусто).
// Ошибку игнорируем — в error-контексте API может быть недоступен.
try { useSiteAppearance() } catch {}

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 1.5rem;
      background: #f4f3f1;
      font-family: system-ui, sans-serif;
      color: #1a1a1a;
    "
  >
    <p style="font-size: 9rem; font-weight: 700; line-height: 1; color: rgba(26,26,26,0.08); margin: 0 0 0.5rem;">
      {{ error.statusCode }}
    </p>

    <h1 style="font-size: 1.75rem; font-weight: 500; margin: 0 0 0.75rem;">
      <template v-if="is404">Страница не найдена</template>
      <template v-else>Что-то пошло не так</template>
    </h1>

    <p style="color: #777; max-width: 380px; line-height: 1.6; margin: 0 0 2.5rem;">
      <template v-if="is404">
        Запрашиваемая страница не существует или временно недоступна.
      </template>
      <template v-else>
        На сервере возникла непредвиденная ошибка.
      </template>
    </p>

    <button
      type="button"
      style="
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--color-mts-accent, #c84b4b);
        color: #fff;
        border: none;
        padding: 0.75rem 1.75rem;
        font-family: monospace;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        cursor: pointer;
        opacity: 1;
      "
      @click="goHome"
    >
      На главную
    </button>
  </div>
</template>
