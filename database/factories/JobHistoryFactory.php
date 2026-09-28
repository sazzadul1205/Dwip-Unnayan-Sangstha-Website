<?php

namespace Database\Factories;

use App\Models\JobHistory;
use App\Models\ApplicantProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

class JobHistoryFactory extends Factory
{
    protected $model = JobHistory::class;

    public function definition(): array
    {
        return [
            'applicant_profile_id' => ApplicantProfile::factory(),
            'company_name' => $this->faker->company,
            'position' => $this->faker->jobTitle,
            'starting_year' => $this->faker->numberBetween(2000, 2020),
            'ending_year' => $this->faker->numberBetween(2005, 2025),
            'is_current' => $this->faker->boolean,
        ];
    }
}
