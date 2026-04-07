<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { ServiceItem } from '~/types'
import { serviceIconSelectOptions } from '~/utils/serviceIcons'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const api = useMarineApi()
const { show: showAdminAlert } = useAdminAlert()
const adminToast = useAdminToast()
const idParam = computed(() => route.params.id as string)
const isNew = computed(() => idParam.value === 'new')

const form = ref({
  title: '',
  description: '',
  featuresText: '',
  iconKey: 'ship',
  sortOrder: 0,
})

const loading = ref(!isNew.value)
const saving = ref(false)

onMounted(async () => {
  if (isNew.value) {
    loading.value = false
    return
  }
  try {
    const item = await api.services.getById(Number(idParam.value))
    form.value = {
      title: item.title,
      description: item.description,
      featuresText: item.features.join('\n'),
      iconKey: item.iconKey,
      sortOrder: item.sortOrder,
    }
  } catch {
    await navigateTo('/admin/services')
  } finally {
    loading.value = false
  }
})

function buildPayload(): Omit<ServiceItem, 'id'> {
  const features = form.value.featuresText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return {
    title: form.value.title,
    description: form.value.description,
    features,
    iconKey: form.value.iconKey,
    sortOrder: Number(form.value.sortOrder) || 0,
  }
}

async function submit() {
  saving.value = true
  try {
    const payload = buildPayload()
    if (isNew.value) {
      await api.services.create(payload)
    } else {
      await api.services.update(Number(idParam.value), payload)
    }
    adminToast.success(isNew.value ? 'Услуга создана' : 'Услуга сохранена')
    await navigateTo('/admin/services')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить услугу', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-4xl mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin/services" class="text-mts-text-secondary hover:text-mts-accent transition-colors">
              <ArrowLeft class="w-5 h-5" />
            </NuxtLink>
            <h1 class="font-display text-xl text-mts-text">
              {{ isNew ? 'Новая услуга' : 'Редактирование услуги' }}
            </h1>
          </div>
        </div>
      </div>
    </header>

    <AdminServicesSectionNav active="cards" />

    <main class="max-w-4xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <form v-else class="bg-white border border-mts-border shadow-tech p-8 relative" @submit.prevent="submit">
        <div class="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-mts-accent" />
        <div class="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-mts-accent" />

        <div class="space-y-6">
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
              >Название *</label
            >
            <input
              v-model="form.title"
              required
              type="text"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent"
            />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
              >Описание *</label
            >
            <textarea
              v-model="form.description"
              required
              rows="4"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent"
            />
          </div>
          <div>
            <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
              >Пункты списка (каждый с новой строки) *</label
            >
            <textarea
              v-model="form.featuresText"
              required
              rows="8"
              placeholder="Пункт 1&#10;Пункт 2"
              class="w-full bg-mts-bg border border-mts-border px-4 py-3 font-body text-sm focus:outline-none focus:border-mts-accent font-mono text-xs"
            />
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary mb-2"
                >Иконка *</label
              >
              <AdminSelect v-model="form.iconKey" :options="serviceIconSelectOptions" />
            </div>
            <div>
              <label
                for="service-sort-order"
                class="mb-2 block font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary"
                >Порядок сортировки</label
              >
              <AdminInputNumberStepper
                id="service-sort-order"
                v-model="form.sortOrder"
                variant="full"
                decrement-label="Уменьшить порядок сортировки"
                increment-label="Увеличить порядок сортировки"
              />
            </div>
          </div>
          <div class="pt-4">
            <button
              type="submit"
              :disabled="saving"
              class="px-8 py-3 bg-mts-accent text-white font-mono text-xs uppercase hover:bg-mts-accent-dark disabled:opacity-50"
            >
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </form>
    </main>
  </div>
</template>
