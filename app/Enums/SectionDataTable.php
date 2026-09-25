<?php
// app/Enums/SectionDataTable.php

namespace App\Enums;

/**
 * Canonical set of `section_configs.data_table` values.
 *
 * Before this enum the value was a free-form string validated only as
 * `required|string|max:255`, and the three consumers had already drifted apart:
 *
 *  - the seeder writes 7 values (incl. `job_details`),
 *  - Frontend\PageController::DATA_TABLE_MAP handles 10 (adds `blog`, `jobs`, `pages`),
 *  - Cms\SectionController::loadSectionData() handles only 6, so `job_details`,
 *    `jobs`, `pages` and `blog` silently fall through to `null` in the admin.
 *
 * Keep the JS mirror in resources/js/utils/sectionHelpers.js (DATA_TABLES) in sync.
 */
enum SectionDataTable: string
{
    case CustomSectionData = 'custom_section_data';
    case SharedData = 'shared_data';
    case Blogs = 'blogs';
    case Programs = 'programs';
    case Publications = 'publications';
    case AboutContent = 'about_content';
    case Jobs = 'jobs';
    case JobDetails = 'job_details';
    case Pages = 'pages';

    /** Legacy singular alias still seen in older data_table rows / route maps. */
    case Blog = 'blog';

    /**
     * All backing values, for Rule::in() and JS-side mirrors.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $case): string => $case->value, self::cases());
    }

    /**
     * Tables whose payload is a JSON column keyed by section_key rather than a
     * dedicated table (these are the ones that go through the payload unwrapper).
     */
    public function isJsonColumn(): bool
    {
        return in_array($this, [self::CustomSectionData, self::SharedData, self::AboutContent], true);
    }

    /**
     * Human-readable label used by the CMS UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::CustomSectionData => 'Custom Data',
            self::SharedData => 'Shared Data',
            self::Blogs, self::Blog => 'Blogs',
            self::Programs => 'Programs',
            self::Publications => 'Publications',
            self::AboutContent => 'About Content',
            self::Jobs => 'Jobs',
            self::JobDetails => 'Job Details',
            self::Pages => 'Pages',
        };
    }

    /**
     * value => label, for <select> options and validation messages.
     *
     * @return array<string, string>
     */
    public static function options(): array
    {
        $options = [];

        foreach (self::cases() as $case) {
            $options[$case->value] = $case->label();
        }

        return $options;
    }
}
