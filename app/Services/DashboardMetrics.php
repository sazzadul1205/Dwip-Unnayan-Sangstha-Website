<?php

namespace App\Services;

use App\Models\ApplicantProfile;
use App\Models\Application;
use App\Models\JobCategory;
use App\Models\JobListing;
use App\Models\JobView;
use App\Models\Location;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscription;
use App\Models\pages\Blog;
use App\Models\pages\Page;
use App\Models\pages\Program;
use App\Models\pages\Publication;
use App\Models\pages\SectionConfig;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Read-only aggregate queries backing the admin dashboard.
 *
 * Design rules followed here:
 *  - One query per metric family, not one COUNT per number. KPI blocks use
 *    conditional aggregation (SUM(col = x)) so a card grid costs one round trip.
 *  - Averages never COALESCE to 0. COALESCE(..., 0) drags an average down by
 *    counting every unscored row as a zero; AVG skips NULLs, which is correct.
 *  - Time series are gap-filled against a generated spine. A bare
 *    GROUP BY DATE(created_at) omits zero-activity days and silently corrupts
 *    the chart's x-axis.
 *  - Ratio metrics apply a minimum-denominator floor. 1 application / 1 view
 *    is not a 100% conversion rate.
 *  - Soft-delete and is_active conventions are applied consistently, because
 *    the legacy dashboard and the statistics screen previously disagreed.
 */
class DashboardMetrics
{
    /**
     * Role slugs that identify an employer-side account.
     */
    public const EMPLOYER_ROLE_SLUGS = ['employer-admin', 'hr-manager', 'recruiter'];

    /**
     * Ratio metrics need a floor to avoid 1/1 = 100% artefacts.
     */
    private const MIN_VIEWS_FOR_CONVERSION = 10;

    /**
     * ATS calculations are considered stuck after this many minutes.
     */
    private const ATS_STUCK_MINUTES = 30;

    /* ==========================================
     | PANEL 1 - PLATFORM KPIs
     |========================================== */

