<script setup lang="ts">
import { Menu, X, Phone, ChevronDown } from 'lucide-vue-next'
import type { ComponentPublicInstance } from 'vue'
import LanguageSwitch from '~/components/layout/LanguageSwitch.vue'
import type { NavigationMenuItem } from '~/types'
import { flattenEncodedOrPlain } from '~/utils/adminThemedTextCodec'
import { emptyNavigationSettings } from '~/utils/emptyNavigationSettings'

const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()
const api = useMarineApi()

const { data: navigationRemote, refresh: refreshNavigation } = await useAsyncData(
  'site-navigation',
  async () => {
    try {
      return await api.navigationSettings.get()
    } catch {
      return null
    }
  },
)

/** SSR иногда не достучится до API — повторяем запрос на клиенте. */
onMounted(async () => {
  if (navigationRemote.value == null) {
    await refreshNavigation()
  }
})

const menu = computed(() => navigationRemote.value ?? emptyNavigationSettings())

function labelForLocale(item: NavigationMenuItem): string {
  const loc = locale.value === 'en' ? 'en' : 'ru'
  const raw = item.label[loc] || item.label.ru || item.label.en || ''
  return flattenEncodedOrPlain(raw)
}

function isExternalPath(p: string) {
  return /^https?:\/\//i.test(p.trim())
}

const mainItems = computed(() => menu.value.main)

const moreLinks = computed(() =>
  menu.value.more.map((item) => ({
    path: item.path,
    label: labelForLocale(item),
  })),
)

const showMoreBlock = computed(() => moreLinks.value.length > 0)

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const moreOpen = ref(false)
const openDropdownIndex = ref<number | null>(null)
const mobileOpenSubIndex = ref<number | null>(null)

function closeNavOverlays() {
  moreOpen.value = false
  openDropdownIndex.value = null
}

onMounted(() => {
  const onScroll = () => {
    isScrolled.value = window.scrollY > 50
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  function onDocumentClick(e: MouseEvent) {
    const target = e.target
    if (!(target instanceof Element)) {
      return
    }
    if (target.closest('[data-nav-dropdown]')) {
      return
    }
    closeNavOverlays()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeNavOverlays()
    }
  }
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeydown)
  })
})

watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false
    mobileOpenSubIndex.value = null
    closeNavOverlays()
  },
)

function isActivePath(href: string) {
  if (isExternalPath(href)) {
    return false
  }
  const resolved = localePath(href)
  const path = route.path.replace(/\/$/, '') || '/'
  const target = String(resolved).replace(/\/$/, '') || '/'
  if (href === '/') {
    return path === '/' || path === '/en'
  }
  return path === target || path.startsWith(`${target}/`)
}

function isNavGroupActive(item: NavigationMenuItem): boolean {
  if (item.children?.length) {
    if (item.children.some((c) => isActivePath(c.path))) {
      return true
    }
  }
  if (item.path === '#') {
    return false
  }
  return isActivePath(item.path)
}

function toggleNavDropdown(i: number, e: Event) {
  e.stopPropagation()
  moreOpen.value = false
  openDropdownIndex.value = openDropdownIndex.value === i ? null : i
}

function toggleMore(e: Event) {
  e.stopPropagation()
  openDropdownIndex.value = null
  moreOpen.value = !moreOpen.value
}

function toggleMobileSub(i: number) {
  mobileOpenSubIndex.value = mobileOpenSubIndex.value === i ? null : i
}

const isMoreSectionActive = computed(() => moreLinks.value.some((link) => isActivePath(link.path)))

