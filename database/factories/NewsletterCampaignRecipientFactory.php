<?php

namespace Database\Factories;

use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscription;
use App\Models\NewsletterCampaignRecipient;
use Illuminate\Database\Eloquent\Factories\Factory;

class NewsletterCampaignRecipientFactory extends Factory
{
    protected $model = NewsletterCampaignRecipient::class;

    public function definition(): array
    {
        return [
            'newsletter_campaign_id' => NewsletterCampaign::factory(),
            'newsletter_subscription_id' => NewsletterSubscription::factory(),
            'email' => $this->faker->email,
            'name' => $this->faker->name,
            'status' => $this->faker->randomElement(['pending', 'sent', 'failed', 'bounced', 'skipped']),
            'error_message' => null,
            'message_id' => null,
            'attempts' => $this->faker->numberBetween(0, 3),
            'sent_at' => null,
        ];
    }
}
