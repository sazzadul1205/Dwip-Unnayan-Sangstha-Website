// resources/js/pages/Backend/CMS/Sections/utils/validation.js

/**
 * Validation utilities for section data
 */

export const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  if (Array.isArray(value) && value.length === 0) {
    return `${fieldName} must have at least one item`;
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return `${fieldName} cannot be empty`;
  }
  return null;
};

export const validateMinLength = (value, min, fieldName) => {
  if (typeof value === 'string' && value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return null;
};

export const validateMaxLength = (value, max, fieldName) => {
  if (typeof value === 'string' && value.length > max) {
    return `${fieldName} must be at most ${max} characters`;
  }
  return null;
};

export const validateUrl = (value, fieldName) => {
  if (value) {
    try {
      new URL(value);
    } catch {
      return `${fieldName} must be a valid URL`;
    }
  }
  return null;
};

export const validateEmail = (value, fieldName) => {
  if (value !== undefined && value !== null && value !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
  }
  return null;
};

export const validateNumber = (value, fieldName) => {
  if (value !== undefined && value !== null && value !== '') {
    if (isNaN(Number(value))) {
      return `${fieldName} must be a valid number`;
    }
  }
  return null;
};

export const validateRange = (value, min, max, fieldName) => {
  if (value !== undefined && value !== null && value !== '') {
    const num = Number(value);
    if (!isNaN(num)) {
      if (num < min) {
        return `${fieldName} must be at least ${min}`;
      }
      if (num > max) {
        return `${fieldName} must be at most ${max}`;
      }
    }
  }
  return null;
};

export const validateSectionData = (data, rules = {}) => {
  const errors = {};
  
  Object.entries(rules).forEach(([field, validators]) => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], data);
    
    if (Array.isArray(validators)) {
      validators.forEach(validator => {
        const error = validator(value);
        if (error) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(error);
        }
      });
    }
  });
  
  return errors;
};