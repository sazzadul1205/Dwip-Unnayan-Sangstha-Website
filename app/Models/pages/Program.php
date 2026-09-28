<?php
// app/Models/pages/Program.php

namespace App\Models\pages;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Program extends Model
{
  use HasFactory, SoftDeletes;

  /**
   * Table name
   */
  protected $table = 'programs';

  /**
   * Fillable fields
   */
  protected $fillable = [
    'slug',
    'title',
    'breadcrumb',
    'full_content_html',
    'image',
    'bg_color',
    'link',
    'is_featured',
    'display_order',
    'is_active',
  ];

  /**
   * Cast fields
   */
  protected $casts = [
    'is_featured' => 'boolean',
    'is_active' => 'boolean',
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
    'deleted_at' => 'datetime',
  ];

    /* ==========================================
     | SCOPES
     |========================================== */

  /**
   * Scope active programs
   */
  public function scopeActive(Builder $query): Builder
  {
    return $query->where('is_active', true);
  }

  /**
   * Scope featured programs
   */
  public function scopeFeatured(Builder $query): Builder
  {
    return $query->where('is_featured', true);
  }

  /**
   * Scope ordered by display order
   */
  public function scopeOrdered(Builder $query): Builder
  {
    return $query->orderBy('display_order');
  }

  /**
   * Scope with limit
   */
  public function scopeTakeLimit(Builder $query, int $limit): Builder
  {
    return $query->limit($limit);
  }

    /* ==========================================
     | ACCESSORS
     |========================================== */

  /**
   * Get excerpt from full content
   */
  public function getExcerptAttribute()
  {
    $content = strip_tags($this->full_content_html);
    return strlen($content) > 150 ? substr($content, 0, 150) . '...' : $content;
  }
}
