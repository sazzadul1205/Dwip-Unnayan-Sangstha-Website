<?php

namespace Database\Factories\pages;

use App\Models\pages\SharedData;
use Illuminate\Database\Eloquent\Factories\Factory;

class SharedDataFactory extends Factory
{
    protected $model = SharedData::class;

    public function definition(): array
    {
        return [
            'type' => $this->faker->word,
            'data' => json_encode(['key' => 'value']),
            'is_active' => true,
        ];
    }
}
