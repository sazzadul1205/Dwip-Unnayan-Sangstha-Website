<?php

namespace Database\Factories;

use App\Models\NewsletterCampaign;
use Illuminate\Database\Eloquent\Factories\Factory;

class NewsletterCampaignFactory extends Factory
{
    protected $model = NewsletterCampaign::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'subject' => $this->faker->sentence,
            'content' => $this->faker->paragraph,
            'status' => 'draft',
            'scheduled_at' => null,
            'sent_at' => null,
        ];
    }
}
