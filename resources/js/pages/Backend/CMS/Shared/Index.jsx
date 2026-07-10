/* eslint-disable no-undef */
// resources/js/pages/Backend/CMS/Shared/Index.jsx

// React
import { useState, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

// Icons
import { FaEdit } from 'react-icons/fa';
import { FaSpinner, FaGlobe, FaChevronDown, FaChevronUp, FaExclamationTriangle } from 'react-icons/fa6';

// SweetAlert
import Swal from 'sweetalert2';

// Layout
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';

// Shared
import TopBar from '../../../../Shared/TopBar';
import Navbar from '../../../../Shared/Navbar';
import Footer from '../../../../Shared/Footer';

// Sections
import FAQSection from '../../../../Sections/FAQSection/FAQSection';
import StoriesSection from '../../../../Sections/StoriesSection/StoriesSection';
import UpcomingEventsSection from '../../../../Sections/UpcomingEventsSection/UpcomingEventsSection';

// Import Modal Editors
import FaqEditor from './Modals/FaqEditor';
import TopBarEditor from './Modals/TopBarEditor';
import NavbarEditor from './Modals/NavbarEditor';
import FooterEditor from './Modals/FooterEditor';
import EventsEditor from './Modals/EventsEditor';
import StoriesEditor from './Modals/StoriesEditor';

export default function SharedData({ sharedData }) {
  // ============================================
  // PROPS
  // ============================================
  const { flash } = usePage().props;

  // ============================================
  // STATE
  // ============================================
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ============================================
  // CONFIG
  // ============================================
  const typeConfig = {
    topbar: {
      label: 'Top Bar',
      icon: <FaGlobe />,
      description: 'Contact info, language selector, social links',
      component: TopBar,
      editor: TopBarEditor,
      preview: true,
      previewProps: (data) => ({ topBarData: data })
    },
    navbar: {
      label: 'Navigation Bar',
      icon: <FaGlobe />,
      description: 'Logo, nav links, CTA button',
      component: Navbar,
      editor: NavbarEditor,
      preview: true,
      previewProps: (data) => ({ navbarData: data, storageUrl: '/storage/' })
    },
    footer: {
      label: 'Footer',
      icon: <FaGlobe />,
      description: 'Logo, links, social, newsletter, copyright',
      component: Footer,
      editor: FooterEditor,
      preview: true,
      previewProps: (data) => ({ footerData: data, storageUrl: '/storage/' })
    },
    faq: {
      label: 'FAQ Section',
      icon: <FaGlobe />,
      description: 'Frequently asked questions with answers',
      component: FAQSection,
      editor: FaqEditor,
      preview: true,
      previewProps: (data) => ({ data })
    },
    'upcoming-events': {
      label: 'Upcoming Events',
      icon: <FaGlobe />,
      description: 'Events listing with dates and descriptions',
      component: UpcomingEventsSection,
      editor: EventsEditor,
      preview: true,
      previewProps: (data) => ({ data })
    },
    stories: {
      label: 'Stories Section',
      icon: <FaGlobe />,
      description: 'Stories with images and descriptions',
      component: StoriesSection,
      editor: StoriesEditor,
      preview: true,
      previewProps: (data) => ({ data })
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const toggleSection = (type) => {
    setExpandedSection(prev => prev === type ? null : type);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData(JSON.parse(JSON.stringify(item.data || {})));
    setIsUploading(false);
    setHasUnsavedChanges(false);
  };

  const closeEdit = useCallback(() => {
    if (hasUnsavedChanges) {
      Swal.fire({
        title: 'Unsaved Changes',
        text: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, close without saving',
        cancelButtonText: 'Keep editing',
      }).then((result) => {
        if (result.isConfirmed) {
          setEditingItem(null);
          setFormData({});
          setIsUploading(false);
          setHasUnsavedChanges(false);
        }
      });
    } else {
      setEditingItem(null);
      setFormData({});
      setIsUploading(false);
      setHasUnsavedChanges(false);
    }
  }, [hasUnsavedChanges]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && editingItem) {
        closeEdit();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [editingItem, closeEdit]);

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

    router.put(route('backend.cms.shared.update', editingItem.id), {
      data: formData,
      is_active: editingItem.is_active,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setLoading(false);
        setHasUnsavedChanges(false);
        closeEdit();

        // Refresh the page data
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Changes saved successfully.',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      onError: (errors) => {
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: Object.values(errors).flat().join(' ') || 'Please check your input and try again.',
          confirmButtonColor: '#3b82f6',
        });
      },
    });
  };

  // ============================================
  // FORM DATA UPDATE HELPERS
  // ============================================
  const updateFormData = (path, value) => {
    setHasUnsavedChanges(true);
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
    const keys = path.split('.');
    const newData = { ...formData };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (!Array.isArray(current[lastKey])) current[lastKey] = [];
    current[lastKey].push({ ...template, id: Date.now() });
    setFormData(newData);
  };

  const removeArrayItem = (path, index) => {
    setHasUnsavedChanges(true);
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
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (flash?.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: flash.success,
        timer: 3000,
        showConfirmButton: false
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
  const EditorComponent = editingItem ? typeConfig[editingItem.type]?.editor : null;
  const isUpdateDisabled = loading || isUploading;

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Shared Data" />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shared Data</h1>
            <p className="text-sm text-gray-500">
              Manage shared content across the site (TopBar, Navbar, Footer, FAQ, Events, Stories)
            </p>
          </div>
          <div className="text-xs text-gray-400">
            {sharedData?.length || 0} items total
          </div>
        </div>

        {/* List of Shared Data Types */}
        <div className="space-y-4">
          {sharedData?.length > 0 ? (
            sharedData.map((item) => {
              const config = typeConfig[item.type];
              if (!config) return null;

              const isExpanded = expandedSection === item.type;
              const hasData = item.data && Object.keys(item.data).length > 0;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-all">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleSection(item.type)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-blue-600 text-xl shrink-0">{config.icon}</div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">{config.label}</h3>
                        <p className="text-xs text-gray-500 truncate">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(item);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit this item"
                      >
                        <FaEdit size={16} />
                      </button>
                      {isExpanded ? (
                        <FaChevronUp className="text-gray-400" />
                      ) : (
                        <FaChevronDown className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Preview Area */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50 w-full">
                      <div className="text-xs text-gray-400 mb-2 flex justify-between">
                        <span>Preview:</span>
                        {!hasData && (
                          <span className="text-yellow-500 flex items-center gap-1">
                            <FaExclamationTriangle size={12} />
                            No data configured
                          </span>
                        )}
                      </div>
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden w-full">
                        {config.component && config.preview && hasData ? (
                          <config.component
                            {...config.previewProps(item.data)}
                            key={item.id} // Force re-render on data change
                          />
                        ) : (
                          <div className="p-8 text-center text-gray-400">
                            <p className="text-sm">No preview available</p>
                            <p className="text-xs mt-1">Click Edit to configure this section</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No shared data items found.</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          EDIT MODAL - Dynamic
          ============================================ */}
      {editingItem && EditorComponent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold">
                  Edit {typeConfig[editingItem.type]?.label || editingItem.type}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {typeConfig[editingItem.type]?.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasUnsavedChanges && (
                  <span className="text-xs text-yellow-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    Unsaved
                  </span>
                )}
                <button
                  onClick={closeEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <EditorComponent
                formData={formData}
                updateFormData={updateFormData}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                isLoading={loading}
                setIsLoading={setIsUploading}
              />

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white py-4">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  disabled={isUpdateDisabled}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdateDisabled}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 ${isUpdateDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" size={16} />
                      {isUploading ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isUploading ? 'Uploading...' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}