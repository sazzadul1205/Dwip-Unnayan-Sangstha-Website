// resources/js/pages/Backend/CMS/utils/pageHelpers.js
//
// Pure helpers for the CMS → Pages list/modal. Extracted from Pages/CMS/Index.jsx
// so the component reads as state + JSX rather than a wall of utilities.
// None of these functions touch React state, router, or window — safe to unit-test.

import {
  FaHome, FaInfoCircle, FaCogs, FaEnvelope, FaBlog, FaUsers,
  FaFileAlt, FaImages, FaBriefcase, FaGavel, FaShieldAlt,
} from 'react-icons/fa';

/**
 * Convert a human title into a URL-safe slug.
 * Note: this is the *page* slug rule. The CMS content forms have their own
 * `generateSlug` in `Shared/utils/contentFormUtils.js` — kept separate because
 * that one strips `_` differently and both are shipped independently.
 */
export const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Map a page slug to a contextual icon used in the table's leading badge.
 * Falls back to a generic document icon for any unknown / detail slug.
 */
export const getPageIcon = (slug) => {
  // Main pages with specific icons
  if (slug === 'home') return <FaHome className="text-blue-500" size={18} />;
  if (slug === 'about') return <FaInfoCircle className="text-green-500" size={18} />;
  if (slug === 'services') return <FaCogs className="text-purple-500" size={18} />;
  if (slug === 'contact') return <FaEnvelope className="text-red-500" size={18} />;
  if (slug === 'blog') return <FaBlog className="text-orange-500" size={18} />;
  if (slug === 'programs' || slug === 'projects-programs') return <FaUsers className="text-indigo-500" size={18} />;
  if (slug === 'publications') return <FaFileAlt className="text-teal-500" size={18} />;
  if (slug === 'gallery') return <FaImages className="text-pink-500" size={18} />;
  if (slug === 'jobs') return <FaBriefcase className="text-yellow-600" size={18} />;
  if (slug === 'terms') return <FaGavel className="text-gray-600" size={18} />;
  if (slug === 'privacy') return <FaShieldAlt className="text-gray-600" size={18} />;

  // Detail / sub-pages
  if (slug?.endsWith('-details')) return <FaFileAlt className="text-teal-500" size={18} />;

  // Default
  return <FaFileAlt className="text-gray-400" size={18} />;
};

/**
 * Human label for a page slug (used in the "Type" column).
 */
export const getPageTypeLabel = (slug) => {
  if (slug === 'home') return '🏠 Homepage';
  if (slug === 'about') return 'ℹ️ About Page';
  if (slug === 'services') return '⚙️ Services';
  if (slug === 'contact') return '📧 Contact Page';
  if (slug === 'blog') return '📝 Blog';
  if (slug === 'programs' || slug === 'projects-programs') return '👥 Programs';
  if (slug === 'publications') return '📄 Publications';
  if (slug === 'gallery') return '🖼️ Gallery';
  if (slug === 'jobs') return '💼 Careers';
  if (slug === 'terms') return '📋 Terms & Conditions';
  if (slug === 'privacy') return '🔒 Privacy Policy';

  if (slug?.endsWith('-details')) {
    const parent = slug.replace('-details', '');
    const parentLabels = {
      about: 'About',
      blog: 'Blog',
      'projects-programs': 'Program',
      publications: 'Publication',
    };
    const displayName = parentLabels[parent]
      || parent.charAt(0).toUpperCase() + parent.slice(1);
    return `📄 ${displayName} Detail`;
  }

  return '📄 Standard Page';
};

/**
 * True for slugs that end in `-details` — used for nesting / sorting.
 */
export const isSubPage = (slug) => Boolean(slug?.endsWith('-details'));

/**
 * For `foo-details` returns `foo`; for anything else returns `null`.
 */
export const getParentSlug = (slug) => {
  if (!slug || !slug.endsWith('-details')) return null;
  return slug.replace('-details', '');
};

/**
 * A page is "protected" when either:
 *   - its slug ends in `-details` (sub-pages are managed by their parent), or
 *   - its slug is in the backend-supplied `protectedPages` allowlist
 *     (Homepage, Terms, Privacy, etc. — cannot be deleted or deactivated).
 *
 * Passing `protectedPages` explicitly (instead of closing over props) keeps
 * the function pure and unit-testable.
 */
export const isProtectedPage = (item, protectedPages = []) => {
  if (!item) return false;
  if (item.slug?.endsWith('-details')) return true;
  return protectedPages.includes(item.slug);
};

/**
 * Short display date for the Created column (`Aug 5, 2024`).
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};