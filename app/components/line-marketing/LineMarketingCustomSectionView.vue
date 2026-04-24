<script setup lang="ts">
import CustomPageBlockRender from '~/components/common/CustomPageBlockRender.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import type { LineMarketingCustomSection } from '~/types'
import type { LineMarketingPageSlug } from '~/utils/lineMarketingPages'

const props = defineProps<{
  section: LineMarketingCustomSection
  slug: LineMarketingPageSlug
}>()

const localePath = useLocalePath()

function resolveDetailHref(detailSlug: string): string | null {
  const s = detailSlug.trim()
  if (!s) {
    return null
  }
  return localePath(`/${props.slug}/${s}`)
}
</script>

<template>
  <section class="relative overflow-hidden border-t border-mts-border bg-mts-bg py-16">
    <div class="relative z-10 mts-content-wrap">
      <h2
        v-if="section.showTitle && section.title.trim()"
        class="font-display mb-10 text-center text-xl text-mts-text md:text-2xl"
      >
        <ThemedContentString :content="section.title" />
      </h2>

      <div v-for="block in section.blocks" :key="block.id" class="mb-16 last:mb-0">
        <CustomPageBlockRender :block="block" :resolve-detail-href="resolveDetailHref" />
      </div>
    </div>
  </section>
</template>
