// Site widgets of the starter app. Rendered in the browser only, inside widget slots of the site.
// Each widget gets `host` (see AppHost in @sitebill/app-sdk) and `context` (data of the place).
const { defineComponent, h, ref, onMounted } = globalThis.__SB_HOST__.vue

// Slot "property.detail": below the listing card, context = { propertyId }.
const PropertyHello = defineComponent({
  name: 'HelloPropertyWidget',
  props: { host: { type: Object, required: true }, context: { type: Object, default: () => ({}) } },
  setup(props) {
    const { host } = props
    const site = ref(null)
    // Public REST of the app works for guests too (the platform adds the site and session).
    onMounted(async () => {
      try {
        site.value = await host.rest('ping')
      } catch {
        site.value = null
      }
    })

    return () => h('div', { class: 'rounded-xl border border-(--ui-border) p-4 text-sm' }, [
      h('div', { class: 'font-medium' }, host.t('widget_title')),
      h('div', { class: 'text-muted' }, `${host.t('widget_property')} #${props.context.propertyId ?? '—'}`),
      site.value ? h('div', { class: 'text-xs text-muted mt-1' }, `${site.value.site} · ${host.t('widget_greetings')}: ${site.value.greetings}`) : null,
    ])
  },
})

// Keys = component names from manifest.json → site.widgets.
export const widgets = { PropertyHello }
