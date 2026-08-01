<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\JobListing;
use App\Models\pages\Page;
use App\Services\ContentService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class PageController extends Controller
{
    use SharedDataTrait;

    protected ContentService $contentService;

    /**
     * Map data_table values to fetch methods.
     */
    private const DATA_TABLE_MAP = [
        'shared_data'       => 'fetchSharedData',
        'programs'          => 'fetchPrograms',
        'blog'              => 'fetchBlogs',
        'blogs'             => 'fetchBlogs',
        'about_content'     => 'fetchAboutContent',
        'jobs'              => 'fetchJobs',
        'job_details'       => 'fetchJobDetails',
        'publications'      => 'fetchPublications',
        'custom_section_data' => 'fetchCustomSectionData',
        'pages'             => 'fetchPages',
    ];

    /**
     * Map data_key to SharedData type.
     */
    private const SHARED_DATA_MAP = [
        'bannerData'          => 'banner',
        'faqData'             => 'faq',
        'upcomingEventsData'  => 'upcoming-events',
        'topbarData'          => 'topbar',
        'navbarData'          => 'navbar',
        'footerData'          => 'footer',
        'publicationsData'    => 'publications',
        'storiesData'         => 'stories',
    ];

    /**
     * JSON keys that need to be decoded.
     * 🔥 ADDED faqData to this list
     */
    private const JSON_KEYS = [
        'storiesData',
        'upcomingEventsData',
        'faqData',  // <-- ADD THIS
    ];

    public function __construct(ContentService $contentService)
    {
        $this->contentService = $contentService;
    }
    /**
     * Handle all public pages dynamically.
     */
    public function show(string $pageSlug = 'home', ?string $detailSlug = null): SymfonyResponse
    {
        try {
            $page = $this->getPageBySlug($pageSlug);

            if (!$page) {
                return $this->renderNotFound($pageSlug, $detailSlug);
            }

            $component = $this->resolveComponent($pageSlug, $detailSlug);
            $configSlug = $this->resolveConfigSlug($pageSlug, $detailSlug);

            // Cache section configs for 5 minutes
            $sectionConfigs = Cache::remember(
                "page_sections_{$configSlug}",
                300,
                fn() => $this->contentService->getPageSections($configSlug)
            );

            if ($sectionConfigs->isEmpty()) {
                return $this->renderNotFound($pageSlug, $detailSlug, 'Page configuration not found');
            }

            $dataNeeds = $this->determineDataNeeds($sectionConfigs);
            $fetchedData = $this->fetchAllData($dataNeeds, $pageSlug, $detailSlug);

            if ($detailSlug && $this->isDetailNotFound($fetchedData, $pageSlug)) {
                return $this->renderNotFound($pageSlug, $detailSlug, 'Content not found');
            }

            $pageData = $this->buildPageData($sectionConfigs, $fetchedData, $pageSlug, $detailSlug);
            $shared = $this->getSharedData();

            $sectionConfig = $this->formatSectionConfigs($sectionConfigs);

            $pageTitle = $page->title ?? $page->name;
            if ($detailSlug && $page->title) {
                $pageTitle = $page->title . ' - DUS';
            }

            $props = array_merge(
                $shared,
                [
                    'storageUrl'        => config('app.storage_url', ''),
                    'sectionConfig'     => $sectionConfig,
                    'pageData'          => $pageData,
                    'pageName'          => $page->name,
                    'pageTitle'         => $pageTitle,
                    'pageSlug'          => $page->slug,
                    'pageDescription'   => $page->description ?? '',
                    'notFound'          => false,
                ]
            );

            return Inertia::render($component, $props)
                ->toResponse(request())
                ->setStatusCode(SymfonyResponse::HTTP_OK);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->renderNotFound($pageSlug, $detailSlug, 'Content not found');
        } catch (\Exception $e) {
            Log::error('PageController error: ' . $e->getMessage(), [
                'pageSlug'   => $pageSlug,
                'detailSlug' => $detailSlug,
            ]);
            return $this->renderNotFound($pageSlug, $detailSlug, 'An error occurred');
        }
    }

    /**
     * Render a friendly "Content Not Available" page with HTTP 200.
     */
    private function renderNotFound(string $pageSlug, ?string $detailSlug = null, string $message = 'Page not found'): SymfonyResponse
    {
        $shared = $this->getSharedData();
        $component = $this->resolveNotFoundComponent($pageSlug, $detailSlug);
        $contentType = $this->getContentType($pageSlug, $detailSlug);
        $title = $detailSlug
            ? ucfirst($contentType) . ' Not Found | DUS'
            : 'Page Not Found | DUS';

        $props = array_merge(
            $shared,
            [
                'storageUrl'       => config('app.storage_url', ''),
                'notFound'         => true,
                'notFoundMessage'  => $message,
                'contentType'      => $contentType,
                'pageSlug'         => $pageSlug,
                'detailSlug'       => $detailSlug,
                'pageTitle'        => $title,
                'pageName'         => ucfirst($contentType) . ' Not Found',
                'isNotFound'       => true,
            ]
        );

        return Inertia::render($component, $props)
            ->toResponse(request())
            ->setStatusCode(SymfonyResponse::HTTP_OK);
    }

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    /**
     * Get page by slug (normalize 'blogs' to 'blog').
     */
    private function getPageBySlug(string $slug): ?Page
    {
        if ($slug === 'blogs') {
            $slug = 'blog';
        }

        return Page::where('slug', $slug)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Normalize route slugs to the seeded page slugs used by the CMS.
     */
    private function resolveConfigSlug(string $pageSlug, ?string $detailSlug): string
    {
        $normalized = $pageSlug === 'blogs' ? 'blog' : $pageSlug;

        return $detailSlug ? $normalized . '-details' : $normalized;
    }

    /**
     * Map page slug + detail flag to the correct Inertia component.
     */
    private function resolveComponent(string $pageSlug, ?string $detailSlug): string
    {
        if ($detailSlug) {
            $detailPages = [
                'about'              => 'Frontend/AboutDetails/AboutDetails',
                'blog'               => 'Frontend/BlogDetails/BlogDetails',
                'blogs'              => 'Frontend/BlogDetails/BlogDetails',
                'projects-programs'  => 'Frontend/ProjectsAndProgramsDetails/ProjectsAndProgramsDetails',
                'publications'       => 'Frontend/PublicationDetails/PublicationDetails',
                'jobs'               => 'Frontend/JobsDetails/JobsDetails',
            ];

            return $detailPages[$pageSlug] ?? 'Frontend/GenericPage';
        }

        return 'Frontend/GenericPage';
    }

    /**
     * Resolve component for not found pages.
     */
    private function resolveNotFoundComponent(string $pageSlug, ?string $detailSlug): string
    {
        if ($detailSlug) {
            $detailPages = [
                'about'              => 'Frontend/AboutDetails/AboutDetails',
                'blog'               => 'Frontend/BlogDetails/BlogDetails',
                'blogs'              => 'Frontend/BlogDetails/BlogDetails',
                'projects-programs'  => 'Frontend/ProjectsAndProgramsDetails/ProjectsAndProgramsDetails',
                'publications'       => 'Frontend/PublicationDetails/PublicationDetails',
                'jobs'               => 'Frontend/JobsDetails/JobsDetails',
            ];

            return $detailPages[$pageSlug] ?? 'Frontend/NotFound';
        }

        return 'Frontend/NotFound';
    }

    /**
     * Get content type for not found message.
     */
    private function getContentType(string $pageSlug, ?string $detailSlug): string
    {
        $detailMap = [
            'about'             => 'Page',
            'blog'              => 'Blog Post',
            'blogs'             => 'Blog Post',
            'projects-programs' => 'Program',
            'publications'      => 'Publication',
            'jobs'              => 'Job',
        ];

        $listingMap = [
            'about'             => 'About Page',
            'blog'              => 'Blog',
            'blogs'             => 'Blog',
            'projects-programs' => 'Programs',
            'publications'      => 'Publications',
            'jobs'              => 'Jobs',
        ];

        return $detailSlug
            ? ($detailMap[$pageSlug] ?? 'Content')
            : ($listingMap[$pageSlug] ?? 'Page');
    }

    /**
     * Check if a detail item was not found.
     */
    private function isDetailNotFound(array $fetchedData, string $pageSlug): bool
    {
        if (!isset($fetchedData['detail']) || empty($fetchedData['detail'])) {
            return true;
        }

        $detail = $fetchedData['detail'];

        if ($detail instanceof Model) {
            return !$detail->exists;
        }

        if (is_array($detail)) {
            return empty($detail);
        }

        return ($detail === null || $detail === false);
    }

    /**
     * Analyze section configs to determine what data we need.
     */
    private function determineDataNeeds(Collection $sectionConfigs): array
    {
        $needs = ['shared_data' => []];

        foreach ($sectionConfigs as $config) {
            $table = $config->data_table;

            if ($table === 'shared_data') {
                $type = $this->mapDataKeyToSharedType($config->data_key);
                if ($type) {
                    $needs['shared_data'][] = $type;
                }
                continue;
            }

            if (isset(self::DATA_TABLE_MAP[$table])) {
                $method = self::DATA_TABLE_MAP[$table];

                if ($method === 'fetchCustomSectionData') {
                    $needs['custom'][] = $config->section_key;
                } elseif ($method === 'fetchJobDetails') {
                    $needs['job_details'] = true;
                } elseif ($method === 'fetchBlogs') {
                    $needs['blogs'] = true;
                } else {
                    $needs[$table] = true;
                }
            } else {
                Log::warning("Unknown data_table: {$table} for section {$config->id}");
            }
        }

        return $needs;
    }

    /**
     * Map data_key to SharedData type.
     */
    private function mapDataKeyToSharedType(string $dataKey): ?string
    {
        return self::SHARED_DATA_MAP[$dataKey] ?? null;
    }

    /**
     * Fetch all required data from the database using the ContentService.
     */
    private function fetchAllData(array $needs, string $pageSlug, ?string $detailSlug): array
    {
        $data = [];

        // Shared data
        if (!empty($needs['shared_data'])) {
            foreach ($needs['shared_data'] as $type) {
                $sharedItem = $this->contentService->getSharedData($type);
                if ($sharedItem) {
                    $data['shared'][$type] = $sharedItem->data;
                }
            }
        }

        // Programs
        if (!empty($needs['programs'])) {
            $data['programs'] = $this->contentService->getPrograms();
        }

        // Blogs
        if (!empty($needs['blogs'])) {
            $data['blogs'] = $this->contentService->getBlogs();
        }

        // About content
        if (!empty($needs['about_content'])) {
            $data['about_content'] = $this->contentService->getAboutDetails();
        }

        // Jobs (listing)
        if (!empty($needs['jobs'])) {
            $data['jobs'] = JobListing::active()
                ->orderBy('views_count', 'desc')
                ->limit(5)
                ->get();
        }

        // Job details
        if (!empty($needs['job_details']) && $detailSlug) {
            $data['job_details'] = JobListing::where('slug', $detailSlug)
                ->with(['category', 'locations', 'employer'])
                ->first();
        }

        // Publications
        if (!empty($needs['publications'])) {
            $data['publications'] = $this->contentService->getPublications();
        }

        // Pages (navigation)
        if (!empty($needs['pages'])) {
            $data['pages'] = Page::where('is_active', true)
                ->orderBy('name')
                ->get();
        }

        // Custom section data
        if (!empty($needs['custom'])) {
            foreach ($needs['custom'] as $sectionKey) {
                $customData = $this->contentService->getSectionData($pageSlug, $sectionKey);
                if ($customData) {
                    $data['custom'][$sectionKey] = method_exists($customData, 'getDataAttribute')
                        ? $customData->data
                        : $customData;
                }
            }
        }

        // Detail item (blog, program, publication, etc.)
        if ($detailSlug) {
            $baseSlug = ($pageSlug === 'blogs') ? 'blog' : $pageSlug;

            $detail = match ($baseSlug) {
                'about'             => $this->contentService->getAboutContent($detailSlug),
                'blog'              => $this->contentService->getBlog($detailSlug),
                'projects-programs' => $this->contentService->getProgram($detailSlug),
                'publications'      => $this->contentService->getPublication($detailSlug),
                default             => $this->contentService->getSectionData($pageSlug, $detailSlug),
            };

            $data['detail'] = $detail;
        }

        return $data;
    }

    /**
     * Build the pageData array with keys expected by frontend components.
     */
    private function buildPageData(Collection $sectionConfigs, array $fetchedData, string $pageSlug, ?string $detailSlug): array
    {
        $pageData = [];

        foreach ($sectionConfigs as $config) {
            $table  = $config->data_table;
            $key    = $config->data_key;

            $value = match ($table) {
                'shared_data' => $this->resolveSharedData($key, $fetchedData),
                'programs'    => $fetchedData['programs'] ?? null,
                'blog', 'blogs' => $this->resolveBlogs($key, $fetchedData, $pageSlug, $detailSlug),
                'about_content' => $fetchedData['about_content'] ?? null,
                'jobs'        => $fetchedData['jobs'] ?? null,
                'job_details' => $fetchedData['job_details'] ?? null,
                'publications' => $this->resolvePublications($key, $fetchedData, $pageSlug, $detailSlug),
                'pages'       => $fetchedData['pages'] ?? null,
                'custom_section_data' => $this->resolveCustomData($config->section_key, $fetchedData),
                default       => $fetchedData[$table] ?? null,
            };

            if ($value !== null) {
                $pageData[$key] = $this->parseIfJsonString($value, $key);
            }
        }

        // Detail page handling
        if ($detailSlug && isset($fetchedData['detail']) && !empty($fetchedData['detail'])) {
            $this->assignDetailData($pageData, $pageSlug, $fetchedData['detail']);
        } elseif ($detailSlug) {
            $pageData['detailNotFound'] = true;
        }

        return $pageData;
    }

    /**
     * Resolve shared data from fetched data.
     */
    private function resolveSharedData(string $key, array $fetchedData): mixed
    {
        $type = $this->mapDataKeyToSharedType($key);
        return ($type && isset($fetchedData['shared'][$type]))
            ? $fetchedData['shared'][$type]
            : null;
    }

    /**
     * Resolve blogs data (with related filtering for detail pages).
     */
    private function resolveBlogs(string $key, array $fetchedData, string $pageSlug, ?string $detailSlug): mixed
    {
        if (!isset($fetchedData['blogs'])) {
            return null;
        }

        if ($detailSlug && $pageSlug === 'blogs' && $key === 'relatedBlogsData') {
            return $this->filterRelatedBlogs($fetchedData['blogs'], $fetchedData['detail'] ?? null);
        }

        return $fetchedData['blogs'];
    }

    /**
     * Resolve publications data (with related filtering for detail pages).
     */
    private function resolvePublications(string $key, array $fetchedData, string $pageSlug, ?string $detailSlug): mixed
    {
        if (!isset($fetchedData['publications'])) {
            return null;
        }

        if ($detailSlug && $pageSlug === 'publications' && $key === 'relatedPublicationsData') {
            return $this->filterRelatedPublications($fetchedData['publications'], $fetchedData['detail'] ?? null);
        }

        return $fetchedData['publications'];
    }

    /**
     * Resolve custom section data.
     */
    private function resolveCustomData(string $sectionKey, array $fetchedData): mixed
    {
        return $fetchedData['custom'][$sectionKey] ?? null;
    }

    /**
     * Assign detail data to the appropriate pageData key.
     */
    private function assignDetailData(array &$pageData, string $pageSlug, $detail): void
    {
        $baseSlug = ($pageSlug === 'blogs') ? 'blog' : $pageSlug;

        match ($baseSlug) {
            'about'             => $pageData['contentSectionData'] = $detail,
            'blog'              => $pageData['blogData'] = $this->normalizeBlogDetail($detail),
            'projects-programs' => $pageData['programContentData'] = $detail,
            'publications'      => $pageData['publicationData'] = $this->normalizePublicationDetail($detail),
            'jobs'              => $pageData['jobData'] = $this->normalizeJobDetail($detail),
            default             => $pageData['detailData'] = $detail,
        };
    }

    /**
     * Parse a value if it's a JSON string and in the list of keys that need parsing.
     */
    private function parseIfJsonString(mixed $value, string $dataKey): mixed
    {
        if (!in_array($dataKey, self::JSON_KEYS, true)) {
            return $value;
        }

        if (!is_string($value)) {
            return $value;
        }

        $decoded = json_decode($value, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        return $value;
    }

    /**
     * Filter related blogs for the detail page.
     */
    private function filterRelatedBlogs(Collection|array $blogs, Model|array|null $currentBlog = null): array
    {
        $items = collect($blogs);

        if ($items->isEmpty()) {
            return [];
        }

        $currentId = $currentBlog?->id ?? ($currentBlog['id'] ?? null);
        $currentSlug = $currentBlog?->slug ?? ($currentBlog['slug'] ?? null);

        return $items
            ->filter(function ($blog) use ($currentId, $currentSlug) {
                $id = $blog->id ?? $blog['id'] ?? null;
                $slug = $blog->slug ?? $blog['slug'] ?? null;
                $featured = (bool) ($blog->is_featured ?? $blog['is_featured'] ?? false);

                if ($id !== null && $currentId !== null && $id === $currentId) {
                    return false;
                }
                if ($slug !== null && $currentSlug !== null && $slug === $currentSlug) {
                    return false;
                }
                return !$featured;
            })
            ->values()
            ->take(3)
            ->all();
    }

    /**
     * Filter related publications for the detail page.
     */
    private function filterRelatedPublications(Collection|array $publications, Model|array|null $currentPublication = null): array
    {
        $items = collect($publications);

        if ($items->isEmpty()) {
            return [];
        }

        $currentId = $currentPublication?->id ?? ($currentPublication['id'] ?? null);
        $currentSlug = $currentPublication?->slug ?? ($currentPublication['slug'] ?? null);

        return $items
            ->filter(function ($publication) use ($currentId, $currentSlug) {
                $id = $publication->id ?? $publication['id'] ?? null;
                $slug = $publication->slug ?? $publication['slug'] ?? null;
                $featured = (bool) ($publication->is_featured ?? $publication['is_featured'] ?? false);

                if ($id !== null && $currentId !== null && $id === $currentId) {
                    return false;
                }
                if ($slug !== null && $currentSlug !== null && $slug === $currentSlug) {
                    return false;
                }
                return !$featured;
            })
            ->values()
            ->take(3)
            ->all();
    }

    /**
     * Normalize blog detail data to the shape expected by the frontend.
     */
    private function normalizeBlogDetail(Model|array $detail): array
    {
        if ($detail instanceof Model) {
            return [
                'id'            => $detail->id,
                'slug'          => $detail->slug,
                'title'         => $detail->title,
                'excerpt'       => $detail->excerpt,
                'fullContent'   => $detail->full_content,
                'image'         => $detail->image,
                'date'          => $detail->date,
                'createdBy'     => $detail->author,
                'timerRead'     => $detail->read_time,
                'tags'          => $detail->tags ?? [],
                'isFeatured'    => (bool) ($detail->is_featured ?? false),
                'isActive'      => (bool) ($detail->is_active ?? false),
            ];
        }

        return $detail;
    }

    /**
     * Normalize publication detail data to the shape expected by the frontend.
     */
    private function normalizePublicationDetail(Model|array $detail): array
    {
        if ($detail instanceof Model) {
            return [
                'id'            => $detail->id,
                'slug'          => $detail->slug,
                'title'         => $detail->title,
                'excerpt'       => $detail->excerpt,
                'fullContent'   => $detail->full_content,
                'image'         => $detail->image,
                'pdf_url'       => $detail->pdf_url,
                'date'          => $detail->date,
                'author'        => $detail->author,
                'read_time'     => $detail->read_time,
                'tags'          => $detail->tags ?? [],
                'category'      => $detail->category,
                'views'         => $detail->views ?? 0,
                'isFeatured'    => (bool) ($detail->is_featured ?? false),
                'isActive'      => (bool) ($detail->is_active ?? false),
            ];
        }

        return $detail;
    }

    /**
     * Normalize job detail data to the shape expected by the frontend.
     */
    private function normalizeJobDetail(Model|array $detail): array
    {
        if ($detail instanceof Model) {
            // Ensure we have the necessary relationships loaded
            if (!$detail->relationLoaded('locations') && $detail->locations) {
                $detail->load('locations');
            }

            return [
                'id'                     => $detail->id,
                'slug'                   => $detail->slug,
                'title'                  => $detail->title,
                'description'            => $detail->description,
                'requirements'           => $detail->requirements,
                'responsibilities'       => $detail->responsibilities,
                'benefits'               => $detail->benefits,
                'skills'                 => $detail->skills,
                'salary_range'           => $detail->salary_range,
                'job_type'               => $detail->job_type,
                'job_type_label'         => $detail->job_type_label,
                'experience_level'       => $detail->experience_level,
                'experience_level_label' => $detail->experience_level_label,
                'application_deadline'   => $detail->application_deadline,
                'how_to_apply'           => $detail->how_to_apply ?? '',
                'apply_link'             => $detail->apply_link ?? '',
                'is_remote'              => $detail->is_remote ?? false,
                'education_requirement'  => $detail->education_requirement,
                'views_count'            => $detail->views_count ?? 0,
                'is_active'              => $detail->is_active,
                'image'                  => $detail->image ?? null,
                'employer'               => $detail->employer?->name,
                'category'               => $detail->category?->name,
                'locations'              => $detail->locations?->map(fn($loc) => ['name' => $loc->name]) ?? [],
                'isExpired'              => $detail->isExpired(),
            ];
        }

        return $detail;
    }

    /**
     * Format section configs for frontend.
     */
    private function formatSectionConfigs(Collection $sectionConfigs): array
    {
        return $sectionConfigs->map(function ($config) {
            return [
                'id'                 => $config->id,
                'component'          => $config->component,
                'enabled'            => (bool) $config->is_enabled,
                'propName'           => $config->prop_name,
                'dataKey'            => $config->data_key,
                'order'              => $config->display_order,
                'customProps'        => $config->custom_props ?? [],
                'isFixedSection'     => (bool) $config->is_fixed_section,
                'isSpecialComponent' => (bool) $config->is_special_component,
            ];
        })->toArray();
    }
}
