<template>
  <div class="min-h-screen bg-mts-bg flex flex-col">
    <LayoutNavigation />
    <main class="flex-grow">
      <slot />
    </main>
    <LayoutFooter />
    <CommonScrollToTop />
  </div>
</template>
