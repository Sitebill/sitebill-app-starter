<?php

namespace SitebillApps\Sitebill\Hello;

use Sitebill\AppSdk\AppServiceProvider;

/**
 * The app's service provider (manifest.json → "provider").
 * Migrations, GraphQL schema, REST routes and translations are wired by the platform by convention
 * (api/database/migrations, api/graphql/schema.graphql, api/routes/api.php, api/lang),
 * so register only what is special to your app here: policies, event listeners, bot scenarios…
 */
final class HelloServiceProvider extends AppServiceProvider
{
    protected function bootApp(): void
    {
    }
}
