<?php
// app/Models/Application.php

namespace App\Models;

// Models
use App\Models\User;

// Notifications
use App\Notifications\ApplicationStatusUpdated;

// ATS
use App\Services\ATSService;

// Eloquent
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

// Facades
use Illuminate\Support\Facades\Log;

class Application extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Fillable fields
     */
    protected $fillable = [
        'user_id',
        'job_listing_id',
        'applicant_profile_id',
        'name',
        'email',
        'phone',
        'education_level',
        'years_of_experience',
        'resume_path',
        'expected_salary',
        'ats_score',
        'matched_keywords',
        'missing_keywords',
        'ats_last_attempted_at',
        'ats_attempt_count',
        'ats_calculation_status',
        'status',
        'employer_notes',
        'facebook_link',
        'linkedin_link',
    ];

    /**
     * Cast fields
     */
    protected $casts = [
        'expected_salary' => 'decimal:2',
        'ats_score' => 'array',
        'matched_keywords' => 'array',
        'missing_keywords' => 'array',
        'ats_last_attempted_at' => 'datetime',
        'ats_attempt_count' => 'integer',
        'years_of_experience' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /* ==========================================
     | STATUS CONSTANTS
     |========================================== */

    public const STATUS_PENDING = 'pending';
    public const STATUS_SHORTLISTED = 'shortlisted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_HIRED = 'hired';

    public static array $statuses = [
        self::STATUS_PENDING,
        self::STATUS_SHORTLISTED,
        self::STATUS_REJECTED,
        self::STATUS_HIRED,
    ];

    /* ==========================================
     | ATS STATUS CONSTANTS
     |========================================== */

    public const ATS_PENDING = 'pending';
    public const ATS_PROCESSING = 'processing';
    public const ATS_COMPLETED = 'completed';
    public const ATS_FAILED = 'failed';

    public static array $atsStatuses = [
        self::ATS_PENDING,
        self::ATS_PROCESSING,
        self::ATS_COMPLETED,
        self::ATS_FAILED,
    ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    /**
     * Applicant relation
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Job listing relation
     */
    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    /**
     * Applicant profile relation
     */
    public function applicantProfile(): BelongsTo
    {
        return $this->belongsTo(ApplicantProfile::class);
    }

    /**
     * Status timeline relation
     */
    public function statusTimelines(): HasMany
    {
        return $this->hasMany(StatusTimeline::class)
            ->orderBy('created_at');
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeShortlisted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_SHORTLISTED);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopeHired(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_HIRED);
    }

    public function scopeByJob(Builder $query, int $jobId): Builder
    {
        return $query->where('job_listing_id', $jobId);
    }

    public function scopeByEmployer(Builder $query, int $employerId): Builder
    {
        return $query->whereHas('jobListing', function (Builder $q) use ($employerId): void {
            $q->where('user_id', $employerId);
        });
    }

    /**
     * Scope minimum ATS score
     */
    public function scopeMinAtsScore(Builder $query, int|float $minScore): Builder
    {
        return $query->where(function (Builder $q) use ($minScore): void {
            $q->whereRaw('JSON_EXTRACT(ats_score, "$.percentage") >= ?', [$minScore])
                ->orWhereRaw('ats_score >= ?', [$minScore]);
        });
    }

    /**
     * Scope ATS score range
     */
    public function scopeAtsScoreBetween(Builder $query, int|float $min, int|float $max): Builder
    {
        return $query->where(function (Builder $q) use ($min, $max): void {
            $q->whereRaw('JSON_EXTRACT(ats_score, "$.percentage") BETWEEN ? AND ?', [$min, $max])
                ->orWhereRaw('ats_score BETWEEN ? AND ?', [$min, $max]);
        });
    }

    /* ==========================================
     | HELPER METHODS
     |========================================== */

    /**
     * Update application status
     */
    public function updateStatus(string $newStatus, ?string $notes = null): bool
    {
        $oldStatus = $this->status;

        $updated = $this->update([
            'status' => $newStatus,
            'employer_notes' => $notes,
        ]);

        if (!$updated) {
            return false;
        }

        $this->statusTimelines()->create([
            'status' => $newStatus,
            'notes' => $notes,
        ]);

        $this->loadMissing(['jobListing', 'user']);

        if ($this->user) {
            $this->user->notify(new ApplicationStatusUpdated($this, $oldStatus, $notes));
        }

        return true;
    }

    /**
     * Get actual resume path
     */
    public function getActualResumePath(): ?string
    {
        if (!empty($this->resume_path)) {
            return $this->resume_path;
        }

        $profile = $this->relationLoaded('applicantProfile')
            ? $this->applicantProfile
            : $this->applicantProfile()->with('primaryCv')->first();

        if ($profile && $profile->primaryCv) {
            return $profile->primaryCv->cv_path;
        }

        return null;
    }

    /**
     * Check if ATS completed
     */
    public function isAtsCompleted(): bool
    {
        return $this->ats_calculation_status === self::ATS_COMPLETED;
    }

    /**
     * Check if ATS calculation stuck
     */
    public function isAtsCalculationStuck(int $minutes = 30): bool
    {
        if (!in_array($this->ats_calculation_status, [self::ATS_PENDING, self::ATS_PROCESSING])) {
            return false;
        }

        $cutoff = now()->subMinutes($minutes);

        if ($this->ats_last_attempted_at) {
            return $this->ats_last_attempted_at < $cutoff;
        }

        return $this->created_at < $cutoff;
    }

    /**
     * Calculate ATS score - FIXED with proper error handling
     */
    public function calculateATSScore(): bool
    {
        try {
            // Check if ATSService exists
            if (!class_exists(ATSService::class)) {
                // Mark as failed but don't throw - allow graceful degradation
                $this->update([
                    'ats_calculation_status' => self::ATS_FAILED,
                    'ats_score' => [
                        'percentage' => 0,
                        'error' => 'ATS Service not available. Please run: php artisan make:service ATSService',
                        'status' => 'service_missing',
                    ],
                    'ats_last_attempted_at' => now(),
                    'ats_attempt_count' => ($this->ats_attempt_count ?? 0) + 1,
                ]);

                return false;
            }

            /** @var ATSService $atsService */
            $atsService = app(ATSService::class);

            $this->loadMissing(['jobListing', 'applicantProfile']);

            if (!$this->jobListing) {
                throw new \Exception('Job listing not found for ATS calculation');
            }

            $this->update([
                'ats_calculation_status' => self::ATS_PROCESSING,
            ]);

            $result = $atsService->calculateScore($this, $this->jobListing);

            $this->update([
                'ats_score' => $result,
                'matched_keywords' => $result['matched_keywords'] ?? [],
                'missing_keywords' => $result['missing_keywords'] ?? [],
                'ats_calculation_status' => self::ATS_COMPLETED,
                'ats_last_attempted_at' => now(),
                'ats_attempt_count' => ($this->ats_attempt_count ?? 0) + 1,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('ATS Score calculation failed', [
                'application_id' => $this->id,
                'error' => $e->getMessage(),
            ]);

            $this->update([
                'ats_calculation_status' => self::ATS_FAILED,
                'ats_score' => [
                    'percentage' => 0,
                    'error' => $e->getMessage(),
                    'status' => 'failed',
                ],
                'ats_last_attempted_at' => now(),
                'ats_attempt_count' => ($this->ats_attempt_count ?? 0) + 1,
            ]);

            return false;
        }
    }

    /**
     * Recalculate ATS score
     */
    public function recalculateAtsScoreInline(): bool
    {
        $this->update([
            'ats_calculation_status' => self::ATS_PENDING,
            'ats_score' => null,
            'matched_keywords' => null,
            'missing_keywords' => null,
            'ats_attempt_count' => 0,
        ]);

        return $this->calculateATSScore();
    }

    /**
     * Check if application editable
     */
    public function canBeUpdated(): bool
    {
        return !in_array($this->status, [self::STATUS_HIRED, self::STATUS_REJECTED]);
    }

    /* ==========================================
     | ACCESSORS
     |========================================== */

    /**
     * Get resume URL
     */
    public function getResumeUrlAttribute(): ?string
    {
        return $this->resume_path ? asset('storage/' . $this->resume_path) : null;
    }

    /**
     * Get ATS percentage
     */
    public function getAtsScorePercentageAttribute(): int|float|null
    {
        if (!$this->ats_score) {
            return null;
        }

        if (is_array($this->ats_score)) {
            return $this->ats_score['percentage'] ?? $this->ats_score['total'] ?? null;
        }

        if (is_numeric($this->ats_score)) {
            return $this->ats_score;
        }

        $decoded = json_decode($this->ats_score, true);

        if ($decoded) {
            return $decoded['percentage'] ?? $decoded['total'] ?? null;
        }

        return null;
    }
}
