<?php
// app/Models/pages/Page.php

namespace App\Models\pages;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Page extends Model 
{
    use HasFactory, SoftDeletes;

    /**
     * Table name
     */
    protected $table = 'pages';

    /**
     * Fillable fields
     */
    protected $fillable = [
        'slug',
        'name',
        'title',
        'description',
        'is_active',
    ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    /**
     * Get the section configs for the page
     */
    public function sectionConfigs(): HasMany
    {
        return $this->hasMany(SectionConfig::class, 'page_slug', 'slug');
    }

    /**
     * Get the custom section data for the page
     */
    public function customSectionData(): HasMany
    {
        return $this->hasMany(CustomSectionData::class, 'page_slug', 'slug');
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    /**
     * Scope active pages
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope by slug
     */
    public function scopeSlug(Builder $query, string $slug): Builder
    {
        return $query->where('slug', $slug);
    }
}
