<?php
// app/Models/NewsletterCampaign.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterCampaign extends Model
{
    protected $fillable = [
        'subject',
        'content',
        'status',
        'total_subscribers',
        'sent_count',
        'failed_count',
        'created_by',
        'batch_id',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updateProgress(int $sent, int $failed = 0): void
    {
        $this->sent_count = $sent;
        $this->failed_count = $failed;
        if ($this->sent_count + $this->failed_count >= $this->total_subscribers) {
            $this->status = 'completed';
            $this->completed_at = now();
        }
        $this->save();
    }

    public function getProgressAttribute(): int
    {
        if ($this->total_subscribers === 0) {
            return 0;
        }
        return round((($this->sent_count + $this->failed_count) / $this->total_subscribers) * 100);
    }
}