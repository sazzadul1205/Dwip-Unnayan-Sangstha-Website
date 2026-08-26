<?php
// app/Jobs/SendNewsletterBulkEmail.php

namespace App\Jobs;

use App\Mail\NewsletterBulkEmail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscription;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendNewsletterBulkEmail implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 60;
    public $tries = 3;

    public function __construct(
        public NewsletterSubscription $subscriber,
        public NewsletterCampaign $campaign
    ) {}

    public function handle(): void
    {
        try {
            Mail::to($this->subscriber->email)
                ->send(new NewsletterBulkEmail(
                    $this->subscriber,
                    $this->campaign->subject,
                    $this->campaign->content
                ));
        } catch (\Exception $e) {
            Log::error('Newsletter email failed', [
                'subscriber_id' => $this->subscriber->id,
                'campaign_id'   => $this->campaign->id,
                'error'         => $e->getMessage(),
            ]);
            throw $e; // will be marked as failed by the batch
        }
    }
}
