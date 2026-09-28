<?php

namespace Database\Factories;

use App\Models\ApplicantCv;
use App\Models\ApplicantProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApplicantCvFactory extends Factory
{
    protected $model = ApplicantCv::class;

    public function definition(): array
    {
        return [
            'applicant_profile_id' => ApplicantProfile::factory(),
            'cv_path' => 'cvs/' . $this->faker->uuid . '.pdf',
            'original_name' => $this->faker->word . '.pdf',
            'order_position' => $this->faker->numberBetween(0, 10),
            'is_primary' => $this->faker->boolean,
            'status' => $this->faker->randomElement(['pending', 'active']),
        ];
    }
}
