<?php
// app/Models/pages/Publication.php

namespace App\Models\pages;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Publication extends Model
{
  use HasFactory, SoftDeletes;

  /**
   * Table name
   */
  protected $table = 'publications';

  /**
   * Fillable fields
   */
  protected $fillable = [
    'slug',
    'title',
    'excerpt',
    'full_content',
    'image',
    'pdf_url',
    'date',
    'author',
    'read_time',
    'tags',
    'category',
    'views',
    'is_featured',
    'is_active',
  ];

  /**
   * Cast fields
   */
  protected $casts = [
    'tags' => 'array',
    'views' => 'integer',
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
   * Scope active publications
   */
  public function scopeActive(Builder $query): Builder
  {
    return $query->where('is_active', true);
  }

  /**
   * Scope featured publications
   */
  public function scopeFeatured(Builder $query): Builder
  {
    return $query->where('is_featured', true);
  }

  /**
   * Scope latest publications with optional limit
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
   * Scope by category
   */
  public function scopeByCategory(Builder $query, string $category): Builder
  {
    return $query->where('category', $category);
  }

  /**
   * Scope search publications by title or excerpt
   */
  public function scopeSearch(Builder $query, string $search): Builder
  {
    return $query->where('title', 'LIKE', "%{$search}%")
      ->orWhere('excerpt', 'LIKE', "%{$search}%")
      ->orWhere('author', 'LIKE', "%{$search}%");
  }

  /**
   * Scope related publications (exclude current publication)
   */
  public function scopeRelated(Builder $query, int $publicationId, array $tags = []): Builder
  {
    $query = $query->where('id', '!=', $publicationId)
      ->where('is_active', true);

    if (!empty($tags)) {
      $query->where(function ($q) use ($tags) {
        foreach ($tags as $tag) {
          $q->orWhereJsonContains('tags', $tag);
        }
      });
    }

    return $query;
  }

  /**
   * Scope most viewed publications
   */
  public function scopeMostViewed(Builder $query, $limit = null): Builder
  {
    $query = $query->orderBy('views', 'desc');

    if ($limit) {
      $query->limit($limit);
    }

    return $query;
  }

  /* ==========================================
   | ACCESSORS
   |========================================== */

  /**
   * Get formatted date
   */
  public function getFormattedDateAttribute(): string
  {
    return $this->date ? date('F j, Y', strtotime($this->date)) : '';
  }

  /**
   * Get excerpt from full content if excerpt is empty
   */
  public function getExcerptAttribute($value): string
  {
    if (!empty($value)) {
      return $value;
    }

    $content = strip_tags($this->full_content);
    return strlen($content) > 150 ? substr($content, 0, 150) . '...' : $content;
  }

  /**
   * Increment views
   */
  public function incrementViews(): void
  {
    $this->increment('views');
  }

  /**
   * Check if pdf_url contains base64 data
   */
  public function isBase64Pdf(): bool
  {
    return $this->pdf_url && str_starts_with($this->pdf_url, 'data:application/pdf;base64,');
  }

  /**
   * Get the actual PDF path or URL
   * If it's base64, it will be processed during save
   * If it's a path, return it directly
   */
  public function getPdfUrlAttribute($value): ?string
  {
    // If it's a base64 string or a valid URL/path, return as is
    if ($value && (str_starts_with($value, 'data:application/pdf') || filter_var($value, FILTER_VALIDATE_URL))) {
      return $value;
    }
    // If it's a storage path, return with storage prefix
    if ($value && str_starts_with($value, '/storage/')) {
      return $value;
    }
    return $value;
  }
}
