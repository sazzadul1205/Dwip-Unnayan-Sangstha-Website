<?php
// database/migrations/2026_08_25_100100_create_newsletter_campaign_recipients_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-recipient delivery ledger for a campaign.
 *
 * The campaign row only keeps aggregate counters (sent_count / failed_count),
 * which is not enough to answer "which email failed and why?". This table
 * stores one row per (campaign, subscriber) pair so the Campaign Manager can
 * show exactly who received the newsletter, who it bounced off and the SMTP
 * error message behind every failure.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newsletter_campaign_recipients', function (Blueprint $table) {
            $table->id();

            $table->foreignId('newsletter_campaign_id')
                ->constrained('newsletter_campaigns')
                ->cascadeOnDelete();

            // Kept nullable + not FK-constrained on purpose: a subscriber can be
            // deleted long after the campaign was sent and we must still keep the
            // historical record of who the mail went to.
            $table->unsignedBigInteger('newsletter_subscription_id')->nullable();

            // Denormalised so the ledger survives subscriber deletion/edits.
            $table->string('email');
            $table->string('name')->nullable();

            // pending | sent | failed | bounced | skipped
            $table->string('status')->default('pending');

            // Full failure reason ("550 5.1.1 User unknown") for the manager UI.
            $table->text('error_message')->nullable();

            // Message-ID header of the delivered message (RFC 5322) so a
            // support team can trace the mail in their MTA logs.
            $table->string('message_id')->nullable();

            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('sent_at')->nullable();

            $table->timestamps();

            $table->index(['newsletter_campaign_id', 'status'], 'nlcr_campaign_status_idx');
            $table->index('newsletter_subscription_id');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_campaign_recipients');
    }
};
