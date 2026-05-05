<script setup lang="ts">
import AboutSectionContentParallax from '~/components/about/AboutSectionContentParallax.vue'
import CustomPageBlockRender from '~/components/common/CustomPageBlockRender.vue'
import ThemedContentString from '~/components/common/ThemedContentString.vue'
import LineSectionMediaBackdrop from '~/components/line-marketing/LineSectionMediaBackdrop.vue'
import type { BreadcrumbItem } from '~/components/common/Breadcrumbs.vue'
import type { CustomPageBlock, LineMarketingCustomSection, PageBreadcrumbTone } from '~/types'
import { customSectionBlockRuns, isHeroImageBlockActive } from '~/utils/customPageSections'

const props = withDefaults(
  defineProps<{
    section: LineMarketingCustomSection
    /** Префикс пути для `detailSlug` в блоках (`crewing-management`, `services`, …). */
    slug: string
    /** Те же пункты, что в hero страницы — для крошек над баннером в секции. */
    pageCrumbItems?: BreadcrumbItem[]
    /**
     * Фон секции из `sectionBackgroundImages['custom:' + id]` страницы.
     * Если задан `section.sectionBackgroundImage`, он имеет приоритет.
     */
    pageSectionMediaUrl?: string
  }>(),
  { pageCrumbItems: undefined, pageSectionMediaUrl: '' },
)

const sectionBackdropUrl = computed(() => {
  const fromSection = props.section.sectionBackgroundImage?.trim() ?? ''
  const fromPage = props.pageSectionMediaUrl?.trim() ?? ''
  return fromSection || fromPage
})

const sectionSurfaceClass = computed(() =>
  sectionBackdropUrl.value ? 'relative border-t border-transparent py-16' : 'relative border-t border-border bg-white py-16',
)

const localePath = useLocalePath()

function resolveDetailHref(detailSlug: string): string | null {
  const s = detailSlug.trim()
  if (!s) {
    return null
  }
  return localePath(`/${props.slug}/${s}`)
}

function heroBreadcrumbToneFor(block: CustomPageBlock): PageBreadcrumbTone | null {
  const heroIdx = props.section.blocks.findIndex((b) => isHeroImageBlockActive(b))
  if (heroIdx === -1) {
    return null
  }
  const idx = props.section.blocks.findIndex((b) => b.id === block.id)
  if (idx !== heroIdx) {
    return null
  }
  return props.section.breadcrumbTone ?? null
}
</script>

<template>
  <section :class="sectionSurfaceClass">
    <LineSectionMediaBackdrop :image-url="sectionBackdropUrl" />
    <AboutSectionContentParallax
      v-if="section.showTitle && section.title.trim()"
      :max-shift="32"
      :factor="0.085"
      class="relative z-10 mts-content-wrap"
    >
      <h2 class="font-display mb-10 text-center text-xl text-body md:text-2xl">
        <ThemedContentString :content="section.title" />
      </h2>
    </AboutSectionContentParallax>

    <template v-for="(run, ri) in customSectionBlockRuns(section)" :key="`${section.id}-run-${ri}`">
      <CustomPageBlockRender
        v-if="run.kind === 'hero'"
        :block="run.block"
        :resolve-detail-href="resolveDetailHref"
        :hero-image-breadcrumb-tone="heroBreadcrumbToneFor(run.block)"
        :page-crumb-items="pageCrumbItems"
      />
      <AboutSectionContentParallax v-else :max-shift="32" :factor="0.085" class="relative z-10 mts-content-wrap">
        <div v-for="block in run.blocks" :key="block.id" class="mb-16 last:mb-0">
          <CustomPageBlockRender
            :block="block"
            :resolve-detail-href="resolveDetailHref"
            :hero-image-breadcrumb-tone="heroBreadcrumbToneFor(block)"
            :page-crumb-items="pageCrumbItems"
          />
        </div>
      </AboutSectionContentParallax>
    </template>
  </section>
</template>
