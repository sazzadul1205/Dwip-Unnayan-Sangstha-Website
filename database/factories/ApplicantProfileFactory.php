<?php

namespace Database\Factories;

use App\Models\ApplicantProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApplicantProfileFactory extends Factory
{
    protected $model = ApplicantProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'first_name' => $this->faker->firstName,
            'last_name' => $this->faker->lastName,
            'phone' => $this->faker->phoneNumber,
            'address' => $this->faker->address,
            'gender' => $this->faker->randomElement(['male', 'female', 'other']),
            'birth_date' => $this->faker->date(),
            'experience_years' => $this->faker->numberBetween(0, 30),
            'current_job_title' => $this->faker->jobTitle,
        ];
    }
}
