<?php
// app/Models/pages/SharedData.php

namespace App\Models\pages;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SharedData extends Model
{
  use HasFactory, SoftDeletes;

  /**
   * Table name
   */
  protected $table = 'shared_data';

  /**
   * Fillable fields
   */
  protected $fillable = [
    'type',
    'data',
    'is_active',
  ];

  /**
   * Cast fields
   */
  protected $casts = [
    'data' => 'array',
    'is_active' => 'boolean',
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
    'deleted_at' => 'datetime',
  ];

    /* ==========================================
     | SCOPES
     |========================================== */

  /**
   * Scope active shared data
   */
  public function scopeActive(Builder $query): Builder
  {
    return $query->where('is_active', true);
  }

  /**
   * Scope by type
   */
  public function scopeOfType(Builder $query, string $type): Builder
  {
    return $query->where('type', $type);
  }

    /* ==========================================
     | HELPERS
     |========================================== */

  /**
   * Get topbar data
   */
  public static function getTopbar()
  {
    return self::ofType('topbar')->active()->first();
  }

  /**
   * Get navbar data
   */
  public static function getNavbar()
  {
    return self::ofType('navbar')->active()->first();
  }

  /**
   * Get footer data
   */
  public static function getFooter()
  {
    return self::ofType('footer')->active()->first();
  }

  /**
   * Get FAQ data
   */
  public static function getFaqs()
  {
    return self::ofType('faq')->active()->first();
  }

  /**
   * Get upcoming events data
   */
  public static function getUpcomingEvents()
  {
    return self::ofType('upcoming-events')->active()->first();
  }

    /* ==========================================
     | ACCESSORS
     |========================================== */

  /**
   * Get data as object
   */
  public function getDataObjectAttribute()
  {
    return json_decode(json_encode($this->data));
  }
}
