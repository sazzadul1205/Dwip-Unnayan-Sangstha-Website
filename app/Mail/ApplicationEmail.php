<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationEmail extends Mailable
{
  use Queueable, SerializesModels;

  /**
   * Email content/body.
   */
  public string $emailContent;

  /**
   * Applicant full name.
   */
  public string $applicantName;

  /**
   * Job title.
   */
  public ?string $jobTitle;

  /**
   * Company name.
   */
  public string $companyName;

  /**
   * Application ID.
   */
  public int|string|null $applicationId;

  /**
   * Create a new message instance.
   */
  public function __construct(
    string $subject,
    string $content,
    string $applicantName,
    ?string $jobTitle = null,
    ?string $companyName = null,
    int|string|null $applicationId = null
  ) {
    // ✅ Set the subject using the parent's property
    $this->subject = $subject;

    // Store content in a different property name
    $this->emailContent = $content;
    $this->applicantName = $applicantName;
    $this->jobTitle = $jobTitle;
    $this->companyName = $companyName ?? config('app.name');
    $this->applicationId = $applicationId;
  }

  /**
   * Get the message envelope.
   */
  public function envelope(): Envelope
  {
    return new Envelope(
      subject: $this->subject,
    );
  }

  /**
   * Get the message content definition.
   */
  public function content(): Content
  {
    return new Content(
      view: 'emails.application',
      with: [
        'subject' => $this->subject,
        'content' => $this->emailContent,
        'applicantName' => $this->applicantName,
        'jobTitle' => $this->jobTitle,
        'companyName' => $this->companyName,
        'applicationId' => $this->applicationId,
      ],
    );
  }

  /**
   * Get the attachments for the message.
   *
   * @return array<int, \Illuminate\Mail\Mailables\Attachment>
   */
  public function attachments(): array
  {
    return [];
  }
}
