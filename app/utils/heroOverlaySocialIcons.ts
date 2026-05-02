import SvgIcon from '@jamescoyle/vue-icon'
import { mdiLinkedin } from '@mdi/js'
import { Facebook, Instagram, Link2, Mail, Phone, Send } from 'lucide-vue-next'
import { defineComponent, h, type Component } from 'vue'

/** Обёртка для MDI-иконок через @jamescoyle/vue-icon. */
function mdiIcon(path: string): Component {
  return defineComponent({
    name: 'MdiIconWrapper',
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => h(SvgIcon as Component, { type: 'mdi', path, size: 24, ...attrs })
    },
  })
}

/** Текстовая заглушка для иконок без SVG-аналога. */
function textIcon(label: string): Component {
  return defineComponent({
    name: `OverlayTextIcon${label.replace(/\W+/g, '')}`,
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () =>
        h(
          'span',
          {
            ...attrs,
            class: [
              'inline-flex items-center justify-center text-[0.5em] font-bold leading-none tracking-tight',
              attrs.class,
            ],
          },
          label,
        )
    },
  })
}

const IconVk: Component = defineComponent({
  name: 'IconVk',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () =>
      h('svg', { viewBox: '0 0 80 80', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', ...attrs }, [
        h('g', { 'clip-path': 'url(#vk-clip)' }, [
          h('path', {
            'fill-rule': 'evenodd',
            'clip-rule': 'evenodd',
            d: 'M5.57715 6.06787C0.00927734 11.6358 0.00927734 20.5971 0.00927734 38.5198V41.6881C0.00927734 59.6108 0.00927734 68.5722 5.57715 74.1401C11.145 79.7079 20.1064 79.7079 38.0291 79.7079H41.1974C59.1201 79.7079 68.0814 79.7079 73.6493 74.1401C79.2172 68.5722 79.2172 59.6108 79.2172 41.6881V38.5198C79.2172 20.5971 79.2172 11.6358 73.6493 6.06787C68.0814 0.5 59.1201 0.5 41.1974 0.5H38.0291C20.1064 0.5 11.145 0.5 5.57715 6.06787ZM13.3758 24.5926C13.8048 45.1866 24.1017 57.5628 42.1545 57.5628H43.1778V45.7806C49.8115 46.4407 54.8277 51.2922 56.8408 57.5628H66.214C63.6398 48.1899 56.8737 43.0084 52.6494 41.0282C56.8737 38.5859 62.8144 32.6453 64.2335 24.5926H55.7184C53.8703 31.1272 48.3923 37.0678 43.1778 37.6288V24.5926H34.6627V47.4308C29.3822 46.1107 22.7157 39.7081 22.4186 24.5926H13.3758Z',
            fill: 'currentColor',
          }),
        ]),
        h('defs', {}, [
          h('clipPath', { id: 'vk-clip' }, [h('rect', { width: '80', height: '80', fill: 'white' })]),
        ]),
      ])
  },
})

const IconMax: Component = defineComponent({
  name: 'IconMax',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () =>
      h('svg', { viewBox: '0 0 80 80', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', ...attrs }, [
        h('path', {
          'fill-rule': 'evenodd',
          'clip-rule': 'evenodd',
          d: 'M40.6569 70.2662C34.6563 70.2662 31.8678 69.3902 27.0206 65.8862C23.9546 69.8282 14.2458 72.9089 13.8223 67.6382C13.8223 63.6818 12.9463 60.3384 11.9535 56.6884C10.771 52.1916 9.42776 47.1838 9.42776 39.9278C9.42776 22.5977 23.6481 9.56 40.4963 9.56C57.3591 9.56 70.5721 23.2401 70.5721 40.0883C70.6286 56.676 57.2445 70.1778 40.6569 70.2662ZM40.9051 24.5394C32.7 24.1161 26.3052 29.7954 24.889 38.7014C23.721 46.0743 25.7942 55.0532 27.5608 55.5204C28.4076 55.7248 30.5392 54.002 31.8678 52.6734C34.0647 54.1911 36.6229 55.1026 39.2846 55.316C47.7864 55.725 55.051 49.2525 55.6218 40.76C55.9541 32.2494 49.4082 25.0411 40.9051 24.5541V24.5394Z',
          fill: 'currentColor',
        }),
      ])
  },
})

/** Иконки для полосы hero на главной (соцсети и базовые контакты). */
export const heroOverlaySocialIcons: Record<string, Component> = {
  facebook: Facebook,
  instagram: Instagram,
  telegram: Send,
  phone: Phone,
  mail: Mail,
  link: Link2,
  linkedin: mdiIcon(mdiLinkedin),
  vk: IconVk,
  max: IconMax,
}

/** Опции для админки: value → ключ в `heroOverlaySocialIcons`. */
export const heroOverlaySocialIconOptions: { value: string; label: string; icon: Component }[] = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'telegram', label: 'Telegram', icon: Send },
  { value: 'linkedin', label: 'LinkedIn', icon: heroOverlaySocialIcons.linkedin! },
  { value: 'vk', label: 'VK', icon: IconVk },
  { value: 'max', label: 'MAX', icon: IconMax },
  { value: 'phone', label: 'Телефон', icon: Phone },
  { value: 'mail', label: 'Почта', icon: Mail },
  { value: 'link', label: 'Ссылка', icon: Link2 },
]

export { textIcon }
