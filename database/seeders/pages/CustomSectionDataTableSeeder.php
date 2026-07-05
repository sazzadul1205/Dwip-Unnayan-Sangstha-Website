<?php
// database/seeders/pages/CustomSectionDataTableSeeder.php

namespace Database\Seeders\pages;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomSectionDataTableSeeder extends Seeder
{
  public function run(): void
  {
    $customSectionData = [
      [
        'id' => 1,
        'page_slug' => 'home',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"\/storage\/Banner\/64065404ef679e54d2dabd90bba3b1744817c578.webp","alt":"Background"},"overlay":{"darkOverlay":"bg-black\/40 lg:bg-black\/50","gradient":"bg-gradient-to-r from-black\/85 via-black\/10 to-transparent"},"content":{"tagline":{"text":"Together, We Create Impact","className":"uppercase tracking-[4px] font-semibold"},"title":{"text":"Be the Light for Someone in Need","className":"font-bold leading-tight"},"description":{"text":"Your kindness has the power to change lives. Join us in bringing hope, support, and brighter futures to those in need. Every donation makes a difference big or small.","className":"font-normal leading-tight"}},"buttons":[{"id":1,"text":"Become a Volunteer","variant":"primary","className":"bg-[#009BE2] text-white hover:bg-[#009BE2]\/80","icon":true},{"id":2,"text":"How can I help?","variant":"secondary","className":"bg-white\/90 lg:bg-white text-black hover:bg-white","icon":true}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 2,
        'page_slug' => 'home',
        'section_key' => 'about-us',
        'data' => '{"section":{"title":"About us","description":"A Community based philanthropic and development organization emergence\/dedicated to sustainable poverty reduction, entrepreneur\'s promotion and capacity building of the underprivileged directing towards a just society. Interventions, DUS strives to bring about positive change in the quality of life of the poor community of rural Bangladesh.","button":{"text":"More about us","link":"\/about"}},"mission":{"title":"The mission of our organization","items":[{"id":1,"icon":"\/storage\/AboutUs\/65af8a95ec6612fa3ef2941b_011-charity-1%201.svg","title":"Education for All","description":"Charity is dedicated to ensuring that every child has access to quality education.","alt":"Education Icon"},{"id":2,"icon":"\/storage\/AboutUs\/65af8a95c570e47bd1123b4e_033-hospital%201.svg","title":"Health and Wellness","description":"Our commitment to health and wellness extends across borders.","alt":"Health Icon"},{"id":3,"icon":"\/storage\/AboutUs\/65af8a95cee257c23ab03ff8_040-shelter%201.svg","title":"Disaster Relief","description":"In times of crisis, Charity responds swiftly to provide emergency relief.","alt":"Disaster Relief Icon"},{"id":4,"icon":"\/storage\/AboutUs\/65af8a958d27ad8d830434f4_022-family-1%201.svg","title":"Community Development","description":"Charity invests in sustainable community development projects to create.","alt":"Community Development Icon"}]},"impact":{"title":"Impact In Numbers","stats":[{"id":1,"value":"20","suffix":"+","label":"Years of Service"},{"id":2,"value":"15","suffix":"+","label":"Project Program"},{"id":3,"value":"10","suffix":"+","label":"Award Received"}]},"image":{"src":"\/storage\/AboutUs\/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff.webp","alt":"About Us Image"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 3,
        'page_slug' => 'home',
        'section_key' => 'our-action',
        'data' => '{"section":{"title":"Our Actions for Social Change","description":"We turn compassion into action by implementing community-led programs, advocating for social justice, and promoting education, health, and equality"},"actions":[{"id":1,"icon":"\/storage\/OurActions\/fi_1940611.svg","title":"Education","description":"We empower communities by investing in sustainable projects, training livelihood programs.","alt":"Education Icon"},{"id":2,"icon":"\/storage\/OurActions\/fi_14888982.svg","title":"Microfinance","description":"We empower communities by investing in sustainable projects, training livelihood programs.","alt":"Microfinance Icon"},{"id":3,"icon":"\/storage\/OurActions\/fi_3004451.svg","title":"Health","description":"Providing nutritious meals and groceries to individuals and families in need.","alt":"Health Icon"},{"id":4,"icon":"\/storage\/OurActions\/fi_17316107.svg","title":"Organizational Development","description":"We empower underprivileged children with the opportunity to learn, grow, and succeed.","alt":"Organizational Development Icon"},{"id":5,"icon":"\/storage\/OurActions\/fi_6786176.svg","title":"Climate Change","description":"From free medical camps to life-saving treatments, we support initiatives that provide critical aid to access to proper.","alt":"Climate Change Icon"},{"id":6,"icon":"\/storage\/OurActions\/fi_1176562.svg","title":"Human Rights","description":"From free medical camps to life-saving treatments, we support initiatives that provide critical aid to access to proper.","alt":"Human Rights Icon"},{"id":7,"icon":"\/storage\/OurActions\/fi_8992468.svg","title":"Human Resource","description":"Bringing clean and safe drinking water to communities, improving sanitation, and preventing waterborne diseases.","alt":"Human Resource Icon"},{"id":8,"icon":"\/storage\/OurActions\/fi_726211.svg","title":"Social Enterprises","description":"We empower communities by investing in sustainable projects, training livelihood programs.","alt":"Social Enterprises Icon"},{"id":9,"icon":"\/storage\/OurActions\/fi_4994126.svg","title":"Agriculture Food Security","description":"Bringing clean and safe drinking water to communities, improving sanitation, and preventing waterborne diseases.","alt":"Agriculture Food Security Icon"}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 4,
        'page_slug' => 'home',
        'section_key' => 'where-we-work',
        'data' => '{"section":{"title":"Where We Work"},"stats":[{"id":1,"icon":"\/storage\/WhereWeWork\/image%206-3.png","value":"450K","label":"Total Member Reach","alt":"Member Reach Icon"},{"id":2,"icon":"\/storage\/WhereWeWork\/image%206-2.png","value":"41,382","label":"Mail Engaged in Divers Livelihoods Options","alt":"Member Reach Icon"},{"id":3,"icon":"\/storage\/WhereWeWork\/image%206-1.png","value":"35,193","label":"Women Engaged in Diverse Livelihoods Options","alt":"Member Reach Icon"},{"id":4,"icon":"\/storage\/WhereWeWork\/image%206.png","value":"35,193","label":"Women Engaged in Diverse Livelihoods Options","alt":"Mail Engaged Icon"},{"id":5,"icon":"\/storage\/WhereWeWork\/image%206-1.png","value":"38.0 M","label":"Digital media Outreach","alt":"Women Engaged Icon"},{"id":6,"icon":"\/storage\/WhereWeWork\/image%206.png","value":"35,193","label":"Women Engagement in Diverse Livelihood Options","alt":"Mail Engaged Icon"}],"image":{"src":"\/storage\/WhereWeWork\/image.png","alt":"Map Place holder Text","className":"w-full h-232.5 object-cover rounded-4xl"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 6,
        'page_slug' => 'home',
        'section_key' => 'jobs',
        'data' => '{
        "section": {
            "title": "Join our big family",
            "description": "Join us on this journey of kindness, and let\'s make a difference, one act of charity at a time.",
            "limit": 5
        },
        "filter": {"placeholder": "Browse By"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 7,
        'page_slug' => 'home',
        'section_key' => 'program-impact',
        'data' => '{"section":{"title":"Program Impact and SDGs","mainImage":{"images":["\/storage\/ProgramImpact\/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff%20(1).webp","\/storage\/ProgramImpact\/64065404ef679e54d2dabd90bba3b1744817c578.webp","\/storage\/ProgramImpact\/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff%20(1).webp","\/storage\/ProgramImpact\/64065404ef679e54d2dabd90bba3b1744817c578.webp"]}},"sdgImages":[{"id":1,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18732_www.figma.com.webp","alt":"No Poverty"},{"id":2,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18742_www.figma.com.webp","alt":"Zero Hunger"},{"id":3,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18750_www.figma.com.webp","alt":"Good Health"},{"id":4,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_1887_www.figma.com.webp","alt":"Quality Education"},{"id":5,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18823_www.figma.com.webp","alt":"Gender Equality"},{"id":6,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18837_www.figma.com.webp","alt":"Clean Water"},{"id":7,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_1894_www.figma.com.webp","alt":"Clean Energy"},{"id":8,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18913_www.figma.com.webp","alt":"Decent Work"},{"id":9,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18920_www.figma.com.webp","alt":"Industry Innovation"},{"id":10,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18930_www.figma.com.webp","alt":"Reduced Inequalities"},{"id":11,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18939_www.figma.com.webp","alt":"Sustainable Cities"},{"id":12,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18949_www.figma.com.webp","alt":"Responsible Consumption"},{"id":13,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_18108_www.figma.com.webp","alt":"Climate Action"},{"id":14,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_181017_www.figma.com.webp","alt":"Life Below Water"},{"id":15,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_181031_www.figma.com.webp","alt":"Life On Land"},{"id":16,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_181046_www.figma.com.webp","alt":"Peace Justice"},{"id":17,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_181055_www.figma.com.webp","alt":"Partnerships"},{"id":18,"src":"\/storage\/ProgramImpact\/Screenshot_17-5-2026_181133_www.figma.com.webp","alt":"SDG 18"}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 8,
        'page_slug' => 'about',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"\/storage\/AboutUs\/9734ab42cfed2d40c8ed08cbc3059b227d9aee8b.jpg","alt":"Background"},"overlay":{"darkOverlay":"bg-black\/40 lg:bg-black\/50","gradient":"bg-gradient-to-r from-black\/85 via-black\/10 to-transparent"},"content":{"title":{"text":"About Us","className":"font-bold leading-tight"},"description":{"text":"Our mission is to help all the people in need","className":"font-normal leading-tight"}}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 9,
        'page_slug' => 'about',
        'section_key' => 'background',
        'data' => '{"section":{"title":"Background, Roles and Functions"},"content":{"html":"<div class=\\"space-y-6\\"><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Background:<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">The emergence and existence of Dwip Unnayan Songstha (Island Development Association)- DUS was based upon asserting the victims of The Liberation War in 1971 as well as providing immediate relief support to the worse suffer being affected by the devastating cyclone flown over the coastal areas of Bangladesh in 1970.<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">DUS, by virtue of its roles, functions and services being visioned and dreamt by the founder and associates, is basically a development and philanthropic organization located at Hatiya Island under Noakhali district in southern Bangladesh. The main focus and concentration of the organization since its inception has been to humanitarian and rehabilitation work for war and cyclone victim affected populations which in the passage of time has turned into integrated socio-economic and sustainable community development services directing towards a just society free from all sorts of exploitation, injustice and deprivation.<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Until 1981, DUS has been well-thought-out and recognized as a volunteer initiative for providing aid, relief and rehabilitation related activities and gaining experiences on the said services over last one decade since its inception, the structural based organizational formation took into shape in 1982, announcing its mandate as an association\/platform for land development, protection and restoration.<\/p><\/div><\/div>"},"btn":{"text":"Learn More About Functions","link":"\/about\/functions"},"image":{"src":"\/storage\/AboutUs\/f465fcbdab4004cd25dba4df06b9f8d5f2648620.jpg","alt":"Background","className":"w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 10,
        'page_slug' => 'about',
        'section_key' => 'vision-mission',
        'data' => '{"section":{"title":"Vision, Mission, Goal, Objectives and Core values"},"content":{"html":"<div class=\\"space-y-6\\"><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Vision<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">DUS dreams the existence of a society free from all sorts of exploitation where everyone irrespective of class, creed and cast will enjoy equal rights, freedom and justice leading an equitable and gender balanced communities.<\/p><\/div><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Mission<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">Coastal areas of Bangladesh are regularly stricken by natural disasters. Most of the people living here are almost poor. Due to regular natural disasters occurs here inhabitants are lacking asset and resources and they are deepened in illiterate, malnourished and culturally remain backward. DUS believes that optimizing utilization of hidden humane capacity & power and local resources intensively could gradually alleviate this condition. It perceives to bring down all this scope of development affords in an integrated manner so that sustainable livelihood ventures emerge in the community according to their aspiration.<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Initiating, activating, promoting and facilitating the sustainable development of the targeted population through capacity building, resource mobilization, networking, lobbying, need assessment, impact analysis, research, evaluation and policy advocacy in order to ensure and protected equal human rights, freedom, justice in all shape of individual, family and community life in all interventional areas.<\/p><\/div><\/div>"},"btn":{"text":"Learn More About Vision, Mission, Goal","link":"\/about\/vision-mission"},"image":{"src":"\/storage\/AboutUs\/c9c3585f93806d98cf9e2fbeadccb32a66efb4b5.jpg","alt":"Vision and Mission","className":"w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 11,
        'page_slug' => 'about',
        'section_key' => 'interventional',
        'data' => '{"section":{"title":"Interventional Approaches and DUS Priorities"},"content":{"html":"<div class=\\"space-y-6\\"><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Sustainable Poverty Reduction and Human Development:<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">The development interventional unit of GoB is each Household. DUS believes if the member of the HHs are developed then they can play an active role to bring immense changes within their families. As a whole each household take part into the process of socio-economic development of the country.<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">This Organization\'s aim to help its member\'s inherent abilities to flourish such a way so that they are endowed with the key to their progress to a sustainable livelihood restoration. With renewed confidence and hope, the poor, then, move ahead and break free from the shackles of multidimensional poverty and indignity and achieve living standards characterized by human freedom and dignity, along with material uplift.<\/p><\/div><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Focus on Landless poor<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">DUS concentrates on the settlement of landless poor families who are victims of major riverbank erosion & affected by several natural disasters like tropical cyclone, salinity, tidal surge etc that are living below poverty line in the coastal district of Bangladesh.<\/p><\/div><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Empowerment of Women<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Over 87% of our target population\/beneficiaries are poor women. DUS believes if women are empowered towards right direction, they can play an active role to bring vital changes within their families as well as in the communities.<\/p><\/div><\/div>"},"btn":{"text":"Learn More About Interventional Approaches","link":"\/about\/interventional-approaches"},"image":{"src":"\/storage\/AboutUs\/d3afc7e94d5609f2c2356758f463ee15af0450fe.jpg","alt":"Interventional Approaches","className":"w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 12,
        'page_slug' => 'about',
        'section_key' => 'legal',
        'data' => '{"background":{"src":"\/storage\/AboutUs\/64065404ef679e54d2dabd90bba3b1744817c578.jpg","alt":"Background"},"overlay":{"darkOverlay":"bg-black\/40"},"textBox":{"title":"Legal Status and Org.","titleLine2":"Affiliations","buttonText":"Learn More Affiliations","buttonLink":"\/about\/legal-affiliations"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 13,
        'page_slug' => 'about',
        'section_key' => 'evolutionary',
        'data' => '{"section":{"title":"Evolutionary Changes and Footings"},"content":{"html":"<div class=\\"space-y-6\\"><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Year 1972-1985<\/h2><ul class=\\"list-disc pl-5 space-y-2 mb-4\\"><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">DUS was formed by a group of young volunteers and started working for the victims of Bangladesh Liberation War of 1971 and devastating 1970 cyclone affected households at Hatiya Island focusing on humanitarian service to mankind<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Relief and rehabilitation program for the victims and initiate disaster management program at local level<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Rehabilitation of 2000 landless river bank eroded farmers in the newly accreted Govt. Khash land<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">DUS turn into an organizational shape and named as Dwip Unnayan Sangstha in 1982<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Community Mobilization and revolving credit support to community started in 1984<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Registered with Ministry of Social Services &amp; Welfare.<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Registered with NGO Affairs Bureau.<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Socio-economic development programs for the poor initiative from 1985<\/li><\/ul><\/div><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Year 1986-2000<\/h2><ul class=\\"list-disc pl-5 space-y-2\\"><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Strengthening Local Govt. bodies through capacity building in good governance, accountancy and resource management supported by IVS\/ USAID<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Capacity building of Union Parishad and Upazila Parishad for effective disaster management in four coastal district of Bangladesh supported by CARE-Bangladesh &amp; USAID<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Island fisheries development project implementation supported by DFID.<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Disaster rehabilitation support project implementation supported by AusAid\/Oxfam-America\/Oxfam-UK, Oxfam-Hong Kong British ODA<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Cyclone shelter Construction supported by CAA Australia<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Housing support for poor supported by British ODA\/CARE-Bangladesh\/AusAid<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Livestock development for poor supported by DANIDA, CIDA<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Integrated Socio-economic development program supported by Oxfam-UK<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Emergency Relief and Rehabilitation for Cyclone in coastal islands supported by Oxfam-UK, British ODA, CARE-Bangladesh<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Livelihood Rehabilitation for Flood Affected Fisheries Households in Hatiya Island supported by DFID<\/li><li class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Flood 98 Rehabilitation program supported by DFID, Oxfam-GB<\/li><\/ul><\/div><\/div>"},"btn":{"text":"Learn More About 2001 - 2020","link":"\/about\/evolutionary-changes"},"image":{"src":"\/storage\/AboutUs\/962bd5ee9dacf1f4261d0592856f5716dcffb725.jpg","alt":"Evolutionary Changes","className":"w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 14,
        'page_slug' => 'about',
        'section_key' => 'governance',
        'data' => '{"section":{"title":"Governance"},"content":{"html":"<div class=\\"space-y-6\\"><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">DUS believes in democratic practice and public-private participation to achieve its goal, purpose and objectives and accordingly the internal management system has been framed comprising the following structures:<\/p><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">General Body<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">The General Body consists of 31 members who are the permanent resident of the coastal community. Of them 30% are women. The social and professional status of the members include teachers, lawyers, social workers, freedom fighters and community leaders.<\/p><\/div><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Executive Committee<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">DUS has an Executive Committee of 7 members duly elected by the General Body for a period of three years. DUS is represented by its Executive Director who is the Member Secretary of the Executive Committee. ED and his core staff members are appointed by the board. Executive Director is treated as the Chief Executive of the organization. The Executive Director is the overall authority to implement the projects and programs on behalf of the Executive Committee.<\/p><\/div><\/div>"},"btn":{"text":"Learn More About Governance","link":"\/about\/governance"},"image":{"src":"\/storage\/AboutUs\/ce88efc81f8b1fe8d4f757eba85f05717acb68e4.jpg","alt":"Governance","className":"w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 15,
        'page_slug' => 'about',
        'section_key' => 'cards',
        'data' => '{"section":{"title":"Cards Section"},"cards":[{"id":"operational-areas","image":{"src":"\/storage\/AboutUs\/image.png","alt":"Operational Areas","className":"mx-auto object-contain"},"title":"Operational Areas","buttonText":"Explore Our Areas of Operation","buttonLink":"\/about\/operational-areas","bgColor":"bg-[#F5F5F5]","cardBgColor":"bg-white"},{"id":"achievements","image":{"src":"\/storage\/AboutUs\/fcbbf1e10ca75bccf6a608e1de01306d56897811.png","alt":"Our Achievements","className":"mx-auto object-contain"},"title":"Our Achievements","buttonText":"Explore Our Evolution","buttonLink":"\/about\/achievements","bgColor":"bg-[#F5F5F5]","cardBgColor":"bg-white"}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 16,
        'page_slug' => 'about',
        'section_key' => 'programs-activities',
        'data' => '{"section":{"title":"Programs\/Activities"},"content":{"html":"<div class=\\"space-y-6\\"><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Micro-Finance Program<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">Micro finance Program is the core program of all DUS activities. DUS has been implementing its major program in partnership with Palli Karma Sahayak Foundation (PKSF) since 2000. It provides collateral free micro-credit to its around 40K+ group members where 97 percent are female. Under this program, DUS has savings scheme for poor women who has no access in mainstream banks due to lack of capital and assets.<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Most of the targeted beneficiaries of DUS are poor women, marginal farmers and small micro entrepreneurs. Major borrowers are women who used these loan funds to promote various income generating activities for their earnings and employments. As a result, micro finance program has positive impact on poverty reduction especially at grass rote level, income enhancement, consumption, the promotion of rural businesses, education and health and finally the empowerment of women and their employment in rural island communities.<\/p><\/div><div><h2 class=\\"font-700 text-xl sm:text-2xl mb-4 text-[#080C14]\\">Jagoron<\/h2><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">Jagoron is the name of a credit instrument of PKSF to initiate household based enterprise development in Bangladesh. As a Partner Organization of PKSF, DUS is implementing this program which is now comprised with Rural Micro finance and Urban Micro finance. Rural Micro finance is that types of loan which allows rural women to finance their small scale agriculture production at homestead level.<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">RMC Loans are allowed as working capital loans to promote poor and disadvantaged households in income earnings. RMC loan range from 10K to 59K to allowed for one year and service charge is 24% (Reducing Balancing Method)\/12.0% (Flat Rate Method) per year. The weekly savings of RMC members are 10\/= per week.<\/p><\/div><\/div>"},"btn":{"text":"Learn More About Programs","link":"\/about\/programs-activities"},"image":{"src":"\/storage\/AboutUs\/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff.jpg","alt":"Programs","className":"w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 17,
        'page_slug' => 'about',
        'section_key' => 'training',
        'data' => '{"section":{"title":"Training and Other Facilities"},"content":{"html":"<div class=\\"space-y-6\\"><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">DUS believes that training is a key element of the development approach which focuses on people and their participation. Training has been introduced as an essential element of DUS\'s intervention strategy.<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">DUS takes up need based training programs, prepares module and training curriculum. The training programs generally involve flip chart, posters, handouts, cards &amp; charts, audiocassettes, videocassettes, original model, curriculum, modules, photographs etc. DUS has already developed a training and communication Unit fully equipped with all possible physical and human resources. DUS is organized different type of training since last two decades:<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">DUS is organized different type of training for its staffs as well as beneficiaries. DUS always prepare its yearly training plan which is incorporated basic skill development training for staffs, MIS, ToT general, Branch management and Finance management etc.<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug mb-4\\">DUS conducts it\'s skill development training through identification of people who need skill training. This is done by conducting survey to identify marketable skills, developing modules of livelihood skills program, conducting training to the selected people, select graduates of the skill program to receive capital, linking other graduates to employment or credit program, following up the graduates to see whether they are able to achieve sustainable livelihood. The skills training programs include tree nursery management, sustainable agriculture, poultry and cattle rearing etc.<\/p><p class=\\"font-400 text-[16px] sm:text-[18px] lg:text-[20px] text-[#333333] leading-snug\\">Leadership development training is a very important intervention of DUS. Leadership development training is intended for the group members under different project interventions. The training programs focus financial management of community fund, conflict management, and bottom-up planning for sustainable rural livelihoods.<\/p><\/div>"},"btn":{"text":"Learn More About DUS Facilities","link":"\/about\/facilities"},"image":{"src":"https:\/\/placehold.co\/730x730","alt":"Training Facilities","className":"w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 18,
        'page_slug' => 'about-details',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"\/storage\/OurPrograms\/db1b2b6eae5fc260b4204f8257dadbd5a7aa0af7.png","alt":"Background"},"overlay":{"darkOverlay":"bg-black\/40 lg:bg-black\/50","gradient":"bg-gradient-to-r from-black\/85 via-black\/10 to-transparent"},"content":{"title":{"text":"Vision, Mission, Goal, Objectives and Core values","className":"font-bold leading-tight"}}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 19,
        'page_slug' => 'projects-programs',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"https:\/\/placehold.co\/1920x589","alt":"Background"},"overlay":{"darkOverlay":"bg-black\/40 lg:bg-black\/50","gradient":"bg-gradient-to-r from-black\/85 via-black\/10 to-transparent"},"content":{"title":{"text":"Meet Our Charity Projects","className":"font-bold leading-tight"}}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 20,
        'page_slug' => 'projects-programs-details',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"\/storage\/OurPrograms\/db1b2b6eae5fc260b4204f8257dadbd5a7aa0af7.png","alt":"Background"},"overlay":{"darkOverlay":"bg-black\/40 lg:bg-black\/50","gradient":"bg-gradient-to-r from-black\/85 via-black\/10 to-transparent"},"content":{"title":{"text":"Micro-Finance Program","className":"font-bold leading-tight"}}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 21,
        'page_slug' => 'blog',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"\/storage\/OurPrograms\/db1b2b6eae5fc260b4204f8257dadbd5a7aa0af7.png","alt":"Background"},"overlay":{"darkOverlay":"bg-black\/40 lg:bg-black\/50","gradient":"bg-gradient-to-r from-black\/85 via-black\/10 to-transparent"},"content":{"title":{"text":"Blog","className":"font-bold leading-tight"}}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 22,
        'page_slug' => 'blog-details',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"\/storage\/OurPrograms\/db1b2b6eae5fc260b4204f8257dadbd5a7aa0af7.png","alt":"Background"},"overlay":{"darkOverlay":"bg-black\/40 lg:bg-black\/70"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 23,
        'page_slug' => 'contact',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"\/storage\/OurPrograms\/db1b2b6eae5fc260b4204f8257dadbd5a7aa0af7.png","alt":"Background"},"overlay":{"darkOverlay":"bg-black\/40 lg:bg-black\/50","gradient":"bg-gradient-to-r from-black\/85 via-black\/10 to-transparent"},"content":{"title":{"text":"Let\'s Get in Touch","className":"font-bold leading-tight"},"description":{"text":"Reach out today and let\'s create meaningful, lasting positive change together worldwide","className":"font-normal leading-tight"}}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 24,
        'page_slug' => 'contact',
        'section_key' => 'contact-offices',
        'data' => '[{"title":"Head Office","address":"24\/5 Mollika, Prominent Housing, 3 Pisciculture Road, Mohammadpur, Dhaka -1207.","phones":["+880 1761-493412","+880 1781 732352"],"emails":["dusdhaka@gmail.com","dus.eddus@gmail.com"],"map_url":"https:\/\/www.google.com\/maps?q=23.7570,90.3620&output=embed","coordinates":{"lat":23.757,"lng":90.362},"is_active":true},{"title":"Regional Office","address":"Delower Commission Road, Sonapur, Sadar, Noakhali","phones":["+880 1761-493411","+880 1761-493414"],"emails":["dusreg@gmail.com"],"map_url":"https:\/\/www.google.com\/maps?q=22.8256,91.1039&output=embed","coordinates":{"lat":22.8256,"lng":91.1039},"is_active":false},{"title":"Foundation Office","address":"DUS Centre, Sayedia Bazar, Hatiya, Noakhali","phones":["+880 1761-493418","+880 1673-011347"],"emails":["dusreg@gmail.com"],"map_url":"https:\/\/www.google.com\/maps?q=22.4082,91.0909&output=embed","coordinates":{"lat":22.4082,"lng":91.0909},"is_active":false}]',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 25,
        'page_slug' => 'contact',
        'section_key' => 'contact-reach',
        'data' => '{"image":"\/storage\/ContactUs\/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff.jpg","title":"Reach out to us today!","buttonText":"Submit Message"}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 26,
        'page_slug' => 'contact',
        'section_key' => 'follow-us',
        'data' => '[{"icon":"facebook","label":"Facebook","url":"#"},{"icon":"instagram","label":"Instagram","url":"#"},{"icon":"linkedin","label":"LinkedIn","url":"#"},{"icon":"youtube","label":"YouTube","url":"#"},{"icon":"twitter","label":"X","url":"#"}]',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 27,
        'page_slug' => 'contact',
        'section_key' => 'address',
        'data' => '[{"id":"head-office","label":"Head Office","address":"24\/5 Mollika, Prominent Housing, 3 Pisciculture Road, Mohammadpur, Dhaka -1207.","mapUrl":"https:\/\/www.google.com\/maps?q=23.7570,90.3620&output=embed","coordinates":{"lat":23.757,"lng":90.362},"phones":["+880 1761-493412","+880 1781 732352"],"emails":["dusdhaka@gmail.com","dus.eddus@gmail.com"]},{"id":"regional-office","label":"Regional Office","address":"Delower Commission Road, Sonapur, Sadar, Noakhali","mapUrl":"https:\/\/www.google.com\/maps?q=22.8256,91.1039&output=embed","coordinates":{"lat":22.8256,"lng":91.1039},"phones":["+880 1761-493411","+880 1761-493414"],"emails":["dusreg@gmail.com"]},{"id":"foundation-office","label":"Foundation Office","address":"DUS Centre, Sayedia Bazar, Hatiya, Noakhali","mapUrl":"https:\/\/www.google.com\/maps?q=22.4082,91.0909&output=embed","coordinates":{"lat":22.4082,"lng":91.0909},"phones":["+880 1761-493418","+880 1673-011347"],"emails":["dusreg@gmail.com"]}]',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // PUBLICATIONS PAGE BANNER (formerly Media)
      // ============================================
      [
        'id' => 29,
        'page_slug' => 'publications',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"/storage/Publications/banner-default.jpg","alt":"Publications Banner"},"overlay":{"darkOverlay":"bg-black/40 lg:bg-black/50","gradient":"bg-gradient-to-r from-black/85 via-black/10 to-transparent"},"content":{"title":{"text":"Publications","className":"font-bold leading-tight"},"description":{"text":"Reach out today and let’s create meaningful, lasting positive change together worldwide","className":"font-normal leading-tight"}}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // PUBLICATIONS DETAILS PAGE BANNER (formerly Media Details)
      // ============================================
      [
        'id' => 30,
        'page_slug' => 'publications-details',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"/storage/Publications/banner-detail-default.jpg","alt":"Publications Banner"},"overlay":{"darkOverlay":"bg-black/40 lg:bg-black/70"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // GALLERY PAGE
      // ============================================
      [
        'id' => 31,
        'page_slug' => 'gallery',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"/storage/Gallery/banner-default.jpg","alt":"Gallery Banner"},"overlay":{"darkOverlay":"bg-black/40 lg:bg-black/50","gradient":"bg-gradient-to-r from-black/85 via-black/10 to-transparent"},"tagTitle":"Our Gallery","tags":[{"label":"All","color":"#009BE2"},{"label":"Community Impact","color":"#FF6B6B"},{"label":"Education","color":"#4ECDC4"},{"label":"Microfinance","color":"#FFE66D"},{"label":"Climate Action","color":"#6C5CE7"},{"label":"Women Empowerment","color":"#FD79A8"}],"activeTag":"All"}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 32,
        'page_slug' => 'gallery',
        'section_key' => 'image-gallery',
        'data' => '{"sectionTitle":"DUS in Action","imageCountLabel":"Images","images":[{"id":1,"src":"https://placehold.co/600x400/009BE2/FFFFFF?text=Image+1","alt":"Gallery image 1","title":"Community Workshop"},{"id":2,"src":"https://placehold.co/600x400/FF6B6B/FFFFFF?text=Image+2","alt":"Gallery image 2","title":"Education Program"},{"id":3,"src":"https://placehold.co/600x400/4ECDC4/FFFFFF?text=Image+3","alt":"Gallery image 3","title":"Microfinance Group"},{"id":4,"src":"https://placehold.co/600x400/FFE66D/FFFFFF?text=Image+4","alt":"Gallery image 4","title":"Climate Action"},{"id":5,"src":"https://placehold.co/600x400/A8E6CF/FFFFFF?text=Image+5","alt":"Gallery image 5","title":"Women Empowerment"},{"id":6,"src":"https://placehold.co/600x400/FF8A5C/FFFFFF?text=Image+6","alt":"Gallery image 6","title":"Community Radio"}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
      [
        'id' => 33,
        'page_slug' => 'gallery',
        'section_key' => 'video-gallery',
        'data' => '{"sectionTitle":"Video Gallery","videoCountLabel":"Videos","videos":[{"id":1,"title":"DUS Impact Story","description":"Watch how DUS is making a difference in coastal communities through sustainable development programs.","src":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","thumbnail":"https://placehold.co/600x400/009BE2/FFFFFF?text=Video+1"},{"id":2,"title":"Microfinance Success Stories","description":"Real stories of women entrepreneurs who transformed their lives through microfinance programs.","src":"https://www.youtube.com/watch?v=9bZkp7q19f0","thumbnail":"https://placehold.co/600x400/FF6B6B/FFFFFF?text=Video+2"},{"id":3,"title":"Community Radio - Voice of the Island","description":"How community radio is empowering local voices and connecting communities in Hatiya Island.","src":"https://www.youtube.com/watch?v=wZZ7oFKsKzY","thumbnail":"https://placehold.co/600x400/4ECDC4/FFFFFF?text=Video+3"}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // JOBS PAGE BANNER
      // ============================================
      [
        'id' => 34,
        'page_slug' => 'jobs',
        'section_key' => 'banner',
        'data' => '{"background":{"src":"/storage/Jobs/banner-default.jpg","alt":"Career Opportunities"},"overlay":{"darkOverlay":"bg-black/40 lg:bg-black/50","gradient":"bg-gradient-to-r from-black/85 via-black/10 to-transparent"},"content":{"title":{"text":"Join Our Team","className":"font-bold leading-tight"},"description":{"text":"Build a meaningful career while making a difference in coastal communities","className":"font-normal leading-tight"}}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // JOBS PAGE - JOB LISTINGS SECTION
      // ============================================
      [
        'id' => 35,
        'page_slug' => 'jobs',
        'section_key' => 'jobs',
        'data' => '{"section":{"title":"Current Openings","description":"Join us in our mission to create sustainable change in coastal communities. We are looking for passionate individuals who want to make a difference.","button":{"text":"View All Positions","link":"/jobs"}},"filters":{"categories":["All","Program Management","Finance & Accounting","Field Operations","Communications","Administration"],"locations":["All","Dhaka","Noakhali","Hatiya","Remote"]},"jobs":[]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
    ];

    DB::table('custom_section_data')->insert($customSectionData);
  }
}
