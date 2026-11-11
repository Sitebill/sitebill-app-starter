<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_sitebill_hello_greetings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->string('text', 200);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_sitebill_hello_greetings');
    }
};
