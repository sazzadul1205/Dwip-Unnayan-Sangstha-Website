<?php
// app/Http/Controllers/Cms/SectionController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\JobListing;
use App\Models\pages\Page;
use App\Models\pages\SectionConfig;
use App\Models\pages\CustomSectionData;
use App\Models\pages\SharedData;
use App\Models\pages\Blog;
use App\Models\pages\Program;
use App\Models\pages\AboutContent;
use App\Models\pages\Publication;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SectionController extends Controller
{
  /**
   * Extract clean data from CustomSectionData model
   */
  protected function extractCustomSectionData(?CustomSectionData $customData): mixed
  {
    if (!$customData) {
      return null;
    }

    $rawData = $customData->data;

    if (is_string($rawData)) {
      $decodedData = json_decode($rawData, true);
      if ($decodedData !== null) {
        // Extract nested 'data' if exists, otherwise use the decoded data
        return $decodedData['data'] ?? $decodedData;
      }
      return $rawData;
    }

    return $rawData;
  }

  /**
   * Extract clean data from SharedData model
   */
  protected function extractSharedData(?SharedData $shared): mixed
  {
    if (!$shared) {
      return null;
    }

    $rawData = $shared->data ?? $shared;

    if (is_string($rawData)) {
      $decodedData = json_decode($rawData, true);
      if ($decodedData !== null) {
        return $decodedData['data'] ?? $decodedData;
      }
      return $rawData;
    }

    return $rawData;
  }

  /**
   * Display a listing of sections for a specific page.
   */
  public function index(int $pageId)
  {
    $page = Page::withTrashed()->findOrFail($pageId);

    $sectionConfigs = SectionConfig::where('page_slug', $page->slug)
      ->orderBy('display_order')
      ->get();

    $customSectionData = CustomSectionData::where('page_slug', $page->slug)
      ->get()
      ->keyBy('section_key');

    $sharedData = SharedData::whereIn('type', $sectionConfigs->pluck('section_key'))
      ->get()
      ->keyBy('type');

    $sections = [];

    foreach ($sectionConfigs as $config) {
      $section = $config->toArray();

      switch ($config->data_table) {
        case 'custom_section_data':
          $section['data'] = $this->extractCustomSectionData(
            $customSectionData->get($config->section_key)
          );
          break;

        case 'shared_data':
          $section['data'] = $this->extractSharedData(
            $sharedData->get($config->section_key)
          );
          break;

        case 'blogs':
          $section['data'] = Blog::active()->latest()->get();
          break;

        case 'programs':
          $section['data'] = Program::active()->ordered()->get();
          break;

        case 'about_content':
          $aboutContent = AboutContent::where('slug', $config->section_key)
            ->active()
            ->first();
          $section['data'] = $aboutContent ? $aboutContent->data : null;
          break;

        case 'publications':
          $section['data'] = Publication::active()->latest()->get();
          break;

        default:
          $section['data'] = null;
          break;
      }

      $sections[] = $section;
    }

    return Inertia::render('Backend/CMS/Section/Index', [
      'page' => $page,
      'sections' => $sections,
    ]);
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
      // Return back with errors for Inertia
      return back()->withErrors($validator)->withInput();
    }

    try {
      DB::beginTransaction();

      foreach ($request->orders as $orderData) {
        $section = SectionConfig::where('id', $orderData['id'])
          ->where('page_slug', $page->slug)
          ->first();

        // Only update if section exists and is not fixed
        if ($section && !$section->is_fixed_section) {
          $section->update([
            'display_order' => $orderData['display_order']
          ]);
        }
      }

      DB::commit();

      // Return back with success message for Inertia
      return back()->with('success', 'Section order updated successfully.');
    } catch (\Exception $e) {
      DB::rollBack();

      // Return back with error message for Inertia
      return back()->with('error', 'Failed to update section order: ' . $e->getMessage());
    }
  }

  /**
   * Store a newly created section in storage.
   */
  public function store(Request $request)
  {
    $page = Page::findOrFail($request->page_id);

    $validator = Validator::make($request->all(), [
      'component' => 'required|string|max:255',
      'section_key' => 'required|string|max:255|unique:section_configs,section_key,NULL,id,page_slug,' . $page->slug,
      'data_table' => 'required|string|max:255',
      'is_enabled' => 'boolean',
      'custom_props' => 'nullable|array',
    ]);

    if ($validator->fails()) {
      return back()->withErrors($validator)->withInput();
    }

    try {
      DB::beginTransaction();

      // Get the current max display order
      $maxOrder = SectionConfig::where('page_slug', $page->slug)->max('display_order') ?? 0;

      // Generate data_key based on component and section_key
      $dataKey = $this->generateDataKey($request->component, $request->section_key);

      // Create the section config
      $sectionConfig = SectionConfig::create([
        'page_slug' => $page->slug,
        'section_key' => $request->section_key,
        'component' => $request->component,
        'data_table' => $request->data_table,
        'data_key' => $dataKey,
        'prop_name' => $this->getPropName($request->component),
        'display_order' => $maxOrder + 1,
        'is_enabled' => $request->boolean('is_enabled', true),
        'is_fixed_section' => false,
        'is_special_component' => $this->isSpecialComponent($request->component),
        'custom_props' => $request->custom_props ?? [],
      ]);

      // Handle special data table types
      $this->handleSectionDataCreation($sectionConfig);

      DB::commit();

      return back()->with('success', 'Section created successfully.');
    } catch (\Exception $e) {
      DB::rollBack();
      return back()->with('error', 'Failed to create section: ' . $e->getMessage());
    }
  }

  /**
   * Generate data key based on component
   */
  protected function generateDataKey(string $component, string $sectionKey): string
  {
    $keyMap = [
      'HomeBanner' => 'bannerData',
      'PageBannerSection' => 'bannerData',
      'PageTagBannerSection' => 'pageTagBannerData',
      'AboutUsSection' => 'aboutUsData',
      'OurActionSection' => 'ourActionData',
      'WhereWeWorkSection' => 'whereWeWorkData',
      'OurProgramsSection' => 'ourProgramsData',
      'StoriesSection' => 'storiesData',
      'BlogSection' => 'blogsData',
      'JobsSection' => 'jobsData',
      'ProgramImpactSection' => 'programImpactData',
      'UpcomingEventsSection' => 'upcomingEventsData',
      'HeroFigureSection' => 'heroFigureData',
      'CardsSection' => 'cardsData',
      'FAQSection' => 'faqData',
      'ContactOfficeSection' => 'officesData',
      'AddressSection' => 'addressData',
      'ContactReachSection' => 'reachUsData',
      'FollowUSSection' => 'socialItemsData',
      'LegalSection' => 'legalData',
      'ContentSection' => 'contentSectionData',
      'ProgramContentSection' => 'programContentData',
      'BlogContentSection' => 'blogData',
      'PublicationsSection' => 'publicationsData',
      'ImageGallerySection' => 'imageGalleryData',
      'VideoGallerySection' => 'videoGalleryData',
    ];

    return $keyMap[$component] ?? $sectionKey . 'Data';
  }

  /**
   * Get prop name based on component
   */
  protected function getPropName(string $component): string
  {
    $propMap = [
      'HomeBanner' => 'data',
      'PageBannerSection' => 'data',
      'PageTagBannerSection' => 'data',
      'ContentSection' => 'subPageData',
      'ProgramContentSection' => 'programData',
      'BlogContentSection' => 'blogData',
      'BlogSection' => 'blogsData',
      'OurProgramsSection' => 'data',
      'JobsSection' => 'data',
    ];

    return $propMap[$component] ?? 'data';
  }

  /**
   * Check if component is special (uses external data tables)
   */
  protected function isSpecialComponent(string $component): bool
  {
    $specialComponents = [
      'BlogSection',
      'OurProgramsSection',
      'JobsSection',
      'FAQSection',
      'UpcomingEventsSection',
      'ContentSection',
      'ProgramContentSection',
      'BlogContentSection',
      'PublicationsSection',
      'ImageGallerySection',
      'VideoGallerySection',
    ];

    return in_array($component, $specialComponents);
  }

  /**
   * Handle section data creation based on data_table
   */
  protected function handleSectionDataCreation(SectionConfig $sectionConfig): void
  {
    switch ($sectionConfig->data_table) {
      case 'custom_section_data':
        $this->createCustomSectionData($sectionConfig);
        break;

      case 'shared_data':
        // Shared data is managed separately, no automatic creation
        break;

      case 'blogs':
      case 'programs':
      case 'jobs':
        $section['data'] = JobListing::active()->latest()->get();
        break;
      case 'about_content':
      case 'publications':
        // These are managed by their respective systems
        break;

      default:
        if ($sectionConfig->data_table !== 'custom_section_data') {
          $this->createCustomSectionData($sectionConfig);
        }
        break;
    }
  }

  /**
   * Create default custom section data with pre-filled template
   */
  protected function createCustomSectionData(SectionConfig $sectionConfig): void
  {
    $template = $this->getSectionDataTemplate($sectionConfig->component);

    CustomSectionData::create([
      'page_slug' => $sectionConfig->page_slug,
      'section_key' => $sectionConfig->section_key,
      'data' => $template,
      'is_active' => true,
    ]);
  }

  /**
   * Get pre-filled data template for a section component
   */
  /**
   * Get pre-filled data template for a section component
   */
  protected function getSectionDataTemplate(string $component): array
  {
    $templates = [
      // ===== BANNER SECTIONS =====
      'HomeBanner' => [
        'background' => ['src' => '', 'alt' => 'Background'],
        'overlay' => [
          'darkOverlay' => 'bg-black/40 lg:bg-black/50',
          'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
        ],
        'content' => [
          'tagline' => [
            'text' => 'Together, We Create Impact',
            'className' => 'uppercase tracking-[4px] font-semibold'
          ],
          'title' => [
            'text' => 'Be the Light for Someone in Need',
            'className' => 'font-bold leading-tight'
          ],
          'description' => [
            'text' => 'Your kindness has the power to change lives. Join us in bringing hope, support, and brighter futures. Every donation makes a difference big or small.',
            'className' => 'font-normal leading-tight'
          ]
        ],
        'buttons' => [
          [
            'id' => 1,
            'text' => 'Become a Volunteer',
            'variant' => 'primary',
            'className' => 'bg-[#009BE2] text-white hover:bg-[#009BE2]/80',
            'icon' => true
          ],
          [
            'id' => 2,
            'text' => 'How can I help?',
            'variant' => 'secondary',
            'className' => 'bg-white/90 lg:bg-white text-black hover:bg-white',
            'icon' => true
          ]
        ]
      ],

      'PageBannerSection' => [
        'background' => ['src' => '', 'alt' => 'Background'],
        'overlay' => [
          'darkOverlay' => 'bg-black/40 lg:bg-black/50',
          'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
        ],
        'content' => [
          'title' => [
            'text' => 'Page Title',
            'className' => 'font-bold leading-tight'
          ],
          'description' => [
            'text' => 'Page description goes here',
            'className' => 'font-normal leading-tight'
          ]
        ]
      ],

      'PageTagBannerSection' => [
        'background' => ['src' => '', 'alt' => 'Background'],
        'overlay' => [
          'darkOverlay' => 'bg-black/40 lg:bg-black/50',
          'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
        ],
        // Remove the content wrapper and put tags at root level
        'tagTitle' => 'Photo Gallery',
        'tags' => [
          ['label' => 'DUS in action', 'color' => '#009BE2'],
          ['label' => 'Community Impact', 'color' => '#FF6B6B'],
          ['label' => 'Coastal Development', 'color' => '#4ECDC4'],
          ['label' => 'Microfinance Success', 'color' => '#FFE66D'],
          ['label' => 'Climate Action', 'color' => '#6C5CE7'],
          ['label' => 'Women Empowerment', 'color' => '#FD79A8'],
          ['label' => 'Education for All', 'color' => '#00B894'],
          ['label' => 'Sustainable Agriculture', 'color' => '#FDCB6E'],
        ],
        'activeTag' => 'DUS in action',
      ],

      // ===== CONTENT SECTIONS =====
      'AboutUsSection' => [
        'section' => [
          'title' => 'About us',
          'description' => 'A Community based philanthropic and development organization dedicated to sustainable poverty reduction, entrepreneur\'s promotion and capacity building of the underprivileged directing towards a just society.',
          'button' => [
            'text' => 'More about us',
            'link' => '/about'
          ]
        ],
        'mission' => [
          'title' => 'The mission of our organization',
          'items' => [
            [
              'id' => 1,
              'icon' => '',
              'title' => 'Education for All',
              'description' => 'Our commitment to ensuring that every child has access to quality education and learning opportunities.',
              'alt' => 'Education Icon'
            ],
            [
              'id' => 2,
              'icon' => '',
              'title' => 'Health and Wellness',
              'description' => 'Our commitment to health and wellness extends across borders, providing healthcare access to underserved communities.',
              'alt' => 'Health Icon'
            ],
            [
              'id' => 3,
              'icon' => '',
              'title' => 'Disaster Relief',
              'description' => 'In times of crisis, we respond swiftly to provide emergency relief and support to affected communities.',
              'alt' => 'Disaster Relief Icon'
            ],
            [
              'id' => 4,
              'icon' => '',
              'title' => 'Community Development',
              'description' => 'We invest in sustainable community development projects to create lasting positive change.',
              'alt' => 'Community Development Icon'
            ]
          ]
        ],
        'impact' => [
          'title' => 'Impact In Numbers',
          'stats' => [
            [
              'id' => 1,
              'value' => '20',
              'suffix' => '+',
              'label' => 'Years of Service'
            ],
            [
              'id' => 2,
              'value' => '15',
              'suffix' => '+',
              'label' => 'Project Programs'
            ],
            [
              'id' => 3,
              'value' => '10',
              'suffix' => '+',
              'label' => 'Awards Received'
            ]
          ]
        ],
        'image' => [
          'src' => '',
          'alt' => 'About Us Image'
        ]
      ],

      'OurActionSection' => [
        'section' => [
          'title' => 'Our Actions for Social Change',
          'description' => 'We turn compassion into action by implementing community-led programs, advocating for social justice, and promoting education, health and equality for all.'
        ],
        'actions' => [
          [
            'id' => 1,
            'icon' => '',
            'title' => 'Education',
            'description' => 'We empower communities by investing in sustainable education projects and training programs.',
            'alt' => 'Education Icon'
          ],
          [
            'id' => 2,
            'icon' => '',
            'title' => 'Microfinance',
            'description' => 'Providing financial inclusion and small loans to empower entrepreneurs and lift families out of poverty.',
            'alt' => 'Microfinance Icon'
          ],
          [
            'id' => 3,
            'icon' => '',
            'title' => 'Health',
            'description' => 'Providing nutritious meals, healthcare access, and wellness programs to individuals and families in need.',
            'alt' => 'Health Icon'
          ],
          [
            'id' => 4,
            'icon' => '',
            'title' => 'Organizational Development',
            'description' => 'Building strong institutions and community organizations that can sustain development efforts long-term.',
            'alt' => 'Organizational Development Icon'
          ],
          [
            'id' => 5,
            'icon' => '',
            'title' => 'Climate Change',
            'description' => 'Supporting communities in adapting to climate change and building resilience against natural disasters.',
            'alt' => 'Climate Change Icon'
          ],
          [
            'id' => 6,
            'icon' => '',
            'title' => 'Human Rights',
            'description' => 'Advocating for human rights, social justice, and equal opportunities for all members of society.',
            'alt' => 'Human Rights Icon'
          ],
          [
            'id' => 7,
            'icon' => '',
            'title' => 'Human Resource',
            'description' => 'Developing human capital through training, capacity building, and skill development programs.',
            'alt' => 'Human Resource Icon'
          ],
          [
            'id' => 8,
            'icon' => '',
            'title' => 'Social Enterprises',
            'description' => 'Promoting social entrepreneurship and sustainable business models that create social impact.',
            'alt' => 'Social Enterprises Icon'
          ],
          [
            'id' => 9,
            'icon' => '',
            'title' => 'Agriculture & Food Security',
            'description' => 'Supporting sustainable agriculture, food security, and livelihoods for farming communities.',
            'alt' => 'Agriculture Food Security Icon'
          ]
        ]
      ],

      'WhereWeWorkSection' => [
        'section' => [
          'title' => 'Where We Work'
        ],
        'stats' => [
          [
            'id' => 1,
            'icon' => '',
            'value' => '450K',
            'label' => 'Total Member Reach',
            'alt' => 'Member Reach Icon'
          ],
          [
            'id' => 2,
            'icon' => '',
            'value' => '41,382',
            'label' => 'Men Engaged in Diverse Livelihoods Options',
            'alt' => 'Men Engaged Icon'
          ],
          [
            'id' => 3,
            'icon' => '',
            'value' => '35,193',
            'label' => 'Women Engaged in Diverse Livelihoods Options',
            'alt' => 'Women Engaged Icon'
          ],
          [
            'id' => 4,
            'icon' => '',
            'value' => '35,193',
            'label' => 'Women Engagement in Diverse Livelihood Options',
            'alt' => 'Women Engagement Icon'
          ],
          [
            'id' => 5,
            'icon' => '',
            'value' => '38.0 M',
            'label' => 'Digital Media Outreach',
            'alt' => 'Digital Media Icon'
          ],
          [
            'id' => 6,
            'icon' => '',
            'value' => '35,193',
            'label' => 'Women Engagement in Diverse Livelihood Options',
            'alt' => 'Women Engagement Icon'
          ]
        ],
        'image' => [
          'src' => '',
          'alt' => 'Map Placeholder Text',
          'className' => 'w-full h-232.5 object-cover rounded-4xl'
        ]
      ],

      'StoriesSection' => [
        'section' => [
          'title' => 'Insights, Stories & Impact',
          'description' => 'Read real stories from the field, community experiences, and thought-provoking perspectives that reflect our mission and impact.'
        ],
        'stories' => [
          [
            'id' => 1,
            'image' => '',
            'date' => 'June 6, 2023',
            'title' => 'Invest in Kindness, Reap a Better Future',
            'description' => 'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
            'link' => '/stories/invest-in-kindness'
          ],
          [
            'id' => 2,
            'image' => '',
            'date' => 'June 6, 2023',
            'title' => 'How to Design a Custom Pool That Perfectly Fits Your Charlotte Backyard',
            'description' => 'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
            'link' => '/stories/custom-pool-design'
          ],
          [
            'id' => 3,
            'image' => '',
            'date' => 'June 6, 2023',
            'title' => 'The Benefits of Mindfulness in Daily Life',
            'description' => 'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
            'link' => '/stories/mindfulness-benefits'
          ]
        ]
      ],

      'HeroFigureSection' => [
        'section' => [
          'title' => 'Section Title'
        ],
        'content' => [
          'html' => '<div class="space-y-6"><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Content goes here. Use the rich text editor to format your content with headings, lists, links, and more.</p></div>'
        ],
        'btn' => [
          'text' => 'Learn More',
          'link' => '/about'
        ],
        'image' => [
          'src' => '',
          'alt' => 'Image',
          'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
        ]
      ],

      'CardsSection' => [
        'section' => [
          'title' => 'Cards Section'
        ],
        'cards' => [
          [
            'id' => 'card-1',
            'image' => [
              'src' => '',
              'alt' => 'Card Image',
              'className' => 'mx-auto object-contain'
            ],
            'title' => 'Operational Areas',
            'buttonText' => 'Explore Our Areas of Operation',
            'buttonLink' => '/about/operational-areas',
            'bgColor' => 'bg-[#F5F5F5]',
            'cardBgColor' => 'bg-white'
          ],
          [
            'id' => 'card-2',
            'image' => [
              'src' => '',
              'alt' => 'Card Image',
              'className' => 'mx-auto object-contain'
            ],
            'title' => 'Our Achievements',
            'buttonText' => 'Explore Our Evolution',
            'buttonLink' => '/about/achievements',
            'bgColor' => 'bg-[#F5F5F5]',
            'cardBgColor' => 'bg-white'
          ]
        ]
      ],

      // ===== CONTACT SECTIONS =====
      'ContactOfficeSection' => [
        [
          'title' => 'Head Office',
          'address' => '',
          'phones' => [''],
          'emails' => [''],
          'map_url' => '',
          'coordinates' => ['lat' => 0, 'lng' => 0],
          'is_active' => true
        ],
        [
          'title' => 'Regional Office',
          'address' => '',
          'phones' => [''],
          'emails' => [''],
          'map_url' => '',
          'coordinates' => ['lat' => 0, 'lng' => 0],
          'is_active' => false
        ]
      ],

      'AddressSection' => [
        [
          'id' => 'address-1',
          'label' => 'Head Office',
          'address' => '',
          'mapUrl' => '',
          'coordinates' => ['lat' => 0, 'lng' => 0],
          'phones' => [''],
          'emails' => ['']
        ],
        [
          'id' => 'address-2',
          'label' => 'Regional Office',
          'address' => '',
          'mapUrl' => '',
          'coordinates' => ['lat' => 0, 'lng' => 0],
          'phones' => [''],
          'emails' => ['']
        ]
      ],

      'ContactReachSection' => [
        'image' => '',
        'title' => 'Reach out to us today!',
        'buttonText' => 'Submit Message'
      ],

      'FollowUSSection' => [
        [
          'icon' => 'facebook',
          'label' => 'Facebook',
          'url' => '#'
        ],
        [
          'icon' => 'instagram',
          'label' => 'Instagram',
          'url' => '#'
        ],
        [
          'icon' => 'linkedin',
          'label' => 'LinkedIn',
          'url' => '#'
        ],
        [
          'icon' => 'youtube',
          'label' => 'YouTube',
          'url' => '#'
        ],
        [
          'icon' => 'twitter',
          'label' => 'X (Twitter)',
          'url' => '#'
        ]
      ],

      'LegalSection' => [
        'background' => [
          'src' => '',
          'alt' => 'Background'
        ],
        'overlay' => [
          'darkOverlay' => 'bg-black/40'
        ],
        'textBox' => [
          'title' => 'Legal Status and Org.',
          'titleLine2' => 'Affiliations',
          'buttonText' => 'Learn More Affiliations',
          'buttonLink' => '/about/legal-affiliations'
        ]
      ],

      'ProgramImpactSection' => [
        'section' => [
          'title' => 'Program Impact and SDGs',
          'mainImage' => [
            'images' => [
              '',
              '',
              '',
              ''
            ]
          ]
        ],
        'sdgImages' => [
          [
            'id' => 1,
            'src' => '',
            'alt' => 'No Poverty'
          ],
          [
            'id' => 2,
            'src' => '',
            'alt' => 'Zero Hunger'
          ],
          [
            'id' => 3,
            'src' => '',
            'alt' => 'Good Health'
          ],
          [
            'id' => 4,
            'src' => '',
            'alt' => 'Quality Education'
          ],
          [
            'id' => 5,
            'src' => '',
            'alt' => 'Gender Equality'
          ],
          [
            'id' => 6,
            'src' => '',
            'alt' => 'Clean Water'
          ],
          [
            'id' => 7,
            'src' => '',
            'alt' => 'Clean Energy'
          ],
          [
            'id' => 8,
            'src' => '',
            'alt' => 'Decent Work'
          ],
          [
            'id' => 9,
            'src' => '',
            'alt' => 'Industry Innovation'
          ],
          [
            'id' => 10,
            'src' => '',
            'alt' => 'Reduced Inequalities'
          ],
          [
            'id' => 11,
            'src' => '',
            'alt' => 'Sustainable Cities'
          ],
          [
            'id' => 12,
            'src' => '',
            'alt' => 'Responsible Consumption'
          ],
          [
            'id' => 13,
            'src' => '',
            'alt' => 'Climate Action'
          ],
          [
            'id' => 14,
            'src' => '',
            'alt' => 'Life Below Water'
          ],
          [
            'id' => 15,
            'src' => '',
            'alt' => 'Life On Land'
          ],
          [
            'id' => 16,
            'src' => '',
            'alt' => 'Peace Justice'
          ],
          [
            'id' => 17,
            'src' => '',
            'alt' => 'Partnerships'
          ]
        ]
      ],

      // ===== JOBS SECTION =====
      'JobsSection' => [
        'section' => [
          'title' => 'Join our big family',
          'description' => 'Join us on this journey of kindness, and let\'s make a difference, one act of charity at a time.',
          'limit' => 5,
        ],
        'filter' => [
          'placeholder' => 'Browse By',
        ],
      ],


      // ===== IMAGE GALLERY SECTION =====
      'ImageGallerySection' => [
        'sectionTitle' => 'DUS in action',
        'imageCountLabel' => 'Image Count',
        'images' => [
          [
            'id' => 1,
            'src' => 'https://placehold.co/485x400/009BE2/FFFFFF?text=Image+1',
            'alt' => 'Gallery image 1',
            'title' => 'Image 1'
          ],
          [
            'id' => 2,
            'src' => 'https://placehold.co/485x400/FF6B6B/FFFFFF?text=Image+2',
            'alt' => 'Gallery image 2',
            'title' => 'Image 2'
          ],
          [
            'id' => 3,
            'src' => 'https://placehold.co/485x400/4ECDC4/FFFFFF?text=Image+3',
            'alt' => 'Gallery image 3',
            'title' => 'Image 3'
          ],
          [
            'id' => 4,
            'src' => 'https://placehold.co/485x400/FFE66D/FFFFFF?text=Image+4',
            'alt' => 'Gallery image 4',
            'title' => 'Image 4'
          ],
          [
            'id' => 5,
            'src' => 'https://placehold.co/485x400/A8E6CF/FFFFFF?text=Image+5',
            'alt' => 'Gallery image 5',
            'title' => 'Image 5'
          ],
          [
            'id' => 6,
            'src' => 'https://placehold.co/485x400/FF8A5C/FFFFFF?text=Image+6',
            'alt' => 'Gallery image 6',
            'title' => 'Image 6'
          ],
          [
            'id' => 7,
            'src' => 'https://placehold.co/485x400/6C5CE7/FFFFFF?text=Image+7',
            'alt' => 'Gallery image 7',
            'title' => 'Image 7'
          ],
          [
            'id' => 8,
            'src' => 'https://placehold.co/485x400/FDCB6E/FFFFFF?text=Image+8',
            'alt' => 'Gallery image 8',
            'title' => 'Image 8'
          ],
          [
            'id' => 9,
            'src' => 'https://placehold.co/485x400/00B894/FFFFFF?text=Image+9',
            'alt' => 'Gallery image 9',
            'title' => 'Image 9'
          ],
          [
            'id' => 10,
            'src' => 'https://placehold.co/485x400/E17055/FFFFFF?text=Image+10',
            'alt' => 'Gallery image 10',
            'title' => 'Image 10'
          ],
          [
            'id' => 11,
            'src' => 'https://placehold.co/485x400/0984E3/FFFFFF?text=Image+11',
            'alt' => 'Gallery image 11',
            'title' => 'Image 11'
          ],
          [
            'id' => 12,
            'src' => 'https://placehold.co/485x400/F368E0/FFFFFF?text=Image+12',
            'alt' => 'Gallery image 12',
            'title' => 'Image 12'
          ]
        ]
      ],

      // ===== VIDEO GALLERY SECTION =====
      'VideoGallerySection' => [
        'sectionTitle' => 'Video Gallery',
        'videoCountLabel' => 'Video Count',
        'videos' => [
          [
            'id' => 1,
            'title' => 'DUS Impact Story - Empowering Communities',
            'description' => 'Watch how DUS is making a difference in coastal communities through sustainable development programs.',
            'src' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'thumbnail' => 'https://placehold.co/600x400/009BE2/FFFFFF?text=Video+1'
          ],
          [
            'id' => 2,
            'title' => 'Microfinance Success Stories',
            'description' => 'Real stories of women entrepreneurs who transformed their lives through microfinance programs.',
            'src' => 'https://www.youtube.com/watch?v=9bZkp7q19f0',
            'thumbnail' => 'https://placehold.co/600x400/FF6B6B/FFFFFF?text=Video+2'
          ],
          [
            'id' => 3,
            'title' => 'Community Radio - Voice of the Island',
            'description' => 'How community radio is empowering local voices and connecting communities in Hatiya Island.',
            'src' => 'https://www.youtube.com/watch?v=wZZ7oFKsKzY',
            'thumbnail' => 'https://placehold.co/600x400/4ECDC4/FFFFFF?text=Video+3'
          ],
          [
            'id' => 4,
            'title' => 'Climate Action in Coastal Bangladesh',
            'description' => 'Building resilience against climate change through innovative adaptation strategies.',
            'src' => 'https://www.youtube.com/watch?v=OPf0YbXqDm0',
            'thumbnail' => 'https://placehold.co/600x400/FFE66D/FFFFFF?text=Video+4'
          ]
        ]
      ],

    ];

    return $templates[$component] ?? [];
  }

  /**
   * Update the specified section in storage.
   */
  public function update(Request $request, int $id)
  {
    // Find the section config
    $sectionConfig = SectionConfig::withTrashed()->findOrFail($id);

    // Validate request
    $validator = Validator::make($request->all(), [
      'section_key' => 'required|string|max:255',
      'component' => 'sometimes|string|max:255',
      'data_table' => 'sometimes|string|max:255',
      'data_key' => 'sometimes|string|max:255',
      'is_enabled' => 'boolean',
      'custom_props' => 'nullable|array',
      'data' => 'nullable|array',
    ]);

    if ($validator->fails()) {
      return back()->withErrors($validator)->withInput();
    }

    // Prepare data for update
    $updateData = [];

    // Only allow updating section_key, is_enabled, custom_props
    if ($request->has('section_key')) {
      $updateData['section_key'] = $request->input('section_key');
    }
    if ($request->has('is_enabled')) {
      $updateData['is_enabled'] = $request->boolean('is_enabled');
    }

    // Handle custom_props with color conversion
    if ($request->has('custom_props')) {
      $existingProps = $sectionConfig->custom_props ?? [];
      $newProps = $request->input('custom_props');

      // Ensure bgColor is in the correct format
      if (isset($newProps['bgColor'])) {
        $bgColor = $newProps['bgColor'];

        if (is_string($bgColor) && preg_match('/^#[0-9a-fA-F]{6}$/', $bgColor)) {
          $newProps['bgColor'] = 'bg-[' . $bgColor . ']';
        }
      }

      $updateData['custom_props'] = array_merge($existingProps, $newProps);

      // 🔍 Debug: Show what's being updated
      // dd([
      //   'section_id' => $id,
      //   'current_data' => $sectionConfig->toArray(),
      //   'update_data' => $updateData,
      //   'full_request' => $request->all()
      // ]);
    }

    // Update the section config
    $sectionConfig->update($updateData);

    // Handle data update if provided
    if ($request->has('data') && is_array($request->input('data'))) {
      $data = $request->input('data');

      // Remove custom_props from data if it's there
      if (isset($data['custom_props'])) {
        unset($data['custom_props']);
      }

      // Determine which data table to update
      switch ($sectionConfig->data_table) {
        case 'custom_section_data':
          $this->updateCustomSectionData($sectionConfig, $data);
          break;
        default:
          // Log or ignore
          break;
      }
    }

    return back()->with('success', 'Section updated successfully.');
  }

  /**
   * Update custom section data with image processing.
   */
  protected function updateCustomSectionData(SectionConfig $sectionConfig, array $newData)
  {
    // Find existing custom section data record
    $customData = CustomSectionData::where('page_slug', $sectionConfig->page_slug)
      ->where('section_key', $sectionConfig->section_key)
      ->first();

    if (!$customData) {
      $customData = new CustomSectionData();
      $customData->page_slug = $sectionConfig->page_slug;
      $customData->section_key = $sectionConfig->section_key;
    }

    // Get old data for comparison
    $oldData = $customData->data ?? [];

    // 🔥 FIX: Normalize color values in the data
    $newData = $this->normalizeColorValues($newData);

    // Process images in the new data
    $processedData = $this->processDataImages($newData, $oldData, $sectionConfig->section_key);

    // Update the data
    $customData->data = $processedData;
    $customData->is_active = true;
    $customData->save();
  }

  /**
   * Normalize color values in the data array
   */
  protected function normalizeColorValues(array $data): array
  {
    foreach ($data as $key => $value) {
      if (is_array($value)) {
        $data[$key] = $this->normalizeColorValues($value);
      } elseif (is_string($value) && preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
        // Convert hex color to Tailwind format
        $data[$key] = 'bg-[' . $value . ']';
      }
    }
    return $data;
  }

  /**
   * Recursively process data to handle image uploads and deletions.
   */
  protected function processDataImages(
    array $newData,
    array $oldData,
    string $sectionKey
  ): array {
    // Recursively walk through the data structure
    $processed = $this->processArray($newData, $oldData, $sectionKey);

    return $processed;
  }

  protected function processArray(array $newArray, ?array $oldArray, string $sectionKey): array
  {
    if (!is_array($newArray)) {
      return $newArray;
    }

    $result = [];

    foreach ($newArray as $key => $value) {
      // If the value is an array, process recursively
      if (is_array($value)) {
        $oldValue = is_array($oldArray) && isset($oldArray[$key]) ? $oldArray[$key] : null;
        $result[$key] = $this->processArray($value, $oldValue, $sectionKey);
        continue;
      }

      // Check if it's a string that looks like a base64 image
      if (is_string($value) && $this->isBase64Image($value)) {
        // Upload the image and get new path
        $newPath = $this->uploadImage($value, $sectionKey);
        $result[$key] = $newPath;

        // Check if the old value (from old data) exists and is not the same path
        if (is_array($oldArray) && isset($oldArray[$key]) && is_string($oldArray[$key])) {
          $oldPath = $oldArray[$key];
          // If old path is not a base64 and not the same as new path, delete it
          if (!$this->isBase64Image($oldPath) && $oldPath !== $newPath) {
            $this->deleteImage($oldPath);
          }
        }
      } else {
        // For non-image fields, just copy value
        $result[$key] = $value;

        // Also check if this field was an image in old data but now it's removed or changed
        if (is_array($oldArray) && isset($oldArray[$key]) && is_string($oldArray[$key])) {
          $oldPath = $oldArray[$key];
          if (!$this->isBase64Image($oldPath) && $oldPath !== $value) {
            // Old image was replaced with a non-image (or different string), delete it
            $this->deleteImage($oldPath);
          }
        }
      }
    }

    // Also check for keys that exist in old but not in new (removed fields that might be images)
    if (is_array($oldArray)) {
      foreach ($oldArray as $key => $oldValue) {
        if (!array_key_exists($key, $newArray) && is_string($oldValue) && !$this->isBase64Image($oldValue)) {
          // This field was removed from new data, and it was an image path
          $this->deleteImage($oldValue);
        }
      }
    }

    return $result;
  }

  /**
   * Check if a string is a base64 image.
   */
  protected function isBase64Image(string $string): bool
  {
    return str_starts_with($string, 'data:image/');
  }

  /**
   * Upload a base64 image and return the storage path.
   */
  protected function uploadImage(string $base64String, string $subPath = 'sections'): string
  {
    try {
      // Extract image data
      $imageData = explode(',', $base64String);
      if (count($imageData) < 2) {
        return '';
      }
      $imageContent = base64_decode($imageData[1]);
      $extension = $this->getImageExtension($base64String);

      // Simplified filename: YYYYMMDD_UUID.extension
      $datePrefix = date('Ymd');
      $uuid = Str::uuid();
      $filename = $datePrefix . '_' . $uuid . '.' . $extension;

      // Single directory structure: sections/filename
      $path = $subPath . '/' . $filename;

      // Store the image
      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      // Log error and return empty string
      Log::error('Image upload failed: ' . $e->getMessage());
      return '';
    }
  }

  /**
   * Get image extension from base64 string.
   */
  protected function getImageExtension(string $base64String): string
  {
    $mimeMap = [
      'image/jpeg' => 'jpg',
      'image/jpg' => 'jpg',
      'image/png' => 'png',
      'image/gif' => 'gif',
      'image/webp' => 'webp',
      'image/svg+xml' => 'svg',
      'image/svg' => 'svg',
      'image/bmp' => 'bmp',
      'image/tiff' => 'tiff',
      'image/x-icon' => 'ico',
      'image/vnd.microsoft.icon' => 'ico',
    ];

    if (preg_match('/^data:([^;]+);base64,/', $base64String, $matches)) {
      $mimeType = $matches[1];
      return $mimeMap[$mimeType] ?? 'png';
    }

    return 'png';
  }

  /**
   * Delete an image from storage if it exists.
   */
  protected function deleteImage(string $path): void
  {
    // Remove /storage/ prefix to get relative path
    $relativePath = str_replace('/storage/', '', $path);
    if (Storage::disk('public')->exists($relativePath)) {
      Storage::disk('public')->delete($relativePath);
    }
  }

  /**
   * Get About Content options for dropdown
   */
  public function getAboutContentOptions()
  {
    try {
      $items = AboutContent::where('is_active', true)
        ->orderBy('title')
        ->get()
        ->map(function ($item) {
          return [
            'id' => $item->id,
            'slug' => $item->slug,
            'title' => $item->title,
            'type' => $item->type,
            'content' => $item->content,
            'full_content' => $item->full_content,
            'image' => $item->image,
            'icon' => $item->icon,
            'bg_color' => $item->bg_color,
            'btn_text' => $item->btn_text,
            'btn_link' => $item->btn_link,
            'display_order' => $item->display_order,
            'is_featured' => $item->is_featured,
            'tags' => $item->tags,
          ];
        });

      return response()->json($items);
    } catch (\Exception $e) {
      Log::error('Error fetching about content options: ' . $e->getMessage());
      return response()->json([
        'error' => 'Failed to fetch about content options',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Soft delete a section (moves to trash)
   */
  public function destroy(int $id)
  {
    try {
      DB::beginTransaction();

      $sectionConfig = SectionConfig::withTrashed()->findOrFail($id);

      // Check if it's a fixed section - prevent deletion
      if ($sectionConfig->is_fixed_section) {
        return back()->with('error', 'Fixed sections cannot be deleted.');
      }

      // Check if it's a special component that might have dependencies
      if ($sectionConfig->is_special_component) {
        // For special components, we just soft delete the config
        // The actual data (blogs, programs, etc.) remains untouched
        $sectionConfig->delete();

        DB::commit();
        return back()->with('success', 'Section moved to trash successfully.');
      }

      // For custom sections, also soft delete the associated data
      if ($sectionConfig->data_table === 'custom_section_data') {
        $customData = CustomSectionData::where('page_slug', $sectionConfig->page_slug)
          ->where('section_key', $sectionConfig->section_key)
          ->first();

        if ($customData) {
          $customData->delete(); // Soft delete the custom data
        }
      }

      // Soft delete the section config
      $sectionConfig->delete();

      DB::commit();

      return back()->with('success', 'Section moved to trash successfully.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to delete section: ' . $e->getMessage());
      return back()->with('error', 'Failed to delete section: ' . $e->getMessage());
    }
  }

  /**
   * Restore a soft-deleted section
   */
  public function restore(int $id)
  {
    try {
      DB::beginTransaction();

      $sectionConfig = SectionConfig::withTrashed()->findOrFail($id);

      // Check if it's already restored
      if (!$sectionConfig->trashed()) {
        return back()->with('error', 'This section is not in the trash.');
      }

      // Restore the section config
      $sectionConfig->restore();

      // For custom sections, also restore the associated data
      if ($sectionConfig->data_table === 'custom_section_data') {
        $customData = CustomSectionData::withTrashed()
          ->where('page_slug', $sectionConfig->page_slug)
          ->where('section_key', $sectionConfig->section_key)
          ->first();

        if ($customData && $customData->trashed()) {
          $customData->restore();
        }
      }

      DB::commit();

      return back()->with('success', 'Section restored successfully.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to restore section: ' . $e->getMessage());
      return back()->with('error', 'Failed to restore section: ' . $e->getMessage());
    }
  }

  /**
   * Force delete a section (permanently remove)
   */
  public function forceDelete(int $id)
  {
    try {
      DB::beginTransaction();

      $sectionConfig = SectionConfig::withTrashed()->findOrFail($id);

      // Check if it's a fixed section - prevent deletion
      if ($sectionConfig->is_fixed_section) {
        return back()->with('error', 'Fixed sections cannot be permanently deleted.');
      }

      // For custom sections, delete associated data and images
      if ($sectionConfig->data_table === 'custom_section_data') {
        $customData = CustomSectionData::withTrashed()
          ->where('page_slug', $sectionConfig->page_slug)
          ->where('section_key', $sectionConfig->section_key)
          ->first();

        if ($customData) {
          // Delete images from storage
          $this->deleteImagesFromData($customData->data);

          // Force delete the custom data
          $customData->forceDelete();
        }
      }

      // For special components, we may want to clean up related data
      if ($sectionConfig->is_special_component) {
        // Example: If it's a BlogSection, you might want to delete associated blogs?
        // Or you might want to keep them. This depends on your business logic.
        // For now, we just delete the config.
      }

      // Force delete the section config
      $sectionConfig->forceDelete();

      DB::commit();

      return back()->with('success', 'Section permanently deleted.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to force delete section: ' . $e->getMessage());
      return back()->with('error', 'Failed to permanently delete section: ' . $e->getMessage());
    }
  }

  /**
   * Get trashed (deleted) sections for a page
   */
  public function trashed(int $pageId)
  {
    $page = Page::withTrashed()->findOrFail($pageId);

    $trashedSections = SectionConfig::onlyTrashed()
      ->where('page_slug', $page->slug)
      ->orderBy('deleted_at', 'desc')
      ->get();

    return Inertia::render('Backend/CMS/Section/Trashed', [
      'page' => $page,
      'sections' => $trashedSections,
    ]);
  }

  /**
   * Delete images from data recursively
   */
  protected function deleteImagesFromData($data): void
  {
    if (is_array($data)) {
      foreach ($data as $key => $value) {
        if (is_array($value)) {
          $this->deleteImagesFromData($value);
        } elseif (is_string($value) && $this->isImagePath($value)) {
          $this->deleteImage($value);
        }
      }
    }
  }

  /**
   * Check if a string is an image path (not base64)
   */
  protected function isImagePath(string $string): bool
  {
    // Check if it's a storage path
    return str_starts_with($string, '/storage/') &&
      !$this->isBase64Image($string);
  }

  /**
   * Get the count of trashed sections for a page
   */
  public function trashedCount(int $pageId)
  {
    $page = Page::findOrFail($pageId);

    $count = SectionConfig::onlyTrashed()
      ->where('page_slug', $page->slug)
      ->count();

    return response()->json(['count' => $count]);
  }
}
