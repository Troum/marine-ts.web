<script setup lang="ts">
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import CustomPageBlockRender from '~/components/common/CustomPageBlockRender.vue'
import type { BreadcrumbItem } from '~/components/common/Breadcrumbs.vue'
import type { CustomPageBlock, CustomPageSection, PageBreadcrumbTone } from '~/types'
import {
  customPageSectionIsVisibleOnSite,
  customSectionBlockRuns,
  isHeroImageBlockActive,
} from '~/utils/customPageSections'

defineProps<{
  sections: CustomPageSection[] | undefined | null
  /** Если задан — будет проброшен в карточки блока `cards`. */
  resolveDetailHref?: (detailSlug: string) => string | null
  /** Для крошек над баннером в пользовательской секции. */
  pageCrumbItems?: BreadcrumbItem[]
  /** Секции под верхом детальной content-page: убрать border/padding сверху у первой. «После статьи» — воздух внутри секции, плотнее к статье. */
  placement?: 'default' | 'pageTop' | 'afterArticle'
}>()

function isVisible(s: CustomPageSection): boolean {
  return customPageSectionIsVisibleOnSite(s)
}

function firstHeroBannerIndex(section: CustomPageSection): number {
  return section.blocks.findIndex((b) => isHeroImageBlockActive(b))
}

function heroBreadcrumbToneFor(section: CustomPageSection, block: CustomPageBlock): PageBreadcrumbTone | null {
  const heroIdx = firstHeroBannerIndex(section)
  if (heroIdx === -1) {
    return null
  }
  const idx = section.blocks.findIndex((b) => b.id === block.id)
  if (idx !== heroIdx) {
    return null
  }
  return section.breadcrumbTone ?? null
}
</script>

<template>
  <template v-if="sections && sections.length > 0">
    <template v-for="(section, si) in sections.filter(isVisible)" :key="section.id">
      <section
        class="relative bg-white"
        :class="[
          placement === 'afterArticle' || (placement === 'pageTop' && si === 0)
            ? 'border-t-0'
            : 'border-t border-border',
          placement === 'pageTop' && si === 0 ? 'pt-0' : '',
          placement === 'afterArticle' ? 'py-12 md:py-16 lg:py-20 -mt-4 lg:-mt-6' : '',
        ]"
      >
        <div
          v-if="section.showTitle && section.title.trim()"
          class="relative z-10 mts-content-wrap"
        >
          <h2
            class="font-display text-center text-xl text-body md:text-2xl"
            :class="placement === 'afterArticle' ? 'mb-6 md:mb-8' : 'mb-10'"
          >
            <ThemedContentString :content="section.title" />
          </h2>
        </div>

        <template v-for="(run, ri) in customSectionBlockRuns(section)" :key="`${section.id}-run-${ri}`">
          <CustomPageBlockRender
            v-if="run.kind === 'hero'"
            :block="run.block"
            :resolve-detail-href="resolveDetailHref"
            :hero-image-breadcrumb-tone="heroBreadcrumbToneFor(section, run.block)"
            :page-crumb-items="pageCrumbItems"
          />
          <div v-else class="relative z-10 mts-content-wrap">
            <div
              v-for="block in run.blocks"
              :key="block.id"
              :class="placement === 'afterArticle' ? 'mb-8 last:mb-0 md:mb-10 md:last:mb-0' : 'mb-16 last:mb-0'"
            >
              <CustomPageBlockRender
                :block="block"
                :resolve-detail-href="resolveDetailHref"
                :hero-image-breadcrumb-tone="heroBreadcrumbToneFor(section, block)"
                :page-crumb-items="pageCrumbItems"
              />
            </div>
          </div>
        </template>
      </section>
    </template>
  </template>
</template>
