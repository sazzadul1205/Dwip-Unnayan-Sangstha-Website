<?php
// app/Models/NewsletterCampaign.php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsletterCampaign extends Model
{
    /* ==========================================
     | LIFECYCLE STATES
     |========================================== */

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    /** Audience targeting modes. */
    public const AUDIENCE_ALL_ACTIVE = 'all_active';
    public const AUDIENCE_FILTERED = 'filtered';
    public const AUDIENCE_SELECTED = 'selected';

    protected $fillable = [
        'subject',
        'preview_text',
        'from_name',
        'from_email',
        'reply_to',
        'content',
        'html_content',
        'audience_type',
        'audience_meta',
        'status',
        'total_subscribers',
        'sent_count',
        'failed_count',
        'open_count',
        'click_count',
        'bounced_count',
        'created_by',
        'batch_id',
        'scheduled_at',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'audience_meta' => 'array',
        'open_count' => 'integer',
        'click_count' => 'integer',
        'bounced_count' => 'integer',
    ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Per-recipient delivery ledger.
     */
    public function recipients(): HasMany
    {
        return $this->hasMany(NewsletterCampaignRecipient::class);
    }

    public function successfulRecipients(): HasMany
    {
        return $this->recipients()->where('status', NewsletterCampaignRecipient::STATUS_SENT);
    }

    public function failedRecipients(): HasMany
    {
        return $this->recipients()->whereIn('status', [
            NewsletterCampaignRecipient::STATUS_FAILED,
            NewsletterCampaignRecipient::STATUS_BOUNCED,
        ]);
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    public function scopeDrafts(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeFinished(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_COMPLETED, self::STATUS_FAILED, self::STATUS_CANCELLED]);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        $like = '%' . $term . '%';

        return $query->where(function (Builder $q) use ($like): void {
            $q->where('subject', 'like', $like)
                ->orWhere('preview_text', 'like', $like);
        });
    }

    /* ==========================================
     | STATE HELPERS
     |========================================== */

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isProcessing(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_PROCESSING], true);
    }

    public function isFinished(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_FAILED, self::STATUS_CANCELLED], true);
    }

    /* ==========================================
     | COUNTER SYNCHRONISATION
     |========================================== */

    /**
     * Recalculate the aggregate counters from the recipient ledger so the
     * numbers in the Campaign Manager can never drift from the actual rows.
     *
     * Campaigns dispatched before the ledger existed have no recipient rows.
     * For those we must leave the historical counters untouched, otherwise
     * merely opening the report page would erase the real numbers.
     */
    public function syncCountersFromLedger(): void
    {
        $hasLedger = $this->recipients()->exists();

        if (!$hasLedger) {
            return;
        }

        $counts = $this->recipients()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $sent = (int) ($counts[NewsletterCampaignRecipient::STATUS_SENT] ?? 0);
        $failed = (int) ($counts[NewsletterCampaignRecipient::STATUS_FAILED] ?? 0);
        $bounced = (int) ($counts[NewsletterCampaignRecipient::STATUS_BOUNCED] ?? 0);
        $pending = (int) ($counts[NewsletterCampaignRecipient::STATUS_PENDING] ?? 0);
        $skipped = (int) ($counts[NewsletterCampaignRecipient::STATUS_SKIPPED] ?? 0);

        $this->sent_count = $sent;
        $this->failed_count = $failed;
        $this->bounced_count = $bounced;

        $processed = $sent + $failed + $bounced + $skipped;

        if ($this->status !== self::STATUS_CANCELLED
            && $pending === 0
            && (int) $this->total_subscribers > 0
            && $processed >= (int) $this->total_subscribers) {
            $this->status = $sent > 0 ? self::STATUS_COMPLETED : self::STATUS_FAILED;
            $this->completed_at = $this->completed_at ?: now();
        }

        $this->save();
    }

    public function updateProgress(int $sent, int $failed = 0): void
    {
        $this->sent_count = $sent;
        $this->failed_count = $failed;
        if ($this->total_subscribers > 0
            && ((int) $this->sent_count + (int) $this->failed_count) >= (int) $this->total_subscribers) {
            $this->status = self::STATUS_COMPLETED;
            $this->completed_at = now();
        }
        $this->save();
    }

    /* ==========================================
     | COMPUTED ATTRIBUTES
     |========================================== */

    public function getProgressAttribute(): int
    {
        if ((int) $this->total_subscribers === 0) {
            return 0;
        }

        return (int) round(
            ((int) $this->sent_count + (int) $this->failed_count) / (int) $this->total_subscribers * 100
        );
    }

    /**
     * Percentage of attempted deliveries that succeeded.
     */
    public function getSuccessRateAttribute(): float
    {
        $attempted = (int) $this->sent_count + (int) $this->failed_count + (int) $this->bounced_count;

        if ($attempted === 0) {
            return 0.0;
        }

        return round(((int) $this->sent_count / $attempted) * 100, 1);
    }

    /**
     * Percentage of attempted deliveries that failed.
     */
    public function getFailureRateAttribute(): float
    {
        $attempted = (int) $this->sent_count + (int) $this->failed_count + (int) $this->bounced_count;

        if ($attempted === 0) {
            return 0.0;
        }

        return round((((int) $this->failed_count + (int) $this->bounced_count) / $attempted) * 100, 1);
    }

    /**
     * Wall clock time the campaign took, in seconds.
     */
    public function getDurationSecondsAttribute(): ?int
    {
        if (!$this->started_at) {
            return null;
        }

        return (int) $this->started_at->diffInSeconds($this->completed_at ?: now(), false);
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PENDING => 'Queued',
            self::STATUS_PROCESSING => 'Sending',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_FAILED => 'Failed',
            self::STATUS_CANCELLED => 'Cancelled',
            default => ucfirst((string) $this->status),
        };
    }
}

