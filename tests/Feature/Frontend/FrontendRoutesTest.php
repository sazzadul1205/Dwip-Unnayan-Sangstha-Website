<?php

use App\Models\pages\Page;
use App\Models\pages\CustomSectionData;
use App\Models\pages\Program;
use App\Models\pages\SectionConfig;
use App\Models\pages\SharedData;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

uses(Tests\Support\RouteTestHelpers::class);

describe('Frontend Public Routes', function () {
    it('loads the home page', function () {
        Page::factory()->create([
            'slug' => 'home',
            'name' => 'Home',
            'is_active' => true,
        ]);

        $response = $this->get('/');
        $response->assertOk();
    });

    it('loads saved detail-page banner data on program pages', function () {
        Page::factory()->create([
            'slug' => 'projects-programs',
            'name' => 'Projects and Programs',
            'is_active' => true,
        ]);
        Page::factory()->create([
            'slug' => 'projects-programs-details',
            'name' => 'Projects and Programs Details',
            'is_active' => true,
        ]);
        Program::factory()->create(['slug' => 'micro-finance']);

        SectionConfig::factory()->create([
            'page_slug' => 'projects-programs-details',
            'section_key' => 'banner',
            'component' => 'PageBannerSection',
            'data_table' => 'custom_section_data',
            'data_key' => 'bannerData',
            'prop_name' => 'data',
            'display_order' => 1,
        ]);
        CustomSectionData::create([
            'page_slug' => 'projects-programs-details',
            'section_key' => 'banner',
            'data' => [
                'background' => ['src' => '/storage/micro-finance-banner.jpg'],
                'content' => ['title' => ['text' => 'Microfinance']],
            ],
            'is_active' => true,
        ]);

        $this->get('/projects-programs/micro-finance')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Frontend/ProjectsAndProgramsDetails/ProjectsAndProgramsDetails')
                ->where('pageData.bannerData.background.src', '/storage/micro-finance-banner.jpg')
                ->where('pageData.bannerData.content.title.text', 'Microfinance'));
    });

    it('loads the sitemap page', function () {
        $response = $this->get('/sitemap');
        $response->assertOk();
    });

    it('resolves shared asset paths and provides the configured storage URL', function () {
        SharedData::factory()->create([
            'type' => 'topbar',
            'data' => ['logo' => 'asset:images/logo.svg'],
            'is_active' => true,
        ]);
        Cache::store('frontend')->forget('frontend_shared_data');

        $this->get('/sitemap')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('topbarData.logo', asset('images/logo.svg'))
                ->where('storageUrl', config('app.storage_url')));

        expect(config('app.storage_url'))->not->toBeEmpty();
    });

    it('loads the playground page', function () {
        $response = $this->get('/playground');
        $response->assertOk();
    });

    it('loads the unauthorized access page', function () {
        $response = $this->get('/unauthorized');
        $response->assertOk();
    });

    it('serves storage files', function () {
        config(['filesystems.disks.public.root' => storage_path('app/public')]);

        $response = $this->get('/storage/test.txt');
        $response->assertNotFound();
    });

    it('serves and caches low-resolution WebP previews for stored images', function () {
        if (!extension_loaded('gd') || !function_exists('imagewebp')) {
            $this->markTestSkipped('GD with WebP support is required to generate image previews.');
        }

        Storage::fake('public');
        $image = imagecreatetruecolor(400, 200);
        ob_start();
        imagejpeg($image);
        $imageContent = ob_get_clean();
        imagedestroy($image);
        Storage::disk('public')->put('uploads/sample.jpg', $imageContent);

        $response = $this->get('/image-preview/uploads/sample.jpg');
        $response->assertOk()->assertHeader('Content-Type', 'image/webp');

        $previewFiles = Storage::disk('public')->allFiles('image-previews');
        expect($previewFiles)->toHaveCount(1);
        $dimensions = getimagesizefromstring(Storage::disk('public')->get($previewFiles[0]));
        expect($dimensions[0])->toBe(96)
            ->and($dimensions[1])->toBe(48);

        $this->get('/image-preview/uploads/sample.jpg')->assertOk();
        expect(Storage::disk('public')->allFiles('image-previews'))->toHaveCount(1);
    });
});
