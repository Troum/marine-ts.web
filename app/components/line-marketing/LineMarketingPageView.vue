<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import Breadcrumbs from '~/components/common/Breadcrumbs.vue'
import ButtonLink from '~/components/common/ButtonLink.vue'
import type { CrewingPageData, MarineContentLocale } from '~/types'
import { buildCrewingChecklistRenderRows, countFilledCrewingChecklistPoints } from '~/utils/crewingChecklistDefaults'
import { defaultLinePageData, mergeLinePageData } from '~/utils/pageDefaults'
import type { LineMarketingPageSlug } from '~/utils/lineMarketingPages'
import { LINE_MARKETING_PAGE_LAYOUT } from '~/utils/lineMarketingPages'
import { resolveCrewingIcon } from '~/utils/crewingIcons'

const props = defineProps<{
  slug: LineMarketingPageSlug
}>()

useSiteSeoMeta(props.slug)

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { breadcrumbs } = usePageBreadcrumbs()
const api = useMarineApi()

const loc = computed(() => (locale.value === 'en' ? 'en' : 'ru') as MarineContentLocale)

const heroVisible = ref(false)
const layout = computed(() => LINE_MARKETING_PAGE_LAYOUT[props.slug])

onMounted(() => {
  heroVisible.value = true
})

const { data: cmsPage } = await useAsyncData(
  () => `line-page-${props.slug}-cms`,
  async () => {
    try {
      return await api.contentPages.getPublicBySlug(props.slug)
    } catch {
      return null
    }
  },
  { server: true },
)

const cms = computed<CrewingPageData>(() => {
  const body = cmsPage.value?.body
  if (body) {
    try {
      const parsed = JSON.parse(body) as unknown
      return mergeLinePageData(loc.value, parsed, props.slug)
    } catch {
      /* fall through */
    }
  }
  return defaultLinePageData(props.slug, loc.value)
})

const crumbItems = computed(() =>
  breadcrumbs({
    label: t(layout.value.navI18nKey),
    to: localePath(`/${props.slug}`),
  }),
)

const checklistOpen = ref(false)

const checklistVisible = computed(
  () => countFilledCrewingChecklistPoints(cms.value.checklist.sections) > 0,
)

const checklistRows = computed(() => buildCrewingChecklistRenderRows(cms.value.checklist))

const heroBgStyle = computed(() => ({
  backgroundImage: `url(${layout.value.heroBg})`,
}))

const checklistHeadingId = computed(() => `${props.slug}-checklist-heading`)
const checklistPanelId = computed(() => `${props.slug}-checklist-panel`)
</script>

