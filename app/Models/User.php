<?php

namespace App\Models;

use App\Traits\HasRoles;
use App\Notifications\CustomResetPasswordNotification;
use App\Notifications\CustomVerifyEmailNotification;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Notifications\DatabaseNotification;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
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

    /**
     * Applications submitted to the jobs this user posted.
     *
     * Distinct from applications(): employers post jobs and never apply to
     * them, so applications() is structurally empty for employer accounts.
     * Traverse through job_listings to reach the applications they received.
     * Trashed listings and soft-deleted applications are excluded automatically.
     */
    public function receivedApplications(): HasManyThrough
    {
        return $this->hasManyThrough(
            Application::class,
            JobListing::class,
            'user_id',
            'job_listing_id'
        );
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

    /**
     * Send the password reset notification using the custom email template.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new CustomResetPasswordNotification($token));
    }

    /**
     * Send the email verification notification using the custom email template.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new CustomVerifyEmailNotification());
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
