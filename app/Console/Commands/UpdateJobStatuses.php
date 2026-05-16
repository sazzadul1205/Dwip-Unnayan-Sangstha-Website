<?php

namespace App\Console\Commands;

use App\Http\Controllers\JobListing\JobListingController;
use Illuminate\Console\Command;

class UpdateJobStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'jobs:update-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update job listing statuses based on schedule start date and application deadline';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating job statuses...');

        try {
            $controller = app(JobListingController::class);
            $controller->updateJobStatuses();

            $this->info('Job statuses updated successfully!');
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error updating job statuses: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
