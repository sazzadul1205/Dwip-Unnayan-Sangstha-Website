<?php
// app/Models/pages/Blog.php

namespace App\Models\pages;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Blog extends Model
{
  use HasFactory, SoftDeletes;

  /**
   * Table name
   */
  protected $table = 'blogs';

  /**
   * Fillable fields
   */
  protected $fillable = [
    'slug',
    'title',
    'excerpt',
    'full_content',
    'image',
    'date',
    'author',
    'read_time',
    'tags',
    'is_featured',
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
   * Scope active blogs
   */
  public function scopeActive(Builder $query): Builder
  {
    return $query->where('is_active', true);
  }

  /**
   * Scope featured blogs
   */
  public function scopeFeatured(Builder $query): Builder
  {
    return $query->where('is_featured', true);
  }

  /**
   * Scope latest blogs with optional limit
   */
  public function scopeLatest(Builder $query, $limit = null): Builder
  {
    $query = $query->orderBy('created_at', 'desc');

    if ($limit) {
      $query->limit($limit);
    }

    return $query;
  }

  /**
   * Scope search blogs by title or excerpt
   */
  public function scopeSearch(Builder $query, string $search): Builder
  {
    return $query->where('title', 'LIKE', "%{$search}%")
      ->orWhere('excerpt', 'LIKE', "%{$search}%");
  }

  /**
   * Scope related blogs (exclude current blog)
   */
  public function scopeRelated(Builder $query, int $blogId, array $tags = []): Builder
  {
    return $query->where('id', '!=', $blogId)
      ->where('is_active', true);
  }
}
