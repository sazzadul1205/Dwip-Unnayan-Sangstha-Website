<?php
// app/Models/pages/AboutContent.php

namespace App\Models\pages;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AboutContent extends Model
{
  use HasFactory, SoftDeletes;

  /**
   * Table name
   */
  protected $table = 'about_content';

  /**
   * Fillable fields
   */
  protected $fillable = [
    'slug',
    'title',
    'type',
    'content',
    'full_content',
    'image',
    'icon',
    'bg_color',
    'btn_text',
    'btn_link',
    'display_order',
    'is_featured',
    'tags',
    'is_active',
  ];

  /**
   * Cast fields
   */
  protected $casts = [
    'tags' => 'array',
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
   * Scope active about content
   */
  public function scopeActive(Builder $query): Builder
  {
    return $query->where('is_active', true);
  }

  /**
   * Scope featured content
   */
  public function scopeFeatured(Builder $query): Builder
  {
    return $query->where('is_featured', true);
  }

  /**
   * Scope by type
   */
  public function scopeOfType(Builder $query, string $type): Builder
  {
    return $query->where('type', $type);
  }

  /**
   * Scope ordered by display order
   */
  public function scopeOrdered(Builder $query): Builder
  {
    return $query->orderBy('display_order');
  }

  /**
   * Scope main about content
   */
  public function scopeMain(Builder $query): Builder
  {
    return $query->where('type', 'main');
  }

  /**
   * Scope detail about content
   */
  public function scopeDetail(Builder $query): Builder
  {
    return $query->where('type', 'detail');
  }
}
