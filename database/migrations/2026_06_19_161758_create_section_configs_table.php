<?php
// database/migrations/2026_06_19_161758_create_section_configs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('section_configs', function (Blueprint $table) {
            $table->id();
            $table->string('page_slug', 100);
            $table->string('section_key', 100);
            $table->string('component', 100);
            $table->string('data_table', 100);
            $table->string('data_key', 100);
            $table->string('prop_name', 100);
            $table->integer('display_order')->default(0);
            $table->boolean('is_enabled')->default(true);
            $table->boolean('is_fixed_section')->default(false);
            $table->boolean('is_special_component')->default(false);
            $table->json('custom_props')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('page_slug')->references('slug')->on('pages')->onDelete('cascade');
            $table->index('page_slug');
            $table->index('section_key');
            $table->index('display_order');
            $table->index('is_enabled');
            $table->unique(['page_slug', 'section_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('section_configs');
    }
};
