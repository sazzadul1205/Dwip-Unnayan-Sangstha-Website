// resources/js/pages/Backend/CMS/Sections/components/modals/Editors/shared/useSectionEditor.js

import { useState, useEffect, useCallback } from 'react';

export const useSectionEditor = (section, initialData = {}, onDataChange) => {
  // Get initial data with proper fallback
  const getInitialData = useCallback(() => {
    const data = section?.data?.data || section?.data || {};
    return { ...initialData, ...data };
  }, [section, initialData]);

  const [formData, setFormData] = useState(getInitialData);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset when section changes
  useEffect(() => {
    setFormData(getInitialData());
    setIsDirty(false);
    setErrors({});
  }, [getInitialData]);

  // Update nested object fields using dot notation
  const updateField = useCallback((path, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
    setIsDirty(true);
  }, []);

  // Update array item
  const updateArrayItem = useCallback((path, index, field, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
          if (!current[keys[i]]) current[keys[i]] = [];
          if (!current[keys[i]][index]) current[keys[i]][index] = {};
          current[keys[i]][index] = { ...current[keys[i]][index], [field]: value };
        } else {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
      }
      return newData;
    });
    setIsDirty(true);
  }, []);

  // Add array item
  const addArrayItem = useCallback((path, template = {}) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      if (!Array.isArray(current[lastKey])) current[lastKey] = [];
      
      const newId = Math.max(0, ...current[lastKey].map(item => item.id || 0)) + 1;
      current[lastKey].push({ ...template, id: newId });
      
      return newData;
    });
    setIsDirty(true);
  }, []);

  // Remove array item
  const removeArrayItem = useCallback((path, index) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      if (Array.isArray(current[lastKey])) {
        current[lastKey].splice(index, 1);
      }
      
      return newData;
    });
    setIsDirty(true);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (isDirty && onDataChange) {
      onDataChange(formData);
    }
  }, [formData, isDirty, onDataChange]);

  // Reset dirty state after saving
  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  // Validate form
  const validate = useCallback((validationRules = {}) => {
    const newErrors = {};
    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], formData);
      if (rules.required && (!value || (Array.isArray(value) && value.length === 0))) {
        newErrors[field] = `${field} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  return {
    formData,
    setFormData,
    isDirty,
    setIsDirty,
    errors,
    setErrors,
    updateField,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    resetDirty,
    validate,
  };
};