<?php

namespace Database\Factories;

use App\Models\UserRole;
use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserRoleFactory extends Factory
{
    protected $model = UserRole::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'role_id' => Role::factory(),
            'assigned_by' => User::factory(),
            'assigned_at' => now(),
            'is_active' => true,
            'expires_at' => null,
        ];
    }
}
