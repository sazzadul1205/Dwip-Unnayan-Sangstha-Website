<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Job Categories
        Schema::create('job_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Locations
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('country')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Job Listings
        Schema::create('job_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('job_categories')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->text('responsibilities')->nullable();
            $table->json('keywords')->nullable();
            $table->string('job_type')->default('full-time');
            $table->decimal('salary_min', 10, 2)->nullable();
            $table->decimal('salary_max', 10, 2)->nullable();
            $table->integer('experience_required')->default(0);
            $table->string('education_required')->default('bachelor');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['is_active', 'created_at']);
        });

        // Job Listing - Location pivot
        Schema::create('job_listing_location', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // Applicant Profiles
        Schema::create('applicant_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('full_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->text('summary')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('portfolio_url')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Applicant CVs
        Schema::create('applicant_cvs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('applicant_profile_id')->constrained()->cascadeOnDelete();
            $table->string('cv_path');
            $table->string('original_filename');
            $table->string('file_type')->default('pdf');
            $table->integer('order_position')->default(0);
            $table->timestamps();
        });

        // Applications
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('job_listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('applicant_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('education_level')->default('bachelor');
            $table->integer('years_of_experience')->default(0);
            $table->string('resume_path')->nullable();
            $table->decimal('expected_salary', 10, 2)->nullable();
            $table->json('ats_score')->nullable();
            $table->json('matched_keywords')->nullable();
            $table->json('missing_keywords')->nullable();
            $table->timestamp('ats_last_attempted_at')->nullable();
            $table->integer('ats_attempt_count')->default(0);
            $table->string('ats_calculation_status')->default('pending');
            $table->string('status')->default('pending');
            $table->text('employer_notes')->nullable();
            $table->string('facebook_link')->nullable();
            $table->string('linkedin_link')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['status', 'created_at']);
            $table->index(['job_listing_id', 'status']);
        });

        // Status Timelines
        Schema::create('status_timelines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('application_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('status_timelines');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('applicant_cvs');
        Schema::dropIfExists('applicant_profiles');
        Schema::dropIfExists('job_listing_location');
        Schema::dropIfExists('job_listings');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('job_categories');
    }
};
