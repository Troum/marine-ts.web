<script setup lang="ts">
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import CustomPageBlockRender from '~/components/common/CustomPageBlockRender.vue'
import type { CustomPageSection } from '~/types'

defineProps<{
  sections: CustomPageSection[] | undefined | null
  /** Если задан — будет проброшен в карточки блока `cards`. */
  resolveDetailHref?: (detailSlug: string) => string | null
}>()

function isVisible(s: CustomPageSection): boolean {
  if (!s) {
    return false
  }
  // Скрываем полностью пустые секции (без блоков и заголовка).
  const hasTitle = s.showTitle && s.title.trim() !== ''
  return s.blocks.length > 0 || hasTitle
}
</script>

<template>
  <template v-if="sections && sections.length > 0">
    <template v-for="section in sections.filter(isVisible)" :key="section.id">
      <section class="relative overflow-hidden border-t border-mts-border bg-mts-bg py-16">
        <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
          <h2
            v-if="section.showTitle && section.title.trim()"
            class="font-display mb-10 text-center text-2xl text-mts-text md:text-3xl"
          >
            <ThemedContentString :content="section.title" />
          </h2>

          <div v-for="block in section.blocks" :key="block.id" class="mb-16 last:mb-0">
            <CustomPageBlockRender :block="block" :resolve-detail-href="resolveDetailHref" />
          </div>
        </div>
      </section>
    </template>
  </template>
</template>
