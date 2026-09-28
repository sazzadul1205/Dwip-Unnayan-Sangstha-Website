<?php

namespace Database\Factories;

use App\Models\JobCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class JobCategoryFactory extends Factory
{
    protected $model = JobCategory::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->word,
            'slug' => $this->faker->unique()->slug,
            'is_active' => true,
        ];
    }
}
