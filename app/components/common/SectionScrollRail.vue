<script setup lang="ts">
type RailSection = {
  key: string
  label: string
  el: HTMLElement
  top: number
}

const route = useRoute()

const sections = ref<RailSection[]>([])
const activeIndex = ref(0)
const viewportHeight = ref(0)
const pendingScrollIndex = ref<number | null>(null)
const pendingScrollTop = ref<number | null>(null)
const wheelAccum = ref(0)
const wheelLocked = ref(false)
let wheelUnlockTimer: ReturnType<typeof setTimeout> | null = null

const TRACK_WIDTH_PX = 92
const TRACK_X_PX = 23.5
const TRACK_TAIL_PX = 22
const DIAMOND_R_PX = 15.5
const DOT_R_PX = 4
const WHEEL_SNAP_THRESHOLD = 24
const WHEEL_LOCK_MS = 420

let ro: ResizeObserver | null = null

function isVisibleSection(el: HTMLElement): boolean {
  if (el.dataset.railIgnore === 'true') return false
  if (el.offsetHeight < 140) return false
  return true
}

function sectionLabel(el: HTMLElement, idx: number): string {
  const data = el.dataset.railLabel?.trim()
  if (data) return data
  const heading = el.querySelector('h1, h2, h3')
  const text = heading?.textContent?.trim()
  if (text) return text
  return `Section ${idx + 1}`
}

const trackHeightPx = computed(() => Math.max(360, viewportHeight.value - 104 - TRACK_TAIL_PX))
const railHeightPx = computed(() => trackHeightPx.value + TRACK_TAIL_PX)

function collectSections() {
  const main = document.querySelector('main')
  if (!main) {
    sections.value = []
    activeIndex.value = 0
    return
  }

  const found = Array.from(main.querySelectorAll('section'))
    .filter((n): n is HTMLElement => n instanceof HTMLElement)
    .filter((el) => !el.parentElement?.closest('section'))
    .filter(isVisibleSection)

  sections.value = found.map((el, idx) => ({
    key: `${idx}-${Math.round(el.offsetTop)}-${Math.round(el.offsetHeight)}`,
    label: sectionLabel(el, idx),
    el,
    top: el.getBoundingClientRect().top + window.scrollY,
  }))
}

function updateActiveByScroll() {
  if (pendingScrollIndex.value != null && pendingScrollTop.value != null) {
    const distance = Math.abs(window.scrollY - pendingScrollTop.value)
    if (distance > 12) {
      activeIndex.value = pendingScrollIndex.value
      return
    }
    pendingScrollIndex.value = null
    pendingScrollTop.value = null
  }

  const n = sections.value.length
  if (!n) {
    activeIndex.value = 0
    return
  }
  const probeY = window.scrollY + 120
  if (probeY <= sections.value[0]!.top + 1) {
    activeIndex.value = 0
    return
  }
  if (probeY >= sections.value[n - 1]!.top - 1) {
    activeIndex.value = n - 1
    return
  }
  for (let i = 1; i < n; i++) {
    if (probeY < sections.value[i]!.top) {
      activeIndex.value = i - 1
      return
    }
  }
  activeIndex.value = n - 1
}

function scrollToSection(index: number) {
  const target = sections.value[index]
  if (!target) return
  const top = target.el.getBoundingClientRect().top + window.scrollY
  pendingScrollIndex.value = index
  pendingScrollTop.value = top
  activeIndex.value = index
  window.scrollTo({ top, behavior: 'smooth' })
}

function hasScrollableAncestor(target: EventTarget | null, dir: number): boolean {
  let node = target instanceof HTMLElement ? target : null
  while (node) {
    if (node.dataset.railNoSnap === 'true' || node.dataset.noSectionScroll === 'true') {
      return true
    }
    const style = window.getComputedStyle(node)
    const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY)
    if (canScrollY && node.scrollHeight > node.clientHeight + 2) {
      if (dir < 0 && node.scrollTop > 0) return true
      if (dir > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1) return true
    }
    node = node.parentElement
  }
  return false
}

function lockWheelForSnap() {
  wheelLocked.value = true
  if (wheelUnlockTimer) clearTimeout(wheelUnlockTimer)
  wheelUnlockTimer = setTimeout(() => {
    wheelLocked.value = false
  }, WHEEL_LOCK_MS)
}

