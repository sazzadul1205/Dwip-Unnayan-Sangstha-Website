<?php

namespace Database\Factories\pages;

use App\Models\pages\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProgramFactory extends Factory
{
    protected $model = Program::class;

    public function definition(): array
    {
        return [
            'slug' => $this->faker->unique()->slug,
            'title' => $this->faker->sentence,
            'breadcrumb' => $this->faker->word,
            'full_content_html' => $this->faker->paragraph,
            'image' => $this->faker->imageUrl(),
            'bg_color' => $this->faker->hexColor,
            'link' => $this->faker->url,
            'is_featured' => false,
            'display_order' => $this->faker->numberBetween(0, 100),
            'is_active' => true,
        ];
    }
}
