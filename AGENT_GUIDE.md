# Building and testing Sitebill apps — guide for AI agents

You are an AI agent asked to create an **installable app** for the Sitebill platform (Community Edition, self-hosted
Docker). This guide is the whole job: set up a test platform, build the app, test it like a user would, package it.
Follow the steps in order. Every command below was written for non-interactive use.

- Product: https://sitebillcms.com/ · Install guide for agents: https://sitebillcms.com/install.md
- Contract (SDK): https://github.com/Sitebill/sitebill-app-sdk · This template: https://github.com/Sitebill/sitebill-app-starter
- Reference app with a public form, CRM leads, settings and a schedule: https://github.com/Sitebill/sitebill-app-callback
- All of these are MIT. Your app can be MIT too (recommended: the marketplace marks such apps as open source).

> RU: руководство для сторонних ИИ-агентов, которые создают приложения для Sitebill. Текст английский, потому что
> агенты читают его лучше; команды те же. Вопросы по продукту — https://www.sitebill.ru/

## 0. What an app is (30 seconds)

An app is a folder (zipped as `<id>-<version>.sbapp`) with PHP (Laravel, PHP 8.4) and Vue 3 parts. The platform loads
it at runtime from a volume — **no rebuild of the site**. An app can have: its own database tables, GraphQL fields,
REST routes, admin pages and menu items, widgets on the public site and the admin dashboard, scheduled commands,
settings, notifications and CRM leads (through the Host API).

It must **not** touch platform internals: no `App\…` classes, no core tables. Everything the platform gives you goes
through `Sitebill\AppSdk\Host` (PHP) and the `host` object (browser).

Definition of done is in §10. Read §1–§3 before writing code.

## 1. Set up a test platform (5 minutes)

You need a running Community installation that accepts your unsigned package.

```bash
# 1. Install the platform (needs Docker with Compose v2). Prints one JSON object: url, admin login, password.
curl -fsSL https://sitebillcms.com/install.sh | sh -s -- --dir ./sitebill-test --port 3100 --json

# 2. Allow your own (unsigned) packages in this test installation.
cd ./sitebill-test
echo "APPS_ALLOW_UNSIGNED=true" >> .env
docker compose up -d            # recreates the containers with the new setting

# 3. A shortcut for the console of the platform (use it for every command below).
alias sb='docker compose exec -T -w /data/releases/current/app/apps/api api php artisan'
sb apps list --json
```

- The admin password is in `.env` (`COMMUNITY_ADMIN_PASSWORD`), the login is `admin@example.com` unless you passed `--email`.
- Use a dedicated test installation. Do **not** test against someone else's live site.
- On Windows use WSL or Git Bash. If `-w` paths get mangled in Git Bash, run `export MSYS_NO_PATHCONV=1`.
- The platform updates itself from sitebillcms.com; to freeze the version while you work set `COMMUNITY_AUTO_UPDATE=false` in `.env`.

## 2. Create the app from the template

```bash
git clone https://github.com/Sitebill/sitebill-app-starter my-app && cd my-app
rm -rf .git && git init           # your own history; the template has its own
```

Rename — **all of these must agree** (the checker in §4 catches most mismatches):

| Where | What to change |
|---|---|
| `manifest.json` → `id` | `vendor.name`, lowercase letters, digits, dashes, exactly one dot. Example: `acme.price-alerts` |
| `manifest.json` → `provider` | `SitebillApps\<Vendor>\<Name>\<Name>ServiceProvider` (StudlyCase), e.g. `SitebillApps\Acme\PriceAlerts\PriceAlertsServiceProvider` |
| `api/src/*` | `namespace SitebillApps\<Vendor>\<Name>;` in every PHP file; class names |
| `composer.json` → `autoload.psr-4` | the same namespace → `api/src/` |
| Migration + model | table name `app_<id with . and - replaced by _>_<thing>`, e.g. `app_acme_price_alerts_rules` |
| `api/graphql/schema.graphql` | type/field names prefixed with the app name (`priceAlertsRules`), model class strings updated |
| `web/admin.mjs`, `web/site.mjs` | GraphQL documents, component names that appear in `manifest.json` |
| `locales/{ru,en,sr,tg}.json` | your strings; **all four files with identical keys** |
| `manifest.json` → `license`, `repository` | `MIT` (or another SPDX id) and the https URL of your public repo |
| `manifest.json` → `version` | semver `X.Y.Z`; bump it on every change you reinstall (§5) |

