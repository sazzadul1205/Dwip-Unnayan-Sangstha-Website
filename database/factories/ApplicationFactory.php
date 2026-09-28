<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\User;
use App\Models\JobListing;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApplicationFactory extends Factory
{
    protected $model = Application::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'job_listing_id' => JobListing::factory(),
            'applicant_profile_id' => null,
            'name' => $this->faker->name,
            'email' => $this->faker->email,
            'phone' => $this->faker->phoneNumber,
            'education_level' => $this->faker->word,
            'years_of_experience' => $this->faker->numberBetween(0, 20),
            'resume_path' => null,
            'expected_salary' => $this->faker->numberBetween(20000, 100000),
            'ats_score' => $this->faker->numberBetween(0, 100),
            'matched_keywords' => json_encode([]),
            'missing_keywords' => json_encode([]),
            'ats_last_attempted_at' => null,
            'ats_attempt_count' => 0,
            'ats_calculation_status' => 'pending',
            'status' => 'pending',
            'employer_notes' => null,
            'facebook_link' => null,
            'linkedin_link' => null,
        ];
    }
}
