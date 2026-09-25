/**
 * editorConfig.js
 * ---------------------------------------------------------------------------
 * Shared configuration and tiny helpers for <RichTextEditor />.
 *
 * Why a separate file?
 *   • Reuse the SAME GLOBAL_STYLES in your blog renderer / preview page.
 *   • Tweak colors, headings, or feature flags without touching the editor.
 *   • Test helpers without importing React.
 */

import Swal from "sweetalert2";

/**
 * Global typography.
 * These class names are applied BOTH:
 *   1. As `class="..."` on HTML we insert (headings, lists, images, …)
 *   2. Mirrored in RichTextEditor.css so that pasted / server-loaded
 *      content looks identical.
 * Keep both sides in sync when you change values here.
 */
export const GLOBAL_STYLES = {
  paragraph:
    'font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed mb-4',

  headings: {
    1: 'font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4',
    2: 'font-700 text-2xl sm:text-3xl lg:text-4xl text-[#080C14] mt-8 mb-4',
    3: 'font-700 text-xl sm:text-2xl lg:text-3xl text-[#080C14] mt-8 mb-4',
    4: 'font-700 text-lg sm:text-xl lg:text-2xl text-[#080C14] mt-6 mb-3',
    5: 'font-700 text-base sm:text-lg lg:text-xl text-[#080C14] mt-6 mb-3',
    6: 'font-700 text-sm sm:text-base lg:text-lg text-[#080C14] mt-4 mb-2',
  },

  unorderedList: 'list-disc pl-6 space-y-3 mb-6',
  orderedList: 'list-decimal pl-6 space-y-3 mb-6',
  listItem:
    'font-400 text-base sm:text-lg lg:text-xl text-[#333333] leading-relaxed',

  strong: 'text-[#009BE2] font-700',
  image: 'rounded-lg max-w-full h-auto',
  link: 'text-[#009BE2] hover:underline',
  blockquote: 'border-l-4 border-[#009BE2] pl-4 italic text-[#333333]',
  code: 'bg-gray-100 rounded px-2 py-1 text-sm font-mono',
  hr: 'border-t border-gray-300 my-8',
};

/**
 * Default color palette shown in the color picker modal.
 * Override via the `colors` prop on <RichTextEditor />.
 */
export const DEFAULT_COLORS = [
  '#333333', '#080C14', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#000080',
  '#FF1493', '#4B0082', '#556B2F', '#8B4513', '#2F4F4F', '#DC143C',
  '#00CED1', '#808080', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#009BE2',
];

/**
 * Default feature flags. Every flag can be overridden via a prop.
 * Add a new flag here when you bolt on a new toolbar group.
 */
export const DEFAULT_FEATURES = {
  headings: true,
  colors: true,
  images: true,
  alignment: true,
  history: true,
  strikethrough: true,
  clearFormat: true,
  preview: true,
  codeView: false,
};

/** Tags allowed through the paste sanitizer. */
export const ALLOWED_PASTE_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre', 'a', 'img', 'hr',
  'div', 'span', 'sub', 'sup',
];

/** Attributes allowed through the paste sanitizer. */
export const ALLOWED_PASTE_ATTRS = [
  'href', 'src', 'alt', 'title', 'class', 'style', 'target',
];

/** Max upload size in bytes (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip all tags — used for the character counter. */
export const stripHtml = (html = '') =>
  html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

/** Collapse whitespace so comparison-based syncing doesn't false-positive. */
export const normalizeHtml = (str = '') => str.replace(/\s+/g, ' ').trim();

/** True when the given File looks like an image we accept. */
export const isProbablyImage = (file) =>
  !!file && typeof file.type === 'string' && file.type.startsWith('image/');

/** Human-readable byte size, e.g. "3.4 MB". */
export const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Non-blocking alert — falls back to window.alert if SweetAlert missing. */
export const notify = (icon, title, text) => {
  if (typeof Swal !== 'undefined' && Swal && typeof Swal.fire === 'function') {
    Swal.fire({ icon, title, text, confirmButtonColor: '#3b82f6' });
  } else if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-alert
    window.alert(`${title}\n${text}`);
  }
};