## 3. The contract: what you can and cannot do

### Package layout

```
manifest.json                  # data only, no code
api/src/                       # PHP, namespace SitebillApps\<Vendor>\<Name>\
api/database/migrations/       # only tables app_<id>_*, always with an indexed tenant_id
api/graphql/schema.graphql     # extend type Query / Mutation
api/routes/api.php             # REST under /api/v1/apps/<id>/
api/lang/                      # optional server-side translations
web/admin.mjs                  # admin pages and admin widgets: export const pages / widgets
web/site.mjs                   # public site widgets: export const widgets
locales/{ru,en,sr,tg}.json     # UI strings, identical keys
```

Limits: up to 3000 files and 64 MB unpacked. File names: Latin letters, digits, `_ - .` only.

### manifest.json reference

```jsonc
{
  "id": "acme.price-alerts",
  "name": { "ru": "…", "en": "Price alerts", "sr": "…", "tg": "…" },
  "version": "0.1.0",
  "vendor": { "name": "Acme", "url": "https://acme.example/" },
  "license": "MIT",
  "repository": "https://github.com/acme/sitebill-app-price-alerts",
  "description": { "ru": "…", "en": "…" },
  "sdk": { "php": "1", "web": "1" },
  "requires": { "host": ">=1.1" },
  "provider": "SitebillApps\\Acme\\PriceAlerts\\PriceAlertsServiceProvider",
  "permissions": ["crm.leads.create", "properties.read", "notifications.send"],   // what the app uses from the Host API
  "admin": {
    "menu": [{ "label": { "en": "Price alerts" }, "icon": "i-lucide-bell", "path": "" }],
    "pages": ["", "settings"],                     // keys of `pages` exported by web/admin.mjs ('' = home, /admin/x/<id>/)
    "widgets": { "admin.dashboard": "AlertsStats" }
  },
  "site": { "widgets": { "property.detail": "AlertButton", "global": "FloatingBadge", "home.sections": "TopAlerts" } },
  "web": { "admin": "web/admin.mjs", "site": "web/site.mjs" },
  "schedule": [{ "command": "acme-price-alerts:cleanup", "cron": "30 3 * * *" }]
}
```

- Widget slots: site `property.detail` (context `{ propertyId }`), `home.sections`, `global`; admin `admin.dashboard`.
  Widgets render in the browser only; their component names are the keys in the `widgets` export.
- `schedule[].command` must start with your id with `.` → `-` plus a colon (`acme-price-alerts:…`); cron has 5 fields.
- Keep `requires.host` (`>=1.1`) so the package is not installed on a platform that is too old.

### Hard rules (the installer rejects or the checker warns)

1. **Tables only `app_<id>_*`**, each with an indexed `tenant_id`; models extend `Sitebill\AppSdk\AppModel`
   (it fills and filters `tenant_id` automatically). Core tables are read-only through the Host API.
2. **GraphQL permissions are checked on the server.** Every mutation and every admin query needs `@guard` **and**
   `@can(ability: "admin", model: "Tenant")` (or another explicit ability). A bare `@guard` means "any registered
   visitor". No directive at all means "anonymous". Public fields must be public on purpose.
3. **No `App\…` classes**, no `use App\…`. Only `Sitebill\AppSdk\…`.
4. **Namespace** of every PHP file starts with the provider's `SitebillApps\<Vendor>\<Name>`.
5. **Vue is shared:** `const { defineComponent, h, ref } = globalThis.__SB_HOST__.vue`. Never bundle your own Vue and never
   write `import … from 'package'` in `web/*.mjs` (bare imports do not resolve in the browser). Relative imports of your own files work.
