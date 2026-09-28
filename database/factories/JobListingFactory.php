<?php

namespace Database\Factories;

use App\Models\JobListing;
use App\Models\JobCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class JobListingFactory extends Factory
{
    protected $model = JobListing::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->jobTitle,
            'slug' => $this->faker->unique()->slug,
            'description' => $this->faker->paragraph,
            'requirements' => $this->faker->paragraph,
            'job_type' => $this->faker->randomElement(['full-time', 'part-time', 'contract', 'temporary']),
            'salary_min' => $this->faker->numberBetween(10000, 50000),
            'salary_max' => $this->faker->numberBetween(60000, 150000),
            'is_salary_negotiable' => false,
            'as_per_companies_policy' => false,
            'category_id' => JobCategory::factory(),
            'experience_level' => $this->faker->randomElement(['entry', 'mid', 'senior', 'expert']),
            'education_requirement' => $this->faker->word,
            'education_details' => $this->faker->paragraph,
            'benefits' => json_encode(['benefit1']),
            'skills' => json_encode(['skill1', 'skill2']),
            'responsibilities' => json_encode(['resp1']),
            'keywords' => json_encode(['keyword1', 'keyword2']),
            'application_deadline' => now()->addDays(30),
            'publish_at' => now(),
            'views_count' => 0,
            'is_active' => true,
            'user_id' => User::factory(),
            'required_facebook_link' => false,
            'required_linkedin_link' => false,
        ];
    }
}
