<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row in the audit trail.
 *
 * @property int $id
 * @property string $event
 * @property int|null $user_id
 * @property string|null $user_name
 * @property string|null $user_email
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property string $description
 * @property string|null $route_name
 * @property string $method
 * @property string|null $url
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property int|null $status_code
 * @property array|null $old_values
 * @property array|null $new_values
 */
class AuditLog extends Model
{
    use HasFactory;

    public const CREATED = 'created';
    public const UPDATED = 'updated';
    public const DELETED = 'deleted';
    public const RESTORED = 'restored';
    public const FORCE_DELETED = 'force_deleted';

    public const LOGIN = 'login';
    public const LOGOUT = 'logout';
    public const FAILED_LOGIN = 'failed_login';
    public const DENIED = 'denied';
    public const EXPORTED = 'exported';
    public const PRUNED = 'pruned';

    protected $fillable = [
        'event',
        'user_id',
        'user_name',
        'user_email',
        'subject_type',
        'subject_id',
        'description',
        'route_name',
        'method',
        'url',
        'ip_address',
        'user_agent',
        'status_code',
        'old_values',
        'new_values',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'status_code' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Every event the UI can filter by, in the order they are displayed.
     *
     * @return array<string, string>
     */
    public static function eventLabels(): array
    {
        return [
            self::CREATED => 'Created',
            self::UPDATED => 'Updated',
            self::DELETED => 'Deleted',
            self::RESTORED => 'Restored',
            self::FORCE_DELETED => 'Force deleted',
            self::LOGIN => 'Signed in',
            self::LOGOUT => 'Signed out',
            self::FAILED_LOGIN => 'Failed sign-in',
            self::DENIED => 'Access denied',
            self::EXPORTED => 'Exported',
            self::PRUNED => 'Pruned',
        ];
    }

    /**
     * Which field changed, and from what to what.
     *
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public function changes(): array
    {
        $old = $this->old_values ?? [];
        $new = $this->new_values ?? [];

        if ($old === [] && $new === []) {
            return [];
        }

        $diff = [];

        foreach (array_unique([...array_keys($old), ...array_keys($new)]) as $key) {
            $before = $old[$key] ?? null;
            $after = $new[$key] ?? null;

            if ($before === $after) {
                continue;
            }

            $diff[$key] = ['old' => $before, 'new' => $after];
        }

        return $diff;
    }

    public function scopeOfEvent(Builder $query, ?string $event): Builder
    {
        return $event && $event !== 'all' ? $query->where('event', $event) : $query;
    }

    public function scopeForUser(Builder $query, ?int $userId): Builder
    {
        return $userId ? $query->where('user_id', $userId) : $query;
    }

    public function scopeForSubject(Builder $query, ?string $type, ?int $id): Builder
    {
        if ($type && $id) {
            return $query->where('subject_type', $type)->where('subject_id', $id);
        }

        return $query;
    }

    public function scopeMatching(Builder $query, ?string $term): Builder
    {
        if (! $term) {
            return $query;
        }

        $like = '%' . $term . '%';

        return $query->where(function (Builder $q) use ($like) {
            $q->where('description', 'like', $like)
                ->orWhere('route_name', 'like', $like)
                ->orWhere('user_email', 'like', $like)
                ->orWhere('url', 'like', $like);
        });
    }

    public function scopeBetweenDates(Builder $query, ?string $from, ?string $to): Builder
    {
        if ($from) {
            $query->where('created_at', '>=', $from);
        }

        if ($to) {
            // Inclusive of the whole end day.
            $query->where('created_at', '<=', $to . ' 23:59:59');
        }

        return $query;
    }
}
