<?php
// app/Models/pages/SectionConfig.php

namespace App\Models\pages;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\pages\Page;

class SectionConfig extends Model
{
  use HasFactory, SoftDeletes;

  /**
   * Table name
   */
  protected $table = 'section_configs';

  /**
   * Fillable fields
   */
  protected $fillable = [
    'page_slug',
    'section_key',
    'component',
    'data_table',
    'data_key',
    'prop_name',
    'display_order',
    'is_enabled',
    'is_fixed_section',
    'is_special_component',
    'custom_props',
  ];

  /**
   * Cast fields
   */
  protected $casts = [
    'is_enabled' => 'boolean',
    'is_fixed_section' => 'boolean',
    'is_special_component' => 'boolean',
    'custom_props' => 'array',
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
    'deleted_at' => 'datetime',
  ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

  /**
   * Get the page that owns the section config
   */
  public function page(): BelongsTo
  {
    return $this->belongsTo(Page::class, 'page_slug', 'slug');
  }

    /* ==========================================
     | SCOPES
     |========================================== */

  /**
   * Scope enabled sections
   */
  public function scopeEnabled(Builder $query): Builder
  {
    return $query->where('is_enabled', true);
  }

  /**
   * Scope ordered by display order
   */
  public function scopeOrdered(Builder $query): Builder
  {
    return $query->orderBy('display_order');
  }

  /**
   * Scope for a specific page
   */
  public function scopeForPage(Builder $query, string $pageSlug): Builder
  {
    return $query->where('page_slug', $pageSlug);
  }
}
