/* eslint-disable no-undef */
// resources/js/pages/Backend/CMS/Section/Index.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';

// Hooks
import { useSectionHelpers } from './hooks/useSectionHelpers';

// Icons
import { FaPlus, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

// Components
import SectionTable from './components/SectionTable';
import SectionFooter from './components/SectionFooter';
import SectionHeader from './components/SectionHeader';
import AddSectionModal from './components/AddSectionModal';
import SectionEditModal from './components/SectionEditModal';

// Utils
import { getSectionStats } from './utils/sectionHelpers';
import { showErrorToast } from './utils/toastHelper';

const Index = ({ page, sections: initialSections }) => {
  // Get flash messages from Inertia
  const { flash } = usePage().props;

  // ALL HOOKS CALLED AT TOP LEVEL IN SAME ORDER
  // Use custom hook for section management
  const {
    sections,
    expandedSections,
    previewSections,
    isReordering,
    dragError,
    isSaving,
    error: hookError,
    toggleExpand,
    togglePreview,
    hasData,
    getDataSummary,
    canMove,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleMoveUp,
    handleMoveDown,
    editingSection,
    isEditModalOpen,
    handleEditClick,
    handleEditClose,
    handleEditSuccess,
  } = useSectionHelpers(initialSections, page?.id);

  // State hooks - all called at top level
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [trashedCount, setTrashedCount] = useState(0);
  const [fetchError, setFetchError] = useState(null);

  // Calculate statistics for header
  const stats = getSectionStats(sections);

  // Fetch trashed count function - use useCallback
  const fetchTrashedCount = useCallback(async () => {
    if (!page?.id) return;

    try {
      const response = await fetch(route('backend.cms.sections.trashed-count', { pageId: page.id }));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTrashedCount(data.count || 0);
      setFetchError(null);
    } catch (error) {
      console.error('Error fetching trashed count:', error);
      setFetchError('Failed to load trash count');
      setTrashedCount(0);
    }
  }, [page?.id]);

  // Effect hooks - all called at top level
  useEffect(() => {
    fetchTrashedCount();
  }, [fetchTrashedCount]);

  // Handle flash messages from server
  useEffect(() => {
    if (flash?.success) {
      // Toast will be shown by the component
    }
    if (flash?.error) {
      showErrorToast('Error', flash.error);
    }
  }, [flash]);

  // Handle section deleted/restored
  const handleSectionDeleted = useCallback(() => {
    fetchTrashedCount();
    window.location.reload();
  }, [fetchTrashedCount]);

  // Check if page exists - this is a conditional render, not a hook
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
              href={route('backend.cms.pages')}
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Back to Pages
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Sections - ${page.name}`} />

      <div className="p-6">
        {/* Error Display */}
        {(hookError || fetchError) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <FaExclamationTriangle className="text-red-500" />
            {hookError || fetchError}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <SectionHeader
              page={page}
              sections={sections}
              stats={stats}
              isSaving={isSaving}
              dragError={dragError}
            />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={route('backend.cms.sections.trashed', { pageId: page.id })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-200"
            >
              <FaTrash size={14} />
              Trash
              {trashedCount > 0 && (
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full min-w-5 text-center">
                  {trashedCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FaPlus size={14} />
              Add New Section
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <SectionTable
            sections={sections}
            expandedSections={expandedSections}
            previewSections={previewSections}
            isReordering={isReordering}
            isSaving={isSaving}
            hasData={hasData}
            getDataSummary={getDataSummary}
            canMove={canMove}
            toggleExpand={toggleExpand}
            togglePreview={togglePreview}
            handleMoveUp={handleMoveUp}
            handleMoveDown={handleMoveDown}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            onEditClick={handleEditClick}
            onSectionDeleted={handleSectionDeleted}
            showTrashed={false}
          />
        </div>

        <SectionFooter sections={sections} hasData={hasData} />

        <SectionEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditClose}
          section={editingSection}
          pageId={page.id}
          onSuccess={handleEditSuccess}
        />

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