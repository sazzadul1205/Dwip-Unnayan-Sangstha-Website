 
// resources/js/pages/Backend/CMS/Section/Trashed.jsx

/**
 * Trashed - Page showing deleted sections
 * Features:
 * - List all trashed sections
 * - Restore sections
 * - Force delete sections
 * - Back to sections link
 * - Statistics for trashed items
 */

// Reacts
import React, { useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';

// Layout
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';

// Hooks
import { useSectionHelpers } from './hooks/useSectionHelpers';

// Components
import SectionTable from './components/SectionTable';
import SectionFooter from './components/SectionFooter';

const Trashed = ({ page, sections: initialSections }) => {
  const {
    sections,
    expandedSections,
    previewSections,
    isReordering,
    isSaving,
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
    handleEditClick,
  } = useSectionHelpers(initialSections, page.id);

  // Refresh page after delete/restore
  const handleSectionDeleted = useCallback(() => {
    // Reload the page to reflect changes
    router.reload();
  }, []);

  return (
    <AuthenticatedLayout>
      <Head title={`Trash - ${page.name}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href={route('backend.cms.sections.page.sections', { pageId: page.id })}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
                <span>Back to Sections</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Trash - {page.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {sections.length} section{sections.length > 1 ? 's' : ''} in trash
              {sections.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  (Deleted sections can be restored or permanently deleted)
                </span>
              )}
            </p>
          </div>
          <div>
            <Link
              href={route('backend.cms.sections.page.sections', { pageId: page.id })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ← Back to Sections
            </Link>
          </div>
        </div>

        {/* Main Table */}
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
            showTrashed={true}
          />
        </div>

        {/* Footer with Summary */}
        <SectionFooter sections={sections} hasData={hasData} />

        {/* Info Box - Helpful Tips */}
        {sections.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  💡
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-800">Trash Management Tips</h4>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• <strong>Restore</strong> - Recovers the section and its data</li>
                  <li>• <strong>Permanently Delete</strong> - Removes the section and all associated data. This action cannot be undone!</li>
                  <li>• Sections in trash do not appear on the frontend</li>
                  <li>• Fixed sections cannot be deleted or permanently removed</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default Trashed;