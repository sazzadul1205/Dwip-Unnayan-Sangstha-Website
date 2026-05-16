<?php

namespace App\Models;

use App\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\DatabaseNotification;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'old_password',
        'google_id',
        'google_avatar',
        'email_verified_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ========== BUSINESS RELATIONSHIPS ==========

    public function applicantProfile()
    {
        return $this->hasOne(ApplicantProfile::class);
    }

    public function jobListings()
    {
        return $this->hasMany(JobListing::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function jobViews()
    {
        return $this->hasMany(JobView::class);
    }

    // ========== NOTIFICATIONS ==========

    public function notifications()
    {
        return $this->morphMany(DatabaseNotification::class, 'notifiable')
            ->orderBy('created_at', 'desc');
    }

    public function unreadNotifications()
    {
        return $this->notifications()->whereNull('read_at');
    }

    protected $appends = ['roles_list', 'permissions_list'];

    public function getRolesListAttribute()
    {
        return $this->roles()->get(['id', 'name', 'slug', 'level']);
    }

    public function getPermissionsListAttribute()
    {
        return $this->getAllPermissions();
    }
}
