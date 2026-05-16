<?php
// app/Http/Controllers/Profile/ApplicantProfileController.php

namespace App\Http\Controllers\Profile;

// Models
use App\Models\User;
use App\Models\JobHistory;
use App\Models\Achievement;
use App\Models\ApplicantCv;
use App\Models\ApplicantProfile;
use App\Models\EducationHistory;

// Controllers
use App\Http\Controllers\Controller;

// Requests
use Illuminate\Http\Request;

// Facades
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

// Exceptions
use Illuminate\Validation\ValidationException;

use Illuminate\Http\UploadedFile;

// Builder
use Illuminate\Database\Eloquent\Builder;

// Support
use Illuminate\Support\Str;

// Inertia
use Inertia\Inertia;

class ApplicantProfileController extends Controller
{

    /**
     * Display all applicant profiles with comprehensive filtering and sorting
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to view profiles list
        if (!$user || !$user->hasPermission('profiles.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view applicant profiles.');
        }

        $query = ApplicantProfile::with([
            'user',
            'cvs' => function ($q) {
                $q->where('status', 'active')->orderBy('order_position');
            },
            'primaryCv',
            'jobHistories' => function ($q) {
                $q->orderBy('starting_year', 'desc')->limit(3);
            },
            'educationHistories' => function ($q) {
                $q->orderBy('passing_year', 'desc')->limit(2);
            },
            'achievements' => function ($q) {
                $q->latest()->limit(3);
            },
            'applications' => function ($q) {
                $q->latest()->limit(5);
            }
        ]);

        // ==========================================
        // SEARCH FILTERS
        // ==========================================

        // Search by name (first_name or last_name)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('email', 'like', "%{$search}%");
                    });
            });
        }

        // Search by email through user relation
        if ($request->filled('email')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('email', 'like', "%{$request->email}%");
            });
        }

        // ==========================================
        // BASIC INFO FILTERS
        // ==========================================

        // Filter by gender
        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        // Filter by blood type
        if ($request->filled('blood_type')) {
            $query->where('blood_type', $request->blood_type);
        }

        // Filter by phone
        if ($request->filled('phone')) {
            $query->where('phone', 'like', "%{$request->phone}%");
        }

        // Address/location filter
        if ($request->filled('address')) {
            $query->where('address', 'like', "%{$request->address}%");
        }

        // ==========================================
        // DATE RANGE FILTERS
        // ==========================================

        // Birth date range
        if ($request->filled('birth_date_from')) {
            $query->whereDate('birth_date', '>=', $request->birth_date_from);
        }

        if ($request->filled('birth_date_to')) {
            $query->whereDate('birth_date', '<=', $request->birth_date_to);
        }

        // Age range (calculated from birth_date)
        if ($request->filled('min_age')) {
            $minBirthDate = now()->subYears((int) $request->min_age)->format('Y-m-d');
            $query->whereDate('birth_date', '<=', $minBirthDate);
        }

        if ($request->filled('max_age')) {
            $maxBirthDate = now()->subYears((int) $request->max_age)->format('Y-m-d');
            $query->whereDate('birth_date', '>=', $maxBirthDate);
        }

        // Created date range
        if ($request->filled('created_from')) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }

        if ($request->filled('created_to')) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }

        // Date range presets
        if ($request->filled('date_range')) {
            switch ($request->date_range) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'yesterday':
                    $query->whereDate('created_at', today()->subDay());
                    break;
                case 'this_week':
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('created_at', now()->month);
                    break;
                case 'last_month':
                    $query->whereMonth('created_at', now()->subMonth()->month);
                    break;
                case 'this_year':
                    $query->whereYear('created_at', now()->year);
                    break;
            }
        }

        // ==========================================
        // PROFESSIONAL INFO FILTERS
        // ==========================================

        // Experience years range
        if ($request->filled('min_experience')) {
            $query->where('experience_years', '>=', (int) $request->min_experience);
        }

        if ($request->filled('max_experience')) {
            $query->where('experience_years', '<=', (int) $request->max_experience);
        }

        // Experience level categories
        if ($request->filled('experience_level')) {
            $ranges = [
                'fresher' => ['min' => 0, 'max' => 0],
                'entry' => ['min' => 0, 'max' => 1],
                'junior' => ['min' => 1, 'max' => 3],
                'mid' => ['min' => 3, 'max' => 6],
                'senior' => ['min' => 6, 'max' => 10],
                'expert' => ['min' => 10, 'max' => 100],
            ];

            if (isset($ranges[$request->experience_level])) {
                $range = $ranges[$request->experience_level];
                $query->whereBetween('experience_years', [$range['min'], $range['max']]);
            }
        }

        // Current job title filter
        if ($request->filled('current_job_title')) {
            $query->where('current_job_title', 'like', "%{$request->current_job_title}%");
        }

        // Has current job (not null and not empty)
        if ($request->filled('has_current_job')) {
            if ($request->has_current_job === 'yes') {
                $query->whereNotNull('current_job_title')
                    ->where('current_job_title', '!=', '');
            } else {
                $query->where(function ($q) {
                    $q->whereNull('current_job_title')
                        ->orWhere('current_job_title', '');
                });
            }
        }

        // Has work experience
        if ($request->filled('has_experience')) {
            if ($request->has_experience === 'yes') {
                $query->where('experience_years', '>', 0)
                    ->orWhereNotNull('current_job_title');
            } else {
                $query->where(function ($q) {
                    $q->whereNull('experience_years')
                        ->orWhere('experience_years', 0);
                })->where(function ($q) {
                    $q->whereNull('current_job_title')
                        ->orWhere('current_job_title', '');
                });
            }
        }

        // Has CV uploaded
        if ($request->filled('has_cv')) {
            if ($request->has_cv === 'yes') {
                $query->whereHas('cvs', function ($q) {
                    $q->where('status', 'active');
                });
            } else {
                $query->whereDoesntHave('cvs', function ($q) {
                    $q->where('status', 'active');
                });
            }
        }

        // Has primary CV
        if ($request->filled('has_primary_cv')) {
            if ($request->has_primary_cv === 'yes') {
                $query->whereHas('primaryCv');
            } else {
                $query->whereDoesntHave('primaryCv');
            }
        }

        // ==========================================
        // COMPLETION & STATUS FILTERS
        // ==========================================

        // Profile completion status (using isComplete method)
        if ($request->filled('completion_status')) {
            switch ($request->completion_status) {
                case 'complete':
                    $query->complete();
                    break;
                case 'incomplete':
                    foreach (ApplicantProfile::REQUIRED_FIELDS as $field) {
                        $query->where(function ($q) use ($field) {
                            $q->whereNull($field)->orWhere($field, '');
                        });
                    }
                    break;
                case 'minimal':
                    foreach (ApplicantProfile::REQUIRED_FIELDS as $field) {
                        $query->whereNotNull($field)->where($field, '!=', '');
                    }
                    $query->where(function ($q) {
                        $q->whereNull('experience_years')
                            ->orWhere('experience_years', 0);
                    })->where(function ($q) {
                        $q->whereNull('current_job_title')
                            ->orWhere('current_job_title', '');
                    });
                    break;
                case 'complete_with_cv':
                    $query->complete()->whereHas('cvs', function ($q) {
                        $q->where('status', 'active');
                    });
                    break;
            }
        }

        // Completion percentage range
        if ($request->filled('min_completion')) {
            // Handled in collection transform
        }

        // Profile status (active/deleted)
        if ($request->filled('trashed')) {
            switch ($request->trashed) {
                case 'only':
                    $query->onlyTrashed();
                    break;
                case 'with':
                    $query->withTrashed();
                    break;
            }
        }

        // ==========================================
        // APPLICATION RELATED FILTERS
        // ==========================================

        // Has applied to any job
        if ($request->filled('has_applied')) {
            if ($request->has_applied === 'yes') {
                $query->whereHas('applications');
            } else {
                $query->whereDoesntHave('applications');
            }
        }

        // Minimum application count
        if ($request->filled('min_applications')) {
            $query->whereHas('applications', function ($q) use ($request) {
                $q->havingRaw('COUNT(*) >= ?', [(int) $request->min_applications]);
            });
        }

        // Filter by application status
        if ($request->filled('application_status')) {
            $query->whereHas('applications', function ($q) use ($request) {
                $q->where('status', $request->application_status);
            });
        }

        // Filter by job applied to
        if ($request->filled('applied_to_job_id')) {
            $query->whereHas('applications', function ($q) use ($request) {
                $q->where('job_listing_id', $request->applied_to_job_id);
            });
        }

        // Filter by ATS score range from applications
        if ($request->filled('min_ats_score') || $request->filled('max_ats_score')) {
            $query->whereHas('applications', function ($q) use ($request) {
                if ($request->filled('min_ats_score')) {
                    $minScore = (int) $request->min_ats_score;
                    $q->where(function ($subQ) use ($minScore) {
                        $subQ->whereRaw('JSON_EXTRACT(ats_score, "$.percentage") >= ?', [$minScore])
                            ->orWhereRaw('ats_score >= ?', [$minScore]);
                    });
                }
                if ($request->filled('max_ats_score')) {
                    $maxScore = (int) $request->max_ats_score;
                    $q->where(function ($subQ) use ($maxScore) {
                        $subQ->whereRaw('JSON_EXTRACT(ats_score, "$.percentage") <= ?', [$maxScore])
                            ->orWhereRaw('ats_score <= ?', [$maxScore]);
                    });
                }
            });
        }

        // ==========================================
        // SOCIAL LINKS FILTERS
        // ==========================================

        // Has any social links
        if ($request->filled('has_social_links')) {
            if ($request->has_social_links === 'yes') {
                $query->whereNotNull('social_links')
                    ->where('social_links', '!=', '[]')
                    ->where('social_links', '!=', 'null');
            } else {
                $query->where(function ($q) {
                    $q->whereNull('social_links')
                        ->orWhere('social_links', '[]')
                        ->orWhere('social_links', 'null');
                });
            }
        }

        // Specific social link presence
        if ($request->filled('has_linkedin')) {
            $query->whereJsonContains('social_links->linkedin', 'like', '%linkedin%');
        }

        if ($request->filled('has_facebook')) {
            $query->whereJsonContains('social_links->facebook', 'like', '%facebook%');
        }

        if ($request->filled('has_twitter')) {
            $query->whereJsonContains('social_links->twitter', 'like', '%twitter%');
        }

        // ==========================================
        // JOB HISTORY FILTERS
        // ==========================================

        // Has job history entries
        if ($request->filled('has_job_history')) {
            if ($request->has_job_history === 'yes') {
                $query->whereHas('jobHistories');
            } else {
                $query->whereDoesntHave('jobHistories');
            }
        }

        // Minimum job history count
        if ($request->filled('min_job_history_count')) {
            $query->whereHas('jobHistories', function ($q) use ($request) {
                $q->havingRaw('COUNT(*) >= ?', [(int) $request->min_job_history_count]);
            });
        }

        // Worked at specific company
        if ($request->filled('company_name')) {
            $query->whereHas('jobHistories', function ($q) use ($request) {
                $q->where('company_name', 'like', "%{$request->company_name}%");
            });
        }

        // Held specific position
        if ($request->filled('position')) {
            $query->whereHas('jobHistories', function ($q) use ($request) {
                $q->where('position', 'like', "%{$request->position}%");
            });
        }

        // ==========================================
        // EDUCATION FILTERS
        // ==========================================

        // Has education entries
        if ($request->filled('has_education')) {
            if ($request->has_education === 'yes') {
                $query->whereHas('educationHistories');
            } else {
                $query->whereDoesntHave('educationHistories');
            }
        }

        // Degree filter
        if ($request->filled('degree')) {
            $query->whereHas('educationHistories', function ($q) use ($request) {
                $q->where('degree', 'like', "%{$request->degree}%");
            });
        }

        // Institution filter
        if ($request->filled('institution')) {
            $query->whereHas('educationHistories', function ($q) use ($request) {
                $q->where('institution_name', 'like', "%{$request->institution}%");
            });
        }

        // Passing year range
        if ($request->filled('min_passing_year')) {
            $query->whereHas('educationHistories', function ($q) use ($request) {
                $q->where('passing_year', '>=', (int) $request->min_passing_year);
            });
        }

        if ($request->filled('max_passing_year')) {
            $query->whereHas('educationHistories', function ($q) use ($request) {
                $q->where('passing_year', '<=', (int) $request->max_passing_year);
            });
        }

        // ==========================================
        // ACHIEVEMENTS FILTERS
        // ==========================================

        // Has achievements
        if ($request->filled('has_achievements')) {
            if ($request->has_achievements === 'yes') {
                $query->whereHas('achievements');
            } else {
                $query->whereDoesntHave('achievements');
            }
        }

        // Minimum achievements count
        if ($request->filled('min_achievements')) {
            $query->whereHas('achievements', function ($q) use ($request) {
                $q->havingRaw('COUNT(*) >= ?', [(int) $request->min_achievements]);
            });
        }

        // ==========================================
        // USER ACCOUNT FILTERS
        // ==========================================

        // Email verification status
        if ($request->filled('email_verified')) {
            if ($request->email_verified === 'yes') {
                $query->whereHas('user', function ($q) {
                    $q->whereNotNull('email_verified_at');
                });
            } else {
                $query->whereHas('user', function ($q) {
                    $q->whereNull('email_verified_at');
                });
            }
        }

        // User status (if user soft deleted)
        if ($request->filled('user_status')) {
            switch ($request->user_status) {
                case 'active':
                    $query->whereHas('user', function ($q) {
                        $q->whereNull('deleted_at');
                    });
                    break;
                case 'deleted':
                    $query->whereHas('user', function ($q) {
                        $q->onlyTrashed();
                    });
                    break;
            }
        }

        // ==========================================
        // SORTING
        // ==========================================

        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        $allowedSortFields = [
            'created_at',
            'updated_at',
            'first_name',
            'last_name',
            'birth_date',
            'experience_years',
            'current_job_title',
            'phone',
        ];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } elseif ($sortField === 'full_name') {
            $query->orderBy('first_name', $sortDirection)
                ->orderBy('last_name', $sortDirection);
        } elseif ($sortField === 'email') {
            $query->whereHas('user', function ($q) use ($sortDirection) {
                $q->orderBy('email', $sortDirection);
            });
        } elseif ($sortField === 'completion_percentage') {
            // Special handling - will sort after query
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // ==========================================
        // PAGINATION
        // ==========================================

        $perPage = $request->get('per_page', 7);
        $profiles = $query->paginate($perPage)->withQueryString();

        // Add computed attributes to collection
        $profiles->getCollection()->transform(function ($profile) {
            $profile->completion_percentage = $profile->completionPercentage();
            $profile->full_name = $profile->full_name;
            $profile->email = $profile->user?->email;
            $profile->photo_url = $profile->photo_path
                ? ($profile->photo_path ? route('profile.photo', ['path' => $profile->photo_path]) : null)
                : null;
            $profile->experience_level_label = $this->getExperienceLevelLabel($profile->experience_years);
            $profile->applications_count = $profile->applications()->count();
            $profile->active_cvs_count = $profile->cvs()->where('status', 'active')->count();
            return $profile;
        });

        // Sort by completion percentage if requested
        if ($sortField === 'completion_percentage') {
            $profiles->getCollection()->sortBy([
                ['completion_percentage', $sortDirection === 'desc' ? SORT_DESC : SORT_ASC]
            ]);
        }

        // ==========================================
        // STATISTICS FOR FILTER OPTIONS
        // ==========================================

        $statsQuery = ApplicantProfile::query();
        $this->applyFiltersToQuery($statsQuery, $request, false);

        $experienceStats = (clone $statsQuery)->selectRaw('
            MIN(experience_years) as min_exp,
            MAX(experience_years) as max_exp,
            AVG(experience_years) as avg_exp')->first();

        $ageStats = (clone $statsQuery)->selectRaw('
            MIN(YEAR(birth_date)) as min_birth_year,
            MAX(YEAR(birth_date)) as max_birth_year')->whereNotNull('birth_date')->first();

        $statusCounts = [
            'total' => (clone $statsQuery)->count(),
            'complete' => (clone $statsQuery)->complete()->count(),
            'incomplete' => (clone $statsQuery)->where(function ($q) {
                foreach (ApplicantProfile::REQUIRED_FIELDS as $field) {
                    $q->where(function ($subQ) use ($field) {
                        $subQ->whereNull($field)->orWhere($field, '');
                    });
                }
            })->count(),
            'has_cv' => (clone $statsQuery)->whereHas('cvs', function ($q) {
                $q->where('status', 'active');
            })->count(),
            'has_applied' => (clone $statsQuery)->whereHas('applications')->count(),
            'deleted' => ApplicantProfile::onlyTrashed()->count(),
        ];

        $genderStats = (clone $statsQuery)
            ->selectRaw('gender, COUNT(*) as count')
            ->whereNotNull('gender')
            ->groupBy('gender')
            ->pluck('count', 'gender')
            ->toArray();

        $experienceLevels = ['fresher', 'entry', 'junior', 'mid', 'senior', 'expert'];
        $experienceDistribution = [];
        foreach ($experienceLevels as $level) {
            $ranges = [
                'fresher' => [0, 0],
                'entry' => [0, 1],
                'junior' => [1, 3],
                'mid' => [3, 6],
                'senior' => [6, 10],
                'expert' => [10, 100],
            ];
            $range = $ranges[$level];
            $experienceDistribution[$level] = (clone $statsQuery)
                ->whereBetween('experience_years', [$range[0], $range[1]])
                ->count();
        }

        return inertia('Backend/ApplicantProfile/Index', [
            'profiles' => $profiles,
            'filters' => $request->only([
                'search',
                'email',
                'gender',
                'blood_type',
                'phone',
                'address',
                'birth_date_from',
                'birth_date_to',
                'min_age',
                'max_age',
                'created_from',
                'created_to',
                'date_range',
                'min_experience',
                'max_experience',
                'experience_level',
                'current_job_title',
                'has_current_job',
                'has_experience',
                'has_cv',
                'has_primary_cv',
                'completion_status',
                'min_completion',
                'trashed',
                'has_applied',
                'min_applications',
                'application_status',
                'applied_to_job_id',
                'min_ats_score',
                'max_ats_score',
                'has_social_links',
                'has_linkedin',
                'has_facebook',
                'has_twitter',
                'has_job_history',
                'min_job_history_count',
                'company_name',
                'position',
                'has_education',
                'degree',
                'institution',
                'min_passing_year',
                'max_passing_year',
                'has_achievements',
                'min_achievements',
                'email_verified',
                'user_status',
                'sort',
                'direction',
                'per_page'
            ]),
            'filterOptions' => [
                'genders' => ['male', 'female', 'other'],
                'blood_types' => ApplicantProfile::$bloodTypes,
                'experience' => [
                    'min' => (int) ($experienceStats->min_exp ?? 0),
                    'max' => (int) ($experienceStats->max_exp ?? 30),
                    'avg' => round($experienceStats->avg_exp ?? 0, 1),
                ],
                'age' => [
                    'min' => $ageStats->min_birth_year ? now()->year - (int) $ageStats->max_birth_year : 18,
                    'max' => $ageStats->max_birth_year ? now()->year - (int) $ageStats->min_birth_year : 65,
                ],
                'completion_levels' => [
                    'complete' => $statusCounts['complete'],
                    'incomplete' => $statusCounts['incomplete'],
                    'complete_with_cv' => (clone $statsQuery)->complete()->whereHas('cvs')->count(),
                ],
            ],
            'statusCounts' => $statusCounts,
            'genderDistribution' => $genderStats,
            'experienceDistribution' => $experienceDistribution,
            'totalProfiles' => ApplicantProfile::count(),
        ]);
    }

    /**
     * Apply filters to a query (helper method to avoid duplication)
     */
    private function applyFiltersToQuery(Builder $query, Request $request, bool $withRelations = true): void
    {
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
            });
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        if ($request->filled('min_experience')) {
            $query->where('experience_years', '>=', (int) $request->min_experience);
        }

        if ($request->filled('max_experience')) {
            $query->where('experience_years', '<=', (int) $request->max_experience);
        }

        if ($request->filled('date_range')) {
            switch ($request->date_range) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'this_month':
                    $query->whereMonth('created_at', now()->month);
                    break;
            }
        }

        if ($request->filled('trashed')) {
            switch ($request->trashed) {
                case 'only':
                    $query->onlyTrashed();
                    break;
                case 'with':
                    $query->withTrashed();
                    break;
            }
        }
    }

    /**
     * Get experience level label from years
     */
    private function getExperienceLevelLabel(?int $years): string
    {
        if ($years === null || $years === 0) {
            return 'Fresher';
        }
        if ($years <= 1) {
            return 'Entry Level';
        }
        if ($years <= 3) {
            return 'Junior';
        }
        if ($years <= 6) {
            return 'Mid Level';
        }
        if ($years <= 10) {
            return 'Senior';
        }
        return 'Expert';
    }

    /**
     * Display the applicant's profile (show page)
     */
    public function show(?int $id = null)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user) {
            return redirect()->route('login')
                ->with('error', 'Please login to view profiles.');
        }

        // If no ID provided, show the authenticated user's profile (owner view)
        if (is_null($id)) {
            // Check if user can view their own profile
            if (!$user->hasPermission('profiles.view.own')) {
                return redirect()->route('unauthorized.access')
                    ->with('error', 'You do not have permission to view your profile.');
            }

            $profile = ApplicantProfile::withTrashed()
                ->with([
                    'cvs' => function ($query) {
                        $query->orderBy('order_position')->orderBy('created_at', 'desc');
                    },
                    'jobHistories' => function ($query) {
                        $query->orderBy('starting_year', 'desc')->orderBy('created_at', 'desc');
                    },
                    'educationHistories' => function ($query) {
                        $query->orderBy('passing_year', 'desc')->orderBy('created_at', 'desc');
                    },
                    'achievements' => function ($query) {
                        $query->orderBy('created_at', 'desc');
                    },
                    'applications' => function ($query) {
                        $query->with(['jobListing' => function ($q) {
                            $q->with(['category', 'locations']);
                        }])->orderBy('created_at', 'desc');
                    },
                    'user'
                ])
                ->where('user_id', $user->id)
                ->first();
        } else {
            // Viewing another profile - need profiles.view.any permission
            if (!$user->hasPermission('profiles.view.any')) {
                return redirect()->route('unauthorized.access')
                    ->with('error', 'You do not have permission to view other profiles.');
            }

            $profile = ApplicantProfile::withTrashed()
                ->with([
                    'cvs' => function ($query) {
                        $query->orderBy('order_position')->orderBy('created_at', 'desc');
                    },
                    'jobHistories' => function ($query) {
                        $query->orderBy('starting_year', 'desc')->orderBy('created_at', 'desc');
                    },
                    'educationHistories' => function ($query) {
                        $query->orderBy('passing_year', 'desc')->orderBy('created_at', 'desc');
                    },
                    'achievements' => function ($query) {
                        $query->orderBy('created_at', 'desc');
                    },
                    'applications' => function ($query) {
                        $query->with(['jobListing' => function ($q) {
                            $q->with(['category', 'locations']);
                        }])->orderBy('created_at', 'desc');
                    },
                    'user'
                ])
                ->where('id', $id)
                ->first();
        }

        if (!$profile) {
            return redirect()->route('dashboard')
                ->with('error', 'Profile not found.');
        }

        $isOwner = ($user->id === $profile->user_id);
        $canDelete = false;

        if ($isOwner) {
            $canDelete = $user->hasPermission('profiles.destroy');
        } else {
            $canDelete = $user->hasPermission('profiles.delete.any');
        }

        if ($profile) {
            $profile->photo_url = $profile->photo_path
                ? route('profile.photo', ['path' => $profile->photo_path])
                : null;

            foreach ($profile->cvs as $cv) {
                $cv->cv_url = $cv->cv_path ? asset('storage/' . $cv->cv_path) : null;
                $cv->file_size = $cv->cv_path && Storage::disk('public')->exists($cv->cv_path)
                    ? Storage::disk('public')->size($cv->cv_path)
                    : null;
            }

            $profile->completion_percentage = $profile->completionPercentage();
            $profile->email = $profile->user?->email;
        }

        return Inertia::render('Backend/ApplicantProfile/Show', [
            'profile' => $profile,
            'canEdit' => $isOwner,
            'canDelete' => $canDelete,
        ]);
    }

    /**
     * Serve profile photo from storage to avoid public symlink issues.
     */
    public function photo(string $path)
    {
        if (Str::contains($path, '..')) {
            abort(404);
        }

        if (!Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return response()->file(Storage::disk('public')->path($path));
    }

    /**
     * Update Basic Information only
     */
    public function updateBasicInfo(Request $request, ApplicantProfile $applicantProfile)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Only profile owner can update basic info
        if ($user->id !== $applicantProfile->user_id) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        if (!$user->hasPermission('profiles.update_basic')) {
            return response()->json(['error' => 'You do not have permission to update basic information.'], 403);
        }

        if ($applicantProfile->trashed()) {
            return response()->json(['error' => 'Cannot update a deleted profile.'], 422);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'blood_type' => 'nullable|string|max:3',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'remove_photo' => 'nullable|boolean',
        ]);

        $profileData = [
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'birth_date' => $validated['birth_date'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'blood_type' => $validated['blood_type'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
        ];

        if ($request->boolean('remove_photo') && $applicantProfile->photo_path) {
            Storage::disk('public')->delete($applicantProfile->photo_path);
            $profileData['photo_path'] = null;
        }

        if ($request->hasFile('photo')) {
            if ($applicantProfile->photo_path) {
                Storage::disk('public')->delete($applicantProfile->photo_path);
            }
            $photoPath = $this->handlePhotoUpload($request->file('photo'), $applicantProfile->user_id);
            $profileData['photo_path'] = $photoPath;
        }

        $applicantProfile->update($profileData);

        return response()->json([
            'success' => true,
            'message' => 'Basic information updated successfully!',
            'profile' => $applicantProfile->fresh()
        ]);
    }

    /**
     * Update Professional Information only
     */
    public function updateProfessionalInfo(Request $request, ApplicantProfile $applicantProfile)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($user->id !== $applicantProfile->user_id) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        if (!$user->hasPermission('profiles.update_professional')) {
            return response()->json(['error' => 'You do not have permission to update professional information.'], 403);
        }

        if ($applicantProfile->trashed()) {
            return response()->json(['error' => 'Cannot update a deleted profile.'], 422);
        }

        $validated = $request->validate([
            'experience_years' => 'nullable|integer|min:0|max:60',
            'current_job_title' => 'nullable|string|max:255',
            'social_links' => 'nullable|array',
        ]);

        $applicantProfile->update([
            'experience_years' => $validated['experience_years'] ?? null,
            'current_job_title' => $validated['current_job_title'] ?? null,
            'social_links' => $validated['social_links'] ?? [],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Professional information updated successfully!',
            'profile' => $applicantProfile->fresh()
        ]);
    }

    /**
     * Update Work Experience (Job Histories)
     */
    public function updateWorkExperiences(Request $request, ApplicantProfile $applicantProfile)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($user->id !== $applicantProfile->user_id) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        if (!$user->hasPermission('profiles.update_work')) {
            return response()->json(['error' => 'You do not have permission to update work experience.'], 403);
        }

        if ($applicantProfile->trashed()) {
            return response()->json(['error' => 'Cannot update a deleted profile.'], 422);
        }

        $validated = $request->validate([
            'job_histories' => 'nullable|array',
            'job_histories.*.id' => 'nullable|exists:job_histories,id',
            'job_histories.*.company_name' => 'required|string|max:255',
            'job_histories.*.position' => 'required|string|max:255',
            'job_histories.*.starting_year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'job_histories.*.ending_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'job_histories.*.is_current' => 'nullable|boolean',
            'job_histories.*.to_delete' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated, $applicantProfile) {
            foreach ($validated['job_histories'] ?? [] as $jobData) {
                if (!empty($jobData['to_delete']) && isset($jobData['id'])) {
                    JobHistory::where('id', $jobData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->delete();
                    continue;
                }

                if (!empty($jobData['is_current'])) {
                    $jobData['ending_year'] = null;
                }

                if (isset($jobData['id'])) {
                    JobHistory::where('id', $jobData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->update([
                            'company_name' => $jobData['company_name'],
                            'position' => $jobData['position'],
                            'starting_year' => $jobData['starting_year'],
                            'ending_year' => $jobData['ending_year'] ?? null,
                            'is_current' => $jobData['is_current'] ?? false,
                        ]);
                } else {
                    $applicantProfile->jobHistories()->create([
                        'company_name' => $jobData['company_name'],
                        'position' => $jobData['position'],
                        'starting_year' => $jobData['starting_year'],
                        'ending_year' => $jobData['ending_year'] ?? null,
                        'is_current' => $jobData['is_current'] ?? false,
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Work experience updated successfully!',
            'job_histories' => $applicantProfile->fresh()->jobHistories
        ]);
    }

    /**
     * Update Education
     */
    public function updateEducations(Request $request, ApplicantProfile $applicantProfile)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($user->id !== $applicantProfile->user_id) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        if (!$user->hasPermission('profiles.update_education')) {
            return response()->json(['error' => 'You do not have permission to update education.'], 403);
        }

        if ($applicantProfile->trashed()) {
            return response()->json(['error' => 'Cannot update a deleted profile.'], 422);
        }

        $validated = $request->validate([
            'education_histories' => 'nullable|array',
            'education_histories.*.id' => 'nullable|exists:education_histories,id',
            'education_histories.*.institution_name' => 'required|string|max:255',
            'education_histories.*.degree' => 'required|string|max:255',
            'education_histories.*.passing_year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'education_histories.*.to_delete' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated, $applicantProfile) {
            foreach ($validated['education_histories'] ?? [] as $eduData) {
                if (!empty($eduData['to_delete']) && isset($eduData['id'])) {
                    EducationHistory::where('id', $eduData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->delete();
                    continue;
                }

                if (isset($eduData['id'])) {
                    EducationHistory::where('id', $eduData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->update([
                            'institution_name' => $eduData['institution_name'],
                            'degree' => $eduData['degree'],
                            'passing_year' => $eduData['passing_year'],
                        ]);
                } else {
                    $applicantProfile->educationHistories()->create([
                        'institution_name' => $eduData['institution_name'],
                        'degree' => $eduData['degree'],
                        'passing_year' => $eduData['passing_year'],
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Education updated successfully!',
            'education_histories' => $applicantProfile->fresh()->educationHistories
        ]);
    }

    /**
     * Update Achievements
     */
    public function updateAchievements(Request $request, ApplicantProfile $applicantProfile)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($user->id !== $applicantProfile->user_id) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        if (!$user->hasPermission('profiles.update_achievements')) {
            return response()->json(['error' => 'You do not have permission to update achievements.'], 403);
        }

        if ($applicantProfile->trashed()) {
            return response()->json(['error' => 'Cannot update a deleted profile.'], 422);
        }

        $validated = $request->validate([
            'achievements' => 'nullable|array',
            'achievements.*.id' => 'nullable|exists:achievements,id',
            'achievements.*.achievement_name' => 'required|string|max:255',
            'achievements.*.achievement_details' => 'nullable|string',
            'achievements.*.to_delete' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated, $applicantProfile) {
            foreach ($validated['achievements'] ?? [] as $achData) {
                if (!empty($achData['to_delete']) && isset($achData['id'])) {
                    Achievement::where('id', $achData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->delete();
                    continue;
                }

                if (isset($achData['id'])) {
                    Achievement::where('id', $achData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->update([
                            'achievement_name' => $achData['achievement_name'],
                            'achievement_details' => $achData['achievement_details'] ?? null,
                        ]);
                } else {
                    $applicantProfile->achievements()->create([
                        'achievement_name' => $achData['achievement_name'],
                        'achievement_details' => $achData['achievement_details'] ?? null,
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Achievements updated successfully!',
            'achievements' => $applicantProfile->fresh()->achievements
        ]);
    }

    /**
     * Change Password
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::query()->findOrFail(Auth::id());

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($validated['new_password'])
        ])->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully!'
        ]);
    }

    /**
     * Remove the specified profile (soft delete)
     */
    public function destroy(ApplicantProfile $applicantProfile)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Only profile owner can delete their own profile
        if ($user->id !== $applicantProfile->user_id) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        if (!$user->hasPermission('profiles.destroy')) {
            return response()->json(['error' => 'You do not have permission to delete your profile.'], 403);
        }

        if ($applicantProfile->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Profile is already deleted.'
            ], 422);
        }

        DB::transaction(function () use ($applicantProfile) {
            foreach ($applicantProfile->cvs as $cv) {
                if ($cv->cv_path && Storage::disk('public')->exists($cv->cv_path)) {
                    Storage::disk('public')->delete($cv->cv_path);
                }
                $cv->forceDelete();
            }

            $applicantProfile->jobHistories()->delete();
            $applicantProfile->educationHistories()->delete();
            $applicantProfile->achievements()->delete();

            if ($applicantProfile->photo_path && Storage::disk('public')->exists($applicantProfile->photo_path)) {
                Storage::disk('public')->delete($applicantProfile->photo_path);
            }
            $applicantProfile->photo_path = null;
            $applicantProfile->save();

            $applicantProfile->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Profile has been deleted. You can restore it if needed.'
        ]);
    }

    /**
     * Restore a soft-deleted profile
     */
    public function restore(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('profiles.restore')) {
            return response()->json(['error' => 'You do not have permission to restore profiles.'], 403);
        }

        $profile = ApplicantProfile::withTrashed()->find($id);

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'No profile found to restore.'
            ], 404);
        }

        if (!$profile->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Profile is not deleted.'
            ], 422);
        }

        DB::transaction(function () use ($profile) {
            ApplicantCv::withTrashed()
                ->where('applicant_profile_id', $profile->id)
                ->restore();
            $profile->restore();
        });

        if ($profile->photo_path && !Storage::disk('public')->exists($profile->photo_path)) {
            $profile->photo_path = null;
            $profile->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile restored successfully!',
            'profile' => $profile->fresh()
        ]);
    }

    /**
     * Handle photo upload
     */
    private function handlePhotoUpload(UploadedFile $photo, int $userId): string
    {
        $fileName = 'profile_' . $userId . '_' . time() . '.' . $photo->getClientOriginalExtension();
        return $photo->storeAs('profile_photos', $fileName, 'public');
    }

    /**
     * Download the CV
     */
    public function downloadCV(ApplicantProfile $applicantProfile)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($user->id !== $applicantProfile->user_id) {
            abort(403);
        }

        if (!$user->hasPermission('profiles.download_cv')) {
            return redirect()->back()->with('error', 'You do not have permission to download CV.');
        }

        if ($applicantProfile->trashed()) {
            return redirect()->back()->with('error', 'Cannot download CV from a deleted profile.');
        }

        if (!$applicantProfile->cv_path) {
            return redirect()->back()->with('error', 'No CV found.');
        }

        $filePath = storage_path('app/public/' . $applicantProfile->cv_path);

        if (!file_exists($filePath)) {
            return redirect()->back()->with('error', 'CV file not found.');
        }

        return response()->download($filePath, $applicantProfile->full_name . '_CV.pdf');
    }

    /**
     * Get profile data for editing (AJAX endpoint)
     */
    public function getProfileData(ApplicantProfile $applicantProfile)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($user->id !== $applicantProfile->user_id) {
            abort(403);
        }

        if (!$user->hasPermission('profiles.get_data')) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        return response()->json([
            'profile' => $applicantProfile->load([
                'cvs',
                'jobHistories',
                'educationHistories',
                'achievements'
            ])
        ]);
    }

    /**
     * Bulk delete applicant profiles (soft delete)
     */
    public function bulkDelete(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('profiles.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete profiles.');
        }

        $request->validate([
            'profile_ids' => 'required|array',
            'profile_ids.*' => 'exists:applicant_profiles,id',
        ]);

        $deleted = ApplicantProfile::whereIn('id', $request->profile_ids)->delete();

        return back()->with('success', $deleted . ' profile(s) deleted successfully.');
    }

    /**
     * Bulk restore applicant profiles
     */
    public function bulkRestore(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('profiles.bulk_restore')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk restore profiles.');
        }

        $request->validate([
            'profile_ids' => 'required|array',
            'profile_ids.*' => 'exists:applicant_profiles,id',
        ]);

        $restored = ApplicantProfile::onlyTrashed()
            ->whereIn('id', $request->profile_ids)
            ->restore();

        return back()->with('success', $restored . ' profile(s) restored successfully.');
    }

    /**
     * Force delete a profile permanently
     */
    public function forceDelete(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('profiles.force_delete')) {
            return back()->with('error', 'You do not have permission to permanently delete profiles.');
        }

        $profile = ApplicantProfile::withTrashed()->findOrFail($id);

        foreach ($profile->cvs as $cv) {
            if ($cv->cv_path && Storage::disk('public')->exists($cv->cv_path)) {
                Storage::disk('public')->delete($cv->cv_path);
            }
            $cv->forceDelete();
        }

        if ($profile->photo_path && Storage::disk('public')->exists($profile->photo_path)) {
            Storage::disk('public')->delete($profile->photo_path);
        }

        $profile->jobHistories()->forceDelete();
        $profile->educationHistories()->forceDelete();
        $profile->achievements()->forceDelete();
        $profile->forceDelete();

        return back()->with('success', 'Profile permanently deleted.');
    }

    /**
     * Export applicant profiles
     */
    public function export(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('profiles.export')) {
            return back()->with('error', 'You do not have permission to export profiles.');
        }

        $request->validate([
            'format' => 'required|in:csv,xlsx',
        ]);

        $query = ApplicantProfile::with(['user']);
        $this->applyFiltersToQuery($query, $request);
        $profiles = $query->get();

        if ($profiles->isEmpty()) {
            return back()->with('error', 'No profiles found to export.');
        }

        $filename = 'applicant_profiles_' . date('Y-m-d_His');

        $csvData = [];
        foreach ($profiles as $profile) {
            $csvData[] = [
                'ID' => $profile->id,
                'Full Name' => $profile->full_name,
                'Email' => $profile->user?->email,
                'Phone' => $profile->phone,
                'Gender' => $profile->gender,
                'Blood Type' => $profile->blood_type,
                'Birth Date' => $profile->birth_date,
                'Age' => $profile->birth_date ? now()->diffInYears($profile->birth_date) : 'N/A',
                'Address' => $profile->address,
                'Experience Years' => $profile->experience_years ?? 'N/A',
                'Current Job Title' => $profile->current_job_title ?? 'N/A',
                'Has CV' => $profile->cvs->count() > 0 ? 'Yes' : 'No',
                'CV Count' => $profile->cvs->count(),
                'Has Primary CV' => $profile->primaryCv ? 'Yes' : 'No',
                'Applications Count' => $profile->applications()->count(),
                'Completion Percentage' => $profile->completionPercentage() . '%',
                'Email Verified' => $profile->user?->email_verified_at ? 'Yes' : 'No',
                'Joined Date' => $profile->created_at?->format('Y-m-d'),
                'Last Updated' => $profile->updated_at?->format('Y-m-d'),
                'Status' => $profile->trashed() ? 'Deleted' : 'Active',
            ];
        }

        $output = fopen('php://temp', 'w');
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($output, array_keys($csvData[0]));

        foreach ($csvData as $row) {
            fputcsv($output, $row);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        $extension = $request->format === 'xlsx' ? 'xlsx' : 'csv';
        $contentType = $request->format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';

        return response($csvContent, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => "attachment; filename=\"{$filename}.{$extension}\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Upload a new CV (for profile management page - active immediately)
     */
    public function uploadCv(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('profiles.upload_cv')) {
            return response()->json(['error' => 'You do not have permission to upload CV.'], 403);
        }

        $profile = ApplicantProfile::where('user_id', $user->id)->first();
        if (!$profile) {
            return response()->json([
                'message' => 'Please complete your profile first.'
            ], 422);
        }

        $validated = $request->validate([
            'cv' => 'required|file|mimes:pdf,doc,docx|max:5120',
        ]);

        $activeCount = ApplicantCv::where('applicant_profile_id', $profile->id)
            ->where('status', 'active')
            ->count();

        if ($activeCount >= ApplicantCv::MAX_CVS_PER_PROFILE) {
            return response()->json([
                'message' => sprintf('Maximum %d CVs reached.', ApplicantCv::MAX_CVS_PER_PROFILE),
            ], 422);
        }

        $path = $validated['cv']->store("cvs/{$profile->id}", 'public');

        $maxPosition = ApplicantCv::where('applicant_profile_id', $profile->id)
            ->max('order_position');
        $nextPosition = is_null($maxPosition) ? 0 : $maxPosition + 1;

        $cv = ApplicantCv::create([
            'applicant_profile_id' => $profile->id,
            'cv_path' => $path,
            'original_name' => $validated['cv']->getClientOriginalName(),
            'order_position' => $nextPosition,
            'is_primary' => $activeCount === 0,
            'status' => 'active',
        ]);

        return response()->json([
            'id' => $cv->id,
            'original_name' => $cv->original_name,
            'size' => $validated['cv']->getSize(),
            'type' => $validated['cv']->getMimeType(),
            'url' => asset('storage/' . $cv->cv_path),
            'is_primary' => $cv->is_primary,
            'status' => $cv->status,
            'order_position' => $cv->order_position,
            'upload_date' => $cv->created_at?->toISOString(),
            'cv_path' => $cv->cv_path,
        ]);
    }

    /**
     * Delete a CV (for profile management page)
     */
    public function destroyCv(ApplicantCv $cv)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($cv->applicantProfile->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$user->hasPermission('profiles.destroy_cv')) {
            return response()->json(['error' => 'You do not have permission to delete CV.'], 403);
        }

        if ($cv->cv_path && Storage::disk('public')->exists($cv->cv_path)) {
            Storage::disk('public')->delete($cv->cv_path);
        }

        $cv->forceDelete();
        ApplicantCv::reorderCvs($cv->applicant_profile_id);

        return response()->json([
            'success' => true,
            'message' => 'CV deleted successfully.'
        ]);
    }

    /**
     * Set a CV as primary (for profile management page)
     */
    public function setPrimaryCv(ApplicantCv $cv)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($cv->applicantProfile->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$user->hasPermission('profiles.set_primary_cv')) {
            return response()->json(['error' => 'You do not have permission to set primary CV.'], 403);
        }

        $cv->setAsPrimary();

        return response()->json([
            'success' => true,
            'message' => 'Primary CV updated successfully.'
        ]);
    }
}
