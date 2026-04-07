<script setup lang="ts">
import { ArrowLeft, Loader2, Plus, Minus, Ship, Cog, Zap } from 'lucide-vue-next'
import type { Project } from '~/types'

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

const types = [
  { id: 'hull' as const, label: 'Ремонт корпуса', icon: Ship },
  { id: 'engine' as const, label: 'Ремонт двигателя', icon: Cog },
  { id: 'electrical' as const, label: 'Электрика', icon: Zap },
]

const typeOptions = types.map((t) => ({ value: t.id, label: t.label, icon: t.icon }))

const form = ref<Partial<Project>>({
  title: '',
  type: 'hull',
  typeLabel: 'Ремонт корпуса',
  location: '',
  date: new Date().getFullYear().toString(),
  description: '',
  stats: {},
})

const statKey = ref('')
const statValue = ref('')
const loading = ref(!isNew.value)
const saving = ref(false)

onMounted(async () => {
  if (isNew.value) {
    loading.value = false
    return
  }
  try {
    const p = await api.projects.getById(Number(idParam.value))
    form.value = { ...p }
  } catch {
    await navigateTo('/admin/projects')
  } finally {
    loading.value = false
  }
})

function onTypeChange(typeId: string) {
  const t = types.find((x) => x.id === typeId)
  if (t) {
    form.value.type = t.id
    form.value.typeLabel = t.label
  }
}

function addStat() {
  if (!statKey.value || !statValue.value || !form.value.stats) {
    return
  }
  form.value.stats = { ...form.value.stats, [statKey.value]: statValue.value }
  statKey.value = ''
  statValue.value = ''
}

function removeStat(key: string) {
  if (!form.value.stats) {
    return
  }
  const next = { ...form.value.stats }
  delete next[key]
  form.value.stats = next
}

async function submit() {
  saving.value = true
  try {
    if (isNew.value) {
      await api.projects.create(form.value as Omit<Project, 'id'>)
    } else {
      await api.projects.update(Number(idParam.value), form.value)
    }
    adminToast.success(isNew.value ? 'Проект добавлен' : 'Проект сохранён')
    await navigateTo('/admin/projects')
  } catch {
    await showAdminAlert({ message: 'Не удалось сохранить проект', variant: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-4xl mx-auto px-6 lg:px-12">
        <div class="flex items-center h-16">
          <NuxtLink to="/admin/projects" class="text-mts-text-secondary hover:text-mts-accent mr-4">
            <ArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <h1 class="font-display text-xl text-mts-text">
            {{ isNew ? 'Новый проект' : 'Редактирование проекта' }}
          </h1>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 lg:px-12 py-8">
      <div v-if="loading" class="flex justify-center py-24">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <form v-else class="bg-white border border-mts-border p-8 space-y-6" @submit.prevent="submit">
        <div>
          <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Название *</label>
          <input v-model="form.title" required type="text" class="w-full bg-mts-bg border border-mts-border px-4 py-3 text-sm" />
        </div>
        <div>
          <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Тип</label>
          <AdminSelect
            :model-value="form.type ?? 'hull'"
            :options="typeOptions"
            @update:model-value="onTypeChange($event)"
          />
        </div>
        <div>
          <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Локация *</label>
          <input v-model="form.location" required type="text" class="w-full bg-mts-bg border border-mts-border px-4 py-3 text-sm" />
        </div>
        <div>
          <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Год *</label>
          <input v-model="form.date" required type="text" class="w-full bg-mts-bg border border-mts-border px-4 py-3 text-sm" />
        </div>
        <div>
          <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Описание *</label>
          <textarea
            v-model="form.description"
            required
            rows="5"
            class="w-full bg-mts-bg border border-mts-border px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label class="block font-mono text-[10px] uppercase text-mts-text-secondary mb-2">Показатели</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="(val, key) in form.stats"
              :key="key"
              class="inline-flex items-center gap-1 px-2 py-1 bg-mts-bg border text-xs font-mono"
            >
              {{ key }}: {{ val }}
              <button type="button" class="text-mts-accent" @click="removeStat(key)">
                <Minus class="w-3 h-3" />
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input v-model="statKey" placeholder="Ключ" type="text" class="flex-1 bg-mts-bg border border-mts-border px-3 py-2 text-sm" />
            <input v-model="statValue" placeholder="Значение" type="text" class="flex-1 bg-mts-bg border border-mts-border px-3 py-2 text-sm" />
            <button type="button" class="btn-secondary px-3" @click="addStat">
              <Plus class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          <NuxtLink to="/admin/projects" class="btn-secondary">Отмена</NuxtLink>
        </div>
      </form>
    </main>
  </div>
</template>
