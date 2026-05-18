<?php
// database/seeders/JobListingSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JobListingSeeder extends Seeder
{
    public function run(): void
    {
        $jobTitles = [
            'Senior Software Engineer',
            'Full Stack Web Developer',
            'Mobile App Developer (Flutter)',
            'Data Scientist',
            'DevOps Engineer',
            'Cybersecurity Analyst',
            'Cloud Architect',
            'Digital Marketing Manager',
            'SEO Specialist',
            'Content Writer',
            'Graphic Designer',
            'Project Manager',
            'Product Manager',
            'Business Development Executive',
            'HR Manager',
            'Accountant',
            'Financial Analyst',
            'Sales Executive',
            'Customer Support Representative',
            'UI/UX Designer',
            'Frontend Developer',
            'Backend Developer (Laravel)',
            'Database Administrator',
            'Network Engineer'
        ];

        $jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote', 'hybrid'];
        $experienceLevels = ['entry', 'junior', 'mid-level', 'senior', 'lead', 'executive'];
        $educations = ['SSC', 'HSC', 'Bachelor', 'Master', 'PhD', 'Diploma'];

        $benefitsList = [
            'Weekly 2 holidays',
            'Festival bonus',
            'Performance bonus',
            'Medical insurance',
            'Provident fund',
            'Gratuity',
            'Lunch facility',
            'Transport facility',
            'Salary review yearly',
            'Professional development',
            'Flexible work hours'
        ];

        $skillsList = [
            ['PHP', 'Laravel', 'MySQL', 'JavaScript'],
            ['React', 'Node.js', 'MongoDB'],
            ['Python', 'Django', 'PostgreSQL'],
            ['Java', 'Spring Boot', 'AWS'],
            ['Flutter', 'Dart', 'Firebase'],
            ['WordPress', 'Elementor', 'WooCommerce'],
            ['SEO', 'Google Analytics', 'SEMrush'],
            ['Photoshop', 'Illustrator', 'Figma']
        ];

        // Get employer users via RBAC user_roles table
        $employers = DB::table('users')
            ->join('user_roles', 'users.id', '=', 'user_roles.user_id')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->whereIn('roles.slug', ['employer-admin', 'hr-manager', 'recruiter'])
            ->where('user_roles.is_active', true)
            ->select('users.*')
            ->distinct()
            ->get();

        // Fallback: if no employers found, get users with @company.com email
        if ($employers->isEmpty()) {
            $employers = DB::table('users')
                ->where('email', 'like', '%@company.com')
                ->orWhere('email', 'hrmanager@company.com')
                ->get();
        }

        $categories = DB::table('job_categories')->get();

        $jobs = [];

        for ($i = 0; $i < 100; $i++) {
            $title = $jobTitles[array_rand($jobTitles)];
            $salaryMin = rand(20000, 80000);
            $salaryMax = $salaryMin + rand(10000, 100000);

            $benefits = [];
            for ($b = 0; $b < rand(2, 6); $b++) {
                $benefits[] = $benefitsList[array_rand($benefitsList)];
            }

            $skills = $skillsList[array_rand($skillsList)];
            $responsibilities = [
                'Develop and maintain web applications',
                'Collaborate with cross-functional teams',
                'Write clean, scalable code',
                'Participate in code reviews',
                'Troubleshoot and debug applications',
                'Document technical specifications'
            ];

            $keywords = explode(' ', $title);

            $employerId = $employers->isNotEmpty() ? $employers->random()->id : 1;

            $jobs[] = [
                'title' => $title,
                'slug' => Str::slug($title . '-' . $i . '-' . Str::random(8)),
                'description' => 'We are looking for a dedicated ' . $title . ' to join our team. The ideal candidate will have experience in the field and a passion for excellence. You will be responsible for delivering high-quality work and contributing to team success.',
                'requirements' => 'Bachelor\'s degree in relevant field. ' . rand(1, 5) . '+ years of experience. Strong communication skills. Ability to work in a team environment. Problem-solving mindset.',
                'job_type' => $jobTypes[array_rand($jobTypes)],
                'salary_min' => $salaryMin,
                'salary_max' => $salaryMax,
                'is_salary_negotiable' => rand(0, 1) == 1,
                'as_per_companies_policy' => rand(0, 1) == 1,
                'category_id' => $categories->random()->id,
                'experience_level' => $experienceLevels[array_rand($experienceLevels)],
                'education_requirement' => $educations[array_rand($educations)],
                'education_details' => 'Minimum ' . $educations[array_rand($educations)] . ' degree from recognized institution',
                'benefits' => json_encode($benefits),
                'skills' => json_encode($skills),
                'responsibilities' => json_encode(array_slice($responsibilities, 0, rand(3, 5))),
                'keywords' => json_encode($keywords),
                'application_deadline' => now()->addDays(rand(7, 60)),
                'publish_at' => now()->subDays(rand(0, 30)),
                'views_count' => rand(0, 500),
                'is_active' => true,
                'user_id' => $employerId,
                'required_facebook_link' => rand(0, 1) == 1,
                'required_linkedin_link' => rand(0, 1) == 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('job_listings')->insert($jobs);
    }
}
