<?php
// app/Models/ApplicantProfile.php

namespace App\Models;

// Factories
use Illuminate\Database\Eloquent\Factories\HasFactory;

// Models
use Illuminate\Database\Eloquent\Model;

// Relations
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Eloquent
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApplicantProfile extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Fields required for a complete profile
     */
    public const REQUIRED_FIELDS = [
        'first_name',
        'last_name',
        'phone',
    ];

    /**
     * Fillable fields - FIXED: Added missing blood_type
     */
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'birth_date',
        'gender',
        'blood_type',
        'phone',
        'address',
        'photo_path',
        'social_links',
        'experience_years',
        'current_job_title',
    ];

    /**
     * Cast fields
     */
    protected $casts = [
        'birth_date' => 'date',
        'social_links' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Appended attributes
     */
    protected $appends = [
        'full_name',
    ];

    /**
     * Blood type options
     */
    public static array $bloodTypes = [
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-',
    ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    /**
     * User relation
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Applications relation
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * CVs/Resumes relation
     */
    public function cvs(): HasMany
    {
        return $this->hasMany(ApplicantCv::class)
            ->orderBy('order_position');
    }

    /**
     * Primary CV relation
     */
    public function primaryCv(): HasOne
    {
        return $this->hasOne(ApplicantCv::class)
            ->where('is_primary', true);
    }

    /**
     * Work history relation
     */
    public function jobHistories(): HasMany
    {
        return $this->hasMany(JobHistory::class)
            ->orderBy('starting_year', 'desc');
    }

    /**
     * Current job relation
     */
    public function currentJob(): HasOne
    {
        return $this->hasOne(JobHistory::class)
            ->where('is_current', true);
    }

    /**
     * Education history relation
     */
    public function educationHistories(): HasMany
    {
        return $this->hasMany(EducationHistory::class)
            ->orderBy('passing_year', 'desc');
    }

    /**
     * Achievements relation
     */
    public function achievements(): HasMany
    {
        return $this->hasMany(Achievement::class);
    }

    /* ==========================================
     | ACCESSORS
     |========================================== */

    /**
     * Get full name attribute
     */
    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    /**
     * Scope completed profiles - FIXED to use REQUIRED_FIELDS constant
     */
    public function scopeComplete(Builder $query): Builder
    {
        foreach (self::REQUIRED_FIELDS as $field) {
            $query->whereNotNull($field);
        }
        return $query;
    }

    /* ==========================================
     | HELPER METHODS
     |========================================== */

    /**
     * Check if profile is complete - FIXED to use REQUIRED_FIELDS constant
     */
    public function isComplete(): bool
    {
        foreach (self::REQUIRED_FIELDS as $field) {
            if (empty($this->$field)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get profile completion percentage - FIXED to use consistent fields
     */
    public function completionPercentage(): int
    {
        $fields = [
            'first_name',
            'last_name',
            'phone',
            'birth_date',
            'gender',
            'experience_years',
            'current_job_title',
        ];

        $filled = 0;
        foreach ($fields as $field) {
            if (!empty($this->$field)) {
                $filled++;
            }
        }

        return (int) round(($filled / count($fields)) * 100);
    }

    /**
     * Get blood type label
     */
    public function getBloodTypeLabelAttribute(): ?string
    {
        return $this->blood_type;
    }
}
