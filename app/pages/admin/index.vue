<script setup lang="ts">
import {
  Newspaper,
  Briefcase,
  LogOut,
  Edit,
  Eye,
  Loader2,
  Wrench,
  Search,
  Users,
  MessageSquare,
  ClipboardList,
  Shield,
  BarChart3,
  Images,
  Phone,
  Building2,
  Home,
  FileText,
  X,
  Compass,
  Ship,
  Camera,
  Mail,
  Inbox,
  LayoutList,
} from 'lucide-vue-next'
import type { NewsItem, PageViewsSummary, Project } from '~/types'
import AdminPlusLink from "~/components/admin/AdminPlusLink.vue";

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useMarineApi()
const { logout } = useAuth()
const { canManageUsers, canManageContentPages, canManageGallery, canManageContacts, canManageNavigation } =
  useAdminPermissions()

const sectionPickerOpen = ref(false)
const sectionOptions = [
  { label: 'Главная', to: '/admin/home', icon: Home, desc: 'Hero, статистика, превью сервисов, процесс работы, CTA' },
  { label: 'О компании', to: '/admin/about', icon: Building2, desc: 'Экосистема, миссия, преимущества, география, сертификаты' },
  { label: 'Сервисы', to: '/admin/services-page', icon: Wrench, desc: 'Hero-блок и CTA' },
  { label: 'Проекты', to: '/admin/projects-page', icon: Compass, desc: 'Hero-блок, изображение и CTA' },
  { label: 'Галерея', to: '/admin/gallery-page', icon: Camera, desc: 'Hero-блок' },
  { label: 'Новости', to: '/admin/news-page', icon: Newspaper, desc: 'Hero-блок' },
  {
    label: 'Вакансии',
    to: '/admin/vacancies-page',
    icon: ClipboardList,
    desc: 'Hero, фон, CTA, форма заявки',
  },
  {
    label: 'Судовой менеджмент',
    to: '/admin/line-pages/ship-management',
    icon: Ship,
    desc: 'Hero, направления, чек-лист, принципы, аудитория',
  },
  {
    label: 'Крюинг-менеджмент',
    to: '/admin/line-pages/crewing-management',
    icon: Users,
    desc: 'Hero, направления, чек-лист, принципы, аудитория',
  },
  { label: 'Контакты', to: '/admin/contacts-page', icon: Mail, desc: 'Hero, форма, офисы' },
]

const news = ref<NewsItem[]>([])
const projects = ref<Project[]>([])
const stats = ref({
  news_count: 0,
  projects_count: 0,
  featured_news: 0,
  services_count: 0,
  vacancies_count: 0,
  application_forms_count: 0,
})
/** Только блок «цифры сверху»; карточки разделов не прячем из‑за медленного API. */
const statsPending = ref(true)
const pageViews = ref<PageViewsSummary | null>(null)

onMounted(async () => {
  try {
    const [n, p, s] = await Promise.all([api.news.getAll(), api.projects.getAll(), api.stats.getAll()])
    news.value = n
    projects.value = p
    stats.value = s
  } catch {
    /* ignore */
  } finally {
    statsPending.value = false
  }
  try {
    pageViews.value = await api.analytics.getSummary()
  } catch {
    pageViews.value = null
  }
})

const maxDailyViews = computed(() => {
  const days = pageViews.value?.dailyLast14Days ?? []
  const m = Math.max(0, ...days.map((d) => d.views))

  return m > 0 ? m : 1
})

/** Высота столбиков в px (h-28 ≈ 7rem) */
const chartBarMaxPx = 112

const statCards = computed(() => [
  { label: 'Всего новостей', value: stats.value.news_count || news.value.length, icon: Newspaper, color: 'bg-blue-500' },
  { label: 'Всего проектов', value: stats.value.projects_count || projects.value.length, icon: Briefcase, color: 'bg-green-500' },
  {
    label: 'Изб. новостей',
    value: stats.value.featured_news || news.value.filter((x) => x.featured).length,
    icon: Eye,
    color: 'bg-purple-500',
  },
  {
    label: 'Карточек сервисов',
    value: stats.value.services_count ?? 0,
    icon: Wrench,
    color: 'bg-amber-600',
  },
  {
    label: 'Вакансий',
    value: stats.value.vacancies_count ?? 0,
    icon: Users,
    color: 'bg-teal-600',
  },
  {
    label: 'Поданных анкет',
    value: stats.value.application_forms_count ?? 0,
    icon: ClipboardList,
    color: 'bg-slate-600',
  },
])
</script>

