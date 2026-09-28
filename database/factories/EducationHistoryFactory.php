<?php

namespace Database\Factories;

use App\Models\EducationHistory;
use App\Models\ApplicantProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

class EducationHistoryFactory extends Factory
{
    protected $model = EducationHistory::class;

    public function definition(): array
    {
        return [
            'applicant_profile_id' => ApplicantProfile::factory(),
            'institution_name' => $this->faker->company,
            'degree' => $this->faker->randomElement(['BSc', 'MSc', 'PhD', 'BBA', 'MBA']),
            'passing_year' => $this->faker->numberBetween(1990, 2025),
        ];
    }
}
