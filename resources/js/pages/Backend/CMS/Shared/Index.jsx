// resources/js/pages/Backend/CMS/Shared/Index.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

import {
  MdEdit,
  MdExpandMore,
  MdExpandLess,
  MdRefresh,
  MdCheckCircle,
  MdErrorOutline,
  MdClose,
  MdOutlineInbox,
} from 'react-icons/md';
import {
  FaSpinner,
  FaRegAddressCard,
  FaBars,
  FaRegWindowMaximize,
  FaRegQuestionCircle,
  FaRegCalendarAlt,
  FaBookOpen,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import TopBar from '../../../../Shared/TopBar/TopBar';
import Navbar from '../../../../Shared/Navbar/Navbar';
import Footer from '../../../../Shared/Footer/Footer';
import FAQSection from '../../../../Sections/FAQSection/FAQSection';
import StoriesSection from '../../../../Sections/StoriesSection/StoriesSection';
import UpcomingEventsSection from '../../../../Sections/UpcomingEventsSection/UpcomingEventsSection';

import FaqEditor from './Modals/FaqEditor';
import TopBarEditor from './Modals/TopBarEditor';
import NavbarEditor from './Modals/NavbarEditor';
import FooterEditor from './Modals/FooterEditor';
import EventsEditor from './Modals/EventsEditor';
import StoriesEditor from './Modals/StoriesEditor';

// ============================================================
// CONFIGURATION
// ============================================================

const TONES = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  orange: 'bg-orange-50 text-orange-600 ring-orange-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
};

const TYPE_CONFIG = {
  topbar: {
    label: 'Top Bar',
    description: 'Contact info, language selector, social links',
    Icon: FaRegAddressCard,
    tone: 'blue',
    component: TopBar,
    editor: TopBarEditor,
    previewProps: (data) => ({ topBarData: data }),
  },
  navbar: {
    label: 'Navigation Bar',
    description: 'Logo, navigation links, CTA button',
    Icon: FaBars,
    tone: 'indigo',
    component: Navbar,
    editor: NavbarEditor,
    previewProps: (data) => ({ navbarData: data, storageUrl: '/storage/' }),
  },
  footer: {
    label: 'Footer',
    description: 'Logo, links, social, newsletter, copyright',
    Icon: FaRegWindowMaximize,
    tone: 'slate',
    component: Footer,
    editor: FooterEditor,
    previewProps: (data) => ({ footerData: data, storageUrl: '/storage/' }),
  },
  faq: {
    label: 'FAQ Section',
    description: 'Frequently asked questions with answers',
    Icon: FaRegQuestionCircle,
    tone: 'emerald',
    component: FAQSection,
    editor: FaqEditor,
    previewProps: (data) => ({ data }),
  },
  'upcoming-events': {
    label: 'Upcoming Events',
    description: 'Events listing with dates and descriptions',
    Icon: FaRegCalendarAlt,
    tone: 'orange',
    component: UpcomingEventsSection,
    editor: EventsEditor,
    previewProps: (data) => ({ data }),
  },
  stories: {
    label: 'Stories Section',
    description: 'Stories with images and descriptions',
    Icon: FaBookOpen,
    tone: 'violet',
    component: StoriesSection,
    editor: StoriesEditor,
    previewProps: (data) => ({ data }),
  },
};

// ============================================================
// COMPONENT
// ============================================================

