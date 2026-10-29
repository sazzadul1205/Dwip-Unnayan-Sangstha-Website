<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\pages\Page;
use App\Models\pages\Blog;
use App\Models\pages\Program;
use App\Models\pages\Publication;
use App\Models\pages\AboutContent;
use App\Models\pages\SectionConfig;
use App\Models\pages\SharedData;
use App\Models\pages\CustomSectionData;
use App\Models\JobListing;
use App\Models\JobCategory;
use App\Models\Location;
use App\Models\Application;
use App\Models\ApplicantProfile;
use App\Models\NewsletterSubscription;
use App\Models\NewsletterCampaign;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Page Model Edge Cases', function () {
    it('handles null slug gracefully', function () {
        $page = Page::factory()->make(['slug' => null]);
        expect($page->slug)->toBeNull();
    });

    it('enforces unique slug constraint', function () {
        Page::factory()->create(['slug' => 'unique-slug']);
        expect(fn () => Page::factory()->create(['slug' => 'unique-slug']))
            ->toThrow(\Illuminate\Database\QueryException::class);
    });

    it('soft deletes and restores correctly', function () {
        $page = Page::factory()->create();
        $page->delete();
        expect(Page::withTrashed()->find($page->id))->not->toBeNull();
        expect(Page::find($page->id))->toBeNull();

        $page->restore();
        expect(Page::find($page->id))->not->toBeNull();
    });
});

describe('Blog Model Edge Cases', function () {
    it('handles null content gracefully', function () {
        $blog = Blog::factory()->make(['content' => null]);
        expect($blog->content)->toBeNull();
    });

    it('soft deletes and restores correctly', function () {
        $blog = Blog::factory()->create();
        $blog->delete();
        expect(Blog::withTrashed()->find($blog->id))->not->toBeNull();
        $blog->restore();
        expect(Blog::find($blog->id))->not->toBeNull();
    });

    it('handles empty tags array', function () {
        $blog = Blog::factory()->create(['tags' => []]);
        expect($blog->tags)->toBeArray();
        expect($blog->tags)->toBeEmpty();
    });

    it('handles null image gracefully', function () {
        $blog = Blog::factory()->make(['image' => null]);
        expect($blog->image)->toBeNull();
    });
});

describe('Program Model Edge Cases', function () {
    it('handles null description gracefully', function () {
        $program = Program::factory()->make(['description' => null]);
        expect($program->description)->toBeNull();
    });

    it('soft deletes and restores correctly', function () {
        $program = Program::factory()->create();
        $program->delete();
        expect(Program::withTrashed()->find($program->id))->not->toBeNull();
        $program->restore();
        expect(Program::find($program->id))->not->toBeNull();
    });
});

describe('Publication Model Edge Cases', function () {
    it('handles null pdf_url gracefully', function () {
        $publication = Publication::factory()->make(['pdf_url' => null]);
        expect($publication->pdf_url)->toBeNull();
    });

    it('handles null excerpt gracefully', function () {
        $publication = new Publication([
            'slug' => 'test-slug',
            'title' => 'Test Title',
            'excerpt' => null,
            'full_content' => 'This is the full content of the publication.',
        ]);
        $publication->save();
        expect($publication->getRawOriginal('excerpt'))->toBeNull();
    });

    it('soft deletes and restores correctly', function () {
        $publication = Publication::factory()->create();
        $publication->delete();
        expect(Publication::withTrashed()->find($publication->id))->not->toBeNull();
        $publication->restore();
        expect(Publication::find($publication->id))->not->toBeNull();
    });
});

describe('AboutContent Model Edge Cases', function () {
    it('handles null content gracefully', function () {
        $content = AboutContent::factory()->make(['content' => null]);
        expect($content->content)->toBeNull();
    });

    it('handles null type gracefully', function () {
        $content = AboutContent::factory()->make(['type' => null]);
        expect($content->type)->toBeNull();
    });
});

describe('SectionConfig Model Edge Cases', function () {
    it('handles null config gracefully', function () {
        $config = SectionConfig::factory()->make(['config' => null]);
        expect($config->config)->toBeNull();
    });

    it('handles boolean enabled flag', function () {
        $page = Page::factory()->create();
        $config = SectionConfig::factory()->create(['page_slug' => $page->slug, 'is_enabled' => true]);
        expect($config->is_enabled)->toBeTrue();
        $config->update(['is_enabled' => false]);
        expect($config->fresh()->is_enabled)->toBeFalse();
    });
});

describe('SharedData Model Edge Cases', function () {
    it('handles null data gracefully', function () {
        $data = SharedData::factory()->make(['data' => null]);
        expect($data->data)->toBeNull();
    });
});

