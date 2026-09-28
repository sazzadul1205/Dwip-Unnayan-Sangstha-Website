<?php
// app/Mail/NewsletterBulkEmail.php

namespace App\Mail;

use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterBulkEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public NewsletterSubscription $subscriber,
        public NewsletterCampaign $campaign,
        /** Body HTML – already merge-tag resolved and sanitised by the job. */
        public string $renderedBody
    ) {}

    public function envelope(): Envelope
    {
        $envelope = new Envelope(subject: (string) $this->campaign->subject);

        // Let the admin control the sender identity and reply address.
        if ($this->campaign->from_email) {
            $envelope->from($this->campaign->from_email, $this->campaign->from_name);
        }

        if ($this->campaign->reply_to) {
            $envelope->replyTo($this->campaign->reply_to, $this->campaign->from_name);
        }

        return $envelope;
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.newsletter-bulk',
            with: [
                'name' => $this->subscriber->name ?? 'there',
                'firstName' => trim((string) str((string) ($this->subscriber->name ?? ''))->before(' ')),
                'email' => $this->subscriber->email,
                'subject' => $this->campaign->subject,
                'previewText' => $this->campaign->preview_text,
                'campaign' => $this->campaign,
                'content' => $this->renderedBody,
                'unsubscribeUrl' => $this->subscriber->unsubscribe_url,
                'appName' => config('app.name'),
                'year' => now()->year,
            ],
        );
    }
}