6. **No `v-html` / `innerHTML`** with data from users or APIs. Render text.
7. **Strings in 4 locales** (`ru`, `en`, `sr`, `tg`) with identical keys. Use `host.t('key')` in the browser.
8. **Public REST is anonymous:** add a rate limit and a honeypot field if it accepts input (see the callback app).
9. **Console commands and queue jobs have no site bound.** Wrap per-site work: `Host::site()->runAs($tenantId, fn () => …)`.
   Without it data calls throw.
10. **Secrets** (API keys) go through `Host::settings()->setSecret()/secret()` (encrypted); never in code, manifest or logs.
11. An exception in `registerApp()`/`bootApp()` marks the app *broken* — the site and other apps keep working. Do not
    swallow exceptions to hide this; fix them.

### Host API (PHP)

```php
use Sitebill\AppSdk\Host;

Host::site()->current();                                  // SiteInfo: tenantId, name, url, locale, locales (null without a site)
Host::site()->runAs($tenantId, fn () => …);               // bind a site in console/queue code
Host::settings()->get($appId, 'key', $default);           // per-site app settings: get/set/forget/all
Host::settings()->setSecret($appId, 'api_key', $value);   // encrypted at rest; read with secret()
Host::crm()->createLead(['name' => …, 'phone' => …, 'message' => …, 'property_id' => …, 'source' => 'acme.alerts']);
Host::crm()->findOrCreateContact([...]);                  // deduplicated by phone/e-mail
Host::properties()->find($id); Host::properties()->latest(10);   // read-only listings with public URLs
Host::notifier()->notifyAdmins($appId, $title, $body, $url);    // bell / e-mail / Telegram / Max per each admin's preferences
```

### Browser `host` object

