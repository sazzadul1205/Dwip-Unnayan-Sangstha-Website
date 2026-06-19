<?php
// database/migrations/2026_06_19_161934_create_shared_data_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shared_data', function (Blueprint $table) {
            $table->id();
            $table->string('type', 50)->unique();
            $table->json('data');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('type');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_data');
    }
};
