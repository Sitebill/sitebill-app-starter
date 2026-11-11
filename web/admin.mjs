// Admin pages of the starter app. Plain ESM, no build step needed: Vue is shared with the site
// (globalThis.__SB_HOST__.vue) — never bundle your own copy. Data and UI components come only
// from `host` (see AppHost in @sitebill/app-sdk). A bundler preset for .vue files is coming in the SDK.
const { defineComponent, h, ref, onMounted } = globalThis.__SB_HOST__.vue

const LIST = 'query HelloGreetings { helloGreetings { id text created_at } }'
const CREATE = 'mutation HelloCreate($text: String!) { helloCreateGreeting(text: $text) { id text created_at } }'

const Home = defineComponent({
  name: 'HelloHome',
  props: { host: { type: Object, required: true } },
  setup(props) {
    const { host } = props
    const { UButton, UInput } = host.components
    const items = ref([])
    const text = ref('')
    const busy = ref(false)
    const ping = ref(null)

    async function load() {
      const data = await host.gql(LIST)
      items.value = data.helloGreetings
    }
    async function add() {
      if (!text.value.trim()) return
      busy.value = true
      try {
        await host.gql(CREATE, { text: text.value.trim() })
        text.value = ''
        await load()
        host.toast(host.t('saved'))
      } catch (e) {
        host.toast(String(e?.message ?? e), 'error')
      } finally {
        busy.value = false
      }
    }
    onMounted(async () => {
      await load()
      ping.value = await host.rest('ping')
    })

    return () => h('div', { class: 'space-y-4 max-w-xl' }, [
      h('h1', { class: 'text-2xl font-semibold' }, host.t('title')),
      h('p', { class: 'text-sm text-muted' }, host.t('about')),
      h('form', { class: 'flex gap-2', onSubmit: (e) => { e.preventDefault(); add() } }, [
        h(UInput, { modelValue: text.value, 'onUpdate:modelValue': (v) => { text.value = v }, placeholder: host.t('placeholder'), class: 'flex-1' }),
        h(UButton, { type: 'submit', loading: busy.value, label: host.t('add') }),
      ]),
      items.value.length
        ? h('ul', { class: 'divide-y divide-(--ui-border) rounded-xl border border-(--ui-border)' },
            items.value.map(g => h('li', { key: g.id, class: 'px-4 py-2 flex justify-between gap-4' }, [
              h('span', g.text),
              h('span', { class: 'text-xs text-muted' }, host.formatDate(g.created_at)),
            ])))
        : h('p', { class: 'text-sm text-muted' }, host.t('empty')),
      ping.value ? h('p', { class: 'text-xs text-muted' }, `REST ping: tenant ${ping.value.tenant_id}, ${ping.value.greetings}`) : null,
    ])
  },
})

// Admin dashboard widget (slot "admin.dashboard" in manifest.json → admin.widgets).
const DashboardHello = defineComponent({
  name: 'HelloDashboardWidget',
  props: { host: { type: Object, required: true }, context: { type: Object, default: () => ({}) } },
  setup(props) {
    const { host } = props
    const count = ref(null)
    onMounted(async () => {
      const data = await host.gql(LIST)
      count.value = data.helloGreetings.length
    })

    return () => h('div', { class: 'rounded-2xl border border-(--ui-border) bg-(--ui-bg) p-5' }, [
      h('div', { class: 'text-sm text-muted' }, host.t('widget_dashboard')),
      h('div', { class: 'text-2xl font-semibold mt-1' }, count.value ?? '…'),
    ])
  },
})

// Key = page path relative to /admin/x/<app-id>/ (must match manifest.json → admin.pages).
export const pages = { '': Home }

// Keys = component names from manifest.json → admin.widgets.
export const widgets = { DashboardHello }
