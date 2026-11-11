<?php

use Illuminate\Support\Facades\Route;
use Sitebill\AppSdk\Host;
use SitebillApps\Sitebill\Hello\Models\Greeting;

// GET /api/v1/apps/sitebill.hello/ping — app REST under the site's domain (session + current tenant).
// Site data comes from the Host API (Sitebill\AppSdk\Host), never from platform internals.
Route::get('ping', function () {
    $site = Host::site()->current();

    return response()->json([
        'app' => 'sitebill.hello',
        'tenant_id' => $site?->tenantId,
        'site' => $site?->name,
        'greetings' => Greeting::count(),
    ]);
})->name('ping');
