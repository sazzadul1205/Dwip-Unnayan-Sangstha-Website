<?php
// app/Models/JobCategory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobCategory extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Fillable fields
     */
    protected $fillable = [
        'name',
        'slug',
        'is_active',
    ];

    /**
     * Cast fields
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    /**
     * Job listings in this category
     */
    public function jobListings(): HasMany
    {
        return $this->hasMany(
            JobListing::class,
            'category_id'
        );
    }

    /**
     * Active job listings only
     */
    public function activeJobListings(): HasMany
    {
        return $this->jobListings()->active();
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    /**
     * Active categories only
     */
    public function scopeActive(
        Builder $query
    ): Builder {

        return $query->where(
            'is_active',
            true
        );
    }

    /* ==========================================
     | ACCESSORS
     |========================================== */

    /**
     * Job count in this category
     */
    public function getJobCountAttribute(): int
    {
        return $this->jobListings()
            ->active()
            ->count();
    }
}
