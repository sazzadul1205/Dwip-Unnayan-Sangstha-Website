<?php
// database/migrations/2026_06_19_161910_custom_section_data_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_section_data', function (Blueprint $table) {
            $table->id();
            $table->string('page_slug', 100);
            $table->string('section_key', 100);
            $table->json('data');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('page_slug')->references('slug')->on('pages')->onDelete('cascade');
            $table->index('page_slug');
            $table->index('section_key');
            $table->index('is_active');
            $table->unique(['page_slug', 'section_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_section_data');
    }
};
