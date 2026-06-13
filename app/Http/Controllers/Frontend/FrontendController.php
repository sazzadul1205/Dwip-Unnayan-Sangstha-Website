<?php
// app/Http/Controllers/Frontend/FrontendController.php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class FrontendController extends Controller
{
    /**
     * Serve any asset from storage (images, files, etc.)
     * Works for both static theme assets and user uploads
     */
    public function asset(string $path)
    {
        // Security: Prevent path traversal attacks
        if (Str::contains($path, '..')) {
            abort(404);
        }

        // Check if file exists in storage
        if (!Storage::disk('public')->exists($path)) {
            abort(404);
        }

        // Get file mime type from the resolved local file path
        $fullPath = Storage::disk('public')->path($path);
        $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';

        // Cache for 1 year for better performance
        $cacheTime = 31536000; // 1 year in seconds

        // Return file with proper headers and caching
        return response()
            ->file($fullPath, ['Content-Type' => $mimeType])
            ->setCache([
                'public' => true,
                'max_age' => $cacheTime,
                's_maxage' => $cacheTime
            ]);
    }

    /**
     * Get shared data for all frontend pages (TopBar, Navbar, Footer)
     */
    private function getSharedData(): array
    {
        // Asset helper function using route
        $asset = function ($path) {
            return route('asset', ['path' => ltrim($path, '/')]);
        };

        // Top Bar Data
        $topBarData = [
            'contactInfo' => [
                'email' => [
                    'text' => 'dus.eddus@gmail.com',
                    'icon' => $asset('images/TopBar/Email.svg'),
                    'alt' => 'Email'
                ],
                'phone' => [
                    'text' => '+880 1761-493412',
                    'icon' => $asset('images/TopBar/Phone.svg'),
                    'alt' => 'Phone'
                ],
                'hours' => [
                    'text' => 'Sun - Thu 9:00AM - 5:00PM',
                    'icon' => $asset('images/TopBar/Clock.svg'),
                    'alt' => 'Clock'
                ]
            ],
            'languages' => [
                ['code' => 'us', 'name' => 'English', 'flag' => $asset('images/Flags/united-states.png')],
                ['code' => 'bd', 'name' => 'Bengali', 'flag' => $asset('images/Flags/bangladesh.png')],
                ['code' => 'fr', 'name' => 'French', 'flag' => $asset('images/Flags/france.png')],
            ],
            'userMenu' => [
                'guest' => [
                    ['label' => 'Login', 'route' => 'login', 'type' => 'link'],
                    ['label' => 'Register', 'route' => 'register', 'type' => 'link']
                ],
                'authenticated' => [
                    ['divider' => true],
                    ['label' => 'Dashboard', 'route' => 'dashboard', 'type' => 'link'],
                    ['label' => 'Logout', 'type' => 'button', 'action' => 'logout']
                ]
            ],
            'socialLinks' => [
                ['id' => 1, 'name' => 'Facebook', 'url' => 'https://facebook.com', 'iconName' => 'FaFacebook', 'hoverColor' => 'hover:text-blue-400'],
                ['id' => 2, 'name' => 'Instagram', 'url' => 'https://instagram.com', 'iconName' => 'FaInstagram', 'hoverColor' => 'hover:text-pink-400'],
                ['id' => 3, 'name' => 'Twitter', 'url' => 'https://twitter.com', 'iconName' => 'FaXTwitter', 'hoverColor' => 'hover:text-gray-400'],
                ['id' => 4, 'name' => 'LinkedIn', 'url' => 'https://linkedin.com', 'iconName' => 'FaLinkedin', 'hoverColor' => 'hover:text-blue-500']
            ],
            'search' => [
                'placeholder' => 'Search...',
                'buttonText' => 'Search'
            ]
        ];

        // Navbar Data
        $navbarData = [
            'logo' => [
                'src' => $asset('images/Icon.svg'),
                'alt' => 'DUS Logo',
                'className' => 'h-17.5 w-auto',
                'href' => '/'
            ],
            'navLinks' => [
                ['name' => 'Home', 'href' => '/'],
                ['name' => 'About', 'href' => '/about'],
                ['name' => 'Projects & Programs', 'href' => '/projects-programs'],
                ['name' => 'Blogs', 'href' => '/blogs'],
             
            ],
            'button' => [
                'text' => 'Contact Us',
                'href' => '/contact',
                'className' => 'capitalize text-white bg-[#009BE2] hover:bg-[#009BE2]/80 px-6 py-2 rounded-lg transition-colors duration-200'
            ]
        ];

        $footerData = [
            'logo' => [
                'src' => $asset('images/Icon-bottom.svg'),
                'alt' => 'DUS Logo',
                'className' => 'h-41.25 w-auto'
            ],
            'description' => 'A Community based philanthropic and development organization emergence/dedicated to sustainable poverty reduction, entrepreneur\'s promotion and capacity building of the underprivileged directing towards a just society',
            'socialLinks' => [
                ['iconName' => 'FaFacebook', 'url' => '#', 'hoverColor' => 'hover:text-blue-400', 'ariaLabel' => 'Facebook'],
                ['iconName' => 'FaInstagram', 'url' => '#', 'hoverColor' => 'hover:text-pink-400', 'ariaLabel' => 'Instagram'],
                ['iconName' => 'FaXTwitter', 'url' => '#', 'hoverColor' => 'hover:text-gray-400', 'ariaLabel' => 'Twitter'],
                ['iconName' => 'FaLinkedin', 'url' => '#', 'hoverColor' => 'hover:text-blue-500', 'ariaLabel' => 'LinkedIn']
            ],
            'address' => [
                'title' => 'Address',
                'details' => '24/5 Mollika, Prominent Housing, 3 Pisciculture Road, Mohammadpur, Dhaka - 1207',
            ],
            'contact' => [
                'title' => 'Call',
                'numbers' => [
                    '+88 01761 493407',
                    '+88 01622 093793 – (In Emergency)',
                    '+88 02 48110362'
                ]
            ],
            'email' => [
                'title' => 'Email Us',
                'addresses' => [
                    'dusdhaka@gmail.com',
                    'dus.eddus@gmail.com'
                ]
            ],
            'quickLinks' => [
                ['name' => 'About Us', 'url' => '/about-us'],
                ['name' => 'Community Radio', 'url' => '/community-radio'],
                ['name' => 'Evaluation', 'url' => '/evaluation'],
                ['name' => 'Working Area', 'url' => '/working-area'],
                ['name' => 'Publication', 'url' => '/publication'],
                ['name' => 'Mission & Visions', 'url' => '/mission-visions'],
                ['name' => 'Blogs', 'url' => '/blogs'],
                ['name' => 'Contact Us', 'url' => '/contact-us']
            ],
            'programs' => [
                ['name' => 'Micro-Finance Program', 'url' => '/programs/micro-finance'],
                ['name' => 'Disaster Management', 'url' => '/programs/disaster-management'],
                ['name' => 'Community Radio', 'url' => '/programs/community-radio'],
                ['name' => 'Education', 'url' => '/programs/education'],
                ['name' => 'ICT for Development', 'url' => '/programs/ict-development'],
                ['name' => 'Health Program', 'url' => '/programs/health'],
                ['name' => 'Livelihood', 'url' => '/programs/livelihood'],
                ['name' => 'Member Facilities', 'url' => '/programs/member-facilities'],
                ['name' => 'Social Development', 'url' => '/programs/social-development'],
                ['name' => 'Legal Support', 'url' => '/programs/legal-support'],
                ['name' => 'Agriculture', 'url' => '/programs/agriculture'],
                ['name' => 'Water and Sanitation', 'url' => '/programs/water-sanitation'],
                ['name' => 'Research and Documentation', 'url' => '/programs/research-documentation'],
                ['name' => 'Training Facilities', 'url' => '/programs/training'],
                ['name' => 'Tourism', 'url' => '/programs/tourism']
            ],
            'newsletter' => [
                'title' => 'Subscribe to Our Newsletter',
                'placeholder' => 'Enter your email address',
                'buttonText' => 'Subscribe',
                'apiEndpoint' => '/api/subscribe-newsletter'
            ],
            'bottomFooter' => [
                'copyright' => '© 2026 Dwip Unnayan. All rights reserved.',
                'links' => [
                    ['text' => 'Terms of Service', 'url' => '/terms'],
                    ['text' => 'Privacy Policy', 'url' => '/privacy']
                ]
            ]
        ];

        return [
            'topBarData' => $topBarData,
            'navbarData' => $navbarData,
            'footerData' => $footerData,
        ];
    }

    /**
     * Display the home page
     */
    public function home(): Response
    {
        $asset = function ($path) {
            return route('asset', ['path' => ltrim($path, '/')]);
        };

        // Banner Data
        $bannerData = [
            'background' => [
                'src' => $asset('Banner/64065404ef679e54d2dabd90bba3b1744817c578.webp'),
                'alt' => 'Background'
            ],
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
                    'text' => 'Your kindness has the power to change lives. Join us in bringing hope, support, and brighter futures to those in need. Every donation makes a difference big or small.',
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
        ];

        // About Us Data
        $aboutUsData = [
            'section' => [
                'title' => 'About us',
                'description' => 'A Community based philanthropic and development organization emergence/dedicated to sustainable poverty reduction, entrepreneur\'s promotion and capacity building of the underprivileged directing towards a just society. Interventions, DUS strives to bring about positive change in the quality of life of the poor community of rural Bangladesh.',
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
                        'icon' => $asset('AboutUs/65af8a95ec6612fa3ef2941b_011-charity-1%201.svg'),
                        'title' => 'Education for All',
                        'description' => 'Charity is dedicated to ensuring that every child has access to quality education.',
                        'alt' => 'Education Icon'
                    ],
                    [
                        'id' => 2,
                        'icon' => $asset('AboutUs/65af8a95c570e47bd1123b4e_033-hospital%201.svg'),
                        'title' => 'Health and Wellness',
                        'description' => 'Our commitment to health and wellness extends across borders.',
                        'alt' => 'Health Icon'
                    ],
                    [
                        'id' => 3,
                        'icon' => $asset('AboutUs/65af8a95cee257c23ab03ff8_040-shelter%201.svg'),
                        'title' => 'Disaster Relief',
                        'description' => 'In times of crisis, Charity responds swiftly to provide emergency relief.',
                        'alt' => 'Disaster Relief Icon'
                    ],
                    [
                        'id' => 4,
                        'icon' => $asset('AboutUs/65af8a958d27ad8d830434f4_022-family-1%201.svg'),
                        'title' => 'Community Development',
                        'description' => 'Charity invests in sustainable community development projects to create.',
                        'alt' => 'Community Development Icon'
                    ]
                ]
            ],
            'impact' => [
                'title' => 'Impact In Numbers',
                'stats' => [
                    ['id' => 1, 'value' => '20', 'suffix' => '+', 'label' => 'Years of Service'],
                    ['id' => 2, 'value' => '15', 'suffix' => '+', 'label' => 'Project Program'],
                    ['id' => 3, 'value' => '10', 'suffix' => '+', 'label' => 'Award Received']
                ]
            ],
            'image' => [
                'src' => $asset('AboutUs/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff.webp'),
                'alt' => 'About Us Image'
            ]
        ];

        // Our Action Data
        $ourActionData = [
            'section' => [
                'title' => 'Our Actions for Social Change',
                'description' => 'We turn compassion into action by implementing community-led programs, advocating for social justice, and promoting education, health, and equality'
            ],
            'actions' => [
                ['id' => 1, 'icon' => $asset('OurActions/fi_1940611.svg'), 'title' => 'Education', 'description' => 'We empower communities by investing in sustainable projects, training livelihood programs.', 'alt' => 'Education Icon'],
                ['id' => 2, 'icon' => $asset('OurActions/fi_14888982.svg'), 'title' => 'Microfinance', 'description' => 'We empower communities by investing in sustainable projects, training livelihood programs.', 'alt' => 'Microfinance Icon'],
                ['id' => 3, 'icon' => $asset('OurActions/fi_3004451.svg'), 'title' => 'Health', 'description' => 'Providing nutritious meals and groceries to individuals and families in need.', 'alt' => 'Health Icon'],
                ['id' => 4, 'icon' => $asset('OurActions/fi_17316107.svg'), 'title' => 'Organizational Development', 'description' => 'We empower underprivileged children with the opportunity to learn, grow, and succeed.', 'alt' => 'Organizational Development Icon'],
                ['id' => 5, 'icon' => $asset('OurActions/fi_6786176.svg'), 'title' => 'Climate Change', 'description' => 'From free medical camps to life-saving treatments, we support initiatives that provide critical aid to access to proper.', 'alt' => 'Climate Change Icon'],
                ['id' => 6, 'icon' => $asset('OurActions/fi_1176562.svg'), 'title' => 'Human Rights', 'description' => 'From free medical camps to life-saving treatments, we support initiatives that provide critical aid to access to proper.', 'alt' => 'Human Rights Icon'],
                ['id' => 7, 'icon' => $asset('OurActions/fi_8992468.svg'), 'title' => 'Human Resource', 'description' => 'Bringing clean and safe drinking water to communities, improving sanitation, and preventing waterborne diseases.', 'alt' => 'Human Resource Icon'],
                ['id' => 8, 'icon' => $asset('OurActions/fi_726211.svg'), 'title' => 'Social Enterprises', 'description' => 'We empower communities by investing in sustainable projects, training livelihood programs.', 'alt' => 'Social Enterprises Icon'],
                ['id' => 9, 'icon' => $asset('OurActions/fi_4994126.svg'), 'title' => 'Agriculture Food Security', 'description' => 'Bringing clean and safe drinking water to communities, improving sanitation, and preventing waterborne diseases.', 'alt' => 'Agriculture Food Security Icon']
            ]
        ];

        // Where We Work Data
        $whereWeWorkData = [
            'section' => ['title' => 'Where We Work'],
            'stats' => [
                ['id' => 1, 'icon' => $asset('WhereWeWork/image%206-3.png'), 'value' => '450K', 'label' => 'Total Member Reach', 'alt' => 'Member Reach Icon'],
                ['id' => 2, 'icon' => $asset('WhereWeWork/image%206-2.png'), 'value' => '41,382', 'label' => 'Mail Engaged in Divers Livelihoods Options', 'alt' => 'Member Reach Icon'],
                ['id' => 3, 'icon' => $asset('WhereWeWork/image%206-1.png'), 'value' => '35,193', 'label' => 'Women Engaged in Diverse Livelihoods Options', 'alt' => 'Member Reach Icon'],
                ['id' => 4, 'icon' => $asset('WhereWeWork/image%206.png'), 'value' => '35,193', 'label' => 'Women Engaged in Diverse Livelihoods Options', 'alt' => 'Mail Engaged Icon'],
                ['id' => 5, 'icon' => $asset('WhereWeWork/image%206-1.png'), 'value' => '38.0 M', 'label' => 'Digital media Outreach', 'alt' => 'Women Engaged Icon'],
                ['id' => 6, 'icon' => $asset('WhereWeWork/image%206.png'), 'value' => '35,193', 'label' => 'Women Engagement in Diverse Livelihood Options', 'alt' => 'Mail Engaged Icon']
            ],
            'image' => [
                'src' => $asset('WhereWeWork/image.png'),
                'alt' => 'Map Place holder Text',
                'className' => 'w-full h-232.5 object-cover rounded-4xl'
            ]
        ];

        // Our Programs Data
        $ourProgramsData = [
            'section' => [
                'title' => 'Our Programs',
                'description' => 'Transforming lives through sustainable development initiatives and community empowerment programs.',
                'button' => [
                    'text' => 'View all Projects and programs',
                    'link' => '/projects-programs'
                ]
            ],
            'programs' => [
                [
                    'id' => 1,
                    'title' => 'Micro-Finance <br /> Program',
                    'description' => '<div class="space-y-3"><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Micro finance Program is the core program of DUS activities implemented in partnership with <strong class="text-[#009BE2]">Palli Karma Sahayak Foundation (PKSF)</strong> since 2000. It provides collateral free micro-credit to 40K+ group members where 97% are female.</p><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">The program includes savings schemes for poor women with no access to mainstream banks, helping them promote income generating activities and achieve economic empowerment.</p></div>',
                    'image' => $asset('OurPrograms/945e2496664a40b12a1cddd6561e954cdc78e255.webp'),
                    'bgColor' => 'bg-[#E6F3E7]',
                    'link' => '/projects-programs/micro-finance'
                ],
                [
                    'id' => 2,
                    'title' => 'Climate Change and <br /> Disaster Management',
                    'description' => '<div class="space-y-3"><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">DUS operates in highly disaster-prone coastal areas of Bangladesh, working with communities to build <strong class="text-[#009BE2]">resilience against natural disasters</strong> like cyclones, floods, and storm surges.</p><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Moving beyond relief, we focus on institutionalized preparedness, risk reduction, early warning systems, and long-term climate adaptation strategies for vulnerable coastal communities.</p></div>',
                    'image' => $asset('OurPrograms/a03fa6dba9fcdac0a5aedf2d337b118228a03298.webp'),
                    'bgColor' => 'bg-[#F3EDE6]',
                    'link' => '/projects-programs/climate-change'
                ],
                [
                    'id' => 3,
                    'title' => 'Community Radio',
                    'description' => '<div class="space-y-3"><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Empowering Hatiya Island communities by giving them a <strong class="text-[#009BE2]">voice for change</strong> through community radio. Bangladesh is the 2nd country in South Asia with a Community Radio Policy.</p><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">The radio broadcasts agricultural information, health awareness, local news, women empowerment programs, and cultural content, reaching thousands of listeners daily.</p></div>',
                    'image' => $asset('OurPrograms/e280b627b1771904c38022aac2566b932e248887.webp'),
                    'bgColor' => 'bg-[#E8E6F3]',
                    'link' => '/projects-programs/community-radio'
                ],
                [
                    'id' => 4,
                    'title' => 'Research and <br /> Documentation',
                    'description' => '<div class="space-y-3"><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">DUS has a strong <strong class="text-[#009BE2]">Research and Documentation Cell</strong> conducting quality research in education, health, livelihood, environment, human rights, and social justice.</p><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">The cell engages in surveys, impact assessments, and documentation of best practices, helping shape effective development interventions and policy advocacy.</p></div>',
                    'image' => $asset('OurPrograms/a496922a3fc00992b6c454822d60bde51dc001e5.webp'),
                    'bgColor' => 'bg-[#F3E6EA]',
                    'link' => '/projects-programs/research-documentation'
                ],
                [
                    'id' => 5,
                    'title' => 'WATSAN <br /> Program',
                    'description' => '<div class="space-y-3"><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Providing sustainable <strong class="text-[#009BE2]">water and sanitation services</strong> to rural communities with support from the Netherland Government, implemented in Nangolia Char and Nalerchar under Hatiya Upazilla.</p><p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Target: 4,605 households with sanitation, 250 deep tube wells for safe water, and hygiene education for 20,000 people.</p></div>',
                    'image' => $asset('OurPrograms/be14c45848898048e7b7832affc4dc713b032e10.webp'),
                    'bgColor' => 'bg-[#F2F3E6]',
                    'link' => '/projects-programs/watsan'
                ]
            ]
        ];

        // Stories Data
        $storiesData = [
            'section' => [
                'title' => 'Insights, Stories & Impact',
                'description' => 'Read real stories from the field, community experiences, and thought-provoking perspectives that reflect our mission and impact.'
            ],
            'stories' => [
                [
                    'id' => 1,
                    'image' => $asset('Stories/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp'),
                    'date' => 'June 6, 2023',
                    'title' => 'Invest in Kindness, Reap a Better Future',
                    'description' => 'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
                    'link' => '/stories/invest-in-kindness'
                ],
                [
                    'id' => 2,
                    'image' => $asset('Stories/b3d758bf8cd7985c857cdbe55b5101b105ee9f75.webp'),
                    'date' => 'June 6, 2023',
                    'title' => 'How to Design a Custom Pool That Perfectly Fits Your Charlotte Backyard',
                    'description' => 'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
                    'link' => '/stories/custom-pool-design'
                ],
                [
                    'id' => 3,
                    'image' => $asset('Stories/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff%20(1).webp'),
                    'date' => 'June 6, 2023',
                    'title' => 'The Benefits of Mindfulness in Daily Life',
                    'description' => 'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
                    'link' => '/stories/mindfulness-benefits'
                ],
                [
                    'id' => 4,
                    'image' => $asset('Stories/3fe55eb9ebcfd7efb80f559a00b8b5a1da0e8c3e.webp'),
                    'date' => 'July 15, 2023',
                    'title' => 'Empowering Women Through Microfinance',
                    'description' => 'Discover how small loans are making a big difference...',
                    'link' => '/stories/empowering-women'
                ],
                [
                    'id' => 5,
                    'image' => $asset('Stories/de90e922c05aa3585b8f65361c306413c3b3d7be.webp'),
                    'date' => 'August 2, 2023',
                    'title' => 'Building Resilient Communities Against Climate Change',
                    'description' => 'Learn about our initiatives to help coastal communities...',
                    'link' => '/stories/climate-resilience'
                ],
                [
                    'id' => 6,
                    'image' => $asset('Stories/f465fcbdab4004cd25dba4df06b9f8d5f2648620.webp'),
                    'date' => 'September 10, 2023',
                    'title' => 'Providing Clean Water to Remote Villages',
                    'description' => 'Access to clean water is a basic human right...',
                    'link' => '/stories/clean-water'
                ]
            ]
        ];

        // Upcoming Events Data
        $upcomingEventsData = [
            'section' => [
                'title' => 'Upcoming Events & Community Actions',
                'description' => 'Read real stories from the field, community experiences, and thought-provoking perspectives that reflect our mission and impact.',
                'button' => [
                    'text' => 'Explore All Events',
                    'link' => '/events'
                ]
            ],
            'image' => [
                'src' => $asset('UpcomingEvent/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp'),
                'alt' => 'Events Image',
                'className' => 'mt-15 rounded-2xl h-139.25 w-auto'
            ],
            'events' => [
                [
                    'id' => 1,
                    'date' => [
                        'day' => '25',
                        'month' => 'Apr',
                        'weekday' => 'THU',
                        'dayNumber' => '1',
                        'time' => '10:30AM'
                    ],
                    'location' => 'International Convention City Bashundhara - ICCB',
                    'title' => 'Participate in our community clean-up day and make a difference together',
                    'description' => 'Let\'s shape the future of the food industry together! Participate at the 9th Food Bangladesh Int\'l Expo 2026,',
                    'link' => '/events/community-cleanup'
                ],
                [
                    'id' => 2,
                    'date' => [
                        'day' => '28',
                        'month' => 'Apr',
                        'weekday' => 'SUN',
                        'dayNumber' => '2',
                        'time' => '02:00PM'
                    ],
                    'location' => 'Dhaka University Campus - Dhaka',
                    'title' => 'Education for All: Scholarship Distribution Ceremony',
                    'description' => 'Join us as we distribute scholarships to underprivileged students and celebrate their achievements in pursuing quality education.',
                    'link' => '/events/scholarship-ceremony'
                ],
                [
                    'id' => 3,
                    'date' => [
                        'day' => '05',
                        'month' => 'May',
                        'weekday' => 'MON',
                        'dayNumber' => '3',
                        'time' => '09:00AM'
                    ],
                    'location' => 'Hatiya Island Community Center - Noakhali',
                    'title' => 'Climate Adaptation Workshop for Coastal Communities',
                    'description' => 'Learn sustainable farming techniques and disaster preparedness strategies to combat climate change impacts in coastal areas.',
                    'link' => '/events/climate-workshop'
                ]
            ]
        ];

        // Jobs Data
        $jobsData = [
            'section' => [
                'title' => 'Join our big family',
                'description' => 'Join us on this journey of kindness, and let\'s make a difference, one act of charity at a time.'
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
                    ['value' => 'internship', 'label' => 'Internship']
                ]
            ],
            'jobs' => [
                [
                    'id' => 1,
                    'type' => 'Full time',
                    'department' => 'Management',
                    'location' => 'Dhaka, Bangladesh',
                    'title' => 'Senior Program Manager - Microfinance',
                    'description' => 'Lead and oversee microfinance program operations, manage team of field officers, and ensure sustainable financial inclusion for underserved communities.',
                    'link' => '/jobs/senior-program-manager'
                ],
                [
                    'id' => 2,
                    'type' => 'Part time',
                    'department' => 'Development',
                    'location' => 'Anywhere in Bangladesh',
                    'title' => 'Program Coordinator - Youth Empowerment',
                    'description' => 'Develop and deliver workshops, mentorship programs, and educational events for underprivileged youth to build essential life skills.',
                    'link' => '/jobs/youth-coordinator'
                ],
                [
                    'id' => 3,
                    'type' => 'Full time',
                    'department' => 'Climate Action',
                    'location' => 'Hatiya, Noakhali',
                    'title' => 'Climate Change Specialist',
                    'description' => 'Design and implement climate adaptation strategies, conduct risk assessments, and train communities on disaster preparedness.',
                    'link' => '/jobs/climate-specialist'
                ],
                [
                    'id' => 4,
                    'type' => 'Contract',
                    'department' => 'Research',
                    'location' => 'Remote',
                    'title' => 'Research Associate - Impact Assessment',
                    'description' => 'Conduct qualitative and quantitative research, analyze program data, and prepare impact reports for stakeholders.',
                    'link' => '/jobs/research-associate'
                ],
                [
                    'id' => 5,
                    'type' => 'Internship',
                    'department' => 'Media',
                    'location' => 'Chattogram',
                    'title' => 'Radio Production Intern',
                    'description' => 'Assist in content creation, audio production, and community outreach programs for our community radio station.',
                    'link' => '/jobs/radio-intern'
                ]
            ]
        ];

        // Program Impact Data
        $programImpactData = [
            'section' => [
                'title' => 'Program Impact and SDGs',
                'mainImage' => [
                    'images' => [
                        $asset('ProgramImpact/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff%20(1).webp'),
                        $asset('ProgramImpact/64065404ef679e54d2dabd90bba3b1744817c578.webp'),
                        $asset('ProgramImpact/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff%20(1).webp'),
                        $asset('ProgramImpact/64065404ef679e54d2dabd90bba3b1744817c578.webp')
                    ]
                ]
            ],
            'sdgImages' => [
                ['id' => 1, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18732_www.figma.com.webp'), 'alt' => 'No Poverty'],
                ['id' => 2, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18742_www.figma.com.webp'), 'alt' => 'Zero Hunger'],
                ['id' => 3, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18750_www.figma.com.webp'), 'alt' => 'Good Health'],
                ['id' => 4, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_1887_www.figma.com.webp'), 'alt' => 'Quality Education'],
                ['id' => 5, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18823_www.figma.com.webp'), 'alt' => 'Gender Equality'],
                ['id' => 6, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18837_www.figma.com.webp'), 'alt' => 'Clean Water'],
                ['id' => 7, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_1894_www.figma.com.webp'), 'alt' => 'Clean Energy'],
                ['id' => 8, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18913_www.figma.com.webp'), 'alt' => 'Decent Work'],
                ['id' => 9, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18920_www.figma.com.webp'), 'alt' => 'Industry Innovation'],
                ['id' => 10, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18930_www.figma.com.webp'), 'alt' => 'Reduced Inequalities'],
                ['id' => 11, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18939_www.figma.com.webp'), 'alt' => 'Sustainable Cities'],
                ['id' => 12, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18949_www.figma.com.webp'), 'alt' => 'Responsible Consumption'],
                ['id' => 13, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_18108_www.figma.com.webp'), 'alt' => 'Climate Action'],
                ['id' => 14, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_181017_www.figma.com.webp'), 'alt' => 'Life Below Water'],
                ['id' => 15, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_181031_www.figma.com.webp'), 'alt' => 'Life On Land'],
                ['id' => 16, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_181046_www.figma.com.webp'), 'alt' => 'Peace Justice'],
                ['id' => 17, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_181055_www.figma.com.webp'), 'alt' => 'Partnerships'],
                ['id' => 18, 'src' => $asset('ProgramImpact/Screenshot_17-5-2026_181133_www.figma.com.webp'), 'alt' => 'SDG 18']
            ]
        ];

        // Merge shared data with page-specific data
        return Inertia::render('Frontend/Home/Home', array_merge(
            $this->getSharedData(),
            [
                'bannerData' => $bannerData,
                'aboutUsData' => $aboutUsData,
                'ourActionData' => $ourActionData,
                'whereWeWorkData' => $whereWeWorkData,
                'ourProgramsData' => $ourProgramsData,
                'storiesData' => $storiesData,
                'upcomingEventsData' => $upcomingEventsData,
                'jobsData' => $jobsData,
                'programImpactData' => $programImpactData,
            ]
        ));
    }

    /**
     * Display the about page
     */
    public function about(): Response
    {
        $asset = function ($path) {
            return route('asset', ['path' => ltrim($path, '/')]);
        };

        // Banner Data
        $bannerData = [
            'background' => [
                'src' => $asset('AboutUs/9734ab42cfed2d40c8ed08cbc3059b227d9aee8b.jpg'),
                'alt' => 'Background'
            ],
            'overlay' => [
                'darkOverlay' => 'bg-black/40 lg:bg-black/50',
                'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
            ],
            'content' => [
                'title' => [
                    'text' => 'About Us',
                    'className' => 'font-bold leading-tight'
                ],
                'description' => [
                    'text' => 'Our mission is to help all the people in need',
                    'className' => 'font-normal leading-tight'
                ]
            ],
        ];

        // Vision & Mission Data (HTML format)
        $visionAndMissionData = [
            'section' => [
                'title' => 'Vision, Mission, Goal, Objectives and Core values'
            ],
            'content' => [
                'html' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Vision</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS dreams the existence of a society free from all sorts of exploitation where everyone irrespective of class, creed and cast will enjoy equal rights, freedom and justice leading an equitable and gender balanced communities.</p>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Mission</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">Coastal areas of Bangladesh are regularly stricken by natural disasters. Most of the people living here are almost poor. Due to regular natural disasters occurs here inhabitants are lacking asset and resources and they are deepened in illiterate, malnourished and culturally remain backward. DUS believes that optimizing utilization of hidden humane capacity & power and local resources intensively could gradually alleviate this condition. It perceives to bring down all this scope of development affords in an integrated manner so that sustainable livelihood ventures emerge in the community according to their aspiration.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Initiating, activating, promoting and facilitating the sustainable development of the targeted population through capacity building, resource mobilization, networking, lobbying, need assessment, impact analysis, research, evaluation and policy advocacy in order to ensure and protected equal human rights, freedom, justice in all shape of individual, family and community life in all interventional areas.</p>
                    </div>
                </div>
            '
            ],
            'btn' => [
                'text' => 'Learn More About Vision, Mission, Goal',
                'link' => '/about/vision-mission'
            ],
            'image' => [
                'src' => $asset('AboutUs/c9c3585f93806d98cf9e2fbeadccb32a66efb4b5.jpg'),
                'alt' => 'Vision and Mission',
                'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
            ]
        ];

        // Background Data (HTML format)
        $backgroundData = [
            'section' => [
                'title' => 'Background, Roles and Functions'
            ],
            'content' => [
                'html' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Background:</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">The emergence and existence of Dwip Unnayan Songstha (Island Development Association)- DUS was based upon asserting the victims of The Liberation War in 1971 as well as providing immediate relief support to the worse suffer being affected by the devastating cyclone flown over the coastal areas of Bangladesh in 1970.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS, by virtue of its roles, functions and services being visioned and dreamt by the founder and associates, is basically a development and philanthropic organization located at Hatiya Island under Noakhali district in southern Bangladesh. The main focus and concentration of the organization since its inception has been to humanitarian and rehabilitation work for war and cyclone victim affected populations which in the passage of time has turned into integrated socio-economic and sustainable community development services directing towards a just society free from all sorts of exploitation, injustice and deprivation.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Until 1981, DUS has been well-thought-out and recognized as a volunteer initiative for providing aid, relief and rehabilitation related activities and gaining experiences on the said services over last one decade since its inception, the structural based organizational formation took into shape in 1982, announcing its mandate as an association/platform for land development, protection and restoration.</p>
                    </div>
                </div>
            '
            ],
            'btn' => [
                'text' => 'Learn More About Functions',
                'link' => '/about/functions'
            ],
            'image' => [
                'src' => $asset('AboutUs/f465fcbdab4004cd25dba4df06b9f8d5f2648620.jpg'),
                'alt' => 'Background',
                'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
            ]
        ];

        // Legal Data
        $legalData = [
            'background' => [
                'src' => $asset('AboutUs/64065404ef679e54d2dabd90bba3b1744817c578.jpg'),
                'alt' => 'Background'
            ],
            'overlay' => [
                'darkOverlay' => 'bg-black/40',
            ],
            'textBox' => [
                'title' => 'Legal Status and Org.',
                'titleLine2' => 'Affiliations',
                'buttonText' => 'Learn More Affiliations',
                'buttonLink' => '/about/legal-affiliations'
            ]
        ];

        // Interventional Data (HTML format)
        $interventionalData = [
            'section' => [
                'title' => 'Interventional Approaches and DUS Priorities'
            ],
            'content' => [
                'html' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Sustainable Poverty Reduction and Human Development:</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">The development interventional unit of GoB is each Household. DUS believes if the member of the HHs are developed then they can play an active role to bring immense changes within their families. As a whole each household take part into the process of socio-economic development of the country.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">This Organization\'s aim to help its member\'s inherent abilities to flourish such a way so that they are endowed with the key to their progress to a sustainable livelihood restoration. With renewed confidence and hope, the poor, then, move ahead and break free from the shackles of multidimensional poverty and indignity and achieve living standards characterized by human freedom and dignity, along with material uplift.</p>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Focus on Landless poor</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS concentrates on the settlement of landless poor families who are victims of major riverbank erosion & affected by several natural disasters like tropical cyclone, salinity, tidal surge etc that are living below poverty line in the coastal district of Bangladesh.</p>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Empowerment of Women</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Over 87% of our target population/beneficiaries are poor women. DUS believes if women are empowered towards right direction, they can play an active role to bring vital changes within their families as well as in the communities.</p>
                    </div>
                </div>
            '
            ],
            'btn' => [
                'text' => 'Learn More About Interventional Approaches',
                'link' => '/about/interventional-approaches'
            ],
            'image' => [
                'src' => $asset('AboutUs/d3afc7e94d5609f2c2356758f463ee15af0450fe.jpg'),
                'alt' => 'Interventional Approaches',
                'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
            ]
        ];

        // Evolutionary Changes Data (HTML format)
        $evolutionaryChangesData = [
            'section' => [
                'title' => 'Evolutionary Changes and Footings'
            ],
            'content' => [
                'html' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Year 1972-1985</h2>
                        <ul class="list-disc pl-5 space-y-2 mb-4">
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS was formed by a group of young volunteers and started working for the victims of Bangladesh Liberation War of 1971 and devastating 1970 cyclone affected households at Hatiya Island focusing on humanitarian service to mankind</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Relief and rehabilitation program for the victims and initiate disaster management program at local level</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Rehabilitation of 2000 landless river bank eroded farmers in the newly accreted Govt. Khash land</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS turn into an organizational shape and named as Dwip Unnayan Sangstha in 1982</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Community Mobilization and revolving credit support to community started in 1984</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Registered with Ministry of Social Services &amp; Welfare.</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Registered with NGO Affairs Bureau.</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Socio-economic development programs for the poor initiative from 1985</li>
                        </ul>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Year 1986-2000</h2>
                        <ul class="list-disc pl-5 space-y-2">
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Strengthening Local Govt. bodies through capacity building in good governance, accountancy and resource management supported by IVS/ USAID</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Capacity building of Union Parishad and Upazila Parishad for effective disaster management in four coastal district of Bangladesh supported by CARE-Bangladesh &amp; USAID</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Island fisheries development project implementation supported by DFID.</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Disaster rehabilitation support project implementation supported by AusAid/Oxfam-America/Oxfam-UK, Oxfam-Hong Kong British ODA</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Cyclone shelter Construction supported by CAA Australia</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Housing support for poor supported by British ODA/CARE-Bangladesh/AusAid</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Livestock development for poor supported by DANIDA, CIDA</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Integrated Socio-economic development program supported by Oxfam-UK</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Emergency Relief and Rehabilitation for Cyclone in coastal islands supported by Oxfam-UK, British ODA, CARE-Bangladesh</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Livelihood Rehabilitation for Flood Affected Fisheries Households in Hatiya Island supported by DFID</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Flood 98 Rehabilitation program supported by DFID, Oxfam-GB</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'btn' => [
                'text' => 'Learn More About 2001 - 2020',
                'link' => '/about/evolutionary-changes'
            ],
            'image' => [
                'src' => $asset('AboutUs/962bd5ee9dacf1f4261d0592856f5716dcffb725.jpg'),
                'alt' => 'Evolutionary Changes',
                'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
            ]
        ];

        // Governance Data (HTML format)
        $governanceData = [
            'section' => [
                'title' => 'Governance'
            ],
            'content' => [
                'html' => '
                <div class="space-y-6">
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS believes in democratic practice and public-private participation to achieve its goal, purpose and objectives and accordingly the internal management system has been framed comprising the following structures:</p>
                    
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">General Body</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">The General Body consists of 31 members who are the permanent resident of the coastal community. Of them 30% are women. The social and professional status of the members include teachers, lawyers, social workers, freedom fighters and community leaders.</p>
                    </div>
                    
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Executive Committee</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS has an Executive Committee of 7 members duly elected by the General Body for a period of three years. DUS is represented by its Executive Director who is the Member Secretary of the Executive Committee. ED and his core staff members are appointed by the board. Executive Director is treated as the Chief Executive of the organization. The Executive Director is the overall authority to implement the projects and programs on behalf of the Executive Committee.</p>
                    </div>
                </div>
            '
            ],
            'btn' => [
                'text' => 'Learn More About Governance',
                'link' => '/about/governance'
            ],
            'image' => [
                'src' => $asset('AboutUs/ce88efc81f8b1fe8d4f757eba85f05717acb68e4.jpg'),
                'alt' => 'Governance',
                'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
            ]
        ];

        // Cards Data
        $cardsData = [
            'section' => [
                'title' => 'Cards Section'
            ],
            'cards' => [
                [
                    'id' => 'operational-areas',
                    'image' => [
                        'src' => $asset('AboutUs/image.png'),
                        'alt' => 'Operational Areas',
                        'className' => 'mx-auto object-contain'
                    ],
                    'title' => 'Operational Areas',
                    'buttonText' => 'Explore Our Areas of Operation',
                    'buttonLink' => '/about/operational-areas',
                    'bgColor' => 'bg-[#F5F5F5]',
                    'cardBgColor' => 'bg-white'
                ],
                [
                    'id' => 'achievements',
                    'image' => [
                        'src' => $asset('AboutUs/fcbbf1e10ca75bccf6a608e1de01306d56897811.png'),
                        'alt' => 'Our Achievements',
                        'className' => 'mx-auto object-contain'
                    ],
                    'title' => 'Our Achievements',
                    'buttonText' => 'Explore Our Evolution',
                    'buttonLink' => '/about/achievements',
                    'bgColor' => 'bg-[#F5F5F5]',
                    'cardBgColor' => 'bg-white'
                ]
            ]
        ];

        // Programs Data (HTML format)
        $programsData = [
            'section' => [
                'title' => 'Programs/Activities',
            ],
            'content' => [
                'html' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Micro-Finance Program</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with Palli Karma Sahayak Foundation (PKSF) since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female. Under this program, DUS has savings scheme for poor women who has no access in mainstream banks due to lack of capital and assets.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Most of the targeted beneficiaries of DUS are poor women, marginal farmers and small micro entrepreneurs. Major borrowers are women who used these loan funds to promote various income generating activities for their earnings and employments. As a result, micro finance program has positive impact on poverty reduction especially at grass rote level, income enhancement, consumption, the promotion of rural businesses, education and health and finally the empowerment of women and their employment in rural island communities.</p>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Jagoron</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">Jagoron is the name of a credit instrument of PKSF to initiate household based enterprise development in Bangladesh. As a Partner Organization of PKSF, DUS is implementing this program which is now comprised with Rural Micro finance and Urban Micro finance. Rural Micro finance is that types of loan which allows rural women to finance their small scale agriculture production at homestead level.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">RMC Loans are allowed as working capital loans to promote poor and disadvantaged households in income earnings. RMC loan range from 10K to 59K to allowed for one year and service charge is 24% (Reducing Balancing Method)/12.0% (Flat Rate Method) per year. The weekly savings of RMC members are 10/= per week.</p>
                    </div>
                </div>
            '
            ],
            'btn' => [
                'text' => 'Learn More About Programs',
                'link' => '/about/programs-activities'
            ],
            'image' => [
                'src' => $asset('AboutUs/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff.jpg'),
                'alt' => 'Programs',
                'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
            ]
        ];

        // Training Data (HTML format)
        $trainingData = [
            'section' => [
                'title' => 'Training and Other Facilities',
            ],
            'content' => [
                'html' => '
                <div class="space-y-6">
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS believes that training is a key element of the development approach which focuses on people and their participation. Training has been introduced as an essential element of DUS\'s intervention strategy.</p>
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS takes up need based training programs, prepares module and training curriculum. The training programs generally involve flip chart, posters, handouts, cards &amp; charts, audiocassettes, videocassettes, original model, curriculum, modules, photographs etc. DUS has already developed a training and communication Unit fully equipped with all possible physical and human resources. DUS is organized different type of training since last two decades:</p>
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS is organized different type of training for its staffs as well as beneficiaries. DUS always prepare its yearly training plan which is incorporated basic skill development training for staffs, MIS, ToT general, Branch management and Finance management etc.</p>
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS conducts it\'s skill development training through identification of people who need skill training. This is done by conducting survey to identify marketable skills, developing modules of livelihood skills program, conducting training to the selected people, select graduates of the skill program to receive capital, linking other graduates to employment or credit program, following up the graduates to see whether they are able to achieve sustainable livelihood. The skills training programs include tree nursery management, sustainable agriculture, poultry and cattle rearing etc.</p>
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Leadership development training is a very important intervention of DUS. Leadership development training is intended for the group members under different project interventions. The training programs focus financial management of community fund, conflict management, and bottom-up planning for sustainable rural livelihoods.</p>
                </div>
            '
            ],
            'btn' => [
                'text' => 'Learn More About DUS Facilities',
                'link' => '/about/facilities'
            ],
            'image' => [
                'src' => 'https://placehold.co/730x730',
                'alt' => 'Training Facilities',
                'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
            ]
        ];

        // FAQ Data
        $faqData = [
            'section' => [
                'title' => 'Key Questions Answered About Our Us',
                'subtitle' => 'Explore our Frequently Asked Questions for answers about our charity\'s mission, projects, and how to help.'
            ],
            'faqs' => [
                [
                    'id' => 1,
                    'question' => 'What is the mission of your charity?',
                    'answer' => 'Any company that is using spreadsheets and emails to manage the people side of their business is wasting time on admin and making life more difficult for themselves. A well-designed HR system like PiHR automates menial tasks allowing business owners to focus on the strategic work of growing the business. It improves the recruitment process, enriches payroll management, provides real-time feedback, improves employees, improves data security, helps make decisions.',
                ],
                [
                    'id' => 2,
                    'question' => 'Who benefits from your programs?',
                    'answer' => 'Our programs benefit underprivileged communities, women and children, disaster-affected families, and landless poor in coastal areas of Bangladesh.',
                ],
                [
                    'id' => 3,
                    'question' => 'Can I make a recurring donation?',
                    'answer' => 'Yes, you can make recurring donations monthly, quarterly, or annually. Visit our donation page to set up your recurring contribution.',
                ],
                [
                    'id' => 4,
                    'question' => 'Can I visit the projects I support?',
                    'answer' => 'Yes, we welcome donors to visit our project sites. Please contact our office in advance to arrange a visit and meet the communities you are supporting.',
                ],
                [
                    'id' => 5,
                    'question' => 'How can I get involved?',
                    'answer' => 'You can get involved by donating, volunteering, sponsoring a child, or becoming a community ambassador. Visit our "Get Involved" page for more details.',
                ],
                [
                    'id' => 6,
                    'question' => 'How can I make a donation?',
                    'answer' => 'You can make a donation online through our secure payment portal, bank transfer, or by visiting our office. We accept one-time and recurring donations.',
                ],
                [
                    'id' => 7,
                    'question' => 'How do you maintain accountability?',
                    'answer' => 'We maintain transparency through regular audits, annual reports, community feedback mechanisms, and public disclosure of our financial statements.',
                ],
                [
                    'id' => 8,
                    'question' => 'Are donations tax-deductible?',
                    'answer' => 'Yes, donations to DUS are tax-deductible under applicable tax laws. You will receive a receipt for your donation for tax purposes.',
                ]
            ]
        ];

        // Merge shared data with page-specific data
        return Inertia::render('Frontend/About/About', array_merge(
            $this->getSharedData(),
            [
                'bannerData' => $bannerData,
                'visionAndMissionData' => $visionAndMissionData,
                'backgroundData' => $backgroundData,
                'legalData' => $legalData,
                'interventionalData' => $interventionalData,
                'evolutionaryChangesData' => $evolutionaryChangesData,
                'governanceData' => $governanceData,
                'cardsData' => $cardsData,
                'programsData' => $programsData,
                'trainingData' => $trainingData,
                'faqData' => $faqData,
            ]
        ));
    }

    /**
     * Display about details-page dynamically based on slug
     */
    public function aboutDetails(string $slug): Response
    {
        $asset = function ($path) {
            return route('asset', ['path' => ltrim($path, '/')]);
        };

        // Map slugs to the data from the about page
        $subPageData = [
            'vision-mission' => [
                'title' => 'Vision, Mission, Goal, Objectives and Core values',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Vision</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS dreams the existence of a society free from all sorts of exploitation where everyone irrespective of class, creed and cast will enjoy equal rights, freedom and justice leading an equitable and gender balanced communities.</p>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Mission</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">Coastal areas of Bangladesh are regularly stricken by natural disasters. Most of the people living here are almost poor. Due to regular natural disasters occurs here inhabitants are lacking asset and resources and they are deepened in illiterate, malnourished and culturally remain backward. DUS believes that optimizing utilization of hidden humane capacity & power and local resources intensively could gradually alleviate this condition. It perceives to bring down all this scope of development affords in an integrated manner so that sustainable livelihood ventures emerge in the community according to their aspiration.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Initiating, activating, promoting and facilitating the sustainable development of the targeted population through capacity building, resource mobilization, networking, lobbying, need assessment, impact analysis, research, evaluation and policy advocacy in order to ensure and protected equal human rights, freedom, justice in all shape of individual, family and community life in all interventional areas.</p>
                    </div>
                </div>
            '
            ],
            'functions' => [
                'title' => 'Background, Roles and Functions',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Background:</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">The emergence and existence of Dwip Unnayan Songstha (Island Development Association)- DUS was based upon asserting the victims of The Liberation War in 1971 as well as providing immediate relief support to the worse suffer being affected by the devastating cyclone flown over the coastal areas of Bangladesh in 1970.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS, by virtue of its roles, functions and services being visioned and dreamt by the founder and associates, is basically a development and philanthropic organization located at Hatiya Island under Noakhali district in southern Bangladesh. The main focus and concentration of the organization since its inception has been to humanitarian and rehabilitation work for war and cyclone victim affected populations which in the passage of time has turned into integrated socio-economic and sustainable community development services directing towards a just society free from all sorts of exploitation, injustice and deprivation.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Until 1981, DUS has been well-thought-out and recognized as a volunteer initiative for providing aid, relief and rehabilitation related activities and gaining experiences on the said services over last one decade since its inception, the structural based organizational formation took into shape in 1982, announcing its mandate as an association/platform for land development, protection and restoration.</p>
                    </div>
                </div>
            '
            ],
            'legal-affiliations' => [
                'title' => 'Legal Status and Organizational Affiliations',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Legal Status</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS is a registered organization with the Ministry of Social Services & Welfare and NGO Affairs Bureau. The organization operates under the Societies Registration Act and complies with all government regulations for NGOs in Bangladesh.</p>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Organizational Affiliations</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS maintains affiliations with various national and international organizations including PKSF, CUP, ALRD, CGG, BNNRC, and Disaster Forum Bangladesh.</p>
                    </div>
                </div>
            '
            ],
            'interventional-approaches' => [
                'title' => 'Interventional Approaches and DUS Priorities',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Sustainable Poverty Reduction and Human Development:</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">The development interventional unit of GoB is each Household. DUS believes if the member of the HHs are developed then they can play an active role to bring immense changes within their families. As a whole each household take part into the process of socio-economic development of the country.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">This Organization\'s aim to help its member\'s inherent abilities to flourish such a way so that they are endowed with the key to their progress to a sustainable livelihood restoration. With renewed confidence and hope, the poor, then, move ahead and break free from the shackles of multidimensional poverty and indignity and achieve living standards characterized by human freedom and dignity, along with material uplift.</p>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Focus on Landless poor</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS concentrates on the settlement of landless poor families who are victims of major riverbank erosion & affected by several natural disasters like tropical cyclone, salinity, tidal surge etc that are living below poverty line in the coastal district of Bangladesh.</p>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Empowerment of Women</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Over 87% of our target population/beneficiaries are poor women. DUS believes if women are empowered towards right direction, they can play an active role to bring vital changes within their families as well as in the communities.</p>
                    </div>
                </div>
            '
            ],
            'evolutionary-changes' => [
                'title' => 'Evolutionary Changes and Footings',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Year 1972-1985</h2>
                        <ul class="list-disc pl-5 space-y-2 mb-4">
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS was formed by a group of young volunteers and started working for the victims of Bangladesh Liberation War of 1971 and devastating 1970 cyclone affected households at Hatiya Island focusing on humanitarian service to mankind</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Relief and rehabilitation program for the victims and initiate disaster management program at local level</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Rehabilitation of 2000 landless river bank eroded farmers in the newly accreted Govt. Khash land</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS turn into an organizational shape and named as Dwip Unnayan Sangstha in 1982</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Community Mobilization and revolving credit support to community started in 1984</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Registered with Ministry of Social Services &amp; Welfare.</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Registered with NGO Affairs Bureau.</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Socio-economic development programs for the poor initiative from 1985</li>
                        </ul>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Year 1986-2000</h2>
                        <ul class="list-disc pl-5 space-y-2">
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Strengthening Local Govt. bodies through capacity building in good governance, accountancy and resource management supported by IVS/ USAID</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Capacity building of Union Parishad and Upazila Parishad for effective disaster management in four coastal district of Bangladesh supported by CARE-Bangladesh &amp; USAID</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Island fisheries development project implementation supported by DFID.</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Disaster rehabilitation support project implementation supported by AusAid/Oxfam-America/Oxfam-UK, Oxfam-Hong Kong British ODA</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Cyclone shelter Construction supported by CAA Australia</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Housing support for poor supported by British ODA/CARE-Bangladesh/AusAid</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Livestock development for poor supported by DANIDA, CIDA</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Integrated Socio-economic development program supported by Oxfam-UK</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Emergency Relief and Rehabilitation for Cyclone in coastal islands supported by Oxfam-UK, British ODA, CARE-Bangladesh</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Livelihood Rehabilitation for Flood Affected Fisheries Households in Hatiya Island supported by DFID</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Flood 98 Rehabilitation program supported by DFID, Oxfam-GB</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'governance' => [
                'title' => 'Governance Structure',
                'content' => '
                <div class="space-y-6">
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS believes in democratic practice and public-private participation to achieve its goal, purpose and objectives and accordingly the internal management system has been framed comprising the following structures:</p>
                    
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">General Body</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">The General Body consists of 31 members who are the permanent resident of the coastal community. Of them 30% are women. The social and professional status of the members include teachers, lawyers, social workers, freedom fighters and community leaders.</p>
                    </div>
                    
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Executive Committee</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">DUS has an Executive Committee of 7 members duly elected by the General Body for a period of three years. DUS is represented by its Executive Director who is the Member Secretary of the Executive Committee. ED and his core staff members are appointed by the board. Executive Director is treated as the Chief Executive of the organization. The Executive Director is the overall authority to implement the projects and programs on behalf of the Executive Committee.</p>
                    </div>
                </div>
            '
            ],
            'operational-areas' => [
                'title' => 'Operational Areas of DUS',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-6">DUS primarily operates in the coastal regions of Bangladesh, with a focus on Hatiya Island and surrounding areas in Noakhali district. Our operations extend to various Upazilas including:</p>
                        <ul class="list-disc pl-6 space-y-3 mb-8">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Hatiya Upazila</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Subarnachar Upazila</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Companyganj Upazila</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Noakhali Sadar</li>
                        </ul>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">We work in over 50 villages, reaching more than 40,000 households through our various programs and interventions.</p>
                    </div>
                </div>
            '
            ],
            'achievements' => [
                'title' => 'Our Achievements',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-6">Over the years, DUS has achieved significant milestones in community development:</p>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Successfully provided micro-credit to over 40,000+ group members</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Empowered 97% female beneficiaries through financial inclusion</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Established Community Radio for coastal communities</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Implemented climate adaptation programs in disaster-prone areas</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Provided WATSAN services to thousands of households</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Received recognition from government and international partners</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'programs-activities' => [
                'title' => 'Programs & Activities',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Micro-Finance Program</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with Palli Karma Sahayak Foundation (PKSF) since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female. Under this program, DUS has savings scheme for poor women who has no access in mainstream banks due to lack of capital and assets.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Most of the targeted beneficiaries of DUS are poor women, marginal farmers and small micro entrepreneurs. Major borrowers are women who used these loan funds to promote various income generating activities for their earnings and employments. As a result, micro finance program has positive impact on poverty reduction especially at grass rote level, income enhancement, consumption, the promotion of rural businesses, education and health and finally the empowerment of women and their employment in rural island communities.</p>
                    </div>
                    <div>
                        <h2 class="font-700 text-xl sm:text-2xl mb-4 text-[#080C14]">Jagoron</h2>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">Jagoron is the name of a credit instrument of PKSF to initiate household based enterprise development in Bangladesh. As a Partner Organization of PKSF, DUS is implementing this program which is now comprised with Rural Micro finance and Urban Micro finance. Rural Micro finance is that types of loan which allows rural women to finance their small scale agriculture production at homestead level.</p>
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">RMC Loans are allowed as working capital loans to promote poor and disadvantaged households in income earnings. RMC loan range from 10K to 59K to allowed for one year and service charge is 24% (Reducing Balancing Method)/12.0% (Flat Rate Method) per year. The weekly savings of RMC members are 10/= per week.</p>
                    </div>
                </div>
            '
            ],
            'facilities' => [
                'title' => 'Training and Other Facilities',
                'content' => '
                <div class="space-y-6">
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS believes that training is a key element of the development approach which focuses on people and their participation. Training has been introduced as an essential element of DUS\'s intervention strategy.</p>
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS takes up need based training programs, prepares module and training curriculum. The training programs generally involve flip chart, posters, handouts, cards &amp; charts, audiocassettes, videocassettes, original model, curriculum, modules, photographs etc. DUS has already developed a training and communication Unit fully equipped with all possible physical and human resources. DUS is organized different type of training since last two decades:</p>
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS is organized different type of training for its staffs as well as beneficiaries. DUS always prepare its yearly training plan which is incorporated basic skill development training for staffs, MIS, ToT general, Branch management and Finance management etc.</p>
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4">DUS conducts it\'s skill development training through identification of people who need skill training. This is done by conducting survey to identify marketable skills, developing modules of livelihood skills program, conducting training to the selected people, select graduates of the skill program to receive capital, linking other graduates to employment or credit program, following up the graduates to see whether they are able to achieve sustainable livelihood. The skills training programs include tree nursery management, sustainable agriculture, poultry and cattle rearing etc.</p>
                    <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug">Leadership development training is a very important intervention of DUS. Leadership development training is intended for the group members under different project interventions. The training programs focus financial management of community fund, conflict management, and bottom-up planning for sustainable rural livelihoods.</p>
                </div>
            '
            ]
        ];

        // Check if the slug exists
        if (!isset($subPageData[$slug])) {
            abort(404, 'Page not found');
        }

        $pageData = $subPageData[$slug];

        // Banner Data for sub-page
        $bannerData = [
            'background' => [
                'src' => $asset('OurPrograms/db1b2b6eae5fc260b4204f8257dadbd5a7aa0af7.png'),
                'alt' => 'Background'
            ],
            'overlay' => [
                'darkOverlay' => 'bg-black/40 lg:bg-black/50',
                'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
            ],
            'content' => [
                'title' => [
                    'text' => $pageData['title'],
                    'className' => 'font-bold leading-tight'
                ],
            ],
        ];

        // FAQ Data
        $faqData = [
            'section' => [
                'title' => 'Key Questions Answered About Our Us',
                'subtitle' => 'Explore our Frequently Asked Questions for answers about our charity\'s mission, projects, and how to help.'
            ],
            'faqs' => [
                [
                    'id' => 1,
                    'question' => 'What is the mission of your charity?',
                    'answer' => 'Any company that is using spreadsheets and emails to manage the people side of their business is wasting time on admin and making life more difficult for themselves. A well-designed HR system like PiHR automates menial tasks allowing business owners to focus on the strategic work of growing the business. It improves the recruitment process, enriches payroll management, provides real-time feedback, improves employees, improves data security, helps make decisions.',
                ],
                [
                    'id' => 2,
                    'question' => 'Who benefits from your programs?',
                    'answer' => 'Our programs benefit underprivileged communities, women and children, disaster-affected families, and landless poor in coastal areas of Bangladesh.',
                ],
                [
                    'id' => 3,
                    'question' => 'Can I make a recurring donation?',
                    'answer' => 'Yes, you can make recurring donations monthly, quarterly, or annually. Visit our donation page to set up your recurring contribution.',
                ],
                [
                    'id' => 4,
                    'question' => 'Can I visit the projects I support?',
                    'answer' => 'Yes, we welcome donors to visit our project sites. Please contact our office in advance to arrange a visit and meet the communities you are supporting.',
                ],
                [
                    'id' => 5,
                    'question' => 'How can I get involved?',
                    'answer' => 'You can get involved by donating, volunteering, sponsoring a child, or becoming a community ambassador. Visit our "Get Involved" page for more details.',
                ],
                [
                    'id' => 6,
                    'question' => 'How can I make a donation?',
                    'answer' => 'You can make a donation online through our secure payment portal, bank transfer, or by visiting our office. We accept one-time and recurring donations.',
                ],
                [
                    'id' => 7,
                    'question' => 'How do you maintain accountability?',
                    'answer' => 'We maintain transparency through regular audits, annual reports, community feedback mechanisms, and public disclosure of our financial statements.',
                ],
                [
                    'id' => 8,
                    'question' => 'Are donations tax-deductible?',
                    'answer' => 'Yes, donations to DUS are tax-deductible under applicable tax laws. You will receive a receipt for your donation for tax purposes.',
                ]
            ]
        ];

        // Upcoming Events Data
        $upcomingEventsData = [
            'section' => [
                'title' => 'Upcoming Events & Community Actions',
                'description' => 'Read real stories from the field, community experiences, and thought-provoking perspectives that reflect our mission and impact.',
                'button' => [
                    'text' => 'Explore All Events',
                    'link' => '/events'
                ]
            ],
            'image' => [
                'src' => $asset('UpcomingEvent/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp'),
                'alt' => 'Events Image',
                'className' => 'mt-15 rounded-2xl h-139.25 w-auto'
            ],
            'events' => [
                [
                    'id' => 1,
                    'date' => [
                        'day' => '25',
                        'month' => 'Apr',
                        'weekday' => 'THU',
                        'dayNumber' => '1',
                        'time' => '10:30AM'
                    ],
                    'location' => 'International Convention City Bashundhara - ICCB',
                    'title' => 'Participate in our community clean-up day and make a difference together',
                    'description' => 'Let\'s shape the future of the food industry together! Participate at the 9th Food Bangladesh Int\'l Expo 2026,',
                    'link' => '/events/community-cleanup'
                ],
                [
                    'id' => 2,
                    'date' => [
                        'day' => '28',
                        'month' => 'Apr',
                        'weekday' => 'SUN',
                        'dayNumber' => '2',
                        'time' => '02:00PM'
                    ],
                    'location' => 'Dhaka University Campus - Dhaka',
                    'title' => 'Education for All: Scholarship Distribution Ceremony',
                    'description' => 'Join us as we distribute scholarships to underprivileged students and celebrate their achievements in pursuing quality education.',
                    'link' => '/events/scholarship-ceremony'
                ],
                [
                    'id' => 3,
                    'date' => [
                        'day' => '05',
                        'month' => 'May',
                        'weekday' => 'MON',
                        'dayNumber' => '3',
                        'time' => '09:00AM'
                    ],
                    'location' => 'Hatiya Island Community Center - Noakhali',
                    'title' => 'Climate Adaptation Workshop for Coastal Communities',
                    'description' => 'Learn sustainable farming techniques and disaster preparedness strategies to combat climate change impacts in coastal areas.',
                    'link' => '/events/climate-workshop'
                ]
            ]
        ];

        // Merge shared data with page-specific data
        return Inertia::render('Frontend/AboutDetails/AboutDetails', array_merge(
            $this->getSharedData(),
            [
                'slug' => $slug,
                'faqData' => $faqData,
                'subPageData' => $pageData,
                'bannerData' => $bannerData,
                'upcomingEventsData' => $upcomingEventsData,
            ]
        ));
    }

    /**
     * Display the projects & programs page
     */
    public function projectsPrograms(): Response
    {
        $asset = function ($path) {
            return route('asset', ['path' => ltrim($path, '/')]);
        };

        // Banner Data for sub-page
        $bannerData = [
            'background' => [
                'src' => 'https://placehold.co/1920x589',
                'alt' => 'Background'
            ],
            'overlay' => [
                'darkOverlay' => 'bg-black/40 lg:bg-black/50',
                'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
            ],
            'content' => [
                'title' => [
                    'text' => 'Meet Our Charity Projects',
                    'className' => 'font-bold leading-tight'
                ],
            ],
        ];

        // Our Programs Data with HTML descriptions
        $ourProgramsData = [
            'programs' => [
                [
                    'id' => 1,
                    'title' => 'Micro-Finance <br /> Program',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with <strong class="text-[#009BE2]">Palli Karma Sahayak Foundation (PKSF)</strong> since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Under this program, DUS has savings scheme for poor women who has no access in mainstream banks due to lack of capital and assets. Most of the targeted beneficiaries of DUS are poor women, marginal farmers and small micro entrepreneurs.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Major borrowers are women who used these loan funds to promote various income generating activities for their earnings and employments. As a result, micro finance program has positive impact on poverty reduction especially at grass root level, income enhancement, consumption, the promotion of rural businesses, education and health and finally the empowerment of women and their employment in rural island communities.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Key Achievements:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">40,000+ active group members</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">97% female beneficiaries</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Over 95% loan recovery rate</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Operating in 50+ villages</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/945e2496664a40b12a1cddd6561e954cdc78e255.webp'),
                    'bgColor' => 'bg-[#E6F3E7]',
                    'link' => '/projects-programs/micro-finance'
                ],
                [
                    'id' => 2,
                    'title' => 'Climate Change and <br /> Disaster Management Program',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">DUS is geographically located at very exposed disaster risk area of Coastal Bangladesh, most of its beneficiaries as well as core staffs of the organization and volunteers including general members are experienced by the influence of topography & living experience with the community, to cope with and face any natural disaster.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Further during its lifetime DUS was active in major emergency in relief and rehabilitation programs following Nov. 1970 cyclone relief, 1988/1991-cyclone recovery, 1998 flood response, SIDR 2007 etc.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">DUS is now moving beyond relief and rehabilitation into <strong class="text-[#009BE2]">institutionalized preparedness, risk reduction and management interventions</strong> as well as long term adaptation strategies as consequence of lessons learnt while helping communities cope with the devastating effects of Cyclone SIDR, which struck in November 2007.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Program Components:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Early warning systems and community preparedness</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Cyclone shelter management and maintenance</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Climate-resilient agriculture practices</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Post-disaster livelihood restoration</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Coastal afforestation and mangrove protection</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/a03fa6dba9fcdac0a5aedf2d337b118228a03298.webp'),
                    'bgColor' => 'bg-[#F3EDE6]',
                    'link' => '/projects-programs/climate-change'
                ],
                [
                    'id' => 3,
                    'title' => 'Community Radio <br /> Program',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Strengthening Hatiya Island community for pioneering-connecting and empowering their Voice for Change. Bangladesh Government has already acknowledged the importance of community radio and announced the Community Radio Installation, Broadcast & Operation Policy.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Bangladesh is the <strong class="text-[#009BE2]">2nd country in South Asia</strong> in formulating policy for Community Radio. This initiative gives voice to the voiceless and empowers local communities to share their stories, concerns, and aspirations.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">The community radio serves as a platform for:</p>
                        
                        <ul class="list-disc pl-5 space-y-2 mt-2">
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Disseminating agricultural information and weather updates</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Health awareness and educational programs</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Local news and community announcements</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Women empowerment and youth engagement shows</li>
                            <li class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Cultural preservation and local talent promotion</li>
                        </ul>
                    </div>
                ',
                    'image' => $asset('OurPrograms/e280b627b1771904c38022aac2566b932e248887.webp'),
                    'bgColor' => 'bg-[#E8E6F3]',
                    'link' => '/projects-programs/community-radio'
                ],
                [
                    'id' => 4,
                    'title' => 'DWIP Education <br /> Program',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Education is the most powerful tool to break the cycle of poverty. DUS\'s Education Program focuses on providing <strong class="text-[#009BE2]">quality education to underprivileged children</strong> in coastal communities.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">The program includes formal education support, non-formal primary education for out-of-school children, scholarships for meritorious students, and adult literacy classes for women.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Key Interventions:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Scholarship programs for 500+ students annually</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">School infrastructure development in remote areas</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Teacher training and capacity building</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Distribution of educational materials and supplies</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Digital learning centers for rural students</li>
                            </ul>
                        </div>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed mt-3"><strong class="text-[#080C14]">Impact:</strong> Over 10,000 children have benefited from our education programs, with a 85% retention rate and significant improvement in learning outcomes.</p>
                    </div>
                ',
                    'image' => $asset('OurPrograms/42ccde89743ee9405c6546567e02dfbb36759866.jpg'),
                    'bgColor' => 'bg-[#EEF3E6]',
                    'link' => '/projects-programs/dwip-education'
                ],
                [
                    'id' => 5,
                    'title' => 'Information and Communication <br /> Technology (ICT)',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Bridging the digital divide in coastal communities through <strong class="text-[#009BE2]">ICT for Development (ICT4D)</strong> initiatives. This program aims to empower communities with digital literacy and access to technology.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">We establish community ICT centers, provide computer training, and facilitate access to online resources, government services, and digital financial inclusion.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Program Highlights:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">15 community ICT centers established</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Digital literacy training for 5,000+ women</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Mobile banking and digital payment solutions</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Online skill development courses</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Telemedicine and e-health services</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/41146cd8c06fe1e0af97901abf7120a065421b19.jpg'),
                    'bgColor' => 'bg-[#E6F3F1]',
                    'link' => '/projects-programs/information-and-communication-technology'
                ],
                [
                    'id' => 6,
                    'title' => 'Research and <br /> Documentation',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">DUS has a strong <strong class="text-[#009BE2]">Research and Documentation Cell</strong> to conduct quality research in diverse areas of human and social development sectors, covering most importantly education, health, livelihood development, environment, human rights and social justice.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">The R&D cell works as a professional support services unit to fulfill the growing demand for generation and systematic analysis of information in connection with the increasing involvement of DUS in its development activities.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Thus it engages in survey and research activities addressing the in-house needs of the organization for exploring and examining the feasible approaches for development, planning, designing, piloting, assessing and improving the implementation and performance of a wide range of projects, and determining the best practices and models of socio-economic interventions.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Research Areas:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Baseline surveys and needs assessments</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Impact evaluation studies</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Action research on poverty reduction</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Documentation of best practices and case studies</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Policy briefs and advocacy materials</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/a496922a3fc00992b6c454822d60bde51dc001e5.webp'),
                    'bgColor' => 'bg-[#F3E6EA]',
                    'link' => '/projects-programs/research-and-documentation'
                ],
                [
                    'id' => 7,
                    'title' => 'Livelihood Restoration <br /> Project',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">This project focuses on restoring and enhancing livelihood opportunities for communities affected by natural disasters and economic vulnerabilities.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">We provide <strong class="text-[#009BE2]">vocational training, asset transfer, and enterprise development support</strong> to help families rebuild their lives and achieve sustainable income sources.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Livelihood Options:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Small business development and entrepreneurship</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Agricultural diversification and improved farming</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Livestock rearing and poultry farming</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Fisheries and aquaculture development</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Handicrafts and small-scale manufacturing</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/1b7d77f85b29f0b12d98e2a09ddc1d734c6f6ea1.jpg'),
                    'bgColor' => 'bg-[#E6ECF3]',
                    'link' => '/projects-programs/livelihood-restoration-project'
                ],
                [
                    'id' => 8,
                    'title' => 'Group Member Insurance/ <br /> Savings Scheme',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">A comprehensive social protection mechanism for our group members, combining <strong class="text-[#009BE2]">savings and insurance</strong> to provide financial security and risk coverage.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">The scheme encourages regular savings habits while providing life insurance coverage, health benefits, and emergency support for member families during crises.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Benefits:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Life insurance coverage up to BDT 50,000</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Health and accident benefits</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Emergency loan facilities from savings</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Children\'s education support</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Old age security and retirement benefits</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/21f2ed036293018aac5b8d98c97bc26201e92f68.jpg'),
                    'bgColor' => 'bg-[#F3E6F1]',
                    'link' => '/projects-programs/group-member-insurance-savings-scheme'
                ],
                [
                    'id' => 9,
                    'title' => 'Social Development <br /> Program',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Addressing social issues and promoting inclusive development through community mobilization and awareness programs.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">The program focuses on <strong class="text-[#009BE2]">social justice, gender equality, child protection, and community empowerment</strong> to create a more equitable society.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Focus Areas:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Women empowerment and leadership development</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Child rights and protection committees</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Prevention of child marriage and dowry</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Community-led social audits and accountability</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Disability-inclusive development initiatives</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/a00b43d1f3ee0f568f2e058ee39101be8911c1a0.jpg'),
                    'bgColor' => 'bg-[#F3E6EA]',
                    'link' => '/projects-programs/social-development-program'
                ],
                [
                    'id' => 10,
                    'title' => 'Legal and <br /> Human Rights',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Promoting <strong class="text-[#009BE2]">access to justice and human rights protection</strong> for marginalized communities through legal aid, awareness, and advocacy.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">We provide free legal counseling, support for victims of human rights violations, and conduct workshops on legal rights and entitlements.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Services:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Free legal aid and counseling clinics</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Human rights awareness campaigns</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Support for victims of violence and discrimination</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Land rights and property dispute resolution</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Paralegal training for community volunteers</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/1c54b2045a0958af86f3c81624c73f0b8e23b6f7.jpg'),
                    'bgColor' => 'bg-[#E6F1F3]',
                    'link' => '/projects-programs/legal-and-human-rights'
                ],
                [
                    'id' => 11,
                    'title' => 'WATSAN <br /> Program',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Building on its long experience of providing water and sanitation services to communities, DUS started its <strong class="text-[#009BE2]">Water and Sanitation program</strong> with the financial and technical support of the Netherland Govt.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">The program is implementing in Nangolia Char and Nalerchar under Hatiya Upazilla. Our goal is to provide sustainable and integrated WATSAN services in the rural areas.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">We break the contamination cycle of unsanitary latrines, contaminated water and unsafe hygiene practices, as well as ensure sustainability and scaling-up of WATSAN services.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Targets:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">4,605 households with sanitation access</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">250 deep tube wells for safe water</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">20,000 people with hygiene education</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Community-led total sanitation approaches</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">School WASH facilities and hygiene promotion</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/42d5b669fc99984337547c6028cb9251bc1b306d.jpg'),
                    'bgColor' => 'bg-[#F2F3E6]',
                    'link' => '/projects-programs/watsan-program'
                ],
                [
                    'id' => 12,
                    'title' => 'Training & <br /> Other Facilities',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">DUS has developed a comprehensive <strong class="text-[#009BE2]">Training and Communication Unit</strong> fully equipped with all possible physical and human resources to deliver high-quality capacity building programs.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">We offer need-based training programs, develop modules and curriculum, and utilize modern training methodologies including participatory approaches, audio-visual aids, and practical demonstrations.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Training Offerings:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Skill development and vocational training</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Leadership and management training</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Financial literacy and business management</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">ToT (Training of Trainers) programs</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">MIS and data management training</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/be14c45848898048e7b7832affc4dc713b032e10.webp'),
                    'bgColor' => 'bg-[#E6EDF3]',
                    'link' => '/projects-programs/training-and-other-facilities'
                ],
                [
                    'id' => 13,
                    'title' => 'Tourism & <br /> Hospitality',
                    'description' => '
                    <div class="space-y-4">
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">Promoting <strong class="text-[#009BE2]">sustainable tourism and hospitality</strong> as an emerging livelihood opportunity for coastal communities, leveraging the natural beauty and cultural heritage of Hatiya Island.</p>
                        
                        <p class="font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#524B48] leading-relaxed">This initiative focuses on developing community-based tourism, eco-tourism, and hospitality services that create employment while preserving local culture and environment.</p>
                        
                        <div class="bg-white/50 rounded-lg p-4 mt-4">
                            <h4 class="font-600 text-[18px] sm:text-[20px] text-[#080C14] mb-2">Initiatives:</h4>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Homestay and community guesthouse development</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Tour guide training and certification</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Handicraft and souvenir production</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Local cuisine and food service training</li>
                                <li class="text-[14px] sm:text-[16px] text-[#524B48]">Eco-tourism and nature conservation awareness</li>
                            </ul>
                        </div>
                    </div>
                ',
                    'image' => $asset('OurPrograms/83260e25460beb43cd8a9c084bb311328e8f24d7.jpg'),
                    'bgColor' => 'bg-[#EAE6F3]',
                    'link' => '/projects-programs/tourism-and-hospitality'
                ],
            ]
        ];

        // FAQ Data
        $faqData = [
            'section' => [
                'title' => 'Key Questions Answered About Our Programs',
                'subtitle' => 'Explore our Frequently Asked Questions for answers about our charity\'s projects, programs, and how you can get involved.'
            ],
            'faqs' => [
                [
                    'id' => 1,
                    'question' => 'How can I participate in your programs?',
                    'answer' => 'You can participate by becoming a volunteer, donor, or partner organization. Visit our "Get Involved" page or contact our office directly to learn about current opportunities.',
                ],
                [
                    'id' => 2,
                    'question' => 'Who is eligible for micro-finance support?',
                    'answer' => 'Our micro-finance program primarily serves poor women, marginal farmers, and small micro-entrepreneurs in coastal communities. Priority is given to landless households and disaster-affected families.',
                ],
                [
                    'id' => 3,
                    'question' => 'How do you ensure program sustainability?',
                    'answer' => 'We ensure sustainability through community ownership, capacity building, income generation mechanisms, and partnerships with local government and development organizations.',
                ],
                [
                    'id' => 4,
                    'question' => 'Can international donors support your programs?',
                    'answer' => 'Yes, we welcome international support. DUS is registered with the NGO Affairs Bureau and can receive foreign donations. Contact us for partnership opportunities.',
                ],
                [
                    'id' => 5,
                    'question' => 'How do you measure program impact?',
                    'answer' => 'We conduct regular monitoring, baseline and end-line surveys, impact assessments, and participatory evaluations involving community members to measure our program effectiveness.',
                ],
                [
                    'id' => 6,
                    'question' => 'What geographical areas do you cover?',
                    'answer' => 'Our primary focus is Hatiya Island and surrounding coastal areas in Noakhali district, including Subarnachar, Companyganj, and Noakhali Sadar Upazilas.',
                ],
                [
                    'id' => 7,
                    'question' => 'How can I volunteer with DUS?',
                    'answer' => 'You can apply through our website\'s volunteer section, attend our orientation sessions, or contact our HR department. We welcome both local and international volunteers.',
                ],
                [
                    'id' => 8,
                    'question' => 'Are your financial reports publicly available?',
                    'answer' => 'Yes, we maintain transparency by publishing annual reports, audit statements, and financial summaries on our website and making them available to stakeholders upon request.',
                ]
            ]
        ];

        // Merge shared data with page-specific data
        return Inertia::render('Frontend/ProjectsAndPrograms/ProjectsAndPrograms', array_merge(
            $this->getSharedData(),
            [
                'faqData' => $faqData,
                'bannerData' => $bannerData,
                'ourProgramsData' => $ourProgramsData,
            ]
        ));
    }

    /**
     * Display projects & programs details-page dynamically based on slug
     */
    public function projectsProgramsDetails(string $slug): Response
    {
        $asset = function ($path) {
            return route('asset', ['path' => ltrim($path, '/')]);
        };

        // Define all programs data with their details
        $programsData = [
            'micro-finance' => [
                'title' => 'Micro-Finance Program',
                'breadcrumb' => 'Micro-Finance Program',
                'image' => $asset('OurPrograms/945e2496664a40b12a1cddd6561e954cdc78e255.webp'),
                'bgColor' => 'bg-[#E6F3E7]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with <strong class="text-[#009BE2]">Palli Karma Sahayak Foundation (PKSF)</strong> since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Under this program, DUS has savings scheme for poor women who has no access in mainstream banks due to lack of capital and assets. Most of the targeted beneficiaries of DUS are poor women, marginal farmers and small micro entrepreneurs.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Major borrowers are women who used these loan funds to promote various income generating activities for their earnings and employments. As a result, micro finance program has positive impact on poverty reduction especially at grass root level, income enhancement, consumption, the promotion of rural businesses, education and health and finally the empowerment of women and their employment in rural island communities.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Key Achievements</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">40,000+ active group members</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">97% female beneficiaries</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Over 95% loan recovery rate</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Operating in 50+ villages</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">BDT 50+ crore distributed in loans</li>
                        </ul>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Impact on Community</h2>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">The micro-finance program has significantly contributed to poverty reduction, women empowerment, and economic development in coastal communities. Many women have started their own businesses, improved their housing conditions, and are now able to send their children to school.</p>
                    </div>
                </div>
            '
            ],
            'climate-change' => [
                'title' => 'Climate Change and Disaster Management Program',
                'breadcrumb' => 'Climate Change & Disaster Management',
                'image' => $asset('OurPrograms/a03fa6dba9fcdac0a5aedf2d337b118228a03298.webp'),
                'bgColor' => 'bg-[#F3EDE6]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">DUS is geographically located at very exposed disaster risk area of Coastal Bangladesh, most of its beneficiaries as well as core staffs of the organization and volunteers including general members are experienced by the influence of topography & living experience with the community, to cope with and face any natural disaster.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Further during its lifetime DUS was active in major emergency in relief and rehabilitation programs following Nov. 1970 cyclone relief, 1988/1991-cyclone recovery, 1998 flood response, SIDR 2007 etc.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">DUS is now moving beyond relief and rehabilitation into <strong class="text-[#009BE2]">institutionalized preparedness, risk reduction and management interventions</strong> as well as long term adaptation strategies as consequence of lessons learnt while helping communities cope with the devastating effects of Cyclone SIDR, which struck in November 2007.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Program Components</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Early warning systems and community preparedness</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Cyclone shelter management and maintenance</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Climate-resilient agriculture practices</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Post-disaster livelihood restoration</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Coastal afforestation and mangrove protection</li>
                        </ul>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Our Response History</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">1970 Cyclone Relief</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">1988 Flood Response</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">1991 Cyclone Recovery</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">1998 Flood Response</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">2007 Cyclone SIDR Response</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'community-radio' => [
                'title' => 'Community Radio Program',
                'breadcrumb' => 'Community Radio',
                'image' => $asset('OurPrograms/e280b627b1771904c38022aac2566b932e248887.webp'),
                'bgColor' => 'bg-[#E8E6F3]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Strengthening Hatiya Island community for pioneering-connecting and empowering their Voice for Change. Bangladesh Government has already acknowledged the importance of community radio and announced the Community Radio Installation, Broadcast & Operation Policy.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Bangladesh is the <strong class="text-[#009BE2]">2nd country in South Asia</strong> in formulating policy for Community Radio. This initiative gives voice to the voiceless and empowers local communities to share their stories, concerns, and aspirations.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Broadcast Content</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Agricultural information and weather updates</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Health awareness and educational programs</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Local news and community announcements</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Women empowerment and youth engagement shows</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Cultural preservation and local talent promotion</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Disaster preparedness and emergency broadcasts</li>
                        </ul>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Community Impact</h2>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">The community radio has become a vital source of information and entertainment for thousands of island residents. It has empowered local voices, preserved cultural heritage, and provided critical information during emergencies.</p>
                    </div>
                </div>
            '
            ],
            'dwip-education' => [
                'title' => 'DWIP Education Program',
                'breadcrumb' => 'Education Program',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#EEF3E6]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Education is the most powerful tool to break the cycle of poverty. DUS\'s Education Program focuses on providing <strong class="text-[#009BE2]">quality education to underprivileged children</strong> in coastal communities.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">The program includes formal education support, non-formal primary education for out-of-school children, scholarships for meritorious students, and adult literacy classes for women.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Key Interventions</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Scholarship programs for 500+ students annually</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">School infrastructure development in remote areas</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Teacher training and capacity building</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Distribution of educational materials and supplies</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Digital learning centers for rural students</li>
                        </ul>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Impact</h2>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Over 10,000 children have benefited from our education programs, with an 85% retention rate and significant improvement in learning outcomes. Many scholarship recipients have gone on to higher education and successful careers.</p>
                    </div>
                </div>
            '
            ],
            'information-and-communication-technology' => [
                'title' => 'Information and Communication Technology (ICT)',
                'breadcrumb' => 'ICT Program',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#E6F3F1]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Bridging the digital divide in coastal communities through <strong class="text-[#009BE2]">ICT for Development (ICT4D)</strong> initiatives. This program aims to empower communities with digital literacy and access to technology.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">We establish community ICT centers, provide computer training, and facilitate access to online resources, government services, and digital financial inclusion.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Program Highlights</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">15 community ICT centers established</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Digital literacy training for 5,000+ women</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Mobile banking and digital payment solutions</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Online skill development courses</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Telemedicine and e-health services</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'research-and-documentation' => [
                'title' => 'Research and Documentation',
                'breadcrumb' => 'Research & Documentation',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#F3E6EA]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">DUS has a strong <strong class="text-[#009BE2]">Research and Documentation Cell</strong> to conduct quality research in diverse areas of human and social development sectors, covering most importantly education, health, livelihood development, environment, human rights and social justice.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">The R&D cell works as a professional support services unit to fulfill the growing demand for generation and systematic analysis of information in connection with the increasing involvement of DUS in its development activities.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Thus it engages in survey and research activities addressing the in-house needs of the organization for exploring and examining the feasible approaches for development, planning, designing, piloting, assessing and improving the implementation and performance of a wide range of projects.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Research Areas</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Baseline surveys and needs assessments</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Impact evaluation studies</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Action research on poverty reduction</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Documentation of best practices and case studies</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Policy briefs and advocacy materials</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'livelihood-restoration-project' => [
                'title' => 'Livelihood Restoration Project',
                'breadcrumb' => 'Livelihood Restoration',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#E6ECF3]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">This project focuses on restoring and enhancing livelihood opportunities for communities affected by natural disasters and economic vulnerabilities.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">We provide <strong class="text-[#009BE2]">vocational training, asset transfer, and enterprise development support</strong> to help families rebuild their lives and achieve sustainable income sources.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Livelihood Options</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Small business development and entrepreneurship</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Agricultural diversification and improved farming</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Livestock rearing and poultry farming</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Fisheries and aquaculture development</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Handicrafts and small-scale manufacturing</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'group-member-insurance-savings-scheme' => [
                'title' => 'Group Member Insurance & Savings Scheme',
                'breadcrumb' => 'Insurance & Savings Scheme',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#F3E6F1]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">A comprehensive social protection mechanism for our group members, combining <strong class="text-[#009BE2]">savings and insurance</strong> to provide financial security and risk coverage.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">The scheme encourages regular savings habits while providing life insurance coverage, health benefits, and emergency support for member families during crises.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Benefits</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Life insurance coverage up to BDT 50,000</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Health and accident benefits</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Emergency loan facilities from savings</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Children\'s education support</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Old age security and retirement benefits</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'social-development-program' => [
                'title' => 'Social Development Program',
                'breadcrumb' => 'Social Development',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#F3E6EA]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Addressing social issues and promoting inclusive development through community mobilization and awareness programs.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">The program focuses on <strong class="text-[#009BE2]">social justice, gender equality, child protection, and community empowerment</strong> to create a more equitable society.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Focus Areas</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Women empowerment and leadership development</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Child rights and protection committees</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Prevention of child marriage and dowry</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Community-led social audits and accountability</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Disability-inclusive development initiatives</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'legal-and-human-rights' => [
                'title' => 'Legal and Human Rights',
                'breadcrumb' => 'Legal & Human Rights',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#E6F1F3]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Promoting <strong class="text-[#009BE2]">access to justice and human rights protection</strong> for marginalized communities through legal aid, awareness, and advocacy.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">We provide free legal counseling, support for victims of human rights violations, and conduct workshops on legal rights and entitlements.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Services</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Free legal aid and counseling clinics</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Human rights awareness campaigns</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Support for victims of violence and discrimination</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Land rights and property dispute resolution</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Paralegal training for community volunteers</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'watsan-program' => [
                'title' => 'WATSAN Program',
                'breadcrumb' => 'Water & Sanitation',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#F2F3E6]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Building on its long experience of providing water and sanitation services to communities, DUS started its <strong class="text-[#009BE2]">Water and Sanitation program</strong> with the financial and technical support of the Netherland Government.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">The program is implementing in Nangolia Char and Nalerchar under Hatiya Upazilla. Our goal is to provide sustainable and integrated WATSAN services in the rural areas.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">We break the contamination cycle of unsanitary latrines, contaminated water and unsafe hygiene practices, as well as ensure sustainability and scaling-up of WATSAN services.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Targets</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">4,605 households with sanitation access</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">250 deep tube wells for safe water</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">20,000 people with hygiene education</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Community-led total sanitation approaches</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">School WASH facilities and hygiene promotion</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'training-and-other-facilities' => [
                'title' => 'Training and Other Facilities',
                'breadcrumb' => 'Training Facilities',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#E6EDF3]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">DUS has developed a comprehensive <strong class="text-[#009BE2]">Training and Communication Unit</strong> fully equipped with all possible physical and human resources to deliver high-quality capacity building programs.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">We offer need-based training programs, develop modules and curriculum, and utilize modern training methodologies including participatory approaches, audio-visual aids, and practical demonstrations.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Training Offerings</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Skill development and vocational training</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Leadership and management training</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Financial literacy and business management</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">ToT (Training of Trainers) programs</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">MIS and data management training</li>
                        </ul>
                    </div>
                </div>
            '
            ],
            'tourism-and-hospitality' => [
                'title' => 'Tourism and Hospitality',
                'breadcrumb' => 'Tourism & Hospitality',
                'image' => 'https://placehold.co/700x500',
                'bgColor' => 'bg-[#EAE6F3]',
                'content' => '
                <div class="space-y-6">
                    <div>
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Promoting <strong class="text-[#009BE2]">sustainable tourism and hospitality</strong> as an emerging livelihood opportunity for coastal communities, leveraging the natural beauty and cultural heritage of Hatiya Island.</p>
                        
                        <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">This initiative focuses on developing community-based tourism, eco-tourism, and hospitality services that create employment while preserving local culture and environment.</p>
                        
                        <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Initiatives</h2>
                        <ul class="list-disc pl-6 space-y-3">
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Homestay and community guesthouse development</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Tour guide training and certification</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Handicraft and souvenir production</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Local cuisine and food service training</li>
                            <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Eco-tourism and nature conservation awareness</li>
                        </ul>
                    </div>
                </div>
            '
            ]
        ];

        // Check if the slug exists
        if (!isset($programsData[$slug])) {
            abort(404, 'Program not found');
        }

        $programData = $programsData[$slug];

        // Banner Data for sub-page
        $bannerData = [
            'background' => [
                'src' => $asset('OurPrograms/db1b2b6eae5fc260b4204f8257dadbd5a7aa0af7.png'),
                'alt' => 'Background'
            ],
            'overlay' => [
                'darkOverlay' => 'bg-black/40 lg:bg-black/50',
                'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
            ],
            'content' => [
                'title' => [
                    'text' => $programData['title'],
                    'className' => 'font-bold leading-tight'
                ],
            ],
        ];

        // FAQ Data
        $faqData = [
            'section' => [
                'title' => 'Key Questions Answered About Our Us',
                'subtitle' => 'Explore our Frequently Asked Questions for answers about our charity\'s mission, projects, and how to help.'
            ],
            'faqs' => [
                [
                    'id' => 1,
                    'question' => 'What is the mission of your charity?',
                    'answer' => 'Any company that is using spreadsheets and emails to manage the people side of their business is wasting time on admin and making life more difficult for themselves. A well-designed HR system like PiHR automates menial tasks allowing business owners to focus on the strategic work of growing the business. It improves the recruitment process, enriches payroll management, provides real-time feedback, improves employees, improves data security, helps make decisions.',
                ],
                [
                    'id' => 2,
                    'question' => 'Who benefits from your programs?',
                    'answer' => 'Our programs benefit underprivileged communities, women and children, disaster-affected families, and landless poor in coastal areas of Bangladesh.',
                ],
                [
                    'id' => 3,
                    'question' => 'Can I make a recurring donation?',
                    'answer' => 'Yes, you can make recurring donations monthly, quarterly, or annually. Visit our donation page to set up your recurring contribution.',
                ],
                [
                    'id' => 4,
                    'question' => 'Can I visit the projects I support?',
                    'answer' => 'Yes, we welcome donors to visit our project sites. Please contact our office in advance to arrange a visit and meet the communities you are supporting.',
                ],
                [
                    'id' => 5,
                    'question' => 'How can I get involved?',
                    'answer' => 'You can get involved by donating, volunteering, sponsoring a child, or becoming a community ambassador. Visit our "Get Involved" page for more details.',
                ],
                [
                    'id' => 6,
                    'question' => 'How can I make a donation?',
                    'answer' => 'You can make a donation online through our secure payment portal, bank transfer, or by visiting our office. We accept one-time and recurring donations.',
                ],
                [
                    'id' => 7,
                    'question' => 'How do you maintain accountability?',
                    'answer' => 'We maintain transparency through regular audits, annual reports, community feedback mechanisms, and public disclosure of our financial statements.',
                ],
                [
                    'id' => 8,
                    'question' => 'Are donations tax-deductible?',
                    'answer' => 'Yes, donations to DUS are tax-deductible under applicable tax laws. You will receive a receipt for your donation for tax purposes.',
                ]
            ]
        ];

        // Upcoming Events Data
        $upcomingEventsData = [
            'section' => [
                'title' => 'Upcoming Events & Community Actions',
                'description' => 'Read real stories from the field, community experiences, and thought-provoking perspectives that reflect our mission and impact.',
                'button' => [
                    'text' => 'Explore All Events',
                    'link' => '/events'
                ]
            ],
            'image' => [
                'src' => $asset('UpcomingEvent/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp'),
                'alt' => 'Events Image',
                'className' => 'mt-15 rounded-2xl h-139.25 w-auto'
            ],
            'events' => [
                [
                    'id' => 1,
                    'date' => [
                        'day' => '25',
                        'month' => 'Apr',
                        'weekday' => 'THU',
                        'dayNumber' => '1',
                        'time' => '10:30AM'
                    ],
                    'location' => 'International Convention City Bashundhara - ICCB',
                    'title' => 'Participate in our community clean-up day and make a difference together',
                    'description' => 'Let\'s shape the future of the food industry together! Participate at the 9th Food Bangladesh Int\'l Expo 2026,',
                    'link' => '/events/community-cleanup'
                ],
                [
                    'id' => 2,
                    'date' => [
                        'day' => '28',
                        'month' => 'Apr',
                        'weekday' => 'SUN',
                        'dayNumber' => '2',
                        'time' => '02:00PM'
                    ],
                    'location' => 'Dhaka University Campus - Dhaka',
                    'title' => 'Education for All: Scholarship Distribution Ceremony',
                    'description' => 'Join us as we distribute scholarships to underprivileged students and celebrate their achievements in pursuing quality education.',
                    'link' => '/events/scholarship-ceremony'
                ],
                [
                    'id' => 3,
                    'date' => [
                        'day' => '05',
                        'month' => 'May',
                        'weekday' => 'MON',
                        'dayNumber' => '3',
                        'time' => '09:00AM'
                    ],
                    'location' => 'Hatiya Island Community Center - Noakhali',
                    'title' => 'Climate Adaptation Workshop for Coastal Communities',
                    'description' => 'Learn sustainable farming techniques and disaster preparedness strategies to combat climate change impacts in coastal areas.',
                    'link' => '/events/climate-workshop'
                ]
            ]
        ];

        // Merge shared data with page-specific data
        return Inertia::render('Frontend/ProjectsAndProgramsDetails/ProjectsAndProgramsDetails', array_merge(
            $this->getSharedData(),
            [
                'slug' => $slug,
                'faqData' => $faqData,
                'bannerData' => $bannerData,
                'programData' => $programData,
                'upcomingEventsData' => $upcomingEventsData,
            ]
        ));
    }

    /**
     * Display the blogs page (frontend public blogs listing)
     */
    public function blogs(): Response
    {
        $asset = function ($path) {
            return route('asset', ['path' => ltrim($path, '/')]);
        };

        // Banner Data for sub-page
        $bannerData = [
            'background' => [
                'src' => $asset('OurPrograms/db1b2b6eae5fc260b4204f8257dadbd5a7aa0af7.png'),
                'alt' => 'Background'
            ],
            'overlay' => [
                'darkOverlay' => 'bg-black/40 lg:bg-black/50',
                'gradient' => 'bg-gradient-to-r from-black/85 via-black/10 to-transparent'
            ],
            'content' => [
                'title' => [
                    'text' => 'Blog',
                    'className' => 'font-bold leading-tight'
                ],
            ],
        ];

        // Main Blog Data
        $mainBlog = [
            'id' => 1,
            'date' => "June 6, 2023",
            'title' => "Invest in Kindness, Reap a Better Future",
            'description' => "Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with Palli Karma Sahayak Foundation (PKSF) since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female. Under this program, DUS has savings scheme for poor women who has no access in mainstream banks due to lack of capital and assets. Most of the targeted beneficiaries of DUS are poor women, marginal farmers and small micro entrepreneurs. Major borrowers are women who used these loan funds to promote various income generating activities for their earnings and employments. As a result, micro finance program has positive impact on poverty reduction especially at grass root level, income enhancement, consumption, the promotion of rural businesses, education and health and finally the empowerment of women and their employment in rural island communities.",
            'image' => "https://placehold.co/750x450",
            'slug' => "invest-in-kindness-reap-a-better-future",
            'tags' => ["Kindness", "Future", "Investment"],
            'createdBy' => "Admin",
            'timerRead' => "5 min read"
        ];

        // Blog Posts Data (10 posts as before)
        $blogPosts = [
            [
                'id' => 2,
                'date' => "June 5, 2023",
                'title' => "How Technology is Changing Education",
                'description' => "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                'image' => "https://placehold.co/420x250",
                'slug' => "how-technology-is-changing-education",
                'tags' => ["Technology", "Education", "Innovation"],
                'createdBy' => "Admin",
                'timerRead' => "4 min read"
            ],
            [
                'id' => 3,
                'date' => "June 4, 2023",
                'title' => "Sustainable Living: Small Changes, Big Impact",
                'description' => "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                'image' => "https://placehold.co/420x250",
                'slug' => "sustainable-living-small-changes-big-impact",
                'tags' => ["Sustainability", "Environment", "Lifestyle"],
                'createdBy' => "Admin",
                'timerRead' => "6 min read"
            ],
            [
                'id' => 4,
                'date' => "June 3, 2023",
                'title' => "The Future of Remote Work",
                'description' => "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                'image' => "https://placehold.co/420x250",
                'slug' => "the-future-of-remote-work",
                'tags' => ["Work", "Technology", "Future"],
                'createdBy' => "Admin",
                'timerRead' => "5 min read"
            ],
            [
                'id' => 5,
                'date' => "June 2, 2023",
                'title' => "Mental Health Awareness in the Workplace",
                'description' => "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                'image' => "https://placehold.co/420x250",
                'slug' => "mental-health-awareness-in-the-workplace",
                'tags' => ["Health", "Wellness", "Workplace"],
                'createdBy' => "Admin",
                'timerRead' => "7 min read"
            ],
            [
                'id' => 6,
                'date' => "June 1, 2023",
                'title' => "Innovations in Renewable Energy",
                'description' => "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                'image' => "https://placehold.co/420x250",
                'slug' => "innovations-in-renewable-energy",
                'tags' => ["Energy", "Innovation", "Sustainability"],
                'createdBy' => "Admin",
                'timerRead' => "5 min read"
            ],
            [
                'id' => 7,
                'date' => "May 31, 2023",
                'title' => "Building a Personal Brand Online",
                'description' => "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                'image' => "https://placehold.co/420x250",
                'slug' => "building-a-personal-brand-online",
                'tags' => ["Branding", "Marketing", "Career"],
                'createdBy' => "Admin",
                'timerRead' => "4 min read"
            ],
            [
                'id' => 8,
                'date' => "May 30, 2023",
                'title' => "The Art of Effective Communication",
                'description' => "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                'image' => "https://placehold.co/420x250",
                'slug' => "the-art-of-effective-communication",
                'tags' => ["Communication", "Skills", "Leadership"],
                'createdBy' => "Admin",
                'timerRead' => "6 min read"
            ],
            [
                'id' => 9,
                'date' => "May 29, 2023",
                'title' => "Financial Planning for Young Professionals",
                'description' => "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                'image' => "https://placehold.co/420x250",
                'slug' => "financial-planning-for-young-professionals",
                'tags' => ["Finance", "Planning", "Career"],
                'createdBy' => "Admin",
                'timerRead' => "5 min read"
            ],
            [
                'id' => 10,
                'date' => "May 28, 2023",
                'title' => "Tech is Changing the World",
                'description' => "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                'image' => "https://placehold.co/420x250",
                'slug' => "tech-is-changing-the-world",
                'tags' => ["Technology", "Innovation", "Future"],
                'createdBy' => "Admin",
                'timerRead' => "4 min read"
            ]
        ];

        // FAQ Data
        $faqData = [
            'section' => [
                'title' => 'Key Questions Answered About Our Blogs',
                'subtitle' => 'Explore our Frequently Asked Questions for answers about our charity\'s blog content, mission, projects, and how to help.'
            ],
            'faqs' => [
                [
                    'id' => 1,
                    'question' => 'What is the mission of your charity?',
                    'answer' => 'Any company that is using spreadsheets and emails to manage the people side of their business is wasting time on admin and making life more difficult for themselves. A well-designed HR system like PiHR automates menial tasks allowing business owners to focus on the strategic work of growing the business. It improves the recruitment process, enriches payroll management, provides real-time feedback, improves employees, improves data security, helps make decisions.',
                ],
                [
                    'id' => 2,
                    'question' => 'Who benefits from your programs?',
                    'answer' => 'Our programs benefit underprivileged communities, women and children, disaster-affected families, and landless poor in coastal areas of Bangladesh.',
                ],
                [
                    'id' => 3,
                    'question' => 'Can I make a recurring donation?',
                    'answer' => 'Yes, you can make recurring donations monthly, quarterly, or annually. Visit our donation page to set up your recurring contribution.',
                ],
                [
                    'id' => 4,
                    'question' => 'Can I visit the projects I support?',
                    'answer' => 'Yes, we welcome donors to visit our project sites. Please contact our office in advance to arrange a visit and meet the communities you are supporting.',
                ],
                [
                    'id' => 5,
                    'question' => 'How can I get involved?',
                    'answer' => 'You can get involved by donating, volunteering, sponsoring a child, or becoming a community ambassador. Visit our "Get Involved" page for more details.',
                ],
                [
                    'id' => 6,
                    'question' => 'How can I make a donation?',
                    'answer' => 'You can make a donation online through our secure payment portal, bank transfer, or by visiting our office. We accept one-time and recurring donations.',
                ],
                [
                    'id' => 7,
                    'question' => 'How do you maintain accountability?',
                    'answer' => 'We maintain transparency through regular audits, annual reports, community feedback mechanisms, and public disclosure of our financial statements.',
                ],
                [
                    'id' => 8,
                    'question' => 'Are donations tax-deductible?',
                    'answer' => 'Yes, donations to DUS are tax-deductible under applicable tax laws. You will receive a receipt for your donation for tax purposes.',
                ]
            ]
        ];

        return Inertia::render('Frontend/Blogs/Blogs', array_merge(
            $this->getSharedData(),
            [
                'bannerData' => $bannerData,
                'faqData' => $faqData,
                'mainBlog' => $mainBlog,
                'blogPosts' => $blogPosts,
            ]
        ));
    }

    /**
     * Backward-compatible blog details implementation.
     */
    public function blogDetails(string $slug): Response
    {
        $asset = function ($path) {
            return route('asset', ['path' => ltrim($path, '/')]);
        };

        // Full blog posts data with HTML content
        $blogPostsData = [
            'invest-in-kindness-reap-a-better-future' => [
                'id' => 1,
                'date' => "June 6, 2023",
                'title' => "Invest in Kindness, Reap a Better Future",
                'description' => "Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with Palli Karma Sahayak Foundation (PKSF) since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female.",
                'image' => "https://placehold.co/750x450",
                'slug' => "invest-in-kindness-reap-a-better-future",
                'tags' => ["Kindness", "Future", "Investment"],
                'createdBy' => "Admin",
                'timerRead' => "5 min read",
                'fullContent' => '
                    <div class="space-y-6">
                        <div>
                            <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with <strong class="text-[#009BE2]">Palli Karma Sahayak Foundation (PKSF)</strong> since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female.</p>
                            
                            <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Under this program, DUS has savings scheme for poor women who has no access in mainstream banks due to lack of capital and assets. Most of the targeted beneficiaries of DUS are poor women, marginal farmers and small micro entrepreneurs.</p>
                            
                            <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Major borrowers are women who used these loan funds to promote various income generating activities for their earnings and employments. As a result, micro finance program has positive impact on poverty reduction especially at grass root level, income enhancement, consumption, the promotion of rural businesses, education and health and finally the empowerment of women and their employment in rural island communities.</p>
                            
                            <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">The Power of Microfinance</h2>
                            <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Microfinance has proven to be one of the most effective tools for poverty alleviation in developing countries. By providing small loans to those who lack access to traditional banking services, we enable families to start businesses, generate income, and build a better future for their children.</p>
                            
                            <!-- Two Images Side by Side -->
                            <div class="flex flex-col sm:flex-row gap-12 my-8">
                                <img 
                                    src="https://placehold.co/460x400" 
                                    alt="Microfinance beneficiaries"
                                    class="w-full sm:w-115 h-100 object-cover rounded-2xl shadow-lg"
                                />
                                <img 
                                    src="https://placehold.co/460x400" 
                                    alt="Community empowerment"
                                    class="w-full sm:w-115 h-100 object-cover rounded-2xl shadow-lg"
                                />
                            </div>
                            
                            <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Success Stories</h2>
                            <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Take the story of Fatema, a mother of three from Hatiya Island. With a small loan of BDT 15,000, she started a tailoring business. Today, she employs two other women from her community and has been able to send all her children to school.</p>
                            
                            <div class="bg-white/50 rounded-lg p-6 mt-6 mb-6">
                                <h3 class="font-600 text-xl sm:text-2xl text-[#080C14] mb-3">Key Impact Statistics</h3>
                                <ul class="list-disc pl-6 space-y-2">
                                    <li class="font-400 text-base sm:text-lg text-[#333333]">40,000+ active group members</li>
                                    <li class="font-400 text-base sm:text-lg text-[#333333]">97% female beneficiaries</li>
                                    <li class="font-400 text-base sm:text-lg text-[#333333]">Over 95% loan recovery rate</li>
                                    <li class="font-400 text-base sm:text-lg text-[#333333]">Operating in 50+ villages</li>
                                    <li class="font-400 text-base sm:text-lg text-[#333333]">BDT 50+ crore distributed in loans</li>
                                </ul>
                            </div>
                            
                            <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Looking Ahead</h2>
                            <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">As we continue to expand our microfinance program, we remain committed to reaching more underserved communities. Your support helps us create lasting change and build a more equitable future for all.</p>
                            
                        </div>
                    </div>
            '
            ],
            'how-technology-is-changing-education' => [
                'id' => 2,
                'date' => "June 5, 2023",
                'title' => "How Technology is Changing Education",
                'description' => "Discover how digital tools and innovative technologies are transforming the educational landscape for underprivileged communities.",
                'image' => "https://placehold.co/750x450",
                'slug' => "how-technology-is-changing-education",
                'tags' => ["Technology", "Education", "Innovation"],
                'createdBy' => "Admin",
                'timerRead' => "4 min read",
                'fullContent' => '
            <div class="space-y-6">
                <div>
                    <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Technology is revolutionizing education in ways we could never have imagined. From digital classrooms to online learning platforms, students now have access to a world of knowledge at their fingertips.</p>
                    
                    <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">In remote areas like Hatiya Island, technology is bridging the gap between rural and urban education. Our <strong class="text-[#009BE2]">Digital Learning Centers</strong> provide students with access to computers, internet connectivity, and online educational resources.</p>
                    
                    <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Key Technological Interventions</h2>
                    <ul class="list-disc pl-6 space-y-3 mb-6">
                        <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Computer literacy programs for students and teachers</li>
                        <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Online scholarship applications and tracking systems</li>
                        <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Digital libraries with thousands of e-books and resources</li>
                        <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Virtual tutoring and mentorship programs</li>
                    </ul>
                    
                    <div class="bg-white/50 rounded-lg p-6 mt-6">
                        <h3 class="font-600 text-xl sm:text-2xl text-[#080C14] mb-3">Impact So Far</h3>
                        <ul class="list-disc pl-6 space-y-2">
                            <li class="font-400 text-base sm:text-lg text-[#333333]">1,500+ students trained in basic computer skills</li>
                            <li class="font-400 text-base sm:text-lg text-[#333333]">50 teachers equipped with digital teaching tools</li>
                            <li class="font-400 text-base sm:text-lg text-[#333333]">10 community ICT centers established</li>
                        </ul>
                    </div>
                </div>
            </div>
        '
            ],
            'sustainable-living-small-changes-big-impact' => [
                'id' => 3,
                'date' => "June 4, 2023",
                'title' => "Sustainable Living: Small Changes, Big Impact",
                'description' => "Learn how simple lifestyle changes can contribute to environmental sustainability and community well-being.",
                'image' => "https://placehold.co/750x450",
                'slug' => "sustainable-living-small-changes-big-impact",
                'tags' => ["Sustainability", "Environment", "Lifestyle"],
                'createdBy' => "Admin",
                'timerRead' => "6 min read",
                'fullContent' => '
            <div class="space-y-6">
                <div>
                    <p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Sustainable living is not just a trend—it\'s a necessity for our planet\'s future. Small changes in our daily habits can collectively make a significant impact on environmental conservation.</p>
                    
                    <h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Simple Steps for Sustainable Living</h2>
                    <ul class="list-disc pl-6 space-y-3 mb-6">
                        <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Reduce, reuse, and recycle waste materials</li>
                        <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Conserve water and electricity at home</li>
                        <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Support local farmers and sustainable agriculture</li>
                        <li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Plant trees and maintain home gardens</li>
                    </ul>
                </div>
            </div>
        '
            ],
        ];

        // All blog posts for related posts (excluding current one)
        $allBlogPosts = [
            [
                'id' => 1,
                'date' => "June 6, 2023",
                'title' => "Invest in Kindness, Reap a Better Future",
                'description' => "Micro finance Program is the core program of all DUS activities...",
                'image' => "https://placehold.co/420x250",
                'slug' => "invest-in-kindness-reap-a-better-future",
                'tags' => ["Kindness", "Future", "Investment"],
                'createdBy' => "Admin",
                'timerRead' => "5 min read"
            ],
            [
                'id' => 2,
                'date' => "June 5, 2023",
                'title' => "How Technology is Changing Education",
                'description' => "Discover how digital tools and innovative technologies are transforming education...",
                'image' => "https://placehold.co/420x250",
                'slug' => "how-technology-is-changing-education",
                'tags' => ["Technology", "Education", "Innovation"],
                'createdBy' => "Admin",
                'timerRead' => "4 min read"
            ],
            [
                'id' => 3,
                'date' => "June 4, 2023",
                'title' => "Sustainable Living: Small Changes, Big Impact",
                'description' => "Learn how simple lifestyle changes can contribute to environmental sustainability...",
                'image' => "https://placehold.co/420x250",
                'slug' => "sustainable-living-small-changes-big-impact",
                'tags' => ["Sustainability", "Environment", "Lifestyle"],
                'createdBy' => "Admin",
                'timerRead' => "6 min read"
            ],
            [
                'id' => 4,
                'date' => "June 3, 2023",
                'title' => "The Future of Remote Work",
                'description' => "Exploring how remote work is reshaping the modern workplace and creating new opportunities...",
                'image' => "https://placehold.co/420x250",
                'slug' => "the-future-of-remote-work",
                'tags' => ["Work", "Technology", "Future"],
                'createdBy' => "Admin",
                'timerRead' => "5 min read"
            ],
            [
                'id' => 5,
                'date' => "June 2, 2023",
                'title' => "Mental Health Awareness in the Workplace",
                'description' => "Understanding the importance of mental health support and wellness programs at work...",
                'image' => "https://placehold.co/420x250",
                'slug' => "mental-health-awareness-in-the-workplace",
                'tags' => ["Health", "Wellness", "Workplace"],
                'createdBy' => "Admin",
                'timerRead' => "7 min read"
            ],
        ];

        // Get related blogs (excluding current, limit to 3)
        $relatedBlogs = array_filter($allBlogPosts, function ($post) use ($slug) {
            return $post['slug'] !== $slug;
        });
        $relatedBlogs = array_slice($relatedBlogs, 0, 3);

        // Upcoming Events Data
        $upcomingEventsData = [
            'section' => [
                'title' => 'Upcoming Events & Community Actions',
                'description' => 'Read real stories from the field, community experiences, and thought-provoking perspectives that reflect our mission and impact.',
                'button' => [
                    'text' => 'Explore All Events',
                    'link' => '/events'
                ]
            ],
            'image' => [
                'src' => $asset('UpcomingEvent/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp'),
                'alt' => 'Events Image',
                'className' => 'mt-15 rounded-2xl h-139.25 w-auto'
            ],
            'events' => [
                [
                    'id' => 1,
                    'date' => [
                        'day' => '25',
                        'month' => 'Apr',
                        'weekday' => 'THU',
                        'dayNumber' => '1',
                        'time' => '10:30AM'
                    ],
                    'location' => 'International Convention City Bashundhara - ICCB',
                    'title' => 'Participate in our community clean-up day and make a difference together',
                    'description' => 'Let\'s shape the future of the food industry together! Participate at the 9th Food Bangladesh Int\'l Expo 2026,',
                    'link' => '/events/community-cleanup'
                ],
                [
                    'id' => 2,
                    'date' => [
                        'day' => '28',
                        'month' => 'Apr',
                        'weekday' => 'SUN',
                        'dayNumber' => '2',
                        'time' => '02:00PM'
                    ],
                    'location' => 'Dhaka University Campus - Dhaka',
                    'title' => 'Education for All: Scholarship Distribution Ceremony',
                    'description' => 'Join us as we distribute scholarships to underprivileged students and celebrate their achievements in pursuing quality education.',
                    'link' => '/events/scholarship-ceremony'
                ],
                [
                    'id' => 3,
                    'date' => [
                        'day' => '05',
                        'month' => 'May',
                        'weekday' => 'MON',
                        'dayNumber' => '3',
                        'time' => '09:00AM'
                    ],
                    'location' => 'Hatiya Island Community Center - Noakhali',
                    'title' => 'Climate Adaptation Workshop for Coastal Communities',
                    'description' => 'Learn sustainable farming techniques and disaster preparedness strategies to combat climate change impacts in coastal areas.',
                    'link' => '/events/climate-workshop'
                ]
            ]
        ];

        // Check if the blog post exists
        if (!isset($blogPostsData[$slug])) {
            abort(404, 'Blog post not found');
        }

        $blogData = $blogPostsData[$slug];

        // Banner Data for blog details page
        $bannerData = [
            'background' => [
                'src' => $asset('OurPrograms/db1b2b6eae5fc260b4204f8257dadbd5a7aa0af7.png'),
                'alt' => 'Background'
            ],
            'overlay' => [
                'darkOverlay' => 'bg-black/40 lg:bg-black/70',
            ],
        ];

        return Inertia::render('Frontend/BlogDetails/BlogDetails', array_merge(
            $this->getSharedData(),
            [
                'slug' => $slug,
                'bannerData' => $bannerData,
                'blogData' => $blogData,
                'relatedBlogs' => $relatedBlogs,
                'upcomingEventsData' => $upcomingEventsData,
            ]
        ));
    }
}
