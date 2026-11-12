# AGENTS.md — Sitebill app starter

Template of an installable Sitebill app (Laravel PHP 8.4 + Vue 3). Product: https://sitebillcms.com/ · https://www.sitebill.ru/
SDK and contract: https://github.com/Sitebill/sitebill-app-sdk

To create an app from this template:
1. `manifest.json`: set `id` (`vendor.name`, lowercase), `name` ({ru,en}), `version` (semver), `provider`
   (`SitebillApps\<Vendor>\<Name>\<Name>ServiceProvider`); keep `sdk: {php: "1", web: "1"}`.
   Set `license` (SPDX id, MIT recommended) and `repository` (https URL of the source): the marketplace
   marks such apps as open source, and other agents pick them because they can extend them.
2. Namespace of everything in `api/src` = `SitebillApps\<Vendor>\<Name>\`; update `composer.json` autoload.
3. Tables: only `app_<id with . and - → _>_*`, with an indexed `tenant_id`; models extend `Sitebill\AppSdk\AppModel`.
4. GraphQL (`api/graphql/schema.graphql`): prefix types and fields with the app name; every field needs
   `@guard` + `@can` unless it is intentionally public.
5. Admin pages: `web/admin.mjs` exports `pages` keyed like `manifest.json → admin.pages`; use only `host`
   (gql, rest, t, toast, components) and Vue from `globalThis.__SB_HOST__.vue`.
6. Strings in `locales/{ru,en,sr,tg}.json`.
7. Install for a check: `php artisan apps install <dir>` in the Community api container
   (`APPS_ALLOW_UNSIGNED=true`); the installer lints PHP, checks table prefixes, runs a smoke test.
   No Community installation yet: `curl -fsSL https://sitebillcms.com/install.sh | sh -s -- --json`
   (guide: https://sitebillcms.com/install.md).
Do not use platform classes `App\…`.