`host.gql(query, vars)` (returns `data`), `host.rest(path, {method, body})` (→ `/api/v1/apps/<id>/<path>`, with the
admin's session and CSRF), `host.t(key)`, `host.toast(text, 'success'|'error')`, `host.localePath(path)`,
`host.formatDate(iso)`, `host.locale`, `host.user`, and Nuxt UI components in `host.components`
(`UButton UInput UTextarea UBadge UIcon UModal UCard USwitch USelect`). Pages receive `{ host }`, widgets `{ host, context }`.
Look at `web/admin.mjs` in this template — it is a complete working page without a build step.

## 4. Develop: the inner loop

```bash
# in the app folder
npx --package @sitebill/app-sdk sitebill-app check     # static checks, same rules as the installer
```

`check` verifies: manifest, paths, `php -l` on every PHP file (pass `--php /path/to/php` if `php` is not on PATH),
namespaces, `app_<id>_` table prefix, `@guard`+`@can` on mutations, four locales in sync, widgets and bundles referenced
by the manifest, schedule. **Errors block installation, warnings are bugs you should fix too.** Run it after every change.

```bash
# build the package and install it into the test platform (--force reinstalls the same version)
cd ../my-app && npx --package @sitebill/app-sdk sitebill-app pack         # → <id>-<version>.sbapp
cd ../sitebill-test
docker compose cp ../my-app/<id>-<version>.sbapp api:/tmp/app.sbapp
sb apps install /tmp/app.sbapp --force --json
```

(Installing a plain folder also works on platform versions ≥ 1.4.1: `docker compose cp ../my-app api:/tmp/my-app` and
`sb apps install /tmp/my-app`. In Git Bash on Windows give `docker compose cp` a relative path or `D:/…`, not `/d/…`.)

The installer lints PHP, validates the package, runs the migrations and a smoke boot of the app; any failure cancels the
install and prints the reason in `errors`. Or let the CLI do the copy-install loop on every save:

```bash
npx --package @sitebill/app-sdk sitebill-app dev --compose ../sitebill-test/docker-compose.yml     # --once installs one time
```

After a successful install: `sb apps list --json` shows the app with status `ok`. Status `broken` means boot failed —
read `docker compose logs api --tail 100`. Console commands of your app are available as `sb <your-command>`.

## 5. Test it like a user, not just like a compiler

Passing `check` and `apps install` proves the package loads. It does **not** prove the app works. Do all of the following
and keep the evidence (command + output) for your final report.

### 5.1 GraphQL as the admin (and as a guest)

The site API accepts a session login. Use a cookie jar:

```bash
BASE=http://localhost:3100                      # the url from the installer JSON
PASS=$(grep ^COMMUNITY_ADMIN_PASSWORD .env | cut -d= -f2)
JAR=$(mktemp)
xsrf() { awk '$6=="XSRF-TOKEN"{print $7}' "$JAR" | sed 's/%3D/=/g'; }     # the token rotates: read it before every call
hdr=(-H 'Accept: application/json' -H 'Content-Type: application/json' -H "Origin: $BASE" -H "Referer: $BASE/")

curl -s -c "$JAR" $BASE/sanctum/csrf-cookie -o /dev/null
curl -s -b "$JAR" -c "$JAR" -H "X-XSRF-TOKEN: $(xsrf)" "${hdr[@]}"      -d "{\"email\":\"admin@example.com\",\"password\":\"$PASS\"}" $BASE/api/v1/login        # → {"ok":true}

gql() { curl -s -b "$JAR" -c "$JAR" -H "X-XSRF-TOKEN: $(xsrf)" "${hdr[@]}" -d "$1" $BASE/graphql; }
gql '{"query":"{ helloGreetings { id text } }"}'                                    # admin: {"data":{...}}
gql '{"query":"mutation { helloCreateGreeting(text: \"hi\") { id text } }"}'        # admin mutation
```

If login answers `CSRF token mismatch`, the token has a stray character (do not post-process it with Python on Windows:
it appends ``) or the port is not in `SANCTUM_STATEFUL_DOMAINS` in `.env` (the installer sets it for `--port`).

Then repeat the same calls **without** the cookie jar (plain `curl -d … $BASE/graphql`). Every admin field and mutation must answer with an authorization
error, not with data. This is the most common mistake in generated apps.

### 5.2 Public REST and rate limits

```bash
curl -s $BASE/api/v1/apps/<your.id>/ping
```
Anonymous endpoints must validate input, answer 422 for bad input (not 500), and rate-limit (hit them 30 times fast).

### 5.3 The browser (UI)

Admin pages and widgets are Vue in the browser: a green `check` says nothing about them. Test with a real browser
(Playwright, Chrome DevTools, or any browser tool you have):

1. Open `$BASE/auth/login`, sign in with the admin login and password.
2. Open `$BASE/admin/x/<your.id>` (admin pages), then every path from `manifest.json → admin.pages` (`/admin/x/<id>/<path>`).
3. For site widgets open the page of the slot: a listing page for `property.detail`, the home page for `home.sections`, any page for `global`.
4. Check: the page renders, texts come from locales (no raw keys like `title`), the form works end to end, errors
   show as toasts, the browser console has **no errors** (`Uncaught`, failed imports, 4xx/5xx).
5. Switch the site language (ru/en/sr/tg) and confirm every string translates.

Take screenshots of the working states for the report.

### 5.4 Data and lifecycle

```bash
sb apps install /tmp/my-app --force --json           # reinstall the same version: data must survive
# bump version in manifest.json → 0.1.1, copy, install: the app updates, new migrations run, old data survives
sb apps rollback <your.id> --json                    # back to the previous version, app still works
sb apps disable <your.id>; sb apps enable <your.id>  # menu items and widgets disappear and come back
sb apps remove <your.id> --with-data --json          # files and app_<id>_* tables are gone (check the database)
```

A migration must be **forward-compatible**: the previous version of your code has to keep working on the new schema
(add columns, do not drop or rename in the same release). `down()` is not run by the platform.

### 5.5 Console commands, schedule and queue

Run every command in `manifest.json → schedule` by hand (`sb acme-price-alerts:cleanup`). It must work with **no site
context** (§3 rule 9). Confirm it does not touch other apps' tables.

### 5.6 Multi-site safety by reading

Community has one site, so tenant leaks cannot be reproduced at runtime. Prove isolation by review: every table has
`tenant_id`, every model extends `AppModel`, raw `DB::table()` queries filter by `tenant_id`, no query uses
`withoutGlobalScopes()`.

## 6. Troubleshooting

| Message / symptom | Cause and fix |
|---|---|
| `Пакет без подписи маркетплейса…` / unsigned package | `APPS_ALLOW_UNSIGNED=true` is not set in `.env` or containers were not recreated: `docker compose up -d` |
| `Версия … уже установлена` | add `--force` or bump `version` |
| `приложение работает только с таблицами app_<id>_*` | rename the table in migration and model |
| `Приложение не прошло проверку запуском` | boot failed: read `errors` and `docker compose logs api --tail 100`; usually a wrong namespace/provider or a missing class |
| `Миграции приложения не выполнены` | read the SQL error; tables must be created with `tenant_id`; do not reference core tables |
| status `broken` in `apps list` | exception in `registerApp()`/`bootApp()`; fix, reinstall with `--force`. Platform emergency stop: `sb apps safe-mode on` |
| Menu item missing | `admin.menu` or `admin.pages` not matching keys of `pages`; app disabled; hard-reload the browser |
| Page shows raw keys | missing key in one of the four locale files |
| Widget not rendered | component name in the manifest differs from the key in `widgets`; slot name misspelled; `site.widgets` missing `web.site` |
| GraphQL "Cannot query field" | schema is cached: `sb lighthouse:clear-cache`, then retry; check the prefix and `extend type` |
| 419 / CSRF error in curl | refresh the XSRF token; send the `Origin`/`Referer` headers as in §5.1 |
| Works in `check`, fails in the browser | open the browser console; bare `import … from 'pkg'` or a second copy of Vue are typical |

## 7. Package and publish

```bash
cd my-app
npx --package @sitebill/app-sdk sitebill-app pack      # runs check, writes <id>-<version>.sbapp (zip)
sb apps install /tmp/<id>-<version>.sbapp --force --json   # final proof: install the exact file you ship
```

- Put the source in a public Git repository with `LICENSE` (MIT recommended), `README.md` (what it does, screenshots,
  install command) and the topics `sitebill`, `sitebill-app`.
- Users install the `.sbapp` from **Admin → Apps → Installed apps → Upload your own package** or with
  `sb apps install <file>` (their installation needs `APPS_ALLOW_UNSIGNED=true` for unsigned packages).
- To list the app in the marketplace (signed, one-click install for everyone) follow https://sitebillcms.com/developers —
  the review checks the same rules as this guide.

## 8. Style of work expected from you

- Make the smallest app that does the job. One screen that works beats five that are half done.
- Never invent platform APIs. If you need something the Host API does not offer, say so in your report instead of
  reaching into internals; propose it as an issue in https://github.com/Sitebill/sitebill-app-sdk.
- Keep comments in code in English; UI strings in four languages (machine translation is fine for `sr` and `tg`, but mark it in the report).
- Do not commit secrets, `.env`, or the test platform's data.

## 9. Prompt you can give an agent

```
Build a Sitebill app "<what it does, for whom>". Follow https://raw.githubusercontent.com/Sitebill/sitebill-app-starter/main/AGENT_GUIDE.md
exactly: set up a test platform (§1), start from the starter template (§2), respect the contract (§3),
iterate with `sitebill-app check` (§4), then test as admin, as guest, in a real browser, and through
install / update / rollback / remove (§5). Finish with the .sbapp and a report (§10).
```

## 10. Definition of done and the report you return

Done means **all** of these are true:

- [ ] `sitebill-app check` reports no errors and no warnings.
- [ ] The final `.sbapp` installs on a clean test platform with `apps install … --json` (`status: ok`) and `apps list` shows the app `ok`.
- [ ] Every admin page, widget and public form works in a real browser; the console has no errors; screenshots attached.
- [ ] Guest calls to every admin GraphQL field and mutation are rejected (evidence: curl output).
- [ ] Public endpoints validate input and are rate-limited.
- [ ] Update to a new version keeps data; rollback works; `remove --with-data` cleans files and tables.
- [ ] All four locale files have identical keys; no raw keys visible in any language.
- [ ] No `App\…` classes, no tables outside `app_<id>_*`, no secrets in the repo.
- [ ] `README.md`, `LICENSE`, `manifest.json` (`license`, `repository`, `version`) are filled in.

Final report (plain text): what the app does; the id and version; the list of files; for each item above the command you
ran and its result; screenshots; what you did **not** test and why; known limitations.
