<?php
// app/Http/Controllers/Frontend/FrontendController.php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class FrontendController extends Controller
{
    /**
     * Get shared data for all frontend pages (TopBar, Navbar, Footer)
     */
    private function getSharedData(): array
    {
        // Get storage URL from config
        $storageUrl = asset('storage');

        // Top Bar Data (static paths - these are in public/images)
        $topBarData = [
            'contactInfo' => [
                'email' => ['text' => 'dus.eddus@gmail.com', 'icon' => '/images/TopBar/Email.svg', 'alt' => 'Email'],
                'phone' => ['text' => '+880 1761-493412', 'icon' => '/images/TopBar/Phone.svg', 'alt' => 'Phone'],
                'hours' => ['text' => 'Sun - Thu 9:00AM - 5:00PM', 'icon' => '/images/TopBar/Clock.svg', 'alt' => 'Clock']
            ],
            'languages' => [
                ['code' => 'us', 'name' => 'English', 'flag' => '/images/Flags/united-states.png'],
                ['code' => 'bd', 'name' => 'Bengali', 'flag' => '/images/Flags/bangladesh.png'],
                ['code' => 'fr', 'name' => 'French', 'flag' => '/images/Flags/france.png'],
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
                'src' => '/images/Icon.svg',
                'alt' => 'DUS Logo',
                'className' => 'h-17.5 w-auto',
                'href' => '/'
            ],
            'navLinks' => [
                ['name' => 'Home', 'href' => '/'],
                ['name' => 'About', 'href' => '/about'],
                ['name' => 'Projects & Programs', 'href' => '/projects-programs'],
                ['name' => 'Workplace Area', 'href' => '/workplace-area'],
                ['name' => 'Posts', 'href' => '/posts'],
                ['name' => 'Media', 'href' => '/media'],
                ['name' => 'Get Involved', 'href' => '/get-involved'],
            ],
            'button' => [
                'text' => 'Contact Us',
                'href' => '/contact',
                'className' => 'capitalize text-white bg-[#009BE2] hover:bg-[#009BE2]/80 px-6 py-2 rounded-lg transition-colors duration-200'
            ]
        ];

        // Footer Data
        $footerData = [
            'logo' => [
                'src' => '/images/Icon-bottom.svg',
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
                'About Us',
                'Community Radio',
                'Evaluation',
                'Working Area',
                'Publication',
                'Mission & Visions',
                'Blogs',
                'Contact Us'
            ],
            'programs' => [
                'Micro-Finance Program',
                'Disaster Management',
                'Community Radio',
                'Education',
                'ICT for Development',
                'Health Program',
                'Livelihood',
                'Member Facilities',
                'Social Development',
                'Legal Support',
                'Agriculture',
                'Water and Sanitation',
                'Research and Documentation',
                'Training Facilities',
                'Tourism'
            ],
            'newsletter' => [
                'title' => 'Subscribe to Our Newsletter',
                'placeholder' => 'Enter your email address',
                'buttonText' => 'Subscribe'
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
        // Get storage URL from config
        $storageUrl = asset('storage');

        // Banner Data
        $bannerData = [
            'background' => [
                'src' => $storageUrl . '/Banner/64065404ef679e54d2dabd90bba3b1744817c578.webp',
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
                        'icon' => $storageUrl . '/AboutUs/65af8a95ec6612fa3ef2941b_011-charity-1%201.svg',
                        'title' => 'Education for All',
                        'description' => 'Charity is dedicated to ensuring that every child has access to quality education.',
                        'alt' => 'Education Icon'
                    ],
                    [
                        'id' => 2,
                        'icon' => $storageUrl . '/AboutUs/65af8a95c570e47bd1123b4e_033-hospital%201.svg',
                        'title' => 'Health and Wellness',
                        'description' => 'Our commitment to health and wellness extends across borders.',
                        'alt' => 'Health Icon'
                    ],
                    [
                        'id' => 3,
                        'icon' => $storageUrl . '/AboutUs/65af8a95cee257c23ab03ff8_040-shelter%201.svg',
                        'title' => 'Disaster Relief',
                        'description' => 'In times of crisis, Charity responds swiftly to provide emergency relief.',
                        'alt' => 'Disaster Relief Icon'
                    ],
                    [
                        'id' => 4,
                        'icon' => $storageUrl . '/AboutUs/65af8a958d27ad8d830434f4_022-family-1%201.svg',
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
                'src' => $storageUrl . '/AboutUs/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff.webp',
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
                ['id' => 1, 'icon' => $storageUrl . '/OurActions/fi_1940611.svg', 'title' => 'Education', 'description' => 'We empower communities by investing in sustainable projects, training livelihood programs.', 'alt' => 'Education Icon'],
                ['id' => 2, 'icon' => $storageUrl . '/OurActions/fi_14888982.svg', 'title' => 'Microfinance', 'description' => 'We empower communities by investing in sustainable projects, training livelihood programs.', 'alt' => 'Microfinance Icon'],
                ['id' => 3, 'icon' => $storageUrl . '/OurActions/fi_3004451.svg', 'title' => 'Health', 'description' => 'Providing nutritious meals and groceries to individuals and families in need.', 'alt' => 'Health Icon'],
                ['id' => 4, 'icon' => $storageUrl . '/OurActions/fi_17316107.svg', 'title' => 'Organizational Development', 'description' => 'We empower underprivileged children with the opportunity to learn, grow, and succeed.', 'alt' => 'Organizational Development Icon'],
                ['id' => 5, 'icon' => $storageUrl . '/OurActions/fi_6786176.svg', 'title' => 'Climate Change', 'description' => 'From free medical camps to life-saving treatments, we support initiatives that provide critical aid to access to proper.', 'alt' => 'Climate Change Icon'],
                ['id' => 6, 'icon' => $storageUrl . '/OurActions/fi_1176562.svg', 'title' => 'Human Rights', 'description' => 'From free medical camps to life-saving treatments, we support initiatives that provide critical aid to access to proper.', 'alt' => 'Human Rights Icon'],
                ['id' => 7, 'icon' => $storageUrl . '/OurActions/fi_8992468.svg', 'title' => 'Human Resource', 'description' => 'Bringing clean and safe drinking water to communities, improving sanitation, and preventing waterborne diseases.', 'alt' => 'Human Resource Icon'],
                ['id' => 8, 'icon' => $storageUrl . '/OurActions/fi_726211.svg', 'title' => 'Social Enterprises', 'description' => 'We empower communities by investing in sustainable projects, training livelihood programs.', 'alt' => 'Social Enterprises Icon'],
                ['id' => 9, 'icon' => $storageUrl . '/OurActions/fi_4994126.svg', 'title' => 'Agriculture Food Security', 'description' => 'Bringing clean and safe drinking water to communities, improving sanitation, and preventing waterborne diseases.', 'alt' => 'Agriculture Food Security Icon']
            ]
        ];

        // Where We Work Data
        $whereWeWorkData = [
            'section' => ['title' => 'Where We Work'],
            'stats' => [
                ['id' => 1, 'icon' => $storageUrl . '/WhereWeWork/image%206-3.png', 'value' => '450K', 'label' => 'Total Member Reach', 'alt' => 'Member Reach Icon'],
                ['id' => 2, 'icon' => $storageUrl . '/WhereWeWork/image%206-2.png', 'value' => '41,382', 'label' => 'Mail Engaged in Divers Livelihoods Options', 'alt' => 'Member Reach Icon'],
                ['id' => 3, 'icon' => $storageUrl . '/WhereWeWork/image%206-1.png', 'value' => '35,193', 'label' => 'Women Engaged in Diverse Livelihoods Options', 'alt' => 'Member Reach Icon'],
                ['id' => 4, 'icon' => $storageUrl . '/WhereWeWork/image%206.png', 'value' => '35,193', 'label' => 'Women Engaged in Diverse Livelihoods Options', 'alt' => 'Mail Engaged Icon'],
                ['id' => 5, 'icon' => $storageUrl . '/WhereWeWork/image%206-1.png', 'value' => '38.0 M', 'label' => 'Digital media Outreach', 'alt' => 'Women Engaged Icon'],
                ['id' => 6, 'icon' => $storageUrl . '/WhereWeWork/image%206.png', 'value' => '35,193', 'label' => 'Women Engagement in Diverse Livelihood Options', 'alt' => 'Mail Engaged Icon']
            ],
            'image' => [
                'src' => $storageUrl . '/WhereWeWork/image.png',
                'alt' => 'Map Place holder Text',
                'className' => 'w-full h-232.5 object-cover rounded-4xl'
            ]
        ];

        // Our Programs Data
        $ourProgramsData = [
            'section' => [
                'title' => 'Our Programs',
                'description' => 'We design and develop modern web solutions with a professional design using latest technologies and trends.',
                'button' => [
                    'text' => 'View all Projects and programs',
                    'link' => '/projects-programs'
                ]
            ],
            'programs' => [
                [
                    'id' => 1,
                    'title' => 'Micro-Finance <br /> Program',
                    'description' => 'Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with Palli Karma Sahayak Foundation (PKSF) since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female. Under this program, DUS has savings scheme for poor women who has no access in mainstream banks due to lack of capital and assets.',
                    'image' => $storageUrl . '/OurPrograms/945e2496664a40b12a1cddd6561e954cdc78e255.webp',
                    'bgColor' => 'bg-[#E6F3E7]',
                    'link' => '/programs/micro-finance'
                ],
                [
                    'id' => 2,
                    'title' => 'Climate Change and Disaster Management Program',
                    'description' => 'DUS is geographically located at very exposed disaster risk area of Coastal Bangladesh, most of its beneficiaries as well as core staffs of the organization and volunteers including general members are experienced by the influence of topography & living experience with the community, to cope with and face any natural disaster. Further during its lifetime DUS was active in major emergency in relief and rehabilitation programs following Nov. 1970 cyclone relief, 1988/1991-cyclone recovery, 1998 flood response, SIDR 2007 etc. DUS is now moving beyond relief and rehabilitation into institutionalized preparedness, risk reduction and management interventions as well as long term adaptation strategies as consequence of lessons learnt while helping communities cope with the devastating effects of Cyclone SIDR, which struck in November 2007.',
                    'image' => $storageUrl . '/OurPrograms/a03fa6dba9fcdac0a5aedf2d337b118228a03298.webp',
                    'bgColor' => 'bg-[#F3EDE6]',
                    'link' => '/programs/climate-change'
                ],
                [
                    'id' => 3,
                    'title' => 'Community Radio',
                    'description' => 'Strengthening Hatiya Island community for pioneering-connecting and empowering their Voice for Change Bangladesh Government has already acknowledged the importance of community radio and announced the Community Radio Installation, Broadcast & Operation Policy. Bangladesh is the 2nd country in South Asia in formulating policy for Community Radio. Meanwhile, Govt.',
                    'image' => $storageUrl . '/OurPrograms/e280b627b1771904c38022aac2566b932e248887.webp',
                    'bgColor' => 'bg-[#E8E6F3]',
                    'link' => '/programs/community-radio'
                ],
                [
                    'id' => 4,
                    'title' => 'Research and Documentation',
                    'description' => 'DUS has a strong Research and Documentation Cell to conduct quality research in diverse areas of human and social development sectors, covering most importantly education, health, livelihood development, environment, human rights and social justice. The R&D cell works as a professional support services unit to fulfill the growing demand for generation and systematic analysis of information in connection with the increasing involvement of DUS in its development activities. Thus it engages in survey and research activities addressing the in-house needs of the organization for exploring and examining the feasible approaches for development, planning, designing, piloting, assessing and improving the implementation and performance of a wide range of projects, and determining the best practices and models of socio-economic interventions.',
                    'image' => $storageUrl . '/OurPrograms/a496922a3fc00992b6c454822d60bde51dc001e5.webp',
                    'bgColor' => 'bg-[#F3E6EA]',
                    'link' => '/programs/community-radio'
                ],
                [
                    'id' => 5,
                    'title' => 'WATSAN Program',
                    'description' => 'Building on its long experience of providing water and sanitation services to communities, DUS started its Water and Sanitation program with the financial and technical support of the Netherland Govt. The program is implementing in Nangolia Char and Nalerchar under Hatiya Upazilla. Our goal is to provide sustainable and integrated WATSAN services in the rural areas and break the contamination cycle of unsanitary latrines, contaminated water and unsafe hygiene practices, as well as ensure sustainability and scaling-up of WATSAN services. The program aims to ensure access to sanitation services for four thousand six hundred & five household, safe water services with 250 nos. DTW and hygiene education for around 20000 people of the respective area of DUS.',
                    'image' => $storageUrl . '/OurPrograms/be14c45848898048e7b7832affc4dc713b032e10.webp',
                    'bgColor' => 'bg-[#F2F3E6]',
                    'link' => '/programs/community-radio'
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
                    'image' => $storageUrl . '/Stories/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp',
                    'date' => 'June 6, 2023',
                    'title' => 'Invest in Kindness, Reap a Better Future',
                    'description' => 'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
                    'link' => '/stories/invest-in-kindness'
                ],
                [
                    'id' => 2,
                    'image' => $storageUrl . '/Stories/b3d758bf8cd7985c857cdbe55b5101b105ee9f75.webp',
                    'date' => 'June 6, 2023',
                    'title' => 'How to Design a Custom Pool That Perfectly Fits Your Charlotte Backyard',
                    'description' => 'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
                    'link' => '/stories/custom-pool-design'
                ],
                [
                    'id' => 3,
                    'image' => $storageUrl . '/Stories/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff%20(1).webp',
                    'date' => 'June 6, 2023',
                    'title' => 'The Benefits of Mindfulness in Daily Life',
                    'description' => 'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
                    'link' => '/stories/mindfulness-benefits'
                ],
                [
                    'id' => 4,
                    'image' => $storageUrl . '/Stories/3fe55eb9ebcfd7efb80f559a00b8b5a1da0e8c3e.webp',
                    'date' => 'July 15, 2023',
                    'title' => 'Empowering Women Through Microfinance',
                    'description' => 'Discover how small loans are making a big difference...',
                    'link' => '/stories/empowering-women'
                ],
                [
                    'id' => 5,
                    'image' => $storageUrl . '/Stories/de90e922c05aa3585b8f65361c306413c3b3d7be.webp',
                    'date' => 'August 2, 2023',
                    'title' => 'Building Resilient Communities Against Climate Change',
                    'description' => 'Learn about our initiatives to help coastal communities...',
                    'link' => '/stories/climate-resilience'
                ],
                [
                    'id' => 6,
                    'image' => $storageUrl . '/Stories/f465fcbdab4004cd25dba4df06b9f8d5f2648620.webp',
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
                'src' => $storageUrl . '/UpcomingEvent/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp',
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
                        $storageUrl . '/ProgramImpact/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff%20(1).webp',
                        $storageUrl . '/ProgramImpact/64065404ef679e54d2dabd90bba3b1744817c578.webp',
                        $storageUrl . '/ProgramImpact/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff%20(1).webp',
                        $storageUrl . '/ProgramImpact/64065404ef679e54d2dabd90bba3b1744817c578.webp'
                    ]
                ]
            ],
            'sdgImages' => [
                ['id' => 1, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18732_www.figma.com.webp', 'alt' => 'No Poverty'],
                ['id' => 2, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18742_www.figma.com.webp', 'alt' => 'Zero Hunger'],
                ['id' => 3, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18750_www.figma.com.webp', 'alt' => 'Good Health'],
                ['id' => 4, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_1887_www.figma.com.webp', 'alt' => 'Quality Education'],
                ['id' => 5, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18823_www.figma.com.webp', 'alt' => 'Gender Equality'],
                ['id' => 6, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18837_www.figma.com.webp', 'alt' => 'Clean Water'],
                ['id' => 7, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_1894_www.figma.com.webp', 'alt' => 'Clean Energy'],
                ['id' => 8, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18913_www.figma.com.webp', 'alt' => 'Decent Work'],
                ['id' => 9, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18920_www.figma.com.webp', 'alt' => 'Industry Innovation'],
                ['id' => 10, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18930_www.figma.com.webp', 'alt' => 'Reduced Inequalities'],
                ['id' => 11, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18939_www.figma.com.webp', 'alt' => 'Sustainable Cities'],
                ['id' => 12, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18949_www.figma.com.webp', 'alt' => 'Responsible Consumption'],
                ['id' => 13, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_18108_www.figma.com.webp', 'alt' => 'Climate Action'],
                ['id' => 14, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_181017_www.figma.com.webp', 'alt' => 'Life Below Water'],
                ['id' => 15, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_181031_www.figma.com.webp', 'alt' => 'Life On Land'],
                ['id' => 16, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_181046_www.figma.com.webp', 'alt' => 'Peace Justice'],
                ['id' => 17, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_181055_www.figma.com.webp', 'alt' => 'Partnerships'],
                ['id' => 18, 'src' => $storageUrl . '/ProgramImpact/Screenshot_17-5-2026_181133_www.figma.com.webp', 'alt' => 'SDG 18']
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
        // Get storage URL from config
        $storageUrl = asset('storage');

        // Banner Data
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
                'src' => 'https://placehold.co/730x730',
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
                'src' => 'https://placehold.co/730x730',
                'alt' => 'Background',
                'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl'
            ]
        ];

        // Legal Data
        $legalData = [
            'background' => [
                'src' => 'https://placehold.co/1920x589',
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
                'src' => 'https://placehold.co/730x730',
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
                'src' => 'https://placehold.co/730x730',
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
                'src' => 'https://placehold.co/730x730',
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
                        'src' => 'https://placehold.co/335x440',
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
                        'src' => 'https://placehold.co/670x420',
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
                'src' => 'https://placehold.co/730x730',
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
     * Display about sub-page dynamically based on slug
     */
    public function aboutSub(string $slug): Response
    {
        // Get storage URL from config
        $storageUrl = asset('storage');

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
                        <h1 class="font-700 text-3xl sm:text-4xl lg:text-5xl text-[#080C14] mb-6">Where We Work</h1>
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
                        <h1 class="font-700 text-3xl sm:text-4xl lg:text-5xl text-[#080C14] mb-6">Key Milestones</h1>
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
                'src' => 'https://placehold.co/1920x589',
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
                'src' => $storageUrl . '/UpcomingEvent/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp',
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
        return Inertia::render('Frontend/AboutSub/AboutSub', array_merge(
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
        // Get storage URL from config
        $storageUrl = asset('storage');

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

        // Our Programs Data
        $ourProgramsData = [

            'programs' => [
                [
                    'id' => 1,
                    'title' => 'Micro-Finance <br /> Program',
                    'description' => 'Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with Palli Karma Sahayak Foundation (PKSF) since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female. Under this program, DUS has savings scheme for poor women who has no access in mainstream banks due to lack of capital and assets.',
                    'image' => $storageUrl . '/OurPrograms/945e2496664a40b12a1cddd6561e954cdc78e255.webp',
                    'bgColor' => 'bg-[#E6F3E7]',
                    'link' => '/programs/micro-finance'
                ],
                [
                    'id' => 2,
                    'title' => 'Climate Change and Disaster Management Program',
                    'description' => 'DUS is geographically located at very exposed disaster risk area of Coastal Bangladesh, most of its beneficiaries as well as core staffs of the organization and volunteers including general members are experienced by the influence of topography & living experience with the community, to cope with and face any natural disaster. Further during its lifetime DUS was active in major emergency in relief and rehabilitation programs following Nov. 1970 cyclone relief, 1988/1991-cyclone recovery, 1998 flood response, SIDR 2007 etc. DUS is now moving beyond relief and rehabilitation into institutionalized preparedness, risk reduction and management interventions as well as long term adaptation strategies as consequence of lessons learnt while helping communities cope with the devastating effects of Cyclone SIDR, which struck in November 2007.',
                    'image' => $storageUrl . '/OurPrograms/a03fa6dba9fcdac0a5aedf2d337b118228a03298.webp',
                    'bgColor' => 'bg-[#F3EDE6]',
                    'link' => '/programs/climate-change'
                ],
                [
                    'id' => 3,
                    'title' => 'Community Radio',
                    'description' => 'Strengthening Hatiya Island community for pioneering-connecting and empowering their Voice for Change Bangladesh Government has already acknowledged the importance of community radio and announced the Community Radio Installation, Broadcast & Operation Policy. Bangladesh is the 2nd country in South Asia in formulating policy for Community Radio. Meanwhile, Govt.',
                    'image' => $storageUrl . '/OurPrograms/e280b627b1771904c38022aac2566b932e248887.webp',
                    'bgColor' => 'bg-[#E8E6F3]',
                    'link' => '/programs/community-radio'
                ],
                [
                    'id' => 4,
                    'title' => 'DWIP Education Program',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#EEF3E6]',
                    'link' => '/programs/dwip-education'
                ],
                [
                    'id' => 5,
                    'title' => 'Information and Communication Technology (ICT)',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#E6F3F1]',
                    'link' => '/programs/information-and-communication-technology'
                ],
                [
                    'id' => 6,
                    'title' => 'Research and Documentation',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#F3E6EA]',
                    'link' => '/programs/research-and-documentation'
                ],
                [
                    'id' => 7,
                    'title' => 'Livelihood Restoration Project',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#E6ECF3]',
                    'link' => '/programs/livelihood-restoration-project'
                ],
                [
                    'id' => 8,
                    'title' => 'Group Member Insurance/ Savings Scheme',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#F3E6F1]',
                    'link' => '/programs/group-member-insurance-savings-scheme'
                ],
                [
                    'id' => 9,
                    'title' => 'Social Development Program',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#F3E6EA]',
                    'link' => '/programs/social-development-program'
                ],
                [
                    'id' => 10,
                    'title' => 'Legal and Human Rights',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#E6F1F3]',
                    'link' => '/programs/legal-and-human-rights'
                ],
                [
                    'id' => 11,
                    'title' => 'WATSAN Program',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#F2F3E6]',
                    'link' => '/programs/watsan-program'
                ],
                [
                    'id' => 12,
                    'title' => 'Research and Documentation',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#F3E9E6]',
                    'link' => '/programs/research-and-documentation'
                ],
                [
                    'id' => 13,
                    'title' => 'Training & Other Facilities',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#E6EDF3]',
                    'link' => '/programs/training-and-other-facilities'
                ],
                [
                    'id' => 14,
                    'title' => 'Tourism & Hospitality',
                    'description' => 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Repellendus earum, pariatur voluptate dicta velit eligendi? Assumenda perspiciatis tempora mollitia temporibus sequi quasi quae dolor voluptate repudiandae culpa a corporis non qui nemo iure inventore blanditiis, reiciendis nulla veniam magni. Dignissimos deserunt provident saepe molestiae incidunt expedita voluptates ipsa iure. Nulla. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis alias harum labore consectetur omnis, excepturi earum, non rem libero voluptate est. Rerum explicabo provident beatae cumque quidem, a accusantium obcaecati repellat. Pariatur quisquam aliquam aperiam dignissimos labore molestiae sit nesciunt blanditiis ut veniam repellat voluptatibus rerum, molestias voluptatem voluptate praesentium.',
                    'image' => 'https://placehold.co/700x500',
                    'bgColor' => 'bg-[#EAE6F3]',
                    'link' => '/programs/tourism-and-hospitality'
                ],

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
     * Display the workplace area page
     */
    public function workplaceArea(): Response
    {
        return Inertia::render('Frontend/WorkplaceArea', $this->getSharedData());
    }

    /**
     * Display the posts page
     */
    public function posts(): Response
    {
        return Inertia::render('Frontend/Posts', $this->getSharedData());
    }

    /**
     * Display a single post
     */
    public function showPost(string $slug): Response
    {
        return Inertia::render('Frontend/PostShow', array_merge(
            $this->getSharedData(),
            ['slug' => $slug]
        ));
    }

    /**
     * Display the media page
     */
    public function media(): Response
    {
        return Inertia::render('Frontend/Media', $this->getSharedData());
    }

    /**
     * Display the get involved page
     */
    public function getInvolved(): Response
    {
        return Inertia::render('Frontend/GetInvolved', $this->getSharedData());
    }

    /**
     * Display the jobs page (frontend public jobs listing)
     */
    public function jobs(): Response
    {
        return Inertia::render('Frontend/Jobs', $this->getSharedData());
    }

    /**
     * Display a single job (frontend)
     */
    public function showJob(string $slug): Response
    {
        return Inertia::render('Frontend/JobShow', array_merge(
            $this->getSharedData(),
            ['slug' => $slug]
        ));
    }
}
