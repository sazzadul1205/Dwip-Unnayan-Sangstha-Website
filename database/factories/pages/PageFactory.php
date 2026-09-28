<?php

namespace Database\Factories\pages;

use App\Models\pages\Page;
use Illuminate\Database\Eloquent\Factories\Factory;

class PageFactory extends Factory
{
    protected $model = Page::class;

    public function definition(): array
    {
        return [
            'slug' => $this->faker->unique()->slug,
            'name' => $this->faker->word,
            'title' => $this->faker->sentence,
            'description' => $this->faker->paragraph,
            'is_active' => true,
        ];
    }
}