describe('CustomSectionData Model Edge Cases', function () {
    it('handles null data gracefully', function () {
        $data = new CustomSectionData(['data' => null]);
        expect($data->data)->toBeNull();
    });
});

describe('User Model Edge Cases', function () {
    it('handles soft delete', function () {
        $user = User::factory()->create();
        $user->delete();
        expect(User::withTrashed()->find($user->id))->not->toBeNull();
        $user->restore();
        expect(User::find($user->id))->not->toBeNull();
    });

    it('enforces unique email constraint', function () {
        User::factory()->create(['email' => 'test@example.com']);
        expect(fn () => User::factory()->create(['email' => 'test@example.com']))
            ->toThrow(\Illuminate\Database\QueryException::class);
    });
});

describe('JobListing Model Edge Cases', function () {
    it('handles null salary gracefully', function () {
        $job = JobListing::factory()->make(['salary_min' => null, 'salary_max' => null]);
        expect($job->salary_min)->toBeNull();
        expect($job->salary_max)->toBeNull();
    });

    it('handles expired deadline', function () {
        $job = JobListing::factory()->create(['application_deadline' => now()->subDays(1)]);
        expect($job->application_deadline->isPast())->toBeTrue();
    });

    it('handles future deadline', function () {
        $job = JobListing::factory()->create(['application_deadline' => now()->addDays(30)]);
        expect($job->application_deadline->isFuture())->toBeTrue();
    });
});

describe('Application Model Edge Cases', function () {
    it('handles null cover letter', function () {
        $application = Application::factory()->make(['cover_letter' => null]);
        expect($application->cover_letter)->toBeNull();
    });

    it('handles status transitions', function () {
        $application = Application::factory()->create(['status' => 'pending']);
        $application->update(['status' => 'shortlisted']);
        expect($application->fresh()->status)->toBe('shortlisted');
    });
});

describe('NewsletterSubscription Model Edge Cases', function () {
    it('handles null name gracefully', function () {
        $subscription = NewsletterSubscription::factory()->make(['name' => null]);
        expect($subscription->name)->toBeNull();
    });

    it('enforces unique email constraint', function () {
        NewsletterSubscription::factory()->create(['email' => 'test@example.com']);
        expect(fn () => NewsletterSubscription::factory()->create(['email' => 'test@example.com']))
            ->toThrow(\Illuminate\Database\QueryException::class);
    });
});

describe('Role Model Edge Cases', function () {
    it('handles zero level', function () {
        $role = Role::factory()->create(['level' => 0]);
        expect($role->level)->toBe(0);
    });

    it('handles null description', function () {
        $role = Role::factory()->make(['description' => null]);
        expect($role->description)->toBeNull();
    });
});

describe('Permission Model Edge Cases', function () {
    it('handles null description', function () {
        $permission = Permission::factory()->make(['description' => null]);
        expect($permission->description)->toBeNull();
    });

    it('enforces unique module+action constraint', function () {
        Permission::factory()->create(['slug' => 'perm-1', 'module' => 'test', 'action' => 'view']);
        expect(fn () => Permission::factory()->create(['slug' => 'perm-2', 'module' => 'test', 'action' => 'view']))
            ->toThrow(\Illuminate\Database\QueryException::class);
    });
});

describe('ApplicantProfile Model Edge Cases', function () {
    it('handles null phone gracefully', function () {
        $profile = ApplicantProfile::factory()->make(['phone' => null]);
        expect($profile->phone)->toBeNull();
    });

    it('handles null address gracefully', function () {
        $profile = ApplicantProfile::factory()->make(['address' => null]);
        expect($profile->address)->toBeNull();
    });
});

describe('Location Model Edge Cases', function () {
    it('handles null parent location', function () {
        $location = Location::factory()->make(['parent_id' => null]);
        expect($location->parent_id)->toBeNull();
    });
});

describe('JobCategory Model Edge Cases', function () {
    it('handles null description', function () {
        $category = JobCategory::factory()->make(['description' => null]);
        expect($category->description)->toBeNull();
    });
});

describe('NewsletterCampaign Model Edge Cases', function () {
    it('handles null started_at', function () {
        $user = User::factory()->create();
        $campaign = NewsletterCampaign::create([
            'subject' => 'Test Subject',
            'content' => 'Test Content',
            'status' => 'draft',
            'created_by' => $user->id,
            'started_at' => null,
        ]);
        expect($campaign->started_at)->toBeNull();
    });

    it('handles status transitions', function () {
        $user = User::factory()->create();
        $campaign = NewsletterCampaign::create([
            'subject' => 'Test Subject',
            'content' => 'Test Content',
            'status' => 'pending',
            'created_by' => $user->id,
        ]);
        $campaign->update(['status' => 'processing']);
        expect($campaign->fresh()->status)->toBe('processing');
    });
});
