<script setup lang="ts">
import Breadcrumbs from "~/components/common/Breadcrumbs.vue";

useSiteSeoMeta('terms')
</script>

<template>
  <div class="bg-mts-bg pt-24 pb-16 px-6">
    <div class="max-w-3xl mx-auto">
      <Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Условия использования' }]" />
      <h1 class="font-display text-3xl text-mts-text mb-6">Условия использования</h1>
      <p class="font-body text-mts-text-secondary leading-relaxed">
        Здесь будут размещены условия использования сайта Marine Technical Solutions.
      </p>
    </div>
  </div>
</template>
