<?php
// database/migrations/2026_07_23_create_newsletter_subscriptions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newsletter_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('name')->nullable();
            $table->string('token')->unique()->nullable(); // For unsubscribe links
            $table->string('status')->default('subscribed'); // subscribed, unsubscribed, bounced
            $table->timestamp('subscribed_at')->useCurrent();
            $table->timestamp('unsubscribed_at')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('source')->default('website'); // website, footer, popup, etc.
            $table->timestamps();

            // Indexes for performance
            $table->index('email');
            $table->index('status');
            $table->index('subscribed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscriptions');
    }
};
