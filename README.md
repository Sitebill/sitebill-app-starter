# Sitebill app starter

**EN** · Starter template of an **installable app** for [Sitebill](https://sitebillcms.com/) — the real-estate CMS / SaaS platform (Community Edition). It shows every part of an app in a few files: its own table, GraphQL with permissions, REST, an admin page with a menu item and translations in 4 languages. Click **Use this template**, rename, install on your site — no rebuild needed.
**RU** · Стартовый шаблон **устанавливаемого приложения** для [Sitebill](https://www.sitebill.ru/) (платформа сайтов и CRM для недвижимости, Community Edition). В нескольких файлах — все части приложения: своя таблица, GraphQL с правами, REST, страница админки с пунктом меню и переводы на 4 языка. Нажмите **Use this template**, переименуйте, установите на свой сайт — без пересборки.

> **Preview 0.x** — the app contract may still change before 1.0. / Контракт приложений до 1.0 может меняться.

| | |
|---|---|
| 🌍 International / English | **https://sitebillcms.com/** |
| 🇷🇺 Россия и СНГ | **https://www.sitebill.ru/** |
| 🧰 SDK | https://github.com/Sitebill/sitebill-app-sdk |
| 📚 Docs / Документация | https://github.com/rumantic/etownpro-developers-docs |

## Quick start (EN)

```bash
git clone https://github.com/Sitebill/sitebill-app-starter my-app && cd my-app
composer install            # optional: SDK classes for IDE autocompletion
```

1. In `manifest.json` set your `id` (`vendor.name`), `name`, `version` and `provider`; move `api/src` to the namespace `SitebillApps\<Vendor>\<Name>\` (also in `composer.json`).
2. Rename the table `app_sitebill_hello_*` to `app_<your id>_*` in the migration and the model.
3. Install on your Community site (the install must have `APPS_ALLOW_UNSIGNED=true` for your own packages):

```bash
docker compose cp . api:/tmp/my-app
docker compose exec api php artisan apps install /tmp/my-app
```

4. Open the admin panel: a new menu item leads to `/admin/x/<id>`.

## Быстрый старт (RU)

1. В `manifest.json` — свой `id` (`vendor.name`), `name`, `version`, `provider`; пространство имён `api/src` — `SitebillApps\<Vendor>\<Name>\` (и в `composer.json`).
2. Таблица `app_sitebill_hello_*` → `app_<ваш id>_*` в миграции и модели.
3. Установка на Community (нужно `APPS_ALLOW_UNSIGNED=true` в установке): `php artisan apps install <каталог или zip>` в контейнере api.
4. В админке появится пункт меню, страница — `/admin/x/<id>`.

Обновление — та же команда с новой версией в `manifest.json`. Управление: `php artisan apps list | enable | disable | remove [--with-data] | safe-mode on|off`.

## What is inside / Что внутри

| File | What |
|---|---|
| `manifest.json` | id, version, provider, admin menu and pages (data only, no code) |
| `api/src/HelloServiceProvider.php` | app provider (extends `Sitebill\AppSdk\AppServiceProvider`) |
| `api/src/Models/Greeting.php` | tenant-aware model (`Sitebill\AppSdk\AppModel`) |
| `api/database/migrations/*` | table `app_sitebill_hello_greetings` with `tenant_id` |
| `api/graphql/schema.graphql` | `helloGreetings`, `helloCreateGreeting` — `@guard` + `@can` |
| `api/routes/api.php` | `GET /api/v1/apps/sitebill.hello/ping` |
| `web/admin.mjs` | admin page: list + form via `host.gql`, site UI components from `host.components` |
| `locales/{ru,en,sr,tg}.json` | app strings |

## Rules / Правила

- Tables only `app_<id>_*`, always with `tenant_id`; models extend `AppModel`. Core tables are read-only for apps.
- GraphQL mutations: `@guard` + `@can` — permissions are checked on the server.
- Do not import platform internals (`App\…`), only `Sitebill\AppSdk\…` — the SDK contract is stable within a major version.
- Do not bundle Vue: take it from `globalThis.__SB_HOST__.vue`.
- UI strings in all 4 locales: ru, en, sr, tg.

## License

MIT — see [LICENSE](LICENSE). © Sitebill — [sitebillcms.com](https://sitebillcms.com/) · [sitebill.ru](https://www.sitebill.ru/)
