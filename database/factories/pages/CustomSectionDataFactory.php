<?php

namespace Database\Factories\pages;

use App\Models\pages\CustomSectionData;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomSectionDataFactory extends Factory
{
    protected $model = CustomSectionData::class;

    public function definition(): array
    {
        return [
            'page_slug' => 'home',
            'section_key' => $this->faker->word,
            'data' => json_encode([$this->faker->word => $this->faker->sentence]),
            'is_active' => true,
        ];
    }
}
