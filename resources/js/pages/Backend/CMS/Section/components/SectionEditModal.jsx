// resources/js/pages/Backend/CMS/Section/components/SectionEditModal.jsx

import { router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaSave,
  FaSpinner,
  FaCog,
  FaDatabase,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaShieldAlt,
  FaEdit,
  FaLock,
  FaTag,
  FaPalette,
  FaArrowsAltV,
  FaArrowsAltH,
  FaRulerCombined,
} from 'react-icons/fa';
import { showToast } from '../utils/toastHelper';
import { getComponentLabel } from '../utils/sectionHelpers';
import { DEFAULT_CONFIG, SECTION_CONFIGS } from '../utils/SectionConfigData';
import RenderDataTab from './modals/renderDataTab';

// Helper: Check if section has data
const hasSectionData = (section) => {
  return section?.data !== null && section?.data !== undefined;
};

// Constants for data table display labels
const DATA_TABLE_LABELS = {
  custom_section_data: 'Custom Data',
  shared_data: 'Shared Data',
  blogs: 'Blogs',
  programs: 'Programs',
  about_content: 'About Content',
  jobs: 'Jobs',
  our_programs: 'Our Programs',
};

// Field icon mapping
const FIELD_ICONS = {
  bgColor: FaPalette,
  height: FaArrowsAltV,
  paddingY: FaArrowsAltV,
  paddingX: FaArrowsAltH,
  gap: FaRulerCombined,
  sectionClassName: FaTag,
};

