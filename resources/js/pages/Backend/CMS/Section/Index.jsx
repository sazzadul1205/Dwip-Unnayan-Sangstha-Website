// resources/js/pages/Backend/CMS/Section/Index.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';

// Hooks
import { useSectionHelpers } from './hooks/useSectionHelpers';

// Icons
import {
  FaPlus, FaTrash, FaExclamationTriangle, FaArrowLeft,
  FaSync, FaInfoCircle, FaCheckCircle,
  FaClock,
  FaToggleOff,
  FaHashtag,
} from 'react-icons/fa';
import { BsStack } from "react-icons/bs";

// Components
import SectionTable from './components/SectionTable';
import SectionFooter from './components/SectionFooter';
import AddSectionModal from './components/AddSectionModal';
import SectionEditModal from './components/SectionEditModal';

// Utils
import { getSectionStats } from './utils/sectionHelpers';
import { showErrorToast } from './utils/toastHelper';

// SweetAlert
import Swal from 'sweetalert2';

const Index = ({ page, sections: initialSections, trashedSections: initialTrashedSections, trashedCount: initialTrashedCount }) => {
  // Get flash messages from Inertia
  const { flash } = usePage().props;

  // ALL HOOKS CALLED AT TOP LEVEL IN SAME ORDER
  const {
    sections,
    expandedSections,
    previewSections,
    isReordering,
    isSaving,
    error: hookError,
    draggedIndex,
    dragOverIndex,
    toggleExpand,
    togglePreview,
    hasData,
    getDataSummary,
    canMove,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleMoveUp,
    handleMoveDown,
    editingSection,
    isEditModalOpen,
    handleEditClick,
    handleEditClose,
    handleEditSuccess,
  } = useSectionHelpers(initialSections, page?.id);

  // State hooks
  const [activeTab, setActiveTab] = useState('active');
  const [trashedCount] = useState(initialTrashedCount || 0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [trashedSections] = useState(initialTrashedSections || []);

  // Calculate statistics
  const stats = getSectionStats(sections);

  // Handle section deleted/restored - update trashed count
  const handleSectionChanged = useCallback(() => {
    router.reload({ only: ['sections', 'trashedSections', 'trashedCount'] });
  }, []);

  // Restore section handler
  const handleRestoreSection = useCallback((sectionId) => {
    Swal.fire({
      title: 'Restore Section?',
      html: `
        <div class="text-left">
          <p class="mb-2">You're about to restore this section from the trash.</p>
          <p class="text-sm text-gray-500">✅ The section will become active again.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '✅ Restore',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.post(route('backend.cms.sections.restore', sectionId), {}, {
          preserveScroll: true,
          onSuccess: () => {
            handleSectionChanged();
            Swal.fire({
              icon: 'success',
              title: 'Restored!',
              text: 'Section has been restored successfully.',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          onError: (errors) => {
            console.error('Restore error:', errors);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to restore section. Please try again.',
              confirmButtonColor: '#3b82f6',
            });
          },
        });
      }
    });
  }, [handleSectionChanged]);

  // Force delete section handler
  const handleForceDeleteSection = useCallback((sectionId, sectionName) => {
    Swal.fire({
      title: '⚠️ Permanently Delete?',
      html: `
        <div class="text-left">
          <p class="mb-2">You're about to permanently delete <strong>"${sectionName || 'this section'}"</strong>.</p>
          <p class="text-sm text-red-600 font-semibold">⚠️ This action CANNOT be undone!</p>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🗑️ Permanently Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('backend.cms.sections.force-delete', sectionId), {}, {
          preserveScroll: true,
          onSuccess: () => {
            handleSectionChanged();
            Swal.fire({
              icon: 'success',
              title: 'Deleted Permanently!',
              text: 'Section has been permanently removed.',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          onError: (errors) => {
            console.error('Force delete error:', errors);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete section. Please try again.',
              confirmButtonColor: '#3b82f6',
            });
          },
        });
      }
    });
  }, [handleSectionChanged]);

  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      // Toast will be shown by the component
    }
    if (flash?.error) {
      showErrorToast('Error', flash.error);
    }
  }, [flash]);

  // Check if page exists
  if (!page) {
    return (
      <AuthenticatedLayout>
        <Head title="Sections" />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700">Page Not Found</h2>
            <p className="text-red-600 mt-2">The requested page could not be found.</p>
            <Link
              href={route('backend.cms.pages.index')}
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Back to Pages
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Determine which sections to display
  const displaySections = activeTab === 'active' ? sections : trashedSections;

  return (
    <AuthenticatedLayout>
      <Head title={`Sections - ${page.name}`} />

      {/* MAIN CONTENT */}
      <div className="p-4 md:p-6">
        {/* ERROR DISPLAY */}
        {hookError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500 shrink-0" />
            {hookError}
          </div>
        )}

        {/* HEADER SECTION */}
        <div className="mb-8">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                  <BsStack className="text-white text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Page Sections
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Manage all sections for <strong className="text-gray-700">{page.name}</strong>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-mono">
                      {page.slug}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => router.reload({ only: ['sections', 'trashedSections', 'trashedCount'] })}
                className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                title="Refresh"
              >
                <FaSync className={isSaving ? 'animate-spin' : ''} size={15} />
              </button>
              <Link
                href={route('backend.cms.pages.index')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm hover:shadow-sm"
              >
                <FaArrowLeft size={13} />
                Back to Pages
              </Link>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] font-medium text-sm"
              >
                <FaPlus size={14} />
                Add Section
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                  <FaHashtag size={18} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
                  <p className="text-2xl font-bold text-green-600 mt-0.5">{stats.active}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                  <FaCheckCircle size={18} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inactive</p>
                  <p className="text-2xl font-bold text-gray-500 mt-0.5">{stats.inactive}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <FaToggleOff size={18} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trash</p>
                  <p className="text-2xl font-bold text-red-500 mt-0.5">{trashedCount}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trashedCount > 0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                  <FaTrash size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-5 md:px-6 py-3.5 text-sm font-medium transition relative ${activeTab === 'active'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <FaCheckCircle size={14} />
              Active Sections
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === 'active'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500'
                }`}>
                {sections.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('trashed')}
              className={`flex items-center gap-2 px-5 md:px-6 py-3.5 text-sm font-medium transition relative ${activeTab === 'trashed'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <FaTrash size={14} />
              Trash
              {trashedCount > 0 && (
                <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === 'trashed'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-500'
                  }`}>
                  {trashedCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'trashed' && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaClock size={14} />
                <span>Sections in trash can be restored or permanently deleted</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION TABLE */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <SectionTable
            hasData={hasData}
            canMove={canMove}
            isSaving={isSaving}
            handleDrop={handleDrop}
            sections={displaySections}
            isReordering={isReordering}
            draggedIndex={draggedIndex}
            toggleExpand={toggleExpand}
            handleMoveUp={handleMoveUp}
            onEditClick={handleEditClick}
            togglePreview={togglePreview}
            handleDragEnd={handleDragEnd}
            dragOverIndex={dragOverIndex}
            getDataSummary={getDataSummary}
            handleMoveDown={handleMoveDown}
            handleDragOver={handleDragOver}
            previewSections={previewSections}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragLeave={handleDragLeave}
            expandedSections={expandedSections}
            showTrashed={activeTab === 'trashed'}
            onSectionDeleted={handleSectionChanged}
            onRestore={activeTab === 'trashed' ? handleRestoreSection : null}
            onForceDelete={activeTab === 'trashed' ? handleForceDeleteSection : null}
          />
        </div>

        {/* FOOTER */}
        <SectionFooter
          sections={displaySections}
          hasData={hasData}
          showTrashed={activeTab === 'trashed'}
        />

        {/* HELP TIPS (shown when trash is empty) */}
        {activeTab === 'trashed' && displaySections.length === 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <FaInfoCircle size={16} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-800">Trash is Empty</h4>
                <p className="text-xs text-blue-700 mt-1">
                  When you delete sections, they will appear here. You can restore them or permanently delete them.
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1">
                  <li>• <strong>Restore</strong> - Recovers the section and its data</li>
                  <li>• <strong>Permanently Delete</strong> - Removes the section permanently. This cannot be undone!</li>
                  <li>• Fixed sections cannot be deleted</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* MODALS */}
        {/*  Edit Section */}
        <SectionEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditClose}
          section={editingSection}
          pageId={page.id}
          onSuccess={handleEditSuccess}
        />

        {/* Add Section */}
        <AddSectionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          pageId={page.id}
          onSuccess={handleEditSuccess}
        />
      </div>
    </AuthenticatedLayout>
  );
};

export default Index;