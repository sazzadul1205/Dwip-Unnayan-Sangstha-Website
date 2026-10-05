import Swal from 'sweetalert2';

export const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-', '');
};

export const COMMON_TAG_SUGGESTIONS = [
  'Technology', 'Innovation', 'Future', 'Education', 'Health',
  'Sustainability', 'Community', 'Development', 'Empowerment',
  'Climate', 'Agriculture', 'Microfinance', 'Women Empowerment',
  'Youth', 'Leadership', 'Social Impact', 'Charity', 'Volunteer',
  'Entrepreneurship', 'Digital', 'Environment', 'Equality',
];

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

export const showSuccessToast = (title, text = '') => {
  Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
    customClass: {
      popup: 'rounded-xl shadow-2xl',
      title: 'text-sm font-semibold',
      htmlContainer: 'text-xs',
    },
  });
};

export const showErrorToast = (title, text = '') => {
  Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#3b82f6',
    customClass: {
      popup: 'rounded-xl shadow-2xl',
      title: 'text-lg font-semibold',
      htmlContainer: 'text-sm',
    },
  });
};

export const normalizeTags = (tags) => {
  if (!tags) return [];
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return tags.split(',').filter(t => t.trim()).map(t => t.trim());
    }
  }
  if (Array.isArray(tags)) return tags;
  return [];
};
