<?php

namespace Database\Factories;

use App\Models\StatusTimeline;
use App\Models\Application;
use Illuminate\Database\Eloquent\Factories\Factory;

class StatusTimelineFactory extends Factory
{
    protected $model = StatusTimeline::class;

    public function definition(): array
    {
        return [
            'application_id' => Application::factory(),
            'status' => $this->faker->randomElement(['pending', 'shortlisted', 'rejected', 'hired']),
            'notes' => $this->faker->sentence,
        ];
    }
}
