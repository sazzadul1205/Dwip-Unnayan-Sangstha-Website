 
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
  FaEdit
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
   * Render Basic Data Tab
   */
  const renderBasicTab = () => (
    <div className="space-y-6">
      {/* Section Status Banner */}
      <div className={`p-4 rounded-xl border ${formData.is_enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${formData.is_enabled ? 'bg-green-100' : 'bg-gray-200'}`}>
              {formData.is_enabled ? (
                <FaCheckCircle className="text-green-600" size={20} />
              ) : (
                <FaExclamationTriangle className="text-gray-500" size={20} />
              )}
            </div>
            <div>
              <p className={`font-medium ${formData.is_enabled ? 'text-green-700' : 'text-gray-600'}`}>
                {formData.is_enabled ? 'Section is Active' : 'Section is Inactive'}
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>
      </div>

      {/* Section Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Section Key <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="section_key"
            value={formData.section_key}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.section_key ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="e.g., home_banner"
            aria-invalid={!!errors.section_key}
          />
          {formData.section_key && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">
              {formData.section_key.length} chars
            </div>
          )}
        </div>
        {errors.section_key && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <FaExclamationTriangle size={12} />
            {errors.section_key}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">Unique identifier for this section</p>
      </div>

      {/* Component - Read Only */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Component <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
          <FaShieldAlt className="text-blue-500" size={16} />
          <span className="font-medium">{getComponentLabel(formData.component)}</span>
          <span className="text-sm text-gray-400">({formData.component})</span>
          <span className="ml-auto text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">🔒 Locked</span>
        </div>
        <p className="mt-1 text-xs text-blue-600">Component cannot be changed after creation</p>
      </div>

      {/* Data Source - Read Only */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Data Table
        </label>
        <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
          <FaDatabase className="text-gray-400" size={16} />
          <span className="font-medium">{getDataTableDisplayLabel(formData.data_table)}</span>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">🔒 Locked</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">Data source cannot be changed after creation</p>
      </div>

      {/* Data Key - Auto-generated, read only */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Data Key
        </label>
        <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
          <FaInfoCircle className="text-gray-400" size={16} />
          <span className="font-mono text-sm">{formData.data_key || 'auto-generated'}</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">Auto-generated based on section configuration</p>
      </div>

      {/* Custom Props - Section specific configuration */}
      {sectionConfig.fields.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FaCog className="text-gray-500" size={16} />
            <h3 className="text-sm font-semibold text-gray-700">Section Configuration</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {sectionConfig.fields.length} fields
            </span>
          </div>
          <div className="space-y-4 p-5 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
            {sectionConfig.fields.map((field) => {
              const currentValue = formData.custom_props?.[field.key] ?? field.default ?? '';
              const hasError = errors.custom_props && typeof errors.custom_props === 'object' && errors.custom_props[field.key];

              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                    {field.description && (
                      <span className="text-xs text-gray-400 font-normal ml-2">{field.description}</span>
                    )}
                  </label>

                  {/* Color Picker Field */}
                  {field.type === 'color' && (
                    <div className="flex items-center gap-3">
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
                        className="w-12 h-12 border border-gray-300 rounded-xl cursor-pointer p-1 hover:shadow-md transition"
                      />
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
                        className={`flex-1 px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono ${hasError ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder="bg-white or #F9F9FA"
                      />
                      <div
                        className="w-10 h-10 rounded-xl border border-gray-200 shrink-0 shadow-inner"
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
                    <select
                      value={currentValue}
                      onChange={(e) => handleCustomPropChange(field.key, e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${hasError ? 'border-red-500' : 'border-gray-200'
                        }`}
                      aria-label={`Select ${field.label}`}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Text Input Field */}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => handleCustomPropChange(field.key, e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${hasError ? 'border-red-500' : 'border-gray-200'
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
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${hasError ? 'border-red-500' : 'border-gray-200'
                          }`}
                        placeholder={field.default?.toString() || '0'}
                        aria-label={`Enter ${field.label}`}
                      />
                      {field.min !== undefined && field.max !== undefined && (
                        <p className="text-xs text-gray-400 mt-1">
                          Range: {field.min} - {field.max}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Checkbox Field */}
                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="checkbox"
                        id={`prop-${field.key}`}
                        checked={currentValue === true || currentValue === 'true' || currentValue === 1 || currentValue === '1'}
                        onChange={(e) => handleCustomPropChange(field.key, e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor={`prop-${field.key}`} className="text-sm text-gray-700 font-medium">
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
                      className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono text-sm ${hasError ? 'border-red-500' : 'border-gray-200'
                        }`}
                      placeholder={field.default || `Enter ${field.label.toLowerCase()}`}
                      aria-label={`Enter ${field.label}`}
                    />
                  )}

                  {hasError && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <FaExclamationTriangle size={12} />
                      {typeof errors.custom_props === 'string' ? errors.custom_props : errors.custom_props?.[field.key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
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
        style={{ animationDuration: '200ms' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl">
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaEdit className="text-blue-500" size={18} />
              Edit Section
            </h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{section.section_key}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400">ID: {section.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50/50 px-2">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'basic'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white rounded-t-lg'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FaCog size={14} />
              Basic Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('data')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'data'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white rounded-t-lg'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FaDatabase size={14} />
              Section Data
              {hasData && (
                <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                  ✓
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="min-h-100 relative">
            {/* Basic Data Tab */}
            <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
              {renderBasicTab()}
            </div>

            {/* Section Data Tab */}
            <div className={activeTab === 'data' ? 'block' : 'hidden'}>
              <RenderDataTab
                section={section}
                hasData={hasData}
                onDataChange={setSectionData}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-7 py-2.5 rounded-xl text-white transition-all duration-200 flex items-center gap-2 font-medium ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SectionEditModal;
