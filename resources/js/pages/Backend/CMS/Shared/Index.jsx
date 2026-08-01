// resources/js/pages/Backend/CMS/Shared/Index.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

import {
  MdEdit,
  MdExpandMore,
  MdExpandLess,
  MdWarning,
  MdCheckCircle,
  MdCancel,
  MdRefresh,
} from 'react-icons/md';
import { FaSpinner } from 'react-icons/fa';
import Swal from 'sweetalert2';

import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import TopBar from '../../../../Shared/TopBar';
import Navbar from '../../../../Shared/Navbar';
import Footer from '../../../../Shared/Footer';
import FAQSection from '../../../../Sections/FAQSection/FAQSection';
import StoriesSection from '../../../../Sections/StoriesSection/StoriesSection';
import UpcomingEventsSection from '../../../../Sections/UpcomingEventsSection/UpcomingEventsSection';

import FaqEditor from './Modals/FaqEditor';
import TopBarEditor from './Modals/TopBarEditor';
import NavbarEditor from './Modals/NavbarEditor';
import FooterEditor from './Modals/FooterEditor';
import EventsEditor from './Modals/EventsEditor';
import StoriesEditor from './Modals/StoriesEditor';

// ============================================
// CONFIGURATION
// ============================================
const TYPE_CONFIG = {
  topbar: {
    label: 'Top Bar',
    icon: '📋',
    color: 'blue',
    description: 'Contact info, language selector, social links',
    component: TopBar,
    editor: TopBarEditor,
    previewProps: (data) => ({ topBarData: data }),
  },
  navbar: {
    label: 'Navigation Bar',
    icon: '🧭',
    color: 'indigo',
    description: 'Logo, navigation links, CTA button',
    component: Navbar,
    editor: NavbarEditor,
    previewProps: (data) => ({ navbarData: data, storageUrl: '/storage/' }),
  },
  footer: {
    label: 'Footer',
    icon: '📌',
    color: 'gray',
    description: 'Logo, links, social, newsletter, copyright',
    component: Footer,
    editor: FooterEditor,
    previewProps: (data) => ({ footerData: data, storageUrl: '/storage/' }),
  },
  faq: {
    label: 'FAQ Section',
    icon: '❓',
    color: 'green',
    description: 'Frequently asked questions with answers',
    component: FAQSection,
    editor: FaqEditor,
    previewProps: (data) => ({ data }),
  },
  'upcoming-events': {
    label: 'Upcoming Events',
    icon: '📅',
    color: 'orange',
    description: 'Events listing with dates and descriptions',
    component: UpcomingEventsSection,
    editor: EventsEditor,
    previewProps: (data) => ({ data }),
  },
  stories: {
    label: 'Stories Section',
    icon: '📖',
    color: 'purple',
    description: 'Stories with images and descriptions',
    component: StoriesSection,
    editor: StoriesEditor,
    previewProps: (data) => ({ data }),
  },
};

