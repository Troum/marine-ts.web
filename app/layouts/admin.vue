<script setup lang="ts">
/**
 * Админка живёт в собственном «светлом» скоупе `.admin-shell`
 * (см. app/assets/css/main.css → @layer base). Базовая тема проекта
 * тёмная (Marin), и без этого класса админ-страницы унаследовали
 * бы тёмные значения --color-mts-bg / --color-mts-text.
 *
 * Кроме обёртки внутри #__nuxt мы навешиваем `admin-shell` ещё и на
 * <body> через `useHead`, чтобы:
 *   1. Браузерный фон вокруг скролла / overscroll был светлым,
 *      а не «протекал» тёмной краской публичной темы.
 *   2. Любые портированные через Teleport в body модалки/тосты
 *      (AdminConfirmDialog, AdminAlertDialog, AdminToastStack)
 *      получили те же светлые токены, что и сама админка.
 *   3. Не было «тёмной вспышки» при первичной гидратации
 *      на медленных соединениях.
 */
useHead({
  bodyAttrs: {
    class: 'admin-shell',
  },
})
</script>

<template>
  <div class="admin-shell min-h-screen bg-mts-bg">
    <slot />
    <AdminConfirmDialog />
    <AdminAlertDialog />
    <AdminToastStack />
  </div>
</template>