export default function SharedData({ sharedData }) {
  const { flash } = usePage().props;

  // State---
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);

  // Helpers-
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
    const hasContent =
      hasData &&
      Object.values(parsed).some(
        (v) => v && (typeof v === 'string' ? v.trim() !== '' : true)
      );
    return { hasData, hasContent };
  };

  // Handlers
  const toggleSection = (type) => {
    setExpandedSection((prev) => (prev === type ? null : type));
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
    const reset = () => {
      setEditingItem(null);
      setFormData({});
      setIsUploading(false);
      setHasUnsavedChanges(false);
      setSavingSuccess(false);
    };

    if (!hasUnsavedChanges) return reset();

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
      if (result.isConfirmed) reset();
    });
  }, [hasUnsavedChanges]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && editingItem) closeEdit();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [editingItem, closeEdit]);

  // Submit--
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

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

          Swal.fire({
            icon: 'success',
            title: 'Saved!',
            text: 'Changes have been saved successfully.',
            timer: 1500,
            showConfirmButton: false,
          });

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
            html:
              Object.values(errors).flat().join('<br>') ||
              'Please check your input and try again.',
            confirmButtonColor: '#3b82f6',
          });
        },
      }
    );
  };

  // Form helpers
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

  // Flash messages
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

  // Derived-
  const processedSharedData =
    sharedData?.map((item) => ({
      ...item,
      parsedData: parseItemData(item),
      status: getItemStatus(item),
    })) || [];

  const editorConfig = editingItem ? TYPE_CONFIG[editingItem.type] : null;
  const EditorComponent = editorConfig?.editor;
  const disabled = loading || isUploading;

  // Render--
  return (
    <AuthenticatedLayout>
      <Head title="CMS - Shared Data" />

      <div className="mx-auto p-4 md:p-6">
        {/* Page header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Shared Data
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage all shared content across the site in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {processedSharedData.length} sections
            </span>
            <button
              type="button"
              onClick={() => router.reload({ only: ['sharedData'] })}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              title="Refresh"
              aria-label="Refresh"
            >
              <MdRefresh size={18} />
            </button>
          </div>
        </div>

        {/* Section list */}
        <div className="space-y-3">
          {processedSharedData.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
              <div className="mb-3 flex justify-center text-slate-300">
                <MdOutlineInbox size={48} />
              </div>
              <p className="font-medium text-slate-500">No shared data found</p>
              <p className="mt-1 text-sm text-slate-400">
                Check your database seeding
              </p>
            </div>
          )}

          {processedSharedData.map((item) => {
            const config = TYPE_CONFIG[item.type];
            if (!config) return null;

            const isExpanded = expandedSection === item.type;
            const { hasContent } = item.status;
            const tone = TONES[config.tone];

            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-white transition-all ${isExpanded
                    ? 'border-blue-200 shadow-md shadow-blue-100/50'
                    : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                  }`}
              >
                {/*
                  Header row — must be a <div role="button"> (not <button>)
                  because it contains inner <button> elements (Edit).
                  Nested <button> inside <button> is invalid HTML and breaks
                  React hydration.
                */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSection(item.type)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSection(item.type);
                    }
                  }}
                  aria-expanded={isExpanded}
                  className="flex w-full cursor-pointer items-center gap-4 p-4 text-left transition hover:bg-slate-50/60 focus:outline-none focus-visible:bg-slate-50 md:p-5"
                >
                  <div className={`shrink-0 rounded-xl p-3 ring-1 ${tone}`}>
                    <config.Icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-800">
                      {config.label}
                    </h3>
                    <p className="truncate text-xs text-slate-500">
                      {config.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {/* Status pill */}
                    <span
                      className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 sm:inline-flex ${item.is_active
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-slate-100 text-slate-500 ring-slate-200'
                        }`}
                    >
                      {item.is_active ? (
                        <>
                          <MdCheckCircle size={12} /> Active
                        </>
                      ) : (
                        <>
                          <MdErrorOutline size={12} /> Inactive
                        </>
                      )}
                    </span>

                    {/* Empty warning */}
                    {!hasContent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                        <MdErrorOutline size={12} /> Empty
                      </span>
                    )}

                    <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />

                    {/* Edit button — stopPropagation so it doesn't toggle row */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(item);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      className={`rounded-lg p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${hasContent
                          ? 'text-blue-600 hover:bg-blue-50'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                      title="Edit this section"
                      aria-label={`Edit ${config.label}`}
                    >
                      <MdEdit size={18} />
                    </button>

                    {/* Chevron — decorative, part of the row control */}
                    <span
                      className="rounded-lg p-1 text-slate-300"
                      aria-hidden="true"
                    >
                      {isExpanded ? (
                        <MdExpandLess size={22} />
                      ) : (
                        <MdExpandMore size={22} />
                      )}
                    </span>
                  </div>
                </div>

                {/* Preview panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 md:p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Live Preview
                      </span>
                      {!hasContent && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                          No data configured
                        </span>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      {config.component && hasContent ? (
                        <div className="p-2">
                          <config.component
                            {...config.previewProps(item.parsedData)}
                            key={item.id}
                          />
                        </div>
                      ) : (
                        <div className="px-6 py-12 text-center">
                          <div className="mb-3 flex justify-center text-slate-300">
                            <MdOutlineInbox size={40} />
                          </div>
                          <p className="font-medium text-slate-500">
                            Nothing to preview
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Click{' '}
                            <span className="font-medium text-blue-600">
                              Edit
                            </span>{' '}
                            to add content
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== EDIT MODAL ==================== */}
      {editingItem && EditorComponent && editorConfig && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div className="flex max-h-screen w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-4xl sm:rounded-2xl">
            {/* Sticky header */}
            <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
              <div
                className={`shrink-0 rounded-xl p-2.5 ring-1 ${TONES[editorConfig.tone]
                  }`}
              >
                <editorConfig.Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-slate-800">
                  Edit {editorConfig.label}
                </h2>
                <p className="truncate text-xs text-slate-500">
                  {editorConfig.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    <span className="hidden sm:inline">Unsaved</span>
                  </span>
                )}
                {savingSuccess && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    <MdCheckCircle size={12} /> Saved
                  </span>
                )}
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={loading}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                  aria-label="Close"
                >
                  <MdClose size={20} />
                </button>
              </div>
            </header>

            {/* Scrollable body */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <EditorComponent
                  formData={formData}
                  updateFormData={updateFormData}
                  addArrayItem={addArrayItem}
                  removeArrayItem={removeArrayItem}
                  isLoading={loading}
                  setIsLoading={setIsUploading}
                />
              </div>

              {/* Sticky footer inside form so submit works */}
              <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={disabled}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disabled}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" size={13} />
                      {isUploading ? 'Uploading…' : 'Saving…'}
                    </>
                  ) : (
                    <>
                      <MdCheckCircle size={15} /> Save changes
                    </>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}