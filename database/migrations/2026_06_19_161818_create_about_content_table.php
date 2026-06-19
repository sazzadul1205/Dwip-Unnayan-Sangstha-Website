<?php
// database/migrations/2026_06_19_161818_create_about_content_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('about_content', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('title', 255);
            $table->string('type', 50);
            $table->text('content')->nullable();
            $table->longText('full_content')->nullable();
            $table->string('image', 500)->nullable();
            $table->string('icon', 255)->nullable();
            $table->string('bg_color', 50)->nullable();
            $table->string('btn_text', 255)->nullable();
            $table->string('btn_link', 500)->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->json('tags')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('slug');
            $table->index('type');
            $table->index('is_active');
            $table->index('display_order');
            $table->index('is_featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('about_content');
    }
};
