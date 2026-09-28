<?php

namespace Database\Factories;

use App\Models\RoleModuleAccess;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleModuleAccessFactory extends Factory
{
    protected $model = RoleModuleAccess::class;

    public function definition(): array
    {
        return [
            'role_id' => Role::factory(),
            'module' => $this->faker->word,
            'access_level' => $this->faker->randomElement(['no_access', 'read', 'write', 'manage']),
        ];
    }
}
