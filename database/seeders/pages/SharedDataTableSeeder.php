<?php
// database/seeders/pages/SharedDataTableSeeder.php

namespace Database\Seeders\pages;

use Illuminate\Database\Seeder;
use Database\Seeders\Concerns\SeedsTable;
use Illuminate\Support\Facades\DB;

class SharedDataTableSeeder extends Seeder
{
  use SeedsTable;

  public function run(): void
  {
    $sharedData = [
      // ============================================
      // TOPBAR DATA
      // ============================================
      [
        'id' => 1,
        'type' => 'topbar',
        'data' => '{"contactInfo":{"email":{"text":"dus.eddus@gmail.com","icon":"\/storage\/images\/TopBar\/Email.svg","alt":"Email"},"phone":{"text":"+880 1761-493412","icon":"\/storage\/images\/TopBar\/Phone.svg","alt":"Phone"},"hours":{"text":"Sun - Thu 9:00AM - 5:00PM","icon":"\/storage\/images\/TopBar\/Clock.svg","alt":"Clock"}},"languages":[{"code":"us","name":"English","flag":"\/storage\/images\/Flags\/united-states.png"},{"code":"bd","name":"Bengali","flag":"\/storage\/images\/Flags\/bangladesh.png"}],"socialLinks":[{"id":1,"name":"Facebook","url":"https:\/\/facebook.com","iconName":"FaFacebook","hoverColor":"hover:text-blue-400"},{"id":2,"name":"Instagram","url":"https:\/\/instagram.com","iconName":"FaInstagram","hoverColor":"hover:text-pink-400"},{"id":3,"name":"Twitter","url":"https:\/\/twitter.com","iconName":"FaXTwitter","hoverColor":"hover:text-gray-400"},{"id":4,"name":"LinkedIn","url":"https:\/\/linkedin.com","iconName":"FaLinkedin","hoverColor":"hover:text-blue-500"}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // NAVBAR DATA
      // ============================================
      [
        'id' => 2,
        'type' => 'navbar',
        'data' => '{"logo":{"src":"\/storage\/images\/Icon.svg","alt":"DUS Logo","className":"h-17.5 w-auto","href":"\/"},"navLinks":[{"name":"Home","href":"\/"},{"name":"About","href":"\/about"},{"name":"Projects & Programs","href":"\/projects-programs"},{"name":"Gallery","href":"\/gallery"},{"name":"Publications","href":"\/publications"},{"name":"Blogs","href":"\/blog"},{"name":"Jobs","href":"\/jobs"},{"name":"More","href":"#","children":[{"name":"Contact","href":"\/contact"},{"name":"Terms of Service","href":"\/terms"},{"name":"Privacy Policy","href":"\/privacy"}]}],"button":{"text":"Contact Us","href":"\/contact","className":"capitalize text-white bg-[#009BE2] hover:bg-[#009BE2]\/80 px-6 py-2 rounded-lg transition-colors duration-200"}}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // FOOTER DATA
      // ============================================
      [
        'id' => 3,
        'type' => 'footer',
        'data' => '{"logo":{"src":"\/storage\/images\/Icon-bottom.svg","alt":"DUS Logo","className":"h-41.25 w-auto"},"description":"A Community based philanthropic and development organization emergence\/dedicated to sustainable poverty reduction, entrepreneur\'s promotion and capacity building of the underprivileged directing towards a just society","socialLinks":[{"iconName":"FaFacebook","url":"#","hoverColor":"hover:text-blue-400","ariaLabel":"Facebook"},{"iconName":"FaInstagram","url":"#","hoverColor":"hover:text-pink-400","ariaLabel":"Instagram"},{"iconName":"FaXTwitter","url":"#","hoverColor":"hover:text-gray-400","ariaLabel":"Twitter"},{"iconName":"FaLinkedin","url":"#","hoverColor":"hover:text-blue-500","ariaLabel":"LinkedIn"}],"address":{"title":"Address","details":"24\/5 Mollika, Prominent Housing, 3 Pisciculture Road, Mohammadpur, Dhaka - 1207"},"contact":{"title":"Call","numbers":["+88 01761 493407","+88 01622 093793 – (In Emergency)","+88 02 48110362"]},"email":{"title":"Email Us","addresses":["dusdhaka@gmail.com","dus.eddus@gmail.com"]},"quickLinks":[{"name":"About Us","url":"\/about"},{"name":"Community Radio","url":"\/community-radio"},{"name":"Evaluation","url":"\/evaluation"},{"name":"Working Area","url":"\/working-area"},{"name":"Publications","url":"\/publications"},{"name":"Mission & Visions","url":"\/mission-visions"},{"name":"Blogs","url":"\/blogs"},{"name":"Contact Us","url":"\/contact"}],"programs":[{"name":"Micro-Finance Program","url":"\/programs\/micro-finance"},{"name":"Disaster Management","url":"\/programs\/disaster-management"},{"name":"Community Radio","url":"\/programs\/community-radio"},{"name":"Education","url":"\/programs\/education"},{"name":"ICT for Development","url":"\/programs\/ict-development"},{"name":"Health Program","url":"\/programs\/health"},{"name":"Livelihood","url":"\/programs\/livelihood"},{"name":"Member Facilities","url":"\/programs\/member-facilities"},{"name":"Social Development","url":"\/programs\/social-development"},{"name":"Legal Support","url":"\/programs\/legal-support"},{"name":"Agriculture","url":"\/programs\/agriculture"},{"name":"Water and Sanitation","url":"\/programs\/water-sanitation"},{"name":"Research and Documentation","url":"\/programs\/research-documentation"},{"name":"Training Facilities","url":"\/programs\/training"},{"name":"Tourism","url":"\/programs\/tourism"}],"newsletter":{"title":"Subscribe to Our Newsletter","placeholder":"Enter your email address","buttonText":"Subscribe","apiEndpoint":"\/api\/subscribe-newsletter"},"bottomFooter":{"copyright":"© 2026 Dwip Unnayan. All rights reserved.","links":[{"text":"Terms of Service","url":"\/terms"},{"text":"Privacy Policy","url":"\/privacy"}]},"quickLinkLinkIcon":"\/storage\/images\/link.svg","OurProgramLinkIcon":"\/storage\/images\/link.svg"}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // FAQ DATA
      // ============================================
      [
        'id' => 4,
        'type' => 'faq',
        'data' => '{"section":{"title":"Key Questions Answered About Our Programs","subtitle":"Explore our Frequently Asked Questions for answers about our charity\'s projects, programs, and how you can get involved."},"faqs":[{"id":1,"question":"How can I participate in your programs?","answer":"You can participate by becoming a volunteer, donor, or partner organization. Visit our \\"Get Involved\\" page or contact our office directly to learn about current opportunities."},{"id":2,"question":"Who is eligible for micro-finance support?","answer":"Our micro-finance program primarily serves poor women, marginal farmers, and small micro-entrepreneurs in coastal communities. Priority is given to landless households and disaster-affected families."},{"id":3,"question":"How do you ensure program sustainability?","answer":"We ensure sustainability through community ownership, capacity building, income generation mechanisms, and partnerships with local government and development organizations."},{"id":4,"question":"Can international donors support your programs?","answer":"Yes, we welcome international support. DUS is registered with the NGO Affairs Bureau and can receive foreign donations. Contact us for partnership opportunities."},{"id":5,"question":"How do you measure program impact?","answer":"We conduct regular monitoring, baseline and end-line surveys, impact assessments, and participatory evaluations involving community members to measure our program effectiveness."},{"id":6,"question":"What geographical areas do you cover?","answer":"Our primary focus is Hatiya Island and surrounding coastal areas in Noakhali district, including Subarnachar, Companyganj, and Noakhali Sadar Upazilas."},{"id":7,"question":"How can I volunteer with DUS?","answer":"You can apply through our website\'s volunteer section, attend our orientation sessions, or contact our HR department. We welcome both local and international volunteers."},{"id":8,"question":"Are your financial reports publicly available?","answer":"Yes, we maintain transparency by publishing annual reports, audit statements, and financial summaries on our website and making them available to stakeholders upon request."}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // UPCOMING EVENTS DATA
      // ============================================
      [
        'id' => 5,
        'type' => 'upcoming-events',
        'data' => '{"section":{"title":"Upcoming Events & Community Actions","description":"Read real stories from the field, community experiences, and thought-provoking perspectives that reflect our mission and impact.","button":{"text":"Explore All Events","link":"\/events"}},"image":{"src":"\/storage\/UpcomingEvent\/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp","alt":"Events Image","className":"mt-15 rounded-2xl h-139.25 w-auto"},"events":[{"id":1,"date":{"day":"25","month":"Apr","weekday":"THU","dayNumber":"1","time":"10:30AM"},"location":"International Convention City Bashundhara - ICCB","title":"Participate in our community clean-up day and make a difference together","description":"Let\'s shape the future of the food industry together! Participate at the 9th Food Bangladesh Int\'l Expo 2026,","link":"\/events\/community-cleanup"},{"id":2,"date":{"day":"28","month":"Apr","weekday":"SUN","dayNumber":"2","time":"02:00PM"},"location":"Dhaka University Campus - Dhaka","title":"Education for All: Scholarship Distribution Ceremony","description":"Join us as we distribute scholarships to underprivileged students and celebrate their achievements in pursuing quality education.","link":"\/events\/scholarship-ceremony"},{"id":3,"date":{"day":"05","month":"May","weekday":"MON","dayNumber":"3","time":"09:00AM"},"location":"Hatiya Island Community Center - Noakhali","title":"Climate Adaptation Workshop for Coastal Communities","description":"Learn sustainable farming techniques and disaster preparedness strategies to combat climate change impacts in coastal areas.","link":"\/events\/climate-workshop"}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],

      // ============================================
      // 👇 NEW: STORIES DATA - NOW REUSABLE SHARED DATA
      // ============================================
      [
        'id' => 6,
        'type' => 'stories',
        'data' => '{"section":{"title":"Insights, Stories & Impact","description":"Read real stories from the field, community experiences, and thought-provoking perspectives that reflect our mission and impact."},"stories":[{"id":1,"image":"\/storage\/Stories\/8107b01ed92d05bd5a6861d1ca3a78ccbffc6289.webp","date":"June 6, 2023","title":"Invest in Kindness, Reap a Better Future","description":"Lorem Ipsum is simply dummy text of the printing and typesetting industry...","link":"\/stories\/invest-in-kindness"},{"id":2,"image":"\/storage\/Stories\/b3d758bf8cd7985c857cdbe55b5101b105ee9f75.webp","date":"June 6, 2023","title":"How to Design a Custom Pool That Perfectly Fits Your Charlotte Backyard","description":"Lorem Ipsum is simply dummy text of the printing and typesetting industry...","link":"\/stories\/custom-pool-design"},{"id":3,"image":"\/storage\/Stories\/8235fc0d0e2c3082be7cb9ba5d6f5502a121d0ff%20(1).webp","date":"June 6, 2023","title":"The Benefits of Mindfulness in Daily Life","description":"Lorem Ipsum is simply dummy text of the printing and typesetting industry...","link":"\/stories\/mindfulness-benefits"},{"id":4,"image":"\/storage\/Stories\/3fe55eb9ebcfd7efb80f559a00b8b5a1da0e8c3e.webp","date":"July 15, 2023","title":"Empowering Women Through Microfinance","description":"Discover how small loans are making a big difference in the lives of women entrepreneurs...","link":"\/stories\/empowering-women"},{"id":5,"image":"\/storage\/Stories\/de90e922c05aa3585b8f65361c306413c3b3d7be.webp","date":"August 2, 2023","title":"Building Resilient Communities Against Climate Change","description":"Learn about our initiatives to help coastal communities adapt to changing climate conditions...","link":"\/stories\/climate-resilience"},{"id":6,"image":"\/storage\/Stories\/f465fcbdab4004cd25dba4df06b9f8d5f2648620.webp","date":"September 10, 2023","title":"Providing Clean Water to Remote Villages","description":"Access to clean water is a basic human right and we are committed to ensuring it for all...","link":"\/stories\/clean-water"}]}',
        'is_active' => 1,
        'created_at' => '2024-01-01 00:00:00',
        'updated_at' => '2024-01-01 00:00:00',
      ],
    ];

    $this->seedTable('shared_data', $sharedData, ['type']);
  }
}
