import { Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-vue-next'
import { defineComponent, h, type Component } from 'vue'
import type { ContactQuickIconKey } from '~/types'

function textIcon(label: string): Component {
  return defineComponent({
    name: `ContactTextIcon${label.replace(/\W+/g, '')}`,
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () =>
        h(
          'span',
          {
            ...attrs,
            class: [
              'inline-flex items-center justify-center text-[0.56em] font-bold leading-none tracking-tight',
              attrs.class,
            ],
          },
          label,
        )
    },
  })
}

export const contactQuickIcons: Record<ContactQuickIconKey, Component> = {
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
  clock: Clock,
  link: ExternalLink,
  linkedin: textIcon('in'),
  vk: textIcon('VK'),
  max: textIcon('MAX'),
}

export const contactQuickIconOptions = [
  { value: 'phone', label: 'Телефон', icon: contactQuickIcons.phone },
  { value: 'mail', label: 'Почта', icon: contactQuickIcons.mail },
  { value: 'map-pin', label: 'Адрес', icon: contactQuickIcons['map-pin'] },
  { value: 'clock', label: 'Время', icon: contactQuickIcons.clock },
  { value: 'link', label: 'Ссылка', icon: contactQuickIcons.link },
  { value: 'linkedin', label: 'LinkedIn', icon: contactQuickIcons.linkedin },
  { value: 'vk', label: 'VK', icon: contactQuickIcons.vk },
  { value: 'max', label: 'MAX', icon: contactQuickIcons.max },
] satisfies { value: ContactQuickIconKey; label: string; icon: Component }[]
