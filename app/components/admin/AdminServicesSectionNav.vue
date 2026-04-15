<script setup lang="ts">
/**
 * Переключатель подразделов «Сервисы»: карточки каталога и текстовые страницы /services/:slug.
 * Второй пункт показывается только при праве manage content pages.
 */
defineProps<{
  active: 'cards' | 'pages'
}>()

const { canManageContentPages } = useAdminPermissions()
</script>

<template>
  <div v-if="canManageContentPages" class="border-b border-mts-border bg-white">
    <div class="mx-auto flex max-w-7xl gap-0 px-6 lg:px-12">
      <NuxtLink
        to="/admin/services"
        class="border-b-2 px-4 py-3 font-mono text-xs uppercase tracking-wide transition-colors"
        :class="
          active === 'cards'
            ? 'border-mts-accent text-mts-accent'
            : 'border-transparent text-mts-text-secondary hover:text-mts-text'
        "
      >
        Карточки на сайте
      </NuxtLink>
      <NuxtLink
        to="/admin/content-pages"
        class="border-b-2 px-4 py-3 font-mono text-xs uppercase tracking-wide transition-colors"
        :class="
          active === 'pages'
            ? 'border-mts-accent text-mts-accent'
            : 'border-transparent text-mts-text-secondary hover:text-mts-text'
        "
      >
        Текстовые страницы
      </NuxtLink>
    </div>
  </div>
</template>
