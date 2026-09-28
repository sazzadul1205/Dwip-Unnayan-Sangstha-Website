<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->word,
            'slug' => $this->faker->unique()->slug,
            'description' => $this->faker->sentence,
            'level' => $this->faker->numberBetween(0, 100),
            'is_default' => false,
            'is_active' => true,
            'created_by' => null,
            'updated_by' => null,
        ];
    }
}
