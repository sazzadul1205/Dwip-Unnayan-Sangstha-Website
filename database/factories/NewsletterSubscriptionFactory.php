<?php

namespace Database\Factories;

use App\Models\NewsletterSubscription;
use Illuminate\Database\Eloquent\Factories\Factory;

class NewsletterSubscriptionFactory extends Factory
{
    protected $model = NewsletterSubscription::class;

    public function definition(): array
    {
        return [
            'email' => $this->faker->unique()->safeEmail,
            'token' => \Illuminate\Support\Str::random(64),
            'is_subscribed' => true,
            'subscribed_at' => now(),
        ];
    }
}
