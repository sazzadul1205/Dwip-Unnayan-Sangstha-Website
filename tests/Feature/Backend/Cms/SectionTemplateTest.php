<?php

use App\Models\pages\CustomSectionData;
use App\Models\pages\Page;
use App\Models\pages\SectionConfig;

uses(Tests\Support\RouteTestHelpers::class);

describe('Section Template Auto-Generation', function () {
    beforeEach(function () {
        $this->page = Page::factory()->create(['slug' => 'home']);
        $this->user = $this->createAdminUser();
        $this->actingAs($this->user);
    });

    it('creates default template data for HomeBanner', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'HomeBanner',
            'section_key' => 'home_banner_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'home_banner_test',
        ]);
    });

    it('creates default template data for AboutUsSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'AboutUsSection',
            'section_key' => 'about_us_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'about_us_test',
        ]);
    });

    it('creates default template data for OurActionSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'OurActionSection',
            'section_key' => 'our_action_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'our_action_test',
        ]);
    });

    it('creates default template data for WhereWeWorkSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'WhereWeWorkSection',
            'section_key' => 'where_we_work_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'where_we_work_test',
        ]);
    });

    it('creates default template data for HeroFigureSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'HeroFigureSection',
            'section_key' => 'hero_figure_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'hero_figure_test',
        ]);
    });

    it('creates default template data for PageBannerSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'PageBannerSection',
            'section_key' => 'page_banner_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'page_banner_test',
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', 'page_banner_test')
            ->first();

        expect($customData->data)->toHaveKey('background');
        expect($customData->data['background'])->toHaveKey('src');
        expect($customData->data['background']['src'])->toBeString();
        expect($customData->data)->toHaveKey('content');
        expect($customData->data['content'])->toHaveKey('title');
        expect($customData->data['content'])->toHaveKey('description');
    });

    it('creates default template data for PageTagBannerSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'PageTagBannerSection',
            'section_key' => 'page_tag_banner_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'page_tag_banner_test',
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', 'page_tag_banner_test')
            ->first();

        expect($customData->data)->toHaveKey('background');
        expect($customData->data['background'])->toHaveKey('src');
        expect($customData->data)->toHaveKey('tags');
        expect($customData->data['tags'])->toBeArray();
        expect(count($customData->data['tags']))->toBeGreaterThan(0);
        expect($customData->data['tags'][0])->toHaveKey('label');
        expect($customData->data['tags'][0])->toHaveKey('color');
        expect($customData->data)->toHaveKey('tagTitle');
    });

    it('creates default template data for CardsSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'CardsSection',
            'section_key' => 'cards_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'cards_test',
        ]);
    });

    it('creates default template data for ContactOfficeSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'ContactOfficeSection',
            'section_key' => 'contact_office_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'contact_office_test',
        ]);
    });

    it('creates default template data for AddressSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'AddressSection',
            'section_key' => 'address_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'address_test',
        ]);
    });

    it('creates default template data for ContactReachSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'ContactReachSection',
            'section_key' => 'contact_reach_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'contact_reach_test',
        ]);
    });

    it('creates default template data for JobsSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'JobsSection',
            'section_key' => 'jobs_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'jobs_test',
        ]);
    });

    it('creates default template data for FollowUSSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'FollowUSSection',
            'section_key' => 'follow_us_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'follow_us_test',
        ]);
    });

    it('creates default template data for LegalSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'LegalSection',
            'section_key' => 'legal_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'legal_test',
        ]);
    });

    it('creates default template data for ProgramImpactSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'ProgramImpactSection',
            'section_key' => 'program_impact_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'program_impact_test',
        ]);
    });

    it('creates default template data for ImageGallerySection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'ImageGallerySection',
            'section_key' => 'image_gallery_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'image_gallery_test',
        ]);
    });

    it('creates default template data for VideoGallerySection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'VideoGallerySection',
            'section_key' => 'video_gallery_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'video_gallery_test',
        ]);
    });

    it('creates default template data for TextContentSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'TextContentSection',
            'section_key' => 'text_content_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'text_content_test',
        ]);
    });

    it('creates default template data for HtmlCssSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'HtmlCssSection',
            'section_key' => 'html_css_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'html_css_test',
        ]);
    });

    it('creates default template data for OurProgramsSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'OurProgramsSection',
            'section_key' => 'our_programs_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'our_programs_test',
        ]);
    });

    it('creates default template data for PublicationsSection', function () {
        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'PublicationsSection',
            'section_key' => 'publications_test',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'publications_test',
        ]);
    });

    it('creates HomeBanner with slider template', function () {
        $sectionKey = 'test_home_banner_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'HomeBanner',
            'section_key' => $sectionKey,
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', $sectionKey)
            ->first();

        expect($customData->data)->toHaveKey('slides');
        expect($customData->data['slides'])->toBeArray();
        expect(count($customData->data['slides']))->toBeGreaterThan(0);
        expect($customData->data['slides'][0])->toHaveKey('src');
        expect($customData->data['slides'][0])->toHaveKey('alt');
        expect($customData->data['slides'][0])->toHaveKey('content');
        expect($customData->data['slides'][0]['content'])->toHaveKey('title');
        expect($customData->data['slides'][0]['content']['title']['text'])->toBeString();
        expect($customData->data)->toHaveKey('slideInterval');
        expect($customData->data['slideInterval'])->toBeInt();
    });

    it('creates AboutUsSection with mission and impact template', function () {
        $sectionKey = 'test_about_us_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'AboutUsSection',
            'section_key' => $sectionKey,
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', $sectionKey)
            ->first();

        expect($customData->data)->toHaveKey('mission');
        expect($customData->data['mission'])->toHaveKey('items');
        expect($customData->data['mission']['items'])->toBeArray();
        expect(count($customData->data['mission']['items']))->toBeGreaterThan(0);
        expect($customData->data)->toHaveKey('impact');
        expect($customData->data['impact'])->toHaveKey('stats');
    });

    it('creates CardsSection with card template', function () {
        $sectionKey = 'test_cards_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'CardsSection',
            'section_key' => $sectionKey,
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', $sectionKey)
            ->first();

        expect($customData->data)->toHaveKey('cards');
        expect($customData->data['cards'])->toBeArray();
        expect(count($customData->data['cards']))->toBeGreaterThan(0);
        expect($customData->data['cards'][0])->toHaveKey('title');
        expect($customData->data['cards'][0])->toHaveKey('buttonText');
    });

    it('creates ContactOfficeSection with offices template', function () {
        $sectionKey = 'test_contact_office_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'ContactOfficeSection',
            'section_key' => $sectionKey,
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', $sectionKey)
            ->first();

        expect($customData->data)->toHaveKey('offices');
        expect($customData->data['offices'])->toBeArray();
        expect(count($customData->data['offices']))->toBeGreaterThan(0);
        expect($customData->data['offices'][0])->toHaveKey('title');
        expect($customData->data['offices'][0])->toHaveKey('address');
        expect($customData->data['offices'][0])->toHaveKey('phones');
    });

    it('creates ImageGallerySection with empty images array', function () {
        $sectionKey = 'test_image_gallery_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'ImageGallerySection',
            'section_key' => $sectionKey,
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', $sectionKey)
            ->first();

        expect($customData->data)->toHaveKey('images');
        expect($customData->data['images'])->toBeArray();
        expect($customData->data)->toHaveKey('sectionTitle');
    });

    it('creates TextContentSection with default content structure', function () {
        $sectionKey = 'test_text_content_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'TextContentSection',
            'section_key' => $sectionKey,
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', $sectionKey)
            ->first();

        expect($customData->data)->toHaveKey('content');
        expect($customData->data['content'])->toHaveKey('html');
        expect($customData->data['content'])->toHaveKey('text');
        expect($customData->data)->toHaveKey('sectionId');
    });

    it('creates HtmlCssSection with empty html/css', function () {
        $sectionKey = 'test_html_css_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'HtmlCssSection',
            'section_key' => $sectionKey,
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', $sectionKey)
            ->first();

        expect($customData->data)->toHaveKey('html');
        expect($customData->data)->toHaveKey('css');
        expect($customData->data)->toHaveKey('scopeCss');
        expect($customData->data['scopeCss'])->toBeTrue();
    });

    it('creates JobsSection with default filter and empty jobs', function () {
        $sectionKey = 'test_jobs_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'JobsSection',
            'section_key' => $sectionKey,
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        $customData = CustomSectionData::where('page_slug', 'home')
            ->where('section_key', $sectionKey)
            ->first();

        expect($customData->data)->toHaveKey('section');
        expect($customData->data['section'])->toHaveKey('title');
        expect($customData->data['section'])->toHaveKey('description');
        expect($customData->data['section'])->toHaveKey('limit');
        expect($customData->data)->toHaveKey('filter');
        expect($customData->data['filter'])->toHaveKey('placeholder');
    });

    it('does NOT create template data for shared_data sections', function () {
        $sectionKey = 'test_shared_data_no_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'FAQSection',
            'section_key' => $sectionKey,
            'data_table' => 'shared_data',
            'is_enabled' => true,
        ]);

        $this->assertDatabaseMissing('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => $sectionKey,
        ]);
    });

    it('does NOT create template data for blogs sections', function () {
        $sectionKey = 'test_blogs_no_template';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'BlogSection',
            'section_key' => $sectionKey,
            'data_table' => 'blogs',
            'is_enabled' => true,
        ]);

        $this->assertDatabaseMissing('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => $sectionKey,
        ]);
    });

    it('creates section config with proper data_key and prop_name', function () {
        $sectionKey = 'test_config_fields';

        $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'AboutUsSection',
            'section_key' => $sectionKey,
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        $sectionConfig = SectionConfig::where('page_slug', 'home')
            ->where('section_key', $sectionKey)
            ->first();

        expect($sectionConfig)->not->toBeNull();
        expect($sectionConfig->data_key)->toBeString()->toContain('about_us_section');
        expect($sectionConfig->prop_name)->toBe('aboutUsSection');
        expect($sectionConfig->component)->toBe('AboutUsSection');
        expect($sectionConfig->data_table)->toBe('custom_section_data');
    });
});