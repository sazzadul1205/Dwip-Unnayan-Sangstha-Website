<?php

namespace App\Jobs;

use App\Models\NewsletterSubscription;
use App\Mail\NewsletterBulkEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendNewsletterBulkEmail implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  protected $subscriber;
  protected $subject;
  protected $content;

  public $timeout = 120;
  public $tries = 3;
  public $backoff = [60, 120, 300];

  /**
   * Create a new job instance.
   */
  public function __construct(NewsletterSubscription $subscriber, string $subject, string $content)
  {
    $this->subscriber = $subscriber;
    $this->subject = $subject;
    $this->content = $content;
  }

  /**
   * Execute the job.
   */
  public function handle(): void
  {
    try {
      Mail::to($this->subscriber->email)->send(new NewsletterBulkEmail(
        $this->subscriber,
        $this->subject,
        $this->content
      ));

      Log::info('Newsletter email sent via queue', [
        'email' => $this->subscriber->email,
        'subject' => $this->subject
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to send newsletter email', [
        'email' => $this->subscriber->email,
        'error' => $e->getMessage()
      ]);
      throw $e; // This will trigger retry
    }
  }

  /**
   * Handle a job failure.
   */
  public function failed(\Throwable $exception): void
  {
    Log::error('Newsletter email permanently failed after retries', [
      'email' => $this->subscriber->email,
      'error' => $exception->getMessage()
    ]);
  }
}