// ============================================
// COMPONENT
// ============================================
export default function SharedData({ sharedData }) {
  const { flash } = usePage().props;

  // State
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);

  // ============================================
  // HELPERS
  // ============================================
  const parseItemData = (item) => {
    if (!item) return null;
    if (item.data && typeof item.data === 'object' && !Array.isArray(item.data)) {
      return item.data;
    }
    if (item.data && typeof item.data === 'string') {
      try {
        return JSON.parse(item.data);
      } catch (e) {
        console.error('Failed to parse data:', e);
        return {};
      }
    }
    return {};
  };

  const getItemStatus = (item) => {
    const parsed = parseItemData(item);
    const hasData = parsed && Object.keys(parsed).length > 0;
    const hasContent = hasData && Object.values(parsed).some(v =>
      v && (typeof v === 'string' ? v.trim() !== '' : true)
    );
    return { hasData, hasContent };
  };

  // ============================================
  // HANDLERS
  // ============================================
  const toggleSection = (type) => {
    setExpandedSection(prev => prev === type ? null : type);
  };

  const openEdit = (item) => {
    const parsedData = parseItemData(item);
    setEditingItem({ ...item, parsedData });
    setFormData(JSON.parse(JSON.stringify(parsedData || {})));
    setIsUploading(false);
    setHasUnsavedChanges(false);
    setSavingSuccess(false);
  };

  const closeEdit = useCallback(() => {
    if (hasUnsavedChanges) {
      Swal.fire({
        title: 'Unsaved Changes',
        html: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Discard Changes',
        cancelButtonText: 'Keep Editing',
      }).then((result) => {
        if (result.isConfirmed) {
          setEditingItem(null);
          setFormData({});
          setIsUploading(false);
          setHasUnsavedChanges(false);
          setSavingSuccess(false);
        }
      });
    } else {
      setEditingItem(null);
      setFormData({});
      setIsUploading(false);
      setHasUnsavedChanges(false);
      setSavingSuccess(false);
    }
  }, [hasUnsavedChanges]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && editingItem) {
        closeEdit();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [editingItem, closeEdit]);

  // ============================================
  // SUBMIT
  // ============================================
  const handleSubmit = (e) => {
    e.preventDefault();

    if (isUploading) {
      Swal.fire({
        icon: 'warning',
        title: 'Upload in Progress',
        text: 'Please wait for the image upload to complete.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setLoading(true);

    router.put(
      route('backend.cms.shared.update', editingItem.id),
      {
        data: formData,
        is_active: editingItem.is_active,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setLoading(false);
          setHasUnsavedChanges(false);
          setSavingSuccess(true);

          // Show success and close
          Swal.fire({
            icon: 'success',
            title: 'Saved!',
            text: 'Changes have been saved successfully.',
            timer: 1500,
            showConfirmButton: false,
          });

          // Close modal after brief delay
          setTimeout(() => {
            setEditingItem(null);
            setFormData({});
            setIsUploading(false);
            setSavingSuccess(false);
            router.reload({ only: ['sharedData'] });
          }, 500);
        },
        onError: (errors) => {
          setLoading(false);
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            html: Object.values(errors).flat().join('<br>') || 'Please check your input and try again.',
            confirmButtonColor: '#3b82f6',
          });
        },
      }
    );
  };

  // ============================================
  // FORM HELPERS
  // ============================================
  const updateFormData = (path, value) => {
    setHasUnsavedChanges(true);
    setSavingSuccess(false);
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setFormData(newData);
  };

  const addArrayItem = (path, template = {}) => {
    setHasUnsavedChanges(true);
    setSavingSuccess(false);
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (!Array.isArray(current[lastKey])) current[lastKey] = [];
    current[lastKey].push({ ...template, _tempId: Date.now() });
    setFormData(newData);
  };

  const removeArrayItem = (path, index) => {
    setHasUnsavedChanges(true);
    setSavingSuccess(false);
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current[lastKey])) {
      current[lastKey].splice(index, 1);
    }
    setFormData(newData);
  };

  // ============================================
  // EFFECTS - Flash messages
  // ============================================
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: flash.success,
        timer: 3000,
        showConfirmButton: false,
      });
    }
    if (flash?.error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: flash.error,
        confirmButtonColor: '#3b82f6',
      });
    }
  }, [flash]);

  // ============================================
  // RENDER
  // ============================================
  const processedSharedData = sharedData?.map(item => ({
    ...item,
    parsedData: parseItemData(item),
    status: getItemStatus(item),
  })) || [];

  const EditorComponent = editingItem ? TYPE_CONFIG[editingItem.type]?.editor : null;
  const isUpdateDisabled = loading || isUploading;

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Shared Data" />

      <div className="p-4 md:p-6 mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-2 rounded-xl text-xl">
                🧩
              </span>
              Shared Data
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage all shared content across the site in one place
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {processedSharedData.length} sections
            </span>
            <button
              onClick={() => router.reload({ only: ['sharedData'] })}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <MdRefresh size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {processedSharedData.length > 0 ? (
            processedSharedData.map((item) => {
              const config = TYPE_CONFIG[item.type];
              if (!config) return null;

              const isExpanded = expandedSection === item.type;
              const { hasContent } = item.status;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-gray-50/50 transition"
                    onClick={() => toggleSection(item.type)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-3xl shrink-0">{config.icon}</div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {config.label}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {config.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${item.is_active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                      >
                        {item.is_active ? (
                          <span className="flex items-center gap-1">
                            <MdCheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <MdCancel size={12} /> Inactive
                          </span>
                        )}
                      </span>

                      {/* Data Status */}
                      {!hasContent && (
                        <span className="text-yellow-500 flex items-center gap-1 text-xs bg-yellow-50 px-2 py-1 rounded-full">
                          <MdWarning size={14} />
                          Empty
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(item);
                        }}
                        className={`p-2.5 rounded-xl transition ${hasContent
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        title="Edit this section"
                      >
                        <MdEdit size={18} />
                      </button>

                      <div className="text-gray-300">
                        {isExpanded ? (
                          <MdExpandLess size={24} />
                        ) : (
                          <MdExpandMore size={24} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 md:p-6 bg-gray-50/80">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                          🔍 Live Preview
                        </span>
                        {!hasContent && (
                          <span className="text-xs text-yellow-600 flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                            <MdWarning size={12} />
                            No data configured
                          </span>
                        )}
                      </div>

                      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        {config.component && hasContent ? (
                          <div className="p-2">
                            <config.component
                              {...config.previewProps(item.parsedData)}
                              key={item.id}
                            />
                          </div>
                        ) : (
                          <div className="p-12 text-center">
                            <div className="text-4xl mb-3">📭</div>
                            <p className="text-gray-400 font-medium">Nothing to preview</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Click <span className="text-blue-500">Edit</span> to add content
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500 font-medium">No shared data found</p>
              <p className="text-sm text-gray-400 mt-1">Check your database seeding</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          EDIT MODAL
          ============================================ */}
      {editingItem && EditorComponent && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{TYPE_CONFIG[editingItem.type]?.icon}</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit {TYPE_CONFIG[editingItem.type]?.label}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {TYPE_CONFIG[editingItem.type]?.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    Unsaved changes
                  </span>
                )}
                {savingSuccess && (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                    <MdCheckCircle size={14} /> Saved
                  </span>
                )}
                <button
                  onClick={closeEdit}
                  className="p-2 hover:bg-gray-200 rounded-xl transition text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <EditorComponent
                  formData={formData}
                  updateFormData={updateFormData}
                  addArrayItem={addArrayItem}
                  removeArrayItem={removeArrayItem}
                  isLoading={loading}
                  setIsLoading={setIsUploading}
                />
              </form>
            </div>

            {/* Footer Actions - Fixed */}
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/80 shrink-0">
              <button
                type="button"
                onClick={closeEdit}
                className="px-5 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
                disabled={isUpdateDisabled}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isUpdateDisabled}
                className={`px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition flex items-center gap-2 font-medium text-sm shadow-sm ${isUpdateDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" size={16} />
                    {isUploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <MdCheckCircle size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}