import {
  Ship,
  Cog,
  Zap,
  Settings2,
  Anchor,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-vue-next'

/** Ключ → компонент иконки (как на публичной странице услуг). */
export const serviceIconMap: Record<string, LucideIcon> = {
  ship: Ship,
  cog: Cog,
  zap: Zap,
  settings2: Settings2,
  anchor: Anchor,
  clipboard_check: ClipboardCheck,
}

export function resolveServiceIcon(key: string): LucideIcon {
  return serviceIconMap[key] ?? Ship
}

/** Опции для AdminSelect: значение, подпись и превью иконки. */
export const serviceIconSelectOptions = [
  { value: 'ship', label: 'Корпус', icon: Ship },
  { value: 'cog', label: 'Двигатель', icon: Cog },
  { value: 'zap', label: 'Электрика', icon: Zap },
  { value: 'settings2', label: 'Трубы / инженерия', icon: Settings2 },
  { value: 'anchor', label: 'Док / швартовка', icon: Anchor },
  { value: 'clipboard_check', label: 'Инжиниринг / чеклист', icon: ClipboardCheck },
]
