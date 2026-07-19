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
 * Generate placeholder image URL
 */
export const getPlaceholderImage = (width = 800, height = 600, text = 'Image') => {
  return `https://via.placeholder.com/${width}x${height}/009BE2/FFFFFF?text=${encodeURIComponent(text)}`;
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
