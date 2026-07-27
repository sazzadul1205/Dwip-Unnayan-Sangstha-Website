<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomVerifyEmailNotification extends VerifyEmail
{
    /**
     * Get the mail representation of the notification.
     *
     * @param mixed $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify your email address')
            ->view('emails.verification', [
                'subject' => 'Verify your email address',
                'userName' => $notifiable->name ?? 'there',
                'appName' => config('app.name'),
                'verificationUrl' => $verificationUrl,
            ]);
    }
}
