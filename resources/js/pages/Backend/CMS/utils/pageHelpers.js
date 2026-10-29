// resources/js/pages/Backend/CMS/utils/pageHelpers.js

import {
  FaHome, FaInfoCircle, FaCogs, FaEnvelope, FaBlog, FaUsers,
  FaFileAlt, FaImages, FaBriefcase, FaGavel, FaShieldAlt,
} from 'react-icons/fa';

// ─── Slug generation ─────────────────────────────────────────────
export const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ─── Page icon (returns component + tone, not JSX) ───────────────
// `tone` maps to EditorSection-style classes: bg-X-50 text-X-600 ring-X-100.
const ICONS = {
  home:                 { Icon: FaHome,       tone: 'blue' },
  about:                { Icon: FaInfoCircle, tone: 'emerald' },
  services:             { Icon: FaCogs,       tone: 'violet' },
  contact:              { Icon: FaEnvelope,   tone: 'red' },
  blog:                 { Icon: FaBlog,       tone: 'orange' },
  programs:             { Icon: FaUsers,      tone: 'indigo' },
  'projects-programs':  { Icon: FaUsers,      tone: 'indigo' },
  publications:         { Icon: FaFileAlt,    tone: 'cyan' },
  gallery:              { Icon: FaImages,     tone: 'pink' },
  jobs:                 { Icon: FaBriefcase,  tone: 'amber' },
  terms:                { Icon: FaGavel,      tone: 'slate' },
  privacy:              { Icon: FaShieldAlt,  tone: 'slate' },
};

export const getPageIcon = (slug) => {
  if (slug?.endsWith('-details')) return { Icon: FaFileAlt, tone: 'cyan' };
  return ICONS[slug] ?? { Icon: FaFileAlt, tone: 'slate' };
};

// ─── Page type label (plain text — no emoji) ────────────────────
const TYPE_LABELS = {
  home: 'Homepage',
  about: 'About Page',
  services: 'Services',
  contact: 'Contact Page',
  blog: 'Blog',
  programs: 'Programs',
  'projects-programs': 'Programs',
  publications: 'Publications',
  gallery: 'Gallery',
  jobs: 'Careers',
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
};

const DETAIL_PARENT_LABELS = {
  about: 'About',
  blog: 'Blog',
  'projects-programs': 'Program',
  publications: 'Publication',
};

export const getPageTypeLabel = (slug) => {
  if (slug?.endsWith('-details')) {
    const parent = slug.replace('-details', '');
    const name = DETAIL_PARENT_LABELS[parent]
      ?? (parent.charAt(0).toUpperCase() + parent.slice(1));
    return `${name} Detail`;
  }
  return TYPE_LABELS[slug] ?? 'Standard Page';
};

// ─── Slug helpers ───────────────────────────────────────────────
export const isSubPage = (slug) => Boolean(slug?.endsWith('-details'));

export const getParentSlug = (slug) => {
  if (!slug || !slug.endsWith('-details')) return null;
  return slug.replace('-details', '');
};

export const isProtectedPage = (item, protectedPages = []) => {
  if (!item) return false;
  if (item.slug?.endsWith('-details')) return true;
  return protectedPages.includes(item.slug);
};

// ─── Date ───────────────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};