<?php

describe('ApplicantProfile Model', function () {
    it('can be created with factory', function () {
        $profile = \App\Models\ApplicantProfile::factory()->create();
        expect($profile->exists)->toBeTrue();
    });

    it('has required fillable fields', function () {
        $profile = new \App\Models\ApplicantProfile();
        expect($profile->getFillable())->toContain('first_name', 'last_name', 'phone', 'user_id');
    });

    it('uses soft deletes', function () {
        expect(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(\App\Models\ApplicantProfile::class)))
            ->toBeTrue();
    });
});

describe('JobListing Model', function () {
    it('can be created with factory', function () {
        $jobListing = \App\Models\JobListing::factory()->create();
        expect($jobListing->exists)->toBeTrue();
    });

    it('has required fillable fields', function () {
        $job = new \App\Models\JobListing();
        expect($job->getFillable())->toContain('title', 'slug', 'description', 'is_active');
    });

    it('uses soft deletes', function () {
        expect(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(\App\Models\JobListing::class)))
            ->toBeTrue();
    });
});

describe('Role Model', function () {
    it('can be created with factory', function () {
        $role = \App\Models\Role::factory()->create();
        expect($role->exists)->toBeTrue();
    });

    it('has required fillable fields', function () {
        $role = new \App\Models\Role();
        expect($role->getFillable())->toContain('name', 'slug', 'level');
    });

    it('casts is_active as boolean', function () {
        $role = new \App\Models\Role();
        expect($role->getCasts())->toHaveKey('is_active', 'boolean');
    });
});

describe('JobCategory Model', function () {
    it('can be created with factory', function () {
        $category = \App\Models\JobCategory::factory()->create();
        expect($category->exists)->toBeTrue();
    });

    it('uses soft deletes', function () {
        expect(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(\App\Models\JobCategory::class)))
            ->toBeTrue();
    });
});

describe('Location Model', function () {
    it('can be created with factory', function () {
        $location = \App\Models\Location::factory()->create();
        expect($location->exists)->toBeTrue();
    });

    it('uses soft deletes', function () {
        expect(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(\App\Models\Location::class)))
            ->toBeTrue();
    });
});

describe('Page Model', function () {
    it('can be created with factory', function () {
        $page = \App\Models\pages\Page::factory()->create();
        expect($page->exists)->toBeTrue();
    });

    it('has required fillable fields', function () {
        $page = new \App\Models\pages\Page();
        expect($page->getFillable())->toContain('slug', 'name', 'title');
    });

    it('uses soft deletes', function () {
        expect(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(\App\Models\pages\Page::class)))
            ->toBeTrue();
    });
});

describe('Blog Model', function () {
    it('can be created with factory', function () {
        $blog = \App\Models\pages\Blog::factory()->create();
        expect($blog->exists)->toBeTrue();
    });

    it('uses soft deletes', function () {
        expect(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(\App\Models\pages\Blog::class)))
            ->toBeTrue();
    });
});

describe('Program Model', function () {
    it('can be created with factory', function () {
        $program = \App\Models\pages\Program::factory()->create();
        expect($program->exists)->toBeTrue();
    });

    it('uses soft deletes', function () {
        expect(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(\App\Models\pages\Program::class)))
            ->toBeTrue();
    });
});
