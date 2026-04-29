<script setup lang="ts">
/**
 * Общая оболочка публичной content-page: кастомные секции до статьи (hero и др.) → основная статья (TipTap)
 * → кастомные секции после статьи → заявка.
 * Тот же каркас, что у /projects/:slug и маркетинговых линеек; визуально согласован с about (`mts-about-shell`).
 */
import Breadcrumbs, { type BreadcrumbItem } from '~/components/common/Breadcrumbs.vue'
import type { CustomPageSection } from '~/types'
import { Loader2 } from 'lucide-vue-next'
import ThemedContentString from "~/components/common/ThemedContentString.vue";

defineProps<{
  pending: boolean
  page: {
    title: string
    excerpt?: string | null
    showInquiryForm?: boolean
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
            <Breadcrumbs v-if="showArticleBreadcrumbs" class="mb-8" :items="crumbItems" />

            <h1
              v-if="page.showPublicTitle !== false"
              class="font-display text-3xl font-bold leading-tight text-body [text-wrap:pretty] lg:text-4xl"
            >
              <ThemedContentString :content="page.title" />
            </h1>

            <p
              v-if="page.excerpt"
              class="mt-8 max-w-3xl border-l-2 border-primary pl-6 font-body text-lg leading-relaxed text-muted lg:text-xl lg:leading-[34px]"
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
      />

      <CommonPageInquiryForm
        v-if="inquiryEnabled !== false && page.showInquiryForm"
        :source-page="inquirySourcePage"
      />
    </template>
  </div>
</template>
