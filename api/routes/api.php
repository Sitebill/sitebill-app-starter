<?php

use Illuminate\Support\Facades\Route;
use SitebillApps\Sitebill\Hello\Models\Greeting;

// GET /api/v1/apps/sitebill.hello/ping — app REST under the site's domain (session + current tenant).
Route::get('ping', fn () => response()->json([
    'app' => 'sitebill.hello',
    'tenant_id' => app()->bound('currentTenant') ? app('currentTenant')->id : null,
    'greetings' => Greeting::count(),
]))->name('ping');