const SectionEditModal = ({
  isOpen,
  onClose,
  section,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    section_key: '',
    component: '',
    data_table: '',
    data_key: '',
    is_enabled: true,
    custom_props: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [sectionData, setSectionData] = useState(null);

  /**
   * Get section configuration for custom props
   */
  const getSectionConfig = () => {
    if (!section) return DEFAULT_CONFIG;
    return SECTION_CONFIGS[section.component] || DEFAULT_CONFIG;
  };

  // Populate form when section changes
  useEffect(() => {
    if (section) {
      setFormData({
        section_key: section.section_key || '',
        component: section.component || '',
        data_table: section.data_table || '',
        data_key: section.data_key || '',
        is_enabled: section.is_enabled ?? true,
        custom_props: section.custom_props || {},
      });
      setSectionData(null);
    }
  }, [section]);

  // Reset errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setActiveTab('basic');
      setSectionData(null);
    }
  }, [isOpen]);

  // Early return if modal is closed or no section
  if (!isOpen || !section) return null;

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Handle custom property changes
   */
  const handleCustomPropChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      custom_props: {
        ...prev.custom_props,
        [key]: value
      }
    }));
    if (errors.custom_props) {
      setErrors(prev => ({ ...prev, custom_props: '' }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate required fields
    const newErrors = {};
    if (!formData.section_key.trim()) {
      newErrors.section_key = 'Section key is required';
    }
    if (!formData.component.trim()) {
      newErrors.component = 'Component is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    const submitData = {
      section_key: formData.section_key,
      component: formData.component,
      data_table: formData.data_table,
      data_key: formData.data_key,
      is_enabled: formData.is_enabled,
      custom_props: formData.custom_props || {},
    };

    // Merge section data changes
    if (sectionData !== null && Object.keys(sectionData).length > 0) {
      if (sectionData.custom_props) {
        const formDataKeys = Object.keys(submitData.custom_props);
        const sectionDataKeys = Object.keys(sectionData.custom_props);
        sectionDataKeys.forEach(key => {
          if (!formDataKeys.includes(key)) {
            submitData.custom_props[key] = sectionData.custom_props[key];
          }
        });
      }

      const dataToSend = { ...sectionData };
      delete dataToSend.custom_props;
      if (Object.keys(dataToSend).length > 0) {
        submitData.data = dataToSend;
      }
    }

    router.put(
      route('backend.cms.sections.update', { section: section.id }),
      submitData,
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setIsSubmitting(false);
          showToast('success', '✅ Updated!', 'Section updated successfully.', 2000);
          if (onSuccess) onSuccess();
          onClose();
        },
        onError: (errors) => {
          setIsSubmitting(false);
          if (errors && typeof errors === 'object') {
            setErrors(errors);
            const errorMessage = errors.message || 'Please check the form for errors.';
            showToast('error', '❌ Update Failed', errorMessage, 4000);
          }
        },
      }
    );
  };

  const sectionConfig = getSectionConfig();
  const hasData = hasSectionData(section);

  /**
   * Get display label for data table
   */
  const getDataTableDisplayLabel = (table) => {
    return DATA_TABLE_LABELS[table] || table || 'None';
  };

  /**
   * Render field with appropriate input type and styling
   */
  const renderField = (field) => {
    const currentValue = formData.custom_props?.[field.key] ?? field.default ?? '';
    const hasError = errors.custom_props && typeof errors.custom_props === 'object' && errors.custom_props[field.key];
    const FieldIcon = FIELD_ICONS[field.key] || FaTag;

    return (
      <div key={field.key} className="group">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <FieldIcon size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
          {field.description && (
            <span className="text-xs text-gray-400 font-normal ml-1">{field.description}</span>
          )}
        </label>

        {/* Color Picker Field */}
        {field.type === 'color' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={(() => {
                  if (!currentValue) return '#ffffff';
                  if (currentValue.startsWith('#')) return currentValue;
                  if (currentValue.startsWith('bg-[') && currentValue.endsWith(']')) {
                    const match = currentValue.match(/bg-\[(.*?)\]/);
                    return match ? match[1] : '#ffffff';
                  }
                  const colorMap = {
                    'bg-white': '#ffffff',
                    'bg-gray-50': '#f9fafb',
                    'bg-gray-100': '#f3f4f6',
                    'bg-blue-50': '#eff6ff',
                    'bg-green-50': '#f0fdf4',
                    'bg-purple-50': '#faf5ff',
                    'bg-yellow-50': '#fefce8',
                    'bg-red-50': '#fef2f2',
                    'bg-indigo-50': '#eef2ff',
                    'bg-pink-50': '#fdf2f8',
                    'bg-orange-50': '#fff7ed',
                    'bg-teal-50': '#f0fdfa',
                    'bg-[#F5F5F5]': '#F5F5F5',
                    'bg-[#F9F9FA]': '#F9F9FA',
                  };
                  return colorMap[currentValue] || '#ffffff';
                })()}
                onChange={(e) => {
                  const hexColor = e.target.value;
                  handleCustomPropChange(field.key, `bg-[${hexColor}]`);
                }}
                className="w-12 h-12 rounded-xl cursor-pointer p-0.5 border-2 border-gray-200 hover:border-blue-400 transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input
              type="text"
              value={currentValue}
              onChange={(e) => {
                let value = e.target.value.trim();
                if (value.match(/^#[0-9a-fA-F]{6}$/)) {
                  value = `bg-[${value}]`;
                } else if (value.match(/^[a-zA-Z-]+$/) && !value.startsWith('bg-')) {
                  value = `bg-${value}`;
                }
                handleCustomPropChange(field.key, value);
              }}
              className={`flex-1 px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono ${hasError ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              placeholder="bg-white or #F9F9FA"
            />
            <div
              className="w-10 h-10 rounded-xl border-2 border-gray-200 shrink-0 shadow-inner transition-all group-hover:border-blue-300"
              style={{
                backgroundColor: (() => {
                  if (!currentValue) return '#ffffff';
                  if (currentValue.startsWith('#')) return currentValue;
                  if (currentValue.startsWith('bg-[') && currentValue.endsWith(']')) {
                    const match = currentValue.match(/bg-\[(.*?)\]/);
                    return match ? match[1] : '#ffffff';
                  }
                  const colorMap = {
                    'bg-white': '#ffffff',
                    'bg-gray-50': '#f9fafb',
                    'bg-gray-100': '#f3f4f6',
                    'bg-blue-50': '#eff6ff',
                    'bg-green-50': '#f0fdf4',
                    'bg-purple-50': '#faf5ff',
                    'bg-yellow-50': '#fefce8',
                    'bg-red-50': '#fef2f2',
                    'bg-indigo-50': '#eef2ff',
                    'bg-pink-50': '#fdf2f8',
                    'bg-orange-50': '#fff7ed',
                    'bg-teal-50': '#f0fdfa',
                    'bg-[#F5F5F5]': '#F5F5F5',
                    'bg-[#F9F9FA]': '#F9F9FA',
                  };
                  return colorMap[currentValue] || '#ffffff';
                })()
              }}
            />
          </div>
        )}

        {/* Select Dropdown Field */}
        {field.type === 'select' && field.options && (
          <div className="relative">
            <select
              value={currentValue}
              onChange={(e) => handleCustomPropChange(field.key, e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none ${hasError ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              aria-label={`Select ${field.label}`}
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Text Input Field */}
        {field.type === 'text' && (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleCustomPropChange(field.key, e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${hasError ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            placeholder={field.default || `Enter ${field.label.toLowerCase()}`}
            aria-label={`Enter ${field.label}`}
          />
        )}

        {/* Number Input Field */}
        {field.type === 'number' && (
          <div>
            <input
              type="number"
              min={field.min || 0}
              max={field.max || 100}
              value={currentValue}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  handleCustomPropChange(field.key, value);
                } else if (e.target.value === '') {
                  handleCustomPropChange(field.key, field.default || 0);
                }
              }}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${hasError ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              placeholder={field.default?.toString() || '0'}
              aria-label={`Enter ${field.label}`}
            />
            {field.min !== undefined && field.max !== undefined && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, ((currentValue - field.min) / (field.max - field.min)) * 100))}%`
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
                  {field.min} - {field.max}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Checkbox Field */}
        {field.type === 'checkbox' && (
          <div className="flex items-center gap-3 pt-1">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id={`prop-${field.key}`}
                checked={currentValue === true || currentValue === 'true' || currentValue === 1 || currentValue === '1'}
                onChange={(e) => handleCustomPropChange(field.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
            </label>
            <label htmlFor={`prop-${field.key}`} className="text-sm text-gray-700 font-medium cursor-pointer">
              {field.label}
            </label>
          </div>
        )}

        {/* Textarea Field */}
        {field.type === 'textarea' && (
          <textarea
            value={currentValue}
            onChange={(e) => handleCustomPropChange(field.key, e.target.value)}
            rows={field.rows || 4}
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm ${hasError ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            placeholder={field.default || `Enter ${field.label.toLowerCase()}`}
            aria-label={`Enter ${field.label}`}
          />
        )}

        {hasError && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
            <FaExclamationTriangle size={12} className="shrink-0" />
            {typeof errors.custom_props === 'string' ? errors.custom_props : errors.custom_props?.[field.key]}
          </p>
        )}
      </div>
    );
  };

  /**
   * Render Basic Data Tab
   */
  const renderBasicTab = () => (
    <div className="space-y-6">
      {/* Section Status Banner - Enhanced */}
      <div className={`relative overflow-hidden rounded-2xl border-2 p-5 transition-all ${formData.is_enabled
        ? 'bg-linear-to-br from-green-50 to-emerald-50 border-green-200'
        : 'bg-linear-to-br from-gray-50 to-gray-100 border-gray-200'
        }`}>
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10">
          <div className={`w-full h-full rounded-full ${formData.is_enabled ? 'bg-green-500' : 'bg-gray-400'
            }`} />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-lg ${formData.is_enabled
              ? 'bg-green-500 shadow-green-200'
              : 'bg-gray-400 shadow-gray-200'
              }`}>
              {formData.is_enabled ? (
                <FaCheckCircle className="text-white" size={22} />
              ) : (
                <FaExclamationTriangle className="text-white" size={22} />
              )}
            </div>
            <div>
              <p className={`text-lg font-semibold ${formData.is_enabled ? 'text-green-700' : 'text-gray-600'
                }`}>
                {formData.is_enabled ? '✅ Section is Active' : '⛔ Section is Inactive'}
              </p>
              <p className="text-sm text-gray-500">
                {formData.is_enabled
                  ? 'Visible on the frontend'
                  : 'Hidden from the frontend'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="is_enabled"
              checked={formData.is_enabled}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner" />
          </label>
        </div>
      </div>

      {/* Section Key */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <FaTag size={14} className="text-gray-400" />
          Section Key <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="section_key"
            value={formData.section_key}
            onChange={handleChange}
            className={`w-full px-4 py-3.5 border-2 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.section_key
              ? 'border-red-500 bg-red-50/50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
            placeholder="e.g., home_banner"
            aria-invalid={!!errors.section_key}
          />
          {formData.section_key && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono bg-gray-100 px-2.5 py-1 rounded-lg">
              {formData.section_key.length} chars
            </div>
          )}
        </div>
        {errors.section_key ? (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
            <FaExclamationTriangle size={12} />
            {errors.section_key}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
            <FaInfoCircle size={11} />
            Unique identifier for this section
          </p>
        )}
      </div>

      {/* Component - Read Only */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <FaShieldAlt size={14} className="text-gray-400" />
          Component <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-linear-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-2xl text-gray-700">
          <div className="p-2 bg-blue-100 rounded-xl">
            <FaShieldAlt className="text-blue-600" size={16} />
          </div>
          <span className="font-semibold">{getComponentLabel(formData.component)}</span>
          <span className="text-sm text-gray-400 font-mono">({formData.component})</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-medium border border-blue-200">
            <FaLock size={10} />
            Locked
          </span>
        </div>
        <p className="mt-1.5 text-xs text-blue-600 flex items-center gap-1">
          <FaInfoCircle size={11} />
          Component cannot be changed after creation
        </p>
      </div>

      {/* Data Source - Read Only */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <FaDatabase size={14} className="text-gray-400" />
          Data Table
        </label>
        <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-linear-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-2xl text-gray-700">
          <div className="p-2 bg-purple-100 rounded-xl">
            <FaDatabase className="text-purple-600" size={16} />
          </div>
          <span className="font-semibold">{getDataTableDisplayLabel(formData.data_table)}</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
            <FaLock size={10} />
            Locked
          </span>
        </div>
        <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
          <FaInfoCircle size={11} />
          Data source cannot be changed after creation
        </p>
      </div>

      {/* Data Key - Auto-generated, read only */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <FaInfoCircle size={14} className="text-gray-400" />
          Data Key
        </label>
        <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-linear-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-2xl">
          <code className="font-mono text-sm text-gray-700">
            {formData.data_key || 'auto-generated'}
          </code>
          <span className="ml-auto text-xs text-gray-400 bg-gray-200/50 px-2.5 py-0.5 rounded-full">Auto</span>
        </div>
        <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
          <FaInfoCircle size={11} />
          Auto-generated based on section configuration
        </p>
      </div>

      {/* Custom Props - Section specific configuration */}
      {sectionConfig.fields.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-200">
              <FaCog className="text-white" size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Section Configuration</h3>
              <p className="text-xs text-gray-400">
                {sectionConfig.fields.length} field{sectionConfig.fields.length > 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <div className="space-y-5 p-6 bg-linear-to-br from-gray-50/80 to-white rounded-2xl border-2 border-gray-200/60 shadow-inner">
            {sectionConfig.fields.map((field) => renderField(field))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slideUp"
        style={{ animationDuration: '250ms' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header - Premium Design */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-linear-to-r from-white to-blue-50/50 border-b border-gray-200 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200">
              <FaEdit className="text-white text-xl" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-gray-900">
                Edit Section
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono bg-gray-100 px-2.5 py-0.5 rounded-lg text-xs text-gray-600">
                  {section.section_key}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-400">ID: {section.id}</span>
                <span className="text-gray-300">•</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${section.is_enabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
                  }`}>
                  {section.is_enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-sm"
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Tabs - Enhanced */}
        <div className="border-b border-gray-200 bg-gray-50/50 px-4 pt-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-5 py-2.5 text-sm font-medium transition-all relative flex items-center gap-2 rounded-t-xl ${activeTab === 'basic'
                ? 'text-blue-600 bg-white shadow-sm shadow-gray-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
            >
              <FaCog size={14} />
              Basic Data
              {activeTab === 'basic' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 to-indigo-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('data')}
              className={`px-5 py-2.5 text-sm font-medium transition-all relative flex items-center gap-2 rounded-t-xl ${activeTab === 'data'
                ? 'text-blue-600 bg-white shadow-sm shadow-gray-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
            >
              <FaDatabase size={14} />
              Section Data
              {hasData && (
                <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <FaCheckCircle size={9} />
                  ✓
                </span>
              )}
              {activeTab === 'data' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 to-indigo-500" />
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="min-h-100 relative">
            {/* Basic Data Tab */}
            <div className={activeTab === 'basic' ? 'block animate-fadeIn' : 'hidden'}>
              {renderBasicTab()}
            </div>

            {/* Section Data Tab */}
            <div className={activeTab === 'data' ? 'block animate-fadeIn' : 'hidden'}>
              <RenderDataTab
                section={section}
                hasData={hasData}
                onDataChange={setSectionData}
              />
            </div>
          </div>

          {/* Actions - Enhanced */}
          <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium hover:shadow-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-2.5 rounded-xl text-white transition-all duration-200 flex items-center gap-2.5 font-semibold ${isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={15} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SectionEditModal;