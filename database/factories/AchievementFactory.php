<?php

namespace Database\Factories;

use App\Models\Achievement;
use App\Models\ApplicantProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

class AchievementFactory extends Factory
{
    protected $model = Achievement::class;

    public function definition(): array
    {
        return [
            'applicant_profile_id' => ApplicantProfile::factory(),
            'achievement_name' => $this->faker->sentence(3),
            'achievement_details' => $this->faker->paragraph,
        ];
    }
}
