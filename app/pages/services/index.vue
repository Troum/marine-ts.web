<script setup lang="ts">
/**
 * Старый адрес /services → 301 на /ship-repair.
 */
const localePath = useLocalePath()

await navigateTo(localePath('/ship-repair'), { replace: true, redirectCode: 301 })
</script>

<template>
  <div />
</template>
