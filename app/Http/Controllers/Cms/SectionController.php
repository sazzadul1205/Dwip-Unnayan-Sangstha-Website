<?php
// app/Http/Controllers/Cms/SectionController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Page;
use App\Models\pages\SectionConfig;
use App\Models\pages\CustomSectionData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
  /**
   * Display sections for a specific page
   */
  public function index(int $pageId): Response
  {
    $page = Page::withTrashed()->findOrFail($pageId);
    $sections = SectionConfig::where('page_slug', $page->slug)
      ->orderBy('display_order')
      ->get();

    return Inertia::render('Backend/CMS/Pages/Sections', [
      'page' => $page,
      'sections' => $sections,
    ]);
  }

  /**
   * Store a new section configuration
   */
  public function store(Request $request, int $pageId)
  {
    $page = Page::findOrFail($pageId);

    $validator = Validator::make($request->all(), [
      'section_key' => 'required|string|max:255|unique:section_configs,section_key,NULL,id,page_slug,' . $page->slug,
      'component' => 'required|string|max:255',
      'data_table' => 'nullable|string|max:255',
      'data_key' => 'nullable|string|max:255',
      'prop_name' => 'nullable|string|max:255',
      'display_order' => 'nullable|integer|min:0',
      'is_enabled' => 'boolean',
      'is_fixed_section' => 'boolean',
      'is_special_component' => 'boolean',
      'custom_props' => 'nullable|array',
    ]);

    if ($validator->fails()) {
      return back()->withErrors($validator)->withInput();
    }

    $data = $request->all();

    if (!isset($data['display_order']) || $data['display_order'] === '') {
      $data['display_order'] = SectionConfig::where('page_slug', $page->slug)->max('display_order') + 1;
    }

    $data['is_enabled'] = $data['is_enabled'] ?? true;
    $data['is_fixed_section'] = $data['is_fixed_section'] ?? false;
    $data['is_special_component'] = $data['is_special_component'] ?? false;
    $data['page_slug'] = $page->slug;

    SectionConfig::create($data);

    return redirect()->back()->with('success', 'Section created successfully.');
  }

  /**
   * Update a section configuration
   */
  public function update(Request $request, int $pageId, int $sectionId)
  {
    $page = Page::findOrFail($pageId);
    $section = SectionConfig::where('id', $sectionId)
      ->where('page_slug', $page->slug)
      ->firstOrFail();

    if ($section->is_fixed_section && isset($request->is_fixed_section) && !$request->is_fixed_section) {
      return back()->with('error', 'Fixed sections cannot be changed.');
    }

    $validator = Validator::make($request->all(), [
      'section_key' => 'required|string|max:255|unique:section_configs,section_key,' . $sectionId . ',id,page_slug,' . $page->slug,
      'component' => 'required|string|max:255',
      'data_table' => 'nullable|string|max:255',
      'data_key' => 'nullable|string|max:255',
      'prop_name' => 'nullable|string|max:255',
      'display_order' => 'nullable|integer|min:0',
      'is_enabled' => 'boolean',
      'is_fixed_section' => 'boolean',
      'is_special_component' => 'boolean',
      'custom_props' => 'nullable|array',
    ]);

    if ($validator->fails()) {
      return back()->withErrors($validator)->withInput();
    }

    $data = $request->all();

    $data['is_enabled'] = $data['is_enabled'] ?? true;
    $data['is_fixed_section'] = $data['is_fixed_section'] ?? false;
    $data['is_special_component'] = $data['is_special_component'] ?? false;

    $section->update($data);

    return redirect()->back()->with('success', 'Section updated successfully.');
  }

  /**
   * Toggle section enabled status
   */
  public function toggleStatus(int $pageId, int $sectionId)
  {
    $page = Page::findOrFail($pageId);
    $section = SectionConfig::where('id', $sectionId)
      ->where('page_slug', $page->slug)
      ->firstOrFail();

    if ($section->is_fixed_section) {
      return back()->with('error', 'Fixed sections cannot be disabled.');
    }

    $section->is_enabled = !$section->is_enabled;
    $section->save();

    return redirect()->back()->with('success', 'Section status updated successfully.');
  }

  /**
   * Update display order for multiple sections (drag & drop)
   */
  public function updateOrder(Request $request, int $pageId)
  {
    $page = Page::findOrFail($pageId);

    $validator = Validator::make($request->all(), [
      'orders' => 'required|array',
      'orders.*.id' => 'required|integer|exists:section_configs,id',
      'orders.*.display_order' => 'required|integer|min:0',
    ]);

    if ($validator->fails()) {
      return response()->json(['errors' => $validator->errors()], 422);
    }

    foreach ($request->orders as $order) {
      $section = SectionConfig::where('id', $order['id'])
        ->where('page_slug', $page->slug)
        ->first();

      if ($section && !$section->is_fixed_section) {
        $section->update([
          'display_order' => $order['display_order']
        ]);
      }
    }

    return response()->json(['success' => true]);
  }

  /**
   * Delete a section configuration
   */
  public function destroy(int $pageId, int $sectionId)
  {
    $page = Page::findOrFail($pageId);
    $section = SectionConfig::where('id', $sectionId)
      ->where('page_slug', $page->slug)
      ->firstOrFail();

    if ($section->is_fixed_section) {
      return back()->with('error', 'Fixed sections cannot be deleted.');
    }

    if ($section->data_table === 'custom_section_data') {
      CustomSectionData::where('page_slug', $page->slug)
        ->where('section_key', $section->section_key)
        ->delete();
    }

    $section->delete();

    return redirect()->back()->with('success', 'Section deleted successfully.');
  }

  /**
   * Get available components for a page
   */
  public function getAvailableComponents()
  {
    $components = [
      'PageBannerSection' => 'Page Banner',
      'HeroFigureSection' => 'Hero with Figure',
      'CardsSection' => 'Cards Section',
      'FAQSection' => 'FAQ Section',
      'StoriesSection' => 'Stories Section',
      'BlogSection' => 'Blog Section',
      'OurProgramsSection' => 'Our Programs',
      'ContactOfficeSection' => 'Contact Office',
      'AddressSection' => 'Address Section',
      'ContentSection' => 'Content Section',
      'HomeBanner' => 'Home Banner',
      'AboutUsSection' => 'About Us Section',
      'OurActionSection' => 'Our Action Section',
      'WhereWeWorkSection' => 'Where We Work Section',
      'JobsSection' => 'Jobs Section',
      'ProgramImpactSection' => 'Program Impact Section',
      'LegalSection' => 'Legal Section',
      'ProgramContentSection' => 'Program Content Section',
      'BlogContentSection' => 'Blog Content Section',
      'ContactReachSection' => 'Contact Reach Section',
      'FollowUSSection' => 'Follow Us Section',
      'UpcomingEventsSection' => 'Upcoming Events Section',
    ];

    return response()->json($components);
  }

  /**
   * Get data tables available for sections
   */
  public function getDataTables()
  {
    $dataTables = [
      'custom_section_data' => 'Custom Section Data',
      'about_content' => 'About Content',
      'blogs' => 'Blogs',
      'programs' => 'Programs',
      'shared_data' => 'Shared Data',
      'jobs' => 'Jobs',
    ];

    return response()->json($dataTables);
  }

  /**
   * Get section defaults by component type
   * Returns the default JSON structure and required inputs for each section
   */
  public function getSectionDefaults()
  {
    return response()->json([
      'sections' => $this->getSectionsList(),
      'defaults' => $this->getDefaultDataByComponent(),
    ]);
  }

  /**
   * Get the complete list of sections with their properties
   */
  protected function getSectionsList(): array
  {
    return [
      [
        'component' => 'PageBannerSection',
        'label' => 'Page Banner',
        'description' => 'Full-width banner with title and description overlay',
        'data_table' => 'custom_section_data',
        'data_key' => 'bannerData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '{"sectionId":"page-banner"}',
      ],
      [
        'component' => 'HomeBanner',
        'label' => 'Home Banner',
        'description' => 'Homepage hero banner with tagline, title, description and CTA buttons',
        'data_table' => 'custom_section_data',
        'data_key' => 'bannerData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '{"sectionId":"home-banner"}',
      ],
      [
        'component' => 'HeroFigureSection',
        'label' => 'Hero with Figure',
        'description' => 'Content section with text on one side and image on the other',
        'data_table' => 'custom_section_data',
        'data_key' => null,
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '{"layout":"text-left","sectionId":"hero-figure"}',
      ],
      [
        'component' => 'CardsSection',
        'label' => 'Cards Section',
        'description' => 'Display content in card format with images and CTAs',
        'data_table' => 'custom_section_data',
        'data_key' => 'cardsData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'AboutUsSection',
        'label' => 'About Us Section',
        'description' => 'About us content with mission, vision, impact stats and image',
        'data_table' => 'custom_section_data',
        'data_key' => 'aboutUsData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'OurActionSection',
        'label' => 'Our Action Section',
        'description' => 'Grid of actions/initiatives with icons and descriptions',
        'data_table' => 'custom_section_data',
        'data_key' => 'ourActionData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'WhereWeWorkSection',
        'label' => 'Where We Work Section',
        'description' => 'Geographic coverage with stats and map image',
        'data_table' => 'custom_section_data',
        'data_key' => 'whereWeWorkData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'OurProgramsSection',
        'label' => 'Our Programs Section',
        'description' => 'List of programs/projects with descriptions and images',
        'data_table' => 'programs',
        'data_key' => 'ourProgramsData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '{"limit":null,"showFeatured":false}',
      ],
      [
        'component' => 'StoriesSection',
        'label' => 'Stories Section',
        'description' => 'Horizontal scrollable stories with images and descriptions',
        'data_table' => 'custom_section_data',
        'data_key' => 'storiesData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'BlogSection',
        'label' => 'Blog Section',
        'description' => 'Display blog posts with featured main blog and grid',
        'data_table' => 'blogs',
        'data_key' => 'blogsData',
        'prop_name' => 'blogsData',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '{"bgColor":"bg-white","sectionTitle":"Latest Stories"}',
      ],
      [
        'component' => 'BlogContentSection',
        'label' => 'Blog Content Section',
        'description' => 'Full blog post content with featured image',
        'data_table' => 'blogs',
        'data_key' => 'blogData',
        'prop_name' => 'blogData',
        'is_special_component' => true,
        'is_fixed_section' => true,
        'default_custom_props' => '{"bgColor":"bg-white","paddingY":"py-12 lg:py-16","paddingX":"px-4","sectionId":"blog-content"}',
      ],
      [
        'component' => 'ProgramContentSection',
        'label' => 'Program Content Section',
        'description' => 'Full program content with description and image',
        'data_table' => 'programs',
        'data_key' => 'programContentData',
        'prop_name' => 'programData',
        'is_special_component' => true,
        'is_fixed_section' => true,
        'default_custom_props' => '{"bgColor":"bg-white","paddingY":"py-37.5","paddingX":"px-100"}',
      ],
      [
        'component' => 'ContentSection',
        'label' => 'Content Section',
        'description' => 'Generic content section with HTML content',
        'data_table' => 'about_content',
        'data_key' => 'contentSectionData',
        'prop_name' => 'subPageData',
        'is_special_component' => true,
        'is_fixed_section' => true,
        'default_custom_props' => '{"bgColor":"bg-white","paddingY":"py-37.5","paddingX":"px-100","sectionId":"main-content"}',
      ],
      [
        'component' => 'FAQSection',
        'label' => 'FAQ Section',
        'description' => 'Frequently Asked Questions with expandable answers',
        'data_table' => 'shared_data',
        'data_key' => 'faqData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '{"bgColor":"bg-[#F5F5F5]"}',
      ],
      [
        'component' => 'UpcomingEventsSection',
        'label' => 'Upcoming Events Section',
        'description' => 'List of upcoming events with dates and descriptions',
        'data_table' => 'shared_data',
        'data_key' => 'upcomingEventsData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'JobsSection',
        'label' => 'Jobs Section',
        'description' => 'Job listings with filters and apply buttons',
        'data_table' => 'custom_section_data',
        'data_key' => 'jobsData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'ProgramImpactSection',
        'label' => 'Program Impact Section',
        'description' => 'Impact carousel with SDG images',
        'data_table' => 'custom_section_data',
        'data_key' => 'programImpactData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'LegalSection',
        'label' => 'Legal Section',
        'description' => 'Legal status and affiliations with background image',
        'data_table' => 'custom_section_data',
        'data_key' => 'legalData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'ContactOfficeSection',
        'label' => 'Contact Office Section',
        'description' => 'Office locations with addresses, phones and emails',
        'data_table' => 'custom_section_data',
        'data_key' => 'offices',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'AddressSection',
        'label' => 'Address Section',
        'description' => 'Interactive map with office location tabs',
        'data_table' => 'custom_section_data',
        'data_key' => 'officesLocation',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'ContactReachSection',
        'label' => 'Contact Reach Section',
        'description' => 'Contact form with image and gradient overlay',
        'data_table' => 'custom_section_data',
        'data_key' => 'reachUsData',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
      [
        'component' => 'FollowUSSection',
        'label' => 'Follow Us Section',
        'description' => 'Social media follow grid with icons',
        'data_table' => 'custom_section_data',
        'data_key' => 'socialItems',
        'prop_name' => 'data',
        'is_special_component' => false,
        'is_fixed_section' => false,
        'default_custom_props' => '[]',
      ],
    ];
  }

  /**
   * Get default data structure by component type
   * Returns the JSON schema needed for each section
   */
  protected function getDefaultDataByComponent(): array
  {
    return [
      'PageBannerSection' => [
        'background' => [
          'src' => '',
          'alt' => 'Banner background',
        ],
        'overlay' => [
          'darkOverlay' => 'bg-black/40 lg:bg-black/50',
          'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent',
        ],
        'content' => [
          'title' => [
            'text' => 'Page Title',
            'className' => 'font-bold leading-tight',
          ],
          'description' => [
            'text' => 'Page description goes here',
            'className' => 'font-normal leading-tight',
          ],
        ],
      ],
      'HomeBanner' => [
        'background' => [
          'src' => '',
          'alt' => 'Background',
        ],
        'overlay' => [
          'darkOverlay' => 'bg-black/40 lg:bg-black/50',
          'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent',
        ],
        'content' => [
          'tagline' => [
            'text' => 'Together, We Create Impact',
            'className' => 'uppercase tracking-[4px] font-semibold',
          ],
          'title' => [
            'text' => 'Be the Light for Someone in Need',
            'className' => 'font-bold leading-tight',
          ],
          'description' => [
            'text' => 'Your kindness has the power to change lives. Join us in bringing hope, support, and brighter futures to those in need.',
            'className' => 'font-normal leading-tight',
          ],
        ],
        'buttons' => [
          [
            'id' => 1,
            'text' => 'Become a Volunteer',
            'variant' => 'primary',
            'className' => 'bg-[#009BE2] text-white hover:bg-[#009BE2]/80',
            'icon' => true,
            'link' => '#',
          ],
          [
            'id' => 2,
            'text' => 'How can I help?',
            'variant' => 'secondary',
            'className' => 'bg-white/90 lg:bg-white text-black hover:bg-white',
            'icon' => true,
            'link' => '#',
          ],
        ],
      ],
      'HeroFigureSection' => [
        'section' => [
          'title' => 'Section Title',
        ],
        'content' => [
          'html' => '<p>Content goes here...</p>',
        ],
        'btn' => [
          'text' => 'Learn More',
          'link' => '#',
        ],
        'image' => [
          'src' => '',
          'alt' => 'Section image',
          'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl',
        ],
      ],
      'CardsSection' => [
        'cards' => [
          [
            'id' => 'card-1',
            'image' => [
              'src' => '',
              'alt' => 'Card image',
              'className' => 'mx-auto object-contain',
            ],
            'title' => 'Card Title',
            'buttonText' => 'Learn More',
            'buttonLink' => '#',
            'bgColor' => 'bg-[#F5F5F5]',
            'cardBgColor' => 'bg-white',
          ],
        ],
      ],
      'AboutUsSection' => [
        'section' => [
          'title' => 'About Us',
          'description' => 'Description about the organization',
          'button' => [
            'text' => 'More about us',
            'link' => '/about',
          ],
        ],
        'mission' => [
          'title' => 'Our Mission',
          'items' => [
            [
              'id' => 1,
              'icon' => '',
              'title' => 'Mission Item 1',
              'description' => 'Description',
              'alt' => 'Icon alt text',
            ],
          ],
        ],
        'impact' => [
          'title' => 'Impact In Numbers',
          'stats' => [
            [
              'id' => 1,
              'value' => '20',
              'suffix' => '+',
              'label' => 'Years of Service',
            ],
          ],
        ],
        'image' => [
          'src' => '',
          'alt' => 'About Us Image',
          'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl',
        ],
      ],
      'OurActionSection' => [
        'section' => [
          'title' => 'Our Actions',
          'description' => 'Description of actions',
        ],
        'actions' => [
          [
            'id' => 1,
            'icon' => '',
            'title' => 'Action Title',
            'description' => 'Action description',
            'alt' => 'Icon alt text',
          ],
        ],
      ],
      'WhereWeWorkSection' => [
        'section' => [
          'title' => 'Where We Work',
        ],
        'stats' => [
          [
            'id' => 1,
            'icon' => '',
            'value' => '0',
            'label' => 'Stat Label',
            'alt' => 'Icon alt text',
          ],
        ],
        'image' => [
          'src' => '',
          'alt' => 'Map image',
          'className' => 'w-full h-232.5 object-cover rounded-4xl',
        ],
      ],
      'OurProgramsSection' => [
        'section' => [
          'title' => 'Our Programs',
          'description' => 'Description of programs',
          'button' => [
            'text' => 'View All Programs',
            'link' => '/projects-programs',
          ],
        ],
      ],
      'StoriesSection' => [
        'section' => [
          'title' => 'Stories',
          'description' => 'Description of stories',
        ],
        'stories' => [
          [
            'id' => 1,
            'image' => '',
            'date' => 'June 6, 2023',
            'title' => 'Story Title',
            'description' => 'Story description',
            'link' => '#',
          ],
        ],
      ],
      'BlogSection' => [
        'section' => [
          'title' => 'Blog Section',
        ],
      ],
      'BlogContentSection' => [
        // Uses blog data from blogs table
      ],
      'ProgramContentSection' => [
        // Uses program data from programs table
      ],
      'ContentSection' => [
        // Uses about_content data from about_content table
      ],
      'FAQSection' => [
        'section' => [
          'title' => 'Frequently Asked Questions',
          'subtitle' => 'Find answers to common questions',
        ],
        'faqs' => [
          [
            'id' => 1,
            'question' => 'Question?',
            'answer' => 'Answer goes here.',
          ],
        ],
      ],
      'UpcomingEventsSection' => [
        'section' => [
          'title' => 'Upcoming Events',
          'description' => 'Description of events',
          'button' => [
            'text' => 'View All Events',
            'link' => '/events',
          ],
        ],
        'image' => [
          'src' => '',
          'alt' => 'Events Image',
          'className' => 'mt-15 rounded-2xl h-139.25 w-auto',
        ],
        'events' => [
          [
            'id' => 1,
            'date' => [
              'day' => '01',
              'month' => 'Jan',
              'weekday' => 'MON',
              'dayNumber' => '1',
              'time' => '10:00AM',
            ],
            'location' => 'Location',
            'title' => 'Event Title',
            'description' => 'Event description',
            'link' => '#',
          ],
        ],
      ],
      'JobsSection' => [
        'section' => [
          'title' => 'Join our big family',
          'description' => 'Description of jobs',
        ],
        'filter' => [
          'placeholder' => 'Browse By',
          'options' => [
            ['value' => '', 'label' => 'Browse By'],
            ['value' => 'all', 'label' => 'All Jobs'],
            ['value' => 'full-time', 'label' => 'Full Time'],
            ['value' => 'part-time', 'label' => 'Part Time'],
            ['value' => 'contract', 'label' => 'Contract'],
            ['value' => 'remote', 'label' => 'Remote'],
            ['value' => 'internship', 'label' => 'Internship'],
          ],
        ],
        'jobs' => [
          [
            'id' => 1,
            'type' => 'Full time',
            'department' => 'Department',
            'location' => 'Location',
            'title' => 'Job Title',
            'description' => 'Job description',
            'link' => '#',
          ],
        ],
      ],
      'ProgramImpactSection' => [
        'section' => [
          'title' => 'Program Impact and SDGs',
          'mainImage' => [
            'images' => [
              '',
              '',
            ],
          ],
        ],
        'sdgImages' => [
          [
            'id' => 1,
            'src' => '',
            'alt' => 'SDG Image',
          ],
        ],
      ],
      'LegalSection' => [
        'background' => [
          'src' => '',
          'alt' => 'Background',
        ],
        'overlay' => [
          'darkOverlay' => 'bg-black/40',
        ],
        'textBox' => [
          'title' => 'Legal Status',
          'titleLine2' => 'and Affiliations',
          'buttonText' => 'Learn More',
          'buttonLink' => '#',
        ],
      ],
      'ContactOfficeSection' => [
        // Uses offices array from custom_section_data
      ],
      'AddressSection' => [
        // Uses officesLocation array from custom_section_data
      ],
      'ContactReachSection' => [
        'image' => '',
        'title' => 'Reach out to us today!',
        'buttonText' => 'Submit Message',
      ],
      'FollowUSSection' => [
        // Uses socialItems array from custom_section_data
      ],
    ];
  }
}
