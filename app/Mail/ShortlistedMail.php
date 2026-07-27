<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShortlistedMail extends Mailable
{
  use Queueable, SerializesModels;

  public Application $application;
  public string $customMessage;
  public string $subject;

  public function __construct(
    Application $application,
    string $subject,
    string $customMessage
  ) {
    $this->application = $application;
    $this->subject = $subject;
    $this->customMessage = $customMessage;
  }

  public function envelope(): Envelope
  {
    return new Envelope(
      subject: $this->subject,
    );
  }

  public function content(): Content
  {
    return new Content(
      view: 'emails.shortlisted',
      with: [
        'applicantName' => $this->application->name,
        'jobTitle' => $this->application->jobListing?->title ?? 'N/A',
        'companyName' => $this->application->jobListing?->employer?->name ?? config('app.name'),
        'customMessage' => $this->customMessage,
        'applicationId' => $this->application->id,
        'year' => now()->year,
      ],
    );
  }

  public function attachments(): array
  {
    return [];
  }
}
