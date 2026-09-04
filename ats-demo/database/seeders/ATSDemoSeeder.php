<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\ApplicantProfile;
use App\Models\JobCategory;
use App\Models\JobListing;
use App\Models\Location;
use App\Models\StatusTimeline;
use Illuminate\Database\Seeder;

class ATSDemoSeeder extends Seeder
{
    public function run(): void
    {
        // Create categories
        $categories = [
            ['name' => 'Engineering', 'description' => 'Software and hardware engineering roles'],
            ['name' => 'Design', 'description' => 'UI/UX and graphic design positions'],
            ['name' => 'Marketing', 'description' => 'Digital marketing and content creation'],
            ['name' => 'Sales', 'description' => 'Business development and sales roles'],
            ['name' => 'Support', 'description' => 'Customer support and success'],
        ];

        foreach ($categories as $cat) {
            JobCategory::create($cat);
        }

        // Create locations
        $locations = [
            ['name' => 'Remote', 'country' => 'Global'],
            ['name' => 'New York', 'country' => 'USA'],
            ['name' => 'San Francisco', 'country' => 'USA'],
            ['name' => 'London', 'country' => 'UK'],
            ['name' => 'Berlin', 'country' => 'Germany'],
        ];

        foreach ($locations as $loc) {
            Location::create($loc);
        }

        // Create job listings with keywords for ATS testing
        $jobs = [
            [
                'title' => 'Senior Full Stack Developer',
                'category_id' => 1,
                'description' => 'We are looking for an experienced Full Stack Developer to join our team.',
                'requirements' => '5+ years experience with React, Node.js, TypeScript, PostgreSQL',
                'keywords' => json_encode(['react', 'nodejs', 'typescript', 'postgresql', 'aws', 'docker', 'git', 'agile', 'rest api', 'graphql']),
                'job_type' => 'full-time',
                'salary_min' => 120000,
                'salary_max' => 180000,
                'experience_required' => 5,
                'is_active' => true,
            ],
            [
                'title' => 'UI/UX Designer',
                'category_id' => 2,
                'description' => 'Creative UI/UX Designer needed for product design.',
                'requirements' => '3+ years experience with Figma, Adobe Creative Suite, user research',
                'keywords' => json_encode(['figma', 'adobe xd', 'sketch', 'user research', 'wireframing', 'prototyping', 'design system', 'usability testing']),
                'job_type' => 'full-time',
                'salary_min' => 90000,
                'salary_max' => 140000,
                'experience_required' => 3,
                'is_active' => true,
            ],
            [
                'title' => 'Digital Marketing Manager',
                'category_id' => 3,
                'description' => 'Lead our digital marketing initiatives.',
                'requirements' => 'Experience with SEO, SEM, social media marketing, analytics',
                'keywords' => json_encode(['seo', 'sem', 'google analytics', 'facebook ads', 'content marketing', 'email marketing', 'social media']),
                'job_type' => 'full-time',
                'salary_min' => 80000,
                'salary_max' => 120000,
                'experience_required' => 4,
                'is_active' => true,
            ],
            [
                'title' => 'DevOps Engineer',
                'category_id' => 1,
                'description' => 'DevOps Engineer to manage our cloud infrastructure.',
                'requirements' => 'Experience with AWS, Kubernetes, CI/CD, Terraform',
                'keywords' => json_encode(['aws', 'kubernetes', 'docker', 'terraform', 'ci/cd', 'jenkins', 'linux', 'python', 'monitoring']),
                'job_type' => 'full-time',
                'salary_min' => 130000,
                'salary_max' => 190000,
                'experience_required' => 5,
                'is_active' => true,
            ],
            [
                'title' => 'Customer Success Specialist',
                'category_id' => 5,
                'description' => 'Help our customers achieve their goals.',
                'requirements' => 'Excellent communication skills, experience with CRM tools',
                'keywords' => json_encode(['customer service', 'salesforce', 'communication', 'problem solving', 'crm', 'support tickets']),
                'job_type' => 'full-time',
                'salary_min' => 60000,
                'salary_max' => 90000,
                'experience_required' => 2,
                'is_active' => true,
            ],
        ];

        foreach ($jobs as $job) {
            $listing = JobListing::create($job);
            // Attach random locations
            $listing->locations()->attach(rand(1, 5));
        }

        // Create applicant profiles
        $applicants = [
            ['full_name' => 'John Smith', 'email' => 'john.smith@email.com', 'phone' => '+1-555-0101'],
            ['full_name' => 'Sarah Johnson', 'email' => 'sarah.j@email.com', 'phone' => '+1-555-0102'],
            ['full_name' => 'Michael Brown', 'email' => 'm.brown@email.com', 'phone' => '+1-555-0103'],
            ['full_name' => 'Emily Davis', 'email' => 'emily.d@email.com', 'phone' => '+1-555-0104'],
            ['full_name' => 'David Wilson', 'email' => 'd.wilson@email.com', 'phone' => '+1-555-0105'],
            ['full_name' => 'Lisa Anderson', 'email' => 'lisa.a@email.com', 'phone' => '+1-555-0106'],
            ['full_name' => 'James Taylor', 'email' => 'j.taylor@email.com', 'phone' => '+1-555-0107'],
            ['full_name' => 'Jennifer Martinez', 'email' => 'j.martinez@email.com', 'phone' => '+1-555-0108'],
            ['full_name' => 'Robert Garcia', 'email' => 'r.garcia@email.com', 'phone' => '+1-555-0109'],
            ['full_name' => 'Maria Rodriguez', 'email' => 'm.rodriguez@email.com', 'phone' => '+1-555-0110'],
        ];

        foreach ($applicants as $applicant) {
            ApplicantProfile::create($applicant);
        }

        // Create applications with various statuses and ATS scores
        $statuses = ['pending', 'shortlisted', 'rejected', 'hired'];
        $educationLevels = ['high_school', 'associate', 'bachelor', 'master', 'phd'];

        $applicationData = [
            // High scoring applicants
            ['name' => 'John Smith', 'email' => 'john.smith@email.com', 'job_id' => 1, 'status' => 'shortlisted', 'ats_score' => 85, 'exp' => 6, 'edu' => 'master'],
            ['name' => 'Sarah Johnson', 'email' => 'sarah.j@email.com', 'job_id' => 2, 'status' => 'hired', 'ats_score' => 92, 'exp' => 5, 'edu' => 'bachelor'],
            ['name' => 'Michael Brown', 'email' => 'm.brown@email.com', 'job_id' => 4, 'status' => 'shortlisted', 'ats_score' => 78, 'exp' => 7, 'edu' => 'master'],
            
            // Medium scoring applicants
            ['name' => 'Emily Davis', 'email' => 'emily.d@email.com', 'job_id' => 1, 'status' => 'pending', 'ats_score' => 65, 'exp' => 4, 'edu' => 'bachelor'],
            ['name' => 'David Wilson', 'email' => 'd.wilson@email.com', 'job_id' => 3, 'status' => 'pending', 'ats_score' => 58, 'exp' => 3, 'edu' => 'bachelor'],
            ['name' => 'Lisa Anderson', 'email' => 'lisa.a@email.com', 'job_id' => 2, 'status' => 'rejected', 'ats_score' => 45, 'exp' => 2, 'edu' => 'associate'],
            
            // Low scoring applicants
            ['name' => 'James Taylor', 'email' => 'j.taylor@email.com', 'job_id' => 1, 'status' => 'rejected', 'ats_score' => 32, 'exp' => 1, 'edu' => 'high_school'],
            ['name' => 'Jennifer Martinez', 'email' => 'j.martinez@email.com', 'job_id' => 5, 'status' => 'pending', 'ats_score' => 70, 'exp' => 3, 'edu' => 'bachelor'],
            ['name' => 'Robert Garcia', 'email' => 'r.garcia@email.com', 'job_id' => 3, 'status' => 'shortlisted', 'ats_score' => 82, 'exp' => 5, 'edu' => 'master'],
            ['name' => 'Maria Rodriguez', 'email' => 'm.rodriguez@email.com', 'job_id' => 4, 'status' => 'pending', 'ats_score' => 55, 'exp' => 2, 'edu' => 'bachelor'],
        ];

        foreach ($applicationData as $data) {
            $app = Application::create([
                'job_listing_id' => $data['job_id'],
                'applicant_profile_id' => rand(1, 10),
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => '+1-555-' . rand(1000, 9999),
                'status' => $data['status'],
                'years_of_experience' => $data['exp'],
                'education_level' => $data['edu'],
                'expected_salary' => rand(70000, 150000),
                'ats_score' => [
                    'percentage' => $data['ats_score'],
                    'matched_keywords' => [],
                    'missing_keywords' => [],
                    'analysis' => [
                        'level' => $data['ats_score'] >= 80 ? 'Excellent' : ($data['ats_score'] >= 60 ? 'Good' : 'Needs Improvement'),
                        'message' => 'ATS analysis complete',
                        'color' => $data['ats_score'] >= 80 ? 'green' : ($data['ats_score'] >= 60 ? 'blue' : 'yellow'),
                    ],
                ],
                'ats_calculation_status' => 'completed',
                'ats_last_attempted_at' => now(),
            ]);

            // Create status timeline
            StatusTimeline::create([
                'application_id' => $app->id,
                'status' => 'pending',
                'notes' => 'Application received',
            ]);

            if ($data['status'] !== 'pending') {
                StatusTimeline::create([
                    'application_id' => $app->id,
                    'status' => $data['status'],
                    'notes' => 'Status updated to ' . $data['status'],
                ]);
            }
        }

        $this->command->info('ATS Demo data seeded successfully!');
        $this->command->info('Created: ' . JobCategory::count() . ' categories');
        $this->command->info('Created: ' . Location::count() . ' locations');
        $this->command->info('Created: ' . JobListing::count() . ' job listings');
        $this->command->info('Created: ' . ApplicantProfile::count() . ' applicant profiles');
        $this->command->info('Created: ' . Application::count() . ' applications');
    }
}
