<?php

namespace Database\Factories\pages;

use App\Models\pages\Publication;
use Illuminate\Database\Eloquent\Factories\Factory;

class PublicationFactory extends Factory
{
    protected $model = Publication::class;

    public function definition(): array
    {
        return [
            'slug' => $this->faker->unique()->slug,
            'title' => $this->faker->sentence,
            'excerpt' => $this->faker->paragraph,
            'full_content' => $this->faker->paragraphs(3, true),
            'image' => $this->faker->imageUrl(),
            'pdf_url' => $this->faker->url,
            'date' => now()->toDateString(),
            'author' => $this->faker->name,
            'read_time' => $this->faker->numberBetween(1, 20),
            'tags' => json_encode(['tag1']),
            'category' => $this->faker->word,
            'views' => 0,
            'is_featured' => false,
            'is_active' => true,
        ];
    }
}
