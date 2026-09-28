<?php

namespace Database\Factories\pages;

use App\Models\pages\Page;
use App\Models\pages\SectionConfig;
use Illuminate\Database\Eloquent\Factories\Factory;

class SectionConfigFactory extends Factory
{
    protected $model = SectionConfig::class;

    public function definition(): array
    {
        return [
            'page_slug' => Page::inRandomOrder()->first()?->slug ?? Page::factory(),
            'section_key' => $this->faker->word,
            'component' => $this->faker->word,
            'data_table' => null,
            'data_key' => $this->faker->word,
            'prop_name' => $this->faker->word,
            'display_order' => $this->faker->numberBetween(0, 100),
            'is_enabled' => true,
            'is_fixed_section' => false,
            'is_special_component' => false,
            'custom_props' => null,
        ];
    }
}
