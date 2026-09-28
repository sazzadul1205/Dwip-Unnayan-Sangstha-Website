<?php

namespace Database\Factories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Factories\Factory;

class PermissionFactory extends Factory
{
    protected $model = Permission::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->word . '_access',
            'slug' => $this->faker->unique()->slug,
            'description' => $this->faker->sentence,
            'is_active' => true,
        ];
    }
}
