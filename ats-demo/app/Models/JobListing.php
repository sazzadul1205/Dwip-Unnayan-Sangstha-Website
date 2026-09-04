<?php
// app/Models/JobListing.php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class JobListing extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Mass assignable fields for job creation/update
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'requirements',
        'job_type',
        'salary_min',
        'salary_max',
        'is_salary_negotiable',
        'as_per_companies_policy',
        'category_id',
        'experience_level',
        'education_requirement',
        'education_details',
        'benefits',
        'skills',
        'responsibilities',
        'keywords',
        'application_deadline',
        'publish_at',
        'views_count',
        'is_active',
        'user_id',
        'required_facebook_link',
        'required_linkedin_link',
    ];

    /**
     * Attribute casting for proper data handling
     */
    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'is_salary_negotiable' => 'boolean',
        'as_per_companies_policy' => 'boolean',
        'benefits' => 'array',
        'skills' => 'array',
        'responsibilities' => 'array',
        'keywords' => 'array',
        'is_active' => 'boolean',
        'required_facebook_link' => 'boolean',
        'required_linkedin_link' => 'boolean',
        'application_deadline' => 'date',
        'publish_at' => 'date',
        'views_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Allowed job types in system
     */
    public static array $jobTypes = [
        'full-time',
        'part-time',
        'contract',
        'internship',
        'remote',
        'hybrid'
    ];

    /**
     * Allowed experience levels
     */
    public static array $experienceLevels = [
        'entry',
        'junior',
        'mid-level',
        'senior',
        'lead',
        'executive'
    ];

    /**
     * Auto-generate slug when creating job - FIXED with better uniqueness
     */
    protected static function booted(): void
    {
        static::creating(function (JobListing $job): void {
            if (empty($job->slug)) {
                $baseSlug = Str::slug($job->title);
                $slug = $baseSlug;
                $counter = 1;

                // First try clean slug
                while (self::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }

                $job->slug = $slug;
            }
        });

        static::updating(function (JobListing $job): void {
            // If title changed and slug is auto-generated, update slug
            if ($job->isDirty('title') && !$job->isDirty('slug')) {
                $baseSlug = Str::slug($job->title);
                $slug = $baseSlug;
                $counter = 1;

                while (self::where('slug', $slug)->where('id', '!=', $job->id)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }

                $job->slug = $slug;
            }
        });
    }

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    /**
     * Employer who posted the job
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Job category
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class, 'category_id');
    }

    /**
     * Multiple job locations (many-to-many)
     */
    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class, 'job_listing_location')
            ->withTimestamps();
    }

    /**
     * Applications submitted for this job
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * Job view tracking records
     */
    public function views(): HasMany
    {
        return $this->hasMany(JobView::class);
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    /**
     * Only active and non-expired jobs
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->where('application_deadline', '>=', now());
    }

    /**
     * Only published jobs
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('publish_at', '<=', now());
    }

    /**
     * Filter by employer
     */
    public function scopeByEmployer(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Filter by category
     */
    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Filter by job type
     */
    public function scopeByJobType(Builder $query, string $jobType): Builder
    {
        return $query->where('job_type', $jobType);
    }

    /**
     * Filter by location
     */
    public function scopeByLocation(Builder $query, int $locationId): Builder
    {
        return $query->whereHas('locations', function (Builder $q) use ($locationId): void {
            $q->where('locations.id', $locationId);
        });
    }

    /**
     * Search by keyword in title, description, requirements, or skills
     */
    public function scopeSearch(Builder $query, string $keyword): Builder
    {
        return $query->where(function (Builder $q) use ($keyword): void {
            $q->where('title', 'like', "%{$keyword}%")
                ->orWhere('description', 'like', "%{$keyword}%")
                ->orWhere('requirements', 'like', "%{$keyword}%")
                ->orWhereJsonContains('skills', $keyword)
                ->orWhereJsonContains('keywords', $keyword);
        });
    }

    /* ==========================================
     | ACCESSORS & HELPERS
     |========================================== */

    /**
     * Human-readable salary range display
     */
    public function getSalaryRangeAttribute(): string
    {
        if ($this->as_per_companies_policy) {
            return 'As per company policy';
        }

        if ($this->is_salary_negotiable) {
            return 'Negotiable';
        }

        if ($this->salary_min && $this->salary_max) {
            return number_format($this->salary_min) . ' - ' .
                number_format($this->salary_max) . ' BDT';
        }

        if ($this->salary_min) {
            return 'From ' . number_format($this->salary_min) . ' BDT';
        }

        return 'Not specified';
    }

    /**
     * Increase view count for analytics
     */
    public function incrementViews(): void
    {
        $this->increment('views_count');
    }

    /**
     * Check if job is expired
     */
    public function isExpired(): bool
    {
        return $this->application_deadline < now();
    }

    /**
     * Check if applications are allowed
     */
    public function canApply(): bool
    {
        return $this->is_active && !$this->isExpired();
    }

    /**
     * Total number of applications
     */
    public function getApplicationCountAttribute(): int
    {
        return $this->applications()->count();
    }

    /**
     * Get formatted job type label
     */
    public function getJobTypeLabelAttribute(): string
    {
        $labels = [
            'full-time' => 'Full Time',
            'part-time' => 'Part Time',
            'contract' => 'Contract',
            'internship' => 'Internship',
            'remote' => 'Remote',
            'hybrid' => 'Hybrid',
        ];

        return $labels[$this->job_type] ?? ucfirst($this->job_type);
    }

    /**
     * Get formatted experience level label
     */
    public function getExperienceLevelLabelAttribute(): string
    {
        $labels = [
            'entry' => 'Entry Level',
            'junior' => 'Junior',
            'mid-level' => 'Mid Level',
            'senior' => 'Senior',
            'lead' => 'Lead',
            'executive' => 'Executive',
        ];

        return $labels[$this->experience_level] ?? ucfirst(str_replace('-', ' ', $this->experience_level));
    }

    /**
     * Retrieve the model for a bound value when using implicit route binding.
     * Include trashed records so deleted job listings can still be accessed.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? $this->getRouteKeyName(), $value)
            ->withTrashed()
            ->firstOrFail();
    }
}
