<?php
// app/Models/JobHistory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Validation\ValidationException;

class JobHistory extends Model
{
    use HasFactory, SoftDeletes;

    public const MAX_ENTRIES_PER_PROFILE = 3;
    public const MIN_YEAR = 1900;
    public const MAX_YEAR = 2100;

    /**
     * Fillable fields
     */
    protected $fillable = [
        'applicant_profile_id',
        'company_name',
        'position',
        'starting_year',
        'ending_year',
        'is_current',
    ];

    /**
     * Cast fields
     */
    protected $casts = [
        'starting_year' => 'integer',
        'ending_year' => 'integer',
        'is_current' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    public function applicantProfile(): BelongsTo
    {
        return $this->belongsTo(ApplicantProfile::class);
    }

    /* ==========================================
     | MODEL EVENTS
     |========================================== */

    protected static function booted(): void
    {
        static::creating(function (JobHistory $model): void {
            // Validate max entries
            if (self::hasReachedMaxEntries($model->applicant_profile_id)) {
                throw ValidationException::withMessages([
                    'job_history' => sprintf(
                        'Maximum %d job history entries allowed per profile.',
                        self::MAX_ENTRIES_PER_PROFILE
                    ),
                ]);
            }

            // Validate years
            self::validateYear($model->starting_year, 'starting_year');

            if (!$model->is_current && $model->ending_year !== null) {
                self::validateYear($model->ending_year, 'ending_year');

                if ($model->ending_year < $model->starting_year) {
                    throw ValidationException::withMessages([
                        'ending_year' => 'Ending year cannot be before starting year.',
                    ]);
                }
            }
        });

        static::updating(function (JobHistory $model): void {
            // Validate years
            self::validateYear($model->starting_year, 'starting_year');

            if (!$model->is_current && $model->ending_year !== null) {
                self::validateYear($model->ending_year, 'ending_year');

                if ($model->ending_year < $model->starting_year) {
                    throw ValidationException::withMessages([
                        'ending_year' => 'Ending year cannot be before starting year.',
                    ]);
                }
            }
        });
    }

    /* ==========================================
     | ACCESSORS
     |========================================== */

    /**
     * Get formatted duration
     */
    public function getDurationAttribute(): string
    {
        $start = $this->starting_year;

        if ($this->is_current) {
            return $start . ' - Present';
        }

        $end = $this->ending_year ?? 'Present';
        return $start . ' - ' . $end;
    }

    /* ==========================================
     | HELPERS
     |========================================== */

    /**
     * Validate year range
     */
    protected static function validateYear(int $year, string $field): void
    {
        if ($year < self::MIN_YEAR || $year > self::MAX_YEAR) {
            throw ValidationException::withMessages([
                $field => sprintf('%s must be between %d and %d.', ucfirst(str_replace('_', ' ', $field)), self::MIN_YEAR, self::MAX_YEAR),
            ]);
        }
    }

    /**
     * Check max entries reached
     */
    public static function hasReachedMaxEntries(int $applicantProfileId): bool
    {
        return self::where('applicant_profile_id', $applicantProfileId)->count() >= self::MAX_ENTRIES_PER_PROFILE;
    }

    /**
     * Get remaining slots
     */
    public static function getRemainingSlots(int $applicantProfileId): int
    {
        $currentCount = self::where('applicant_profile_id', $applicantProfileId)->count();
        return max(0, self::MAX_ENTRIES_PER_PROFILE - $currentCount);
    }
}
