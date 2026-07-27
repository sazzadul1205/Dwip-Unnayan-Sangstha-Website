<?php

namespace App\Mail;

use App\Models\NewsletterSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterWelcomeEmail extends Mailable
{
  use Queueable, SerializesModels;

  public NewsletterSubscription $subscription;

  public function __construct(NewsletterSubscription $subscription)
  {
    $this->subscription = $subscription;
  }

  public function envelope(): Envelope
  {
    return new Envelope(
      subject: 'Welcome to Our Newsletter!',
    );
  }

  public function content(): Content
  {
    return new Content(
      view: 'emails.newsletter-welcome',
      with: [
        'name' => $this->subscription->name ?? 'Subscriber',
        'email' => $this->subscription->email,
        'unsubscribeUrl' => $this->subscription->unsubscribe_url,
        'year' => now()->year,
      ],
    );
  }
}
