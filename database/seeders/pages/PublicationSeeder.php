<?php

namespace Database\Seeders\pages;

use App\Models\pages\Publication;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PublicationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $publications = [
            [
                'title' => 'Climate Change and Its Impact in Hatiya Island',
                'slug' => 'climate-change-impact-hatiya',
                'excerpt' => 'Climate change and its impact on health and livelihood within Hatiya Island of Bangladesh.',
                'date' => '2022-08-16',
                'category' => 'Climate Change',
                'image' => 'https://placehold.co/600x400/009BE2/FFFFFF?text=Climate+Change',
                'pdf_url' => '#',
                'author' => 'Dr. Rahman',
                'tags' => ['Climate Change', 'Hatiya Island', 'Bangladesh', 'Environment'],
                'read_time' => '3 minutes',
                'views' => 245,
                'is_featured' => true,
                'is_active' => true,
                'full_content' => '<div class="space-y-6"><div><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Hatiya Island, located in the Meghna River estuary in Bangladesh, is one of the most vulnerable areas to climate change impacts. The island faces numerous challenges including sea-level rise, increased cyclone intensity, and coastal erosion.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Key Findings</h2><ul class="list-disc pl-6 space-y-3 mb-6"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Sea levels have risen by 2.5mm annually over the past decade</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Cyclone frequency has increased by 40% in the last 20 years</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Coastal erosion has affected over 60% of the island\'s coastline</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Agricultural productivity has declined by 25% due to salinity intrusion</li></ul><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Health Impacts</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">The changing climate has significantly affected the health of island residents. Increased frequency of waterborne diseases, malnutrition, and mental health issues have been observed. The lack of proper healthcare facilities exacerbates these challenges.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Livelihood Challenges</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Traditional livelihoods such as fishing and farming have been severely impacted. Many families have been forced to relocate to the mainland, leading to social disruption and loss of cultural heritage.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Recommended Solutions</h2><ol class="list-decimal pl-6 space-y-3"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Implement coastal protection measures including mangrove afforestation</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Develop climate-resilient agricultural practices</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Establish early warning systems for cyclones and floods</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Provide alternative livelihood options for affected communities</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Strengthen healthcare infrastructure and emergency response</li></ol></div></div>'
            ],
            [
                'title' => 'Sustainable Agriculture Practices in Coastal Areas',
                'slug' => 'sustainable-agriculture-coastal',
                'excerpt' => 'Exploring sustainable farming methods to adapt to rising sea levels and saline intrusion.',
                'date' => '2023-01-10',
                'category' => 'Agriculture',
                'image' => 'https://placehold.co/600x400/28A745/FFFFFF?text=Sustainable+Agriculture',
                'pdf_url' => '#',
                'author' => 'Prof. Ahmed',
                'tags' => ['Agriculture', 'Sustainability', 'Coastal Areas', 'Farming'],
                'read_time' => '4 minutes',
                'views' => 189,
                'is_featured' => false,
                'is_active' => true,
                'full_content' => '<div class="space-y-6"><div><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Coastal areas of Bangladesh face unique challenges in agriculture due to salinity intrusion, waterlogging, and extreme weather events. This research explores sustainable farming methods that can help communities adapt and thrive.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Salinity-Tolerant Crops</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Several salt-tolerant varieties of rice, vegetables, and fruits have been developed and tested in coastal areas. These crops show promising results in maintaining yields despite increasing soil salinity.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Integrated Farming Systems</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Combining aquaculture with agriculture (rice-fish farming) has proven effective in coastal areas. This integrated approach provides multiple income sources and improves food security.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Water Management Techniques</h2><ul class="list-disc pl-6 space-y-3 mb-6"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Rainwater harvesting systems for irrigation</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Raised bed farming to avoid waterlogging</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Drip irrigation to conserve water</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Construction of small-scale water reservoirs</li></ul><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Community Success Stories</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Several communities in the coastal belt have successfully adopted these practices. Training programs and government support have been crucial in their implementation.</p></div></div>'
            ],
            [
                'title' => 'Renewable Energy Solutions for Island Communities',
                'slug' => 'renewable-energy-island-communities',
                'excerpt' => 'Implementing solar and wind energy systems to reduce dependency on fossil fuels.',
                'date' => '2023-03-22',
                'category' => 'Energy',
                'image' => 'https://placehold.co/600x400/FDB813/FFFFFF?text=Renewable+Energy',
                'pdf_url' => '#',
                'author' => 'Dr. Islam',
                'tags' => ['Renewable Energy', 'Solar Power', 'Wind Energy', 'Islands'],
                'read_time' => '5 minutes',
                'views' => 312,
                'is_featured' => true,
                'is_active' => true,
                'full_content' => '<div class="space-y-6"><div><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Island communities in Bangladesh have long been dependent on expensive and polluting diesel generators. This research explores the potential of renewable energy solutions to provide clean, affordable, and reliable electricity.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Solar Energy Solutions</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Solar home systems have been successfully implemented in several islands, providing electricity to thousands of households. Community solar mini-grids are now being explored as a scalable solution.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Wind Energy Potential</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Coastal areas and islands offer significant wind energy potential. Studies show that wind speeds are adequate for small to medium-scale wind turbines, particularly during monsoon seasons.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Hybrid Systems</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Combining solar and wind energy with battery storage creates reliable power supply systems. These hybrid systems can meet the energy needs of island communities while reducing carbon emissions.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Economic and Social Benefits</h2><ul class="list-disc pl-6 space-y-3"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Reduced energy costs for households and businesses</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Employment opportunities in installation and maintenance</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Improved education through reliable electricity for schools</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Enhanced healthcare services with powered medical equipment</li></ul></div></div>'
            ],
            [
                'title' => 'Biodiversity Conservation in the Sundarbans',
                'slug' => 'biodiversity-conservation-sundarbans',
                'excerpt' => 'Preserving the unique ecosystem of the world\'s largest mangrove forest.',
                'date' => '2023-05-05',
                'category' => 'Biodiversity',
                'image' => 'https://placehold.co/600x400/2D8659/FFFFFF?text=Sundarbans',
                'pdf_url' => '#',
                'author' => 'Dr. Khan',
                'tags' => ['Biodiversity', 'Sundarbans', 'Mangroves', 'Conservation'],
                'read_time' => '6 minutes',
                'views' => 156,
                'is_featured' => false,
                'is_active' => true,
                'full_content' => '<div class="space-y-6"><div><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">The Sundarbans, the world\'s largest mangrove forest, is a UNESCO World Heritage site that supports incredible biodiversity. This research highlights conservation efforts and challenges facing this unique ecosystem.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Floral Diversity</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">The Sundarbans hosts over 70 species of mangroves, including the iconic Sundari tree. The forest provides critical habitat for numerous plant species, many of which have medicinal properties.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Wildlife Conservation</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">The Sundarbans is home to the endangered Royal Bengal Tiger, as well as numerous species of birds, reptiles, and aquatic life. Conservation efforts focus on protecting these species and their habitats.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Threats to the Ecosystem</h2><ul class="list-disc pl-6 space-y-3"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Climate change and sea-level rise</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Illegal logging and poaching</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Pollution from upstream industries</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Declining freshwater flow due to upstream dams</li></ul><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Conservation Initiatives</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Several organizations are working on conservation projects including community-based forest management, tiger monitoring programs, and mangrove restoration efforts.</p></div></div>'
            ],
            [
                'title' => 'Community-Based Disaster Preparedness',
                'slug' => 'community-disaster-preparedness',
                'excerpt' => 'Strengthening local communities to respond effectively to natural disasters.',
                'date' => '2023-07-14',
                'category' => 'Disaster Management',
                'image' => 'https://placehold.co/600x400/E74C3C/FFFFFF?text=Disaster+Preparedness',
                'pdf_url' => '#',
                'author' => 'Prof. Hasan',
                'tags' => ['Disaster Management', 'Community', 'Cyclone', 'Flood'],
                'read_time' => '4 minutes',
                'views' => 278,
                'is_featured' => false,
                'is_active' => true,
                'full_content' => '<div class="space-y-6"><div><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Bangladesh is one of the most disaster-prone countries in the world. Community-based disaster preparedness has proven to be one of the most effective approaches to building resilience.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Early Warning Systems</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Community-based early warning systems, including cyclone shelters and mobile alerts, have significantly reduced casualties from cyclones and floods.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Local Response Teams</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Trained local volunteers form the backbone of disaster response. These teams conduct rescue operations, provide first aid, and assist in evacuation efforts.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Evacuation Planning</h2><ul class="list-disc pl-6 space-y-3"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Identification of safe zones and evacuation routes</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Regular evacuation drills and practice sessions</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Establishment of temporary shelters</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Stockpiling of emergency supplies</li></ul><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Post-Disaster Recovery</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Community-led recovery initiatives have proven more effective and sustainable than top-down approaches. These include livelihood restoration, psychological support, and rebuilding infrastructure.</p></div></div>'
            ],
            [
                'title' => 'Water Resource Management in Bangladesh',
                'slug' => 'water-resource-management-bangladesh',
                'excerpt' => 'Addressing water scarcity and quality issues through integrated management approaches.',
                'date' => '2023-09-01',
                'category' => 'Water Resources',
                'image' => 'https://placehold.co/600x400/3498DB/FFFFFF?text=Water+Resources',
                'pdf_url' => '#',
                'author' => 'Dr. Mahmud',
                'tags' => ['Water Resources', 'Management', 'Scarcity', 'Quality'],
                'read_time' => '5 minutes',
                'views' => 201,
                'is_featured' => false,
                'is_active' => true,
                'full_content' => '<div class="space-y-6"><div><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Water resource management is critical for Bangladesh\'s development. This research examines the challenges and opportunities in ensuring water security for the country\'s growing population.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Groundwater Depletion</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Excessive groundwater extraction for irrigation has led to declining water tables in many areas. Sustainable extraction practices and alternative water sources are needed.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Surface Water Quality</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Pollution from industrial and domestic sources has degraded surface water quality. Treatment facilities and pollution control measures are essential for protecting public health.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Water Conservation Strategies</h2><ul class="list-disc pl-6 space-y-3"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Rainwater harvesting systems</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Efficient irrigation methods</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Wastewater treatment and reuse</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Watershed management programs</li></ul><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Integrated Water Resource Management</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Adopting an integrated approach that considers all aspects of water management, including supply, quality, and ecosystem protection, is crucial for long-term sustainability.</p></div></div>'
            ],
            [
                'title' => 'Urbanization and Environmental Sustainability',
                'slug' => 'urbanization-environmental-sustainability',
                'excerpt' => 'Examining the environmental challenges of rapid urbanization in Bangladesh.',
                'date' => '2023-10-20',
                'category' => 'Urban Development',
                'image' => 'https://placehold.co/600x400/9B59B6/FFFFFF?text=Urbanization',
                'pdf_url' => '#',
                'author' => 'Dr. Sultana',
                'tags' => ['Urbanization', 'Environment', 'Sustainability', 'City Planning'],
                'read_time' => '4 minutes',
                'views' => 167,
                'is_featured' => false,
                'is_active' => true,
                'full_content' => '<div class="space-y-6"><div><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Rapid urbanization is transforming Bangladesh\'s landscape, creating both opportunities and challenges for sustainable development.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Urban Environmental Challenges</h2><ul class="list-disc pl-6 space-y-3"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Air and water pollution</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Waste management problems</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Loss of green spaces</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Heat island effects</li></ul><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Sustainable Urban Planning</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Adopting sustainable urban planning approaches can address these challenges. This includes promoting public transport, developing green buildings, and creating urban parks.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Community Participation</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Engaging communities in urban planning and environmental management is essential for creating sustainable and livable cities.</p></div></div>'
            ],
            [
                'title' => 'Digital Transformation in Education',
                'slug' => 'digital-transformation-education',
                'excerpt' => 'Exploring the impact of digital technologies on education in Bangladesh.',
                'date' => '2023-11-15',
                'category' => 'Education',
                'image' => 'https://placehold.co/600x400/E67E22/FFFFFF?text=Digital+Education',
                'pdf_url' => '#',
                'author' => 'Prof. Khan',
                'tags' => ['Education', 'Digital', 'Technology', 'E-Learning'],
                'read_time' => '4 minutes',
                'views' => 223,
                'is_featured' => false,
                'is_active' => true,
                'full_content' => '<div class="space-y-6"><div><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Digital transformation is reshaping education in Bangladesh, offering new opportunities for learning and skill development.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">E-Learning Platforms</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Online learning platforms have made education more accessible, particularly for students in remote areas. These platforms offer flexibility and personalized learning experiences.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Challenges and Solutions</h2><ul class="list-disc pl-6 space-y-3"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Digital divide and internet access</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Teacher training and digital literacy</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Content development and quality assurance</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Assessment and certification</li></ul><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Future Prospects</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Emerging technologies like artificial intelligence and virtual reality have the potential to further transform education, making it more engaging and effective.</p></div></div>'
            ],
            [
                'title' => 'Healthcare Innovations for Rural Communities',
                'slug' => 'healthcare-innovations-rural',
                'excerpt' => 'Exploring innovative healthcare solutions for underserved rural populations.',
                'date' => '2023-12-10',
                'category' => 'Healthcare',
                'image' => 'https://placehold.co/600x400/E74C3C/FFFFFF?text=Healthcare+Innovation',
                'pdf_url' => '#',
                'author' => 'Dr. Hossain',
                'tags' => ['Healthcare', 'Rural', 'Innovation', 'Access'],
                'read_time' => '5 minutes',
                'views' => 198,
                'is_featured' => false,
                'is_active' => true,
                'full_content' => '<div class="space-y-6"><div><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Rural communities in Bangladesh face significant barriers to accessing quality healthcare. This research explores innovative solutions to bridge the healthcare gap.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Telemedicine</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Telemedicine services have connected rural patients with specialist doctors in urban centers, reducing the need for travel and improving access to care.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Community Health Workers</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4">Trained community health workers play a vital role in delivering basic healthcare services, health education, and disease prevention programs in rural areas.</p><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Mobile Health Solutions</h2><ul class="list-disc pl-6 space-y-3"><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Health information apps</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Mobile diagnostic tools</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Remote patient monitoring</li><li class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Health awareness campaigns</li></ul><h2 class="font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4">Public-Private Partnerships</h2><p class="font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed">Collaborations between government, private sector, and NGOs have proven effective in scaling up innovative healthcare solutions in rural areas.</p></div></div>'
            ]
        ];

        foreach ($publications as $data) {
            // Generate slug from title if not provided
            if (!isset($data['slug'])) {
                $data['slug'] = Str::slug($data['title']);
            }

            // Re-running the seeder must update the seeded row, not append a
            // "-1" duplicate. The suffix is only for a slug genuinely taken
            // by a *different* publication.
            $existing = Publication::withTrashed()->where('slug', $data['slug'])->first();

            if ($existing && $existing->title === $data['title']) {
                $existing->forceFill($data)->save();

                continue;
            }

            $originalSlug = $data['slug'];
            $counter = 1;

            while (Publication::withTrashed()->where('slug', $data['slug'])->exists()) {
                $data['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }

            Publication::create($data);
        }

        $this->command->info('Publications seeded successfully!');
    }
}
