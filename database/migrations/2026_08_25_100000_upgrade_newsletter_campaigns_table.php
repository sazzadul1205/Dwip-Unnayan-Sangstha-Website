<?php
// database/migrations/2026_08_25_100000_upgrade_newsletter_campaigns_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Upgrades the newsletter campaign table so a campaign can behave like a
 * real ESP (Mailchimp / SendGrid) record instead of just a subject + body:
 *
 *  - draft / scheduled lifecycle
 *  - envelope control (From name, From address, Reply-To, preview text)
 *  - audience targeting (all active / filtered / explicit selection)
 *  - the exact authored HTML kept for reference, copy & re-use
 *  - richer counters (opened / clicked / bounced)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('newsletter_campaigns', function (Blueprint $table) {
            // ---- Content / envelope -------------------------------------
            $table->text('preview_text')->nullable()->after('subject')
                ->comment('Grey text shown by mail clients next to the subject');

            $table->string('from_name')->nullable()->after('preview_text');
            $table->string('from_email')->nullable()->after('from_name');
            $table->string('reply_to')->nullable()->after('from_email');

            // The exact HTML the admin authored/stored for this campaign so it
            // can be reviewed, copied, exported or re-sent later.
            $table->longText('html_content')->nullable()->after('content')
                ->comment('Stored copy of the authored HTML body');

            // ---- Audience ------------------------------------------------
            // all_active | filtered | selected
            $table->string('audience_type')->default('selected')->after('html_content');
            $table->json('audience_meta')->nullable()->after('audience_type')
                ->comment('Filter definition (status, source, joined window, ids)');

            // ---- Counters ------------------------------------------------
            $table->unsignedInteger('open_count')->default(0)->after('failed_count');
            $table->unsignedInteger('click_count')->default(0)->after('open_count');
            $table->unsignedInteger('bounced_count')->default(0)->after('click_count');

            // ---- Lifecycle -----------------------------------------------
            $table->timestamp('scheduled_at')->nullable()->after('started_at');
        });

        // "status" currently holds pending|processing|completed|failed. Drafts
        // are stored as a normal row with status = draft, so the extra states
        // do not need a schema change (ENUM is avoided for portability).
    }

    public function down(): void
    {
        Schema::table('newsletter_campaigns', function (Blueprint $table) {
            $table->dropColumn([
                'preview_text',
                'from_name',
                'from_email',
                'reply_to',
                'html_content',
                'audience_type',
                'audience_meta',
                'open_count',
                'click_count',
                'bounced_count',
                'scheduled_at',
            ]);
        });
    }
};
