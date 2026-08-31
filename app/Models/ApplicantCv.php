<?php
// app/Models/ApplicantCv.php

namespace App\Models;

// Eloquent
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

// Factories
use Illuminate\Database\Eloquent\Factories\HasFactory;

// Facades
use Illuminate\Support\Facades\DB;

// Validation
use Illuminate\Validation\ValidationException;

class ApplicantCv extends Model
{
    use HasFactory;

    public const MAX_CVS_PER_PROFILE = 3;

    /**
     * Fillable fields
     */
    protected $fillable = [
        'applicant_profile_id',
        'cv_path',
        'original_name',
        'order_position',
        'is_primary',
        'status',
    ];

    /**
     * Cast fields
     */
    protected $casts = [
        'is_primary' => 'boolean',
        'order_position' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    public function applicantProfile()
    {
        return $this->belongsTo(ApplicantProfile::class);
    }

    /* ==========================================
     | MODEL EVENTS
     |========================================== */

    protected static function booted(): void
    {
        /**
         * Before creating
         */
        static::creating(function (ApplicantCv $cv): void {
            // Count only active CVs
            if (
                self::hasReachedMaxEntries(
                    $cv->applicant_profile_id,
                    true
                ) &&
                $cv->status === 'active'
            ) {
                throw ValidationException::withMessages([
                    'cv' => sprintf(
                        'Maximum %d active CVs allowed per profile.',
                        self::MAX_CVS_PER_PROFILE
                    ),
                ]);
            }

            // Auto-set order position if not set
            if ($cv->order_position === null || $cv->order_position === 0) {
                $maxPosition = self::where('applicant_profile_id', $cv->applicant_profile_id)
                    ->max('order_position');
                $cv->order_position = ($maxPosition ?? -1) + 1;
            }

            // If primary, unset other primary CVs
            if (
                $cv->is_primary &&
                $cv->status === 'active'
            ) {
                self::where(
                    'applicant_profile_id',
                    $cv->applicant_profile_id
                )
                    ->where('status', 'active')
                    ->update([
                        'is_primary' => false,
                    ]);
            }
        });

        /**
         * Before updating
         */
        static::updating(function (ApplicantCv $cv): void {
            if (
                $cv->is_primary &&
                $cv->getOriginal('is_primary') !== true &&
                $cv->status === 'active'
            ) {
                self::where(
                    'applicant_profile_id',
                    $cv->applicant_profile_id
                )
                    ->where('id', '!=', $cv->id)
                    ->where('status', 'active')
                    ->update([
                        'is_primary' => false,
                    ]);
            }
        });

        /**
         * Before deleting
         */
        static::deleting(function (ApplicantCv $cv): void {
            if ($cv->is_primary) {
                $anotherCv = self::where(
                    'applicant_profile_id',
                    $cv->applicant_profile_id
                )
                    ->where('id', '!=', $cv->id)
                    ->where('status', 'active')
                    ->first();

                if ($anotherCv) {
                    $anotherCv->update([
                        'is_primary' => true,
                    ]);
                }
            }
        });

        /**
         * After deleting - reorder remaining CVs
         */
        static::deleted(function (ApplicantCv $cv): void {
            self::reorderCvs($cv->applicant_profile_id);
        });
    }

    /* ==========================================
     | ACCESSORS
     |========================================== */

    /**
     * Get full CV URL
     */
    public function getUrlAttribute(): ?string
    {
        return $this->cv_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($this->cv_path)
            ? asset('storage/' . $this->cv_path)
            : null;
    }

    /* ==========================================
     | HELPERS
     |========================================== */

    /**
     * Check if profile reached max CV limit
     */
    public static function hasReachedMaxEntries(int $applicantProfileId, bool $onlyActive = false): bool
    {
        $query = self::where('applicant_profile_id', $applicantProfileId);

        if ($onlyActive) {
            $query->where('status', 'active');
        }

        return $query->count() >= self::MAX_CVS_PER_PROFILE;
    }

    /**
     * Get remaining CV slots
     */
    public static function getRemainingSlots(int $applicantProfileId): int
    {
        $currentCount = self::where('applicant_profile_id', $applicantProfileId)
            ->where('status', 'active')
            ->count();

        return max(0, self::MAX_CVS_PER_PROFILE - $currentCount);
    }

    /**
     * Get primary active CV
     */
    public static function getPrimaryCv(int $applicantProfileId): ?self
    {
        return self::where('applicant_profile_id', $applicantProfileId)
            ->where('is_primary', true)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Set current CV as primary - FIXED with limit check
     */
    public function setAsPrimary(): self
    {
        // Check if we need to activate this CV
        if ($this->status !== 'active') {
            if (self::hasReachedMaxEntries($this->applicant_profile_id, true)) {
                throw ValidationException::withMessages([
                    'cv' => sprintf(
                        'Cannot activate CV. Maximum %d active CVs already reached.',
                        self::MAX_CVS_PER_PROFILE
                    ),
                ]);
            }
            $this->status = 'active';
        }

        // Unset other primary CVs
        self::where('applicant_profile_id', $this->applicant_profile_id)
            ->where('status', 'active')
            ->update(['is_primary' => false]);

        $this->is_primary = true;
        $this->save();

        return $this;
    }

    /**
     * Reorder CVs after deletion - FIXED without unique constraint
     */
    public static function reorderCvs(int $applicantProfileId): void
    {
        $cvs = self::where('applicant_profile_id', $applicantProfileId)
            ->orderBy('order_position')
            ->orderBy('created_at')
            ->get();

        if ($cvs->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($cvs): void {
            foreach ($cvs as $index => $cv) {
                $newPosition = $index;
                if ($cv->order_position !== $newPosition) {
                    self::where('id', $cv->id)->update([
                        'order_position' => $newPosition,
                    ]);
                }
            }
        });
    }

    /**
     * Swap positions with another CV
     */
    public function swapPosition(ApplicantCv $otherCv): void
    {
        $tempPosition = $this->order_position;

        DB::transaction(function () use ($otherCv, $tempPosition): void {
            $this->update(['order_position' => -999]); // Temporary position
            $otherCv->update(['order_position' => $tempPosition]);
            $this->update(['order_position' => $otherCv->order_position]);
        });
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    /**
     * Scope active CVs
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope primary CV
     */
    public function scopePrimary(Builder $query): Builder
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope ordered CVs
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('order_position');
    }
}
