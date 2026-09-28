<?php
// app/Models/NewsletterCampaignRecipient.php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One delivery attempt of a campaign to one recipient.
 *
 * @property int         $id
 * @property int         $newsletter_campaign_id
 * @property int|null    $newsletter_subscription_id
 * @property string      $email
 * @property string|null $name
 * @property string      $status            pending|sent|failed|bounced|skipped
 * @property string|null $error_message
 * @property string|null $message_id
 * @property int         $attempts
 * @property \Illuminate\Support\Carbon|null $sent_at
 */
class NewsletterCampaignRecipient extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_SENT = 'sent';
    public const STATUS_FAILED = 'failed';
    public const STATUS_BOUNCED = 'bounced';
    public const STATUS_SKIPPED = 'skipped';

    protected $fillable = [
        'newsletter_campaign_id',
        'newsletter_subscription_id',
        'email',
        'name',
        'status',
        'error_message',
        'message_id',
        'attempts',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'attempts' => 'integer',
    ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(NewsletterCampaign::class, 'newsletter_campaign_id');
    }

    /**
     * The subscription may have been deleted after the send; the FK is not
     * enforced so this can legitimately be null.
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(NewsletterSubscription::class, 'newsletter_subscription_id');
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    public function scopeSent(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_SENT);
    }

    public function scopeFailed(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_FAILED, self::STATUS_BOUNCED]);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeForCampaign(Builder $query, int $campaignId): Builder
    {
        return $query->where('newsletter_campaign_id', $campaignId);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        $like = '%' . $term . '%';

        return $query->where(function (Builder $q) use ($like): void {
            $q->where('email', 'like', $like)
                ->orWhere('name', 'like', $like);
        });
    }

    /* ==========================================
     | HELPERS
     |========================================== */

    public function isSent(): bool
    {
        return $this->status === self::STATUS_SENT;
    }

    public function isFailed(): bool
    {
        return in_array($this->status, [self::STATUS_FAILED, self::STATUS_BOUNCED], true);
    }

    /**
     * Human readable label for the manager UI.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_SENT => 'Delivered',
            self::STATUS_FAILED => 'Failed',
            self::STATUS_BOUNCED => 'Bounced',
            self::STATUS_SKIPPED => 'Skipped',
            default => 'Queued',
        };
    }

    /**
     * Mark a hard SMTP failure. 5xx codes mean the mailbox does not exist and
     * the subscriber should be flagged so future campaigns skip them.
     */
    public function markFailed(string $error, bool $hardBounce = false): void
    {
        $this->forceFill([
            'status' => $hardBounce ? self::STATUS_BOUNCED : self::STATUS_FAILED,
            'error_message' => \Illuminate\Support\Str::limit($error, 1000, ''),
            'attempts' => $this->attempts + 1,
        ])->save();
    }

    public function markSent(?string $messageId = null): void
    {
        $this->forceFill([
            'status' => self::STATUS_SENT,
            'error_message' => null,
            'message_id' => $messageId,
            'attempts' => $this->attempts + 1,
            'sent_at' => now(),
        ])->save();
    }
}