    /**
     * Headline counters for the platform.
     *
     * @return array<string, mixed>
     */
    public static function platformKpis(): array
    {
        $applications = Application::query()
            ->selectRaw(<<<'SQL'
                COUNT(*)                                                    AS total,
                COALESCE(SUM(status = 'pending'), 0)     AS pending,
                COALESCE(SUM(status = 'shortlisted'), 0) AS shortlisted,
                COALESCE(SUM(status = 'rejected'), 0)    AS rejected,
                COALESCE(SUM(status = 'hired'), 0)       AS hired
            SQL)
            ->first();

        $ats = Application::query()
            ->where('ats_calculation_status', Application::ATS_COMPLETED)
            ->selectRaw(<<<'SQL'
                COUNT(*) AS scored,
                ROUND(AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(ats_score, '$.percentage')) AS DECIMAL(5,2))), 1) AS avg_ats
            SQL)
            ->first();

        $users = User::query()
            ->selectRaw(<<<'SQL'
                COUNT(*)                                          AS total,
                COALESCE(SUM(email_verified_at IS NOT NULL), 0)  AS verified,
                COALESCE(SUM(created_at >= ?), 0)                 AS new_30d
            SQL, [now()->subDays(30)])
            ->first();

        $jobs = JobListing::query()
            ->selectRaw(<<<'SQL'
                COUNT(*)                                                      AS total,
                COALESCE(SUM(is_active = 1 AND application_deadline >= ?), 0) AS active,
                COALESCE(SUM(is_active = 1 AND application_deadline < ?), 0)  AS expired,
                COALESCE(SUM(is_active = 1
                             AND application_deadline >= ?
                             AND application_deadline <= ?), 0)              AS expiring_7d
            SQL, [now(), now(), now(), now()->addDays(7)])
            ->first();

        $trashedJobs = JobListing::onlyTrashed()->count();
        $totalViews = JobView::query()->count();

        // A user is dormant when they have neither applied nor browsed a job
        // in the last 30 days.
        $dormantUsers = User::query()
            ->whereDoesntHave('applications', fn ($q) => $q->where('created_at', '>=', now()->subDays(30)))
            ->whereDoesntHave('jobViews', fn ($q) => $q->where('created_at', '>=', now()->subDays(30)))
            ->count();

        $viewToApply = self::rate($applications->total, $totalViews);

        return [
            'users' => [
                'total'        => (int) $users->total,
                'verified'     => (int) $users->verified,
                'unverified'   => (int) $users->total - (int) $users->verified,
                'new_30d'      => (int) $users->new_30d,
                'dormant_30d'  => $dormantUsers,
                'job_seekers'  => self::countByRoleSlug('job-seeker'),
                'employers'    => self::countByRoleSlugs(self::EMPLOYER_ROLE_SLUGS),
            ],
            'jobs' => [
                'total'        => (int) $jobs->total,
                'active'       => (int) $jobs->active,
                'inactive'     => (int) $jobs->total - (int) $jobs->active,
                'expired'      => (int) $jobs->expired,
                'expiring_7d'  => (int) $jobs->expiring_7d,
                'trashed'      => $trashedJobs,
            ],
            'applications' => [
                'total'        => (int) $applications->total,
                'pending'      => (int) $applications->pending,
                'shortlisted'  => (int) $applications->shortlisted,
                'rejected'     => (int) $applications->rejected,
                'hired'        => (int) $applications->hired,
                'hired_rate'   => self::rate($applications->hired, $applications->total),
                'pending_30d'  => Application::where('status', Application::STATUS_PENDING)
                    ->where('created_at', '>=', now()->subDays(30))
                    ->count(),
            ],
            'engagement' => [
                'total_views'        => $totalViews,
                'views_30d'          => JobView::where('created_at', '>=', now()->subDays(30))->count(),
                'view_to_apply_rate' => $viewToApply,
                'avg_ats'            => $ats->avg_ats !== null ? (float) $ats->avg_ats : null,
                'ats_scored_count'   => (int) $ats->scored,
            ],
        ];
    }

    /* ==========================================
     | PANEL 2 - TIME SERIES
     |========================================== */

    /**
     * Gap-filled daily series for the primary entities.
     *
     * @return array<string, array<string, int>>
     */
    public static function timeSeries(int $days = 30): array
    {
        return [
            'applications' => self::dailySeries(Application::query(), $days),
            'views'        => self::dailySeries(JobView::query(), $days),
            'jobs'         => self::dailySeries(JobListing::query(), $days),
            'signups'      => self::dailySeries(User::query(), $days),
        ];
    }

    /**
     * Group a query by day and left-pad every day in the window with zero.
     *
     * @return array<string, int>
     */
    private static function dailySeries(Builder $query, int $days): array
    {
        $counts = (clone $query)
            ->where('created_at', '>=', now()->subDays($days - 1)->startOfDay())
            ->selectRaw('DATE(created_at) AS bucket, COUNT(*) AS total')
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        $series = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $series[$date] = (int) ($counts[$date] ?? 0);
        }

        return $series;
    }

    /* ==========================================
     | PANEL 3 - APPLICATION FUNNEL
     |========================================== */

    /**
     * View -> apply -> shortlist -> hire funnel, overall and per dimension.
     *
     * @return array<string, mixed>
     */
    public static function funnel(): array
    {
        return [
            'overall' => self::funnelFor(self::applicationFunnelQuery()),
            'by_job_type'     => self::funnelBreakdown('job_listings.job_type', 'job_type'),
            'by_category'     => self::funnelBreakdown('job_categories.name', 'category_id'),
            'by_experience'   => self::funnelBreakdown('job_listings.experience_level', 'experience_level'),
        ];
    }

    /**
     * Base query joining applications to their listing and category.
     */
    private static function applicationFunnelQuery(): Builder
    {
        return Application::query()
            ->join('job_listings', 'job_listings.id', '=', 'applications.job_listing_id')
            ->join('job_categories', 'job_categories.id', '=', 'job_listings.category_id')
            ->whereNull('applications.deleted_at')
            ->whereNull('job_listings.deleted_at');
    }

    /**
     * @return array<string, mixed>
     */
    private static function funnelFor(Builder $query): array
    {
        $row = $query
            // Reset the default applications.* column list so the joined row
            // is not carried into an ungrouped aggregate select.
            ->selectRaw('1')
            ->selectRaw(<<<'SQL'
                COALESCE(SUM(applications.status = 'pending'), 0)     AS pending,
                COALESCE(SUM(applications.status = 'shortlisted'), 0) AS shortlisted,
                COALESCE(SUM(applications.status = 'rejected'), 0)    AS rejected,
                COALESCE(SUM(applications.status = 'hired'), 0)       AS hired,
                COUNT(*)                                               AS total
            SQL)
            ->first();

        $shortlisted = (int) $row->shortlisted;
        $hired = (int) $row->hired;

        return [
            'applied'          => (int) $row->total,
            'pending'          => (int) $row->pending,
            'shortlisted'      => $shortlisted,
            'hired'            => $hired,
            'rejected'         => (int) $row->rejected,
            'shortlist_rate'   => self::rate($shortlisted, (int) $row->total),
            'hire_rate'        => self::rate($hired, (int) $row->total),
            'reject_rate'      => self::rate((int) $row->rejected, (int) $row->total),
        ];
    }

    /**
     * Same funnel aggregated across a grouping column.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private static function funnelBreakdown(string $groupColumn, string $labelKey): Collection
    {
        return self::applicationFunnelQuery()
            ->selectRaw("{$groupColumn} AS bucket")
            ->selectRaw(<<<'SQL'
                COALESCE(SUM(applications.status = 'pending'), 0)     AS pending,
                COALESCE(SUM(applications.status = 'shortlisted'), 0) AS shortlisted,
                COALESCE(SUM(applications.status = 'rejected'), 0)    AS rejected,
                COALESCE(SUM(applications.status = 'hired'), 0)       AS hired,
                COUNT(*)                                               AS total
            SQL)
            ->groupBy('bucket')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'label'          => (string) ($row->bucket ?? 'Unspecified'),
                'key'            => $labelKey,
                'total'          => (int) $row->total,
                'shortlisted'    => (int) $row->shortlisted,
                'hired'          => (int) $row->hired,
                'rejected'       => (int) $row->rejected,
                'shortlist_rate' => self::rate((int) $row->shortlisted, (int) $row->total),
                'hire_rate'      => self::rate((int) $row->hired, (int) $row->total),
            ])
            ->values();
    }

    /* ==========================================
     | PANEL 4/5 - TOP PERFORMERS
     |========================================== */

    /**
     * Jobs ranked by traffic, by applications, and by conversion.
     *
     * @return array<string, mixed>
     */
    public static function topJobs(int $limit = 10): array
    {
        $jobs = JobListing::query()
            ->whereNull('deleted_at')
            ->where('is_active', true)
            ->with(['category:id,name', 'employer:id,name'])
            ->withCount('applications')
            ->withCount('views')
            ->orderByDesc('views_count')
            ->limit($limit * 5)
            ->get()
            ->map(function (JobListing $job) {
                $views = (int) $job->views_count;
                $applications = (int) $job->applications_count;

                return [
                    'id'              => $job->id,
                    'title'           => $job->title,
                    'slug'            => $job->slug,
                    'company'         => $job->employer?->name ?? 'N/A',
                    'category'        => $job->category?->name ?? 'N/A',
                    'job_type'        => $job->job_type,
                    'experience_level' => $job->experience_level,
                    'is_active'       => (bool) $job->is_active,
                    'deadline'        => $job->application_deadline?->toDateString(),
                    'views_count'     => $views,
                    'applications_count' => $applications,
                    // Null below the floor rather than reporting a misleading 100%.
                    'conversion_rate' => $views >= self::MIN_VIEWS_FOR_CONVERSION
                        ? round($applications / $views * 100, 2)
                        : null,
                ];
            });

        return [
            'by_views' => $jobs->sortByDesc('views_count')->take($limit)->values()->all(),
            'by_applications' => $jobs->sortByDesc('applications_count')->take($limit)->values()->all(),
            'by_conversion' => $jobs
                ->filter(fn ($j) => $j['conversion_rate'] !== null)
                ->sortByDesc('conversion_rate')
                ->take($limit)
                ->values()
                ->all(),
        ];
    }

    /**
     * Employers ranked by postings and by applications received.
     *
     * Uses receivedApplications(): the direct applications() relation is empty
     * for employers because employers post jobs rather than apply to them.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function topEmployers(int $limit = 10): array
    {
        return User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('slug', self::EMPLOYER_ROLE_SLUGS))
            ->withCount(['jobListings' => fn ($q) => $q->whereNull('deleted_at')])
            ->withCount(['jobListings as active_jobs' => fn ($q) => $q
                ->whereNull('deleted_at')
                ->where('is_active', true)
                ->where('application_deadline', '>=', now()),
            ])
            ->withCount('receivedApplications')
            ->orderByDesc('received_applications_count')
            ->limit($limit)
            ->get()
            ->map(fn (User $employer) => [
                'id'                => $employer->id,
                'name'              => $employer->name ?? 'N/A',
                'avatar'            => $employer->google_avatar,
                'job_listings_count' => (int) $employer->job_listings_count,
                'active_jobs'       => (int) $employer->active_jobs,
                'applications_count' => (int) $employer->received_applications_count,
                'response_rate'     => self::rate(
                    (int) $employer->received_applications_count,
                    (int) $employer->job_listings_count
                ),
            ])
            ->values()
            ->all();
    }

    /* ==========================================
     | PANEL 5 - DISTRIBUTIONS
     |========================================== */

    /**
     * Categorical breakdowns used by the pie/bar charts.
     *
     * @return array<string, mixed>
     */
    public static function distributions(): array
    {
        $jobsByCategory = JobCategory::query()
            ->withCount(['jobListings' => fn ($q) => $q->whereNull('deleted_at')])
            ->orderByDesc('job_listings_count')
            ->limit(10)
            ->get()
            ->map(fn ($c) => ['name' => $c->name, 'value' => (int) $c->job_listings_count])
            ->values()
            ->all();

        $jobsByLocation = Location::query()
            ->withCount(['jobListings' => fn ($q) => $q->whereNull('deleted_at')])
            ->orderByDesc('job_listings_count')
            ->limit(10)
            ->get()
            ->map(fn ($l) => ['name' => $l->name, 'value' => (int) $l->job_listings_count])
            ->values()
            ->all();

        $grouped = fn (string $column, callable $label) => JobListing::query()
            ->whereNull('deleted_at')
            ->selectRaw("{$column} AS bucket, COUNT(*) AS total")
            ->groupBy('bucket')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['name' => $label((string) $r->bucket), 'value' => (int) $r->total])
            ->values()
            ->all();

        return [
            'jobs_by_type'       => $grouped(
                'job_type',
                fn ($v) => ucfirst(str_replace('-', ' ', $v))
            ),
            'jobs_by_experience' => $grouped(
                'experience_level',
                fn ($v) => ucfirst(str_replace('-', ' ', $v))
            ),
            'jobs_by_category'   => $jobsByCategory,
            'jobs_by_location'   => $jobsByLocation,
        ];
    }

    /* ==========================================
     | PANEL 6 - PIPELINE HEALTH
     |========================================== */

    /**
     * Review throughput and backlog age.
     *
     * @return array<string, mixed>
     */
    public static function pipelineHealth(int $windowDays = 30): array
    {
        $since = now()->subDays($windowDays);

        // Applications whose first status change to shortlisted/hired is the
        // moment a reviewer actually engaged with them.
        $velocity = DB::table('applications as a')
            ->join('status_timelines as st', 'st.application_id', '=', 'a.id')
            ->whereNull('a.deleted_at')
            ->whereIn('st.status', [Application::STATUS_SHORTLISTED, Application::STATUS_HIRED])
            ->where('a.created_at', '>=', $since)
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, a.created_at, st.created_at)) AS avg_hours')
            ->value('avg_hours');

        $backlog = Application::query()
            ->where('status', Application::STATUS_PENDING)
            ->selectRaw(<<<'SQL'
                COUNT(*)                                                      AS total,
                COALESCE(SUM(created_at < ?), 0)                              AS older_7d,
                COALESCE(SUM(created_at < ?), 0)                              AS older_30d,
                COALESCE(SUM(employer_notes IS NULL OR employer_notes = ''), 0) AS unreviewed
            SQL, [now()->subDays(7), now()->subDays(30)])
            ->first();

        return [
            'window_days'               => $windowDays,
            'avg_hours_to_shortlist'    => $velocity !== null ? round((float) $velocity, 1) : null,
            'avg_days_to_shortlist'     => $velocity !== null ? round((float) $velocity / 24, 2) : null,
            'pending_total'             => (int) $backlog->total,
            'pending_older_7d'          => (int) $backlog->older_7d,
            'pending_older_30d'         => (int) $backlog->older_30d,
            'pending_unreviewed'        => (int) $backlog->unreviewed,
            'stale_rate'                => self::rate((int) $backlog->older_7d, (int) $backlog->total),
        ];
    }

    /**
     * ATS scoring health, including stuck jobs.
     *
     * @return array<string, mixed>
     */
    public static function atsHealth(): array
    {
        $counts = Application::query()
            ->selectRaw(<<<'SQL'
                COUNT(*)                                                   AS total,
                COALESCE(SUM(ats_calculation_status = 'completed'), 0)     AS completed,
                COALESCE(SUM(ats_calculation_status = 'failed'), 0)        AS failed,
                COALESCE(SUM(ats_calculation_status = 'pending'), 0)       AS pending,
                COALESCE(SUM(ats_calculation_status = 'processing'), 0)    AS processing,
                COALESCE(SUM(ats_attempt_count > 1), 0)                    AS retried
            SQL)
            ->first();

        // Mirrors Application::isAtsCalculationStuck() but in SQL so it can
        // count the whole backlog instead of hydrating every row.
        $stuck = Application::query()
            ->whereIn('ats_calculation_status', [Application::ATS_PENDING, Application::ATS_PROCESSING])
            ->where(function ($q) {
                $q->where('ats_last_attempted_at', '<', now()->subMinutes(self::ATS_STUCK_MINUTES))
                    ->orWhere(fn ($inner) => $inner
                        ->whereNull('ats_last_attempted_at')
                        ->where('created_at', '<', now()->subMinutes(self::ATS_STUCK_MINUTES)));
            })
            ->count();

        $total = (int) $counts->total;

        return [
            'total'           => $total,
            'completed'       => (int) $counts->completed,
            'failed'          => (int) $counts->failed,
            'pending'         => (int) $counts->pending,
            'processing'      => (int) $counts->processing,
            'retried'         => (int) $counts->retried,
            'stuck'           => $stuck,
            'success_rate'    => self::rate((int) $counts->completed, $total),
            'failure_rate'    => self::rate((int) $counts->failed, $total),
        ];
    }

    /* ==========================================
     | PANEL 7 - CMS HEALTH
     |========================================== */

    /**
     * Content inventory and integrity checks.
     *
     * @return array<string, mixed>
     */
    public static function cmsHealth(): array
    {
        $countContent = fn (string $model) => $model::query()->whereNull('deleted_at')->count();
        $countActive = fn (string $model) => $model::query()->whereNull('deleted_at')->where('is_active', true)->count();
        // section_configs gates visibility with is_enabled, not is_active.
        $sectionEnabled = fn () => SectionConfig::query()->whereNull('deleted_at')->where('is_enabled', true)->count();

        // An active page with no section configs renders as an empty shell.
        $orphanPages = Page::query()
            ->whereNull('deleted_at')
            ->where('is_active', true)
            ->doesntHave('sectionConfigs')
            ->pluck('slug')
            ->values()
            ->all();

        $disabledSections = SectionConfig::query()
            ->whereNull('deleted_at')
            ->where('is_enabled', false)
            ->groupBy('page_slug')
            ->select('page_slug', DB::raw('COUNT(*) AS disabled_count'))
            ->orderByDesc('disabled_count')
            ->get()
            ->map(fn ($r) => ['page_slug' => $r->page_slug, 'disabled_count' => (int) $r->disabled_count])
            ->values()
            ->all();

        return [
            'pages' => [
                'total'   => $countContent(Page::class),
                'active'  => $countActive(Page::class),
                'drafts'  => $countContent(Page::class) - $countActive(Page::class),
            ],
            'sections' => [
                'total'            => $countContent(SectionConfig::class),
                'enabled'          => $sectionEnabled(),
                'disabled'         => $countContent(SectionConfig::class) - $sectionEnabled(),
                'disabled_by_page' => $disabledSections,
            ],
            'blogs' => [
                'total'    => $countContent(Blog::class),
                'active'   => $countActive(Blog::class),
                'featured' => Blog::query()->whereNull('deleted_at')->where('is_featured', true)->count(),
            ],
            'programs' => [
                'total'  => $countContent(Program::class),
                'active' => $countActive(Program::class),
            ],
            'publications' => [
                'total'  => $countContent(Publication::class),
                'active' => $countActive(Publication::class),
            ],
            'integrity' => [
                'orphan_pages'    => count($orphanPages),
                'orphan_page_list' => $orphanPages,
            ],
            'recent_content' => Blog::query()
                ->whereNull('deleted_at')
                ->orderByDesc('updated_at')
                ->limit(5)
                ->get(['id', 'title', 'is_active', 'updated_at'])
                ->map(fn ($b) => [
                    'id'         => $b->id,
                    'title'      => $b->title,
                    'is_active'  => (bool) $b->is_active,
                    'updated_at' => $b->updated_at?->toDateTimeString(),
                ])
                ->values()
                ->all(),
        ];
    }

    /* ==========================================
     | PANEL 8 - NEWSLETTER
     |========================================== */

    /**
     * Subscriber and campaign delivery metrics.
     *
     * Note: no open or click events are tracked anywhere in the schema, so
     * engagement rate beyond delivery cannot be computed.
     *
     * @return array<string, mixed>
     */
    public static function newsletterHealth(): array
    {
        $subscribers = NewsletterSubscription::query()
            ->selectRaw(<<<'SQL'
                COUNT(*)                                                       AS total,
                COALESCE(SUM(status = 'subscribed'), 0)     AS subscribed,
                COALESCE(SUM(status = 'unsubscribed'), 0)   AS unsubscribed,
                COALESCE(SUM(status = 'bounced'), 0)        AS bounced,
                COALESCE(SUM(subscribed_at >= ?), 0)                        AS new_30d
            SQL, [now()->subDays(30)])
            ->first();

        $totals = NewsletterCampaign::query()
            ->selectRaw(<<<'SQL'
                COUNT(*)                                             AS campaigns,
                COALESCE(SUM(total_subscribers), 0)                  AS attempted,
                COALESCE(SUM(sent_count), 0)                         AS sent,
                COALESCE(SUM(failed_count), 0)                       AS failed
            SQL)
            ->first();

        return [
            'subscribers' => [
                'total'        => (int) $subscribers->total,
                'subscribed'   => (int) $subscribers->subscribed,
                'unsubscribed' => (int) $subscribers->unsubscribed,
                'bounced'      => (int) $subscribers->bounced,
                'new_30d'      => (int) $subscribers->new_30d,
                'unsubscribe_rate' => self::rate(
                    (int) $subscribers->unsubscribed,
                    (int) $subscribers->total
                ),
            ],
            'campaigns' => [
                'total'         => (int) $totals->campaigns,
                'attempted'     => (int) $totals->attempted,
                'sent'          => (int) $totals->sent,
                'failed'        => (int) $totals->failed,
                'delivery_rate' => self::rate((int) $totals->sent, (int) $totals->attempted),
            ],
            'recent_campaigns' => NewsletterCampaign::query()
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(fn ($c) => [
                    'id'         => $c->id,
                    'subject'    => $c->subject,
                    'status'     => $c->status,
                    'sent'       => (int) $c->sent_count,
                    'failed'     => (int) $c->failed_count,
                    'progress'   => $c->progress,
                    'created_at' => $c->created_at?->toDateTimeString(),
                ])
                ->values()
                ->all(),
        ];
    }

    /* ==========================================
     | APPLICANT POOL
     |========================================== */

    /**
     * Job seeker supply-side metrics.
     *
     * @return array<string, mixed>
     */
    public static function applicantPool(): array
    {
        $profiles = ApplicantProfile::query()
            ->selectRaw(<<<'SQL'
                COUNT(*)                                              AS total,
                COALESCE(SUM(phone IS NOT NULL AND phone != ''), 0)   AS with_phone,
                COALESCE(SUM(photo_path IS NOT NULL), 0)              AS with_photo,
                COALESCE(SUM(current_job_title IS NOT NULL), 0)       AS with_title,
                COALESCE(SUM(birth_date IS NOT NULL), 0)              AS with_birth_date
            SQL)
            ->first();

        $total = (int) $profiles->total;
        $withCv = ApplicantProfile::query()
            ->whereHas('cvs', fn ($q) => $q->where('status', 'active'))
            ->count();

        // Applicants who applied to more than one job in the window.
        // Counted in a subquery so the outer select stays an aggregate and does
        // not trip ONLY_FULL_GROUP_BY on applications.id. The outer query uses
        // DB::query() because Application's SoftDeletes scope would otherwise
        // be injected against the subquery alias, which has no deleted_at.
        $repeatApplicants = DB::query()
            ->fromSub(
                Application::query()
                    ->select('user_id', DB::raw('COUNT(*) AS application_count'))
                    ->where('created_at', '>=', now()->subDays(30))
                    ->groupBy('user_id')
                    ->havingRaw('COUNT(*) > 1'),
                'repeat_applicants'
            )
            ->count();

        return [
            'profiles_total'        => $total,
            'with_active_cv'        => $withCv,
            'cv_upload_rate'        => self::rate($withCv, $total),
            'with_phone'            => (int) $profiles->with_phone,
            'with_photo'            => (int) $profiles->with_photo,
            'with_job_title'        => (int) $profiles->with_title,
            'with_birth_date'       => (int) $profiles->with_birth_date,
            'photo_rate'            => self::rate((int) $profiles->with_photo, $total),
            'repeat_applicants_30d' => $repeatApplicants,
            'applications_per_seeker' => self::safeDiv(
                Application::whereNull('deleted_at')->count(),
                max(1, User::query()->whereHas('roles', fn ($q) => $q->where('slug', 'job-seeker'))->count())
            ),
        ];
    }

    /* ==========================================
     | RECENT ACTIVITY
     |========================================== */

    /**
     * Unified recent-activity feed across jobs, applications and signups.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function recentActivity(int $limit = 10): array
    {
        $jobs = JobListing::query()
            ->with('employer:id,name')
            ->latest('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (JobListing $job) => [
                'type'      => 'job_posted',
                'actor'     => $job->employer?->name ?? 'Unknown',
                'title'     => $job->title,
                'occurred_at' => $job->created_at?->toDateTimeString(),
            ]);

        $applications = Application::query()
            ->with(['jobListing:id,title,user_id', 'jobListing.employer:id,name'])
            ->latest('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Application $app) => [
                'type'        => 'application_submitted',
                'actor'       => $app->name,
                'title'       => $app->jobListing?->title ?? 'Removed job',
                'company'     => $app->jobListing?->employer?->name ?? 'N/A',
                'status'      => $app->status,
                'ats_score'   => $app->ats_score_percentage,
                'occurred_at' => $app->created_at?->toDateTimeString(),
            ]);

        $signups = User::query()
            ->latest('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (User $user) => [
                'type'        => 'user_registered',
                'actor'       => $user->name,
                'title'       => $user->email,
                'roles'       => $user->roles?->pluck('slug')->all() ?? [],
                'occurred_at' => $user->created_at?->toDateTimeString(),
            ]);

        return $jobs
            ->concat($applications)
            ->concat($signups)
            ->filter(fn ($item) => $item['occurred_at'] !== null)
            ->sortByDesc('occurred_at')
            ->take($limit)
            ->values()
            ->all();
    }

    /* ==========================================
     | PERIOD COMPARISON
     |========================================== */

    /**
     * Percentage change between a current window and the one before it.
     *
     * @return array<string, float|null>
     */
    public static function periodComparison(int $days = 30): array
    {
        $current = now()->subDays($days);
        $previous = now()->subDays($days * 2);

        $count = fn (Builder $q, $from, $to) => (clone $q)
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $metric = function (Builder $model) use ($count, $current, $previous, $days) {
            $now = $count($model, $current, now());
            $before = $count($model, $previous, $current);

            return [
                'current'  => $now,
                'previous' => $before,
                'change'   => $before > 0 ? round(($now - $before) / $before * 100, 1) : null,
            ];
        };

        return [
            'applications' => $metric(Application::query()),
            'views'        => $metric(JobView::query()),
            'jobs'         => $metric(JobListing::query()),
            'signups'      => $metric(User::query()),
            'days'         => $days,
        ];
    }

    /* ==========================================
     | HELPERS
     |========================================== */

    /**
     * Percentage of $part relative to $whole, null when the base is zero.
     */
    private static function rate(int|float $part, int|float $whole): ?float
    {
        if ($whole <= 0) {
            return null;
        }

        return round($part / $whole * 100, 2);
    }

    /**
     * Division that tolerates a zero denominator.
     */
    private static function safeDiv(int|float $part, int|float $whole): float
    {
        return $whole > 0 ? round($part / $whole, 2) : 0.0;
    }

    /**
     * Count users holding a single role.
     */
    private static function countByRoleSlug(string $slug): int
    {
        return User::query()
            ->whereHas('roles', fn ($q) => $q->where('slug', $slug))
            ->count();
    }

    /**
     * Count users holding any of the given roles.
     *
     * @param  array<int, string>  $slugs
     */
    private static function countByRoleSlugs(array $slugs): int
    {
        return User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('slug', $slugs))
            ->count();
    }

    /**
     * Build a date range start from a named range, or null for "all time".
     */
    public static function resolveDateRange(?string $range): ?CarbonInterface
    {
        return match ($range) {
            '7d'  => now()->subDays(7)->startOfDay(),
            '30d' => now()->subDays(30)->startOfDay(),
            '90d' => now()->subDays(90)->startOfDay(),
            '12m' => now()->subMonths(12)->startOfDay(),
            default => null,
        };
    }

    /**
     * Translate a named range into a day count for series generation.
     */
    public static function rangeToDays(?string $range): int
    {
        return match ($range) {
            '7d'  => 7,
            '90d' => 90,
            '12m' => 365,
            default => 30,
        };
    }
}