function onWheel(ev: WheelEvent) {
  if (sections.value.length < 2) return
  if (ev.ctrlKey || ev.metaKey) return
  if (Math.abs(ev.deltaY) < 1) return

  const target = ev.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

  const dir = ev.deltaY > 0 ? 1 : -1
  const isAtFirstSection = activeIndex.value <= 0
  const isAtLastSection = activeIndex.value >= sections.value.length - 1

  // На краях секционного слайдера отдаём wheel нативному скроллу:
  // вниз с последней секции -> футер, вверх с первой -> верх страницы.
  if ((dir > 0 && isAtLastSection) || (dir < 0 && isAtFirstSection)) {
    wheelAccum.value = 0
    return
  }

  if (hasScrollableAncestor(ev.target, dir)) return

  const first = sections.value[0]
  const last = sections.value[sections.value.length - 1]
  if (first && last) {
    const nearFirst = window.scrollY <= first.top + 8
    const nearLast = window.scrollY + window.innerHeight >= last.top + last.el.offsetHeight - 8
    // На краях секционного контента отдаём wheel нативному скроллу:
    // вниз -> к футеру, вверх -> к началу страницы.
    if ((dir > 0 && nearLast) || (dir < 0 && nearFirst)) {
      wheelAccum.value = 0
      return
    }
  }

  if (wheelLocked.value) return

  if (wheelAccum.value !== 0 && Math.sign(wheelAccum.value) !== Math.sign(ev.deltaY)) {
    // Быстрая смена направления не должна «залипать» на старом аккумуляторе.
    wheelAccum.value = 0
  }
  wheelAccum.value += ev.deltaY
  if (Math.abs(wheelAccum.value) < WHEEL_SNAP_THRESHOLD) return

  const nextIndex = Math.max(0, Math.min(sections.value.length - 1, activeIndex.value + (wheelAccum.value > 0 ? 1 : -1)))
  wheelAccum.value = 0
  if (nextIndex === activeIndex.value) return

  ev.preventDefault()

  lockWheelForSnap()
  scrollToSection(nextIndex)
}

const markerY = computed<number[]>(() => {
  const n = sections.value.length
  if (n <= 0) return []
  if (n === 1) return [Math.round(trackHeightPx.value / 2)]
  const firstTop = sections.value[0]!.top
  const lastTop = sections.value[n - 1]!.top
  const span = Math.max(1, lastTop - firstTop)
  const minY = DIAMOND_R_PX
  const maxY = Math.max(minY, trackHeightPx.value - DIAMOND_R_PX)
  return sections.value.map((s) => Math.round(minY + ((s.top - firstTop) / span) * (maxY - minY)))
})

const activeMarkerTop = computed(() => markerY.value[activeIndex.value] ?? 0)
const activeTransform = computed(() => `translate(0, ${activeMarkerTop.value})`)

function diamondPoints(cx: number, cy: number, r: number): string {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`
}

function onResize() {
  viewportHeight.value = window.innerHeight
  collectSections()
  updateActiveByScroll()
}

onMounted(() => {
  viewportHeight.value = window.innerHeight
  collectSections()
  updateActiveByScroll()

  window.addEventListener('scroll', updateActiveByScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('wheel', onWheel, { passive: false })

  const main = document.querySelector('main')
  if (main) {
    ro = new ResizeObserver(() => {
      collectSections()
      updateActiveByScroll()
    })
    ro.observe(main)
  }

  setTimeout(() => {
    collectSections()
    updateActiveByScroll()
  }, 500)
  setTimeout(() => {
    collectSections()
    updateActiveByScroll()
  }, 1200)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveByScroll)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('wheel', onWheel)
  if (wheelUnlockTimer) {
    clearTimeout(wheelUnlockTimer)
    wheelUnlockTimer = null
  }
  if (ro) {
    ro.disconnect()
    ro = null
  }
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    requestAnimationFrame(() => {
      collectSections()
      updateActiveByScroll()
    })
  },
)
</script>

<template>
  <nav
    v-if="sections.length > 1"
    class="pointer-events-none fixed right-[24px] top-[76px] z-40 hidden lg:flex"
    aria-label="Page section navigation"
  >
    <div class="relative w-[92px]" :style="{ height: `${railHeightPx}px` }">
      <svg
        class="absolute inset-0"
        :width="TRACK_WIDTH_PX"
        :height="railHeightPx"
        :viewBox="`0 0 92 ${railHeightPx}`"
        fill="none"
        aria-hidden="true"
      >
        <line
          :x1="TRACK_X_PX"
          y1="0"
          :x2="TRACK_X_PX"
          :y2="railHeightPx - 6"
          stroke="#CFC8C8"
          stroke-width="1"
        />
        <line
          :x1="TRACK_X_PX"
          y1="0"
          :x2="TRACK_X_PX"
          :y2="activeMarkerTop"
          stroke="#DE7879"
          stroke-width="1"
        />
        <g class="transition-transform duration-300 ease-out" :transform="activeTransform">
          <line
            :x1="TRACK_X_PX - DIAMOND_R_PX"
            y1="0"
            :x2="TRACK_WIDTH_PX"
            y2="0"
            stroke="#DE7879"
            stroke-width="1"
          />
          <polygon :points="diamondPoints(TRACK_X_PX, 0, DIAMOND_R_PX)" fill="none" stroke="#DE7879" stroke-width="1" />
        </g>
        <polygon
          v-for="(s, i) in sections"
          v-show="activeIndex !== i"
          :key="`dot-${s.key}`"
          :points="diamondPoints(TRACK_X_PX, markerY[i] ?? 0, DOT_R_PX)"
          fill="#CFC8C8"
        />
        <polygon :points="diamondPoints(TRACK_X_PX, railHeightPx - 6, DOT_R_PX)" fill="#CFC8C8" />
      </svg>

      <button
        v-for="(s, i) in sections"
        :key="s.key"
        type="button"
        class="pointer-events-auto absolute z-20 inline-flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mts-accent/60"
        :style="{ left: `${TRACK_X_PX}px`, top: `${markerY[i] ?? 0}px` }"
        :title="s.label"
        :aria-label="s.label"
        @click="scrollToSection(i)"
      />
    </div>
  </nav>
</template>
