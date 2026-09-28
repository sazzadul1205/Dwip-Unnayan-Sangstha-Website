<?php
// app/Jobs/SendNewsletterBulkEmail.php

namespace App\Jobs;

use App\Mail\NewsletterBulkEmail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterCampaignRecipient;
use App\Models\NewsletterSubscription;
use App\Services\NewsletterContentRenderer;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendNewsletterBulkEmail implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 60;
    public $tries = 3;

    public function __construct(
        public NewsletterSubscription $subscriber,
        public NewsletterCampaign $campaign,
        public ?NewsletterCampaignRecipient $delivery = null
    ) {}

    public function handle(NewsletterContentRenderer $renderer): void
    {
        $ledgerRow = $this->delivery
            ?? NewsletterCampaignRecipient::firstOrNew([
                'newsletter_campaign_id' => $this->campaign->id,
                'newsletter_subscription_id' => $this->subscriber->id,
            ]);

        // Always keep a copy of the address/name on the ledger row so the
        // record survives the subscriber being deleted later.
        $ledgerRow->fill([
            'email' => $this->subscriber->email,
            'name' => $this->subscriber->name,
            'status' => NewsletterCampaignRecipient::STATUS_PENDING,
        ])->save();

        try {
            // Render merge tags + sanitise the admin-authored HTML per recipient.
            $rendered = $renderer->render(
                (string) ($this->campaign->html_content ?: $this->campaign->content),
                $renderer->mergeMap($this->subscriber)
            );

            Mail::to($this->subscriber->email)
                ->send(new NewsletterBulkEmail(
                    $this->subscriber,
                    $this->campaign,
                    $rendered
                ));

            $ledgerRow->markSent();
        } catch (Throwable $e) {
            // Classify the failure so the Campaign Manager can distinguish a
            // permanent "mailbox does not exist" from a transient outage.
            $hardBounce = $this->isHardBounce($e);

            $ledgerRow->markFailed($e->getMessage(), $hardBounce);

            Log::error('Newsletter email failed', [
                'subscriber_id' => $this->subscriber->id,
                'campaign_id'   => $this->campaign->id,
                'email'         => $this->subscriber->email,
                'hard_bounce'   => $hardBounce,
                'error'         => $e->getMessage(),
            ]);

            // A permanent failure will never succeed on retry, so mark the
            // subscriber as bounced and do not re-queue the job.
            if ($hardBounce) {
                $this->subscriber->markAsBounced();

                return;
            }

            throw $e; // re-queued by the queue, finally reported by the batch
        }
    }

    /**
     * A 5xx SMTP reply (or an explicit "unknown user" message) means the
     * mailbox is gone; retrying is pointless and only burns quota.
     */
    private function isHardBounce(Throwable $e): bool
    {
        $message = $e->getMessage();

        if (preg_match('/\b5\d{2}\b/', $message)) {
            return true;
        }

        $hardMarkers = [
            'user unknown',
            'no such user',
            'mailbox unavailable',
            'does not exist',
            'recipient address rejected',
            'account expired',
            'unrouteable address',
        ];

        foreach ($hardMarkers as $marker) {
            if (str_contains(strtolower($message), $marker)) {
                return true;
            }
        }

        return false;
    }
}