<template>
  <div class="bg-mts-bg">
    <section class="relative flex min-h-[min(88vh,920px)] items-center overflow-hidden">
      <div class="absolute top-0 left-1/4 h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent" />
      <div class="absolute top-0 right-1/4 h-full w-px bg-linear-to-b from-transparent via-mts-border to-transparent" />

      <div class="absolute inset-0">
        <div
          :class="[
            'absolute inset-0 bg-cover bg-center transition-all duration-1000',
            heroVisible ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          ]"
          :style="heroBgStyle"
        />
        <div class="absolute inset-0 bg-linear-to-r from-mts-bg via-mts-bg/82 to-mts-bg/55" />
        <div class="absolute inset-0 bg-linear-to-t from-transparent via-mts-bg/10 to-mts-bg/38" />
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-32 bg-linear-to-b from-transparent via-white/50 to-white sm:h-40 md:h-48"
          aria-hidden="true"
        />
      </div>

      <div class="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-28 lg:px-12">
        <div class="w-full max-w-3xl xl:max-w-4xl">
          <Breadcrumbs :items="crumbItems" />
          <div
            :class="[
              'mb-4 flex items-center gap-3 transition-all duration-600',
              heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
            ]"
          >
            <div class="h-px w-8 bg-mts-accent" />
            <span class="section-label">{{ cms.hero.label }}</span>
          </div>
          <h1
            :class="[
              'font-display mb-6 text-4xl leading-tight text-mts-text transition-all duration-600 lg:text-5xl',
              heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
            ]"
          >
            {{ cms.hero.title }}<span class="text-mts-accent">{{ cms.hero.titleAccent }}</span
            >{{ cms.hero.titleEnd }}
          </h1>
          <div class="mb-6 h-0.5 w-12 bg-mts-accent" />
          <p
            :class="[
              'font-body text-lg leading-relaxed text-mts-text-secondary transition-all duration-600',
              heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
            ]"
          >
            {{ cms.hero.lead }}
          </p>
        </div>
      </div>
    </section>

    <section class="relative overflow-hidden bg-white py-24">
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <h2 class="font-display mb-4 text-center text-2xl text-mts-text md:text-3xl">
          {{ cms.directionsSection.title }}
        </h2>
        <p class="mx-auto mb-14 max-w-2xl text-center font-body text-mts-text-secondary">
          {{ cms.directionsSection.lead }}
        </p>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(item, idx) in cms.directions"
            :key="`${item.title}-${idx}`"
            class="card-tech border border-mts-border p-8 transition-colors hover:border-mts-accent/40"
          >
            <component :is="resolveCrewingIcon(item.icon)" class="mb-4 h-8 w-8 text-mts-accent" />
            <h3 class="font-display mb-3 text-xl text-mts-text">{{ item.title }}</h3>
            <p class="font-body text-sm leading-relaxed text-mts-text-secondary">{{ item.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="checklistVisible"
      :aria-labelledby="checklistHeadingId"
      class="border-t border-mts-border bg-mts-bg py-16"
    >
      <div class="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12">
        <h2 :id="checklistHeadingId" class="sr-only">
          {{ cms.checklist.toggleShow }}
        </h2>
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 text-left font-body text-mts-accent transition-colors hover:text-mts-text"
          :aria-expanded="checklistOpen"
          :aria-controls="checklistPanelId"
          @click="checklistOpen = !checklistOpen"
        >
          <span class="text-base font-medium underline-offset-4 hover:underline">
            {{ checklistOpen ? cms.checklist.toggleHide : cms.checklist.toggleShow }}
          </span>
          <ChevronDown
            class="h-5 w-5 shrink-0 text-mts-accent transition-transform duration-200"
            :class="{ 'rotate-180': checklistOpen }"
            aria-hidden="true"
          />
        </button>
        <div
          v-show="checklistOpen"
          :id="checklistPanelId"
          class="mt-8"
          :aria-hidden="!checklistOpen"
        >
          <p
            v-if="cms.checklist.intro.trim()"
            class="mb-8 font-body leading-relaxed text-mts-text-secondary"
          >
            {{ cms.checklist.intro }}
          </p>
          <div class="space-y-1">
            <template v-for="(row, ri) in checklistRows" :key="`cr-${ri}`">
              <h3
                v-if="row.type === 'heading'"
                :class="[
                  'font-display border-b border-mts-border pb-2 text-lg text-mts-text',
                  ri === 0 ? 'mt-0' : 'mt-8',
                ]"
              >
                {{ row.text }}
              </h3>
              <div
                v-else
                class="flex gap-3 border-b border-mts-border/70 py-3 font-body text-sm leading-relaxed text-mts-text-secondary last:border-b-0"
              >
                <span class="mt-0.5 shrink-0 tabular-nums text-mts-accent">{{ row.num }}.</span>
                <p>
                  <span class="font-medium text-mts-text">{{ row.title }}</span>
                  {{ row.text }}
                </p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>

    <section class="relative overflow-hidden py-24">
      <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div class="grid items-start gap-16 lg:grid-cols-2">
          <div class="relative">
            <CommonAccentCorners size="lg" />
            <div class="border border-mts-border bg-mts-bg p-8 shadow-tech">
              <h2 class="font-display mb-6 text-2xl text-mts-text">{{ cms.principles.title }}</h2>
              <ul class="space-y-4">
                <li v-for="(line, i) in cms.principles.items" :key="i" class="flex gap-3 font-body text-mts-text-secondary">
                  <span class="mt-1.5 h-1.5 w-1.5 shrink-0 bg-mts-accent" />
                  {{ line }}
                </li>
              </ul>
            </div>
          </div>
          <div>
            <h2 class="font-display mb-6 text-2xl text-mts-text">{{ cms.audience.title }}</h2>
            <p class="mb-6 font-body leading-relaxed text-mts-text-secondary">
              {{ cms.audience.paragraph1 }}
            </p>
            <p class="mb-8 font-body leading-relaxed text-mts-text-secondary">
              {{ cms.audience.paragraph2 }}
            </p>
            <ButtonLink :title="cms.audience.ctaLabel" :link="cms.audience.ctaHref" />
          </div>
        </div>
      </div>
    </section>

    <CommonPageInquiryForm v-if="cms.showInquiryForm" :source-page="props.slug" />
  </div>
</template>
