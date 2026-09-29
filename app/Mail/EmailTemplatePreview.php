<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sends a rendered email template to one address for review.
 *
 * The markup is already-compiled HTML handed over by the template
 * editor, so this mailable has no Blade view of its own.
 */
class EmailTemplatePreview extends Mailable
{
  use Queueable, SerializesModels;

  public function __construct(
    public string $markup,
    public string $subjectLine,
    public string $recipient,
  ) {}

  public function envelope(): Envelope
  {
    return new Envelope(subject: $this->subjectLine);
  }

  public function content(): Content
  {
    return new Content(html: $this->markup);
  }
}
