<script setup lang="ts">
import Breadcrumbs from "~/components/common/Breadcrumbs.vue";

useSiteSeoMeta('privacy')
</script>

<template>
  <div class="bg-mts-bg pt-24 pb-16 px-6">
    <div class="max-w-3xl mx-auto">
      <Breadcrumbs
        :items="[{ label: 'Главная', to: '/' }, { label: 'Политика конфиденциальности' }]"
      />
      <h1 class="font-display text-3xl text-mts-text mb-6">Политика конфиденциальности</h1>
      <p class="font-body text-mts-text-secondary leading-relaxed">
        Здесь будет размещён текст политики конфиденциальности Marine Technical Solutions.
      </p>
    </div>
  </div>
</template>
