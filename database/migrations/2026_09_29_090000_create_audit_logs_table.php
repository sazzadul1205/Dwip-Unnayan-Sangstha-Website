<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Queryable audit trail.
 *
 * Complements (does not replace) the file-based SimpleLogger: that is a
 * human-readable log the admin log viewer tails, while this table is the
 * structured, filterable, diff-capable record of who changed what.
 *
 * Rows are written by the AuditMutations middleware and the auth event
 * listeners, so every mutating controller is covered without each
 * controller having to opt in.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // created | updated | deleted | restored | force_deleted
            // login | logout | failed_login | denied | exported | pruned
            $table->string('event', 40)->index();

            // Who did it. Kept denormalised so the trail survives a
            // deleted user, plus a nullable FK for joins.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();

            // What was changed, as a morph reference (App\Models\Blog etc).
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();

            $table->text('description');

            // Request context.
            $table->string('route_name')->nullable();
            $table->string('method', 10);
            $table->string('url', 500)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->unsignedSmallInteger('status_code')->nullable();

            // Before / after, already redacted by AuditLogger.
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
            $table->index(['user_id', 'created_at']);
            $table->index(['event', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