<template>
  <div>
    <header class="bg-white border-b border-mts-border sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4 min-w-0">
            <AppLogo img-class="h-9 w-auto max-w-[min(45vw,220px)] shrink-0 object-contain object-left" />
            <span class="font-mono text-sm font-medium tracking-wide text-mts-text-secondary shrink-0 hidden sm:inline"
              >ADMIN PANEL</span
            >
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink to="/" class="font-body text-sm text-mts-text-secondary hover:text-mts-accent transition-colors">
              Перейти на сайт
            </NuxtLink>
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 border border-mts-border text-mts-text-secondary hover:text-mts-accent hover:border-mts-accent transition-colors"
              @click="logout(); navigateTo('/admin/login')"
            >
              <LogOut class="w-4 h-4" />
              <span class="font-mono text-xs uppercase">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <h1 class="font-display text-3xl text-mts-text mb-8">Панель управления</h1>
      <div v-if="statsPending" class="flex justify-center py-12 mb-12">
        <Loader2 class="w-8 h-8 text-mts-accent animate-spin" />
      </div>
      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
          <div v-for="stat in statCards" :key="stat.label" class="bg-white border border-mts-border p-6 flex flex-wrap items-center gap-4">
            <div class="flex items-center justify-start gap-x-4">
              <div :class="['w-12 h-12 flex items-center justify-center', stat.color]">
                <component :is="stat.icon" class="w-6 h-6 text-white" />
              </div>
              <p class="font-mono text-3xl font-medium text-mts-text">{{ stat.value }}</p>
            </div>
            <div>
              <p class="font-body text-sm text-mts-text-secondary">{{ stat.label }}</p>
            </div>
          </div>
      </div>

        <section v-if="pageViews" class="mb-12 border border-mts-border bg-white p-6 lg:p-8">
          <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="mb-1 flex items-center gap-2">
                <BarChart3 class="h-5 w-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Просмотры публичного сайта</h2>
              </div>
              <p class="font-body text-sm text-mts-text-secondary max-w-2xl">
                Данные из собственного счётчика (маршруты без <span class="font-mono text-xs">/admin</span>). Внешняя
                аналитика (GA / Plausible) ведётся отдельно.
              </p>
            </div>
          </div>

          <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div class="border border-mts-border bg-mts-bg p-4">
              <p class="font-mono text-2xl font-medium text-mts-text">{{ pageViews.totalViews }}</p>
              <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Всего просмотров</p>
            </div>
            <div class="border border-mts-border bg-mts-bg p-4">
              <p class="font-mono text-2xl font-medium text-mts-accent">{{ pageViews.todayViews }}</p>
              <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Сегодня</p>
            </div>
            <div class="border border-mts-border bg-mts-bg p-4">
              <p class="font-mono text-2xl font-medium text-mts-text">{{ pageViews.last7Days }}</p>
              <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">За 7 дней</p>
            </div>
            <div class="border border-mts-border bg-mts-bg p-4">
              <p class="font-mono text-2xl font-medium text-mts-text">{{ pageViews.last30Days }}</p>
              <p class="font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">За 30 дней</p>
            </div>
          </div>

          <div class="mb-8">
            <h3 class="font-mono text-xs uppercase tracking-wide text-mts-text-secondary mb-3">14 дней</h3>
            <div class="flex h-28 items-end gap-0.5 sm:gap-1">
              <div
                v-for="day in pageViews.dailyLast14Days"
                :key="day.date"
                class="group flex min-w-0 flex-1 flex-col items-stretch justify-end"
                :title="`${day.date}: ${day.views}`"
              >
                <div
                  class="w-full rounded-t bg-mts-accent/80 transition-colors group-hover:bg-mts-accent"
                  :style="{
                    height: `${Math.max(2, (day.views / maxDailyViews) * chartBarMaxPx)}px`,
                    minHeight: day.views > 0 ? '2px' : '0',
                  }"
                />
                <span
                  class="mt-1 hidden truncate text-center font-mono text-[9px] text-mts-text-secondary sm:block max-w-full"
                >
                  {{ day.date.slice(8, 10) }}.{{ day.date.slice(5, 7) }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-mono text-xs uppercase tracking-wide text-mts-text-secondary mb-3">Популярные пути</h3>
            <div class="overflow-x-auto border border-mts-border">
              <table class="w-full min-w-[320px] text-left text-sm">
                <thead class="bg-mts-bg font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">
                  <tr>
                    <th class="px-4 py-2">Путь</th>
                    <th class="px-4 py-2 w-24 text-right">Просмотры</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in pageViews.topPaths" :key="row.path" class="border-t border-mts-border">
                    <td class="px-4 py-2 font-mono text-xs text-mts-text break-all">{{ row.path }}</td>
                    <td class="px-4 py-2 text-right font-mono text-mts-text">{{ row.views }}</td>
                  </tr>
                  <tr v-if="pageViews.topPaths.length === 0">
                    <td colspan="2" class="px-4 py-6 text-center text-mts-text-secondary">Пока нет данных</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Newspaper class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Новости</h2>
              </div>
              <AdminPlusLink to="/admin/news/new">Добавить</AdminPlusLink>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Управление новостями компании. Добавляйте, редактируйте и удаляйте публикации.
              </p>
              <NuxtLink to="/admin/news" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline">
                <Edit class="w-4 h-4" />
                Управление новостями
              </NuxtLink>
            </div>
          </div>

          <div class="bg-white border border-mts-border">
            <div
              class="p-6 border-b border-mts-border flex flex-nowrap items-center justify-between gap-3 overflow-x-auto"
            >
              <div class="flex shrink-0 items-center gap-3">
                <Briefcase class="w-5 h-5 shrink-0 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Проекты</h2>
              </div>
              <div class="flex shrink-0 flex-nowrap items-center gap-2">
                <AdminPlusLink
                  v-if="canManageContentPages"
                  to="/admin/content-pages/new?contentableType=project"
                  variant="outline"
                >
                  Страница
                </AdminPlusLink>
                <AdminPlusLink to="/admin/projects/new">Карточка</AdminPlusLink>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Портфолио проектов на сайте: карточки каталога и при необходимости отдельные текстовые страницы по адресу
                /projects/…
              </p>
              <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                <NuxtLink
                  to="/admin/projects"
                  class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
                >
                  <Edit class="w-4 h-4" />
                  Проекты на сайте
                </NuxtLink>
                <NuxtLink
                  v-if="canManageContentPages"
                  to="/admin/content-pages"
                  class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
                >
                  <Edit class="w-4 h-4" />
                  Текстовые страницы
                </NuxtLink>
              </div>
            </div>
          </div>

          <div v-if="canManageGallery" class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Images class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Галерея</h2>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Фотографии на странице «Галерея»: загрузка, подписи, порядок и замена файлов.
              </p>
              <NuxtLink
                to="/admin/gallery"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
              >
                <Edit class="w-4 h-4" />
                Управление галереей
              </NuxtLink>
            </div>
          </div>

          <div class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <FileText class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Редактирование раздела</h2>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Секционное редактирование страниц сайта: hero-блоки, тексты, CTA, статистика и превью.
              </p>
              <button
                type="button"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
                @click="sectionPickerOpen = true"
              >
                <Edit class="w-4 h-4" />
                Выбрать раздел
              </button>
            </div>
          </div>

          <div class="bg-white border border-mts-border">
            <div
              class="p-6 border-b border-mts-border flex flex-nowrap items-center justify-between gap-3 overflow-x-auto"
            >
              <div class="flex shrink-0 items-center gap-3">
                <Wrench class="w-5 h-5 shrink-0 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Сервисы</h2>
              </div>
              <div class="flex shrink-0 flex-nowrap items-center gap-2">
                <AdminPlusLink v-if="canManageContentPages" to="/admin/content-pages/new" variant="outline">
                  Страница
                </AdminPlusLink>
                <AdminPlusLink to="/admin/services/new">Карточка</AdminPlusLink>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Раздел «Сервисы» на сайте: карточки каталога и при необходимости отдельные текстовые страницы по адресу
                /services/…
              </p>
              <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                <NuxtLink
                  to="/admin/services"
                  class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
                >
                  <Edit class="w-4 h-4" />
                  Карточки на сайте
                </NuxtLink>
                <NuxtLink
                  v-if="canManageContentPages"
                  to="/admin/content-pages"
                  class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
                >
                  <Edit class="w-4 h-4" />
                  Текстовые страницы
                </NuxtLink>
              </div>
            </div>
          </div>

          <div class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Users class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Вакансии</h2>
              </div>
              <AdminPlusLink to="/admin/vacancies/new">Добавить</AdminPlusLink>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Открытые позиции на странице «Вакансии»: описание, требования, локация, публикация и анкеты кандидатов.
              </p>
              <NuxtLink
                to="/admin/vacancies"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
              >
                <Edit class="w-4 h-4" />
                Управление вакансиями
              </NuxtLink>
            </div>
          </div>

          <div class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <MessageSquare class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Обратная связь</h2>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Сообщения с формы на странице «Контакты»: имя, email, текст обращения.
              </p>
              <NuxtLink
                to="/admin/feedback"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
              >
                <Edit class="w-4 h-4" />
                Открыть сообщения
              </NuxtLink>
            </div>
          </div>

          <div class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Inbox class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Заявки</h2>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Заявки с формы на страницах сайта (судовой менеджмент, разделы с подключённой формой): контакты, судно, текст запроса.
              </p>
              <NuxtLink
                to="/admin/inquiries"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
              >
                <Edit class="w-4 h-4" />
                Открыть заявки
              </NuxtLink>
            </div>
          </div>

          <div v-if="canManageContacts" class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Phone class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Контакты на сайте</h2>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Телефоны, email, адрес, режим работы и карточки офисов на странице «Контакты».
              </p>
              <NuxtLink
                to="/admin/contacts"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
              >
                <Edit class="w-4 h-4" />
                Редактировать контакты
              </NuxtLink>
            </div>
          </div>

          <div v-if="canManageNavigation" class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <LayoutList class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Меню в шапке</h2>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Ссылки в основной строке навигации и в списке «Ещё»: пути, подписи RU/EN, внешние URL.
              </p>
              <NuxtLink
                to="/admin/navigation"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
              >
                <Edit class="w-4 h-4" />
                Редактировать меню
              </NuxtLink>
            </div>
          </div>

          <div v-if="canManageNavigation" class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <LayoutList class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Меню в подвале</h2>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Три колонки ссылок и нижняя полоса документов без выпадающих подменю.
              </p>
              <NuxtLink
                to="/admin/footer-navigation"
                class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline"
              >
                <Edit class="w-4 h-4" />
                Редактировать подвал
              </NuxtLink>
            </div>
          </div>

          <div v-if="canManageUsers" class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Shield class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">Пользователи</h2>
              </div>
              <AdminPlusLink to="/admin/users/new">Добавить</AdminPlusLink>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Учётные записи панели: логин, роли и права доступа (Spatie).
              </p>
              <NuxtLink to="/admin/users" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline">
                <Edit class="w-4 h-4" />
                Управление пользователями
              </NuxtLink>
            </div>
          </div>

          <div class="bg-white border border-mts-border">
            <div class="p-6 border-b border-mts-border flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Search class="w-5 h-5 text-mts-accent" />
                <h2 class="font-display text-xl text-mts-text">SEO</h2>
              </div>
            </div>
            <div class="p-6">
              <p class="font-body text-sm text-mts-text-secondary mb-4">
                Meta title, description и keywords для разделов сайта и отдельных материалов.
              </p>
              <NuxtLink to="/admin/seo" class="flex items-center gap-2 text-mts-accent font-mono text-xs uppercase hover:underline">
                <Edit class="w-4 h-4" />
                Управление SEO
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="mt-12">
          <h2 class="font-display text-2xl text-mts-text mb-6">Последние новости</h2>
          <div class="bg-white border border-mts-border overflow-x-auto">
            <table class="w-full min-w-150">
              <thead class="bg-mts-bg border-b border-mts-border">
                <tr>
                  <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Заголовок</th>
                  <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Категория</th>
                  <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Дата</th>
                  <th class="text-left p-4 font-mono text-[10px] uppercase tracking-wide text-mts-text-secondary">Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in news.slice(0, 5)" :key="item.id" class="border-b border-mts-border last:border-0">
                  <td class="p-4">
                    <p class="font-body text-sm text-mts-text">{{ item.title }}</p>
                    <span
                      v-if="item.featured"
                      class="inline-block mt-1 px-2 py-0.5 bg-mts-accent/10 text-mts-accent font-mono text-[9px] uppercase"
                    >
                      Избранное
                    </span>
                  </td>
                  <td class="p-4">
                    <span class="font-body text-sm text-mts-text-secondary">{{ item.category }}</span>
                  </td>
                  <td class="p-4">
                    <span class="font-body text-sm text-mts-text-secondary">{{ item.date }}</span>
                  </td>
                  <td class="p-4">
                    <NuxtLink :to="`/admin/news/${item.id}`" class="p-2 text-mts-text-secondary hover:text-mts-accent transition-colors inline-flex">
                      <Edit class="w-4 h-4" />
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
    </main>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="sectionPickerOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          @click.self="sectionPickerOpen = false"
        >
          <div class="bg-white w-full max-w-lg mx-4 border border-mts-border shadow-xl">
            <div class="p-5 border-b border-mts-border flex items-center justify-between">
              <h3 class="font-display text-lg text-mts-text">Выберите раздел</h3>
              <button
                type="button"
                class="text-mts-text-secondary hover:text-mts-text transition-colors"
                @click="sectionPickerOpen = false"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
            <div class="p-2 max-h-[60vh] overflow-y-auto">
              <NuxtLink
                v-for="s in sectionOptions"
                :key="s.to"
                :to="s.to"
                class="flex items-center gap-4 p-4 hover:bg-mts-accent/5 transition-colors group"
                @click="sectionPickerOpen = false"
              >
                <component :is="s.icon" class="w-5 h-5 text-mts-text-secondary group-hover:text-mts-accent shrink-0 transition-colors" />
                <div class="min-w-0">
                  <p class="font-display text-sm text-mts-text group-hover:text-mts-accent transition-colors">{{ s.label }}</p>
                  <p class="font-body text-xs text-mts-text-secondary truncate">{{ s.desc }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
