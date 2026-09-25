// js/utils/sectionHelpers.js

import DOMPurify from 'dompurify';

/**
 * Utility function to check if value exists
 */
export const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Generate placeholder image URL (inline SVG — avoids external placeholder services)
 *
 * NOTE: bgColor/textColor are optional overrides so sections can keep their
 * exact legacy look while sharing one implementation:
 * - banners/legal default `#1a1a2e`/white, most sections default `#009BE2`/white,
 * - CardsSection `#E0E7FF`/`#1E3A8A`, ContactReachSection `#1500FF`/white,
 * - ImageGallerySection `#EAEAEA`/`#999999`.
 */
export const getPlaceholderImage = (
  width = 800,
  height = 600,
  text = 'Image',
  bgColor = '#009BE2',
  textColor = '#FFFFFF',
) => {
  const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 12));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${bgColor}"/><text x="50%" y="50%" fill="${textColor}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Generate a small square placeholder icon (inline SVG).
 * Shared by OurActionSection (`getPlaceholderIcon`) so icon fallbacks stay identical.
 */
export const getPlaceholderIcon = (text = 'Icon') => {
  const safeText = String(text ?? 'Icon')
    .substring(0, 3)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="100%" height="100%" fill="#009BE2"/><text x="50%" y="50%" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Normalize data structure - unwrap nested data
 */
export const normalizeData = (data) => {
  if (!data) return null;
  
  // If data has a 'data' property and it's an object, unwrap it
  if (data.data && typeof data.data === 'object') {
    return normalizeData(data.data);
  }
  
  return data;
};

/**
 * Extract array from data with fallback
 */
export const extractArray = (data, arrayKeys = ['items', 'data', 'results', 'list']) => {
  if (!data) return [];
  
  // If data is already an array
  if (Array.isArray(data)) return data;
  
  // Try to find an array property
  for (const key of arrayKeys) {
    if (Array.isArray(data[key]) && data[key].length > 0) {
      return data[key];
    }
  }
  
  // Check if any property is an array
  for (const key in data) {
    if (Array.isArray(data[key]) && data[key].length > 0) {
      return data[key];
    }
  }
  
  return [];
};

/**
 * Get image source with error handling
 */
export const getImageSrc = (imageData, errorState, placeholderText = 'Image') => {
  if (!imageData) return getPlaceholderImage(800, 600, placeholderText);
  
  const src = imageData.src || imageData;
  
  if (typeof src === 'string' && src.trim().length > 0) {
    return src;
  }
  
  return getPlaceholderImage(800, 600, placeholderText);
};

/**
 * Create image error handler
 */
export const createImageErrorHandler = (setErrors, id) => {
  return () => {
    setErrors(prev => ({ ...prev, [id]: true }));
  };
};

/**
 * Sanitize HTML content (basic implementation - use DOMPurify in production)
 */
export const sanitizeHTML = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(html);
};

/**
 * Canonical `section_configs.data_table` values.
 *
 * PHP source of truth: app/Enums/SectionDataTable.php — keep this mirror in sync.
 * Previously the CMS, the seeder and the frontend route map each carried their own
 * hard-coded list, and they had already drifted (the admin only handled 6 of the
 * 10 values the frontend did).
 */
export const DATA_TABLES = Object.freeze({
  CUSTOM_SECTION_DATA: 'custom_section_data',
  SHARED_DATA: 'shared_data',
  BLOGS: 'blogs',
  PROGRAMS: 'programs',
  PUBLICATIONS: 'publications',
  ABOUT_CONTENT: 'about_content',
  JOBS: 'jobs',
  JOB_DETAILS: 'job_details',
  PAGES: 'pages',
  BLOG: 'blog', // legacy singular alias of BLOGS
});

/**
 * `data_table` value -> human-readable label.
 * Single source for the CMS UI (was duplicated in SectionEditModal and
 * Section/utils/sectionHelpers).
 */
export const DATA_TABLE_LABELS = Object.freeze({
  [DATA_TABLES.CUSTOM_SECTION_DATA]: 'Custom Data',
  [DATA_TABLES.SHARED_DATA]: 'Shared Data',
  [DATA_TABLES.BLOGS]: 'Blogs',
  [DATA_TABLES.PROGRAMS]: 'Programs',
  [DATA_TABLES.PUBLICATIONS]: 'Publications',
  [DATA_TABLES.ABOUT_CONTENT]: 'About Content',
  [DATA_TABLES.JOBS]: 'Jobs',
  [DATA_TABLES.JOB_DETAILS]: 'Job Details',
  [DATA_TABLES.PAGES]: 'Pages',
  [DATA_TABLES.BLOG]: 'Blogs', // legacy alias — mirrors SectionDataTable::label()
  our_programs: 'Our Programs', // legacy value, not part of DATA_TABLES
});

/**
 * Human-readable label for a `data_table` value.
 */
export const getDataTableLabel = (table) => DATA_TABLE_LABELS[table] || table || 'None';

