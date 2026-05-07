<script setup lang="ts">
/**
 * Общая оболочка публичной content-page: кастомные секции до статьи (hero и др.) → основная статья (TipTap)
 * → кастомные секции после статьи → заявка.
 * Тот же каркас, что у /projects/:slug и маркетинговых линеек; визуально согласован с about (`mts-about-shell`).
 */
import HeroBreadcrumbsRow from '~/components/common/HeroBreadcrumbsRow.vue'
import type { BreadcrumbItem } from '~/components/common/Breadcrumbs.vue'
import type { CustomPageSection, PageInquiryFormConfig } from '~/types'
import { Loader2 } from 'lucide-vue-next'
import ThemedContentString from "~/components/common/ThemedContentString.vue";

defineProps<{
  pending: boolean
  page: {
    title: string
    excerpt?: string | null
    showInquiryForm?: boolean
    inquiryForm?: PageInquiryFormConfig
    showPublicTitle?: boolean
  } | null
  bodyHtml: string
  showTopCustomSections: boolean
  topCustomSections: CustomPageSection[] | null
  showAfterArticleSections: boolean
  afterArticleCustomSections: CustomPageSection[] | null
  showArticleBreadcrumbs: boolean
  crumbItems: BreadcrumbItem[]
  inquirySourcePage: string
  /** Ложь — не показывать блок заявки (например, невалидный parent slug). */
  inquiryEnabled?: boolean
  /**
   * Для маршрута `/{line}/:slug`: короткое значение в карточке CMS без `/` ведёт на `/{line}/…`.
   */
  lineMarketingParentSlug?: string | null
}>()
</script>

<template>
  <div class="mts-about-shell bg-white text-body">
    <div v-if="pending" class="flex justify-center py-24">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!page" class="mts-content-wrap py-24 text-center">
      <div class="mx-auto max-w-7xl">
        <slot name="not-found" />
      </div>
    </div>
    <template v-else>
      <CommonCustomPageSectionsRender
        v-if="showTopCustomSections"
        placement="pageTop"
        :sections="topCustomSections"
        :page-crumb-items="crumbItems"
        :line-marketing-parent-slug="lineMarketingParentSlug"
      />
      <article
        class="relative overflow-hidden"
        :class="[
          showAfterArticleSections ? 'pb-6 lg:pb-8' : 'pb-24 lg:pb-28',
          showTopCustomSections ? '' : 'pt-16 lg:pt-20',
        ]"
      >
        <div class="relative z-10 mts-content-wrap">
          <div class="mx-auto max-w-7xl">
            <HeroBreadcrumbsRow
              v-if="showArticleBreadcrumbs"
              :items="crumbItems"
            />

            <h1
              v-if="page.showPublicTitle !== false"
              class="mts-figma-hero-h1 text-body [text-wrap:pretty]"
            >
              <ThemedContentString :content="page.title" />
            </h1>

            <p
              v-if="page.excerpt"
              class="mts-figma-hero-lead mt-8 max-w-3xl border-l-2 border-primary pl-6 text-muted"
            >
              <ThemedContentString :content="page.excerpt" />
            </p>

            <div
              v-if="bodyHtml"
              class="mts-markdown mt-10 lg:mt-12"
              v-html="bodyHtml"
            />
          </div>
        </div>
      </article>

      <CommonCustomPageSectionsRender
        v-if="showAfterArticleSections"
        placement="afterArticle"
        :sections="afterArticleCustomSections"
        :page-crumb-items="crumbItems"
        :line-marketing-parent-slug="lineMarketingParentSlug"
      />

      <CommonPageInquiryForm
        v-if="inquiryEnabled !== false && page.showInquiryForm"
        :source-page="inquirySourcePage"
        :config="page.inquiryForm"
      />
    </template>
  </div>
</template>
