<?php

namespace Database\Factories\pages;

use App\Models\pages\AboutContent;
use Illuminate\Database\Eloquent\Factories\Factory;

class AboutContentFactory extends Factory
{
    protected $model = AboutContent::class;

    public function definition(): array
    {
        return [
            'slug' => $this->faker->unique()->slug,
            'title' => $this->faker->sentence,
            'type' => $this->faker->word,
            'content' => $this->faker->paragraph,
            'full_content' => $this->faker->paragraphs(3, true),
            'image' => $this->faker->imageUrl(),
            'icon' => $this->faker->word,
            'bg_color' => $this->faker->hexColor,
            'btn_text' => 'Learn More',
            'btn_link' => $this->faker->url,
            'display_order' => $this->faker->numberBetween(0, 100),
            'is_featured' => false,
            'tags' => json_encode(['tag1']),
            'is_active' => true,
        ];
    }
}