/** Рельс «как SectionScrollRail» у overlay «Ещё»: ромб следует за hover / активным пунктом. */
const MORE_RAIL_TRACK_W = 92
const MORE_RAIL_TRACK_X = 23.5
const MORE_RAIL_DIAMOND_R = 15.5
const MORE_RAIL_DOT_R = 4
/** Запас влево в viewBox SVG (достаточно для короткой горизонтали до маркера у ромба). */
const MORE_RAIL_PAD_L = 120
const moreRailSvgCx = MORE_RAIL_PAD_L + MORE_RAIL_TRACK_X
const MORE_RAIL_SVG_W = MORE_RAIL_PAD_L + MORE_RAIL_TRACK_W
/** Длина акцентной горизонтали влево от левой вершины ромба — «урезать» до зоны между текстом и треком. */
const MORE_RAIL_H_ARM = 88

const moreOverlayTrackRef = ref<HTMLElement | null>(null)
const moreOverlayLinkEls = ref<(HTMLElement | undefined)[]>([])
const hoveredMoreIndex = ref<number | null>(null)
const linkCenterYs = ref<number[]>([])
const railTrackHeightPx = ref(320)
let moreRailRo: ResizeObserver | null = null

function setMoreLinkRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (el == null) {
    moreOverlayLinkEls.value[index] = undefined
    return
  }
  const node = el instanceof HTMLElement ? el : ((el as ComponentPublicInstance).$el as HTMLElement | undefined)
  moreOverlayLinkEls.value[index] = node
}

