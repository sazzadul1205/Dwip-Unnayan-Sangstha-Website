// resources/js/pages/Backend/CMS/Shared/utils/contentFormUtils.js
import Swal from 'sweetalert2';

// ─── Slug & tags ────────────────────────────────────────────────
export const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const COMMON_TAG_SUGGESTIONS = [
  'Technology', 'Innovation', 'Future', 'Education', 'Health',
  'Sustainability', 'Community', 'Development', 'Empowerment',
  'Climate', 'Agriculture', 'Microfinance', 'Women Empowerment',
  'Youth', 'Leadership', 'Social Impact', 'Charity', 'Volunteer',
  'Entrepreneurship', 'Digital', 'Environment', 'Equality',
];

// ─── File helpers ───────────────────────────────────────────────
export const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    return 'Please select an image file (JPEG, PNG, GIF, WebP, SVG).';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'Image size should be less than 5MB.';
  }
  return null;
};

// ─── Tag normalizer ─────────────────────────────────────────────
export const normalizeTags = (tags) => {
  if (!tags) return [];
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return tags.split(',').filter((t) => t.trim()).map((t) => t.trim());
    }
  }
  if (Array.isArray(tags)) return tags;
  return [];
};

// ─── Shared Swal design tokens ──────────────────────────────────
const SWAL_BASE = {
  popup: 'rounded-xl shadow-2xl',
  title: 'text-lg font-semibold text-slate-900',
  htmlContainer: 'text-sm text-slate-600',
  confirmButton: 'rounded-lg font-semibold px-4 py-2',
  cancelButton: 'rounded-lg font-medium px-4 py-2',
  input: 'rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60',
};

// ─── Toasts (non-blocking) ──────────────────────────────────────
export const showSuccessToast = (title, text = '') => {
  Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
    customClass: {
      popup: 'rounded-xl shadow-xl border border-slate-100',
      title: 'text-sm font-semibold text-slate-900',
      htmlContainer: 'text-xs text-slate-500',
    },
  });
};

export const showErrorToast = (title, text = '') => {
  Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Got it',
    customClass: SWAL_BASE,
  });
};

// ─── Confirmation dialogs ──────────────────────────────────────
export const confirmAction = ({
  title,
  text,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
}) => {
  const colors = {
    warning: { confirm: '#dc2626', cancel: '#64748b' },
    danger: { confirm: '#dc2626', cancel: '#64748b' },
    info: { confirm: '#3b82f6', cancel: '#64748b' },
  };
  const { confirm, cancel } = colors[variant] ?? colors.warning;

  return Swal.fire({
    title,
    text,
    icon: variant === 'info' ? 'info' : variant === 'danger' ? 'error' : 'warning',
    showCancelButton: true,
    confirmButtonColor: confirm,
    cancelButtonColor: cancel,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: SWAL_BASE,
  }).then((result) => {
    if (result.isConfirmed && onConfirm) onConfirm();
  });
};

// ─── Alert (informational) ─────────────────────────────────────
export const showAlert = ({ title, text, icon = 'info' }) => {
  const colors = { success: '#10b981', error: '#dc2626', warning: '#f59e0b', info: '#3b82f6' };
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: colors[icon] ?? '#3b82f6',
    confirmButtonText: 'OK',
    customClass: SWAL_BASE,
  });
};