<?php

namespace App\Mail;

use App\Models\NewsletterSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterBulkEmail extends Mailable
{
  use Queueable, SerializesModels;

  public NewsletterSubscription $subscriber;
  public string $subjectLine;
  public string $content;

  public function __construct(NewsletterSubscription $subscriber, string $subject, string $content)
  {
    $this->subscriber = $subscriber;
    $this->subjectLine = $subject;
    $this->content = $content;
  }

  public function envelope(): Envelope
  {
    return new Envelope(
      subject: $this->subjectLine,
    );
  }

  public function content(): Content
  {
    return new Content(
      view: 'emails.newsletter-bulk',
      with: [
        'name' => $this->subscriber->name ?? 'Subscriber',
        'email' => $this->subscriber->email,
        'content' => $this->content,
        'unsubscribeUrl' => $this->subscriber->unsubscribe_url,
        'year' => now()->year,
      ],
    );
  }
}