function moreRailDiamondPoints(cx: number, cy: number, r: number): string {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`
}

function measureMoreRail() {
  if (!import.meta.client) return
  const root = moreOverlayTrackRef.value
  if (!root) return
  const rootRect = root.getBoundingClientRect()
  const h = Math.max(120, Math.round(rootRect.height))
  railTrackHeightPx.value = h
  const n = moreLinks.value.length
  const ys: number[] = []
  for (let i = 0; i < n; i++) {
    const el = moreOverlayLinkEls.value[i]
    if (!el) {
      ys.push(MORE_RAIL_DIAMOND_R)
      continue
    }
    const r = el.getBoundingClientRect()
    const center = r.top + r.height / 2 - rootRect.top
    ys.push(
      Math.round(Math.min(h - MORE_RAIL_DIAMOND_R, Math.max(MORE_RAIL_DIAMOND_R, center))),
    )
  }
  linkCenterYs.value = ys
}

function teardownMoreRailObserver() {
  if (moreRailRo) {
    moreRailRo.disconnect()
    moreRailRo = null
  }
}

function bindMoreRailObserver() {
  teardownMoreRailObserver()
  const el = moreOverlayTrackRef.value
  if (!el) return
  moreRailRo = new ResizeObserver(() => {
    measureMoreRail()
  })
  moreRailRo.observe(el)
}

const activeMoreLinkIndex = computed(() => {
  const i = moreLinks.value.findIndex((l) => !isExternalPath(l.path) && isActivePath(l.path))
  return i >= 0 ? i : null
})

const moreRailDiamondIndex = computed(() => {
  if (hoveredMoreIndex.value != null) return hoveredMoreIndex.value
  if (activeMoreLinkIndex.value != null) return activeMoreLinkIndex.value
  return 0
})

const moreRailDiamondTop = computed(() => {
  const ys = linkCenterYs.value
  const idx = moreRailDiamondIndex.value
  if (ys.length && idx >= 0 && idx < ys.length) return ys[idx]!
  return MORE_RAIL_DIAMOND_R
})

const moreRailDiamondTransform = computed(() => `translate(0, ${moreRailDiamondTop.value})`)

watch(moreOpen, async (open) => {
  hoveredMoreIndex.value = null
  if (!open) {
    teardownMoreRailObserver()
    moreOverlayLinkEls.value = []
    linkCenterYs.value = []
    return
  }
  await nextTick()
  await nextTick()
  requestAnimationFrame(() => {
    measureMoreRail()
    bindMoreRailObserver()
  })
  setTimeout(() => {
    if (moreOpen.value) measureMoreRail()
  }, 900)
})

watch(
  () => locale.value,
  () => {
    if (moreOpen.value) {
      nextTick(() => requestAnimationFrame(measureMoreRail))
    }
  },
)

onUnmounted(() => {
  teardownMoreRailObserver()
})
</script>

<template>
  <nav
    :class="[
      'fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300',
      isScrolled ? 'border-white/10 bg-transparent' : 'border-transparent bg-transparent',
    ]"
  >
    <div class="mts-content-wrap">
      <div class="flex h-[70px] w-full min-w-0 items-center gap-2 sm:gap-3 lg:gap-4">
        <NuxtLink
          :to="localePath('/')"
          class="group relative z-20 flex shrink-0 items-center border-r border-white/15 pr-5 max-w-[min(50vw,190px)] sm:max-w-[210px] lg:max-w-[220px]"
        >
          <AppLogo img-class="h-8 w-auto max-w-full object-contain object-left md:h-9" />
        </NuxtLink>

        <div
          class="hidden lg:flex flex-1 min-w-0 items-center gap-x-1 xl:gap-x-2 2xl:gap-x-3 px-4"
        >
          <div class="flex min-w-0 flex-1 items-center justify-start gap-x-1 xl:gap-x-2 2xl:gap-x-3">
          <template v-for="(item, i) in mainItems" :key="`nav-p-${i}-${item.path}`">
            <!-- Пункт с подменю -->
            <div
              v-if="item.children?.length"
              data-nav-dropdown
              class="relative flex items-center gap-0.5"
            >
              <template v-if="item.path === '#'">
                <button
                  type="button"
                  class="nav-trace-hover-group font-display text-[10px] font-normal uppercase tracking-[0.14em] transition-colors duration-200 inline-flex items-center gap-0.5 whitespace-nowrap text-[#8fa3b3] hover:text-[#d9e1e8]"
                  :class="[
                    isNavGroupActive(item) || openDropdownIndex === i ? 'text-[#de7879]' : '',
                  ]"
                  :aria-expanded="openDropdownIndex === i"
                  @click="toggleNavDropdown(i, $event)"
                >
                  <span
                    class="nav-trace-target relative inline-block"
                    :class="[
                      isNavGroupActive(item) || openDropdownIndex === i ? 'nav-trace-active' : '',
                    ]"
                  >
                    {{ labelForLocale(item) }}
                    <span class="nav-trace-layer" aria-hidden="true">
                      <span class="nav-trace-seg nav-trace-bottom" />
                      <span class="nav-trace-seg nav-trace-right" />
                      <span class="nav-trace-seg nav-trace-top-half" />
                      <span class="nav-trace-seg nav-trace-up" />
                    </span>
                  </span>
                  <ChevronDown class="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                </button>
              </template>
              <template v-else>
                <NuxtLink
                  :to="localePath(item.path)"
                  class="nav-trace-target relative inline-block font-display text-[10px] font-normal uppercase tracking-[0.14em] transition-colors duration-200 group whitespace-nowrap text-[#8fa3b3] hover:text-[#d9e1e8]"
                  :class="[isNavGroupActive(item) ? 'text-[#de7879] nav-trace-active' : '']"
                >
                  {{ labelForLocale(item) }}
                  <span class="nav-trace-layer" aria-hidden="true">
                    <span class="nav-trace-seg nav-trace-bottom" />
                    <span class="nav-trace-seg nav-trace-right" />
                    <span class="nav-trace-seg nav-trace-top-half" />
                    <span class="nav-trace-seg nav-trace-up" />
                  </span>
                </NuxtLink>
                <button
                  type="button"
                  class="p-0.5 shrink-0 rounded-sm text-mts-slate-muted hover:text-mts-accent transition-colors"
                  :aria-expanded="openDropdownIndex === i"
                  :aria-label="labelForLocale(item)"
                  @click="toggleNavDropdown(i, $event)"
                >
                  <ChevronDown class="h-3.5 w-3.5 xl:h-4 xl:w-4" aria-hidden="true" />
                </button>
              </template>

              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 -translate-y-0.5"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-0.5"
              >
                <div
                  v-show="openDropdownIndex === i"
                  class="absolute left-0 top-[calc(100%+0.55rem)] z-[60] min-w-[13rem] border border-white/15 bg-[#041a29] py-1.5 shadow-[0_12px_22px_rgba(0,0,0,0.32)]"
                  role="menu"
                >
                  <template v-for="(child, ci) in item.children" :key="`nav-c-${i}-${ci}-${child.path}`">
                    <a
                      v-if="isExternalPath(child.path)"
                      :href="child.path"
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      class="block px-4 py-2.5 font-display text-[10px] font-normal tracking-[0.08em] transition-colors text-mts-slate-muted hover:bg-mts-frost/5 hover:text-mts-accent"
                      @click="closeNavOverlays"
                    >
                      {{ labelForLocale(child) }}
                    </a>
                    <NuxtLink
                      v-else
                      :to="localePath(child.path)"
                      role="menuitem"
                      class="block px-4 py-2.5 font-display text-[10px] font-normal tracking-[0.08em] transition-colors"
                      :class="[
                        isActivePath(child.path) ? 'bg-mts-frost/10 text-mts-accent' : 'text-mts-slate-muted hover:bg-mts-frost/5 hover:text-mts-accent',
                      ]"
                      @click="closeNavOverlays"
                    >
                      {{ labelForLocale(child) }}
                    </NuxtLink>
                  </template>
                </div>
              </Transition>
            </div>

            <!-- Обычный пункт -->
            <template v-else>
              <a
                v-if="isExternalPath(item.path)"
                :href="item.path"
                target="_blank"
                rel="noopener noreferrer"
                class="nav-trace-target relative inline-block font-display text-[10px] font-normal uppercase tracking-[0.14em] transition-colors duration-200 group whitespace-nowrap text-[#8fa3b3] hover:text-[#d9e1e8]"
              >
                {{ labelForLocale(item) }}
                <span class="nav-trace-layer" aria-hidden="true">
                  <span class="nav-trace-seg nav-trace-bottom" />
                  <span class="nav-trace-seg nav-trace-right" />
                  <span class="nav-trace-seg nav-trace-top-half" />
                  <span class="nav-trace-seg nav-trace-up" />
                </span>
              </a>
              <NuxtLink
                v-else
                :to="localePath(item.path)"
                :class="[
                  'nav-trace-target relative inline-block font-display text-[10px] font-normal uppercase tracking-[0.14em] transition-colors duration-200 group whitespace-nowrap',
                  isActivePath(item.path) ? 'text-[#de7879] nav-trace-active' : 'text-[#8fa3b3] hover:text-[#d9e1e8]',
                ]"
              >
                {{ labelForLocale(item) }}
                <span class="nav-trace-layer" aria-hidden="true">
                  <span class="nav-trace-seg nav-trace-bottom" />
                  <span class="nav-trace-seg nav-trace-right" />
                  <span class="nav-trace-seg nav-trace-top-half" />
                  <span class="nav-trace-seg nav-trace-up" />
                </span>
              </NuxtLink>
            </template>
          </template>
          </div>

          <div v-if="showMoreBlock" data-nav-dropdown class="relative shrink-0">
            <button
              type="button"
              class="inline-flex items-center justify-center p-0.5 transition-colors duration-200"
              :class="[
                isMoreSectionActive || moreOpen
                  ? 'text-mts-accent'
                  : 'text-[#8fa3b3] hover:text-[#d9e1e8]',
              ]"
              :aria-expanded="moreOpen"
              :aria-haspopup="true"
              :aria-label="t('nav.moreAria')"
              @click="toggleMore"
            >
              <Menu class="h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div class="hidden lg:flex shrink-0 items-center gap-3 xl:gap-4 2xl:gap-5 min-w-0 border-l border-white/15 pl-5">
          <LanguageSwitch dark class="shrink-0" />
          <a
            href="tel:84012355290"
            class="hidden xl:flex items-center gap-1.5 text-[#8fa3b3] hover:text-[#d9e1e8] shrink-0"
          >
            <Phone class="w-3 h-3 shrink-0" />
            <span class="font-display text-[11px] font-normal whitespace-nowrap">{{
              t('header.phoneDisplay')
            }}</span>
          </a>
          <a
            href="tel:84012355290"
            class="flex shrink-0 p-1 text-mts-slate-muted hover:text-mts-accent xl:hidden"
            :aria-label="t('header.phoneDisplay')"
          >
            <Phone class="w-4 h-4" />
          </a>
          <NuxtLink
            :to="localePath('/request')"
            class="shrink-0 whitespace-nowrap rounded-none border border-[#de7879] bg-transparent px-4 py-2 text-[10px] font-display font-normal uppercase tracking-[0.14em] text-[#de7879] transition-colors hover:bg-[#de7879]/12 xl:px-5"
          >
            {{ t('header.ctaContact') }}
          </NuxtLink>
        </div>

        <div class="flex flex-1 min-w-0 items-center justify-end lg:hidden">
          <button
            type="button"
            class="p-2 border border-mts-frost/25 text-mts-frost hover:text-mts-accent hover:border-mts-accent transition-colors"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <X v-if="isMobileMenuOpen" class="w-5 h-5" />
            <Menu v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </nav>

  <Transition
    :duration="{ enter: 820, leave: 400 }"
    enter-active-class="more-fs-enter-active"
    enter-from-class="more-fs-enter-from"
    enter-to-class="more-fs-enter-to"
    leave-active-class="more-fs-leave-active"
    leave-from-class="more-fs-leave-from"
    leave-to-class="more-fs-leave-to"
  >
    <div
      v-if="showMoreBlock && moreOpen"
      data-nav-dropdown
      class="more-overlay-root fixed inset-0 z-[70] hidden overflow-x-visible lg:block"
      role="dialog"
      aria-modal="true"
      :aria-label="t('nav.more')"
    >
      <div class="more-overlay-panel absolute inset-0 flex flex-col border-l border-white/10 bg-[#021522]">
        <button
          type="button"
          class="absolute right-6 top-6 z-10 border-2 border-mts-accent bg-mts-accent/20 p-2.5 text-mts-accent shadow-[0_0_0_1px_rgba(222,120,121,0.35)] transition-colors hover:bg-mts-accent hover:text-white sm:right-8 sm:top-8"
          aria-label="Закрыть меню"
          @click="closeNavOverlays"
        >
          <X class="h-5 w-5" />
        </button>

        <div
          class="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-visible px-6 py-24 sm:px-10 sm:py-28"
        >
          <div
            ref="moreOverlayTrackRef"
            class="more-overlay-track flex max-w-4xl flex-shrink-0 items-stretch justify-center gap-2 overflow-visible sm:gap-3 md:gap-4"
            @mouseleave="hoveredMoreIndex = null"
          >
            <nav
              class="more-overlay-nav flex min-w-0 flex-1 flex-col items-center justify-center gap-8 sm:gap-10 md:gap-12"
            >
              <template v-for="(link, mi) in moreLinks" :key="`nav-overlay-${mi}-${link.path}`">
                <a
                  v-if="isExternalPath(link.path)"
                  :ref="(el) => setMoreLinkRef(el, mi)"
                  :href="link.path"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="more-overlay-link block w-full text-center font-display text-lg uppercase tracking-[0.18em] transition-colors duration-200 sm:text-xl md:text-2xl"
                  :class="[hoveredMoreIndex === mi ? 'text-mts-accent' : 'text-mts-frost']"
                  :style="{ '--more-i': mi }"
                  @mouseenter="hoveredMoreIndex = mi"
                  @click="closeNavOverlays"
                >
                  {{ link.label }}
                </a>
                <NuxtLink
                  v-else
                  :ref="(el) => setMoreLinkRef(el, mi)"
                  :to="localePath(link.path)"
                  class="more-overlay-link block w-full text-center font-display text-lg uppercase tracking-[0.18em] transition-colors duration-200 sm:text-xl md:text-2xl"
                  :class="[
                    hoveredMoreIndex === mi || (hoveredMoreIndex === null && isActivePath(link.path))
                      ? 'text-mts-accent'
                      : 'text-mts-frost',
                  ]"
                  :style="{ '--more-i': mi }"
                  @mouseenter="hoveredMoreIndex = mi"
                  @click="closeNavOverlays"
                >
                  {{ link.label }}
                </NuxtLink>
              </template>
            </nav>

            <div
              class="pointer-events-none relative -ml-1 w-[92px] shrink-0 self-stretch select-none overflow-visible sm:-ml-2 md:-ml-3"
              aria-hidden="true"
            >
              <svg
                class="absolute right-0 top-0 block h-full overflow-visible"
                :width="MORE_RAIL_SVG_W"
                :height="railTrackHeightPx"
                :viewBox="`${-MORE_RAIL_PAD_L} 0 ${MORE_RAIL_SVG_W} ${railTrackHeightPx}`"
                fill="none"
              >
                <line
                  :x1="moreRailSvgCx"
                  y1="0"
                  :x2="moreRailSvgCx"
                  :y2="railTrackHeightPx"
                  stroke="#CFC8C8"
                  stroke-width="1"
                />
                <line
                  :x1="moreRailSvgCx"
                  y1="0"
                  :x2="moreRailSvgCx"
                  :y2="moreRailDiamondTop"
                  stroke="#DE7879"
                  stroke-width="1"
                />
                <g
                  class="more-overlay-rail-diamond transition-transform duration-300 ease-out"
                  :transform="moreRailDiamondTransform"
                >
                  <line
                    :x1="moreRailSvgCx - MORE_RAIL_DIAMOND_R - MORE_RAIL_H_ARM"
                    y1="0"
                    :x2="moreRailSvgCx - MORE_RAIL_DIAMOND_R"
                    y2="0"
                    stroke="#DE7879"
                    stroke-width="1"
                  />
                  <line
                    :x1="moreRailSvgCx - MORE_RAIL_DIAMOND_R"
                    y1="0"
                    :x2="moreRailSvgCx + MORE_RAIL_DIAMOND_R"
                    y2="0"
                    stroke="#DE7879"
                    stroke-width="1"
                  />
                  <polygon
                    :points="moreRailDiamondPoints(moreRailSvgCx, 0, MORE_RAIL_DIAMOND_R)"
                    fill="none"
                    stroke="#DE7879"
                    stroke-width="1"
                  />
                </g>
                <polygon
                  v-for="(link, ri) in moreLinks"
                  v-show="moreRailDiamondIndex !== ri && ri < linkCenterYs.length"
                  :key="`more-rail-dot-${ri}-${link.path}`"
                  :points="moreRailDiamondPoints(moreRailSvgCx, linkCenterYs[ri] ?? 0, MORE_RAIL_DOT_R)"
                  fill="#CFC8C8"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <div
    :class="[
      'fixed inset-0 z-40 lg:hidden transition-all duration-300',
      isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
    ]"
  >
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="isMobileMenuOpen = false" />
    <div
      :class="[
        'absolute top-16 left-0 right-0 border-b border-white/15 bg-[#021522] p-6 transition-all duration-300 max-h-[calc(100vh-4rem)] overflow-y-auto',
        isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
      ]"
    >
      <div class="space-y-1">
        <div class="mb-4 border-b border-mts-frost/10 px-4 pb-4">
          <LanguageSwitch dark />
        </div>
        <template v-for="(item, i) in mainItems" :key="`nav-mob-p-${i}-${item.path}`">
          <div v-if="item.children?.length" class="border-b border-mts-frost/10 pb-1 mb-1 last:border-0">
            <div class="flex items-stretch gap-1">
              <NuxtLink
                v-if="item.path !== '#'"
                :to="localePath(item.path)"
                class="flex-1 font-display text-[10px] font-normal tracking-[0.08em] px-4 py-3 transition-colors"
                :class="[
                  isNavGroupActive(item) ? 'text-mts-accent bg-mts-frost/10' : 'text-[#8fa3b3] hover:text-[#d9e1e8] hover:bg-mts-frost/5',
                ]"
                @click="isMobileMenuOpen = false"
              >
                {{ labelForLocale(item) }}
              </NuxtLink>
              <button
                v-else
                type="button"
                class="flex flex-1 items-center justify-between gap-2 font-display text-[10px] font-normal tracking-[0.08em] px-4 py-3 text-left transition-colors text-[#8fa3b3] hover:text-[#d9e1e8] hover:bg-mts-frost/5"
                :class="[isNavGroupActive(item) ? 'text-mts-accent bg-mts-frost/10' : '']"
                :aria-expanded="mobileOpenSubIndex === i"
                @click="toggleMobileSub(i)"
              >
                {{ labelForLocale(item) }}
                <ChevronDown
                  class="h-5 w-5 shrink-0 transition-transform"
                  :class="mobileOpenSubIndex === i ? 'rotate-180' : ''"
                />
              </button>
              <button
                v-if="item.path !== '#'"
                type="button"
                class="shrink-0 px-3 border-l border-mts-frost/15 text-mts-slate-muted hover:text-mts-accent"
                :aria-expanded="mobileOpenSubIndex === i"
                @click="toggleMobileSub(i)"
              >
                <ChevronDown
                  class="h-5 w-5 transition-transform"
                  :class="mobileOpenSubIndex === i ? 'rotate-180' : ''"
                />
              </button>
            </div>
            <div v-show="mobileOpenSubIndex === i" class="mt-1 space-y-0.5 pl-2 border-l-2 border-mts-accent/40 ml-4">
              <template v-for="(child, ci) in item.children" :key="`nav-mob-c-${i}-${ci}`">
                <a
                  v-if="isExternalPath(child.path)"
                  :href="child.path"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block font-display text-[10px] font-normal tracking-[0.08em] px-4 py-2.5 transition-colors text-[#8fa3b3] hover:text-[#d9e1e8] hover:bg-mts-frost/5"
                  @click="isMobileMenuOpen = false"
                >
                  {{ labelForLocale(child) }}
                </a>
                <NuxtLink
                  v-else
                  :to="localePath(child.path)"
                  class="block font-display text-[10px] font-normal tracking-[0.08em] px-4 py-2.5 transition-colors"
                  :class="[
                    isActivePath(child.path) ? 'text-mts-accent bg-mts-frost/10' : 'text-[#8fa3b3] hover:text-[#d9e1e8] hover:bg-mts-frost/5',
                  ]"
                  @click="isMobileMenuOpen = false"
                >
                  {{ labelForLocale(child) }}
                </NuxtLink>
              </template>
            </div>
          </div>
          <template v-else>
            <a
              v-if="isExternalPath(item.path)"
              :href="item.path"
              target="_blank"
              rel="noopener noreferrer"
              class="block font-display text-[10px] font-normal tracking-[0.08em] px-4 py-3 transition-colors text-[#8fa3b3] hover:text-[#d9e1e8] hover:bg-mts-frost/5"
            >
              {{ labelForLocale(item) }}
            </a>
            <NuxtLink
              v-else
              :to="localePath(item.path)"
              :class="[
                'block font-display text-[10px] font-normal tracking-[0.08em] px-4 py-3 transition-colors',
                isActivePath(item.path) ? 'text-mts-accent bg-mts-frost/10' : 'text-[#8fa3b3] hover:text-[#d9e1e8] hover:bg-mts-frost/5',
              ]"
            >
              {{ labelForLocale(item) }}
            </NuxtLink>
          </template>
        </template>
        <template v-for="(link, mi) in moreLinks" :key="`nav-mob-m-${mi}-${link.path}`">
          <a
            v-if="isExternalPath(link.path)"
            :href="link.path"
            target="_blank"
            rel="noopener noreferrer"
            class="block font-display text-[10px] font-normal tracking-[0.08em] px-4 py-3 transition-colors text-[#8fa3b3] hover:text-[#d9e1e8] hover:bg-mts-frost/5"
            @click="isMobileMenuOpen = false"
          >
            {{ link.label }}
          </a>
          <NuxtLink
            v-else
            :to="localePath(link.path)"
            :class="[
              'block font-display text-[10px] font-normal tracking-[0.08em] px-4 py-3 transition-colors',
              isActivePath(link.path) ? 'text-mts-accent bg-mts-frost/10' : 'text-[#8fa3b3] hover:text-[#d9e1e8] hover:bg-mts-frost/5',
            ]"
            @click="isMobileMenuOpen = false"
          >
            {{ link.label }}
          </NuxtLink>
        </template>
      </div>
      <div class="mt-4 pt-4 border-t border-mts-frost/10">
        <a href="tel:84012355290" class="flex items-center gap-3 text-mts-frost px-4 py-3">
          <div class="w-10 h-10 bg-mts-accent/20 flex items-center justify-center">
            <Phone class="w-4 h-4 text-mts-accent" />
          </div>
          <span class="font-display text-sm font-normal">{{ t('header.phoneDisplay') }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-trace-target {
  isolation: isolate;
}

.nav-trace-layer {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: -1;
}

.nav-trace-seg {
  position: absolute;
  background: var(--color-mts-accent);
  opacity: 0;
}

/* Линия строго по ширине текста (без вылета за глифы вправо). */
.nav-trace-bottom {
  left: 0;
  right: 0;
  bottom: -2px;
  height: 1px;
  transform: scaleX(0);
  transform-origin: left center;
}

.nav-trace-right {
  right: 0;
  bottom: -2px;
  width: 1px;
  height: calc(100% + 2px);
  transform: scaleY(0);
  transform-origin: center bottom;
}

.nav-trace-target:hover .nav-trace-bottom,
.nav-trace-target:focus-visible .nav-trace-bottom,
.nav-trace-hover-group:hover .nav-trace-target .nav-trace-bottom,
.nav-trace-hover-group:focus-visible .nav-trace-target .nav-trace-bottom {
  opacity: 1;
  animation: navTraceBottom 220ms linear forwards;
}

.nav-trace-target.nav-trace-active .nav-trace-bottom {
  opacity: 1;
  transform: scaleX(1);
  animation: none;
}

@keyframes navTraceBottom {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.nav-trace-right,
.nav-trace-top-half,
.nav-trace-up {
  display: none;
}

.more-overlay-root {
  overscroll-behavior: contain;
}

.more-fs-enter-active .more-overlay-panel,
.more-fs-leave-active .more-overlay-panel {
  transition: transform 0.55s cubic-bezier(0.18, 0.86, 0.28, 1);
}

.more-fs-enter-from .more-overlay-panel,
.more-fs-leave-to .more-overlay-panel {
  transform: translate3d(100%, 0, 0);
}

.more-fs-enter-to .more-overlay-panel,
.more-fs-leave-from .more-overlay-panel {
  transform: translate3d(0, 0, 0);
}

.more-fs-enter-active .more-overlay-link {
  animation: moreOverlayLinkBounceIn 0.68s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(0.1s + var(--more-i, 0) * 65ms);
}

@keyframes moreOverlayLinkBounceIn {
  0% {
    opacity: 0;
    transform: translate3d(72px, 0, 0);
  }
  68% {
    opacity: 1;
    transform: translate3d(-10px, 0, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>
