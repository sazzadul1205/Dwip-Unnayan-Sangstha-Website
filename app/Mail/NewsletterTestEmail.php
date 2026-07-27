<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterTestEmail extends Mailable
{
  use Queueable, SerializesModels;

  public string $subjectLine;

  public function __construct(string $subjectLine = 'Newsletter Test Email')
  {
    $this->subjectLine = $subjectLine;
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
      view: 'emails.newsletter-test',
      with: [
        'subject' => $this->subjectLine,
        'year' => now()->year,
      ],
    );
  }
}
